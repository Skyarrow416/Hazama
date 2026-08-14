import type { Category } from '../../types';
import { impacketTools } from './impacket';
import { certipyTools } from './certipy';
import { netexecTools } from './netexec';
import { kerberosTools } from './kerberos';
import { filetransferTools } from './filetransfer';

export const categories: Category[] = [
  {
    id: 'impacket',
    name: 'Impacket',
    tools: impacketTools,
  },
  {
    id: 'certipy',
    name: 'Certipy (ADCS)',
    tools: certipyTools,
  },
  {
    id: 'netexec',
    name: 'NetExec / Evil-WinRM',
    tools: netexecTools,
  },
  {
    id: 'kerberos',
    name: 'Kerberos / BloodHound',
    tools: kerberosTools,
  },
  {
    id: 'filetransfer',
    name: '文件传输 File Transfer',
    tools: filetransferTools,
  },
];

export const allTools = categories.flatMap(cat => cat.tools);
