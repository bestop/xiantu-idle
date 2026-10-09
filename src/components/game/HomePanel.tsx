// 主页：角色总览 / 当前修行 / 属性面板 / 生涯统计
'use client';

import { useGameStore } from '@/store/game';
import { computePlayerStats } from '@/lib/game/engine';
import { getTitle, combatLevelSum, totalSkillLevel, ACTIVITY_MAP, offlineEfficiency, offlineCapSeconds } from '@/lib/game/skills';
import { petBonus, petStats, petXpToNext, MAX_PET_LEVEL } from '@/lib/game/pets';
import { MONSTER_MAP } from '@/lib/game/monsters';
import { Section, ProgressBar, StatPill, ActionButton, formatNum, formatDuration } from './ui-bits';
import { QUALITY_TEXT } from '@/lib/game/items';

export function HomePanel() {
  const state = useGameStore();
  const stats = computePlayerStats(state);
  const cSum = combatLevelSum(state.skills);
  const tSum = totalSkillLevel(state.skills);
  const title = getTitle(cSum);
  const act = state.activeActivity ? ACTIVITY_MAP[state.activeActivity] : null;
  const focusLv = state.skills.focus.level;
  const eff = offlineEfficiency(focusLv);
  const cap = offlineCapSeconds(focusLv);

  const equips = [state.equipped.weapon, state.equipped.armor, state.equipped.accessory];

  return (
    <div className="space-y-3 p-3 pb-24">
      {/* 角色卡 */}
      <Section className="bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/40">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-bold text-amber-100 flex items-center gap-2">
              <span aria-hidden>🧙</span>{state.playerName}
            </div>
            <div className="text-xs text-stone-400 mt-1">
              境界：{title} · 战斗等级 {cSum} · 技能总等级 {tSum}
            </div>
          </div>
          <div className="text-right text-[10px] text-stone-500">
            <div>修行 {formatDuration((Date.now() - state.stats.playStart) / 1000)}</div>
            <div>击杀 {formatNum(state.stats.totalKills)} · 胜率 {state.stats.totalBattles > 0 ? Math.round(state.stats.totalWins / state.stats.totalBattles * 100) : 0}%</div>
          </div>
        </div>

        {/* 属性面板 */}
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          <StatPill icon="❤️" value={formatNum(stats.maxHp)} label="生命" />
          <StatPill icon="⚔️" value={formatNum(stats.atk)} label="攻击" />
          <StatPill icon="🛡️" value={formatNum(stats.def)} label="防御" />
          <StatPill icon="💨" value={stats.speed} label="速度" />
          <StatPill icon="🔥" value={`${(stats.critRate * 100).toFixed(1)}%`} label="暴击" />
          <StatPill icon="🌪️" value={`${(stats.dodgeRate * 100).toFixed(1)}%`} label="闪避" />
        </div>

        {/* 装备摘要 */}
        <div className="flex gap-1.5 mt-2">
          {equips.map((e, i) => (
            <div key={i} className="flex-1 bg-stone-800/60 rounded-lg px-2 py-1.5 text-center min-h-[44px] flex flex-col justify-center">
              {e ? (
                <>
                  <div className={`text-[11px] font-medium ${QUALITY_TEXT[e.quality]}`}>{e.icon} {e.name}</div>
                  <div className="text-[9px] text-stone-500">{e.mainStat.key === 'atk' ? `攻+${e.mainStat.value}` : e.mainStat.key === 'def' ? `防+${e.mainStat.value}` : `血+${e.mainStat.value}`}</div>
                </>
              ) : (
                <div className="text-[10px] text-stone-600">{['武器', '护甲', '饰品'][i]}·空</div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* 出战灵宠 */}
      {(() => {
        const pets = state.pets ?? [];
        const pet = pets.find(p => p.uid === state.activePetUid) ?? null;
        if (pets.length === 0) return null;
        if (!pet) {
          return (
            <Section>
              <button onClick={() => { state.setMoreView('pets'); state.setTab('more'); }}
                className="w-full flex items-center justify-between min-h-[44px]">
                <span className="text-xs text-stone-400">🐾 灵宠休息中（已有 {pets.length} 只）</span>
                <span className="text-xs text-amber-400">前往灵宠舍 ›</span>
              </button>
            </Section>
          );
        }
        const m = MONSTER_MAP[pet.monsterId];
        const ps = petStats(pet);
        const bonus = petBonus(pet);
        const xpNeed = petXpToNext(pet.level);
        return (
          <Section className="bg-gradient-to-br from-emerald-950/40 via-stone-900 to-stone-900">
            <button onClick={() => { state.setMoreView('pets'); state.setTab('more'); }} className="w-full text-left">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl animate-pulse" aria-hidden>{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-emerald-300">{m.name} <span className="text-[10px] text-stone-500">Lv.{pet.level} · 出战中</span></div>
                  <div className="text-[10px] text-stone-500 tabular-nums">
                    攻 {formatNum(ps.atk)} · 防 {formatNum(ps.def)} · 加成 攻+{formatNum(bonus.atk)} 防+{formatNum(bonus.def)} 血+{formatNum(bonus.hp)}
                  </div>
                </div>
                <span className="text-[10px] text-amber-400 shrink-0">灵宠舍 ›</span>
              </div>
              {pet.level < MAX_PET_LEVEL && (
                <ProgressBar value={pet.xp} max={xpNeed} className="mt-2 h-1.5" barClass="bg-emerald-500" />
              )}
            </button>
          </Section>
        );
      })()}

      {/* 当前修行 */}
      <Section title="当前修行" extra={
        act ? <ActionButton variant="ghost" className="!min-h-[36px] !px-3 text-xs" onClick={() => state.stopActivity()}>停止</ActionButton> : undefined
      }>
        {act ? (
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-pulse" aria-hidden>{act.icon}</span>
              <div className="flex-1">
                <div className="text-sm text-stone-200 font-medium">{act.name}</div>
                <div className="text-[10px] text-stone-500">每轮 {act.intervalSec} 秒 · +{act.skillXp} 经验{act.reward.gold ? ` · +${Math.round((act.reward.gold ?? 0) * (1 + state.skills.begging.level * 0.06))} 金币` : ''}</div>
              </div>
            </div>
            <ProgressBar value={state.activityProgress} max={1} className="mt-2 h-2.5" barClass="bg-emerald-500" showText />
          </div>
        ) : (
          <div className="text-center py-3">
            <div className="text-xs text-stone-500 mb-2">尚未开始修行，去技能页选择一项活动吧</div>
            <ActionButton className="!min-h-[40px]" onClick={() => state.setTab('skills')}>前往修炼</ActionButton>
          </div>
        )}
        <div className="text-[10px] text-stone-500 mt-2 flex justify-between">
          <span>离线效率 {(eff * 100).toFixed(0)}%（定力 +{(eff * 100 - 60).toFixed(0)}%）</span>
          <span>离线上限 {formatDuration(cap)}</span>
        </div>
      </Section>

      {/* 生涯统计 */}
      <Section title="生涯统计">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-stone-300">
          <div className="flex justify-between"><span className="text-stone-500">总战斗</span><span className="tabular-nums">{formatNum(state.stats.totalBattles)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">总获胜</span><span className="tabular-nums">{formatNum(state.stats.totalWins)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">击杀妖兽</span><span className="tabular-nums">{formatNum(state.stats.totalKills)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">斩杀妖王</span><span className="tabular-nums">{formatNum(state.stats.bossKills)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">累计金币</span><span className="tabular-nums">{formatNum(state.stats.totalGoldEarned)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">累计经验</span><span className="tabular-nums">{formatNum(state.stats.totalExpEarned)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">掉落物品</span><span className="tabular-nums">{formatNum(state.stats.totalDrops)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">离线次数</span><span className="tabular-nums">{formatNum(state.stats.offlineSessions)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">灵宠收服</span><span className="tabular-nums">{formatNum(state.stats.petsCaptured ?? 0)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">世界 BOSS 击杀</span><span className="tabular-nums">{formatNum(state.stats.wbKills ?? 0)}</span></div>
        </div>
      </Section>

      {/* 游戏说明 */}
      <Section title="修行指南">
        <ul className="text-[11px] text-stone-400 space-y-1 leading-relaxed">
          <li>· 战斗系技能（气血/神力/神兵/御体/遁速）通过战斗提升，每胜一场五项齐涨。</li>
          <li>· 生活技能在「技能」页选择活动修炼，离线也会继续修行。</li>
          <li>· 技能每升 1 级送 1 颗宝石，成就与寻宝也能获得宝石。</li>
          <li>· 装备词条完全随机，气运越高掉落越稀有。</li>
        </ul>
      </Section>
    </div>
  );
}
