import { useProfileStore } from '../store';
import { fieldDefinitions, fieldGroups } from '../data/fields';
import type { AuthMode } from '../types';

export default function ProfileBar() {
  const { profile, updateProfile, resetProfile } = useProfileStore();

  const authModes: { value: AuthMode; label: string }[] = [
    { value: 'password', label: '密码' },
    { value: 'hash', label: 'NTLM Hash' },
    { value: 'kerberos', label: 'Kerberos' },
    { value: 'aeskey', label: 'AES Key' },
  ];

  return (
    <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 shadow-lg">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-100">凭据配置 Profile</h2>
            <p className="text-xs text-gray-500 mt-1">填写后所有命令将自动生成</p>
          </div>
          <button
            onClick={resetProfile}
            className="btn-secondary text-xs"
          >
            清空
          </button>
        </div>

        {/* Auth Mode Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2">
            认证方式 Auth Mode
          </label>
          <div className="flex gap-2">
            {authModes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => updateProfile({ authMode: mode.value })}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  profile.authMode === mode.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fields by Group */}
        {fieldGroups.map((group) => {
          const groupFields = fieldDefinitions.filter((f) => f.group === group.id);

          return (
            <div key={group.id}>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">{group.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {groupFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs text-gray-500 mb-1">
                      {field.label}
                    </label>
                    <input
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      value={profile[field.key as keyof typeof profile] as string}
                      onChange={(e) =>
                        updateProfile({ [field.key]: e.target.value })
                      }
                      className="input-field w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
