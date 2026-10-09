import { caesarStage } from './caesar';
import type { Stage } from './types';

/** 簡易版（展示）で遊べるステージ。ランナーはこの 1 本だけを受け取る */
export const exhibitionStage: Stage = caesarStage;
