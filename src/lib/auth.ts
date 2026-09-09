import type { Profile } from '../types';

const EMPTY_LM_HASH = 'aad3b435b51404eeaad3b435b51404ee';

/**
 * Placeholder helper - returns value or <PLACEHOLDER> if empty
 */
export function v(value: string | undefined, placeholder: string): string {
  return value && value.trim() !== '' ? value : `<${placeholder}>`;
}

/**
 * Shell 单引号包裹 (密码等可能含 $ ! 空格等特殊字符的值)。
 * 已验证: 单引号在 shell 解析阶段被剥离，argv 与不加引号完全一致，
 * impacket 的 parse_identity/parse_target 收到的字符串不受影响；
 * 不加引号时含 $ ! & ; 空格 的密码反而会被 shell 展开/截断。
 * 内嵌单引号按 POSIX 规范转义为 '\''。
 */
export function q(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/**
 * 由域名推导 Base DN: corp.local -> DC=corp,DC=local
 * 域名未填时返回 undefined (配合 v() 显示占位符)
 */
export function domainDN(p: Profile): string | undefined {
  const d = p.domain?.trim();
  if (!d) return undefined;
  return d.split('.').filter(Boolean).map(part => `DC=${part}`).join(',');
}

/**
 * 目标地址解析: 目标即域控时只需填 DC IP —— targetIP/targetHost 留空自动回退。
 * Kerberos 认证按 SPN 匹配主机名，优先主机名；其余优先 IP。
 */
export function targetAddress(p: Profile, kerberos: boolean): string {
  if (kerberos) {
    return v(p.targetHost || p.targetIP || p.dcFQDN || p.dcIP, 'TARGET');
  }
  return v(p.targetIP || p.targetHost || p.dcIP || p.dcFQDN, 'TARGET');
}

/**
 * impacket 各 example 脚本的 argparse 能力差异很大，不能一刀切:
 * - lookupsid/rpcdump 没有 -dc-ip
 * - rpcdump 没有任何 Kerberos 参数 (-k/-no-pass/-aesKey)
 * - lookupsid 没有 -aesKey
 * - 只有部分工具有 -target-ip (atexec/dcomexec/域查询类工具都没有)
 * 以下默认值与 impacket 官方 examples 的 argparse 定义一致，
 * 不支持某项的工具在调用处显式关闭。
 */
export interface ImpacketCaps {
  /** 支持 -dc-ip (默认 true；lookupsid/rpcdump 为 false) */
  dcIp?: boolean;
  /** 支持 Kerberos 认证 -k/-no-pass (默认 true；rpcdump 为 false) */
  kerberos?: boolean;
  /** 支持 -aesKey (默认 true；lookupsid 为 false) */
  aesKey?: boolean;
  /** 支持 -target-ip (默认 false；secretsdump/psexec/wmiexec/smbexec/mssqlclient/smbclient/lookupsid/rpcdump 为 true) */
  targetIp?: boolean;
}

/**
 * Build Impacket-style target string: [[domain/]USER[:PASS]@]HOST
 * plus auth flags per profile.authMode, constrained by the tool's argparse caps.
 * Kerberos 认证时 SPN 按主机名匹配，因此 target 优先使用主机名而非 IP。
 */
export function buildImpacketAuth(p: Profile, caps: ImpacketCaps = {}): string {
  const { dcIp = true, kerberos = true, aesKey = true, targetIp = false } = caps;

  const domain = v(p.domain, 'DOMAIN');
  const user = v(p.username, 'USER');
  const useKerberosTarget = p.authMode === 'kerberos' || p.authMode === 'aeskey';
  const host = targetAddress(p, useKerberosTarget);

  let target = '';
  const flags: string[] = [];

  switch (p.authMode) {
    case 'password': {
      const pass = q(v(p.password, 'PASSWORD'));
      target = `${domain}/${user}:${pass}@${host}`;
      break;
    }
    case 'hash': {
      const lm = p.lmHash?.trim() || EMPTY_LM_HASH;
      const nt = v(p.ntHash, 'NTHASH');
      target = `${domain}/${user}@${host}`;
      flags.push(`-hashes ${lm}:${nt}`);
      break;
    }
    case 'kerberos': {
      target = `${domain}/${user}@${host}`;
      if (kerberos) flags.push('-k -no-pass');
      break;
    }
    case 'aeskey': {
      const aes = v(p.aesKey, 'AESKEY');
      target = `${domain}/${user}@${host}`;
      if (aesKey) flags.push(`-aesKey ${aes} -k`);
      else if (kerberos) flags.push('-k -no-pass');
      break;
    }
  }

  // -target-ip: 主机名无法解析时指定目标 IP (仅部分工具支持)
  if (targetIp && p.targetHost?.trim() && p.targetIP?.trim()) {
    flags.push(`-target-ip ${p.targetIP.trim()}`);
  }

  // -dc-ip: 指定域控 IP (域查询/Kerberos 场景常用)
  // 当 DC IP 与解析出的目标地址相同 (目标即 DC) 时省略，避免命令中同一 IP 出现两次
  if (dcIp && p.dcIP?.trim() && p.dcIP.trim() !== host.trim()) {
    flags.push(`-dc-ip ${p.dcIP.trim()}`);
  }

  return [target, ...flags].join(' ');
}

/**
 * Build Impacket domain-style target string: DOMAIN[/USER[:PASS]]
 * Used by LDAP/Kerberos query tools whose target is a domain identity,
 * NOT a host: GetUserSPNs, GetNPUsers, GetADUsers, findDelegation, getTGT.
 * (Verified against argparse 'target'/'identity' definitions in impacket examples)
 */
export function buildImpacketDomainAuth(p: Profile): string {
  const domain = v(p.domain, 'DOMAIN');
  const user = v(p.username, 'USER');

  let target = '';
  const flags: string[] = [];

  switch (p.authMode) {
    case 'password': {
      const pass = q(v(p.password, 'PASSWORD'));
      target = `${domain}/${user}:${pass}`;
      break;
    }
    case 'hash': {
      const lm = p.lmHash?.trim() || EMPTY_LM_HASH;
      const nt = v(p.ntHash, 'NTHASH');
      target = `${domain}/${user}`;
      flags.push(`-hashes ${lm}:${nt}`);
      break;
    }
    case 'kerberos': {
      target = `${domain}/${user}`;
      flags.push('-k -no-pass');
      break;
    }
    case 'aeskey': {
      const aes = v(p.aesKey, 'AESKEY');
      target = `${domain}/${user}`;
      flags.push(`-aesKey ${aes} -k`);
      break;
    }
  }

  // Add DC IP if present
  if (p.dcIP?.trim()) {
    flags.push(`-dc-ip ${p.dcIP.trim()}`);
  }

  return [target, ...flags].join(' ');
}

/**
 * Build bloodyAD global auth prefix
 * bloodyAD [-d DOMAIN] [-u USER] [-p PASS | -k] [-f FORMAT] -H DC_HOST [-i DC_IP] <category> <subcommand> ...
 * (Verified against bloodyAD v2.5.4 argparse)
 * -p 接受明文密码或 LMHASH:NTHASH；Kerberos 用 -k（可配合 -f aes -p <AES Key>）
 * -H 为必填：DC 的主机名或 IP；-i 在主机名无法解析时指定 DC IP
 */
export function buildBloodyADAuth(p: Profile): string {
  const domain = v(p.domain, 'DOMAIN');
  const user = v(p.username, 'USER');
  const host = v(p.dcFQDN || p.dcIP, 'DC_HOST');

  let authFlags = '';

  switch (p.authMode) {
    case 'password': {
      const pass = q(v(p.password, 'PASSWORD'));
      authFlags = `-p ${pass}`;
      break;
    }
    case 'hash': {
      const lm = p.lmHash?.trim() || EMPTY_LM_HASH;
      const nt = v(p.ntHash, 'NTHASH');
      authFlags = `-p ${lm}:${nt}`;
      break;
    }
    case 'kerberos': {
      authFlags = `-k`;
      break;
    }
    case 'aeskey': {
      const aes = v(p.aesKey, 'AESKEY');
      authFlags = `-k -f aes -p ${aes}`;
      break;
    }
  }

  let extra = '';
  // -i: --host 无法解析时指定 DC IP
  if (p.dcFQDN?.trim() && p.dcIP?.trim()) {
    extra = ` -i ${p.dcIP}`;
  }

  return `bloodyAD -d ${domain} -u ${user} ${authFlags} -H ${host}${extra}`;
}

/**
 * Build NetExec (nxc) auth string
 * nxc <protocol> <target> -u USER -d DOMAIN (-p PASS | -H HASH | -k)
 */
export function buildNetExecAuth(p: Profile, protocol: string = 'smb'): string {
  const target = targetAddress(p, p.authMode === 'kerberos' || p.authMode === 'aeskey');
  const user = v(p.username, 'USER');
  const domain = v(p.domain, 'DOMAIN');

  let authFlags = '';

  switch (p.authMode) {
    case 'password': {
      const pass = q(v(p.password, 'PASSWORD'));
      authFlags = `-p ${pass}`;
      break;
    }
    case 'hash': {
      const nt = v(p.ntHash, 'NTHASH');
      authFlags = `-H ${nt}`;
      break;
    }
    case 'kerberos':
    case 'aeskey': {
      authFlags = `-k`;
      break;
    }
  }

  return `nxc ${protocol} ${target} -u ${user} -d ${domain} ${authFlags}`.trim();
}

/**
 * Build Evil-WinRM auth string
 * evil-winrm -i HOST -u USER (-p PASS | -H HASH)
 */
export function buildEvilWinRMAuth(p: Profile): string {
  const host = targetAddress(p, false);
  const user = v(p.username, 'USER');

  let authFlags = '';

  switch (p.authMode) {
    case 'password': {
      const pass = q(v(p.password, 'PASSWORD'));
      authFlags = `-p ${pass}`;
      break;
    }
    case 'hash':
    case 'kerberos':
    case 'aeskey': {
      const nt = v(p.ntHash, 'NTHASH');
      authFlags = `-H ${nt}`;
      break;
    }
  }

  return `evil-winrm -i ${host} -u ${user} ${authFlags}`.trim();
}

/**
 * Build Certipy v5 (certipy-ad) auth string
 * certipy-ad <command> -u USER@DOMAIN (-p PASS | -hashes [LM:]NT | -k -no-pass | -aes KEY -k) -dc-ip DCIP
 * (Verified against certipy-ad v5.0.4 argparse; v5 将 v4 的 -aesKey 改名为 -aes)
 */
export function buildCertipyAuth(p: Profile, command: string): string {
  const user = v(p.username, 'USER');
  const domain = v(p.domain, 'DOMAIN');
  const dcIP = v(p.dcIP, 'DC_IP');

  let authFlags = '';

  switch (p.authMode) {
    case 'password': {
      const pass = q(v(p.password, 'PASSWORD'));
      authFlags = `-p ${pass}`;
      break;
    }
    case 'hash': {
      const nt = v(p.ntHash, 'NTHASH');
      authFlags = `-hashes :${nt}`;
      break;
    }
    case 'kerberos': {
      authFlags = `-k -no-pass`;
      break;
    }
    case 'aeskey': {
      const aes = v(p.aesKey, 'AESKEY');
      authFlags = `-aes ${aes} -k`;
      break;
    }
  }

  return `certipy-ad ${command} -u ${user}@${domain} ${authFlags} -dc-ip ${dcIP}`.trim();
}

export interface LdapsearchOpts {
  /** 使用 LDAPS (ldaps://, 636)；默认 ldap:// 389 */
  ldaps?: boolean;
  /** StartTLS (-ZZ 强制成功)，与 ldaps 互斥 */
  starttls?: boolean;
  /** 匿名绑定 (不携带任何凭据) */
  anonymous?: boolean;
}

/**
 * Build ldapsearch auth prefix
 * 参数定义来源: 本机 OpenLDAP 2.6.10 man ldapsearch
 * 简单绑定:  ldapsearch -x -H ldap://DC -D 'USER@DOMAIN' -w 'PASS' -b 'BASE_DN'
 * Kerberos:  KRB5CCNAME=<ccache> ldapsearch -Y GSSAPI -N -H ldap://DC_FQDN -b 'BASE_DN'
 * 注意: OpenLDAP ldapsearch 不支持 NTLM 哈希传递，hash 模式回退为明文密码占位符；
 *       aeskey 模式需先用 getTGT 换取 ccache 票据再走 GSSAPI。
 */
export function buildLdapsearchAuth(p: Profile, opts: LdapsearchOpts = {}): string {
  const scheme = opts.ldaps ? 'ldaps' : 'ldap';
  const useKerberos =
    !opts.anonymous && (p.authMode === 'kerberos' || p.authMode === 'aeskey');
  // GSSAPI 按 SPN 匹配，必须用 DC 主机名；简单绑定 IP 即可
  const host = useKerberos
    ? v(p.dcFQDN || p.dcIP, 'DC_HOST')
    : v(p.dcIP || p.dcFQDN, 'DC_HOST');
  const uri = `${scheme}://${host}`;
  const base = q(v(domainDN(p), 'BASE_DN'));
  const tlsFlag = opts.starttls ? '-ZZ ' : '';

  if (opts.anonymous) {
    return `ldapsearch -x ${tlsFlag}-H ${uri} -b ${base}`;
  }

  switch (p.authMode) {
    case 'kerberos':
    case 'aeskey': {
      const ccache = v(p.ccachePath, '/tmp/krb5cc_0');
      return `KRB5CCNAME=${ccache} ldapsearch -Y GSSAPI -N ${tlsFlag}-H ${uri} -b ${base}`;
    }
    default: {
      // password 与 hash (ldapsearch 无法 PtH，统一用密码占位符)
      const user = v(p.username, 'USER');
      const domain = v(p.domain, 'DOMAIN');
      const pass = q(v(p.password, 'PASSWORD'));
      return `ldapsearch -x ${tlsFlag}-H ${uri} -D ${q(`${user}@${domain}`)} -w ${pass} -b ${base}`;
    }
  }
}
