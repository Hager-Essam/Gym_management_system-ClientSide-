import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useAuth } from './AuthContext.jsx';
import {
  getMyProfile,
  updateMyProfile,
} from '../services/memberService.js';

const MemberProfileContext = createContext(null);

function normalizeMember(member = {}) {
  return {
    ...member,
    fullName: member.fullName ?? member.full_name ?? '',
    dateOfBirth: member.dateOfBirth ?? member.date_of_birth ?? '',
    emergencyContact:
      member.emergencyContact ?? member.emergency_contact ?? '',
    profilePicture: null,
  };
}

export function MemberProfileProvider({ children }) {
  const { user } = useAuth();

  const [member, setMember] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setMember(null);
      setSubscription(null);
      return;
    }

    setLoading(true);

    try {
      const data = await getMyProfile();

      setMember(normalizeMember(data.user));
      setSubscription(data.subscription ?? null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!user) {
        setMember(null);
        setSubscription(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const data = await getMyProfile();

        if (active) {
          setMember(normalizeMember(data.user));
          setSubscription(data.subscription ?? null);
        }
      } catch (error) {
        console.error('Profile loading error:', error);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const updateProfile = async (profileData) => {
    const updatedMember = await updateMyProfile(profileData);

    setMember((current) => ({
      ...current,
      ...normalizeMember(updatedMember),
    }));

    return updatedMember;
  };

  const value = {
    member,
    subscription,
    loading,
    refreshProfile,
    updateProfile,
  };

  return (
    <MemberProfileContext.Provider value={value}>
      {children}
    </MemberProfileContext.Provider>
  );
}

export function useMemberProfile() {
  const context = useContext(MemberProfileContext);

  if (!context) {
    throw new Error(
      'useMemberProfile must be used inside MemberProfileProvider'
    );
  }

  return context;
}