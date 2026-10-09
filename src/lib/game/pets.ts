// ============================================
// 灵宠系统：捕获 / 成长 / 出战加成
// ============================================

import { PetInstance, MonsterDef } from '@/types/game';
import { MONSTER_MAP } from './monsters';
import { xpToNext } from './skills';
import { genUid } from './items';

export const MAX_PET_LEVEL = 200;
export const MAX_PETS = 12; // 灵宠栏上限

// 捕获概率：战胜后有概率将妖兽收为灵宠（气运与气运技能提升概率；妖王更难）
export function captureChance(luckStat: number, monster: MonsterDef): number {
  const base = monster.isBoss ? 0.01 : 0.035;
  return Math.min(0.3, base + luckStat * 0.0006);
}

export function makePet(monsterId: string): PetInstance {
  return { uid: genUid(), monsterId, level: 1, xp: 0, capturedAt: Date.now() };
}

// 宠物自身战斗属性（随等级成长）
export function petStats(pet: PetInstance) {
  const m = MONSTER_MAP[pet.monsterId];
  const lv = pet.level;
  return {
    atk: Math.round(m.atk * (1 + lv * 0.05)),
    def: Math.round(m.def * (1 + lv * 0.04)),
    hp: Math.round(m.hp * (1 + lv * 0.08)),
  };
}

// 出战宠物给玩家的属性加成（随宠物等级与本体强度成长）
export function petBonus(pet: PetInstance | null): { atk: number; def: number; hp: number } {
  if (!pet) return { atk: 0, def: 0, hp: 0 };
  const s = petStats(pet);
  return {
    atk: Math.round(s.atk * 0.3),
    def: Math.round(s.def * 0.3),
    hp: Math.round(s.hp * 0.4),
  };
}

// 灵宠经验曲线：基础曲线 × 1.5（宠物升级略慢于战斗技能）
export function petXpToNext(level: number): number {
  return Math.round(xpToNext(level) * 1.5);
}

// 给宠物加经验（返回新实例；不修改原对象）
export function grantPetXp(pet: PetInstance, amount: number): {
  pet: PetInstance; levelsGained: number;
} {
  if (pet.level >= MAX_PET_LEVEL) return { pet, levelsGained: 0 };
  let xp = pet.xp + Math.max(1, Math.round(amount));
  let level = pet.level;
  let guard = 0;
  while (level < MAX_PET_LEVEL && xp >= petXpToNext(level) && guard < 500) {
    xp -= petXpToNext(level);
    level += 1;
    guard++;
  }
  if (level >= MAX_PET_LEVEL) xp = 0;
  return { pet: { ...pet, level, xp }, levelsGained: level - pet.level };
}

// 放生收益（金币）
export function releaseGold(pet: PetInstance): number {
  const m = MONSTER_MAP[pet.monsterId];
  return Math.round(m.tier * 600 + pet.level * 120);
}
