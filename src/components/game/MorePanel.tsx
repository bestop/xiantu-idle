// 更多面板：灵宠舍 / 世界BOSS / 天梯榜 / 仙市 / 成就 / 图鉴 / 设置
'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game';
import { getShopEntries } from '@/lib/game/engine';
import { getItem, QUALITY_TEXT } from '@/lib/game/items';
import { ACHIEVEMENTS, achievementValue } from '@/lib/game/achievements';
import { REGIONS, getMonstersByRegion, TOTAL_MONSTERS } from '@/lib/game/monsters';
import { SCENES, isSceneUnlocked, unlockedSceneCount, sceneUnlockHint, SceneKind } from '@/lib/game/scenes';
import { PetPanel } from './PetPanel';
import { WorldBossPanel } from './WorldBossPanel';
import { LeaderboardPanel } from './LeaderboardPanel';
import { Section, ActionButton, formatNum } from './ui-bits';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Store, Trophy, BookOpen, Settings, AlertTriangle, PawPrint, Skull, Medal, Images } from 'lucide-react';

export function MorePanel() {
  const view = useGameStore(s => s.moreView);
  const setView = useGameStore(s => s.setMoreView);

  if (view === 'shop') return <ShopView onBack={() => setView('root')} />;
  if (view === 'achievements') return <AchievementsView onBack={() => setView('root')} />;
  if (view === 'codex') return <CodexView onBack={() => setView('root')} />;
  if (view === 'album') return <AlbumView onBack={() => setView('root')} />;
  if (view === 'pets') return <PetPanel onBack={() => setView('root')} />;
  if (view === 'worldboss') return <WorldBossPanel onBack={() => setView('root')} />;
  if (view === 'leaderboard') return <LeaderboardPanel onBack={() => setView('root')} />;
  if (view === 'settings') return <SettingsView onBack={() => setView('root')} />;

  const entries = [
    { id: 'pets', icon: <PawPrint className="w-5 h-5" />, title: '灵宠舍', desc: '收服妖兽为灵宠，出战提供属性加成', tone: 'text-emerald-300 bg-emerald-950/60 border-emerald-900/50' },
    { id: 'worldboss', icon: <Skull className="w-5 h-5" />, title: '世界 BOSS', desc: '血量持久的巨兽，伤害累积挑战', tone: 'text-rose-300 bg-rose-950/60 border-rose-900/50' },
    { id: 'leaderboard', icon: <Medal className="w-5 h-5" />, title: '天梯榜', desc: '综合实力排名，与万千修士争锋', tone: 'text-amber-300 bg-amber-950/60 border-amber-900/50' },
    { id: 'shop', icon: <Store className="w-5 h-5" />, title: '仙市', desc: '购买丹药、材料与装备宝袋', tone: 'text-stone-300 bg-stone-800/80 border-stone-700/50' },
    { id: 'achievements', icon: <Trophy className="w-5 h-5" />, title: '成就', desc: '永久成就与宝石奖励', tone: 'text-amber-300 bg-amber-950/60 border-amber-900/50' },
    { id: 'codex', icon: <BookOpen className="w-5 h-5" />, title: '妖兽图鉴', desc: '收集怪物卡片，点亮图鉴', tone: 'text-stone-300 bg-stone-800/80 border-stone-700/50' },
    { id: 'album', icon: <Images className="w-5 h-5" />, title: '山河画册', desc: '小修士的旅行明信片，到访一处收录一张', tone: 'text-sky-300 bg-sky-950/60 border-sky-900/50' },
    { id: 'settings', icon: <Settings className="w-5 h-5" />, title: '设置', desc: '重置存档与游戏说明', tone: 'text-stone-300 bg-stone-800/80 border-stone-700/50' },
  ] as const;

  return (
    <div className="p-3 pb-24 space-y-2">
      {entries.map(e => (
        <button key={e.id} onClick={() => setView(e.id)}
          className={cn('w-full bg-stone-900/80 border rounded-xl p-3.5 flex items-center gap-3 text-left active:scale-[0.99] min-h-[64px] transition-colors hover:bg-stone-900',
            e.id === 'worldboss' ? 'border-rose-900/60' : 'border-stone-800')}>
          <span className={cn('w-10 h-10 rounded-lg border flex items-center justify-center shrink-0', e.tone)} aria-hidden>
            {e.icon}
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-stone-200">{e.title}</div>
            <div className="text-[10px] text-stone-500">{e.desc}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-600 shrink-0" />
        </button>
      ))}
      <div className="text-center text-[10px] text-stone-600 pt-2">
        仙途挂机 · 文字放置修仙 · 灵感来自 Harpagia
      </div>
    </div>
  );
}

