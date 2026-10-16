import { describe, expect, it } from 'vitest';
import { fillPlaceholders } from '../ui/logic';
import { firstWord, KEY_LENGTH, MESSAGES, vigenereStage } from './vigenere';
import { decrypt, encrypt } from './vigenereStub';

/** 再現できる擬似乱数（テスト用の線形合同法） */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** 出題から鍵 3 つを取り出す */
function keysOf(hintValues: Readonly<Record<string, string>>): number[] {
  return ['k1', 'k2', 'k3'].map((name) => Number(hintValues[name]));
}

describe('vigenereStage.generate', () => {
  it('鍵は 3 つで、それぞれ 1〜25。鍵で復号すると平文に戻り、暗号文は平文と違う', () => {
    for (let seed = 0; seed < 500; seed++) {
      const puzzle = vigenereStage.generate(seeded(seed));
      const keys = keysOf(puzzle.hintValues);
      expect(Object.keys(puzzle.hintValues).sort()).toEqual(['k1', 'k2', 'k3']);
      for (const key of keys) {
        expect(Number.isInteger(key)).toBe(true);
        expect(key).toBeGreaterThanOrEqual(1);
        expect(key).toBeLessThanOrEqual(25);
      }
      expect(decrypt(puzzle.ciphertext, keys)).toBe(puzzle.plaintext);
      expect(puzzle.ciphertext).not.toBe(puzzle.plaintext);
    }
  });

  it('暗号文の空白の位置と文字数は平文と同じ', () => {
    const puzzle = vigenereStage.generate(seeded(7));
    expect(puzzle.ciphertext.length).toBe(puzzle.plaintext.length);
    expect(puzzle.ciphertext.replace(/[A-Z]/g, 'X')).toBe(puzzle.plaintext.replace(/[A-Z]/g, 'X'));
  });

  it('鍵は円盤ごとに独立で、鍵 1 と 25、平文 10 通りのすべてが出うる', () => {
    const seen = [new Set<string>(), new Set<string>(), new Set<string>()];
    const plaintexts = new Set<string>();
    const random = seeded(42);
    for (let i = 0; i < 3000; i++) {
      const puzzle = vigenereStage.generate(random);
      ['k1', 'k2', 'k3'].forEach((name, d) => seen[d]?.add(puzzle.hintValues[name] ?? ''));
      plaintexts.add(puzzle.plaintext);
    }
    for (const s of seen) expect(s.size).toBe(25);
    expect(plaintexts.size).toBe(10);
  });

  it('乱数が 0 や 1 に近い端でも範囲を外れない', () => {
    for (const r of [0, 0.999999999, 1]) {
      const puzzle = vigenereStage.generate(() => r);
      const keys = keysOf(puzzle.hintValues);
      for (const key of keys) {
        expect(key).toBeGreaterThanOrEqual(1);
        expect(key).toBeLessThanOrEqual(25);
      }
      expect(decrypt(puzzle.ciphertext, keys)).toBe(puzzle.plaintext);
    }
  });

  it('与件は「鍵の長さ 3 文字」と「最初の単語」の 2 つで、最初の単語は id "first-word" を持ち平文の先頭と一致する', () => {
    for (let seed = 0; seed < 50; seed++) {
      const puzzle = vigenereStage.generate(seeded(seed));
      expect(puzzle.givens).toEqual([
        { label: '鍵の長さ', value: '3 文字' },
        { id: 'first-word', label: '最初の単語は', value: puzzle.plaintext.split(' ')[0], suffix: 'らしい' },
      ]);
    }
  });

  it('和訳がある', () => {
    for (let seed = 0; seed < 50; seed++) {
      expect(vigenereStage.generate(seeded(seed)).translation).not.toBe('');
    }
  });
});

