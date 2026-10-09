// 世界 BOSS：伤害累积挑战
'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game';
import { computePlayerStats } from '@/lib/game/engine';
import { WORLD_BOSSES, wbMaxHp, runWorldBossAttempt, WB_CHALLENGE_COOLDOWN_MS, WorldBossAttemptResult } from '@/lib/game/worldboss';
import { QUALITY_TEXT } from '@/lib/game/items';
import { BOSS_SCENE } from '@/lib/game/scenes';
import { Section, ProgressBar, ActionButton, formatNum, QualityBadge } from './ui-bits';
import { cn } from '@/lib/utils';
import { ChevronLeft, Swords } from 'lucide-react';

export function WorldBossPanel({ onBack }: { onBack: () => void }) {
  const store = useGameStore();
  const wb = store.worldBoss;
  const boss = WORLD_BOSSES[wb.bossIdx % WORLD_BOSSES.length];
  const maxHp = wbMaxHp(wb.bossIdx);
  const [result, setResult] = useState<WorldBossAttemptResult | null>(null);

  const cooldownLeft = Math.max(0, wb.lastChallengeAt + WB_CHALLENGE_COOLDOWN_MS - Date.now());
  const cooldownSec = Math.ceil(cooldownLeft / 1000);

  const challenge = () => {
    const r = runWorldBossAttempt(useGameStore.getState());
    if (!r.ok) return;
    store.applyWorldBossResult(r);
    setResult(r);
  };

  return (
    <div className="p-3 pb-24 space-y-3">
      <div className="flex items-center gap-1">
        <button onClick={onBack} className="text-stone-400 min-h-[40px] min-w-[40px] flex items-center justify-center -ml-1 rounded-lg hover:bg-stone-900" aria-label="返回">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-xianzi text-base font-bold text-gold-grad tracking-widest">世界 BOSS</h2>
      </div>

      {/* BOSS 卡 */}
      <div className="bg-gradient-to-br from-rose-950/60 via-stone-900 to-stone-900 border border-rose-900/60 rounded-xl overflow-hidden relative">
        {/* 场景横幅（旅行青蛙式） */}
        <div className="relative h-28">
          <img src={BOSS_SCENE.img} alt="世界 BOSS" className="w-full h-full object-cover" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/30 to-transparent" />
        </div>
        <div className="p-4 pt-1 relative">
        <div aria-hidden className="absolute -top-8 -left-8 w-36 h-36 rounded-full bg-rose-600/10 blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full border border-rose-800/50 bg-rose-950/50 flex items-center justify-center shrink-0">
              <div className="text-4xl animate-breathe" aria-hidden>{boss.icon}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-rose-200">{boss.name}</div>
              <div className="text-[10px] text-stone-400 mt-0.5">{boss.title}</div>
            </div>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-900/70 text-rose-300 border border-rose-800/60 shrink-0">{boss.tier}阶·世界级</span>
        </div>

        <div className="mt-3 relative">
          <ProgressBar value={wb.hp} max={maxHp} className="h-4" barClass="bg-gradient-to-r from-rose-700 to-rose-500" showText />
          <div className="flex justify-between text-[10px] text-stone-500 mt-1 tabular-nums">
            <span>剩余血量 {formatNum(wb.hp)} / {formatNum(maxHp)}</span>
            <span>已削减 {((1 - wb.hp / maxHp) * 100).toFixed(1)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 mt-3 text-center">
          <div className="bg-stone-900/70 rounded-lg py-1.5">
            <div className="text-[9px] text-stone-500">本期累计伤害</div>
            <div className="text-xs text-amber-300 font-semibold tabular-nums">{formatNum(wb.seasonDamage)}</div>
          </div>
          <div className="bg-stone-900/70 rounded-lg py-1.5">
            <div className="text-[9px] text-stone-500">单次最高伤害</div>
            <div className="text-xs text-amber-300 font-semibold tabular-nums">{formatNum(store.stats.wbBestDamage ?? 0)}</div>
          </div>
          <div className="bg-stone-900/70 rounded-lg py-1.5">
            <div className="text-[9px] text-stone-500">累计击杀</div>
            <div className="text-xs text-rose-300 font-semibold tabular-nums">{store.stats.wbKills ?? 0}</div>
          </div>
        </div>
        </div>
      </div>

      {/* 挑战 */}
      <Section title="挑战">
        <div className="text-[11px] text-stone-400 space-y-1 leading-relaxed mb-2.5">
          <p>· 世界 BOSS <b className="text-rose-300">血量跨挑战持久</b>，每次最多交手 15 回合，打空血量即完成击杀。</p>
          <p>· 挑战按造成伤害结算奖励（败了也有收益）；击杀必得<b className="text-amber-300">仙品装备</b>与大量宝石。</p>
          <p>· 击杀后下一只更强的世界 BOSS 立即降临；每 24 小时也会自动轮换。</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-stone-500 mb-2">
          <div>你的攻击 <b className="text-stone-300">{formatNum(computePlayerStats(store).atk)}</b></div>
          <div>你的生命 <b className="text-stone-300">{formatNum(computePlayerStats(store).maxHp)}</b></div>
        </div>
        {cooldownSec > 0 ? (
          <ActionButton disabled className="w-full">调息中… {cooldownSec}s 后可再战</ActionButton>
        ) : (
          <ActionButton className="w-full" onClick={challenge}>
            <span className="flex items-center justify-center gap-1.5"><Swords className="w-4 h-4" /> 挑战世界 BOSS</span>
          </ActionButton>
        )}
      </Section>

      {/* 战报 */}
      {result && (
        <div className={cn('rounded-xl border p-3 space-y-2',
          result.killed ? 'bg-amber-950/40 border-amber-700' : 'bg-stone-900/80 border-stone-800')}>
          <div className={cn('text-sm font-bold text-center',
            result.killed ? 'text-amber-300' : result.survived ? 'text-emerald-300' : 'text-red-300')}>
            {result.killed ? `🌌 击杀 ${boss.name}！` : result.survived ? `⚔️ 交手 ${result.rounds} 回合，共造成 ${formatNum(result.damage)} 伤害` : `💀 不敌 ${boss.name}，造成 ${formatNum(result.damage)} 伤害`}
          </div>
          <div className="max-h-40 overflow-y-auto space-y-0.5">
            {result.log.map((l, i) => (
              <div key={i} className={cn('text-[11px] leading-relaxed',
                l.includes('暴击') ? 'text-amber-300 font-semibold' : l.includes('避开') ? 'text-emerald-300' : l.includes('承受') ? 'text-red-300/90' : 'text-stone-400')}>
                {l}
              </div>
            ))}
          </div>
          <div className="space-y-1 text-xs border-t border-stone-800 pt-2">
            <div className="flex justify-between text-stone-300"><span>战斗经验（五项技能各得）</span><span className="text-amber-300 tabular-nums">+{formatNum(result.exp)}</span></div>
            <div className="flex justify-between text-stone-300"><span>金币</span><span className="text-amber-300 tabular-nums">+{formatNum(result.gold)}</span></div>
            {result.gems > 0 && <div className="text-cyan-300">💎 获得 {result.gems} 颗宝石</div>}
            {result.legendaryDrop && (
              <div className="text-stone-400">
                击杀奖励：<span className={QUALITY_TEXT[result.legendaryDrop.quality]}>
                  {result.legendaryDrop.icon}{result.legendaryDrop.name}</span> <QualityBadge quality={result.legendaryDrop.quality} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 轮换表 */}
      <Section title="轮换一览" extra={<span className="text-[10px] text-stone-500">当前第 {(wb.bossIdx % WORLD_BOSSES.length) + 1} / {WORLD_BOSSES.length} 位</span>}>
        <div className="grid grid-cols-4 gap-1.5">
          {WORLD_BOSSES.map((b, i) => (
            <div key={b.name}
              className={cn('rounded-lg border p-1.5 text-center',
                i === wb.bossIdx % WORLD_BOSSES.length ? 'bg-rose-950/50 border-rose-800' : 'bg-stone-900/60 border-stone-800 opacity-60')}>
              <div className="text-lg" aria-hidden>{b.icon}</div>
              <div className="text-[9px] text-stone-400 truncate">{b.name}</div>
              <div className="text-[9px] text-stone-600">{b.tier}阶</div>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-stone-600 mt-2 text-center">击杀当前 BOSS 或每 24 小时自动轮换至下一位</div>
      </Section>
    </div>
  );
}
