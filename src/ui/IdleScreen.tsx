import { useEffect } from 'react';
import { useCompactLayout } from '../layout';
import { ALPHABET } from '../tools/clock';
import { Dial } from '../tools/Dial';
import qrImage from './assets/coset-qr.svg?inline';
import type { Game } from './game';

interface IdleScreenProps {
  /** これから遊ぶゲーム。記録番号と電文の切れ端はこの出題のものを使う */
  readonly game: Game;
  readonly onStart: () => void;
}

/** 電文の切れ端に出す暗号文の長さ（文字数） */
const TEASER_LENGTH = 26;

/**
 * 待機画面。画面のどこをクリックしても、Enter / Space でも始まる（スマホ版はタップ）。
 * 円盤は CSS でゆっくり回す（prefers-reduced-motion では止める）。
 * 「解読を始める」は見た目だけのボタン（button にすると、クリックが main にも伝わって二重に発火するため）。
 * PC 版には「スマホでも遊べる」と QR コードを出す（展示の来場者が持ち帰るため）。スマホ版は出さない。
 * QR コードは生成済みの画像を ?inline で data URI として埋め込む（4KB を超えるため、既定のままだと別ファイルに出力されて単一ファイルのビルドから外れる）。
 */
export function IdleScreen({ game, onStart }: IdleScreenProps) {
  const compact = useCompactLayout();
  // 電文の切れ端。出題の暗号文の先頭だけを見せる（待機画面は暗号方式を知らない）
  const teaser = `${game.puzzle.ciphertext.slice(0, TEASER_LENGTH).trimEnd()}...`;

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
        <p className="record">傍受記録 {game.record.no}</p>
        <h1 className="title">Coset</h1>
        <p className="subtitle">総当たりから代数へ</p>
        <div className="paper idle-paper" aria-hidden="true">
          <p className="idle-teaser">{teaser}</p>
        </div>
        <p className="cta">解読を始める</p>
        <p className="cta-note">{compact ? '画面のどこをタップしても始まる' : '画面のどこをクリックしても始まる'}</p>
        {compact ? null : (
          <aside className="idle-qr" aria-label="スマホでも遊べる">
            <p className="idle-qr-text">スマホでも遊べる</p>
            <img className="idle-qr-image" src={qrImage} alt="スマホで読み取ると coset.astelisk.com が開く QR コード" width="132" height="132" />
          </aside>
        )}
      </div>
    </main>
  );
}
