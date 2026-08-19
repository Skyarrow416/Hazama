export type AuthMode = 'password' | 'hash' | 'kerberos' | 'aeskey';

export interface Profile {
  // Core credentials
  domain: string;
  username: string;
  password: string;

  // Hash auth
  lmHash: string;
  ntHash: string;

  // Kerberos/AES
  aesKey: string;
  ccachePath: string;

  // Target info
  targetIP: string;
  targetHost: string;
  targetPort: string;

  // Domain Controller
  dcIP: string;
  dcFQDN: string;

  // Local attacker info
  localIP: string;
  localPort: string;

  // Tool-specific
  spn: string;
  certTemplate: string;
  caName: string;
  bloodhoundZip: string;
  domainSid: string;

  // File transfer
  fileName: string;
  remotePath: string;

  // Auth mode selector
  authMode: AuthMode;
}

export interface Command {
  id: string;
  title: string;
  description?: string;
  build: (profile: Profile) => string;
  /** 详细用法说明：逐参数解释，内容严格对照官方 argparse 定义 */
  usage?: string;
  /** 填好参数的实际样例命令（静态字符串，供参考对照） */
  example?: string;
  note?: string;
  uses?: (keyof Profile)[];
}

export interface Tool {
  id: string;
  name: string;
  category: string;
  homepage?: string;
  description: string;
  /** 工具级指南：整体用法/背景知识（如 bloodyAD 的 ACL 简介），逐行渲染 */
  guide?: string;
  commands: Command[];
}

export interface Category {
  id: string;
  name: string;
  tools: Tool[];
}
