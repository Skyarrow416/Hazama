import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from './types';

interface ProfileState {
  profile: Profile;
  updateProfile: (updates: Partial<Profile>) => void;
  resetProfile: () => void;
}

const defaultProfile: Profile = {
  domain: '',
  username: '',
  password: '',
  lmHash: '',
  ntHash: '',
  aesKey: '',
  ccachePath: '',
  targetIP: '',
  targetHost: '',
  targetPort: '',
  dcIP: '',
  dcFQDN: '',
  localIP: '',
  localPort: '',
  spn: '',
  certTemplate: '',
  caName: '',
  bloodhoundZip: '',
  domainSid: '',
  fileName: '',
  remotePath: '',
  authMode: 'password',
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      updateProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),
      resetProfile: () => set({ profile: defaultProfile }),
    }),
    {
      name: 'pentest-profile-storage',
    }
  )
);