describe('ステージ 2 の電文', () => {
  it('10 件で、すべて A–Z と空白だけ・和訳つき・重複なし', () => {
    expect(MESSAGES).toHaveLength(10);
    for (const m of MESSAGES) {
      expect(m.plaintext).toMatch(/^[A-Z]+( [A-Z]+)*$/);
      expect(m.translation.trim()).not.toBe('');
    }
    expect(new Set(MESSAGES.map((m) => m.plaintext)).size).toBe(10);
  });

  it('最初の単語は 3 文字以上（与件として見せる手がかりになる長さ）', () => {
    for (const m of MESSAGES) {
      expect(firstWord(m.plaintext).length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('ステージ 2 の定義', () => {
  it('ツールは円盤 3 枚の multi-clock（mod 26）', () => {
    expect(vigenereStage.tools).toEqual([{ id: 'multi-clock', modulus: 26, count: 3 }]);
  });

  it('ヒントは 手がかり・仕組み・答え の順で、3 段目に 3 つの鍵の差し込み位置がある', () => {
    expect(vigenereStage.hints.map((h) => h.label)).toEqual(['手がかり', '仕組み', '答え']);
    const answer = vigenereStage.hints[2].body;
    for (const name of ['{k1}', '{k2}', '{k3}']) expect(answer).toContain(name);
  });

  it('答えのヒントにその回の鍵が入る', () => {
    const puzzle = vigenereStage.generate(seeded(3));
    const [k1, k2, k3] = keysOf(puzzle.hintValues);
    expect(fillPlaceholders(vigenereStage.hints[2].body, puzzle.hintValues)).toBe(
      `鍵は ①=${k1}、②=${k2}、③=${k3}`,
    );
    // 差し込み位置が残らない
    expect(fillPlaceholders(vigenereStage.hints[2].body, puzzle.hintValues)).not.toMatch(/[{}]/);
  });

  it('解説カードは 4 枚で、見出しと本文がある', () => {
    expect(vigenereStage.notes).toHaveLength(4);
    for (const card of vigenereStage.notes) {
      expect(card.title).not.toBe('');
      expect(card.body).not.toBe('');
    }
  });

  it('クリア画面の文面: 「あなたが試した鍵 n 通り」と、17,576 通り → 78 通り → 3 回の 3 段の対比', () => {
    const { debrief } = vigenereStage;
    expect(debrief.lead).toBe('あなたが試した鍵');
    expect(debrief.countSuffix).toBe('通り');
    expect(debrief.rows).toEqual([
      { label: 'まとめて試すと', value: '17,576', unit: '通り' },
      { label: '1 枚ずつ分ければ', value: '78', unit: '通り' },
      { label: '計算すれば', value: '3', unit: '回' },
    ]);
    expect(debrief.closing).toBe('分けて考え、計算で鍵を出す。これが代数の武器だ');
    expect(26 ** 3).toBe(17576);
    expect(26 * 3).toBe(78);
    expect(KEY_LENGTH).toBe(3);
  });

  it('「仕組み」のヒントは、引き算で鍵が出ることと鍵の計算機を案内する', () => {
    const body = vigenereStage.hints[1].body;
    expect(body).toContain('暗号文 − 平文 = 鍵（26 で割った余り）');
    expect(body).toContain('最初の単語の 1 文字目で引き算すれば ① の鍵が出る');
    expect(body).toContain('鍵の計算機');
  });
});

describe('vigenereStage.briefing（ステージ前の説明）', () => {
  const { briefing } = vigenereStage;

  it('例の行の暗号文の文字をつなげると、仮実装で NEKO を鍵 [3, 1, 4] で暗号にした結果に一致し、まとめは「NEKO → それ」', () => {
    const joined = briefing.steps.map((s) => s.cipher).join('');
    expect(joined).toBe(encrypt('NEKO', [3, 1, 4]));
    expect(briefing.summary).toBe(`NEKO → ${encrypt('NEKO', [3, 1, 4])}`);
  });

  it('例の行の円盤の番号は ① ② ③ ① の順で、1〜3 の範囲', () => {
    expect(briefing.steps.map((s) => s.disk)).toEqual([1, 2, 3, 1]);
  });

  it('手がかりのヒントは、ステージ前の説明と重ならない「最初の単語の 1 文字目は ① の円盤で戻る」', () => {
    expect(vigenereStage.hints[0].body).toBe('最初の単語の 1 文字目は ① の円盤で戻る。まずそこだけ合わせてみよう');
  });
});
