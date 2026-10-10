// ============================================
// 世界 BOSS：轮换刷新 / 伤害累积挑战 / 伤害结算奖励
// ============================================

import { GameState, WorldBossState, Equipment } from '@/types/game';
import { generateEquipment } from './items';
import { computePlayerStats } from './engine';

export interface WorldBossDef {
  name: string;
  icon: string;
  tier: number;
  title: string; // 称号描述
}

// 8 大世界 BOSS，按顺序轮换（击杀或 24h 自动轮换）
export const WORLD_BOSSES: WorldBossDef[] = [
  { name: '噬山血蟒', icon: '🐍', tier: 60, title: '盘踞落霞山脉的太古凶蟒，吞灵噬髓' },
  { name: '九幽冥皇', icon: '💀', tier: 75, title: '幽冥沼泽深处的不死冥主，号令亡魂' },
  { name: '焚世炎帝', icon: '🔥', tier: 90, title: '烈焰谷地火之意志的化身，焚天煮海' },
  { name: '沧溟海皇', icon: '🌊', tier: 105, title: '四海归一的亘古龙皇，翻掌为渊' },
  { name: '万古石帝', icon: '🗿', tier: 120, title: '九天秘境最古老的地灵，不朽不灭' },
  { name: '紫雷天君', icon: '⚡', tier: 140, title: '执掌九天雷罚的无上存在，雷泽万里' },
  { name: '太阴幽后', icon: '🌙', tier: 160, title: '太阴星魂所化的冷月之主，霜寒九州' },
  { name: '混沌魔神', icon: '🌀', tier: 185, title: '开天辟地遗留的混沌残念，吞噬万象' },
];

// 世界 BOSS 属性（血量巨大，跨多次挑战累积削减）
export function wbStats(tier: number) {
  return {
    hp: Math.round(30 * Math.pow(tier, 1.55) * 8),
    atk: Math.round(1.8 * Math.pow(tier, 1.2) * 1.8),
    def: Math.round(2.6 * Math.pow(tier, 1.12) * 1.2),
  };
}

export const WB_CHALLENGE_COOLDOWN_MS = 90 * 1000; // 挑战冷却 90 秒
export const WB_MAX_ROUNDS = 15;                   // 单次挑战上限 15 回合
export const WB_ROTATE_MS = 24 * 3600 * 1000;      // 24 小时自动轮换

export function initialWorldBoss(now = Date.now()): WorldBossState {
  const s = wbStats(WORLD_BOSSES[0].tier);
  return { bossIdx: 0, hp: s.hp, spawnedAt: now, lastChallengeAt: 0, seasonDamage: 0, killed: false };
}

export function wbMaxHp(bossIdx: number): number {
  const idx = ((bossIdx % WORLD_BOSSES.length) + WORLD_BOSSES.length) % WORLD_BOSSES.length;
  return wbStats(WORLD_BOSSES[idx].tier).hp;
}

// 检查是否需要轮换（每日轮换；被击杀的轮换由结算时处理）
export function checkRotate(wb: WorldBossState, now: number): WorldBossState {
  if (now - wb.spawnedAt < WB_ROTATE_MS) return wb;
  const nextIdx = (wb.bossIdx + 1) % WORLD_BOSSES.length;
  const s = wbStats(WORLD_BOSSES[nextIdx].tier);
  return { bossIdx: nextIdx, hp: s.hp, spawnedAt: now, lastChallengeAt: 0, seasonDamage: 0, killed: false };
}

export interface WorldBossAttemptResult {
  ok: boolean;
  reason?: 'cooldown' | 'dead';
  // 战斗结果
  damage: number;        // 本次造成的总伤害
  rounds: number;        // 实际回合数
  killed: boolean;       // 是否完成击杀（将 boss 血量打穿）
  survived: boolean;     // 玩家是否撑到最后
  overkill: number;      // 击杀时的溢出伤害
  // 奖励
  exp: number;           // 五项战斗技能各得
  gold: number;
  gems: number;
  legendaryDrop: Equipment | null; // 击杀奖励
  // 更新后的世界 BOSS 状态
  worldBoss: WorldBossState;
  // 日志
  log: string[];
}

