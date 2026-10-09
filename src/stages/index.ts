import { caesarStage } from './caesar';
import type { Stage } from './types';

/** 簡易版（展示）で遊べるステージを、遊ぶ順に並べる。ランナーは先頭から順に進める */
export const exhibitionStages: readonly [Stage, ...Stage[]] = [caesarStage];
