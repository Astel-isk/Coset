import { useCallback, useRef, useState } from 'react';
import { exhibitionStages } from '../stages';
import { ClearScreen } from './ClearScreen';
import { newGame } from './game';
import type { Game } from './game';
import { IdleScreen } from './IdleScreen';
import { InterceptScreen } from './InterceptScreen';
import { NotesScreen } from './NotesScreen';
import { PlayScreen } from './PlayScreen';

/** クリア画面の内容。「もっと知る」から戻ったときに同じ画面を出せるよう、解説画面の間も保持する */
interface ClearData {
  readonly game: Game;
  readonly tried: number;
  readonly total: number;
}

type Phase =
  | { readonly kind: 'idle'; readonly game: Game }
  | { readonly kind: 'intercept'; readonly game: Game; readonly gameId: number }
  | { readonly kind: 'play'; readonly game: Game; readonly gameId: number }
  | ({ readonly kind: 'clear'; readonly revisited: boolean } & ClearData)
  | ({ readonly kind: 'notes' } & ClearData);

/** 傍受演出の見出し（状態表示）。ステージ 2 の前は「新たな電文を傍受」にする予定 */
const INTERCEPT_HEADLINE = '受信中';

/** 最初のステージの新しいゲーム。待機画面はこの出題の暗号文を切れ端として見せる */
function firstGame(): Game {
  return newGame(exhibitionStages[0], Math.random);
}

/**
 * ランナー。待機 → 傍受演出 → 解読 → クリア（⇄ もっと知る）→ 待機 を切り替える。
 * 暗号方式は知らない。出題は stage.generate、操作は stage.tools が持つ。
 * 進行状況はどこにも保存しない（EXHIBITION.md）。
 */
export function App() {
  const [phase, setPhase] = useState<Phase>(() => ({ kind: 'idle', game: firstGame() }));
  const lastGameId = useRef(0);

  // 待機に戻るたびに出題し直す。待機画面の切れ端・演出・解読は同じ出題を使う
  const restart = useCallback(() => setPhase({ kind: 'idle', game: firstGame() }), []);

  switch (phase.kind) {
    case 'idle':
      return (
        <IdleScreen
          game={phase.game}
          onStart={() => {
            lastGameId.current += 1;
            setPhase({ kind: 'intercept', game: phase.game, gameId: lastGameId.current });
          }}
        />
      );
    case 'intercept':
      return (
        <InterceptScreen
          key={phase.gameId}
          record={phase.game.record}
          ciphertext={phase.game.puzzle.ciphertext}
          headline={INTERCEPT_HEADLINE}
          onDone={() => setPhase({ kind: 'play', game: phase.game, gameId: phase.gameId })}
        />
      );
    case 'play':
      return (
        <PlayScreen
          // ゲームごとに時計盤の状態（試した鍵など）を作り直す
          key={phase.gameId}
          game={phase.game}
          onSolved={(tried, total) =>
            setPhase({ kind: 'clear', game: phase.game, tried, total, revisited: false })
          }
          onRestart={restart}
        />
      );
    case 'clear':
      return (
        <ClearScreen
          game={phase.game}
          tried={phase.tried}
          total={phase.total}
          revisited={phase.revisited}
          onMore={() => setPhase({ kind: 'notes', game: phase.game, tried: phase.tried, total: phase.total })}
          onRestart={restart}
        />
      );
    case 'notes':
      return (
        <NotesScreen
          stage={phase.game.stage}
          onBack={() =>
            setPhase({ kind: 'clear', game: phase.game, tried: phase.tried, total: phase.total, revisited: true })
          }
          onRestart={restart}
        />
      );
  }
}
