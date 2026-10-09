// 离线收益结算弹窗
'use client';

import { useGameStore } from '@/store/game';
import { getItem } from '@/lib/game/items';
import { SKILL_MAP } from '@/lib/game/skills';
import { SkillId } from '@/types/game';
import { ActionButton, formatNum, formatDuration } from './ui-bits';
import { QUALITY_TEXT } from '@/lib/game/items';
import { cn } from '@/lib/utils';
import { MoonStar } from 'lucide-react';

export function OfflineModal() {
  const report = useGameStore(s => s.pendingOfflineReport);
  const dismiss = useGameStore(s => s.dismissOfflineReport);
  if (!report) return null;

  const skillEntries = Object.entries(report.skillXp) as [SkillId, number][];
  const allItems = [
    ...report.items,
    ...report.battleDrops,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="离线收益">
      <div className="w-full max-w-md bg-stone-900 border-t border-amber-900/50 rounded-t-2xl p-4 pb-8 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom">
        <div className="text-center mb-3">
          <MoonStar className="w-10 h-10 text-amber-300 mx-auto mb-1.5" />
          <h2 className="text-base font-bold text-amber-100">闭关归来</h2>
          <p className="text-[11px] text-stone-500 mt-0.5">
            离线 {formatDuration(report.seconds)} · 收益效率 {(report.effiency * 100).toFixed(0)}%
          </p>
        </div>

        <div className="space-y-2.5 text-xs">
          {/* 技能修炼 */}
          {skillEntries.length > 0 && (
            <div className="bg-stone-800/50 rounded-xl p-3">
              <div className="text-stone-400 font-semibold mb-1.5">🧘 修炼收获</div>
              {skillEntries.map(([id, xp]) => (
                <div key={id} className="flex justify-between text-stone-300 py-0.5">
                  <span>{SKILL_MAP[id]?.icon} {SKILL_MAP[id]?.name}</span>
                  <span className="tabular-nums text-amber-300">+{formatNum(xp)} 经验</span>
                </div>
              ))}
            </div>
          )}

          {/* 离线战斗 */}
          {report.battleKills > 0 && (
            <div className="bg-stone-800/50 rounded-xl p-3">
              <div className="text-stone-400 font-semibold mb-1.5">⚔️ 自动战斗</div>
              <div className="flex justify-between text-stone-300 py-0.5">
                <span>击败妖兽</span><span className="tabular-nums text-stone-200">{formatNum(report.battleKills)} 只</span>
              </div>
              <div className="flex justify-between text-stone-300 py-0.5">
                <span>战斗经验（五项各得）</span><span className="tabular-nums text-amber-300">+{formatNum(report.battleExp)}</span>
              </div>
              <div className="flex justify-between text-stone-300 py-0.5">
                <span>金币</span><span className="tabular-nums text-amber-300">+{formatNum(report.battleGold)}</span>
              </div>
            </div>
          )}

          {/* 采集金币 */}
          {report.gold > 0 && (
            <div className="flex justify-between items-center bg-stone-800/50 rounded-xl px-3 py-2.5 text-stone-300">
              <span>🪙 活动金币</span>
              <span className="tabular-nums text-amber-300">+{formatNum(report.gold)}</span>
            </div>
          )}

          {/* 物品 */}
          {allItems.length > 0 && (
            <div className="bg-stone-800/50 rounded-xl p-3">
              <div className="text-stone-400 font-semibold mb-1.5">🎒 物品收获</div>
              <div className="flex flex-wrap gap-1.5">
                {allItems.map((it, idx) => {
                  const item = getItem(it.itemId);
                  if (!item) return null;
                  return (
                    <span key={`${it.itemId}-${idx}`} className={cn('bg-stone-900 rounded-lg px-2 py-1 text-[10px]', QUALITY_TEXT[item.quality])}>
                      {item.icon}{item.name}×{formatNum(it.qty)}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* 宝石 */}
          {report.gems > 0 && (
            <div className="flex justify-between items-center bg-stone-800/50 rounded-xl px-3 py-2.5 text-stone-300">
              <span>💎 宝石</span>
              <span className="tabular-nums text-cyan-300">+{formatNum(report.gems)}</span>
            </div>
          )}
        </div>

        <ActionButton className="w-full mt-4" onClick={dismiss}>收入囊中，继续修行</ActionButton>
      </div>
    </div>
  );
}
