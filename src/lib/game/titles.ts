// ============================================
// 限定称号注册表：画册集齐 / 弟子位阶 / 转生轮回
// 玩家可任选一枚佩戴，展示在主页角色卡
// ============================================

import { GameState, SectId } from '@/types/game';
import { SECT_MAP, sectRank, sectTitleId } from './sects';
import { REBIRTH_TITLES } from './rebirth';

export interface TitleDef {
  id: string;
  name: string;
  desc: string;
}

// 固定称号（画册 / 转生）
export const FIXED_TITLES: TitleDef[] = [
  { id: 'title_shanhe', name: '山河行者', desc: '集齐画册「行走山河」全部明信片' },
  { id: 'title_baiyi', name: '百艺修士', desc: '集齐画册「修行手记」全部明信片' },
  { id: 'title_huasheng', name: '画圣·山河印心', desc: '集齐整本山河画册（限定）' },
  ...REBIRTH_TITLES.map(t => ({ id: t.id, name: t.name, desc: `转生 ${t.count} 次达成` })),
];

export const TITLE_MAP: Record<string, TitleDef> = Object.fromEntries(
  FIXED_TITLES.map(t => [t.id, t])
);

// 弟子位阶称号（随宗门与贡献动态生成）
export function sectRankTitle(sectId: SectId, rankKey: string): TitleDef {
  const sect = SECT_MAP[sectId];
  const rankName = sectRank(9999).name; // fallback
  const names: Record<string, string> = { outer: '外门弟子', inner: '内门弟子', true: '真传弟子' };
  return {
    id: sectTitleId(sectId, rankKey),
    name: `${sect.name}·${names[rankKey] ?? rankName}`,
    desc: `${sect.name}位阶称号`,
  };
}

// 获取称号定义（含宗门动态称号）
export function getTitleDef(id: string, state: GameState): TitleDef | null {
  if (TITLE_MAP[id]) return TITLE_MAP[id];
  // 宗门称号：sect_{sectId}_{rank}
  if (id.startsWith('sect_')) {
    const parts = id.split('_');
    if (parts.length === 3) {
      const [, sectId, rank] = parts;
      const names: Record<string, string> = { outer: '外门弟子', inner: '内门弟子', true: '真传弟子' };
      const sect = SECT_MAP[sectId as SectId];
      if (sect && names[rank]) {
        return { id, name: `${sect.name}·${names[rank]}`, desc: `${sect.name}位阶称号` };
      }
    }
  }
  return null;
}

// 当前应授予的宗门称号 id（由累计贡献决定）
export function currentSectTitleId(state: GameState): string | null {
  const sect = state.sect;
  if (!sect) return null;
  return sectTitleId(sect.sectId, sectRank(sect.totalContrib).key);
}

// 兼容旧存档
export function normalizeTitles(state: { titles?: string[]; activeTitle?: string | null }): {
  titles: string[]; activeTitle: string | null;
} {
  return {
    titles: state.titles ?? [],
    activeTitle: state.activeTitle ?? null,
  };
}

// 佩戴展示名
export function activeTitleName(state: GameState): string | null {
  if (!state.activeTitle) return null;
  return getTitleDef(state.activeTitle, state)?.name ?? null;
}
