// 技能面板：16 技能总览 / 训练活动 / 炼丹锻造
'use client';

import { useMemo, useState } from 'react';
import { useGameStore } from '@/store/game';
import { SKILLS, SKILL_MAP, ACTIVITY_MAP, xpToNext, gatherTier } from '@/lib/game/skills';
import { SkillId, SkillCategory, MAX_SKILL_LEVEL } from '@/types/game';
import { Section, ProgressBar, ActionButton, formatNum, formatDuration } from './ui-bits';
import { getItem, CRAFT_RECIPES, CraftRecipe, QUALITY_TEXT } from '@/lib/game/items';
import { cn } from '@/lib/utils';
import { ChevronLeft, Hammer, FlaskConical, Play, Square, X } from 'lucide-react';

const CATEGORY_TABS: { id: SkillCategory | 'all'; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'combat', label: '战斗' },
  { id: 'gather', label: '采集' },
  { id: 'craft', label: '生产' },
  { id: 'support', label: '辅助' },
];

export function SkillsPanel() {
  const store = useGameStore();
  const [tab, setTab] = useState<SkillCategory | 'all'>('all');
  const [detail, setDetail] = useState<SkillId | null>(null);

  const filtered = SKILLS.filter(s => tab === 'all' || s.category === tab);
  const skillDef = detail ? SKILL_MAP[detail] : null;

  if (detail && skillDef) {
    return <SkillDetail skillId={detail} onBack={() => setDetail(null)} />;
  }

  return (
    <div className="p-3 pb-24 space-y-3">
      {/* 分类过滤 */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-3 px-3">
        {CATEGORY_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border min-h-[36px]',
              tab === t.id ? 'bg-amber-900/70 border-amber-600 text-amber-200' : 'bg-stone-900 border-stone-800 text-stone-400')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 技能网格 */}
      <div className="grid grid-cols-2 gap-2">
        {filtered.map(s => {
          const prog = store.skills[s.id];
          const need = xpToNext(prog.level);
          const training = store.activeActivity ? ACTIVITY_MAP[store.activeActivity]?.skillId === s.id : false;
          const maxed = prog.level >= MAX_SKILL_LEVEL;
          return (
            <button key={s.id} onClick={() => setDetail(s.id)}
              className={cn('bg-stone-900/80 border rounded-xl p-2.5 text-left transition active:scale-[0.98]',
                training ? 'border-emerald-700' : 'border-stone-800')}>
              <div className="flex items-center gap-1.5">
                <span className="text-xl" aria-hidden>{s.icon}</span>
                <span className="text-xs font-semibold text-stone-200 flex-1">{s.name}</span>
                {training && <span className="text-[9px] px-1 rounded bg-emerald-900 text-emerald-300 animate-pulse">修炼中</span>}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold text-amber-300 tabular-nums">{prog.level}</span>
                <span className="text-[9px] text-stone-500">/{MAX_SKILL_LEVEL} 级</span>
              </div>
              <ProgressBar value={maxed ? 1 : prog.xp} max={maxed ? 1 : need} className="mt-1 h-1.5"
                barClass={training ? 'bg-emerald-500' : 'bg-amber-500'} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===== 技能详情 =====
function SkillDetail({ skillId, onBack }: { skillId: SkillId; onBack: () => void }) {
  const store = useGameStore();
  const def = SKILL_MAP[skillId];
  const prog = store.skills[skillId];
  const need = xpToNext(prog.level);
  const act = def.activityId ? ACTIVITY_MAP[def.activityId] : null;
  const training = store.activeActivity === def.activityId && !!def.activityId;
  const recipes = CRAFT_RECIPES.filter(r => r.kind === (skillId === 'cooking' ? 'cooking' : skillId === 'forging' ? 'forging' : '__none__'));

  // 效果文本
  const effectText = useMemo(() => {
    const lv = prog.level;
    switch (def.effectKey) {
      case 'hp': return `生命上限 ${40 + lv * 12}（基础 40 + 每级 12）`;
      case 'power': return `基础攻击 ${6 + lv * 2}（每级 +2）`;
      case 'weaponry': return `武器增伤 ${lv}（每级 +1 攻）`;
      case 'defence': return `防御 ${3 + Math.round(lv * 1.5)}（每级 +1.5）`;
      case 'speed': return `速度 ${5 + Math.round(lv * 0.5)}（每级 +0.5，提升闪避）`;
      case 'mining': return `当前可采 ${gatherTier(lv)} 阶矿石`;
      case 'fishing': return `当前可钓 ${gatherTier(lv)} 阶灵鱼`;
      case 'begging': return `每轮化缘 ${Math.round(25 * (1 + lv * 0.06))} 金币`;
      case 'archaeology': return `装备掉落 +${(lv * 0.2).toFixed(1)}%`;
      case 'cooking': return `可炼制 ${CRAFT_RECIPES.filter(r => r.kind === 'cooking' && r.minSkillLevel <= lv).length} 种丹药`;
      case 'forging': return `锻造装备 ${Math.min(80, lv)} 阶`;
      case 'intellect': return `全部经验 +${lv}%`;
      case 'focus': return `离线效率 ${Math.min(100, 60 + lv * 0.2).toFixed(0)}% · 上限 ${formatDuration(12 * 3600 + lv * 360)}`;
      case 'luck': return `掉落率 +${(lv * 0.5).toFixed(1)}%`;
      case 'imbibing': return `丹药效果 +${lv}%`;
      case 'insight': return `暴击率 +${(lv * 0.15).toFixed(1)}%`;
      default: return '';
    }
  }, [def.effectKey, prog.level]);

  return (
    <div className="p-3 pb-24 space-y-3">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-stone-400 min-h-[36px] px-2">
        <ChevronLeft className="w-4 h-4" /> 返回技能列表
      </button>

      {/* 技能卡 */}
      <Section className="bg-gradient-to-br from-stone-900 to-stone-900/50">
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden>{def.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-amber-100">{def.name}</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">
                {{ combat: '战斗系', gather: '采集系', craft: '生产系', support: '辅助系' }[def.category]}
              </span>
            </div>
            <div className="text-xs text-stone-400 mt-0.5">{def.description}</div>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-stone-400">等级 <b className="text-amber-300 tabular-nums">{prog.level}</b> / {MAX_SKILL_LEVEL}</span>
            <span className="text-stone-500 tabular-nums">{formatNum(prog.xp)} / {formatNum(need)}</span>
          </div>
          <ProgressBar value={prog.xp} max={need} className="h-2.5" showText />
        </div>
        <div className="mt-2 text-xs text-emerald-300 bg-emerald-950/40 rounded-lg px-2.5 py-2">
          当前效果：{effectText}
        </div>
      </Section>

      {/* 训练活动 */}
      {act && (
        <Section title="修炼活动">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl" aria-hidden>{act.icon}</span>
            <div className="flex-1">
              <div className="text-sm text-stone-200">{act.name}</div>
              <div className="text-[10px] text-stone-500">{act.description}</div>
              <div className="text-[10px] text-stone-500 mt-0.5">每轮 {act.intervalSec} 秒 · +{act.skillXp} 经验</div>
            </div>
          </div>
          {training ? (
            <div className="space-y-2">
              <ProgressBar value={store.activityProgress} max={1} className="h-2.5" barClass="bg-emerald-500" showText />
              <ActionButton variant="danger" className="w-full" onClick={() => store.stopActivity()}>
                <span className="flex items-center justify-center gap-1"><Square className="w-4 h-4" /> 停止修炼</span>
              </ActionButton>
            </div>
          ) : (
            <ActionButton className="w-full" onClick={() => store.startActivity(act.id)} disabled={prog.level >= MAX_SKILL_LEVEL}>
              <span className="flex items-center justify-center gap-1"><Play className="w-4 h-4" /> 开始修炼</span>
            </ActionButton>
          )}
          {store.activeActivity && !training && (
            <div className="text-[10px] text-stone-500 mt-1.5 text-center">
              注意：开始新活动会停止当前的「{ACTIVITY_MAP[store.activeActivity]?.name}」
            </div>
          )}
        </Section>
      )}

      {/* 战斗技能提示 */}
      {def.category === 'combat' && (
        <Section title="训练方式">
          <div className="text-xs text-stone-400 leading-relaxed">
            战斗系技能通过战斗提升——每击败一只妖兽，气血、神力、神兵、御体、遁速五项技能同时获得经验。
            开启自动战斗或在离线时勾选自动战斗，也能持续训练。
          </div>
          <ActionButton variant="ghost" className="w-full mt-2" onClick={() => store.setTab('combat')}>前往战斗</ActionButton>
        </Section>
      )}

      {/* 炼丹/锻造配方 */}
      {recipes.length > 0 && (
        <CraftSection kind={skillId === 'cooking' ? 'cooking' : 'forging'} recipes={recipes} />
      )}
    </div>
  );
}

// ===== 炼丹/锻造 =====
function CraftSection({ kind, recipes }: { kind: 'cooking' | 'forging'; recipes: CraftRecipe[] }) {
  const store = useGameStore();
  const level = store.skills[kind].level;
  const [msg, setMsg] = useState<string | null>(null);

  const doCraft = (r: CraftRecipe) => {
    const err = store.craft(r.id);
    setMsg(err ?? (kind === 'cooking' ? '丹成！' : '锻造完成！'));
    setTimeout(() => setMsg(null), 2000);
  };

  return (
    <Section title={kind === 'cooking' ? '炼丹配方' : '锻造图纸'} extra={
      <span className="text-[10px] text-stone-500 flex items-center gap-1">
        {kind === 'cooking' ? <FlaskConical className="w-3 h-3" /> : <Hammer className="w-3 h-3" />}
        {kind === 'cooking' ? '炼丹' : '锻造'} {level} 级
      </span>
    }>
      <div className="space-y-2">
        {recipes.map(r => {
          const locked = level < r.minSkillLevel;
          // 材料足够判定
          const canAfford = r.materials.every(m => {
            if (m.itemId === 'ore_dynamic') {
              const realId = `ore_${gatherTier(level)}`;
              return (store.inventory.find(i => i.itemId === realId)?.quantity ?? 0) >= m.qty;
            }
            return (store.inventory.find(i => i.itemId === m.itemId)?.quantity ?? 0) >= m.qty;
          });
          return (
            <div key={r.id} className={cn('rounded-lg border p-2.5',
              locked ? 'border-stone-800/60 opacity-50' : 'border-stone-800 bg-stone-800/40')}>
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden>{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-stone-200">{r.name}
                    {!locked && r.minSkillLevel > 1 && <span className="text-[9px] text-stone-500 ml-1">{r.minSkillLevel}级解锁</span>}
                  </div>
                  <div className="text-[10px] text-stone-500">{r.description}</div>
                  <div className="text-[10px] mt-0.5">
                    {r.materials.map(m => {
                      const realId = m.itemId === 'ore_dynamic' ? `ore_${gatherTier(level)}` : m.itemId;
                      const it = getItem(realId);
                      const have = store.inventory.find(i => i.itemId === realId)?.quantity ?? 0;
                      return (
                        <span key={m.itemId} className={cn('mr-2', have >= m.qty ? 'text-stone-400' : 'text-red-400')}>
                          {it?.icon}{it?.name} {have}/{m.qty}
                        </span>
                      );
                    })}
                    <span className="text-amber-400/80">+{r.skillXp * 3} 经验</span>
                  </div>
                </div>
                <ActionButton className="!min-h-[40px] !px-3 text-xs"
                  disabled={locked || !canAfford} onClick={() => doCraft(r)}>
                  {kind === 'cooking' ? '炼制' : '锻造'}
                </ActionButton>
              </div>
            </div>
          );
        })}
        {msg && (
          <div className={cn('text-xs text-center py-1.5 rounded-lg',
            msg.includes('不足') || msg.includes('不足') ? 'text-red-300 bg-red-950/50' : 'text-emerald-300 bg-emerald-950/50')}>
            {msg}
          </div>
        )}
      </div>
    </Section>
  );
}
