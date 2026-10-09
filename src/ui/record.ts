import { randomInt } from '../random';

/** 傍受記録。記録番号と傍受時刻は出題のたびに変え、演出・解読画面・クリア画面で同じ値を使う */
export interface InterceptRecord {
  /** 記録番号。4 桁のゼロ埋め（0001〜9999） */
  readonly no: string;
  /** 傍受時刻。HH:MM */
  readonly time: string;
}

/** 記録番号の最大値（0000 は欠番） */
const RECORD_NO_MAX = 9999;

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

/** 傍受記録を作る。random は [0, 1) の一様乱数を返す関数（テストでは固定列を渡せる） */
export function generateRecord(random: () => number): InterceptRecord {
  const no = pad(1 + randomInt(random, RECORD_NO_MAX), 4);
  const hour = randomInt(random, 24);
  const minute = randomInt(random, 60);
  return { no, time: `${pad(hour, 2)}:${pad(minute, 2)}` };
}

/** 電文の紙の見出し（例: 電文 ・ 傍受 22:14 ・ 発信元 不明） */
export function paperHead(record: InterceptRecord): string {
  return `電文 ・ 傍受 ${record.time} ・ 発信元 不明`;
}
