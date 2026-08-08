export interface FieldDefinition {
  key: string;
  label: string;
  placeholder: string;
  group: 'credentials' | 'target' | 'dc' | 'local' | 'advanced';
  type?: 'text' | 'password';
}

export const fieldDefinitions: FieldDefinition[] = [
  // Credentials group
  { key: 'domain', label: '域名 Domain', placeholder: 'CORP.LOCAL', group: 'credentials' },
  { key: 'username', label: '用户名 Username', placeholder: 'administrator', group: 'credentials' },
  { key: 'password', label: '密码 Password', placeholder: 'P@ssw0rd', group: 'credentials', type: 'password' },
  { key: 'ntHash', label: 'NT Hash', placeholder: 'a87f3a337d73085c45f9416be5787d86', group: 'credentials' },
  { key: 'lmHash', label: 'LM Hash (可选)', placeholder: 'aad3b435b51404eeaad3b435b51404ee', group: 'credentials' },
  { key: 'aesKey', label: 'AES256 Key', placeholder: 'a87f3a337d73085c...', group: 'credentials' },
  { key: 'ccachePath', label: 'Ccache Path', placeholder: '/tmp/krb5cc_1000', group: 'credentials' },

  // Target group
  { key: 'targetIP', label: '目标 IP', placeholder: '192.168.1.100', group: 'target' },
  { key: 'targetHost', label: '目标主机名', placeholder: 'DC01.corp.local', group: 'target' },
  { key: 'targetPort', label: '目标端口', placeholder: '445', group: 'target' },

  // DC group
  { key: 'dcIP', label: 'DC IP', placeholder: '192.168.1.10', group: 'dc' },
  { key: 'dcFQDN', label: 'DC FQDN', placeholder: 'DC01.corp.local', group: 'dc' },

  // Local group
  { key: 'localIP', label: '本地 IP', placeholder: '192.168.1.50', group: 'local' },
  { key: 'localPort', label: '本地端口', placeholder: '4444', group: 'local' },

  // Advanced group
  { key: 'spn', label: 'SPN', placeholder: 'HTTP/web.corp.local', group: 'advanced' },
  { key: 'certTemplate', label: '证书模板', placeholder: 'User', group: 'advanced' },
  { key: 'caName', label: 'CA Name', placeholder: 'CORP-DC-CA', group: 'advanced' },
  { key: 'bloodhoundZip', label: 'BloodHound Zip', placeholder: '20240808_bloodhound.zip', group: 'advanced' },
];

export const fieldGroups = [
  { id: 'credentials', name: '凭据 Credentials' },
  { id: 'target', name: '目标 Target' },
  { id: 'dc', name: '域控 DC' },
  { id: 'local', name: '本地 Local' },
  { id: 'advanced', name: '高级 Advanced' },
] as const;
