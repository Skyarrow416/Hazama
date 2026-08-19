import type { Profile } from '../types';

const EMPTY_LM_HASH = 'aad3b435b51404eeaad3b435b51404ee';

/**
 * Placeholder helper - returns value or <PLACEHOLDER> if empty
 */
export function v(value: string | undefined, placeholder: string): string {
  return value && value.trim() !== '' ? value : `<${placeholder}>`;
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
  const host = useKerberosTarget
    ? v(p.targetHost || p.targetIP, 'TARGET')
    : v(p.targetIP || p.targetHost, 'TARGET');

  let target = '';
  let authFlags = '';

  switch (p.authMode) {
    case 'password': {
      const pass = v(p.password, 'PASSWORD');
      target = `${domain}/${user}:${pass}@${host}`;
      break;
    }
    case 'hash': {
      const lm = p.lmHash?.trim() || EMPTY_LM_HASH;
      const nt = v(p.ntHash, 'NTHASH');
      target = `${domain}/${user}@${host}`;
      authFlags = `-hashes ${lm}:${nt}`;
      break;
    }
    case 'kerberos': {
      target = `${domain}/${user}@${host}`;
      if (kerberos) authFlags = `-k -no-pass`;
      break;
    }
    case 'aeskey': {
      const aes = v(p.aesKey, 'AESKEY');
      target = `${domain}/${user}@${host}`;
      if (aesKey) authFlags = `-aesKey ${aes} -k`;
      else if (kerberos) authFlags = `-k -no-pass`;
      break;
    }
  }

  // -target-ip: 主机名无法解析时指定目标 IP (仅部分工具支持)
  if (targetIp && p.targetHost?.trim() && p.targetIP?.trim()) {
    authFlags += ` -target-ip ${p.targetIP}`;
  }

  // -dc-ip: 指定域控 IP (域查询/Kerberos 场景常用)
  if (dcIp && p.dcIP?.trim()) {
    authFlags += ` -dc-ip ${p.dcIP}`;
  }

  return `${target}${authFlags ? ' ' + authFlags : ''}`;
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
  let authFlags = '';

  switch (p.authMode) {
    case 'password': {
      const pass = v(p.password, 'PASSWORD');
      target = `${domain}/${user}:${pass}`;
      break;
    }
    case 'hash': {
      const lm = p.lmHash?.trim() || EMPTY_LM_HASH;
      const nt = v(p.ntHash, 'NTHASH');
      target = `${domain}/${user}`;
      authFlags = `-hashes ${lm}:${nt}`;
      break;
    }
    case 'kerberos': {
      target = `${domain}/${user}`;
      authFlags = `-k -no-pass`;
      break;
    }
    case 'aeskey': {
      const aes = v(p.aesKey, 'AESKEY');
      target = `${domain}/${user}`;
      authFlags = `-aesKey ${aes} -k`;
      break;
    }
  }

  // Add DC IP if present
  if (p.dcIP?.trim()) {
    authFlags += ` -dc-ip ${p.dcIP}`;
  }

  return `${target}${authFlags ? ' ' + authFlags : ''}`;
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
      const pass = v(p.password, 'PASSWORD');
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
  const target = v(p.targetIP || p.targetHost, 'TARGET');
  const user = v(p.username, 'USER');
  const domain = v(p.domain, 'DOMAIN');

  let authFlags = '';

  switch (p.authMode) {
    case 'password': {
      const pass = v(p.password, 'PASSWORD');
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
  const host = v(p.targetIP || p.targetHost, 'TARGET');
  const user = v(p.username, 'USER');

  let authFlags = '';

  switch (p.authMode) {
    case 'password': {
      const pass = v(p.password, 'PASSWORD');
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
      const pass = v(p.password, 'PASSWORD');
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
