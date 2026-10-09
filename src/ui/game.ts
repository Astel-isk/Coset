import type { Puzzle, Stage } from '../stages/types';
import { generateRecord } from './record';
import type { InterceptRecord } from './record';

/** 1 回ぶんの遊び。どのステージの、どの出題で、どの傍受記録か。演出・解読・クリアの全画面で同じものを使う */
export interface Game {
  readonly stage: Stage;
  readonly puzzle: Puzzle;
  readonly record: InterceptRecord;
}

/** 新しいゲームを作る。出題と傍受記録の両方が random で決まる */
export function newGame(stage: Stage, random: () => number): Game {
  return { stage, puzzle: stage.generate(random), record: generateRecord(random) };
}
