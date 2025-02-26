import { useCallback, useState, useEffect } from 'react';
import axios from 'axios';
import { useAppSelector } from '../store/hooks';

export interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalRewards: number;
}

export function useReferral() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    totalRewards: 0
  });
  const currentUser = useAppSelector(state => state.user.userinfo);

  const fetchReferralStats = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/v1/users/referral/stats`,
        { withCredentials: true }
      );
      
      if (data.status === "success") {
        setStats({
          totalReferrals: data.data.totalReferrals || 0,
          pendingReferrals: data.data.pendingReferrals || 0,
          completedReferrals: data.data.completedReferrals || 0,
          totalRewards: data.data.totalRewards || 0
        });
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    }
  }, [currentUser]);

  const generateReferralCode = useCallback(async () => {
    if (!currentUser) return null;

    try {
      // First check if user already has a referral code
      const { data: existingCodeData } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/v1/users/referral`,
        { withCredentials: true }
      );
      
      if (existingCodeData.status === "success" && existingCodeData.data.code) {
        setReferralCode(existingCodeData.data.code);
        return existingCodeData.data.code;
      }
    } catch (error) {
      console.error('Error fetching existing referral code:', error);
    }

    try {
      // Generate new code if one doesn't exist
      const { data: newCodeData } = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/v1/users/referral/generate`,
        {},
        { withCredentials: true }
      );
      
      if (newCodeData.status === "success" && newCodeData.data.code) {
        setReferralCode(newCodeData.data.code);
        return newCodeData.data.code;
      }
    } catch (error) {
      console.error('Error generating referral code:', error);
    }

    return null;
  }, [currentUser]);

  const applyReferralCode = useCallback(async (code: string) => {
    if (!currentUser) return false;

    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/v1/users/referral/apply`,
        { code },
        { withCredentials: true }
      );
      
      return data.status === "success";
    } catch (error) {
      console.error('Error applying referral code:', error);
      return false;
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      generateReferralCode();
      fetchReferralStats();
    }
  }, [currentUser, generateReferralCode, fetchReferralStats]);

  return {
    referralCode,
    stats,
    generateReferralCode,
    applyReferralCode,
    fetchReferralStats
  };
}