// 执行一次世界 BOSS 挑战（纯函数，返回结果与新状态）
export function runWorldBossAttempt(state: GameState, now = Date.now()): WorldBossAttemptResult {
  const wb = state.worldBoss;
  if (wb.killed) {
    return { ok: false, reason: 'dead', damage: 0, rounds: 0, killed: false, survived: false, overkill: 0, exp: 0, gold: 0, gems: 0, legendaryDrop: null, worldBoss: wb, log: [] };
  }
  if (now - wb.lastChallengeAt < WB_CHALLENGE_COOLDOWN_MS) {
    return { ok: false, reason: 'cooldown', damage: 0, rounds: 0, killed: false, survived: false, overkill: 0, exp: 0, gold: 0, gems: 0, legendaryDrop: null, worldBoss: wb, log: [] };
  }

  const idx = wb.bossIdx % WORLD_BOSSES.length;
  const boss = WORLD_BOSSES[idx];
  const stats = wbStats(boss.tier);

  // 计算玩家实战属性（含宠物/丹药 buff，由 computePlayerStats 完成）
  const p = computePlayerStats(state);

  const log: string[] = [];
  let bossHp = wb.hp;
  let pHp = p.maxHp;
  let damage = 0;
  let rounds = 0;
  let killed = false;
  let survived = true;

  const mitigation = stats.def / (stats.def + 200);
  const bossMitigation = p.def / (p.def + 200);

  while (rounds < WB_MAX_ROUNDS && pHp > 0 && !killed) {
    rounds++;
    // 玩家攻击（含暴击）
    const crit = Math.random() < p.critRate;
    const dmg = Math.max(1, Math.round(p.atk * (1 - bossMitigation) * (0.9 + Math.random() * 0.2))) * (crit ? 2 : 1);
    bossHp -= dmg;
    damage += dmg;
    log.push(`第${rounds}回合：你全力一击，造成 ${dmg.toLocaleString('zh-CN')} 点伤害${crit ? '（暴击！）' : ''}`);
    if (bossHp <= 0) { killed = true; break; }
    // BOSS 攻击（闪避可免）
    if (Math.random() < p.dodgeRate) {
      log.push(`第${rounds}回合：你身形一闪，避开了 ${boss.name} 的怒涛一击！`);
      continue;
    }
    const bDmg = Math.max(1, Math.round(stats.atk * (1 - mitigation) * (0.9 + Math.random() * 0.2)));
    pHp -= bDmg;
    log.push(`第${rounds}回合：${boss.name} 反击，你承受 ${bDmg.toLocaleString('zh-CN')} 点伤害`);
    if (pHp <= 0) { survived = false; break; }
  }

  // 伤害结算奖励（按伤害量折算，败了也有收益）
  const exp = Math.round(damage * 0.6);
  const gold = Math.round(damage * 1.2);

  let gems = Math.random() < 0.08 ? 1 : 0;
  let legendaryDrop: Equipment | null = null;
  if (killed) {
    gems += 10 + Math.floor(boss.tier / 20);
    legendaryDrop = generateEquipment(boss.tier, 'legendary');
    log.push(`🌌 ${boss.name} 轰然崩碎，天地灵气疯狂涌入你的识海！`);
  }

  // 更新 BOSS 状态
  let worldBoss: WorldBossState;
  if (killed) {
    const nextIdx = (wb.bossIdx + 1) % WORLD_BOSSES.length;
    const ns = wbStats(WORLD_BOSSES[nextIdx].tier);
    worldBoss = { bossIdx: nextIdx, hp: ns.hp, spawnedAt: now, lastChallengeAt: now, seasonDamage: wb.seasonDamage + damage, killed: false };
  } else {
    worldBoss = { ...wb, hp: Math.max(0, bossHp), lastChallengeAt: now, seasonDamage: wb.seasonDamage + damage };
  }

  return { ok: true, damage, rounds, killed, survived, overkill: killed ? -bossHp : 0, exp, gold, gems, legendaryDrop, worldBoss, log };
}

// ---------- 伤害排行榜（同服修士模拟） ----------

const WB_RANK_NAMES: { name: string; icon: string }[] = [
  { name: '剑仙李淳罡', icon: '🗡️' }, { name: '雷部行者', icon: '⚡' }, { name: '焚天谷主', icon: '🔥' },
  { name: '沧澜圣女', icon: '🌊' }, { name: '石陀罗汉', icon: '🗿' }, { name: '幽冥判官', icon: '💀' },
  { name: '太阴星主', icon: '🌙' }, { name: '御兽天王', icon: '🐉' }, { name: '阵道宗师', icon: '🔯' },
  { name: '丹鼎真君', icon: '⚗️' }, { name: '醉剑仙', icon: '🍶' }, { name: '万法散人', icon: '📜' },
];

export interface WbRankEntry {
  name: string;
  icon: string;
  damage: number;
  isPlayer: boolean;
}

// 本期伤害榜：NPC 伤害随 BOSS 血量、修行时长成长；玩家按实际累计伤害入榜
export function getWbDamageRanking(state: GameState): { entries: WbRankEntry[]; playerRank: number } {
  const wb = state.worldBoss;
  const idx = wb.bossIdx % WORLD_BOSSES.length;
  const maxHp = wbMaxHp(idx);
  const hours = Math.max(0, (Date.now() - state.stats.playStart) / 3600000);

  const npcs: WbRankEntry[] = WB_RANK_NAMES.map((n, i) => {
    // 榜首约占 BOSS 血量 14%，随游玩时长增长；越靠后占比越低
    const share = Math.max(0.004, (0.14 - i * 0.012) * (1 + Math.min(2, hours * 0.02)));
    const wobble = 1 + ((idx * 7 + i * 13) % 9) * 0.03; // 每 BOSS 期轻微浮动
    return { name: n.name, icon: n.icon, damage: Math.round(maxHp * share * wobble), isPlayer: false };
  });
  const player: WbRankEntry = {
    name: state.playerName || '你', icon: '🧙', damage: Math.round(wb.seasonDamage), isPlayer: true,
  };
  const entries = [...npcs, player].sort((a, b) => b.damage - a.damage);
  const playerRank = entries.findIndex(e => e.isPlayer) + 1;
  return { entries, playerRank };
}
