import { useEffect, useState } from 'react';
import type { Stage } from '../stages/types';
import { ALPHABET } from '../tools/clock';
import { Dial } from '../tools/Dial';
import { RECORD_NO } from './record';

interface IdleScreenProps {
  readonly stage: Stage;
  readonly onStart: () => void;
}

/** 電文の切れ端に出す暗号文の長さ（文字数） */
const TEASER_LENGTH = 26;

/**
 * 待機画面。画面のどこをクリックしても、Enter / Space でも始まる。
 * 円盤は CSS でゆっくり回す（prefers-reduced-motion では止める）。
 * 「解読を始める」は見た目だけのボタン（button にすると、クリックが main にも伝わって二重に発火するため）。
 */
export function IdleScreen({ stage, onStart }: IdleScreenProps) {
  // 電文の切れ端。ステージの出題から暗号文の先頭だけを借りる（待機画面は暗号方式を知らない）
  const [teaser] = useState(() => `${stage.generate(Math.random).ciphertext.slice(0, TEASER_LENGTH).trimEnd()}...`);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onStart]);

  return (
    <main className="screen idle" onClick={onStart}>
      <div className="idle-dial" aria-hidden="true">
        <Dial labels={ALPHABET.split('')} steps={0} />
      </div>
      <div className="idle-body">
        <p className="record">傍受記録 {RECORD_NO}</p>
        <h1 className="title">Coset</h1>
        <p className="subtitle">暗号解読官の代数</p>
        <div className="paper idle-paper" aria-hidden="true">
          <p className="idle-teaser">{teaser}</p>
        </div>
        <p className="cta">解読を始める</p>
        <p className="cta-note">画面のどこをクリックしても始まる</p>
      </div>
    </main>
  );
}
