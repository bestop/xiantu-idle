// 开局：输入道号创建角色
'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game';
import { ActionButton } from './ui-bits';
import { Dices } from 'lucide-react';

const RANDOM_NAMES = ['云无心', '叶孤鸿', '苏青璃', '陆沉舟', '洛惊鸿', '顾长风', '白凝霜', '秦无衣', '沈墨白', '姜寒烟'];

const FEATURES = ['十六道技艺', '百余妖兽', '离线修行', '灵宠仙缘'];

export function StartScreen() {
  const createCharacter = useGameStore(s => s.createCharacter);
  const [name, setName] = useState('');

  const start = (finalName: string) => {
    createCharacter(finalName.trim() || RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-stone-950 relative overflow-hidden">
      <div className="xiantu-bg" aria-hidden />

      <div className="relative z-10 w-full max-w-xs">
        {/* Logo 区 */}
        <div className="text-center mb-9">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full border border-amber-600/40 bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/70 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.18),inset_0_1px_0_0_rgba(255,255,255,0.06)] animate-float">
            <span className="text-5xl" aria-hidden>⛰️</span>
          </div>
          <h1 className="font-xianzi text-4xl tracking-[0.5em] pl-[0.5em] text-gold-grad drop-shadow-[0_2px_12px_rgba(245,158,11,0.25)]">
            仙途
          </h1>
          <p className="text-[11px] text-stone-500 mt-3 tracking-[0.2em]">
            文字放置修仙 · 闭关亦有所得
          </p>
        </div>

        {/* 创建角色 */}
        <div className="space-y-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && start(name)}
            maxLength={8}
            placeholder="道号（最多 8 字）"
            aria-label="道号"
            className="w-full bg-stone-900/80 border border-stone-700 rounded-xl px-4 py-3.5 text-sm text-amber-100 placeholder:text-stone-600 text-center transition focus:outline-none focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/20 focus:shadow-[0_0_20px_rgba(245,158,11,0.12)]"
          />
          <ActionButton className="w-full !min-h-[48px] !text-base tracking-[0.3em] pl-[0.3em]" onClick={() => start(name)}>
            踏入仙途
          </ActionButton>
          <button
            onClick={() => start(RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)])}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-stone-500 hover:text-amber-300 transition-colors py-2 min-h-[36px]"
          >
            <Dices className="w-3.5 h-3.5" aria-hidden /> 随机道号
          </button>
        </div>

        {/* 特性 chips */}
        <div className="mt-8 flex flex-wrap justify-center gap-1.5">
          {FEATURES.map(f => (
            <span key={f} className="text-[10px] text-stone-500 bg-stone-900/70 border border-stone-800 rounded-full px-2.5 py-1">
              {f}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 z-10 text-[10px] text-stone-600 text-center leading-relaxed px-8">
        修行之路始于足下：<br />战斗锻体，采矿炼丹，垂钓化缘，闭关亦有所得。
      </div>
    </div>
  );
}
