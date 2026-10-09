import { describe, expect, it } from 'vitest';
import { decrypt, encrypt } from '../stages/vigenereStub';
import { currentKeys, initialState, ownersOfWords, reducer, totalTried } from './multiState';
import type { MultiState } from './multiState';

const M = 26;

function run(state: MultiState, ...actions: Parameters<typeof reducer>[1][]): MultiState {
  return actions.reduce(reducer, state);
}

describe('initialState', () => {
  it('円盤の枚数ぶんずらし量 0 で、先頭が操作対象。開始時の 0 は試した鍵に数えない', () => {
    const s = initialState(3);
    expect(s.active).toBe(0);
    expect(s.pos).toEqual([0, 0, 0]);
    expect(s.tried.map((t) => t.size)).toEqual([0, 0, 0]);
    expect(totalTried(s)).toBe(0);
  });
});

describe('reducer', () => {
  it('select で操作対象が変わり、範囲外は無視する', () => {
    expect(run(initialState(3), { type: 'select', dial: 2 }).active).toBe(2);
    expect(run(initialState(3), { type: 'select', dial: 3 }).active).toBe(0);
    expect(run(initialState(3), { type: 'select', dial: -1 }).active).toBe(0);
  });

  it('move は操作対象の円盤だけを回す', () => {
    const s = run(initialState(3), { type: 'select', dial: 1 }, { type: 'move', delta: 5, modulus: M });
    expect(s.pos).toEqual([0, 5, 0]);
    expect(currentKeys(s, M)).toEqual([0, 5, 0]);
  });

  it('試した鍵は円盤ごとに数え、同じ鍵に戻っても増えない', () => {
    let s = initialState(3);
    s = run(s, { type: 'move', delta: 1, modulus: M }, { type: 'move', delta: 1, modulus: M }, { type: 'move', delta: -1, modulus: M });
    expect(s.tried.map((t) => t.size)).toEqual([2, 0, 0]);
    s = run(s, { type: 'select', dial: 2 }, { type: 'move', delta: 3, modulus: M });
    expect(s.tried.map((t) => [...t].sort((a, b) => a - b))).toEqual([[1, 2], [], [3]]);
    expect(totalTried(s)).toBe(3);
  });

  it('開始時の 0 は数えないが、動かして 0 に戻って止まったら数える', () => {
    let s = run(initialState(3), { type: 'move', delta: 1, modulus: M });
    expect([...(s.tried[0] ?? [])]).toEqual([1]);
    s = run(s, { type: 'move', delta: -1, modulus: M });
    expect([...(s.tried[0] ?? [])].sort((a, b) => a - b)).toEqual([0, 1]);
    expect(totalTried(s)).toBe(2);
  });

  it('動かない操作（delta 0・同じ位置への set）は何も数えない', () => {
    const s = initialState(3);
    expect(run(s, { type: 'move', delta: 0, modulus: M })).toBe(s);
    expect(run(s, { type: 'set', pos: 0, modulus: M })).toBe(s);
    expect(totalTried(s)).toBe(0);
  });

  it('26 を超えて回した鍵は剰余で数え、巻き戻した累計は 0 未満でも鍵は 0〜25', () => {
    let s = run(initialState(3), { type: 'move', delta: -1, modulus: M });
    expect(s.pos[0]).toBe(-1);
    expect(currentKeys(s, M)[0]).toBe(25);
    s = run(initialState(3), { type: 'set', pos: 27, modulus: M });
    expect(currentKeys(s, M)[0]).toBe(1);
  });

  it('1 周して全部試すと、1 枚で 26 になり、3 枚の合計は最大 78', () => {
    let s = initialState(3);
    for (let d = 0; d < 3; d++) {
      s = run(s, { type: 'select', dial: d });
      for (let i = 0; i < 26; i++) s = run(s, { type: 'move', delta: 1, modulus: M });
    }
    expect(s.tried.map((t) => t.size)).toEqual([26, 26, 26]);
    expect(totalTried(s)).toBe(78);
  });

  it('align は操作対象の円盤を鍵に合わせ、試した鍵に 1 つ数える', () => {
    let s = run(initialState(3), { type: 'select', dial: 1 }, { type: 'align', key: 16, modulus: M });
    expect(currentKeys(s, M)).toEqual([0, 16, 0]);
    expect(s.tried.map((t) => [...t])).toEqual([[], [16], []]);
    expect(totalTried(s)).toBe(1);
    // 同じ鍵へもう一度合わせても増えない・状態も変わらない
    expect(run(s, { type: 'align', key: 16, modulus: M })).toBe(s);
    s = run(s, { type: 'align', key: 3, modulus: M });
    expect(currentKeys(s, M)[1]).toBe(3);
    expect(totalTried(s)).toBe(2);
  });

  it('align は近い向きに回す（巻き戻しても鍵は同じ）', () => {
    const s = run(initialState(3), { type: 'align', key: 25, modulus: M });
    expect(s.pos[0]).toBe(-1);
    expect(currentKeys(s, M)[0]).toBe(25);
    expect(run(initialState(3), { type: 'align', key: 13, modulus: M }).pos[0]).toBe(13);
    expect(run(initialState(3), { type: 'align', key: 14, modulus: M }).pos[0]).toBe(-12);
  });

  it('align で開始時の鍵（0）に合わせた場合も、まだ試していなければ数える', () => {
    const s = run(initialState(3), { type: 'align', key: 0, modulus: M });
    expect(s.pos).toEqual([0, 0, 0]);
    expect(s.tried.map((t) => [...t])).toEqual([[0], [], []]);
  });

  it('変化がなければ同じ状態を返す（再描画を起こさない）', () => {
    const s = initialState(3);
    expect(run(s, { type: 'move', delta: 0, modulus: M })).toBe(s);
    expect(run(s, { type: 'select', dial: 0 })).toBe(s);
  });
});

describe('ownersOfWords', () => {
  it('円盤は文字だけで 1・2・3・1・2・3… と進み、語をまたいで続く（空白で進まない）', () => {
    expect(ownersOfWords(['ABCD', 'EF', 'GHI'], 3)).toEqual([[0, 1, 2, 0], [1, 2], [0, 1, 2]]);
  });

  it('A–Z 以外の文字は null で、円盤を進めない', () => {
    expect(ownersOfWords(['A,B', 'c', 'D'], 2)).toEqual([[0, null, 1], [null], [0]]);
  });

  it('仮実装の暗号の鍵の位置と一致する（各文字を受け持つ円盤の鍵で戻せる）', () => {
    const keys = [3, 17, 9];
    const plain = 'TAKARA NO CHIZU WA BIJUTSUSHITSU';
    const cipher = encrypt(plain, keys);
    const owners = ownersOfWords(cipher.split(' '), 3).flat();
    const letters = decrypt(cipher, keys).replace(/ /g, '');
    expect(owners).toHaveLength(letters.length);
    // 円盤ごとの鍵で 1 文字ずつ戻した結果が、全体を復号した結果と一致する
    const cipherLetters = cipher.replace(/ /g, '');
    const restored = cipherLetters
      .split('')
      .map((ch, i) => {
        const key = keys[owners[i] ?? 0] ?? 0;
        return decrypt(ch, [key]);
      })
      .join('');
    expect(restored).toBe(letters);
  });
});
