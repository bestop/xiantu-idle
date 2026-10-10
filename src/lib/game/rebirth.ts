// ============================================
// 转生系统：渡劫之后，轮回再修
// 重置全部技能换取转生点数（永久加成）
// ============================================

import { GameState, RebirthState } from '@/types/game';
import { combatLevelSum } from './skills';

// 转生门槛：战斗技能总等级达到渡劫期
export const REBIRTH_MIN_COMBAT = 750;

// 转生点数 = 战斗技能总等级 / 25（向下取整）
export function rebirthPointsGain(combatSum: number): number {
  return Math.floor(combatSum / 25);
}

// 每点加成：技能经验 +1%，攻击与生命 +0.5%
export const BONUS_XP_PER_POINT = 0.01;
export const BONUS_STAT_PER_POINT = 0.005;

// 转生保留：金币/宝石/装备/灵宠/卡片/成就/宗门/画册/称号
// 转生重置：16 项技能归 1、挂机活动停止、丹药 buff 清除
export const REBIRTH_KEEP_DESC = '金币、宝石、装备、灵宠、卡片、成就、宗门、画册与称号全部保留';

// 转生次数称号（自动拥有，前缀显示）
export function rebirthPrefix(count: number): string {
  if (count <= 0) return '';
  if (count === 1) return '一世·';
  if (count === 2) return '二世·';
  if (count === 3) return '三世·';
  return `${count}世·`;
}

// 转生次数 → 限定称号
export const REBIRTH_TITLES: { count: number; id: string; name: string }[] = [
  { count: 1, id: 'rebirth_1', name: '轮回修士' },
  { count: 3, id: 'rebirth_3', name: '逆天改命' },
  { count: 5, id: 'rebirth_5', name: '万世真君' },
];

export function initialRebirth(): RebirthState {
  return { count: 0, points: 0 };
}

// 是否满足转生条件
export function canRebirth(state: GameState): boolean {
  return combatLevelSum(state.skills) >= REBIRTH_MIN_COMBAT;
}

// 兼容旧存档
export function normalizeRebirth(r: RebirthState | undefined): RebirthState {
  return r ? { count: r.count ?? 0, points: r.points ?? 0 } : initialRebirth();
}
