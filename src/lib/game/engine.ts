// ============================================
// 游戏引擎：属性计算 / 回合战斗 / 掉落 / 离线结算
// ============================================

import {
  GameState, PlayerStats, MonsterDef, BattleRewards, Equipment,
  SkillId, OfflineReport, ActivityId, InvItem, EquipSlots, COMBAT_SKILLS,
} from '@/types/game';
import { xpMultiplier, dropMultiplier, critBonus, equipDropBonus, gatherTier, xpToNext, offlineEfficiency, offlineCapSeconds, ACTIVITY_MAP } from './skills';
import { generateEquipment, rollQuality, getItem, genUid } from './items';
import { MONSTER_MAP, getRecommendedMonster, getMonstersByRegion } from './monsters';

// ---------- 属性计算 ----------

export function equipTotals(equipped: EquipSlots) {
  const totals = { atk: 0, def: 0, hp: 0, crit: 0, dodge: 0, speed: 0, luck: 0 };
  (['weapon', 'armor', 'accessory'] as const).forEach(slot => {
    const e = equipped[slot];
    if (!e) return;
    const all = [e.mainStat, ...e.affixes];
    for (const a of all) {
      if (a.key === 'crit' || a.key === 'dodge') totals[a.key] += a.value;
      else totals[a.key] += a.value;
    }
  });
  return totals;
}

export function computePlayerStats(state: GameState): PlayerStats {
  const s = state.skills;
  const lv = (id: SkillId) => s[id]?.level ?? 0;
  const eq = equipTotals(state.equipped);

  // 丹药 buff
  const buffActive = state.buffExpireAt > Date.now();
  const buffAtk = buffActive ? state.activeBattleBuffAtk : 0;

  const maxHp = Math.round(40 + lv('hp') * 12 + eq.hp);
  let atk = 6 + lv('power') * 2 + lv('weaponry') * 1 + eq.atk;
  atk = Math.round(atk * (1 + buffAtk / 100));
  const def = Math.round(3 + lv('defence') * 1.5 + eq.def);
  const speed = Math.round(5 + lv('speed') * 0.5 + eq.speed);
  const critRate = Math.min(0.6, 0.05 + critBonus(lv('insight')) + eq.crit);
  const dodgeRate = Math.min(0.35, Math.max(0, (speed - 5) * 0.001) + eq.dodge);
  const luck = eq.luck + lv('luck');

  return { maxHp, atk, def, speed, critRate, dodgeRate, luck };
}

export function avgCombatLevel(state: GameState): number {
  const sum = COMBAT_SKILLS.reduce((acc, id) => acc + (state.skills[id]?.level ?? 0), 0);
  return sum / 5;
}

// ---------- 技能经验结算 ----------

export interface LevelUpResult {
  levelsGained: number;
  gemsGained: number;
  newLevels: Record<string, number>;
}

// 给指定技能加经验（含悟道加成），返回获得的总等级数
export function grantSkillXp(
  skills: GameState['skills'],
  id: SkillId,
  amount: number,
  intellectLevel: number
): { levelsGained: number; gems: number } {
  const sp = skills[id];
  if (!sp || sp.level >= 200) return { levelsGained: 0, gems: 0 };
  const mult = xpMultiplier(intellectLevel);
  let xp = sp.xp + Math.max(1, Math.round(amount * mult));
  let level = sp.level;
  let gems = 0;
  let guard = 0;
  while (level < 200 && xp >= xpToNext(level) && guard < 500) {
    xp -= xpToNext(level);
    level += 1;
    gems += 1; // Harpagia: 每级 +1 宝石
    guard++;
  }
  skills[id] = { level, xp: level >= 200 ? 0 : xp };
  return { levelsGained: level - sp.level, gems };
}

// ---------- 掉落结算 ----------

export function rollDrops(monster: MonsterDef, state: GameState, luckStat: number): BattleRewards {
  const luckMult = dropMultiplier(state.skills.luck?.level ?? 0) * (1 + luckStat * 0.003);
  const archBonus = equipDropBonus(state.skills.archaeology?.level ?? 0);
  const items: { itemId: string; qty: number }[] = [];
  const equips: Equipment[] = [];
  const cards: { monsterId: string }[] = [];

  // 材料掉落
  for (const d of monster.drops) {
    if (Math.random() < d.rate * luckMult) {
      const qty = d.qty ?? 1;
      items.push({ itemId: d.itemId, qty });
    }
  }

  // 装备掉落
  const equipRate = monster.equipDropRate * luckMult * (1 + archBonus);
  if (Math.random() < equipRate) {
    const quality = rollQuality(luckMult);
    equips.push(generateEquipment(monster.tier, quality));
  }

  // 卡片掉落
  if (Math.random() < monster.cardDropRate * luckMult) {
    cards.push({ monsterId: monster.id });
  }

  // 宝石小概率
  const gems = Math.random() < 0.02 * luckMult ? 1 : 0;

  return { exp: monster.exp, gold: monster.gold, items, equips, cards, gems };
}

