// ============================================
// Zustand 游戏状态 Store
// ============================================

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  GameState, SkillId, ActivityId, TabId, BattleRewards, EquipSlot,
  Equipment, OfflineReport, InvItem, AchievementState,
} from '@/types/game';
import { ACTIVITY_MAP, xpToNext, gatherTier } from '@/lib/game/skills';
import {
  computePlayerStats, grantSkillXp, computeOfflineReport, resolveDynamicItemId,
  activityRoundReward, pendingOfflineEquips, getShopEntries, openEquipBag,
} from '@/lib/game/engine';
import { getItem, generateEquipment, genUid, CRAFT_RECIPES, rollQuality } from '@/lib/game/items';
import { MONSTER_MAP } from '@/lib/game/monsters';
import { ACHIEVEMENTS, achievementValue } from '@/lib/game/achievements';

const emptySkills = (): Record<SkillId, { level: number; xp: number }> => {
  const ids: SkillId[] = [
    'hp', 'weaponry', 'power', 'defence', 'speed',
    'mining', 'fishing', 'cooking', 'begging', 'forging',
    'intellect', 'focus', 'luck', 'imbibing', 'insight', 'archaeology',
  ];
  return Object.fromEntries(ids.map(id => [id, { level: 1, xp: 0 }])) as Record<SkillId, { level: number; xp: number }>;
};

const initialStats = () => ({
  totalBattles: 0, totalWins: 0, totalKills: 0, bossKills: 0,
  totalGoldEarned: 0, totalExpEarned: 0, totalDrops: 0,
  offlineSessions: 0, playStart: Date.now(),
});

const initialState: GameState = {
  initialized: false,
  playerName: '',
  lastTick: Date.now(),
  tab: 'home',
  gold: 100,
  gems: 5,
  skills: emptySkills(),
  activeActivity: null,
  activityProgress: 0,
  inventory: [],
  equips: {},
  equipped: { weapon: null, armor: null, accessory: null },
  cards: {},
  lastRegionId: 'r1',
  autoBattleEnabled: false,
  activeBattleBuffAtk: 0,
  buffExpireAt: 0,
  achievements: {},
  stats: initialStats(),
  pendingOfflineReport: null,
};

export interface GameStore extends GameState {
  hydrated: boolean;
  toast: string | null;
  toastSeq: number;

  // 生命周期
  markHydrated: () => void;
  createCharacter: (name: string) => void;
  resetGame: () => void;
  setTab: (tab: TabId) => void;
  showToast: (msg: string) => void;
  clearToast: () => void;

  // 活动
  startActivity: (id: ActivityId) => void;
  stopActivity: () => void;
  tick: () => void;

  // 战斗
  setRegion: (regionId: string) => void;
  toggleAutoBattle: () => void;
  applyBattleResult: (monsterId: string, won: boolean, rewards: BattleRewards) => void;

  // 物品
  useItem: (itemId: string) => string | null;
  consumeItem: (itemId: string, qty?: number) => boolean;
  equipGear: (uid: string) => void;
  unequipGear: (slot: EquipSlot) => void;
  sellMaterial: (itemId: string, qty: number) => void;
  sellEquipment: (uid: string) => void;

  // 商店
  buyShopItem: (itemId: string) => string | null;
  buyEquipBag: (kind: 'rare' | 'legendary') => Equipment | null;
  craft: (recipeId: string) => string | null;

  // 成就
  checkAchievements: () => void;
  claimAchievement: (id: string) => void;

  // 离线
  settleOffline: () => void;
  dismissOfflineReport: () => void;
}

function addItem(inventory: InvItem[], itemId: string, qty: number): InvItem[] {
  const idx = inventory.findIndex(i => i.itemId === itemId);
  if (idx >= 0) {
    const next = [...inventory];
    next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
    return next;
  }
  return [...inventory, { itemId, quantity: qty }];
}

