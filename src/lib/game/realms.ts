// ============================================
// 境界换装：小修士形象随境界更换服饰
// （与山河画册同一位 Q 版小修士，共 8 套）
// ============================================

export interface RealmAvatarStage {
  min: number;   // 战斗技能总等级门槛
  name: string;  // 服饰名
  img: string;   // public 下路径
  desc: string;
}

export const REALM_AVATARS: RealmAvatarStage[] = [
  { min: 0, name: '凡俗布衣', img: '/avatars/realm-0.jpg', desc: '粗布麻衣，赤子之心，仙途始于足下。' },
  { min: 15, name: '练气青衫', img: '/avatars/realm-1.jpg', desc: '青衫葫芦，初窥门径，一口气引天地灵机。' },
  { min: 40, name: '筑基云袍', img: '/avatars/realm-2.jpg', desc: '蓝袍负剑，云纹在袖，筑基已固，初露锋芒。' },
  { min: 80, name: '金丹金纹', img: '/avatars/realm-3.jpg', desc: '金纹道袍，丹成一颗，坐看风云起。' },
  { min: 140, name: '元婴紫金', img: '/avatars/realm-4.jpg', desc: '紫金云袍，元婴出窍，一方修士皆识君。' },
  { min: 220, name: '化神星袍', img: '/avatars/realm-5.jpg', desc: '星纹白袍，法剑随行，神游天外摘星辰。' },
  { min: 580, name: '渡劫赤金', img: '/avatars/realm-6.jpg', desc: '赤金雷纹战袍，九重雷劫亦作砺剑石。' },
  { min: 950, name: '飞升仙衣', img: '/avatars/realm-7.jpg', desc: '白金仙衣，脚踏祥云，回望人间已千山。' },
];

// 由战斗技能总等级取当前形象阶段
export function realmAvatarIndex(cSum: number): number {
  let idx = 0;
  for (let i = 0; i < REALM_AVATARS.length; i++) {
    if (cSum >= REALM_AVATARS[i].min) idx = i;
  }
  return idx;
}

export function realmAvatar(cSum: number): RealmAvatarStage {
  return REALM_AVATARS[realmAvatarIndex(cSum)];
}
