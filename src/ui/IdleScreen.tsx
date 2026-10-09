import { useEffect } from 'react';
import { ALPHABET } from '../tools/clock';
import { Dial } from '../tools/Dial';

interface IdleScreenProps {
  readonly onStart: () => void;
}

/**
 * 待機画面。画面のどこをクリックしても、Enter / Space でも始まる。
 * 円盤は CSS でゆっくり回す（prefers-reduced-motion では止める）。
 */
export function IdleScreen({ onStart }: IdleScreenProps) {
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
        <h1 className="title">Coset</h1>
        <p className="subtitle">暗号解読官の代数</p>
        <p className="tagline">傍受した通信を解読せよ</p>
        <p className="cta">クリックして開始</p>
      </div>
    </main>
  );
}
