import type { Tool } from '../../types';
import { impacketExecTools } from './impacket/exec';
import { impacketKerberosTools } from './impacket/kerberos';
import { impacketCredsTools } from './impacket/creds';
import { impacketAdAttackTools } from './impacket/adattack';
import { impacketEnumTools } from './impacket/enum';
import { impacketSmbTools } from './impacket/smb';
import { impacketMiscTools } from './impacket/misc';

/**
 * impacket 模块 —— 覆盖 Kali impacket-scripts 包全部 60 个命令 (impacket-<name>)
 * 按主题拆分为 7 个数据文件,每条参数与本机 impacket v0.14.0.dev0
 * 官方 examples 脚本 argparse 定义逐一核对
 * 参考: https://github.com/fortra/impacket/tree/master/examples
 *
 * 通用 target 格式: [[domain/]username[:password]@]<targetName or address>
 * 通用认证参数:   -hashes LMHASH:NTHASH | -k -no-pass | -aesKey <hex key> -k
 * 各工具 argparse 能力差异通过 buildImpacketAuth 的 caps 参数按工具关闭
 */
export const impacketTools: Tool[] = [
  ...impacketExecTools,      // 远程执行: psexec/wmiexec/smbexec/atexec/dcomexec
  ...impacketCredsTools,     // 凭据导出: secretsdump/dpapi/mimikatz/LAPS/GPP/changepasswd
  ...impacketKerberosTools,  // Kerberos: roasting/票据请求/伪造/转换
  ...impacketAdAttackTools,  // AD 权限攻击: dacledit/owneredit/rbcd/addcomputer/raiseChild/ntlmrelayx
  ...impacketEnumTools,      // 枚举: lookupsid/samrdump/rpc*/net/LDAP 查询等
  ...impacketSmbTools,       // SMB/文件/注册表: smbclient/smbserver/reg/services 等
  ...impacketMiscTools,      // 其他: mssqlclient/wmi/sniff/exchanger 等
];
