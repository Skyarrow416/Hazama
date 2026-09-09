import type { Tool } from '../../types';
import { domainDN, v } from '../../lib/auth';

/**
 * PowerShell AD 模块数据文件
 * 语法对照: Microsoft Learn 官方文档
 * - Get-ADObject / Restore-ADObject / Get-ADUser / Get-ADComputer / Get-ADGroup
 *   (learn.microsoft.com/en-us/powershell/module/activedirectory/)
 * 执行环境: 域内 Windows 主机 (evil-winrm/RDP/PS Remoting/C2)，
 * RSAT AD 模块 (Import-Module ActiveDirectory) 或免模块的 ADSI/DirectorySearcher
 * 注意: 以下命令在 PowerShell 中执行，引号转义遵循 PowerShell 规则而非 bash
 */
export const powershellTools: Tool[] = [
  {
    id: 'ps-ad-query',
    name: 'PowerShell 查看对象属性 (AD 模块)',
    category: 'PowerShell',
    homepage: 'https://learn.microsoft.com/en-us/powershell/module/activedirectory/get-adobject',
    description: 'Get-ADObject/Get-ADUser/Get-ADGroup 系列：查看对象全部属性与指定属性',
    guide: `【ActiveDirectory 模块要点】(Microsoft Learn)
加载模块: Import-Module ActiveDirectory (RSAT 或 DC 自带)
-Identity    定位单个对象，接受: DN / GUID / SID / sAMAccountName (计算机名带 $)
-Filter      PowerShell 表达式过滤: {Name -like "*admin*"} / 'Name -like "..."'
-LDAPFilter  原生 LDAP 过滤器 (RFC 4515)，与 ldapsearch 的过滤器通用
-Properties  指定返回属性；'*' 为全部默认+扩展属性 (默认只返回少量常用属性)
-SearchBase  搜索起点 DN； -SearchScope Base/OneLevel/Subtree
-Server      指定查询的 DC (主机名或 IP)，跨域/指定 DC 时用
-Credential  指定凭据 (PSCredential 对象)，以其他用户身份查询
已删除对象: -IncludeDeletedObjects (需开启 AD 回收站才能完整恢复)
管道: Get-AD* 的结果可直接 | Restore-ADObject / | Set-ADUser / | Export-Csv`,
    commands: [
      {
        id: 'ps-get-adobject-all',
        title: '查看对象全部属性 (Get-ADObject -Properties *)',
        description: '通用命令，任何 AD 对象 (用户/组/计算机/OU) 都能查',
        build: (p) =>
          `Get-ADObject -Identity '${v(p.targetObject, 'TARGET')}' -Properties * | Format-List`,
        usage: `语法: Get-ADObject -Identity '<DN/GUID/SID>' -Properties * | Format-List
-Identity: 对象的 DN/GUID/SID (Get-ADObject 不接受 sAMAccountName，用户/计算机用 Get-ADUser/Get-ADComputer)
-Properties *: 返回全部属性 (默认只返回一小部分)；也可 -Properties memberOf,whenCreated 指定
Format-List (fl): 逐行显示，属性多时比 Format-Table 可读
加 -Server <DC> 指定域控；加 -Credential $cred 换身份。`,
        example:
          "Get-ADObject -Identity 'CN=Administrator,CN=Users,DC=corp,DC=local' -Properties * | Format-List",
      },
      {
        id: 'ps-get-aduser-all',
        title: '查看用户全部属性 (Get-ADUser)',
        description: 'sAMAccountName 直接定位，最常用',
        build: (p) =>
          `Get-ADUser -Identity '${v(p.targetObject, 'TARGET_USER')}' -Properties * | Format-List`,
        usage: `语法: Get-ADUser -Identity '<用户名>' -Properties * | Format-List
-Identity 接受: DN / GUID / SID / sAMAccountName (如 administrator)
-Properties *: 全部属性；常用关注: memberOf pwdLastSet lastLogon logonCount badPwdCount
  servicePrincipalName userAccountControl description scriptPath msDS-AllowedToDelegateTo
只看几条: Get-ADUser -Identity administrator -Properties memberOf,pwdLastSet | fl`,
        example:
          "Get-ADUser -Identity 'administrator' -Properties * | Format-List",
      },
      {
        id: 'ps-get-aduser-specific',
        title: '查看指定属性 (攻击面速查)',
        description: '只取关心的字段，输出紧凑',
        build: (p) =>
          `Get-ADUser -Identity '${v(p.targetObject, 'TARGET_USER')}' -Properties sAMAccountName,userPrincipalName,memberOf,servicePrincipalName,pwdLastSet,lastLogon,userAccountControl,description,adminCount | Format-List`,
        usage: `语法: Get-ADUser -Identity '<用户名>' -Properties <属性1,属性2,...> | Format-List
-Properties 后逗号分隔属性名；只查默认属性集之外的属性时必须显式列出
攻击面属性速查:
  servicePrincipalName (Kerberoast)、msDS-AllowedToDelegateTo (约束委派)、
  userAccountControl (UAC 标志: AS-REP/委派位)、adminCount (受保护账户)、
  description/info (可能残留密码)、scriptPath/profilePath (登录脚本劫持)、
  msLAPS-Password/ms-MCS-AdmPwd (LAPS, 需读权限)`,
        example:
          "Get-ADUser -Identity 'sqlsvc' -Properties servicePrincipalName,pwdLastSet,memberOf,userAccountControl | Format-List",
      },
      {
        id: 'ps-get-adcomputer',
        title: '查看计算机对象属性',
        description: '操作系统、SPN、委派、LAPS 信息',
        build: (p) =>
          `Get-ADComputer -Identity '${v(p.targetObject, 'COMPUTER$')}' -Properties * | Format-List`,
        usage: `语法: Get-ADComputer -Identity '<计算机名>' -Properties * | Format-List
-Identity 计算机账户 (sAMAccountName 带不带 $ 均可识别)
关注属性: operatingSystem/operatingSystemVersion (系统版本)、
  dNSHostName、servicePrincipalName、userAccountControl (无约束委派位 524288)、
  msDS-AllowedToActOnBehalfOfOtherIdentity (RBCD)、ms-MCS-AdmPwd/msLAPS-Password (LAPS)`,
        example:
          "Get-ADComputer -Identity 'WEB01' -Properties operatingSystem,dNSHostName,ms-MCS-AdmPwd,msDS-AllowedToActOnBehalfOfOtherIdentity | Format-List",
      },
      {
        id: 'ps-get-adgroup-member',
        title: '查看组及组成员 (含嵌套)',
        description: 'Get-ADGroupMember -Recursive 展开嵌套组',
        build: (p) =>
          `Get-ADGroupMember -Identity '${v(p.targetObject, 'GROUP')}' -Recursive | Select-Object name,sAMAccountName,objectClass`,
        usage: `语法: Get-ADGroupMember -Identity '<组名>' -Recursive | Select name,sAMAccountName,objectClass
-Recursive: 展开嵌套组成员 (Domain Admins 常嵌套其他组)
查组本身属性: Get-ADGroup -Identity '<组名>' -Properties * | fl
反查用户属于哪些组: Get-ADUser -Identity '<用户>' -Properties memberOf | select -ExpandProperty memberOf`,
        example:
          "Get-ADGroupMember -Identity 'Domain Admins' -Recursive | Select-Object name,sAMAccountName,objectClass",
      },
      {
        id: 'ps-get-adobject-filter',
        title: '按条件搜索对象 (Filter / LDAPFilter / SearchBase)',
        description: '在指定 OU 下用过滤器批量查询',
        build: (p) =>
          `Get-ADObject -SearchBase '${v(domainDN(p), 'DC=corp,DC=local')}' -LDAPFilter '(adminCount=1)' -Properties sAMAccountName,objectClass | Select-Object Name,sAMAccountName,objectClass`,
        usage: `语法: Get-ADObject -SearchBase '<BASE_DN>' -LDAPFilter '<LDAP过滤器>' -Properties ...
-LDAPFilter: 与 ldapsearch 相同的 RFC 4515 过滤器，位匹配/IN_CHAIN 都支持
-Filter: PowerShell 语法，如 -Filter {Name -like "*sql*"} 或 'ObjectClass -eq "user"'
-SearchBase 限定 OU 范围: -SearchBase 'OU=Servers,DC=corp,DC=local'
-SearchScope Base/OneLevel/Subtree (默认 Subtree)；-Server ${'<DC>'} 指定域控`,
        example:
          "Get-ADObject -SearchBase 'DC=corp,DC=local' -LDAPFilter '(adminCount=1)' -Properties sAMAccountName,objectClass | Select-Object Name,sAMAccountName,objectClass",
      },
      {
        id: 'ps-get-rootdse-domain',
        title: '域与林信息速查',
        description: 'Get-ADRootDSE / Get-ADDomain / Get-ADForest 三连',
        build: () =>
          `Get-ADRootDSE | Select-Object defaultNamingContext,schemaNamingContext,configurationNamingContext,domainControllerFunctionality; Get-ADDomain | Format-List; Get-ADForest | Format-List`,
        usage: `语法: Get-ADRootDSE; Get-ADDomain; Get-ADForest
Get-ADRootDSE: 各分区 DN、DC 功能级别、支持的 LDAP 控制
Get-ADDomain: 域 SID (DomainSID)、功能级别、PDC/RID/Infrastructure FSMO、子域
Get-ADForest: 林功能级别、SchemaMaster/DomainNamingMaster、全部域、UPN 后缀
拿 DomainSID 常用于构造黄金票据 (ticketer -domain-sid)。`,
        example:
          'Get-ADRootDSE; Get-ADDomain; Get-ADForest',
      },
      {
        id: 'ps-get-adobject-credential',
        title: '以其他用户身份查询 (-Credential)',
        description: '构造 PSCredential，用拿到的凭据查 AD',
        build: (p) =>
          `$cred = New-Object System.Management.Automation.PSCredential('${v(p.domain, 'DOMAIN')}\\${v(p.username, 'USER')}', (ConvertTo-SecureString '${v(p.password, 'PASSWORD')}' -AsPlainText -Force)); Get-ADUser -Identity '${v(p.targetObject, 'TARGET_USER')}' -Properties * -Credential $cred -Server '${v(p.dcFQDN || p.dcIP, 'DC')}' | Format-List`,
        usage: `语法: $cred = New-Object PSCredential('<域>\\<用户>', (ConvertTo-SecureString '<密码>' -AsPlainText -Force)); Get-AD* -Credential $cred -Server '<DC>'
非域机器/当前会话权限不够时，用 -Credential 指定域凭据，-Server 指定 DC
所有 Get-AD*/Set-AD*/Restore-ADObject 都支持这两个参数
密码含单引号时在 PowerShell 里写两个单引号转义 ('')。`,
        example:
          "$cred = New-Object System.Management.Automation.PSCredential('corp\\lowpriv', (ConvertTo-SecureString 'Password123' -AsPlainText -Force)); Get-ADUser -Identity 'administrator' -Properties * -Credential $cred -Server '10.0.0.1' | Format-List",
      },
      {
        id: 'ps-export-csv',
        title: '导出查询结果到 CSV',
        description: '批量采集后用 Export-Csv 存档',
        build: (p) =>
          `Get-ADUser -Filter * -Properties sAMAccountName,Enabled,lastLogon,memberOf | Select-Object Name,sAMAccountName,Enabled,lastLogon | Export-Csv -Path ${v(p.fileName, 'users.csv')} -NoTypeInformation`,
        usage: `语法: Get-ADUser -Filter * -Properties ... | Select ... | Export-Csv -Path <文件> -NoTypeInformation
-Filter *: 全部用户；配合 -SearchBase 限定 OU
-NoTypeInformation: 去掉 CSV 首行的类型注释
-Append 追加；中文乱码时加 -Encoding UTF8`,
        example:
          "Get-ADUser -Filter * -Properties sAMAccountName,Enabled,lastLogon | Select Name,sAMAccountName,Enabled,lastLogon | Export-Csv -Path users.csv -NoTypeInformation",
      },
    ],
  },
  {
    id: 'ps-ad-restore',
    name: 'PowerShell 恢复已删除对象',
    category: 'PowerShell',
    homepage: 'https://learn.microsoft.com/en-us/powershell/module/activedirectory/restore-adobject',
    description: 'AD 回收站：查找墓碑对象并恢复 (Restore-ADObject)',
    guide: `【AD 回收站与对象恢复原理】(Microsoft Learn)
前置条件: 林功能级别 >= 2008R2 且已启用回收站:
  Enable-ADOptionalFeature 'Recycle Bin Feature' -Scope ForestOrConfigurationSet -Target '<林域名>'
  (启用后不可关闭；未启用时删除对象只保留墓碑 (tombstone)，大部分属性被剥离，仍可尝试权威恢复)
删除后对象进入 CN=Deleted Objects 分区:
- 查询必须加 -IncludeDeletedObjects，否则默认不可见
- msDS-LastKnownRDN 属性保留对象删除前的 RDN (原名)，是定位被删对象的官方推荐方式
- lastKnownParent 记录删除前所在容器 DN
恢复: Restore-ADObject -Identity <GUID或墓碑DN> [-TargetPath <目标OU DN>]
- 恢复后对象回到 lastKnownParent 原容器 (或 -TargetPath 指定位置)
- 用户账户恢复后是禁用状态，需 Enable-ADAccount 并重置密码
- 组成员关系 (link 属性) 只有开启回收站且链接值未被回收时才完整
无 PowerShell 时的替代: bloodyAD set restore <对象名>`,
    commands: [
      {
        id: 'ps-check-recycle-bin',
        title: '检查 AD 回收站是否启用',
        description: 'Get-ADOptionalFeature 查看 Recycle Bin Feature 状态',
        build: () =>
          `Get-ADOptionalFeature -Filter 'Name -like "Recycle Bin Feature"' | Select-Object Name,EnabledScopes`,
        usage: `语法: Get-ADOptionalFeature -Filter 'Name -like "Recycle Bin Feature"' | Select Name,EnabledScopes
EnabledScopes 为空 = 未启用；非空 (含林配置分区 DN) = 已启用
启用命令 (林功能级别需 >= 2008R2，不可逆):
  Enable-ADOptionalFeature 'Recycle Bin Feature' -Scope ForestOrConfigurationSet -Target '<林FQDN>'
未启用回收站时被删对象只留墓碑，恢复后属性大量丢失 (密码/组成员等)。`,
        example:
          'Get-ADOptionalFeature -Filter \'Name -like "Recycle Bin Feature"\' | Select-Object Name,EnabledScopes',
      },
      {
        id: 'ps-list-deleted-objects',
        title: '列出所有已删除对象',
        description: '-IncludeDeletedObjects 枚举墓碑，看最近删了什么',
        build: () =>
          `Get-ADObject -Filter 'isDeleted -eq $true -and Name -ne "Deleted Objects"' -IncludeDeletedObjects -Properties sAMAccountName,lastKnownParent,whenChanged | Select-Object Name,sAMAccountName,lastKnownParent,whenChanged | Format-List`,
        usage: `语法: Get-ADObject -Filter 'isDeleted -eq $true -and Name -ne "Deleted Objects"' -IncludeDeletedObjects -Properties ...
isDeleted -eq $true: 匹配已删除对象；排除 "Deleted Objects" 容器本身
-IncludeDeletedObjects: 必须加，否则已删除对象对查询不可见 (官方文档原话: 不加则搜不到)
Name 形如 "原名\\nDEL:<GUID>"；lastKnownParent 是删除前父容器；whenChanged 约为删除时间
加 -Server '<DC>' 指定域控；-Credential 换身份。`,
        example:
          'Get-ADObject -Filter \'isDeleted -eq $true -and Name -ne "Deleted Objects"\' -IncludeDeletedObjects -Properties sAMAccountName,lastKnownParent,whenChanged | Select-Object Name,sAMAccountName,lastKnownParent,whenChanged | Format-List',
      },
      {
        id: 'ps-find-deleted-user',
        title: '按名字查找特定被删对象',
        description: '用 msDS-LastKnownRDN 精确定位删除前的对象名 (官方推荐)',
        build: (p) =>
          `Get-ADObject -LDAPFilter '(msDS-LastKnownRDN=${v(p.targetObject, 'DELETED_NAME')})' -IncludeDeletedObjects -Properties * | Format-List`,
        usage: `语法: Get-ADObject -LDAPFilter '(msDS-LastKnownRDN=<原名称>)' -IncludeDeletedObjects -Properties *
msDS-LastKnownRDN: 对象被删除前的 RDN (如原 CN=olduser 则值为 olduser)，是微软文档推荐的定位方式
也可以用显示名模糊匹配: -Filter 'Deleted -eq $true -and Name -like "*olduser*"' -IncludeDeletedObjects
-Properties * 看保留了哪些属性 (回收站开启时大部分属性原样保留)
拿到输出里的 ObjectGUID 或 DistinguishedName 后即可 Restore-ADObject。`,
        example:
          "Get-ADObject -LDAPFilter '(msDS-LastKnownRDN=olduser)' -IncludeDeletedObjects -Properties * | Format-List",
      },
      {
        id: 'ps-restore-adobject',
        title: '恢复单个已删除对象',
        description: 'Restore-ADObject 按 GUID/墓碑 DN 恢复',
        build: (p) =>
          `Restore-ADObject -Identity '${v(p.targetObject, 'OBJECT_GUID')}'`,
        usage: `语法: Restore-ADObject -Identity '<ObjectGUID 或 墓碑DN>'
-Identity: 被删对象的 GUID (推荐，Get-ADObject -IncludeDeletedObjects 输出里的 ObjectGUID)
  或完整墓碑 DN: CN=olduser\\0ADEL:<GUID>,CN=Deleted Objects,DC=corp,DC=local
  (LDAP 里的 \\n 在 DN 写法中是 \\0A)
-TargetPath: 恢复到指定容器，如 -TargetPath 'OU=Users,DC=corp,DC=local'；缺省回 lastKnownParent
-Confirm:$false 跳过确认；-Server 指定 DC
恢复用户后: Enable-ADAccount + Set-ADAccountPassword 重置密码才能用。`,
        example:
          "Restore-ADObject -Identity 'a8e28b5e-5d2a-4c1a-9b3f-1f2e3d4c5b6a' -TargetPath 'CN=Users,DC=corp,DC=local'",
      },
      {
        id: 'ps-restore-pipeline',
        title: '查找并恢复一条龙 (管道)',
        description: 'Get-ADObject ... | Restore-ADObject 一步完成',
        build: (p) =>
          `Get-ADObject -LDAPFilter '(msDS-LastKnownRDN=${v(p.targetObject, 'DELETED_NAME')})' -IncludeDeletedObjects | Restore-ADObject`,
        usage: `语法: Get-ADObject -LDAPFilter '(msDS-LastKnownRDN=<原名称>)' -IncludeDeletedObjects | Restore-ADObject
官方文档标准用法：查询结果直接管道给 Restore-ADObject
恢复后验证: Get-ADUser -Identity '<名称>' / Get-ADObject -Filter 'Name -eq "<名称>"'
批量恢复某 OU 下全部被删对象:
  Get-ADObject -Filter 'isDeleted -eq $true' -IncludeDeletedObjects | ? lastKnownParent -like '*OU=Sales*' | Restore-ADObject
非 PowerShell 环境替代: bloodyAD -d <域> -u <用户> -p <密码> -H <DC> set restore <原名称>`,
        example:
          "Get-ADObject -LDAPFilter '(msDS-LastKnownRDN=olduser)' -IncludeDeletedObjects | Restore-ADObject",
      },
      {
        id: 'ps-enable-after-restore',
        title: '恢复后启用账户并重置密码',
        description: '被恢复的用户默认禁用，需启用 + 改密',
        build: (p) =>
          `Enable-ADAccount -Identity '${v(p.targetObject, 'TARGET_USER')}'; Set-ADAccountPassword -Identity '${v(p.targetObject, 'TARGET_USER')}' -NewPassword (ConvertTo-SecureString '${v(p.password, 'NEWPASS')}' -AsPlainText -Force) -Reset`,
        usage: `语法: Enable-ADAccount -Identity '<用户>'; Set-ADAccountPassword -Identity '<用户>' -NewPassword (ConvertTo-SecureString '<新密码>' -AsPlainText -Force) -Reset
恢复的账户处于禁用状态: 先 Enable-ADAccount 启用
-Reset: 管理员强制重置 (不需要旧密码)；不加则需 -OldPassword
顺手清除"下次登录必须改密": Set-ADUser -Identity '<用户>' -ChangePasswordAtLogon $false`,
        example:
          "Enable-ADAccount -Identity 'olduser'; Set-ADAccountPassword -Identity 'olduser' -NewPassword (ConvertTo-SecureString 'NewP@ss123' -AsPlainText -Force) -Reset",
      },
    ],
  },
  {
    id: 'ps-adsi',
    name: 'PowerShell 免模块查询 (ADSI/DirectorySearcher)',
    category: 'PowerShell',
    homepage: 'https://learn.microsoft.com/en-us/dotnet/api/system.directoryservices.directorysearcher',
    description: '目标机没有 RSAT 模块时用 .NET ADSI 直连 LDAP 查属性',
    guide: `【免 RSAT 查询】(System.DirectoryServices, .NET 内置)
很多突破口机器没有 ActiveDirectory 模块 (RSAT)，但 .NET 的
System.DirectoryServices (ADSI) 是 Framework 自带的，可直接 LDAP 查询:
- [ADSI]"LDAP://<DN>" 绑定单个对象，.Properties 读属性
- [adsisearcher] 类型加速器 = New-Object System.DirectoryServices.DirectorySearcher
  Filter 属性即 RFC 4515 LDAP 过滤器，与 ldapsearch 过滤器完全通用
- 指定 DC/凭据: [ADSI]"LDAP://<DC>/<DN>" 或 new-object 带 credential 的 DirectoryEntry
查询走当前会话凭据 (runas /netonly 或已获取的 shell 上下文)`,
    commands: [
      {
        id: 'ps-adsi-object-props',
        title: '[ADSI] 查看对象全部属性',
        description: '绑定对象 DN，直接读 .Properties',
        build: (p) =>
          `([ADSI]"LDAP://${v(p.dcFQDN || p.dcIP, 'DC')}/${v(p.targetObject, 'CN=Administrator,CN=Users,DC=corp,DC=local')}").Properties | Format-List`,
        usage: `语法: ([ADSI]"LDAP://<DC>/<对象DN>").Properties | Format-List
[ADSI] 类型加速器创建 DirectoryEntry；LDAP://<DC>/<DN> 指定服务器和对象 (DC 可省略用默认)
.Properties: 全部属性集合；读单条: ([ADSI]"LDAP://...").Properties['servicePrincipalName']
属性值刷新: $obj.RefreshCache()；写属性: $obj.Put('description','x'); $obj.SetInfo()`,
        example:
          '([ADSI]"LDAP://10.0.0.1/CN=Administrator,CN=Users,DC=corp,DC=local").Properties | Format-List',
      },
      {
        id: 'ps-adsi-searcher-user',
        title: '[adsisearcher] 按 sAMAccountName 查属性',
        description: '不知道 DN 时用搜索器定位对象',
        build: (p) =>
          `([adsisearcher]'(sAMAccountName=${v(p.targetObject, 'TARGET_USER')})').FindOne().Properties | Format-List`,
        usage: `语法: ([adsisearcher]'(<LDAP过滤器>)').FindOne().Properties | Format-List
[adsisearcher] = DirectorySearcher 类型加速器，字符串参数即 RFC 4515 过滤器
.FindOne(): 第一个匹配 (.FindAll() 全部)；.Properties 是该对象的属性集合
列出全部匹配的属性名: ...FindAll() | % { $_.Properties.PropertyNames }
指定 DC: $s = New-Object DirectoryServices.DirectorySearcher([ADSI]"LDAP://<DC>", '(filter)')`,
        example:
          "([adsisearcher]'(sAMAccountName=sqlsvc)').FindOne().Properties | Format-List",
      },
      {
        id: 'ps-adsi-searcher-spn',
        title: '[adsisearcher] 枚举 Kerberoastable 账户',
        description: '经典一行流，替代 GetUserSPNs 的纯查询部分',
        build: () =>
          `([adsisearcher]'(&(objectCategory=person)(objectClass=user)(servicePrincipalName=*))').FindAll() | ForEach-Object { $_.Properties['samaccountname'][0]; $_.Properties['serviceprincipalname'] }`,
        usage: `语法: ([adsisearcher]'(&(objectCategory=person)(objectClass=user)(servicePrincipalName=*))').FindAll() | % { $_.Properties['samaccountname'][0]; $_.Properties['serviceprincipalname'] }
过滤器与 ldapsearch 完全相同 (位匹配/IN_CHAIN 都支持)
把过滤器换成 (userAccountControl:1.2.840.113556.1.4.803:=524288) 即查无约束委派
属性值为集合，取第一个元素用 [0]；多值属性 (SPN/memberOf) 直接输出整个集合。`,
        example:
          "([adsisearcher]'(&(objectCategory=person)(objectClass=user)(servicePrincipalName=*))').FindAll() | ForEach-Object { $_.Properties['samaccountname'][0]; $_.Properties['serviceprincipalname'] }",
      },
      {
        id: 'ps-adsi-cred',
        title: '[ADSI] 指定凭据与 DC 查询',
        description: 'new-object DirectoryEntry 带用户密码，非域机器也能查',
        build: (p) =>
          `$entry = New-Object System.DirectoryServices.DirectoryEntry("LDAP://${v(p.dcFQDN || p.dcIP, 'DC')}/${v(domainDN(p), 'DC=corp,DC=local')}", '${v(p.domain, 'DOMAIN')}\\${v(p.username, 'USER')}', '${v(p.password, 'PASSWORD')}'); (New-Object System.DirectoryServices.DirectorySearcher($entry, '(sAMAccountName=${v(p.targetObject, 'TARGET_USER')})')).FindOne().Properties | Format-List`,
        usage: `语法: $entry = New-Object DirectoryEntry("LDAP://<DC>/<BASE_DN>", '<域>\\<用户>', '<密码>'); (New-Object DirectorySearcher($entry, '<过滤器>')).FindOne().Properties
DirectoryEntry 构造函数第 2/3 参数即显式凭据，不依赖当前会话身份
等价于 ldapsearch 的 -D/-w 简单绑定；从非域机器 (工作组跳板) 查询域内属性就靠这个
LDAP:// 大写必须；LDAPS 同样支持: LDAPS://<DC>:636/<DN>`,
        example:
          "$entry = New-Object System.DirectoryServices.DirectoryEntry('LDAP://10.0.0.1/DC=corp,DC=local', 'corp\\lowpriv', 'Password123'); (New-Object System.DirectoryServices.DirectorySearcher($entry, '(sAMAccountName=sqlsvc)')).FindOne().Properties | Format-List",
      },
      {
        id: 'ps-adsi-current-domain',
        title: '当前域/林信息一行流',
        description: '不装模块也能拿域名、DC 列表、PDC',
        build: () =>
          `[System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain() | Format-List Name,PdcRoleOwner,DomainControllers; [System.DirectoryServices.ActiveDirectory.Forest]::GetCurrentForest() | Format-List Name,Domains`,
        usage: `语法: [System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()
返回当前计算机/用户所在域对象: Name (域名)、PdcRoleOwner (PDC)、DomainControllers (全部 DC)
Forest::GetCurrentForest(): 林名与林中所有域
拿到 PDC 名后拼 LDAP 路径: "LDAP://" + $domain.PdcRoleOwner.Name`,
        example:
          '[System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain() | Format-List Name,PdcRoleOwner,DomainControllers',
      },
    ],
  },
];
