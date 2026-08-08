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

  // Auth mode selector
  authMode: AuthMode;
}

export interface Command {
  id: string;
  title: string;
  description?: string;
  build: (profile: Profile) => string;
  note?: string;
  uses?: (keyof Profile)[];
}

export interface Tool {
  id: string;
  name: string;
  category: string;
  homepage?: string;
  description: string;
  commands: Command[];
}

export interface Category {
  id: string;
  name: string;
  tools: Tool[];
}