function removeItem(inventory: InvItem[], itemId: string, qty: number): InvItem[] {
  const idx = inventory.findIndex(i => i.itemId === itemId);
  if (idx < 0) return inventory;
  const next = [...inventory];
  const q = next[idx].quantity - qty;
  if (q <= 0) return next.filter(i => i.itemId !== itemId);
  next[idx] = { ...next[idx], quantity: q };
  return next;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      hydrated: false,
      toast: null,
      toastSeq: 0,

      markHydrated: () => {
        set({ hydrated: true });
        get().settleOffline();
      },

      createCharacter: (name) => {
        set({
          ...initialState,
          stats: { ...initialStats(), playStart: Date.now() },
          lastTick: Date.now(),
          initialized: true,
          playerName: name || '无名散修',
        });
        get().showToast(`道友 ${name || '无名散修'}，踏上仙途！`);
      },

      resetGame: () => {
        set({ ...initialState, lastTick: Date.now(), hydrated: true });
      },

      setTab: (tab) => set({ tab }),

      showToast: (msg) => set(s => ({ toast: msg, toastSeq: s.toastSeq + 1 })),
      clearToast: () => set({ toast: null }),

      // ---------- 活动 ----------
      startActivity: (id) => set({ activeActivity: id, activityProgress: 0 }),
      stopActivity: () => set({ activeActivity: null, activityProgress: 0 }),

      tick: () => {
        const state = get();
        const now = Date.now();
        if (!state.initialized) { set({ lastTick: now }); return; }

        const deltaSec = Math.max(0, (now - state.lastTick) / 1000);
        // 超过 90 秒的空窗交给 settleOffline（页面可见性恢复）处理
        if (deltaSec > 90) { set({ lastTick: now }); return; }

        let gold = state.gold;
        let gems = state.gems;
        const skills = { ...state.skills };
        let inventory = state.inventory;
        let activityProgress = state.activityProgress;
        let levelUps = 0;

        // 活动推进（基于真实时间差，兼容后台限流）
        if (state.activeActivity) {
          const act = ACTIVITY_MAP[state.activeActivity];
          if (act) {
            activityProgress += deltaSec / act.intervalSec;
            let guard = 0;
            while (activityProgress >= 1 && guard < 60) {
              activityProgress -= 1;
              guard++;
              // 结算一轮
              const r = activityRoundReward(state.activeActivity, state);
              const res = grantSkillXp(skills, act.skillId, r.skillXp, skills.intellect.level);
              levelUps += res.levelsGained;
              gems += res.gems;
              if (r.gold > 0) { gold += r.gold; }
              if (r.itemId && r.itemQty > 0) {
                inventory = addItem(inventory, r.itemId, r.itemQty);
              }
              if (r.gem) { gems += 1; }
            }
          }
        }

        set({
          lastTick: now,
          gold, gems, skills, inventory,
          activityProgress,
        });

        // 定期检查成就（每 5 秒）
        if (Math.floor(now / 1000) % 5 === 0 || levelUps > 0) {
          get().checkAchievements();
        }
      },

      // 消耗物品（战斗中喝药等场景由 UI 自己处理逻辑）
      consumeItem: (itemId, qty = 1) => {
        const state = get();
        const inv = state.inventory.find(i => i.itemId === itemId);
        if (!inv || inv.quantity < qty) return false;
        set({ inventory: removeItem(state.inventory, itemId, qty) });
        return true;
      },

      // ---------- 战斗 ----------
      setRegion: (regionId) => set({ lastRegionId: regionId }),
      toggleAutoBattle: () => set(s => ({ autoBattleEnabled: !s.autoBattleEnabled })),

      applyBattleResult: (monsterId, won, rewards) => {
        const state = get();
        const monster = MONSTER_MAP[monsterId];
        if (!monster) return;

        const skills = { ...state.skills };
        let gems = state.gems;
        let levelUps = 0;

        if (won) {
          // 5 项战斗技能各得经验
          for (const id of ['hp', 'weaponry', 'power', 'defence', 'speed'] as SkillId[]) {
            const r = grantSkillXp(skills, id, rewards.exp, skills.intellect.level);
            gems += r.gems;
            levelUps += r.levelsGained;
          }
        }

        // 物品入包
        let inventory = state.inventory;
        const equips = { ...state.equips };
        const cards = { ...state.cards };
        let drops = 0;

        for (const it of rewards.items) {
          inventory = addItem(inventory, it.itemId, it.qty);
          drops += it.qty;
        }
        for (const eq of rewards.equips) {
          equips[eq.uid] = eq;
          inventory = addItem(inventory, `equip:${eq.uid}`, 1);
          drops += 1;
        }
        for (const c of rewards.cards) {
          cards[c.monsterId] = (cards[c.monsterId] ?? 0) + 1;
          drops += 1;
        }

        const gold = state.gold + (won ? rewards.gold : 0) + rewards.gems * 0;
        const stats = {
          ...state.stats,
          totalBattles: state.stats.totalBattles + 1,
          totalWins: state.stats.totalWins + (won ? 1 : 0),
          totalKills: state.stats.totalKills + (won ? 1 : 0),
          bossKills: state.stats.bossKills + (won && monster.isBoss ? 1 : 0),
          totalGoldEarned: state.stats.totalGoldEarned + (won ? rewards.gold : 0),
          totalExpEarned: state.stats.totalExpEarned + (won ? rewards.exp : 0),
          totalDrops: state.stats.totalDrops + drops,
        };

        set({ skills, gems, inventory, equips, cards, gold, stats });
        get().checkAchievements();
      },

      // ---------- 物品 ----------
      useItem: (itemId) => {
        const state = get();
        const item = getItem(itemId);
        const inv = state.inventory.find(i => i.itemId === itemId);
        if (!item || !inv || item.type !== 'pill') return '该物品无法使用';
        if (item.pillEffect === undefined) return '该物品无法使用';

        const stats = computePlayerStats(state);
        let message = '';
        const skills = { ...state.skills };

        if (item.pillEffect === 'heal') {
          return `${item.name}请在战斗中使用`;
        }
        if (item.pillEffect === 'exp') {
          let gems = state.gems;
          let levelUps = 0;
          for (const id of ['hp', 'weaponry', 'power', 'defence', 'speed'] as SkillId[]) {
            const r = grantSkillXp(skills, id, item.pillValue ?? 500, skills.intellect.level);
            gems += r.gems;
            levelUps += r.levelsGained;
          }
          const inventory = removeItem(state.inventory, itemId, 1);
          set({ skills, gems, inventory });
          message = `服下${item.name}，五项战斗技能各涨修为${levelUps > 0 ? `（升级 ${levelUps} 次）` : ''}`;
          get().checkAchievements();
          return message;
        }
        // buff 类
        const buffPct = item.pillEffect === 'buffAtk' ? (item.pillValue ?? 30) : (item.pillValue ?? 40);
        const buffAtk = item.pillEffect === 'buffAtk' ? buffPct : 0;
        set({
          activeBattleBuffAtk: buffAtk || state.activeBattleBuffAtk,
          buffExpireAt: Date.now() + 10 * 60 * 1000,
          inventory: removeItem(state.inventory, itemId, 1),
        });
        message = `服下${item.name}，${item.pillEffect === 'buffAtk' ? '攻击' : '防御'}提升 ${buffPct}%（10 分钟）`;
        return message;
      },

      equipGear: (uid) => {
        const state = get();
        const eq = state.equips[uid];
        if (!eq) return;
        const equipped = { ...state.equipped };
        const prev = equipped[eq.slot];
        equipped[eq.slot] = eq;
        set({ equipped });
        get().showToast(`已装备 ${eq.name}`);
      },

      unequipGear: (slot) => {
        const state = get();
        if (!state.equipped[slot]) return;
        const equipped = { ...state.equipped };
        equipped[slot] = null;
        set({ equipped });
      },

      sellMaterial: (itemId, qty) => {
        const state = get();
        const item = getItem(itemId);
        const inv = state.inventory.find(i => i.itemId === itemId);
        if (!item || !inv) return;
        const sellQty = Math.min(qty, inv.quantity);
        const goldGain = item.sellPrice * sellQty;
        const inventory = removeItem(state.inventory, itemId, sellQty);
        set({
          inventory,
          gold: state.gold + goldGain,
          stats: { ...state.stats, totalGoldEarned: state.stats.totalGoldEarned + goldGain },
        });
        get().showToast(`售出 ${item.name}×${sellQty}，获得 ${goldGain} 金币`);
      },

      sellEquipment: (uid) => {
        const state = get();
        const eq = state.equips[uid];
        if (!eq) return;
        const equips = { ...state.equips };
        delete equips[uid];
        const inventory = removeItem(state.inventory, `equip:${uid}`, 1);
        set({
          equips,
          inventory,
          gold: state.gold + eq.sellPrice,
          stats: { ...state.stats, totalGoldEarned: state.stats.totalGoldEarned + eq.sellPrice },
        });
        get().showToast(`售出 ${eq.name}，获得 ${eq.sellPrice} 金币`);
      },

      // ---------- 商店 ----------
      buyShopItem: (itemId) => {
        const state = get();
        const entry = getShopEntries().find(e => e.itemId === itemId);
        if (!entry) return '商品不存在';
        if (entry.currency === 'gold') {
          if (state.gold < entry.price) return '金币不足';
          set({
            gold: state.gold - entry.price,
            inventory: addItem(state.inventory, itemId, itemId === 'herb_1' ? 5 : 1),
          });
        } else {
          if (state.gems < entry.price) return '宝石不足';
          set({
            gems: state.gems - entry.price,
            inventory: addItem(state.inventory, itemId, 1),
          });
        }
        get().showToast(`购得 ${entry.label}`);
        return null;
      },

      buyEquipBag: (kind) => {
        const state = get();
        const price = kind === 'legendary' ? 60 : 20;
        if (state.gems < price) {
          get().showToast('宝石不足');
          return null;
        }
        const avgLv = Math.max(1, Math.round(
          (['hp', 'weaponry', 'power', 'defence', 'speed'] as SkillId[])
            .reduce((a, id) => a + state.skills[id].level, 0) / 5
        ));
        const eq = kind === 'legendary'
          ? generateEquipment(Math.max(1, avgLv), 'legendary')
          : openEquipBag(avgLv, 'rare');
        const equips = { ...state.equips };
        equips[eq.uid] = eq;
        set({
          gems: state.gems - price,
          equips,
          inventory: addItem(state.inventory, `equip:${eq.uid}`, 1),
        });
        get().showToast(`开启宝袋，获得【${eq.name}】！`);
        return eq;
      },

      // ---------- 生产（炼丹/锻造） ----------
      craft: (recipeId) => {
        const state = get();
        const recipe = CRAFT_RECIPES.find(r => r.id === recipeId);
        if (!recipe) return '配方不存在';
        const skillLevel = state.skills[recipe.kind].level;
        if (skillLevel < recipe.minSkillLevel) return `${recipe.kind === 'cooking' ? '炼丹' : '锻造'}等级不足（需 ${recipe.minSkillLevel} 级）`;

        // 检查材料（ore_dynamic 按锻造阶级解析）
        let inventory = state.inventory;
        const consumed: { itemId: string; qty: number }[] = [];
        for (const m of recipe.materials) {
          const realId = m.itemId === 'ore_dynamic'
            ? `ore_${gatherTier(skillLevel)}`
            : m.itemId;
          const have = inventory.find(i => i.itemId === realId)?.quantity ?? 0;
          if (have < m.qty) {
            const mat = getItem(realId);
            return `材料不足：${mat?.name ?? realId} ×${m.qty}`;
          }
          consumed.push({ itemId: realId, qty: m.qty });
        }
        for (const c of consumed) {
          inventory = removeItem(inventory, c.itemId, c.qty);
        }

        const skills = { ...state.skills };
        let gems = state.gems;
        const res = grantSkillXp(skills, recipe.kind, recipe.skillXp * 3, skills.intellect.level);
        gems += res.gems;

        let equips = state.equips;
        let toast = '';
        if (recipe.kind === 'cooking' && recipe.outputItemId) {
          inventory = addItem(inventory, recipe.outputItemId, 1);
          const out = getItem(recipe.outputItemId);
          toast = `炼成 ${out?.icon}${out?.name}！`;
        } else if (recipe.kind === 'forging') {
          // 锻造：装备阶级随锻造等级，百炼/大师提高品质权重
          const tier = Math.max(1, Math.min(80, skillLevel));
          const bonusRare = recipeId === 'forge_master' ? 10 : recipeId === 'forge_refined' ? 4 : 0;
          const quality = rollQuality(1 + skillLevel * 0.01, bonusRare);
          const eq = generateEquipment(tier, quality);
          equips = { ...equips, [eq.uid]: eq };
          inventory = addItem(inventory, `equip:${eq.uid}`, 1);
          toast = `锻造出【${eq.name}】！`;
        }

        set({ inventory, skills, gems, equips });
        get().showToast(toast);
        get().checkAchievements();
        return null;
      },

      // ---------- 成就 ----------
      checkAchievements: () => {
        const state = get();
        let gems = state.gems;
        const achievements = { ...state.achievements };
        let unlockedAny = false;

        for (const def of ACHIEVEMENTS) {
          const cur = achievements[def.id];
          if (cur?.claimed) continue;
          const value = achievementValue(def.metric, state);
          if (!cur || cur.bestValue < value) {
            achievements[def.id] = { ...(cur ?? { claimed: false, bestValue: 0 }), bestValue: value };
          }
          if (value >= def.target && !(cur?.claimed)) {
            achievements[def.id] = { bestValue: value, claimed: true };
            gems += def.gemReward;
            unlockedAny = true;
            get().showToast(`🏆 达成成就【${def.name}】 +${def.gemReward}💎`);
          }
        }
        if (unlockedAny || JSON.stringify(achievements) !== JSON.stringify(state.achievements)) {
          set({ achievements, gems });
        }
      },

      claimAchievement: (id) => {
        const state = get();
        const def = ACHIEVEMENTS.find(a => a.id === id);
        const cur = state.achievements[id];
        if (!def || !cur || cur.claimed) return;
        const value = achievementValue(def.metric, state);
        if (value < def.target) return;
        set({
          achievements: { ...state.achievements, [id]: { bestValue: value, claimed: true } },
          gems: state.gems + def.gemReward,
        });
        get().showToast(`🏆 领取成就奖励 +${def.gemReward}💎`);
      },

      // ---------- 离线 ----------
      settleOffline: () => {
        const state = get();
        if (!state.initialized) return;
        const now = Date.now();
        const report = computeOfflineReport(state, now);
        if (!report) {
          set({ lastTick: now });
          return;
        }

        // 应用报告
        const skills = { ...state.skills };
        let gems = state.gems;
        let gold = state.gold;
        let inventory = state.inventory;
        const equips = { ...state.equips };

        // 技能经验
        for (const [skillId, xp] of Object.entries(report.skillXp)) {
          const r = grantSkillXp(skills, skillId as SkillId, xp, skills.intellect.level);
          gems += r.gems;
        }

        // 活动金币
        gold += report.gold;

        // 物品
        for (const it of report.items) {
          if (it.itemId.startsWith('equip:')) {
            const uid = it.itemId.slice(6);
            const eq = pendingOfflineEquips.find(e => e.uid === uid);
            if (eq) {
              equips[uid] = eq;
              inventory = addItem(inventory, it.itemId, it.qty);
            }
          } else {
            inventory = addItem(inventory, it.itemId, it.qty);
          }
        }
        pendingOfflineEquips.length = 0;

        // 离线战斗
        if (report.battleKills > 0) {
          gold += report.battleGold;
          for (const id of ['hp', 'weaponry', 'power', 'defence', 'speed'] as SkillId[]) {
            const r = grantSkillXp(skills, id, report.battleExp, skills.intellect.level);
            gems += r.gems;
          }
          for (const d of report.battleDrops) {
            inventory = addItem(inventory, d.itemId, d.qty);
          }
        }

        gems += report.gems;

        const stats = {
          ...state.stats,
          totalGoldEarned: state.stats.totalGoldEarned + report.gold + report.battleGold,
          totalExpEarned: state.stats.totalExpEarned + report.battleExp,
          totalKills: state.stats.totalKills + report.battleKills,
          totalWins: state.stats.totalWins + report.battleKills,
          totalBattles: state.stats.totalBattles + report.battleKills,
          offlineSessions: state.stats.offlineSessions + 1,
        };

        set({
          lastTick: now,
          skills, gems, gold, inventory, equips, stats,
          pendingOfflineReport: report,
        });
        get().checkAchievements();
      },

      dismissOfflineReport: () => set({ pendingOfflineReport: null }),
    }),
    {
      name: 'xiantu-idle-save-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const { hydrated, toast, toastSeq, ...rest } = state;
        void hydrated; void toast; void toastSeq;
        return rest as GameState & { pendingOfflineReport: OfflineReport | null };
      },
      onRehydrateStorage: () => (state) => {
        // 水合完成后标记
        if (state) {
          setTimeout(() => {
            state.markHydrated();
          }, 0);
        }
      },
    }
  )
);

// 辅助：当前是否有未读离线报告
export function hasOfflineReport(state: GameState): boolean {
  return state.pendingOfflineReport !== null;
}
