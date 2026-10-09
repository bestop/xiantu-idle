// 灵宠舍：宠物列表 / 出战管理 / 放生
'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game';
import { MONSTER_MAP } from '@/lib/game/monsters';
import { petStats, petBonus, petXpToNext, releaseGold, MAX_PETS, MAX_PET_LEVEL } from '@/lib/game/pets';
import { Section, ProgressBar, ActionButton, formatNum } from './ui-bits';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';

export function PetPanel({ onBack }: { onBack: () => void }) {
  const store = useGameStore();
  const pets = store.pets ?? [];
  const [confirmUid, setConfirmUid] = useState<string | null>(null);

  const activePet = pets.find(p => p.uid === store.activePetUid) ?? null;

  return (
    <div className="p-3 pb-24 space-y-3">
      <div className="flex items-center gap-1">
        <button onClick={onBack} className="text-stone-400 min-h-[40px] min-w-[40px] flex items-center justify-center" aria-label="返回">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-bold text-amber-100">灵宠舍（{pets.length}/{MAX_PETS}）</h2>
      </div>

      <Section title="灵宠机制">
        <div className="text-[11px] text-stone-400 space-y-1 leading-relaxed">
          <p>· 战胜妖兽后小概率将其<b className="text-emerald-300">收服为灵宠</b>，气运越高越容易，妖王极难收服。</p>
          <p>· 设置<b className="text-amber-300">出战</b>的灵宠会为主人提供属性加成，并随战斗获得经验升级。</p>
          <p>· 灵宠等级越高加成越强；放生灵宠可换取金币。</p>
        </div>
      </Section>

      {pets.length === 0 ? (
        <div className="text-center py-10 bg-stone-900/60 border border-stone-800 rounded-xl">
          <div className="text-4xl mb-2 opacity-40" aria-hidden>🥚</div>
          <div className="text-xs text-stone-500">尚未收服任何灵宠</div>
          <div className="text-[10px] text-stone-600 mt-1">去战斗页挑战妖兽试试运气吧</div>
        </div>
      ) : (
        <div className="space-y-2">
          {pets.map(pet => {
            const m = MONSTER_MAP[pet.monsterId];
            const ps = petStats(pet);
            const bonus = petBonus(pet);
            const isActive = pet.uid === store.activePetUid;
            const xpNeed = petXpToNext(pet.level);
            return (
              <div key={pet.uid}
                className={cn('rounded-xl border p-3 space-y-2',
                  isActive ? 'bg-emerald-950/30 border-emerald-700' : 'bg-stone-900/80 border-stone-800')}>
                <div className="flex items-center gap-2.5">
                  <div className={cn('text-3xl', isActive && 'animate-pulse')} aria-hidden>{m.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-sm font-semibold truncate', isActive ? 'text-emerald-300' : 'text-stone-200')}>
                        {m.name}
                      </span>
                      <span className="text-[10px] text-stone-500">Lv.{pet.level}</span>
                      {isActive && <span className="text-[9px] px-1 rounded bg-emerald-900 text-emerald-300">出战中</span>}
                    </div>
                    <div className="text-[10px] text-stone-500 tabular-nums mt-0.5">
                      攻 {formatNum(ps.atk)} · 防 {formatNum(ps.def)} · 血 {formatNum(ps.hp)}
                      {pet.level < MAX_PET_LEVEL && <span className="text-stone-600"> · 升级需 {formatNum(xpNeed)} 经验</span>}
                    </div>
                  </div>
                </div>

                <ProgressBar value={pet.xp} max={xpNeed} className="h-1.5"
                  barClass={isActive ? 'bg-emerald-500' : 'bg-stone-600'} />

                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] text-amber-300/90 tabular-nums">
                    出战加成：攻+{formatNum(bonus.atk)} 防+{formatNum(bonus.def)} 血+{formatNum(bonus.hp)}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {isActive ? (
                      <ActionButton variant="ghost" className="!min-h-[36px] !px-3 text-xs"
                        onClick={() => store.setActivePet(null)}>休息</ActionButton>
                    ) : (
                      <ActionButton className="!min-h-[36px] !px-3 text-xs"
                        onClick={() => store.setActivePet(pet.uid)}>出战</ActionButton>
                    )}
                    {confirmUid === pet.uid ? (
                      <>
                        <ActionButton variant="danger" className="!min-h-[36px] !px-2.5 text-xs"
                          onClick={() => { store.releasePet(pet.uid); setConfirmUid(null); }}>确认</ActionButton>
                        <ActionButton variant="ghost" className="!min-h-[36px] !px-2.5 text-xs"
                          onClick={() => setConfirmUid(null)}>取消</ActionButton>
                      </>
                    ) : (
                      <button onClick={() => setConfirmUid(pet.uid)}
                        className="bg-stone-800 border border-stone-700 text-stone-400 rounded-lg px-2.5 min-h-[36px] text-[11px] active:scale-95">
                        放生 +{formatNum(releaseGold(pet))}🪙
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