// ---------- 回合制战斗模拟 ----------
// 返回 null 表示玩家败北；否则返回回合日志
export interface SimRound {
  round: number;
  playerDmg: number;
  monsterDmg: number;
  playerCrit: boolean;
  monsterCrit: boolean;
  playerDodge: boolean;
  monsterDodge: boolean;
  playerHpAfter: number;
  monsterHpAfter: number;
}

export function damageRoll(atk: number, def: number): number {
  const mitigation = def / (def + 200);
  const raw = atk * (1 - mitigation);
  return Math.max(1, Math.round(raw * (0.9 + Math.random() * 0.2)));
}

// 玩家先手；速度差提供额外行动机会
export function simulateRound(pStats: PlayerStats, pHp: number, monster: MonsterDef, mHp: number): SimRound {
  const mDef = monster.def;
  const pCrit = Math.random() < pStats.critRate;
  const mCrit = Math.random() < 0.05;

  // 玩家攻击
  let playerDodge = false;
  let monsterDodge = false;
  let playerDmg = damageRoll(pStats.atk, mDef) * (pCrit ? 2 : 1);
  // 玩家闪避怪物攻击
  playerDodge = Math.random() < pStats.dodgeRate;

  const mHpAfter = Math.max(0, mHp - playerDmg);
  let monsterDmg = 0;
  if (mHpAfter > 0) {
    monsterDmg = playerDodge ? 0 : damageRoll(monster.atk, pStats.def) * (mCrit ? 2 : 1);
  }
  const playerHpAfter = Math.max(0, pHp - monsterDmg);

  return {
    round: 0, playerDmg, monsterDmg, playerCrit: pCrit, monsterCrit: mCrit,
    playerDodge, monsterDodge, playerHpAfter, monsterHpAfter: mHpAfter,
  };
}

export function playerWins(pStats: PlayerStats, monster: MonsterDef): boolean {
  // 快速蒙特卡洛判定
  let pHp = pStats.maxHp;
  let mHp = monster.hp;
  let round = 0;
  while (pHp > 0 && mHp > 0 && round < 200) {
    round++;
    const r = simulateRound(pStats, pHp, monster, mHp);
    mHp = r.monsterHpAfter;
    pHp = r.playerHpAfter;
  }
  return pHp > 0 && mHp <= 0;
}

// ---------- 离线结算 ----------

export function computeOfflineReport(state: GameState, now: number): OfflineReport | null {
  const last = state.lastTick || now;
  const rawSeconds = Math.floor((now - last) / 1000);
  if (rawSeconds < 60) return null; // 少于 1 分钟不弹窗

  const seconds = Math.min(rawSeconds, offlineCapSeconds(state.skills.focus?.level ?? 0));
  const eff = offlineEfficiency(state.skills.focus?.level ?? 0);
  const intellect = state.skills.intellect?.level ?? 0;

  const skillXp: Record<string, number> = {};
  const items: { itemId: string; qty: number }[] = [];
  let gold = 0;
  let gems = 0;
  let battleKills = 0;
  let battleExp = 0;
  let battleGold = 0;
  const battleDrops: { itemId: string; qty: number }[] = [];

  // 1. 挂机活动（采集类）
  if (state.activeActivity) {
    const act = ACTIVITY_MAP[state.activeActivity];
    if (act) {
      const rounds = Math.floor((seconds * eff) / act.intervalSec);
      if (rounds > 0) {
        skillXp[act.skillId] = (skillXp[act.skillId] ?? 0) + rounds * act.skillXp;
        if (act.reward.gold) {
          gold += rounds * act.reward.gold;
        }
        if (act.reward.itemId) {
          // 动态物品：采矿/垂钓/寻宝按技能阶级产出
          const itemId = resolveDynamicItemId(act.id, state);
          if (itemId) {
            items.push({ itemId, qty: rounds * (act.reward.itemQty ?? 1) });
          }
          // 寻宝额外：材料随机 + 小概率装备由前端结算（简化为材料+金币）
          if (act.id === 'archaeology') {
            gold += rounds * Math.round(30 * (1 + (state.skills.archaeology?.level ?? 0) * 0.5));
            const gemRounds = Math.floor(rounds * (act.reward.gemChance ?? 0));
            gems += gemRounds;
          }
        }
      }
    }
  }

  // 2. 离线战斗（若开启自动战斗）
  if (state.autoBattleEnabled && state.initialized) {
    const pStats = computePlayerStats(state);
    const avgLv = avgCombatLevel(state);
    // 找到胜率 > 70% 的最高档怪物
    const region = state.lastRegionId || 'r1';
    const candidates = getMonstersByRegion(region).filter(m => !m.isBoss);
    let target: MonsterDef | null = null;
    for (const m of candidates) {
      if (pStats.maxHp / Math.max(1, m.atk * 0.4) > 8) target = m; // 粗略生存判定
    }
    const monster = target ?? getRecommendedMonster(avgLv);
    if (monster) {
      // 每场战斗耗时估算：max(8, rounds × 1.6s)
      const battleSec = Math.max(8, Math.ceil(monster.hp / Math.max(1, pStats.atk * 0.55)) * 1.6 + 3);
      const effSeconds = seconds * eff;
      let kills = Math.floor(effSeconds / battleSec);
      kills = Math.min(kills, 5000);
      if (kills > 0) {
        battleKills = kills;
        battleExp = kills * monster.exp;
        battleGold = kills * monster.gold;
        // 简化离线掉落：只结算材料与金币（装备概率折算次数）
        const luckMult = dropMultiplier(state.skills.luck?.level ?? 0) * (1 + pStats.luck * 0.003);
        for (const d of monster.drops) {
          const expected = kills * d.rate * luckMult;
          const got = Math.floor(expected) + (Math.random() < expected % 1 ? 1 : 0);
          if (got > 0) battleDrops.push({ itemId: d.itemId, qty: got });
        }
        const equipExpected = kills * monster.equipDropRate * luckMult;
        let eqCount = Math.floor(equipExpected) + (Math.random() < equipExpected % 1 ? 1 : 0);
        eqCount = Math.min(eqCount, 6); // 离线装备上限，避免刷爆
        for (let i = 0; i < eqCount; i++) {
          const quality = rollQuality(luckMult);
          const eq = generateEquipment(monster.tier, quality);
          items.push({ itemId: `equip:${eq.uid}`, qty: 1 });
          // 前端会从 equips 池中找 uid
          pendingOfflineEquips.push(eq);
        }
        gems += Math.floor(kills * 0.015 * luckMult);
      }
    }
  }

  if (Object.keys(skillXp).length === 0 && gold === 0 && items.length === 0 && battleKills === 0) {
    return null;
  }

  return {
    seconds: rawSeconds,
    effiency: eff,
    skillXp,
    gold,
    items,
    battleKills,
    battleExp,
    battleGold,
    battleDrops,
    gems,
  };
}

