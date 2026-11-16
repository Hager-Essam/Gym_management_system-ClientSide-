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
    profilePicture:
      member.profilePicture ?? member.profile_picture_url ?? null,
  };
}

export function MemberProfileProvider({ children }) {
  const { user } = useAuth();

  const [member, setMember] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setMember(null);
      setSubscription(null);
      setError('');
      return null;
    }

    setLoading(true);
    setError('');

    try {
      const data = await getMyProfile();

      setMember(normalizeMember(data?.user));
      setSubscription(data?.subscription ?? null);
      return data;
    } catch (err) {
      setError(err.message || 'Unable to load your profile.');
      throw err;
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
        setError('');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await getMyProfile();

        if (active) {
          setMember(normalizeMember(data?.user));
          setSubscription(data?.subscription ?? null);
        }
      } catch (err) {
        if (active) {
          console.error('Profile loading error:', err);
          setError(err.message || 'Unable to load your profile.');
        }
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
    error,
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
