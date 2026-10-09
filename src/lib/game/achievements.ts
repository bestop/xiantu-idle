// ============================================
// 成就系统（Harpagia 式永久成就 + 宝石奖励）
// ============================================

import { AchievementDef, GameState, SkillId, COMBAT_SKILLS } from '@/types/game';
import { totalSkillLevel, combatLevelSum } from './skills';
import { TOTAL_MONSTERS } from './monsters';

export const ACHIEVEMENTS: AchievementDef[] = [
  // ===== 战斗 =====
  { id: 'battle_10', name: '初入江湖', icon: '🗡️', description: '累计战斗 10 次', metric: 'battles', target: 10, gemReward: 3 },
  { id: 'battle_100', name: '身经百战', icon: '⚔️', description: '累计战斗 100 次', metric: 'battles', target: 100, gemReward: 8 },
  { id: 'battle_1000', name: '千锤百炼', icon: '🛡️', description: '累计战斗 1000 次', metric: 'battles', target: 1000, gemReward: 25 },
  { id: 'battle_5000', name: '战意滔天', icon: '💥', description: '累计战斗 5000 次', metric: 'battles', target: 5000, gemReward: 60 },
  { id: 'kill_50', name: '降妖除魔', icon: '👹', description: '击杀 50 只妖兽', metric: 'kills', target: 50, gemReward: 5 },
  { id: 'kill_500', name: '妖兽克星', icon: '🔫', description: '击杀 500 只妖兽', metric: 'kills', target: 500, gemReward: 15 },
  { id: 'kill_5000', name: '万妖辟易', icon: '🌟', description: '击杀 5000 只妖兽', metric: 'kills', target: 5000, gemReward: 50 },
  { id: 'boss_1', name: '初斩妖王', icon: '👑', description: '击败 1 只区域 BOSS', metric: 'bossKills', target: 1, gemReward: 10 },
  { id: 'boss_10', name: '妖王终结者', icon: '☠️', description: '击败 10 只区域 BOSS', metric: 'bossKills', target: 10, gemReward: 30 },
  { id: 'boss_50', name: '伐天之路', icon: '🌩️', description: '击败 50 只区域 BOSS', metric: 'bossKills', target: 50, gemReward: 80 },
  { id: 'winrate', name: '常胜将军', icon: '🏆', description: '累计获胜 500 场', metric: 'wins', target: 500, gemReward: 20 },

  // ===== 技能 =====
  { id: 'skill_any10', name: '小有所成', icon: '📈', description: '任意技能达到 10 级', metric: 'anySkill10', target: 1, gemReward: 3 },
  { id: 'skill_any25', name: '渐入佳境', icon: '📊', description: '任意技能达到 25 级', metric: 'anySkill25', target: 1, gemReward: 6 },
  { id: 'skill_any50', name: '登堂入室', icon: '🎯', description: '任意技能达到 50 级', metric: 'anySkill50', target: 1, gemReward: 12 },
  { id: 'skill_any100', name: '炉火纯青', icon: '🔮', description: '任意技能达到 100 级', metric: 'anySkill100', target: 1, gemReward: 30 },
  { id: 'skill_any200', name: '登峰造极', icon: '♾️', description: '任意技能达到 200 级', metric: 'anySkill200', target: 1, gemReward: 100 },
  { id: 'skill_total100', name: '博采众长', icon: '📚', description: '技能总等级达到 100', metric: 'totalSkill', target: 100, gemReward: 10 },
  { id: 'skill_total500', name: '五湖四海', icon: '🌐', description: '技能总等级达到 500', metric: 'totalSkill', target: 500, gemReward: 25 },
  { id: 'skill_total1000', name: '全知全能', icon: '🧠', description: '技能总等级达到 1000', metric: 'totalSkill', target: 1000, gemReward: 60 },
  { id: 'skill_total2000', name: '道法通天', icon: '🌌', description: '技能总等级达到 2000', metric: 'totalSkill', target: 2000, gemReward: 150 },
  { id: 'combat_100', name: '武道初成', icon: '🥊', description: '战斗技能总等级达到 100', metric: 'combatSum', target: 100, gemReward: 10 },
  { id: 'combat_500', name: '武道大能', icon: '🦾', description: '战斗技能总等级达到 500', metric: 'combatSum', target: 500, gemReward: 40 },

  // ===== 财富 =====
  { id: 'gold_10k', name: '小有积蓄', icon: '💰', description: '累计获得 1 万金币', metric: 'goldEarned', target: 10000, gemReward: 5 },
  { id: 'gold_100k', name: '富甲一方', icon: '🪙', description: '累计获得 10 万金币', metric: 'goldEarned', target: 100000, gemReward: 15 },
  { id: 'gold_1m', name: '富可敌国', icon: '🏦', description: '累计获得 100 万金币', metric: 'goldEarned', target: 1000000, gemReward: 40 },

  // ===== 收集 =====
  { id: 'card_10', name: '集卡新手', icon: '🃏', description: '收集 10 种怪物卡', metric: 'cardTypes', target: 10, gemReward: 5 },
  { id: 'card_30', name: '集卡行家', icon: '🎴', description: '收集 30 种怪物卡', metric: 'cardTypes', target: 30, gemReward: 15 },
  { id: 'card_all', name: '万物图鉴', icon: '📖', description: '收集全部怪物卡', metric: 'cardTypes', target: TOTAL_MONSTERS, gemReward: 200 },
  { id: 'equip_legendary', name: '仙器在握', icon: '🎆', description: '获得一件仙品装备', metric: 'bestQualityLegendary', target: 1, gemReward: 25 },
  { id: 'equip_mythic', name: '神器降世', icon: '🌠', description: '获得一件神品装备', metric: 'bestQualityMythic', target: 1, gemReward: 80 },

  // ===== 修行 =====
  { id: 'offline_10', name: '闭关十次', icon: '🌙', description: '离线修行 10 次', metric: 'offlineSessions', target: 10, gemReward: 8 },
  { id: 'offline_50', name: '闭关老僧', icon: '🛏️', description: '离线修行 50 次', metric: 'offlineSessions', target: 50, gemReward: 20 },
  { id: 'drops_100', name: '搬运工', icon: '🎒', description: '累计获得 100 件掉落物', metric: 'drops', target: 100, gemReward: 6 },
  { id: 'drops_1000', name: '仓库管理员', icon: '📦', description: '累计获得 1000 件掉落物', metric: 'drops', target: 1000, gemReward: 20 },
];

