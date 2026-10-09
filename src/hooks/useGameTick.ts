// 游戏心跳：每秒 tick + 页面可见性恢复时结算离线
'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/game';

export function useGameTick() {
  const tick = useGameStore(s => s.tick);
  const settledRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  // 页面重新可见时结算离线收益（移动端切后台回来）
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        // 延迟一点，等 store 恢复
        setTimeout(() => {
          const store = useGameStore.getState();
          if (store.initialized && settledRef.current) {
            store.settleOffline();
          }
        }, 300);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => {
    settledRef.current = true;
  }, []);
}
