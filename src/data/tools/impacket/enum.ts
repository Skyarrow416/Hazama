import type { Tool } from '../../../types';
import { buildImpacketAuth, buildImpacketDomainAuth, v } from '../../../lib/auth';

/**
 * impacket 枚举/信息收集类工具
 * 参数定义来源为本机 impacket v0.14.0.dev0 --help 与官方 examples。
 * (https://github.com/fortra/impacket/tree/master/examples)
 *
 * caps 与 --help 逐项核对结果:
 * - lookupsid:   无 -dc-ip / -aesKey; 有 -target-ip / -k / -no-pass / -hashes
 * - samrdump:    全部支持 (-dc-ip / -target-ip / -k / -no-pass / -aesKey / -hashes)
 * - rpcdump:     无 -dc-ip / -k / -no-pass / -aesKey; 仅密码 / -hashes; 有 -target-ip
 * - rpcmap:      无标准 target 认证; 使用 stringbinding + -auth-rpc / -auth-transport 等
 * - GetADUsers / GetADComputers / findDelegation / netview: 域身份类 target
 * - net:         主机 target + 子命令 {user,computer,localgroup,group}
 * - DumpNTLMInfo / getArch / mssqlinstance: 无认证
 * - machine_role: 全部支持
 */
export const impacketEnumTools: Tool[] = [
  {
    id: 'lookupsid',
    name: 'impacket-lookupsid',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/lookupsid.py',
    description: '通过 LSA LookupSids 暴力枚举目标 SID，列出本地/域用户与组 (RID 爆破)',
    commands: [
      {
        id: 'lookupsid-enum',
        title: 'SID 枚举 (RID 爆破)',
        description: '默认从 RID 500 开始枚举到 4000，可获取用户名/组名并推算域 SID',
        build: (p) => `impacket-lookupsid ${buildImpacketAuth(p, { dcIp: false, aesKey: false, targetIp: true })}`,
        usage: `target: [[domain/]username[:password]@]<目标主机名或IP>，可尝试匿名空会话 (空用户名)
maxRid: 可选位置参数，枚举的最大 RID (默认 4000)
-target-ip: 目标为 NetBIOS 名无法解析时指定目标 IP
-port: 指定 SMB 连接端口
-domain-sids: 枚举域 SID (请求可能被转发到 DC)
-hashes: NTLM 哈希认证，格式 LMHASH:NTHASH
-no-pass: 不询问密码 (配合 smbrelayx 中继场景)
-k: Kerberos 认证，从 KRB5CCNAME 读取票据
注意: 该工具无 -dc-ip / -aesKey 参数`,
        example: 'impacket-lookupsid corp.local/svc-reader:Passw0rd@10.10.10.10',
      },
      {
        id: 'lookupsid-maxrid',
        title: '自定义最大 RID',
        description: 'maxRid 为位置参数，调大可覆盖 RID 大于 4000 的账户',
        build: (p) => `impacket-lookupsid ${buildImpacketAuth(p, { dcIp: false, aesKey: false, targetIp: true })} 20000`,
        usage: `target: [[domain/]username[:password]@]<目标主机名或IP>
maxRid: 位置参数，跟在 target 之后，指定枚举的最大 RID (默认 4000)
其他认证参数 (-hashes / -no-pass / -k) 与 -target-ip / -port 同基础用法`,
        example: 'impacket-lookupsid corp.local/svc-reader:Passw0rd@10.10.10.10 20000',
      },
      {
        id: 'lookupsid-domain-sids',
        title: '枚举域 SID',
        description: '-domain-sids 直接枚举域 SID，请求可能被转发到域控',
        build: (p) => `impacket-lookupsid ${buildImpacketAuth(p, { dcIp: false, aesKey: false, targetIp: true })} -domain-sids`,
        usage: `-domain-sids: 枚举域 SID (请求可能被转发到域控 DC)
target: [[domain/]username[:password]@]<目标主机名或IP>
适合目标是域成员机但想直接获取域级别用户/组信息的场景
认证参数支持 -hashes / -no-pass / -k，无 -dc-ip / -aesKey`,
        example: 'impacket-lookupsid corp.local/svc-reader:Passw0rd@10.10.10.10 -domain-sids',
      },
    ],
  },
  {
    id: 'samrdump',
    name: 'impacket-samrdump',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/samrdump.py',
    description: '通过 SAMR 接口导出目标系统的用户列表',
    commands: [
      {
        id: 'samrdump-users',
        title: '枚举目标用户列表',
        description: '下载目标系统的本地/域用户列表，含 RID 与描述信息',
        build: (p) => `impacket-samrdump ${buildImpacketAuth(p, { targetIp: true })}`,
        usage: `target: [[domain/]username[:password]@]<目标主机名或IP>
-dc-ip: 指定域控 IP，省略时使用 target 中的域部分 (FQDN)
-target-ip: 目标为 NetBIOS 名无法解析时指定目标 IP
-port: 指定 SMB 连接端口
-csv: 以 CSV 格式输出
-hashes: NTLM 哈希认证，格式 LMHASH:NTHASH
-no-pass: 不询问密码 (配合 -k)
-k: Kerberos 认证，从 KRB5CCNAME 读取票据
-aesKey: 使用 AES 密钥 (128/256 位) 做 Kerberos 认证`,
        example: 'impacket-samrdump corp.local/svc-reader:Passw0rd@10.10.10.10',
      },
      {
        id: 'samrdump-csv',
        title: 'CSV 格式输出',
        description: '-csv 便于导出后做二次处理或导入其他工具',
        build: (p) => `impacket-samrdump ${buildImpacketAuth(p, { targetIp: true })} -csv`,
        usage: `-csv: 以 CSV 格式输出用户列表
其余参数与基础枚举一致: target 位置参数 + -dc-ip / -target-ip / -port
认证支持密码 / -hashes / -k -no-pass / -aesKey`,
        example: 'impacket-samrdump corp.local/svc-reader:Passw0rd@10.10.10.10 -csv',
      },
    ],
  },
  {
    id: 'rpcdump',
    name: 'impacket-rpcdump',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/rpcdump.py',
    description: '通过 epmapper 导出目标注册的 RPC 端点信息',
    commands: [
      {
        id: 'rpcdump-endpoints',
        title: '枚举 RPC 端点',
        description: '列出目标 Endpoint Mapper 上注册的 RPC 接口与绑定字符串',
        build: (p) => `impacket-rpcdump ${buildImpacketAuth(p, { dcIp: false, kerberos: false, aesKey: false, targetIp: true })}`,
        usage: `target: [[domain/]username[:password]@]<目标主机名或IP>
-port: 指定 RPC Endpoint Mapper 端口 (默认 135)
-target-ip: 目标为 NetBIOS 名无法解析时指定目标 IP
-hashes: NTLM 哈希认证，格式 LMHASH:NTHASH
注意: 该工具没有任何 Kerberos 参数 (无 -k / -no-pass / -aesKey)，也没有 -dc-ip
可用于发现目标上监听的 MSRPC 接口 (如 spoolss / RceP / even6 等)`,
        example: 'impacket-rpcdump corp.local/svc-reader:Passw0rd@10.10.10.10',
      },
    ],
  },
  {
    id: 'rpcmap',
    name: 'impacket-rpcmap',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/rpcmap.py',
    description: '枚举目标上监听的 MSRPC 接口，可暴力枚举 UUID/opnum/版本',
    commands: [
      {
        id: 'rpcmap-scan',
        title: '枚举 MSRPC 接口',
        description: '通过 ncacn_ip_tcp 字符串绑定连接 135 端口，列出可达 RPC 接口 UUID',
        build: (p) => `impacket-rpcmap 'ncacn_ip_tcp:${v(p.targetIP || p.targetHost, 'TARGET')}[135]'`,
        usage: `stringbinding: 位置参数，MSRPC 字符串绑定，常见形式:
  ncacn_ip_tcp:<IP>[135]              TCP 直连 epmapper
  ncacn_np:<IP>[\\pipe\\spoolss]       命名管道 (走 SMB)
  ncacn_http:<IP>[593]                RPC over HTTP
-brute-uuids: 即使 MGMT 接口可用也暴力枚举 UUID
-brute-opnums: 对发现的 UUID 暴力枚举 opnum (配合 -opnum-max，默认 0-64)
-brute-versions: 暴力枚举主版本号 (配合 -version-max，默认 0-64)
-auth-level: MS-RPCE 认证级别 1-6，默认 6 (PKT_PRIVACY)
-uuid: 只测试指定 UUID
-auth-rpc / -auth-transport: RPC 层 / 传输层凭据，格式 [domain/]username[:password]
-hashes-rpc / -hashes-transport: 对应层级的 NTLM 哈希认证
-no-pass: 不询问密码`,
        example: "impacket-rpcmap 'ncacn_ip_tcp:10.10.10.10[135]'",
      },
      {
        id: 'rpcmap-auth-brute',
        title: '带认证暴力枚举 opnum',
        description: '通过命名管道认证后暴力枚举接口 UUID 与 opnum，挖掘可调用的 RPC 方法',
        build: (p) => `impacket-rpcmap -brute-uuids -brute-opnums -auth-rpc ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')}:${v(p.password, 'PASSWORD')} 'ncacn_np:${v(p.targetIP || p.targetHost, 'TARGET')}[\\pipe\\spoolss]'`,
        usage: `ncacn_np 走 SMB 命名管道，需要传输层/RPC 层认证
-auth-rpc: RPC 层凭据 [domain/]username[:password]
-brute-uuids: 暴力枚举 UUID
-brute-opnums: 暴力枚举每个 UUID 的 opnum，-opnum-max 控制范围 (默认 64)
-hashes-rpc / -hashes-transport: 使用 NTLM 哈希代替密码
-target-ip: ncacn_np 场景下目标名无法解析时指定 IP`,
        example: "impacket-rpcmap -brute-uuids -brute-opnums -auth-rpc corp.local/svc-reader:Passw0rd 'ncacn_np:10.10.10.10[\\pipe\\spoolss]'",
      },
    ],
  },
  {
    id: 'GetADUsers',
    name: 'impacket-GetADUsers',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/GetADUsers.py',
    description: '通过 LDAP 查询域用户数据 (默认只显示有效账户)',
    commands: [
      {
        id: 'GetADUsers-all',
        title: '枚举全部域用户',
        description: '-all 包含无邮箱的账户与已禁用账户',
        build: (p) => `impacket-GetADUsers ${buildImpacketDomainAuth(p)} -all`,
        usage: `target: domain[/username[:password]]，域身份而非主机
-all: 返回全部用户，包含无邮箱地址和已禁用的账户
-dc-ip: 指定域控 IP，省略时使用 target 中的域部分 (FQDN)
-dc-host: 指定域控主机名，省略时使用 target 中的域部分
-hashes: NTLM 哈希认证，格式 LMHASH:NTHASH
-no-pass: 不询问密码 (配合 -k)
-k: Kerberos 认证，从 KRB5CCNAME 读取票据
-aesKey: 使用 AES 密钥 (128/256 位) 做 Kerberos 认证`,
        example: 'impacket-GetADUsers corp.local/svc-reader:Passw0rd -all -dc-ip 10.10.10.10',
      },
      {
        id: 'GetADUsers-user',
        title: '查询指定用户',
        description: '-user 只查询单个用户的数据，配合 -all 可查已禁用账户',
        build: (p) => `impacket-GetADUsers ${buildImpacketDomainAuth(p)} -user ${v('', 'TARGET_USER')}`,
        usage: `-user: 只请求指定用户的数据
配合 -all 使用时，即使该账户被禁用也会返回信息
target 为域身份 domain[/username[:password]]
连接与认证参数: -dc-ip / -dc-host / -hashes / -no-pass / -k / -aesKey`,
        example: 'impacket-GetADUsers corp.local/svc-reader:Passw0rd -user administrator -dc-ip 10.10.10.10',
      },
    ],
  },
  {
    id: 'GetADComputers',
    name: 'impacket-GetADComputers',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/GetADComputers.py',
    description: '通过 LDAP 查询域内计算机账户数据',
    commands: [
      {
        id: 'GetADComputers-list',
        title: '枚举域计算机',
        description: '列出域内所有计算机对象的 dNSHostName、操作系统等属性',
        build: (p) => `impacket-GetADComputers ${buildImpacketDomainAuth(p)}`,
        usage: `target: domain[/username[:password]]，域身份而非主机
-resolveIP: 尝试通过 DC 上的 nslookup 解析计算机的 IP 地址
-dc-ip: 指定域控 IP，省略时使用 target 中的域部分 (FQDN)
-dc-host: 指定域控主机名，省略时使用 target 中的域部分
-hashes: NTLM 哈希认证，格式 LMHASH:NTHASH
-no-pass: 不询问密码 (配合 -k)
-k: Kerberos 认证，从 KRB5CCNAME 读取票据
-aesKey: 使用 AES 密钥 (128/256 位) 做 Kerberos 认证`,
        example: 'impacket-GetADComputers corp.local/svc-reader:Passw0rd -dc-ip 10.10.10.10',
      },
      {
        id: 'GetADComputers-resolve',
        title: '枚举并解析 IP',
        description: '-resolveIP 通过 DC 执行 nslookup，直接得到计算机名到 IP 的映射',
        build: (p) => `impacket-GetADComputers ${buildImpacketDomainAuth(p)} -resolveIP`,
        usage: `-resolveIP: 在 DC 上执行 nslookup，尝试解析每台计算机的 IP
-target-domain 不存在于本工具; 连接参数为 -dc-ip / -dc-host
认证支持密码 / -hashes / -k -no-pass / -aesKey`,
        example: 'impacket-GetADComputers corp.local/svc-reader:Passw0rd -resolveIP -dc-ip 10.10.10.10',
      },
    ],
  },
  {
    id: 'findDelegation',
    name: 'impacket-findDelegation',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/findDelegation.py',
    description: '查询域内 Kerberos 委派关系 (非约束/约束/基于资源的约束委派)',
    commands: [
      {
        id: 'findDelegation-all',
        title: '枚举域内委派关系',
        description: '列出所有带委派配置的账户，关注 Unconstrained / Constrained w/ Protocol Transition',
        build: (p) => `impacket-findDelegation ${buildImpacketDomainAuth(p)}`,
        usage: `target: domain[/username[:password]]，域身份而非主机
-user: 只查询指定用户的委派配置
-disabled: 同时查询已禁用用户的委派
-target-domain: 查询与凭据所在域不同的目标域 (可跨信任获取委派信息)
-dc-ip: 指定域控 IP (指定 -target-domain 时该参数被忽略)
-dc-host: 指定域控主机名
-hashes: NTLM 哈希认证，格式 LMHASH:NTHASH
-no-pass: 不询问密码 (配合 -k)
-k: Kerberos 认证，从 KRB5CCNAME 读取票据
-aesKey: 使用 AES 密钥 (128/256 位) 做 Kerberos 认证`,
        example: 'impacket-findDelegation corp.local/svc-reader:Passw0rd -dc-ip 10.10.10.10',
      },
      {
        id: 'findDelegation-target-domain',
        title: '跨信任查询目标域委派',
        description: '-target-domain 查询受信任域的委派配置，-dc-ip 此时被忽略',
        build: (p) => `impacket-findDelegation ${buildImpacketDomainAuth(p)} -target-domain ${v('', 'TARGET_DOMAIN')}`,
        usage: `-target-domain: 当要查询的域与凭据所在域不同时指定，可跨域信任检索委派信息
指定 -target-domain 后 -dc-ip 会被忽略
其余参数: -user / -disabled 过滤结果; 认证同基础用法`,
        example: 'impacket-findDelegation corp.local/svc-reader:Passw0rd -target-domain child.corp.local',
      },
    ],
  },
  {
    id: 'netview',
    name: 'impacket-netview',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/netview.py',
    description: '枚举域内主机上登录的会话与已登录用户 (类似 Powerview 的 netview)',
    commands: [
      {
        id: 'netview-domain',
        title: '全域名模式枚举会话',
        description: '不指定 -target 时遍历整个域的主机，探测登录会话',
        build: (p) => `impacket-netview ${buildImpacketDomainAuth(p)}`,
        usage: `identity: [domain/]username[:password]，位置参数
-target: 只查询指定目标系统; 不指定则为域名模式，自动遍历域内主机
-targets: 目标列表文件 (每行一个)，替代 -target
-noloop: 第一轮探测后即停止
-delay: 每批探测之间的延迟秒数 (默认 10)
-max-connections: 最大并发连接数 (默认 1000)
-user / -users: 按用户或用户列表文件过滤输出
-dc-ip: 指定域控 IP
-hashes: NTLM 哈希认证，格式 LMHASH:NTHASH
-no-pass / -k / -aesKey: Kerberos 相关认证`,
        example: 'impacket-netview corp.local/svc-reader:Passw0rd -dc-ip 10.10.10.10',
      },
      {
        id: 'netview-targets',
        title: '批量目标 + 用户过滤',
        description: '-targets 指定主机列表文件，-user 只关注特定高价值用户的会话',
        build: (p) => `impacket-netview ${buildImpacketDomainAuth(p)} -targets ${v('', 'TARGETS.txt')} -user ${v('', 'FILTER_USER')}`,
        usage: `-targets: 目标系统列表文件，每行一个主机
-user: 按用户名过滤输出，用于定位域管等高价值账户的登录位置
也可使用 -users 指定用户列表文件
配合 -noloop 可快速打一轮即停，降低噪音`,
        example: 'impacket-netview corp.local/svc-reader:Passw0rd -targets hosts.txt -user DomainAdmin -dc-ip 10.10.10.10',
      },
    ],
  },
  {
    id: 'net',
    name: 'impacket-net',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/net.py',
    description: 'SAMR RPC 客户端，枚举域/本地的用户、计算机与组',
    commands: [
      {
        id: 'net-user',
        title: 'net user 枚举用户',
        description: '子命令 user：枚举所有域/本地用户账户',
        build: (p) => `impacket-net ${buildImpacketAuth(p, { targetIp: true })} user`,
        usage: `net.py 采用子命令体系，全局格式: net.py [全局选项] target <子命令> [子命令选项]
target: [[domain/]username[:password]@]<目标主机名或IP>
子命令 (必选其一，--help 实际列出):
  user        枚举所有域/本地用户账户
  computer    枚举域内所有计算机
  localgroup  枚举本机的本地组 (别名)
  group       枚举域控上注册的域组
全局选项: -dc-ip / -target-ip / -port / -debug / -ts
认证: 密码 / -hashes / -no-pass / -k / -aesKey
每个子命令有自己的选项，可用 net.py target user -h 查看`,
        example: 'impacket-net corp.local/svc-reader:Passw0rd@10.10.10.10 user',
      },
      {
        id: 'net-computer',
        title: 'net computer 枚举计算机',
        description: '子命令 computer：枚举域级别所有计算机账户',
        build: (p) => `impacket-net ${buildImpacketAuth(p, { targetIp: true })} computer`,
        usage: `子命令 computer: 枚举域内所有计算机
target: [[domain/]username[:password]@]<目标主机名或IP>
全局选项与认证参数同 net user 条目
可用 net.py target computer -h 查看子命令专属选项`,
        example: 'impacket-net corp.local/svc-reader:Passw0rd@10.10.10.10 computer',
      },
      {
        id: 'net-group',
        title: 'net group 枚举域组',
        description: '子命令 group：枚举域控上注册的域组',
        build: (p) => `impacket-net ${buildImpacketAuth(p, { targetIp: true })} group`,
        usage: `子命令 group: 枚举域控上注册的域组
target: [[domain/]username[:password]@]<目标主机名或IP>
关注 Domain Admins / Enterprise Admins 等高价值组
全局选项与认证参数同 net user 条目`,
        example: 'impacket-net corp.local/svc-reader:Passw0rd@10.10.10.10 group',
      },
      {
        id: 'net-localgroup',
        title: 'net localgroup 枚举本地组',
        description: '子命令 localgroup：枚举目标本机的本地组 (别名)，定位本地管理员组',
        build: (p) => `impacket-net ${buildImpacketAuth(p, { targetIp: true })} localgroup`,
        usage: `子命令 localgroup: 枚举目标本机的本地组 (aliases)
target: [[domain/]username[:password]@]<目标主机名或IP>
用于定位目标上的 Administrators 等本地组
全局选项与认证参数同 net user 条目`,
        example: 'impacket-net corp.local/svc-reader:Passw0rd@10.10.10.10 localgroup',
      },
    ],
  },
  {
    id: 'DumpNTLMInfo',
    name: 'impacket-DumpNTLMInfo',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/DumpNTLMInfo.py',
    description: '无需凭据，通过 NTLM 认证协商解析目标信息 (OS 版本/域名/主机名等)',
    commands: [
      {
        id: 'DumpNTLMInfo-smb',
        title: 'SMB 探测 NTLM 信息',
        description: '默认走 SMB 协议，泄露目标域名、主机名、OS 版本、DNS 名称等',
        build: (p) => `impacket-DumpNTLMInfo ${v(p.targetIP || p.targetHost, 'TARGET')}`,
        usage: `target: <目标主机名或IP>，位置参数，无需任何凭据
-target-ip: 目标为 NetBIOS 名无法解析时指定目标 IP
-port: 指定连接的 SMB/RPC 端口
-protocol: 指定使用 SMB 或 RPC，默认 SMB; 端口为 135 时通常使用 RPC
可用于未认证阶段的目标指纹识别`,
        example: 'impacket-DumpNTLMInfo 10.10.10.10',
      },
      {
        id: 'DumpNTLMInfo-rpc',
        title: 'RPC 探测 NTLM 信息',
        description: '-protocol RPC 通过 135 端口的 RPC 通道做 NTLM 协商信息泄露',
        build: (p) => `impacket-DumpNTLMInfo ${v(p.targetIP || p.targetHost, 'TARGET')} -protocol RPC -port 135`,
        usage: `-protocol RPC: 使用 RPC 协议进行 NTLM 认证协商
-port 135: 连接 RPC Endpoint Mapper 端口
SMB (445) 被过滤时可尝试 RPC 通道获取同样的 NTLM 信息`,
        example: 'impacket-DumpNTLMInfo 10.10.10.10 -protocol RPC -port 135',
      },
    ],
  },
  {
    id: 'getArch',
    name: 'impacket-getArch',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/getArch.py',
    description: '无需凭据，通过 DCERPC 探测目标系统的 OS 架构 (32/64 位)',
    commands: [
      {
        id: 'getArch-single',
        title: '探测单台目标架构',
        description: '-target 指定目标，为后续选择 payload 架构做准备',
        build: (p) => `impacket-getArch -target ${v(p.targetIP || p.targetHost, 'TARGET')}`,
        usage: `-target: <目标主机名或IP>，无需认证
-targets: 目标列表文件，每行一个主机，可批量探测
-timeout: 连接目标的 socket 超时秒数 (默认 2 秒)
该工具没有任何认证参数，直接探测即可`,
        example: 'impacket-getArch -target 10.10.10.10',
      },
      {
        id: 'getArch-batch',
        title: '批量探测目标列表',
        description: '-targets 读取主机列表文件批量探测，适合拿下网段后快速摸底',
        build: () => `impacket-getArch -targets ${v('', 'TARGETS.txt')}`,
        usage: `-targets: 目标列表文件，每行一个主机
-timeout: 适当调大超时可降低漏报 (默认 2 秒)
输出每台主机的 32/64 位架构，供选择对应位数的 payload`,
        example: 'impacket-getArch -targets hosts.txt',
      },
    ],
  },
  {
    id: 'machine_role',
    name: 'impacket-machine_role',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/machine_role.py',
    description: '获取目标主机的角色 (工作站/服务器/域控) 及其所在主域信息',
    commands: [
      {
        id: 'machine-role-query',
        title: '查询主机角色',
        description: '通过 SAMR 判断目标是成员机、服务器还是域控，并显示主域',
        build: (p) => `impacket-machine_role ${buildImpacketAuth(p, { targetIp: true })}`,
        usage: `target: [[domain/]username[:password]@]<目标主机名或IP>
-dc-ip: 指定域控 IP，省略时使用 target 中的域部分 (FQDN)
-target-ip: 目标为 NetBIOS 名无法解析时指定目标 IP
-port: 指定 SMB 连接端口
-hashes: NTLM 哈希认证，格式 LMHASH:NTHASH
-no-pass: 不询问密码 (配合 -k)
-k: Kerberos 认证，从 KRB5CCNAME 读取票据
-aesKey: 使用 AES 密钥 (128/256 位) 做 Kerberos 认证
可快速确认拿到的主机是否为域控`,
        example: 'impacket-machine_role corp.local/svc-reader:Passw0rd@10.10.10.10',
      },
    ],
  },
  {
    id: 'mssqlinstance',
    name: 'impacket-mssqlinstance',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/mssqlinstance.py',
    description: '无需凭据，向目标查询正在运行的 MSSQL 实例列表',
    commands: [
      {
        id: 'mssqlinstance-query',
        title: '枚举 MSSQL 实例',
        description: '通过 UDP 1434 (SQL Browser) 获取目标上所有 MSSQL 实例名与端口',
        build: (p) => `impacket-mssqlinstance ${v(p.targetIP || p.targetHost, 'HOST')}`,
        usage: `host: 目标主机，位置参数，无需认证
-timeout: 等待应答的超时秒数
基于 SQL Server Browser 服务 (UDP 1434)，可发现命名实例及其 TCP 端口
为后续 mssqlclient 连接或 MSSQL 攻击面枚举做侦察`,
        example: 'impacket-mssqlinstance 10.10.10.20',
      },
    ],
  },
];