// 离线装备暂存（computeOfflineReport 内生成的装备）
export const pendingOfflineEquips: Equipment[] = [];

// 动态物品 ID 解析
export function resolveDynamicItemId(activityId: ActivityId, state: GameState): string | null {
  if (activityId === 'mining') {
    const tier = gatherTier(state.skills.mining?.level ?? 1);
    return `ore_${tier}`;
  }
  if (activityId === 'fishing') {
    const tier = gatherTier(state.skills.fishing?.level ?? 1);
    return `fish_${tier}`;
  }
  if (activityId === 'archaeology') {
    // 寻宝随机产出
    const roll = Math.random();
    if (roll < 0.4) return 'trea_gold';
    if (roll < 0.7) return 'trea_jade';
    if (roll < 0.85) return 'trea_scroll';
    if (roll < 0.95) return 'herb_2';
    return 'trea_gold';
  }
  return null;
}

// 在线 tick 结算一次活动轮次
export function activityRoundReward(activityId: ActivityId, state: GameState): {
  skillXp: number; gold: number; itemId?: string; itemQty: number; gem: boolean;
} {
  const act = ACTIVITY_MAP[activityId];
  const skillXp = act.skillXp;
  let gold = act.reward.gold ?? 0;
  let itemId: string | undefined;
  let itemQty = act.reward.itemQty ?? 0;
  let gem = act.reward.gemChance ? Math.random() < act.reward.gemChance : false;

  if (act.reward.itemId) {
    if (act.reward.itemId.endsWith('_dynamic')) {
      itemId = resolveDynamicItemId(activityId, state) ?? undefined;
    } else {
      itemId = act.reward.itemId;
    }
  }
  if (activityId === 'archaeology') {
    gold += Math.round(30 * (1 + (state.skills.archaeology?.level ?? 0) * 0.5));
  }
  if (activityId === 'begging') {
    // 化缘随等级成长
    gold = Math.round((act.reward.gold ?? 25) * (1 + (state.skills.begging?.level ?? 0) * 0.06));
  }

  return { skillXp, gold, itemId, itemQty, gem };
}

// ---------- 商店 ----------

export function getShopEntries(): { itemId: string; price: number; currency: 'gold' | 'gem'; label: string }[] {
  return [
    { itemId: 'pill_heal_s', price: 80, currency: 'gold', label: '回气散' },
    { itemId: 'pill_heal_m', price: 400, currency: 'gold', label: '回春散' },
    { itemId: 'pill_atk', price: 1200, currency: 'gold', label: '狂暴丹' },
    { itemId: 'pill_def', price: 1200, currency: 'gold', label: '铁骨丹' },
    { itemId: 'herb_1', price: 40, currency: 'gold', label: '灵草×5' },
    { itemId: 'pill_exp', price: 30, currency: 'gem', label: '悟道丹' },
    { itemId: 'pill_heal_l', price: 15, currency: 'gem', label: '九转还魂丹' },
  ];
}

// 随机装备袋（宝石购买）
export function openEquipBag(tier: number, minQuality: ItemQualityForBag): Equipment {
  const quality = rollQuality(1, minQuality === 'legendary' ? 8 : 3);
  return generateEquipment(Math.max(1, tier), quality);
}

type ItemQualityForBag = 'rare' | 'legendary';

export { getItem, genUid, MONSTER_MAP };
