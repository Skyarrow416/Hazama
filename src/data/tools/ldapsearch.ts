import type { Tool } from '../../types';
import { buildLdapsearchAuth, domainDN, q, v } from '../../lib/auth';

/**
 * ldapsearch 数据文件
 * 参数定义来源: 本机安装的 OpenLDAP 2.6.10 `man ldapsearch`
 * 命令结构: ldapsearch [选项] filter [attrs...]
 * 过滤器遵循 RFC 4515；attrs 省略时返回所有用户属性，
 * "*" 为所有用户属性，"+" 为所有操作属性，"1.1" 为不返回属性(只列 DN)
 */
export const ldapsearchTools: Tool[] = [
  {
    id: 'ldapsearch-auth',
    name: 'ldapsearch 全局参数与认证',
    category: 'ldapsearch',
    homepage: 'https://linux.die.net/man/1/ldapsearch',
    description: 'OpenLDAP 命令行查询工具：简单绑定 / Kerberos (GSSAPI) / 匿名 / TLS',
    guide: `【ldapsearch 核心语法】(OpenLDAP 2.6.10)
命令结构: ldapsearch [选项] filter [attrs...]
-H ldapuri     服务器 URI，如 ldap://10.0.0.1 或 ldaps://dc01.corp.local (636)
-x             使用简单认证 (simple bind)，否则默认尝试 SASL
-D binddn      绑定身份，AD 简单绑定支持 user@domain 或完整 DN 格式
-w passwd      绑定密码 (-W 为交互输入，-y file 从文件读取)
-b searchbase  搜索起点 DN，域分区即 DC=corp,DC=local；rootDSE 用空字符串 ""
-s scope       搜索范围: base(只查起点)/one(一层)/sub(整棵子树,默认)/children
-Y mech        SASL 机制，Kerberos 票据认证用 -Y GSSAPI (配合 KRB5CCNAME 环境变量)
-N             不对 SASL 主机名做反向 DNS 规范化 (GSSAPI 常配合)
-Z[Z]          StartTLS；-ZZ 要求必须协商成功
-A             只返回属性名不返回属性值 (快速查看对象有哪些字段)
-L[L[L]]       LDIF 输出控制: -L 为 LDIFv1，-LL 去注释，-LLL 去版本号 (最干净)
-S attribute   按某属性排序结果
-z sizelimit   最多返回条目数；-l timelimit 为最长等待秒数
-E ext         搜索扩展，常用: -E pr=1000/noprompt (分页，AD 默认单页 1000 条)
               -E '!1.2.840.113556.1.4.417' (Show Deleted，查已删除对象)
-o ldif_wrap=no  关闭 LDIF 折行 (长属性值如 nTSecurityDescriptor 不换行)
attrs...       要返回的属性列表；省略=所有用户属性；*=所有用户属性；
               +=所有操作属性 (如 msDS-KeyCredentialLink)；1.1=不返回属性只列 DN

【AD 过滤器要点】(RFC 4515 + AD 扩展匹配规则)
位匹配: (userAccountControl:1.2.840.113556.1.4.803:=4194304)  (BIT_AND)
DN 链:  (memberOf:1.2.840.113556.1.4.1941:=CN=Domain Admins,...)  (IN_CHAIN，含嵌套组)
通配符: (sAMAccountName=admin*)；存在性: (servicePrincipalName=*)
注意: OpenLDAP ldapsearch 不支持 NTLM 哈希传递 (PtH)，哈希场景请用 impacket/bloodyAD/netexec`,
    commands: [
      {
        id: 'ldapsearch-simple-bind',
        title: '简单绑定: 密码认证查询',
        description: '最常用形式，-x 简单绑定 + -D user@domain，AD 直接支持',
        build: (p) =>
          `${buildLdapsearchAuth(p)} ${q('(objectClass=user)')} sAMAccountName`,
        usage: `语法: ldapsearch -x -H ldap://<DC> -D '<用户>@<域名>' -w '<密码>' -b '<BASE_DN>' <过滤器> [属性...]
-x: 简单认证；-D: 绑定账号 (AD 支持 UPN 格式 user@domain，也支持完整 DN)
-w: 密码 (明文出现在命令行，可用 -W 改为交互输入)
-H: ldap:// 为 389 明文；域查询 BASE_DN 一般是 DC=corp,DC=local
末尾属性列表限定返回字段，省略则返回所有用户属性。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' '(objectClass=user)' sAMAccountName",
      },
      {
        id: 'ldapsearch-kerberos',
        title: 'Kerberos 认证: GSSAPI + ccache',
        description: '使用已有票据认证，KRB5CCNAME 指向 ccache 文件',
        build: (p) =>
          `${buildLdapsearchAuth(p)} ${q('(objectClass=user)')} sAMAccountName`,
        usage: `语法: KRB5CCNAME=<ccache路径> ldapsearch -Y GSSAPI -N -H ldap://<DC主机名> -b '<BASE_DN>' <过滤器> [属性...]
-Y GSSAPI: 用 Kerberos 票据做 SASL 认证，-H 必须是 DC 主机名 (按 SPN ldap/<fqdn> 匹配)
-N: 跳过反向 DNS 规范化，避免 PTR 记录缺失导致主机名不匹配
票据获取: impacket-getTGT corp.local/user:'pass' 或 AES key 模式 -aesKey
导出环境变量后同一会话内可省略 KRB5CCNAME 前缀: export KRB5CCNAME=/tmp/krb5cc_0`,
        example:
          "KRB5CCNAME=/tmp/lowpriv.ccache ldapsearch -Y GSSAPI -N -H ldap://dc01.corp.local -b 'DC=corp,DC=local' '(objectClass=user)' sAMAccountName",
      },
      {
        id: 'ldapsearch-anonymous',
        title: '匿名绑定探测',
        description: '不带凭据查询，探测 LDAP 匿名可读信息 (rootDSE/部分对象)',
        build: (p) =>
          `${buildLdapsearchAuth(p, { anonymous: true })} -s base ${q('(objectClass=*)')} namingContexts defaultNamingContext`,
        usage: `语法: ldapsearch -x -H ldap://<DC> -b '' -s base '(objectClass=*)' namingContexts defaultNamingContext
匿名绑定 (只 -x 不 -D/-w) 测试目标是否允许未认证查询
-b '' -s base: 查询 rootDSE，常可匿名读到 namingContexts/域名/DC 功能级别
-b 空字符串代表 rootDSE；AD 默认匿名无法读域分区，但 rootDSE 通常可读。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -b '' -s base '(objectClass=*)' namingContexts defaultNamingContext",
      },
      {
        id: 'ldapsearch-ldaps',
        title: 'LDAPS 加密连接 (636)',
        description: 'ldaps:// 走 TLS，证书不受信时需配置忽略验证',
        build: (p) =>
          `${buildLdapsearchAuth(p, { ldaps: true })} ${q('(objectClass=user)')} sAMAccountName`,
        usage: `语法: ldapsearch -x -H ldaps://<DC> -D '<用户>@<域名>' -w '<密码>' -b '<BASE_DN>' <过滤器> [属性...]
ldaps:// 使用 636 端口 TLS 加密，与 ldap:// 的区别仅在 URI scheme
自签/不受信证书报错时: LDAPTLS_REQCERT=never ldapsearch ... 临时跳过验证
或在 /etc/ldap/ldap.conf 配置 TLS_REQCERT never / 指定 TLS_CACERT。`,
        example:
          "LDAPTLS_REQCERT=never ldapsearch -x -H ldaps://dc01.corp.local -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' '(objectClass=user)' sAMAccountName",
      },
      {
        id: 'ldapsearch-starttls',
        title: 'StartTLS 加密 (389 端口升级)',
        description: '-ZZ 强制 StartTLS 成功，在不开放 636 的环境加密 389 流量',
        build: (p) =>
          `${buildLdapsearchAuth(p, { starttls: true })} ${q('(objectClass=user)')} sAMAccountName`,
        usage: `语法: ldapsearch -x -ZZ -H ldap://<DC> -D '<用户>@<域名>' -w '<密码>' -b '<BASE_DN>' <过滤器>
-Z: 发起 StartTLS 扩展操作，失败仍继续明文；-ZZ: 必须成功否则退出
适用场景: 目标只通 389，但要求加密 (如读 LAPS/改密码前的安全通道要求)
证书问题同样用 LDAPTLS_REQCERT=never 绕过。`,
        example:
          "LDAPTLS_REQCERT=never ldapsearch -x -ZZ -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' '(objectClass=user)' sAMAccountName",
      },
      {
        id: 'ldapsearch-paging',
        title: '分页查询 (突破 AD 1000 条上限)',
        description: '-E pr=1000/noprompt 简单分页，枚举大域必备',
        build: (p) =>
          `${buildLdapsearchAuth(p)} -E pr=1000/noprompt ${q('(objectClass=user)')} sAMAccountName`,
        usage: `语法: ldapsearch [认证参数] -E pr=1000/noprompt <过滤器> [属性...]
-E pr=<size>/noprompt: Simple Paged Results 控制 (RFC 2696)，每页 size 条
AD LDAP 策略默认 MaxPageSize=1000，不分页最多只返回 1000 条且容易截断
noprompt 表示自动翻页不交互；大域枚举用户/计算机/组时必须加分页。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' -E pr=1000/noprompt '(objectClass=user)' sAMAccountName",
      },
      {
        id: 'ldapsearch-ldif-save',
        title: '干净 LDIF 输出并保存',
        description: '-LLL 去注释去版本号，-o ldif_wrap=no 防长值折行，重定向存档',
        build: (p) =>
          `${buildLdapsearchAuth(p)} -LLL -o ldif_wrap=no -E pr=1000/noprompt ${q('(objectClass=user)')} > ${v(p.fileName, 'users.ldif')}`,
        usage: `语法: ldapsearch [认证参数] -LLL -o ldif_wrap=no -E pr=1000/noprompt <过滤器> > 输出文件
-L/-LL/-LLL: 逐级精简 LDIF 输出，-LLL 最干净 (无注释无 version 行)，便于 grep/后处理
-o ldif_wrap=no: 关闭 78 列折行；默认折行会把长属性值 (memberOf/SID 等) 切断
采集后处理技巧: grep '^sAMAccountName:' users.ldif | awk '{print $2}'。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' -LLL -o ldif_wrap=no -E pr=1000/noprompt '(objectClass=user)' > users.ldif",
      },
    ],
  },
  {
    id: 'ldapsearch-attrs',
    name: 'ldapsearch 对象属性查询',
    category: 'ldapsearch',
    homepage: 'https://linux.die.net/man/1/ldapsearch',
    description: '查看对象的属性名与属性值、操作属性、安全描述符、rootDSE 与 Schema 定义',
    commands: [
      {
        id: 'ldapsearch-object-attrs',
        title: '查看对象全部属性 (用户属性 + 操作属性)',
        description: '* + 同时返回用户属性与操作属性，目标为"目标对象"字段',
        build: (p) =>
          `${buildLdapsearchAuth(p)} ${q(`(sAMAccountName=${v(p.targetObject, 'TARGET')})`)} '*' '+'`,
        usage: `语法: ldapsearch [认证参数] '(sAMAccountName=<对象>)' '*' '+'
过滤器按 sAMAccountName 定位对象 (用户/计算机/组通用；计算机账户名带 $)
'*': 所有用户属性 (cn/memberOf/userAccountControl 等)
'+': 所有操作属性 (服务器计算/维护的属性，如 msDS-KeyCredentialLink、tokenGroups 需显式请求)
两者都给 = 尽量看全。操作属性只能显式请求，不会被 * 返回。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' '(sAMAccountName=Administrator)' '*' '+'",
      },
      {
        id: 'ldapsearch-attr-names-only',
        title: '只看属性名不看值 (-A)',
        description: '-A 只输出属性名列表，快速摸清对象有哪些字段',
        build: (p) =>
          `${buildLdapsearchAuth(p)} -A ${q(`(sAMAccountName=${v(p.targetObject, 'TARGET')})`)}`,
        usage: `语法: ldapsearch [认证参数] -A '<过滤器>'
-A: retrieve attributes only —— 只显示 attributename 不显示值 (man ldapsearch: 用于只关心属性是否存在)
输出形如 "dn: CN=..." 后跟一串 "attributename" 行，即该对象当前填充了值的所有字段名
配合 '*' '+' 思路: -A 模式省略 attrs 时按用户属性返回。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' -A '(sAMAccountName=Administrator)'",
      },
      {
        id: 'ldapsearch-specific-attrs',
        title: '查看指定属性',
        description: '末尾列出属性名，只返回关心的字段',
        build: (p) =>
          `${buildLdapsearchAuth(p)} ${q(`(sAMAccountName=${v(p.targetObject, 'TARGET')})`)} sAMAccountName userPrincipalName displayName memberOf lastLogon pwdLastSet userAccountControl`,
        usage: `语法: ldapsearch [认证参数] '<过滤器>' <属性1> <属性2> ...
attrs 为空格分隔的属性名列表，只返回这些字段 (man: attrs 省略时才返回全部用户属性)
常用属性速查:
  身份类: sAMAccountName userPrincipalName distinguishedName objectSid objectGUID
  状态类: userAccountControl pwdLastSet lastLogon logonCount badPwdCount
  关系类: memberOf member primaryGroupID managedBy manager
  攻击面: servicePrincipalName msDS-AllowedToDelegateTo msDS-AllowedToActOnBehalfOfOtherIdentity msLAPS-Password ms-MCS-AdmPwd unixUserPassword description info`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' '(sAMAccountName=Administrator)' sAMAccountName userPrincipalName memberOf pwdLastSet userAccountControl",
      },
      {
        id: 'ldapsearch-operational-attrs',
        title: '只查操作属性 (+)',
        description: '单独请求 +，查看服务器维护的隐藏属性',
        build: (p) =>
          `${buildLdapsearchAuth(p)} ${q(`(sAMAccountName=${v(p.targetObject, 'TARGET')})`)} '+'`,
        usage: `语法: ldapsearch [认证参数] '<过滤器>' '+'
'+': 所有操作属性 (operational attributes)，不随 '*' 返回，必须显式请求
AD 常见操作属性: createTimeStamp modifyTimeStamp (对象创建/修改时间)、
  msDS-KeyCredentialLink (Shadow Credentials 攻击面)、msDS-ResultantPSO (生效密码策略)、
  canonicalName、isCriticalSystemObject
注意部分属性 (如 tokenGroups) 即使在 + 里也不会返回，需单独显式列名。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' '(sAMAccountName=Administrator)' '+'",
      },
      {
        id: 'ldapsearch-dn-only',
        title: '只列 DN 不返回属性 (1.1)',
        description: '请求伪属性 1.1，快速列出所有匹配对象的 DN',
        build: (p) =>
          `${buildLdapsearchAuth(p)} -LLL -E pr=1000/noprompt ${q(`(sAMAccountName=${v(p.targetObject, 'TARGET')})`)} 1.1`,
        usage: `语法: ldapsearch [认证参数] '<过滤器>' 1.1
1.1: RFC 4515 约定的伪属性，表示"不返回任何属性"，结果只含 dn: 行
用途: 快速确认对象存在、拿到准确 DN (供 bloodyAD/dacledit 等要 DN 的工具用)
把过滤器换成 (objectClass=group) 等即可批量列 DN。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' -LLL '(sAMAccountName=Administrator)' 1.1",
      },
      {
        id: 'ldapsearch-sd',
        title: '读取安全描述符 nTSecurityDescriptor',
        description: '查看对象 DACL (谁有什么权限)，配合 -o ldif_wrap=no 防折行',
        build: (p) =>
          `${buildLdapsearchAuth(p)} -o ldif_wrap=no ${q(`(sAMAccountName=${v(p.targetObject, 'TARGET')})`)} nTSecurityDescriptor`,
        usage: `语法: ldapsearch [认证参数] -o ldif_wrap=no '<过滤器>' nTSecurityDescriptor
nTSecurityDescriptor: 对象安全描述符 (二进制)，默认返回 DACL 部分 (需 READ_CONTROL 才含 SACL/Owner)
输出为 base64 (属性名后带 ::)，可用 impacket 的 securityDescriptor 结构离线解析
只想要 Owner/DACL 更精细控制时用 SDFlags 扩展:
  -E '!1.2.840.113556.1.4.801=::MAMCAQc=' (值含义: Owner+Group+DACL，7=0x07)
分析 DACL 更推荐 bloodyAD get object <target> --attr ntSecurityDescriptor --resolve-sd (自动解析)。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' -o ldif_wrap=no '(sAMAccountName=Administrator)' nTSecurityDescriptor",
      },
      {
        id: 'ldapsearch-rootdse',
        title: '查询 rootDSE (域名/分区/DC 能力)',
        description: '-b "" -s base 查 rootDSE，拿到各命名上下文与域功能级别',
        build: (p) =>
          `${buildLdapsearchAuth(p, { anonymous: true })} -s base ${q('(objectClass=*)')} namingContexts defaultNamingContext schemaNamingContext configurationNamingContext domainControllerFunctionality dnsHostName`,
        usage: `语法: ldapsearch -x -H ldap://<DC> -b '' -s base '(objectClass=*)' [属性...]
rootDSE 是 LDAP 服务的根条目，-b '' (空 searchbase) + -s base 读取
常用属性: defaultNamingContext (域分区 DN)、namingContexts (全部分区)、
  configurationNamingContext/schemaNamingContext (配置/架构分区 DN)、
  domainControllerFunctionality (DC 功能级别: 7=2016, 8=2025 等)、dnsHostName (DC FQDN)
rootDSE 通常匿名可读，是侦察域结构的第一步。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -b '' -s base '(objectClass=*)' namingContexts defaultNamingContext domainControllerFunctionality dnsHostName",
      },
      {
        id: 'ldapsearch-schema-attr',
        title: '查 Schema 中的属性定义',
        description: '在架构分区查 attributeSchema，确认某字段的正式定义',
        build: (p) =>
          `${buildLdapsearchAuth(p)} -b ${q(`CN=Schema,CN=Configuration,${v(domainDN(p), 'DC=corp,DC=local')}`)} ${q('(lDAPDisplayName=msDS-KeyCredentialLink)')} lDAPDisplayName attributeID attributeSyntax isSingleValued`,
        usage: `语法: ldapsearch [认证参数] -b 'CN=Schema,CN=Configuration,<BASE_DN>' '(lDAPDisplayName=<字段名>)' [属性...]
Schema 分区里每个 attributeSchema 对象定义一个 LDAP 属性 (字段)
lDAPDisplayName: 日常查询用的属性名；attributeID: OID；attributeSyntax: 语法 OID；
isSingleValued: 是否单值；searchFlags: 是否索引/保密 (如 msLAPS-Password 的 confidential 标志)
把过滤器字段名换成任何想查证的属性即可；类定义查 (objectClass=classSchema)。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'CN=Schema,CN=Configuration,DC=corp,DC=local' '(lDAPDisplayName=msDS-KeyCredentialLink)' lDAPDisplayName attributeID attributeSyntax isSingleValued",
      },
    ],
  },
  {
    id: 'ldapsearch-enum',
    name: 'ldapsearch AD 常用枚举',
    category: 'ldapsearch',
    homepage: 'https://linux.die.net/man/1/ldapsearch',
    description: '用户/计算机/组/Kerberoast/AS-REP/委派/LAPS/已删除对象等现成过滤器',
    commands: [
      {
        id: 'ldapsearch-enum-users',
        title: '枚举全部用户',
        description: 'objectCategory=person 精确匹配用户，带分页',
        build: (p) =>
          `${buildLdapsearchAuth(p)} -E pr=1000/noprompt ${q('(&(objectCategory=person)(objectClass=user))')} sAMAccountName userPrincipalName`,
        usage: `语法: ldapsearch [认证参数] '(&(objectCategory=person)(objectClass=user))' sAMAccountName
(&(objectCategory=person)(objectClass=user)): 标准"域用户"过滤器，比单 (objectClass=user) 更精确
  (单 objectClass=user 会把计算机账户也匹配进来，因为 computer 继承自 user)
大域记得 -E pr=1000/noprompt 分页。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' -E pr=1000/noprompt '(&(objectCategory=person)(objectClass=user))' sAMAccountName",
      },
      {
        id: 'ldapsearch-enum-computers',
        title: '枚举全部计算机',
        description: '查看机器账户与操作系统版本',
        build: (p) =>
          `${buildLdapsearchAuth(p)} -E pr=1000/noprompt ${q('(objectClass=computer)')} sAMAccountName dNSHostName operatingSystem operatingSystemVersion`,
        usage: `语法: ldapsearch [认证参数] '(objectClass=computer)' sAMAccountName dNSHostName operatingSystem
operatingSystem/operatingSystemVersion: 识别老旧系统 (如 2008/Win7) 找易打点目标
dNSHostName: 机器 FQDN；配合 lastLogon/pwdLastSet 可筛不活跃机器。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' -E pr=1000/noprompt '(objectClass=computer)' sAMAccountName dNSHostName operatingSystem operatingSystemVersion",
      },
      {
        id: 'ldapsearch-enum-groups',
        title: '枚举组及高价值组成员',
        description: '先列所有组，再查 Domain Admins 等特权组成员',
        build: (p) =>
          `${buildLdapsearchAuth(p)} ${q(`(memberOf:1.2.840.113556.1.4.1941:=CN=Domain Admins,CN=Users,${v(domainDN(p), 'DC=corp,DC=local')})`)} sAMAccountName`,
        usage: `语法: ldapsearch [认证参数] '(memberOf:1.2.840.113556.1.4.1941:=<组DN>)' sAMAccountName
1.2.840.113556.1.4.1941 (LDAP_MATCHING_RULE_IN_CHAIN): 沿 DN 链递归匹配，含嵌套组成员
普通枚举所有组: '(objectClass=group)' sAMAccountName member
常见高价值组: Domain Admins / Enterprise Admins / Administrators / Account Operators / Backup Operators
注意组的 DN 会因语言环境不同 (如 CN=Administrateurs)。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' '(memberOf:1.2.840.113556.1.4.1941:=CN=Domain Admins,CN=Users,DC=corp,DC=local)' sAMAccountName",
      },
      {
        id: 'ldapsearch-enum-kerberoast',
        title: '找 Kerberoastable 账户 (有 SPN 的用户)',
        description: 'servicePrincipalName=* 的用户，Roasting 目标清单',
        build: (p) =>
          `${buildLdapsearchAuth(p)} -E pr=1000/noprompt ${q('(&(objectCategory=person)(objectClass=user)(servicePrincipalName=*)(!(sAMAccountName=krbtgt)))')} sAMAccountName servicePrincipalName`,
        usage: `语法: ldapsearch [认证参数] '(&(objectCategory=person)(objectClass=user)(servicePrincipalName=*))' sAMAccountName servicePrincipalName
servicePrincipalName=*: 存在性匹配，有 SPN 的用户账户即可被 Kerberoast
(!(sAMAccountName=krbtgt)): 排除 krbtgt (! = NOT)
拿到清单后用 impacket-GetUserSPNs -request 请求票据离线爆破。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' '(&(objectCategory=person)(objectClass=user)(servicePrincipalName=*)(!(sAMAccountName=krbtgt)))' sAMAccountName servicePrincipalName",
      },
      {
        id: 'ldapsearch-enum-asrep',
        title: '找 AS-REP Roastable 账户 (DONT_REQ_PREAUTH)',
        description: '位匹配 UAC 标志 4194304',
        build: (p) =>
          `${buildLdapsearchAuth(p)} ${q('(&(objectCategory=person)(objectClass=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))')} sAMAccountName userAccountControl`,
        usage: `语法: ldapsearch [认证参数] '(&(objectCategory=person)(objectClass=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))' sAMAccountName
:1.2.840.113556.1.4.803:= LDAP_MATCHING_RULE_BIT_AND，按位匹配 UAC 标志位
4194304 = 0x400000 = DONT_REQ_PREAUTH (不需要 Kerberos 预认证)，可 AS-REP Roast
其他常用位: 2=禁用账户 512=正常账户 65536=密码永不过期 524288=无约束委派
拿到清单后用 impacket-GetNPUsers -no-pass 抓 AS-REP 哈希。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' '(&(objectCategory=person)(objectClass=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))' sAMAccountName",
      },
      {
        id: 'ldapsearch-enum-delegation',
        title: '枚举委派配置 (无约束/约束/RBCD)',
        description: '三条过滤器找全三种委派攻击面',
        build: (p) =>
          `${buildLdapsearchAuth(p)} ${q('(userAccountControl:1.2.840.113556.1.4.803:=524288)')} sAMAccountName`,
        usage: `语法 (无约束委派): '(userAccountControl:1.2.840.113556.1.4.803:=524288)' sAMAccountName
  524288 = TRUSTED_FOR_DELEGATION；结果排除 DC 后即为可滥用的无约束委派主机
约束委派: '(msDS-AllowedToDelegateTo=*)' sAMAccountName msDS-AllowedToDelegateTo
  (该属性列出可委派到的 SPN，结合 S4U2Proxy 滥用)
RBCD: '(msDS-AllowedToActOnBehalfOfOtherIdentity=*)' sAMAccountName
  (基于资源的约束委派，常配合 addcomputer + impacket-getST -impersonate)`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' '(userAccountControl:1.2.840.113556.1.4.803:=524288)' sAMAccountName",
      },
      {
        id: 'ldapsearch-enum-laps',
        title: '读取 LAPS 本地管理员密码',
        description: '枚举设置了 LAPS 的计算机 (需属性读取权限)',
        build: (p) =>
          `${buildLdapsearchAuth(p)} -E pr=1000/noprompt ${q('(|(ms-MCS-AdmPwd=*)(msLAPS-Password=*))')} sAMAccountName ms-MCS-AdmPwd ms-MCS-AdmPwdExpirationTime msLAPS-Password`,
        usage: `语法: ldapsearch [认证参数] '(|(ms-MCS-AdmPwd=*)(msLAPS-Password=*))' sAMAccountName ms-MCS-AdmPwd msLAPS-Password
(|A B): OR 匹配。旧版 LAPS 存 ms-MCS-AdmPwd (明文)；新版 Windows LAPS 存 msLAPS-Password (JSON 加密)
读取需要对应属性的读权限 (通常授予 Helpdesk/特定组)，普通用户查询返回为空
注意 Windows LAPS 加密密码需要解密权限，密文可用 bloodyAD msldap laps 或 dpapi 思路处理。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' '(|(ms-MCS-AdmPwd=*)(msLAPS-Password=*))' sAMAccountName ms-MCS-AdmPwd",
      },
      {
        id: 'ldapsearch-enum-admincount',
        title: '找受保护/特权账户 (adminCount=1)',
        description: 'AdminSDHolder 保护的对象，高价值目标清单',
        build: (p) =>
          `${buildLdapsearchAuth(p)} -E pr=1000/noprompt ${q('(&(objectCategory=person)(objectClass=user)(adminCount=1))')} sAMAccountName memberOf`,
        usage: `语法: ldapsearch [认证参数] '(adminCount=1)' sAMAccountName memberOf
adminCount=1: 当前或曾经受 AdminSDHolder 保护的账户/组 (特权账户标记，SDProp 每小时同步)
加 (objectCategory=person)(objectClass=user) 只看用户；去掉则连组一起列
这些账户即使已移出特权组，adminCount 仍为 1 (可发现"前特权"账户)。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' '(adminCount=1)' sAMAccountName memberOf",
      },
      {
        id: 'ldapsearch-enum-gmsa',
        title: '枚举 gMSA 账户',
        description: '组托管服务账户，可进一步尝试读其密码材料',
        build: (p) =>
          `${buildLdapsearchAuth(p)} ${q('(objectClass=msDS-GroupManagedServiceAccount)')} sAMAccountName msDS-ManagedPasswordId PrincipalsAllowedToRetrieveManagedPassword`,
        usage: `语法: ldapsearch [认证参数] '(objectClass=msDS-GroupManagedServiceAccount)' sAMAccountName PrincipalsAllowedToRetrieveManagedPassword
gMSA: 组托管服务账户，密码由 AD 自动管理
PrincipalsAllowedToRetrieveManagedPassword: 哪些主体可取回该 gMSA 的密码
若当前用户在被授权主体内: bloodyAD msldap gmsa 或 impacket/GetADComputers 等可导出哈希。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' '(objectClass=msDS-GroupManagedServiceAccount)' sAMAccountName PrincipalsAllowedToRetrieveManagedPassword",
      },
      {
        id: 'ldapsearch-enum-deleted',
        title: '查询已删除对象 (墓碑/回收站)',
        description: '-E !1.2.840.113556.1.4.417 显示已删除对象，找可恢复的账户',
        build: (p) =>
          `${buildLdapsearchAuth(p)} -E '!1.2.840.113556.1.4.417' ${q('(isDeleted=TRUE)')} sAMAccountName displayName lastKnownParent whenChanged objectGUID`,
        usage: `语法: ldapsearch [认证参数] -E '!1.2.840.113556.1.4.417' '(isDeleted=TRUE)' sAMAccountName lastKnownParent whenChanged
1.2.840.113556.1.4.417: LDAP_SERVER_SHOW_DELETED_OID 控制，让服务器返回已删除对象 (! = critical 关键控制)
isDeleted=TRUE: 只匹配已删除对象；它们存放在 CN=Deleted Objects 容器 (墓碑状态)
关键属性: lastKnownParent (删除前的父容器 DN，恢复时用)、whenChanged (删除时间)、objectGUID
恢复操作见 PowerShell 模块 Restore-ADObject 或 bloodyAD set restore <对象>。
只找特定被删账户: '(&(isDeleted=TRUE)(sAMAccountName=olduser))' (注意被删后 sAMAccountName 可能带 \\nDEL: 后缀, 可用 displayName 或模糊匹配 name=*olduser*)`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' -E '!1.2.840.113556.1.4.417' '(isDeleted=TRUE)' sAMAccountName displayName lastKnownParent whenChanged objectGUID",
      },
      {
        id: 'ldapsearch-enum-trusts',
        title: '枚举域信任关系',
        description: 'trustedDomain 对象列出所有信任方向与类型',
        build: (p) =>
          `${buildLdapsearchAuth(p)} ${q('(objectClass=trustedDomain)')} name trustDirection trustType trustAttributes flatName`,
        usage: `语法: ldapsearch [认证参数] '(objectClass=trustedDomain)' name trustDirection trustType trustAttributes
trustDirection: 0=禁用 1=入站 2=出站 3=双向
trustType: 1=Windows NT 4 2=AD 域 3=MIT Kerberos
trustAttributes 关键位: 0x20=FOREST_TRANSITIVE (林内传递), 0x8=CROSS_ORGANIZATION (选择性认证),
  未设 0x40000 (TREAT_AS_EXTERNAL) 的林信任可跨林枚举/攻击 (SID 过滤见 0x400 等标志)
更直观的树状展示可用 bloodyAD get trusts。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' '(objectClass=trustedDomain)' name trustDirection trustType trustAttributes",
      },
      {
        id: 'ldapsearch-enum-passwords-in-attrs',
        title: '搜属性里遗留的密码',
        description: 'description/info 等自由文本字段常残留密码',
        build: (p) =>
          `${buildLdapsearchAuth(p)} -E pr=1000/noprompt ${q('(|(description=*pass*)(description=*pwd*)(info=*pass*)(comment=*pass*))')} sAMAccountName description info comment`,
        usage: `语法: ldapsearch [认证参数] '(|(description=*pass*)(info=*pass*))' sAMAccountName description info
管理员常把初始密码写在 description/info/comment 字段，通配符模糊匹配即可
中文环境也试试 *密码*；其他值得搜的字段: unixUserPassword、userPassword、scriptPath
可扩展搜: (description=*凭证*) (description=*登录*) 等，命中率看运气但成本低。`,
        example:
          "ldapsearch -x -H ldap://10.0.0.1 -D 'lowpriv@corp.local' -w 'Password123' -b 'DC=corp,DC=local' '(|(description=*pass*)(info=*pass*))' sAMAccountName description info",
      },
    ],
  },
];
