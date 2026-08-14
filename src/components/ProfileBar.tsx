import { useState } from 'react';
import { useProfileStore } from '../store';
import type { AuthMode } from '../types';

export default function ProfileBar() {
  const { profile, updateProfile, resetProfile } = useProfileStore();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const authModes: { value: AuthMode; label: string }[] = [
    { value: 'password', label: '密码' },
    { value: 'hash', label: 'NTLM Hash' },
    { value: 'kerberos', label: 'Kerberos' },
    { value: 'aeskey', label: 'AES Key' },
  ];

  // 根据认证模式决定显示密码还是哈希字段
  const showPasswordField = profile.authMode === 'password';
  const showHashField = profile.authMode === 'hash';
  const showAesField = profile.authMode === 'aeskey';
  const showKerberosField = profile.authMode === 'kerberos';

  return (
    <div className="bg-gray-900 border-b border-gray-800">
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-300">参数输入</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              {showAdvanced ? '▼ 收起高级选项' : '▶ 展开高级选项'}
            </button>
            <button
              onClick={resetProfile}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              清空
            </button>
          </div>
        </div>

        {/* Core Fields - Row 1 */}
        <div className="grid grid-cols-5 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">域名 (Domain)</label>
            <input
              type="text"
              placeholder="例如: example.com"
              value={profile.domain}
              onChange={(e) => updateProfile({ domain: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">用户名 (Username)</label>
            <input
              type="text"
              placeholder="例如: administrator"
              value={profile.username}
              onChange={(e) => updateProfile({ username: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {showPasswordField && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">密码 (Password)</label>
              <input
                type="password"
                placeholder="输入密码"
                value={profile.password}
                onChange={(e) => updateProfile({ password: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {showHashField && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">NTLM 哈希</label>
              <input
                type="text"
                placeholder="例如: aabbccdd..."
                value={profile.ntHash}
                onChange={(e) => updateProfile({ ntHash: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {showAesField && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">AES256 Key</label>
              <input
                type="text"
                placeholder="AES 密钥"
                value={profile.aesKey}
                onChange={(e) => updateProfile({ aesKey: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {showKerberosField && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ccache 路径</label>
              <input
                type="text"
                placeholder="/tmp/krb5cc_1000"
                value={profile.ccachePath}
                onChange={(e) => updateProfile({ ccachePath: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">目标 IP (Target IP)</label>
            <input
              type="text"
              placeholder="例如: 192.168.1.100"
              value={profile.targetIP}
              onChange={(e) => updateProfile({ targetIP: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">DC IP</label>
            <input
              type="text"
              placeholder="例如: 192.168.1.1"
              value={profile.dcIP}
              onChange={(e) => updateProfile({ dcIP: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Auth Mode Buttons */}
        <div className="flex items-center gap-2 mb-3">
          {authModes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => updateProfile({ authMode: mode.value })}
              className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
                profile.authMode === mode.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Advanced Fields (Collapsible) */}
        {showAdvanced && (
          <div className="pt-3 border-t border-gray-800 space-y-3">
            {/* Row 1: Target details */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">目标主机名</label>
                <input
                  type="text"
                  placeholder="DC01.corp.local"
                  value={profile.targetHost}
                  onChange={(e) => updateProfile({ targetHost: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">目标端口</label>
                <input
                  type="text"
                  placeholder="445"
                  value={profile.targetPort}
                  onChange={(e) => updateProfile({ targetPort: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">DC FQDN</label>
                <input
                  type="text"
                  placeholder="DC01.corp.local"
                  value={profile.dcFQDN}
                  onChange={(e) => updateProfile({ dcFQDN: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">LM Hash (可选)</label>
                <input
                  type="text"
                  placeholder="aad3b435..."
                  value={profile.lmHash}
                  onChange={(e) => updateProfile({ lmHash: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Row 2: Local & Advanced */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">本地 IP</label>
                <input
                  type="text"
                  placeholder="192.168.1.50"
                  value={profile.localIP}
                  onChange={(e) => updateProfile({ localIP: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">本地端口</label>
                <input
                  type="text"
                  placeholder="4444"
                  value={profile.localPort}
                  onChange={(e) => updateProfile({ localPort: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">SPN</label>
                <input
                  type="text"
                  placeholder="HTTP/web.corp.local"
                  value={profile.spn}
                  onChange={(e) => updateProfile({ spn: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">证书模板</label>
                <input
                  type="text"
                  placeholder="User"
                  value={profile.certTemplate}
                  onChange={(e) => updateProfile({ certTemplate: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Row 3: More Advanced */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">CA Name</label>
                <input
                  type="text"
                  placeholder="CORP-DC-CA"
                  value={profile.caName}
                  onChange={(e) => updateProfile({ caName: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">BloodHound Zip</label>
                <input
                  type="text"
                  placeholder="bloodhound.zip"
                  value={profile.bloodhoundZip}
                  onChange={(e) => updateProfile({ bloodhoundZip: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Domain SID</label>
                <input
                  type="text"
                  placeholder="S-1-5-21-..."
                  value={profile.domainSid}
                  onChange={(e) => updateProfile({ domainSid: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Row 4: File transfer */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">文件名 (File)</label>
                <input
                  type="text"
                  placeholder="mimikatz.exe"
                  value={profile.fileName}
                  onChange={(e) => updateProfile({ fileName: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">远程落地路径</label>
                <input
                  type="text"
                  placeholder="C:\Windows\Temp\mimikatz.exe"
                  value={profile.remotePath}
                  onChange={(e) => updateProfile({ remotePath: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