// ===== 仙市 =====
function ShopView({ onBack }: { onBack: () => void }) {
  const store = useGameStore();
  const entries = getShopEntries();
  const [msg, setMsg] = useState<string | null>(null);
  const avgLv = Math.max(1, Math.round(
    (['hp', 'weaponry', 'power', 'defence', 'speed'] as const).reduce((a, id) => a + store.skills[id].level, 0) / 5
  ));

  return (
    <div className="p-3 pb-24 space-y-3">
      <SubHeader title="仙市" onBack={onBack} />
      {msg && <div className="text-xs text-center text-amber-300 bg-amber-950/50 rounded-lg py-2">{msg}</div>}

      <Section title="金币商品">
        <div className="space-y-2">
          {entries.filter(e => e.currency === 'gold').map(e => {
            const item = getItem(e.itemId);
            if (!item) return null;
            return (
              <div key={e.itemId} className="flex items-center gap-2.5 bg-stone-800/40 border border-stone-800 rounded-lg p-2.5">
                <span className="text-2xl" aria-hidden>{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={cn('text-xs font-semibold', QUALITY_TEXT[item.quality])}>{item.name}</div>
                  <div className="text-[10px] text-stone-500 truncate">{item.description}</div>
                </div>
                <ActionButton className="!min-h-[40px] !px-3 text-xs" onClick={() => {
                  const err = store.buyShopItem(e.itemId);
                  if (err) { setMsg(err); setTimeout(() => setMsg(null), 2000); }
                }}>🪙 {formatNum(e.price)}</ActionButton>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="宝石商品">
        <div className="space-y-2">
          {entries.filter(e => e.currency === 'gem').map(e => {
            const item = getItem(e.itemId);
            if (!item) return null;
            return (
              <div key={e.itemId} className="flex items-center gap-2.5 bg-stone-800/40 border border-stone-800 rounded-lg p-2.5">
                <span className="text-2xl" aria-hidden>{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={cn('text-xs font-semibold', QUALITY_TEXT[item.quality])}>{item.name}</div>
                  <div className="text-[10px] text-stone-500 truncate">{item.description}</div>
                </div>
                <ActionButton className="!min-h-[40px] !px-3 text-xs" onClick={() => {
                  const err = store.buyShopItem(e.itemId);
                  if (err) { setMsg(err); setTimeout(() => setMsg(null), 2000); }
                }}>💎 {e.price}</ActionButton>
              </div>
            );
          })}
          <div className="flex items-center gap-2.5 bg-purple-950/30 border border-purple-900/60 rounded-lg p-2.5">
            <span className="w-10 h-10 rounded-lg border border-purple-800/50 bg-purple-950/60 flex items-center justify-center text-xl shrink-0" aria-hidden>🎁</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-purple-300">稀有装备宝袋</div>
              <div className="text-[10px] text-stone-500">开出一件 {avgLv} 阶上品及以上随机装备</div>
            </div>
            <ActionButton className="!min-h-[40px] !px-3 text-xs" onClick={() => {
              const eq = store.buyEquipBag('rare');
              if (eq) { setMsg(`获得【${eq.name}】！`); setTimeout(() => setMsg(null), 2500); }
            }}>💎 20</ActionButton>
          </div>
          <div className="flex items-center gap-2.5 bg-amber-950/30 border border-amber-900/60 rounded-lg p-2.5">
            <span className="w-10 h-10 rounded-lg border border-amber-800/50 bg-amber-950/60 flex items-center justify-center text-xl shrink-0" aria-hidden>🎑</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-amber-300">仙品装备宝袋</div>
              <div className="text-[10px] text-stone-500">开出一件 {avgLv} 阶仙品随机装备</div>
            </div>
            <ActionButton className="!min-h-[40px] !px-3 text-xs" onClick={() => {
              const eq = store.buyEquipBag('legendary');
              if (eq) { setMsg(`获得【${eq.name}】！`); setTimeout(() => setMsg(null), 2500); }
            }}>💎 60</ActionButton>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ===== 成就 =====
function AchievementsView({ onBack }: { onBack: () => void }) {
  const store = useGameStore();
  const done = ACHIEVEMENTS.filter(a => {
    const s = store.achievements[a.id];
    return s?.claimed || achievementValue(a.metric, store) >= a.target;
  }).length;

  return (
    <div className="p-3 pb-24 space-y-3">
      <SubHeader title={`成就 (${done}/${ACHIEVEMENTS.length})`} onBack={onBack} />
      <div className="space-y-2">
        {ACHIEVEMENTS.map(a => {
          const value = achievementValue(a.metric, store);
          const state = store.achievements[a.id];
          const achieved = (state?.claimed || value >= a.target);
          const pct = Math.min(100, (value / a.target) * 100);
          return (
            <div key={a.id} className={cn('rounded-xl border p-3',
              achieved ? 'bg-emerald-950/30 border-emerald-800' : 'bg-stone-900/80 border-stone-800')}>
              <div className="flex items-center gap-2.5">
                <span className={cn('text-2xl', !achieved && 'opacity-40 grayscale')} aria-hidden>{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-xs font-semibold', achieved ? 'text-emerald-300' : 'text-stone-300')}>{a.name}</span>
                    {state?.claimed && <span className="text-[9px] px-1 rounded bg-emerald-900 text-emerald-300">已领</span>}
                  </div>
                  <div className="text-[10px] text-stone-500">{a.description} · 奖励 💎{a.gemReward}</div>
                  {!achieved && (
                    <div className="mt-1 h-1 bg-stone-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
                {!state?.claimed && value >= a.target && (
                  <ActionButton className="!min-h-[36px] !px-3 text-xs" onClick={() => store.claimAchievement(a.id)}>领取</ActionButton>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== 妖兽图鉴 =====
function CodexView({ onBack }: { onBack: () => void }) {
  const store = useGameStore();
  const collected = Object.keys(store.cards).length;
  const [regionId, setRegionId] = useState(REGIONS[0].id);
  const monsters = getMonstersByRegion(regionId);

  return (
    <div className="p-3 pb-24 space-y-3">
      <SubHeader title={`妖兽图鉴 (${collected}/${TOTAL_MONSTERS})`} onBack={onBack} />

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-3 px-3">
        {REGIONS.map(r => (
          <button key={r.id} onClick={() => setRegionId(r.id)}
            className={cn('shrink-0 px-3 py-1.5 rounded-lg text-xs border min-h-[36px] transition-all',
              regionId === r.id
                ? 'bg-gradient-to-b from-amber-800/80 to-amber-950/70 border-amber-500/60 text-amber-100'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700')}>
            {r.icon}{r.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {monsters.map(m => {
          const count = store.cards[m.id] ?? 0;
          const has = count > 0;
          return (
            <div key={m.id}
              className={cn('rounded-xl border p-2.5 text-center',
                has ? 'bg-stone-900/80 border-stone-700' : 'bg-stone-950/60 border-stone-800/50')}>
              <div className={cn('text-2xl', has ? '' : 'opacity-20 grayscale')} aria-hidden>{m.icon}</div>
              <div className={cn('text-[10px] mt-1 truncate', has ? 'text-stone-300' : 'text-stone-600')}>
                {has ? m.name : '？？？'}
              </div>
              <div className="text-[9px] text-stone-600">{has ? `卡片 ×${count}` : '未收集'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== 山河画册（旅行青蛙式明信片相册） =====
const ALBUM_GROUPS: { kind: SceneKind; label: string }[] = [
  { kind: 'home', label: '我的洞府' },
  { kind: 'region', label: '行走山河' },
  { kind: 'activity', label: '修行手记' },
  { kind: 'boss', label: '强敌之影' },
];

function AlbumView({ onBack }: { onBack: () => void }) {
  const store = useGameStore();
  const unlocked = unlockedSceneCount(store);

  return (
    <div className="p-3 pb-24 space-y-4">
      <SubHeader title={`山河画册 (${unlocked}/${SCENES.length})`} onBack={onBack} />
      <p className="text-[10px] text-stone-500 leading-relaxed">
        同一位白衣小修士，走过一处山水，便寄回一张明信片。
      </p>

      {ALBUM_GROUPS.map(group => {
        const scenes = SCENES.filter(s => s.kind === group.kind);
        if (scenes.length === 0) return null;
        const got = scenes.filter(s => isSceneUnlocked(s, store)).length;
        return (
          <div key={group.kind} className="space-y-2">
            <div className="flex items-center gap-2">
              <span aria-hidden className="w-1 h-3.5 rounded-full bg-gradient-to-b from-amber-400 to-amber-700" />
              <span className="text-xs font-semibold text-stone-300">{group.label}</span>
              <span className="text-[10px] text-stone-600 tabular-nums">{got}/{scenes.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {scenes.map(s => {
                const has = isSceneUnlocked(s, store);
                return (
                  <div key={s.id}
                    className={cn('relative rounded-xl overflow-hidden border aspect-[4/3]',
                      has ? 'border-stone-700 bg-stone-900' : 'border-stone-800/60 bg-stone-950/60')}>
                    <img src={s.img} alt={has ? s.name : '未解锁'}
                      className={cn('absolute inset-0 w-full h-full object-cover transition',
                        has ? '' : 'opacity-15 blur-[6px] grayscale scale-110')} />
                    {has && <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />}
                    <div className="absolute bottom-0 inset-x-0 px-2 py-1.5">
                      <div className={cn('text-[11px] font-semibold truncate', has ? 'text-white' : 'text-stone-600')}>
                        {has ? s.name : '？？？'}
                      </div>
                      {has ? (
                        <div className="text-[9px] text-stone-300/90 line-clamp-2 leading-snug">{s.caption}</div>
                      ) : (
                        <div className="text-[9px] text-stone-600 flex items-center gap-1">
                          🔒 {sceneUnlockHint(s)}
                        </div>
                      )}
                    </div>
                    {has && (
                      <span aria-hidden className="absolute top-1.5 right-1.5 text-[8px] px-1 py-0.5 rounded bg-black/45 text-amber-200/90 border border-white/10">已收录</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {unlocked === SCENES.length ? (
        <div className="text-center text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-900/50 rounded-xl py-2.5">
          山河尽收眼底，仙途从未止步。画册已集齐！
        </div>
      ) : (
        <div className="text-center text-[10px] text-stone-600">
          去更远的山河，寄回更多的明信片。
        </div>
      )}
    </div>
  );
}

// ===== 设置 =====
function SettingsView({ onBack }: { onBack: () => void }) {
  const store = useGameStore();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="p-3 pb-24 space-y-3">
      <SubHeader title="设置" onBack={onBack} />

      <Section title="游戏说明">
        <div className="text-[11px] text-stone-400 space-y-1.5 leading-relaxed">
          <p>《仙途挂机》是一款 Harpagia 式文字放置修仙 RPG。</p>
          <p>· <b className="text-stone-300">16 项技能</b>：5 项战斗技能随战斗成长，11 项生活技能通过活动修炼，上限 200 级。</p>
          <p>· <b className="text-stone-300">真实离线进度</b>：关闭页面后角色继续修炼、战斗、采集（受定力技能影响），回来领取收益。</p>
          <p>· <b className="text-stone-300">随机装备</b>：主属性与副词条完全随机，品质决定强度，气运影响掉落。</p>
          <p>· <b className="text-stone-300">灵宠</b>：战胜妖兽小概率收服，出战提供属性加成并随战斗成长。</p>
          <p>· <b className="text-stone-300">世界 BOSS</b>：血量跨挑战持久的巨兽，按伤害结算奖励，击杀得仙品装备。</p>
          <p>· <b className="text-stone-300">天梯榜</b>：综合实力排名，与万千修士争锋。</p>
          <p>· <b className="text-stone-300">永久成长</b>：无强制转生，技能每升 1 级 +1 宝石，成就另有宝石奖励。</p>
          <p>· 存档保存在浏览器本地。</p>
        </div>
      </Section>

      <Section title="危险操作">
        {confirming ? (
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs text-red-300 bg-red-950/50 rounded-lg p-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              确定要删除全部存档、重新开始吗？此操作不可恢复！
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton variant="danger" onClick={() => { store.resetGame(); }}>确认重置</ActionButton>
              <ActionButton variant="ghost" onClick={() => setConfirming(false)}>取消</ActionButton>
            </div>
          </div>
        ) : (
          <ActionButton variant="danger" className="w-full" onClick={() => setConfirming(true)}>重置游戏存档</ActionButton>
        )}
      </Section>
    </div>
  );
}

// ===== 通用子页头 =====
function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-1 pb-1">
      <button onClick={onBack} className="text-stone-400 min-h-[40px] min-w-[40px] flex items-center justify-center -ml-1 rounded-lg hover:bg-stone-900" aria-label="返回">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h2 className="font-xianzi text-base font-bold text-gold-grad tracking-widest">{title}</h2>
    </div>
  );
}
