// 《仙途挂机》主页面 — Harpagia 式修仙放置 RPG
'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useGameStore } from '@/store/game';
import { useGameTick } from '@/hooks/useGameTick';
import { TopBar } from '@/components/game/TopBar';
import { BottomNav } from '@/components/game/BottomNav';
import { HomePanel } from '@/components/game/HomePanel';
import { CombatPanel } from '@/components/game/CombatPanel';
import { SkillsPanel } from '@/components/game/SkillsPanel';
import { InventoryPanel } from '@/components/game/InventoryPanel';
import { MorePanel } from '@/components/game/MorePanel';
import { OfflineModal } from '@/components/game/OfflineModal';
import { StartScreen } from '@/components/game/StartScreen';

// 客户端挂载检测（避免 SSR 水合不一致，且不触发 effect 内 setState）
const emptySubscribe = () => () => {};
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function Splash() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-stone-950">
      <div className="text-center">
        <div className="text-5xl mb-3 animate-pulse" aria-hidden>⛰️</div>
        <div className="text-sm text-stone-500 tracking-widest">仙途挂机</div>
      </div>
    </div>
  );
}

function Toast() {
  const toast = useGameStore(s => s.toast);
  const toastSeq = useGameStore(s => s.toastSeq);
  const clearToast = useGameStore(s => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => clearToast(), 2600);
    return () => clearTimeout(timer);
  }, [toast, toastSeq, clearToast]);

  if (!toast) return null;
  return (
    <div className="fixed top-14 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none" aria-live="polite">
      <div className="bg-stone-800/95 border border-amber-800/50 text-amber-100 text-xs rounded-full px-4 py-2.5 shadow-lg max-w-[90%] text-center animate-in fade-in slide-in-from-top-2">
        {toast}
      </div>
    </div>
  );
}

function GameShell() {
  const tab = useGameStore(s => s.tab);
  useGameTick();

  return (
    <div className="min-h-dvh bg-stone-950">
      <TopBar />
      <Toast />
      <main className="max-w-md mx-auto">
        {tab === 'home' && <HomePanel />}
        {tab === 'combat' && <CombatPanel />}
        {tab === 'skills' && <SkillsPanel />}
        {tab === 'inventory' && <InventoryPanel />}
        {tab === 'more' && <MorePanel />}
      </main>
      <BottomNav />
      <OfflineModal />
    </div>
  );
}

export default function Page() {
  const mounted = useMounted();
  const hydrated = useGameStore(s => s.hydrated);
  const initialized = useGameStore(s => s.initialized);

  if (!mounted || !hydrated) return <Splash />;
  if (!initialized) return <StartScreen />;
  return <GameShell />;
}
