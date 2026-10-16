import { useCallback, useRef, useState } from 'react';
import { exhibitionStages } from '../stages';
import type { Stage } from '../stages/types';
import { BriefingScreen } from './BriefingScreen';
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
  | { readonly kind: 'intercept'; readonly game: Game; readonly gameId: number; readonly headline: string }
  | { readonly kind: 'briefing'; readonly game: Game; readonly gameId: number }
  | { readonly kind: 'play'; readonly game: Game; readonly gameId: number }
  | ({ readonly kind: 'clear'; readonly revisited: boolean } & ClearData)
  | ({ readonly kind: 'notes' } & ClearData);

/**
 * 傍受演出の見出し（状態表示）。待機からの最初の演出は「受信中」。
 * 次のステージの前は、そのステージのデータ（Stage.arrival）の文言を使い、なければ既定の「新たな電文を傍受」
 * （クリア画面の主ボタンも同様に、既定は「次の暗号に挑む」）。
 */
const INTERCEPT_HEADLINE = '受信中';
const DEFAULT_NEXT_HEADLINE = '新たな電文を傍受';
const DEFAULT_NEXT_LABEL = '次の暗号に挑む';

/** 最初のステージの新しいゲーム。待機画面はこの出題の暗号文を切れ端として見せる */
function firstGame(): Game {
  return newGame(exhibitionStages[0], Math.random);
}

/** 次のステージ。最後のステージなら undefined */
function nextStageOf(stage: Stage): Stage | undefined {
  return exhibitionStages[exhibitionStages.indexOf(stage) + 1];
}

/**
 * ランナー。待機 → 傍受演出 → 説明 → 解読 → クリア（⇄ もっと知る）→ 待機 を切り替える。
 * クリア後に次のステージがあれば、主ボタン（既定は「次の暗号に挑む」）で傍受演出 → 説明 → 次のステージの解読へ進む。
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
            setPhase({
              kind: 'intercept',
              game: phase.game,
              gameId: lastGameId.current,
              headline: INTERCEPT_HEADLINE,
            });
          }}
        />
      );
    case 'intercept':
      return (
        <InterceptScreen
          key={phase.gameId}
          record={phase.game.record}
          ciphertext={phase.game.puzzle.ciphertext}
          headline={phase.headline}
          onDone={() => setPhase({ kind: 'briefing', game: phase.game, gameId: phase.gameId })}
        />
      );
    case 'briefing':
      return (
        <BriefingScreen
          key={phase.gameId}
          stage={phase.game.stage}
          record={phase.game.record}
          onDone={() => setPhase({ kind: 'play', game: phase.game, gameId: phase.gameId })}
          onRestart={restart}
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
    case 'clear': {
      const next = nextStageOf(phase.game.stage);
      return (
        <ClearScreen
          game={phase.game}
          tried={phase.tried}
          total={phase.total}
          revisited={phase.revisited}
          nextLabel={next ? (next.arrival?.challengeLabel ?? DEFAULT_NEXT_LABEL) : undefined}
          onNext={() => {
            if (!next) return;
            // 次のステージは新しい出題・記録番号・傍受時刻で始める
            lastGameId.current += 1;
            setPhase({
              kind: 'intercept',
              game: newGame(next, Math.random),
              gameId: lastGameId.current,
              headline: next.arrival?.interceptHeadline ?? DEFAULT_NEXT_HEADLINE,
            });
          }}
          onMore={() => setPhase({ kind: 'notes', game: phase.game, tried: phase.tried, total: phase.total })}
          onRestart={restart}
        />
      );
    }
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
