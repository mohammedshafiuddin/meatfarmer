import React, { useEffect, useState } from 'react';
import { getCurrentUserId } from '@/utils/getCurrentUserId';

export function useCurrentUserId(): {userId:number|null, refetchUserId: () => void} {
  const [userId, setUserId] = useState<number | null>(null);
  const refetchUserId = React.useCallback(() => {
    getCurrentUserId().then(setUserId);
  },[])
  useEffect(() => {
    getCurrentUserId().then(setUserId);
  }, []);
  return {userId,refetchUserId};
}
