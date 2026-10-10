// ============================================
// 炼器系统：消耗矿石与金币强化装备
// 主属性 +12%/级，副词条 +6%/级，上限 +10
// 有成功率，失败不掉级（材料折损）
// ============================================

import { Equipment } from '@/types/game';
import { getItem } from './items';

export const MAX_REFINE = 10;

// 炼器所需矿石（按装备阶级取阶）与数量
export function refineOreId(eq: Equipment): string {
  const idx = Math.min(8, Math.max(1, Math.ceil(eq.tier / 10)));
  return `ore_${idx}`;
}

export function refineCost(eq: Equipment): { oreId: string; oreQty: number; gold: number } {
  const refine = eq.refine ?? 0;
  return {
    oreId: refineOreId(eq),
    oreQty: 2 + refine * 2,
    gold: Math.round(120 * Math.max(1, eq.tier) * (refine + 1)),
  };
}

// 成功率：+0 时 95%，每级 -4%，最低 55%（平衡 v2：终段更友好）
export function refineSuccessRate(eq: Equipment): number {
  const refine = eq.refine ?? 0;
  return Math.max(0.55, 0.95 - refine * 0.04);
}

// 主属性倍率
export function refineMainMult(eq: Equipment): number {
  return 1 + 0.12 * (eq.refine ?? 0);
}

// 副词条倍率
export function refineAffixMult(eq: Equipment): number {
  return 1 + 0.06 * (eq.refine ?? 0);
}

// 显示名（+N 前缀）
export function refineName(eq: Equipment): string {
  const r = eq.refine ?? 0;
  return r > 0 ? `+${r} ${eq.name}` : eq.name;
}

export function isRefinable(eq: Equipment): boolean {
  return (eq.refine ?? 0) < MAX_REFINE;
}

// 矿石持有量查询辅助（供 UI 显示材料是否足够）
export function refineOreName(eq: Equipment): string {
  return getItem(refineOreId(eq))?.name ?? '灵矿';
}