// 计算成就当前进度
export function achievementValue(metric: string, state: GameState): number {
  switch (metric) {
    case 'battles': return state.stats.totalBattles;
    case 'wins': return state.stats.totalWins;
    case 'kills': return state.stats.totalKills;
    case 'bossKills': return state.stats.bossKills;
    case 'goldEarned': return state.stats.totalGoldEarned;
    case 'drops': return state.stats.totalDrops;
    case 'offlineSessions': return state.stats.offlineSessions;
    case 'totalSkill': return totalSkillLevel(state.skills);
    case 'combatSum': return combatLevelSum(state.skills);
    case 'cardTypes': return Object.keys(state.cards).length;
    case 'anySkill10': return Math.max(...Object.values(state.skills).map(s => s.level)) >= 10 ? 1 : 0;
    case 'anySkill25': return Math.max(...Object.values(state.skills).map(s => s.level)) >= 25 ? 1 : 0;
    case 'anySkill50': return Math.max(...Object.values(state.skills).map(s => s.level)) >= 50 ? 1 : 0;
    case 'anySkill100': return Math.max(...Object.values(state.skills).map(s => s.level)) >= 100 ? 1 : 0;
    case 'anySkill200': return Math.max(...Object.values(state.skills).map(s => s.level)) >= 200 ? 1 : 0;
    case 'bestQualityLegendary': return bestQualityAtLeast(state, 'legendary') ? 1 : 0;
    case 'bestQualityMythic': return bestQualityAtLeast(state, 'mythic') ? 1 : 0;
    default: return 0;
  }
}

const QUALITY_RANK: Record<string, number> = {
  common: 0, fine: 1, rare: 2, epic: 3, legendary: 4, mythic: 5,
};

function bestQualityAtLeast(state: GameState, q: string): boolean {
  return Object.values(state.equips).some(e => QUALITY_RANK[e.quality] >= QUALITY_RANK[q]);
}
