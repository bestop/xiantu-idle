// 天梯榜：综合实力评分 + NPC 修士排行
'use client';

import { useGameStore } from '@/store/game';
import { getLeaderboard, computePowerScore } from '@/lib/game/leaderboard';
import { Section, formatNum } from './ui-bits';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';

export function LeaderboardPanel({ onBack }: { onBack: () => void }) {
  const store = useGameStore();
  // React Compiler 会自动 memo 化，无需手动 useMemo
  const { entries, playerRank } = getLeaderboard(store);
  const power = computePowerScore(store);

  return (
    <div className="p-3 pb-24 space-y-3">
      <div className="flex items-center gap-1">
        <button onClick={onBack} className="text-stone-400 min-h-[40px] min-w-[40px] flex items-center justify-center -ml-1 rounded-lg hover:bg-stone-900" aria-label="返回">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-xianzi text-base font-bold text-gold-grad tracking-widest">天梯榜</h2>
      </div>

      {/* 我的排名 */}
      <Section className="bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/40 relative overflow-hidden">
        <div aria-hidden className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-amber-600/8 blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between relative">
          <div>
            <div className="text-[10px] text-stone-500">我的综合实力评分</div>
            <div className="text-2xl font-bold text-gold-grad tabular-nums">{formatNum(power)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-stone-500">当前排名</div>
            <div className="text-2xl font-bold text-gold-grad tabular-nums">#{playerRank}<span className="text-xs text-stone-500"> / {entries.length}</span></div>
          </div>
        </div>
        <div className="text-[10px] text-stone-500 mt-2 leading-relaxed relative">
          评分构成：技能总等级 × 4 + 装备 + 灵宠 + 击杀与图鉴。天梯上的道友也在随时间成长，坚持修炼才能保持超越。
        </div>
      </Section>

      {/* 榜单 */}
      <div className="space-y-1.5">
        {entries.map((e, i) => {
          const rank = i + 1;
          const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
          // 前三名专属卡色
          const topStyle = rank === 1
            ? 'bg-gradient-to-r from-amber-950/60 to-stone-900/80 border-amber-600/50'
            : rank === 2
              ? 'bg-gradient-to-r from-stone-800/60 to-stone-900/80 border-stone-500/40'
              : rank === 3
                ? 'bg-gradient-to-r from-orange-950/50 to-stone-900/80 border-orange-800/50'
                : null;
          return (
            <div key={e.name + rank}
              className={cn('rounded-xl border p-2.5 flex items-center gap-2.5',
                e.isPlayer
                  ? 'bg-amber-950/40 border-amber-500/70 shadow-[0_0_16px_rgba(245,158,11,0.15)]'
                  : topStyle ?? 'bg-stone-900/70 border-stone-800')}>
              <div className={cn('w-8 text-center font-bold shrink-0 tabular-nums',
                rank <= 3 ? 'text-lg' : 'text-sm text-stone-500')}>
                {medal ?? rank}
              </div>
              <span className="text-xl shrink-0" aria-hidden>{e.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={cn('text-xs font-semibold truncate',
                  e.isPlayer ? 'text-amber-200' : 'text-stone-300')}>
                  {e.name}{e.isPlayer && <span className="ml-1 text-[9px] px-1 rounded bg-amber-800 text-amber-200">我</span>}
                </div>
              </div>
              <div className={cn('text-xs font-semibold tabular-nums shrink-0',
                e.isPlayer ? 'text-amber-300' : rank <= 3 ? 'text-amber-200/90' : 'text-stone-400')}>
                {formatNum(e.power)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
