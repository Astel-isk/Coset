import { useCallback, useRef, useState } from 'react';
import { exhibitionStage } from '../stages';
import type { Puzzle } from '../stages/types';
import { ClearScreen } from './ClearScreen';
import { IdleScreen } from './IdleScreen';
import { PlayScreen } from './PlayScreen';

type Phase =
  | { readonly kind: 'idle' }
  | { readonly kind: 'play'; readonly puzzle: Puzzle; readonly gameId: number }
  | { readonly kind: 'clear'; readonly puzzle: Puzzle; readonly tried: number; readonly total: number };

const stage = exhibitionStage;

/**
 * ランナー。待機 → 解読 → クリア → 待機 の 3 画面を切り替える。
 * 暗号方式は知らない。出題は stage.generate、操作は stage.tools が持つ。
 * 進行状況はどこにも保存しない（EXHIBITION.md）。
 */
export function App() {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const lastGameId = useRef(0);

  // 新しいゲームのたびに出題し直す
  const start = useCallback(() => {
    lastGameId.current += 1;
    setPhase({ kind: 'play', puzzle: stage.generate(Math.random), gameId: lastGameId.current });
  }, []);
  const restart = useCallback(() => setPhase({ kind: 'idle' }), []);

  switch (phase.kind) {
    case 'idle':
      return <IdleScreen stage={stage} onStart={start} />;
    case 'play':
      return (
        <PlayScreen
          // ゲームごとに時計盤の状態（試した鍵など）を作り直す
          key={phase.gameId}
          stage={stage}
          puzzle={phase.puzzle}
          onSolved={(tried, total) => setPhase({ kind: 'clear', puzzle: phase.puzzle, tried, total })}
          onRestart={restart}
        />
      );
    case 'clear':
      return (
        <ClearScreen
          stage={stage}
          puzzle={phase.puzzle}
          tried={phase.tried}
          total={phase.total}
          onRestart={restart}
        />
      );
  }
}
