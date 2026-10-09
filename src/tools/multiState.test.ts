import { describe, expect, it } from 'vitest';
import { decrypt, encrypt } from '../stages/vigenereStub';
import { currentKeys, initialState, ownersOfWords, reducer, totalTried } from './multiState';
import type { MultiState } from './multiState';

const M = 26;

function run(state: MultiState, ...actions: Parameters<typeof reducer>[1][]): MultiState {
  return actions.reduce(reducer, state);
}

describe('initialState', () => {
  it('円盤の枚数ぶんずらし量 0 で、先頭が操作対象。開始時の 0 を円盤ごとに 1 つと数える', () => {
    const s = initialState(3);
    expect(s.active).toBe(0);
    expect(s.pos).toEqual([0, 0, 0]);
    expect(totalTried(s)).toBe(3);
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
    s = run(s, { type: 'move', delta: 1, modulus: M }, { type: 'move', delta: -1, modulus: M });
    expect(s.tried.map((t) => t.size)).toEqual([2, 1, 1]);
    s = run(s, { type: 'select', dial: 2 }, { type: 'move', delta: 3, modulus: M });
    expect(s.tried.map((t) => [...t].sort((a, b) => a - b))).toEqual([[0, 1], [0], [0, 3]]);
    expect(totalTried(s)).toBe(5);
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
