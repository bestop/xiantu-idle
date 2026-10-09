// 背包面板：装备栏 / 物品分类 / 装备详情与对比 / 出售
'use client';

import { useMemo, useState } from 'react';
import { useGameStore } from '@/store/game';
import { getItem, QUALITY_TEXT, QUALITY_NAMES, AFFIX_NAMES, formatAffix, BaseItem } from '@/lib/game/items';
import { Equipment, EquipSlot, ItemQuality } from '@/types/game';
import { computePlayerStats, equipTotals } from '@/lib/game/engine';
import { Section, ActionButton, QualityBadge, formatNum } from './ui-bits';
import { cn } from '@/lib/utils';
import { ChevronLeft, Trash2 } from 'lucide-react';

type InvTab = 'gear' | 'pill' | 'material' | 'treasure';

const SLOT_META: Record<EquipSlot, { icon: string; label: string }> = {
  weapon: { icon: '🗡️', label: '武器' },
  armor: { icon: '🛡️', label: '护甲' },
  accessory: { icon: '💍', label: '饰品' },
};

export function InventoryPanel() {
  const store = useGameStore();
  const [tab, setTab] = useState<InvTab>('gear');
  const [detailUid, setDetailUid] = useState<string | null>(null);
  const [detailBase, setDetailBase] = useState<string | null>(null);

  const stats = computePlayerStats(store);
  const eqTotals = equipTotals(store.equipped);

  // 装备详情
  const detailEquip: Equipment | null = detailUid ? store.equips[detailUid] ?? null : null;
  const detailItem: { item: BaseItem; qty: number } | null = useMemo(() => {
    if (!detailBase) return null;
    const item = getItem(detailBase);
    const inv = store.inventory.find(i => i.itemId === detailBase);
    return item && inv ? { item, qty: inv.quantity } : null;
  }, [detailBase, store.inventory]);

  const inventory = store.inventory;
  const equips = store.equips;
  const grouped = useMemo(() => {
    const pills: { itemId: string; qty: number }[] = [];
    const materials: { itemId: string; qty: number }[] = [];
    const treasures: { itemId: string; qty: number }[] = [];
    const gearUids: string[] = [];
    for (const inv of inventory) {
      if (inv.itemId.startsWith('equip:')) {
        gearUids.push(inv.itemId.slice(6));
        continue;
      }
      const item = getItem(inv.itemId);
      if (!item) continue;
      if (item.type === 'pill') pills.push(inv);
      else if (item.type === 'treasure') treasures.push(inv);
      else materials.push(inv);
    }
    // 背包装备按品质+等级排序
    gearUids.sort((a, b) => {
      const ea = equips[a], eb = equips[b];
      if (!ea || !eb) return 0;
      const rank: Record<ItemQuality, number> = { common: 0, fine: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 };
      return (rank[eb.quality] - rank[ea.quality]) || (eb.tier - ea.tier);
    });
    return { pills, materials, treasures, gearUids };
  }, [inventory, equips]);

  if (detailEquip) {
    return <GearDetail uid={detailEquip.uid} onBack={() => setDetailUid(null)} />;
  }
  if (detailItem) {
    return <ItemDetail itemId={detailItem.item.id} qty={detailItem.qty} onBack={() => setDetailBase(null)} />;
  }

  return (
    <div className="p-3 pb-24 space-y-3">
      {/* 装备栏总览 */}
      <Section title="人物属性">
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          <AttrBox icon="❤️" label="生命" value={formatNum(stats.maxHp)} bonus={eqTotals.hp} />
          <AttrBox icon="⚔️" label="攻击" value={formatNum(stats.atk)} bonus={eqTotals.atk} />
          <AttrBox icon="🛡️" label="防御" value={formatNum(stats.def)} bonus={eqTotals.def} />
          <AttrBox icon="💨" label="速度" value={stats.speed} bonus={eqTotals.speed} />
          <AttrBox icon="🔥" label="暴击" value={`${(stats.critRate * 100).toFixed(1)}%`} />
          <AttrBox icon="🌪️" label="闪避" value={`${(stats.dodgeRate * 100).toFixed(1)}%`} />
        </div>
      </Section>

      <Section title="已装备">
        <div className="grid grid-cols-3 gap-2">
          {(['weapon', 'armor', 'accessory'] as EquipSlot[]).map(slot => {
            const eq = store.equipped[slot];
            return (
              <button key={slot} onClick={() => eq && setDetailUid(eq.uid)}
                className="bg-stone-800/60 rounded-lg p-2 min-h-[72px] flex flex-col items-center justify-center gap-1">
                {eq ? (
                  <>
                    <span className="text-2xl" aria-hidden>{eq.icon}</span>
                    <span className={cn('text-[10px] text-center leading-tight', QUALITY_TEXT[eq.quality])}>{eq.name}</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl opacity-30" aria-hidden>{SLOT_META[slot].icon}</span>
                    <span className="text-[10px] text-stone-600">{SLOT_META[slot].label}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </Section>

      {/* 分类 Tab */}
      <div className="grid grid-cols-4 gap-1.5">
        {([
          { id: 'gear', label: `装备 ${grouped.gearUids.length}` },
          { id: 'pill', label: `丹药 ${grouped.pills.length}` },
          { id: 'material', label: `材料 ${grouped.materials.length}` },
          { id: 'treasure', label: `宝藏 ${grouped.treasures.length}` },
        ] as { id: InvTab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('py-2 rounded-lg text-[11px] font-medium border min-h-[38px]',
              tab === t.id ? 'bg-amber-900/70 border-amber-600 text-amber-200' : 'bg-stone-900 border-stone-800 text-stone-400')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 装备列表 */}
      {tab === 'gear' && (
        <div className="space-y-2">
          {grouped.gearUids.length === 0 && <EmptyHint text="尚无装备，去战斗或锻造获取吧" />}
          {grouped.gearUids.map(uid => {
            const eq = store.equips[uid];
            if (!eq) return null;
            const isEquipped = Object.values(store.equipped).some(e => e?.uid === uid);
            return (
              <button key={uid} onClick={() => setDetailUid(uid)}
                className={cn('w-full bg-stone-900/80 border rounded-xl p-2.5 flex items-center gap-2.5 text-left',
                  isEquipped ? 'border-amber-700' : 'border-stone-800')}>
                <span className="text-2xl" aria-hidden>{eq.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-xs font-semibold truncate', QUALITY_TEXT[eq.quality])}>{eq.name}</span>
                    <QualityBadge quality={eq.quality} />
                    {isEquipped && <span className="text-[9px] px-1 rounded bg-amber-900 text-amber-300">已装备</span>}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5">
                    {eq.tier}阶 · {mainStatText(eq)} {eq.affixes.length > 0 && `· ${eq.affixes.length}条副属性`}
                  </div>
                </div>
                <span className="text-[10px] text-stone-500 shrink-0">🪙{formatNum(eq.sellPrice)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 丹药/材料/宝藏列表 */}
      {tab !== 'gear' && (
        <div className="space-y-2">
          {(tab === 'pill' ? grouped.pills : tab === 'material' ? grouped.materials : grouped.treasures).length === 0 && (
            <EmptyHint text="暂无物品" />
          )}
          {(tab === 'pill' ? grouped.pills : tab === 'material' ? grouped.materials : grouped.treasures).map(inv => {
            const item = getItem(inv.itemId);
            if (!item) return null;
            return (
              <button key={inv.itemId} onClick={() => setDetailBase(inv.itemId)}
                className="w-full bg-stone-900/80 border border-stone-800 rounded-xl p-2.5 flex items-center gap-2.5 text-left">
                <span className="text-2xl" aria-hidden>{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-xs font-semibold', QUALITY_TEXT[item.quality])}>{item.name}</span>
                    <span className="text-[10px] text-stone-500">×{formatNum(inv.quantity)}</span>
                  </div>
                  <div className="text-[10px] text-stone-500 truncate">{item.description}</div>
                </div>
                <span className="text-[10px] text-stone-500 shrink-0">🪙{item.sellPrice}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AttrBox({ icon, label, value, bonus }: { icon: string; label: string; value: string | number; bonus?: number }) {
  return (
    <div className="bg-stone-800/60 rounded-lg px-2 py-1.5">
      <div className="text-[10px] text-stone-500">{icon} {label}</div>
      <div className="text-sm font-semibold text-stone-200 tabular-nums">
        {value}
        {bonus !== undefined && bonus > 0 && <span className="text-[9px] text-emerald-400 ml-1">+{formatNum(bonus)}</span>}
      </div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <div className="text-center text-xs text-stone-600 py-8">{text}</div>;
}

function mainStatText(eq: Equipment): string {
  const key = eq.mainStat.key;
  if (key === 'crit' || key === 'dodge') return `${AFFIX_NAMES[key]} +${(eq.mainStat.value * 100).toFixed(1)}%`;
  return `${AFFIX_NAMES[key]} +${formatNum(eq.mainStat.value)}`;
}

// ===== 装备详情 =====
function GearDetail({ uid, onBack }: { uid: string; onBack: () => void }) {
  const store = useGameStore();
  const eq = store.equips[uid];
  if (!eq) return null;
  const isEquipped = Object.values(store.equipped).some(e => e?.uid === uid);
  const current = store.equipped[eq.slot];
  const equippedScore = current ? gearScore(current) : 0;
  const thisScore = gearScore(eq);

  return (
    <div className="p-3 pb-24 space-y-3">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-stone-400 min-h-[36px] px-2">
        <ChevronLeft className="w-4 h-4" /> 返回背包
      </button>

      <Section className="text-center">
        <div className="text-5xl mb-2" aria-hidden>{eq.icon}</div>
        <div className={cn('text-base font-bold', QUALITY_TEXT[eq.quality])}>{eq.name}</div>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <QualityBadge quality={eq.quality} />
          <span className="text-[10px] text-stone-500">{eq.tier}阶 · {SLOT_META[eq.slot].label}</span>
        </div>
      </Section>

      <Section title="属性">
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-stone-400">主属性</span>
            <span className="text-amber-300 font-semibold">{mainStatText(eq)}</span>
          </div>
          {eq.affixes.map((a, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-stone-400">副属性 {i + 1}</span>
              <span className="text-emerald-300">{AFFIX_NAMES[a.key]} {formatAffix(a.key, a.value)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-1 border-t border-stone-800">
            <span className="text-stone-400">综合评分</span>
            <span className="tabular-nums text-stone-200">{thisScore}
              {isEquipped ? <span className="text-[10px] text-amber-400 ml-1">（当前装备）</span>
                : equippedScore > 0 && <span className={thisScore >= equippedScore ? 'text-emerald-400' : 'text-red-400'}>
                  （对比当前 {equippedScore} {thisScore >= equippedScore ? '↑' : '↓'}）
                </span>}
            </span>
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-2 gap-2">
        {isEquipped ? (
          <ActionButton variant="ghost" onClick={() => { store.unequipGear(eq.slot); onBack(); }}>卸下</ActionButton>
        ) : (
          <ActionButton onClick={() => { store.equipGear(uid); onBack(); }}>装备</ActionButton>
        )}
        <ActionButton variant="danger" onClick={() => { store.sellEquipment(uid); onBack(); }}
          disabled={isEquipped}>
          <span className="flex items-center justify-center gap-1"><Trash2 className="w-4 h-4" /> 售出 🪙{formatNum(eq.sellPrice)}</span>
        </ActionButton>
      </div>
    </div>
  );
}

function gearScore(eq: Equipment): number {
  let score = 0;
  const all = [eq.mainStat, ...eq.affixes];
  for (const a of all) {
    switch (a.key) {
      case 'atk': score += a.value * 3; break;
      case 'def': score += a.value * 2.5; break;
      case 'hp': score += a.value * 0.5; break;
      case 'speed': score += a.value * 2; break;
      case 'crit': score += a.value * 400; break;
      case 'dodge': score += a.value * 350; break;
      case 'luck': score += a.value * 1; break;
    }
  }
  return Math.round(score);
}

// ===== 物品详情（丹药/材料） =====
function ItemDetail({ itemId, qty, onBack }: { itemId: string; qty: number; onBack: () => void }) {
  const store = useGameStore();
  const item = getItem(itemId);
  const [msg, setMsg] = useState<string | null>(null);
  if (!item) return null;
  const usable = item.type === 'pill';

  return (
    <div className="p-3 pb-24 space-y-3">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-stone-400 min-h-[36px] px-2">
        <ChevronLeft className="w-4 h-4" /> 返回背包
      </button>

      <Section className="text-center">
        <div className="text-5xl mb-2" aria-hidden>{item.icon}</div>
        <div className={cn('text-base font-bold', QUALITY_TEXT[item.quality])}>{item.name}</div>
        <div className="text-xs text-stone-500 mt-1">{item.description}</div>
        <div className="text-[10px] text-stone-600 mt-1">持有 {formatNum(qty)} · 单价 🪙{item.sellPrice}</div>
      </Section>

      {msg && <div className="text-xs text-center text-amber-300 bg-amber-950/50 rounded-lg py-2">{msg}</div>}

      <div className="grid grid-cols-2 gap-2">
        {usable && (
          <ActionButton onClick={() => {
            const result = store.useItem(itemId);
            if (result) { setMsg(result); setTimeout(() => setMsg(null), 2500); }
            else onBack();
          }}>使用</ActionButton>
        )}
        <ActionButton variant="danger" onClick={() => { store.sellMaterial(itemId, 1); onBack(); }}>
          卖 1 个
        </ActionButton>
        {qty > 1 && (
          <ActionButton variant="ghost" className={usable ? 'col-span-2' : ''} onClick={() => { store.sellMaterial(itemId, qty); onBack(); }}>
            全部售出 🪙{formatNum(item.sellPrice * qty)}
          </ActionButton>
        )}
      </div>
    </div>
  );
}
