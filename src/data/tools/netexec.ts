import type { Tool } from '../../types';
import { buildNetExecAuth, buildEvilWinRMAuth, v } from '../../lib/auth';

export const netexecTools: Tool[] = [
  {
    id: 'nxc-smb',
    name: 'NetExec SMB',
    category: 'netexec',
    homepage: 'https://github.com/Pennyw0rth/NetExec',
    description: 'SMB 协议枚举和利用',
    commands: [
      {
        id: 'nxc-smb-enum',
        title: 'SMB 基础枚举',
        build: (p) => buildNetExecAuth(p, 'smb'),
      },
      {
        id: 'nxc-smb-shares',
        title: '枚举共享',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --shares`,
      },
      {
        id: 'nxc-smb-users',
        title: '枚举域用户',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --users`,
      },
      {
        id: 'nxc-smb-groups',
        title: '枚举域组',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --groups`,
      },
      {
        id: 'nxc-smb-pass-pol',
        title: '枚举密码策略',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --pass-pol`,
      },
      {
        id: 'nxc-smb-sam',
        title: '导出本地 SAM',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --sam`,
      },
      {
        id: 'nxc-smb-lsa',
        title: '导出 LSA 秘密',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --lsa`,
      },
      {
        id: 'nxc-smb-ntds',
        title: 'DCSync 导出 NTDS',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --ntds`,
      },
      {
        id: 'nxc-smb-spider',
        title: 'Spider 爬取共享文件',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --spider C$ --pattern txt`,
      },
      {
        id: 'nxc-smb-exec',
        title: 'SMB 执行命令',
        build: (p) => `${buildNetExecAuth(p, 'smb')} -x "whoami"`,
      },
      {
        id: 'nxc-smb-put',
        title: '上传文件',
        build: (p) => `${buildNetExecAuth(p, 'smb')} --put-file /local/file.txt C:\\\\Windows\\\\Temp\\\\file.txt`,
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
        build: (p) => buildNetExecAuth(p, 'winrm'),
      },
      {
        id: 'nxc-winrm-exec',
        title: 'WinRM 执行命令',
        build: (p) => `${buildNetExecAuth(p, 'winrm')} -x "ipconfig"`,
      },
    ],
  },
  {
    id: 'nxc-ldap',
    name: 'NetExec LDAP',
    category: 'netexec',
    homepage: 'https://github.com/Pennyw0rth/NetExec',
    description: 'LDAP 枚举和 BloodHound 采集',
    commands: [
      {
        id: 'nxc-ldap-enum',
        title: 'LDAP 枚举',
        build: (p) => buildNetExecAuth(p, 'ldap'),
      },
      {
        id: 'nxc-ldap-bloodhound',
        title: 'BloodHound 数据采集',
        build: (p) => `${buildNetExecAuth(p, 'ldap')} --bloodhound -c All`,
      },
      {
        id: 'nxc-ldap-users',
        title: '枚举域用户',
        build: (p) => `${buildNetExecAuth(p, 'ldap')} --users`,
      },
      {
        id: 'nxc-ldap-groups',
        title: '枚举域管理员组',
        build: (p) => `${buildNetExecAuth(p, 'ldap')} --groups`,
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
        build: (p) => buildNetExecAuth(p, 'mssql'),
      },
      {
        id: 'nxc-mssql-query',
        title: 'MSSQL 执行查询',
        build: (p) => `${buildNetExecAuth(p, 'mssql')} -q "SELECT @@version"`,
      },
      {
        id: 'nxc-mssql-xpcmd',
        title: 'MSSQL xp_cmdshell 执行命令',
        build: (p) => `${buildNetExecAuth(p, 'mssql')} -x "whoami"`,
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
        build: (p) => buildEvilWinRMAuth(p),
      },
      {
        id: 'evil-winrm-ssl',
        title: 'Evil-WinRM SSL 连接',
        build: (p) => `${buildEvilWinRMAuth(p)} -S`,
      },
      {
        id: 'evil-winrm-exec',
        title: 'Evil-WinRM 执行脚本',
        build: (p) => `${buildEvilWinRMAuth(p)} -s /path/to/scripts`,
      },
    ],
  },
  {
    id: 'smbclient',
    name: 'smbclient',
    category: 'netexec',
    homepage: 'https://www.samba.org/',
    description: 'SMB 客户端交互',
    commands: [
      {
        id: 'smbclient-list',
        title: '列举共享',
        build: (p) => `smbclient -L //${v(p.targetIP, 'TARGET')} -U ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')}%${v(p.password, 'PASSWORD')}`,
      },
      {
        id: 'smbclient-connect',
        title: '连接共享',
        build: (p) => `smbclient //${v(p.targetIP, 'TARGET')}/C$ -U ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')}%${v(p.password, 'PASSWORD')}`,
      },
    ],
  },
];
