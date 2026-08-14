import type { Profile } from '../types';

const EMPTY_LM_HASH = 'aad3b435b51404eeaad3b435b51404ee';

/**
 * Placeholder helper - returns value or <PLACEHOLDER> if empty
 */
export function v(value: string | undefined, placeholder: string): string {
  return value && value.trim() !== '' ? value : `<${placeholder}>`;
}

/**
 * Build Impacket-style target string: DOMAIN/USER[:PASS]@HOST
 * Plus auth flags based on profile.authMode
 */
export function buildImpacketAuth(p: Profile): string {
  const domain = v(p.domain, 'DOMAIN');
  const user = v(p.username, 'USER');
  const host = v(p.targetIP || p.targetHost, 'TARGET');

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
      authFlags = `-k -no-pass`;
      break;
    }
    case 'aeskey': {
      const aes = v(p.aesKey, 'AESKEY');
      target = `${domain}/${user}@${host}`;
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
 * Build Certipy auth string
 * certipy <command> -u USER@DOMAIN (-p PASS | -hashes :NT | -k) -dc-ip DCIP
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
    case 'kerberos':
    case 'aeskey': {
      authFlags = `-k`;
      break;
    }
  }

  return `certipy ${command} -u ${user}@${domain} ${authFlags} -dc-ip ${dcIP}`.trim();
}
