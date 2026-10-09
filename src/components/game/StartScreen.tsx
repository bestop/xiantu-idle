// 开局：输入道号创建角色
'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game';
import { ActionButton } from './ui-bits';

const RANDOM_NAMES = ['云无心', '叶孤鸿', '苏青璃', '陆沉舟', '洛惊鸿', '顾长风', '白凝霜', '秦无衣', '沈墨白', '姜寒烟'];

export function StartScreen() {
  const createCharacter = useGameStore(s => s.createCharacter);
  const [name, setName] = useState('');

  const start = (finalName: string) => {
    createCharacter(finalName.trim() || RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-gradient-to-b from-stone-950 via-stone-900 to-amber-950/60">
      <div className="text-center mb-8">
        <div className="text-6xl mb-3 animate-float" aria-hidden>⛰️</div>
        <h1 className="text-3xl font-bold tracking-widest text-amber-100">仙途挂机</h1>
        <p className="text-xs text-stone-500 mt-2 tracking-wide">文字放置修仙 · 十六道技艺 · 闭关亦修行</p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && start(name)}
          maxLength={8}
          placeholder="道号（最多 8 字）"
          aria-label="道号"
          className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3.5 text-sm text-amber-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-600 text-center"
        />
        <ActionButton className="w-full !min-h-[48px]" onClick={() => start(name)}>
          踏入仙途
        </ActionButton>
        <button
          onClick={() => start(RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)])}
          className="w-full text-xs text-stone-500 hover:text-stone-300 py-2"
        >
          随机道号
        </button>
      </div>

      <div className="mt-10 text-[10px] text-stone-600 text-center leading-relaxed max-w-xs">
        修行之路始于足下：<br />战斗锻体，采矿炼丹，垂钓化缘，闭关亦有所得。
      </div>
    </div>
  );
}
