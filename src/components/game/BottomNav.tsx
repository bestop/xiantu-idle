// 底部导航栏（移动端 App 风格，5 Tab，玻璃拟态）
'use client';

import { useGameStore, GameStore } from '@/store/game';
import { TabId } from '@/types/game';
import { Home, Swords, Sparkles, Backpack, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: '主页', icon: <Home className="w-5 h-5" /> },
  { id: 'combat', label: '战斗', icon: <Swords className="w-5 h-5" /> },
  { id: 'skills', label: '技能', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'inventory', label: '背包', icon: <Backpack className="w-5 h-5" /> },
  { id: 'more', label: '更多', icon: <LayoutGrid className="w-5 h-5" /> },
];

export function BottomNav() {
  const tab = useGameStore((s: GameStore) => s.tab);
  const setTab = useGameStore((s: GameStore) => s.setTab);
  const setMoreView = useGameStore((s: GameStore) => s.setMoreView);

  return (
    <nav
      aria-label="主导航"
      className="fixed bottom-0 left-0 right-0 z-30 bg-stone-950/85 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      {/* 顶部金色 hairline */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-800/40 to-transparent" aria-hidden />
      <div className="max-w-md mx-auto grid grid-cols-5">
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                // 点击「更多」Tab 时回到更多面板根视图，避免停留在深层子页
                if (t.id === 'more') setMoreView('root');
                setTab(t.id);
              }}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors',
                active ? 'text-amber-400' : 'text-stone-500 active:text-stone-300'
              )}
            >
              <span className={cn('transition-all duration-200', active && 'scale-110 -translate-y-0.5 nav-glow')}>
                {t.icon}
              </span>
              <span className={cn('text-[10px] font-medium transition-colors', active && 'text-amber-300')}>{t.label}</span>
              {/* 活跃指示条 */}
              <span
                aria-hidden
                className={cn(
                  'absolute top-0 w-8 h-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-200',
                  active ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-50'
                )}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
