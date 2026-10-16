import { describe, expect, it } from 'vitest';
import { fillPlaceholders } from '../ui/logic';
import { A_CHOICES, affineStage, MESSAGES } from './affine';
import { decrypt, encrypt, gcd } from './affineStub';
import { exhibitionStages } from './index';
import { firstWord } from './vigenere';

/** 再現できる擬似乱数（テスト用の線形合同法） */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** 出題から鍵 a・b を取り出す */
function keyOf(hintValues: Readonly<Record<string, string>>): { a: number; b: number } {
  return { a: Number(hintValues['a']), b: Number(hintValues['b']) };
}

describe('アフィン暗号の電文（MESSAGES）', () => {
  it('10 文あり、平文は A–Z と空白だけ。単語は空白 1 つで区切られる', () => {
    expect(MESSAGES).toHaveLength(10);
    for (const m of MESSAGES) {
      expect(m.plaintext).toMatch(/^[A-Z]+( [A-Z]+)*$/);
      expect(m.translation).not.toBe('');
    }
    expect(new Set(MESSAGES.map((m) => m.plaintext)).size).toBe(10);
  });

  it('最初の単語は 2 文字以上', () => {
    for (const m of MESSAGES) {
      expect(firstWord(m.plaintext).length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('affineStage.generate', () => {
  it('a は 26 と互いに素な 11 個（1 を除く）、b は 0〜25。鍵で復号すると平文に戻る', () => {
    expect(A_CHOICES).toEqual([3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25]);
    for (const a of A_CHOICES) expect(gcd(a, 26)).toBe(1);
    for (let seed = 0; seed < 500; seed++) {
      const puzzle = affineStage.generate(seeded(seed));
      const { a, b } = keyOf(puzzle.hintValues);
      expect(Object.keys(puzzle.hintValues).sort()).toEqual(['a', 'b']);
      expect(A_CHOICES).toContain(a);
      expect(Number.isInteger(b)).toBe(true);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(25);
      expect(decrypt(puzzle.ciphertext, a, b)).toBe(puzzle.plaintext);
      expect(puzzle.ciphertext).not.toBe(puzzle.plaintext);
    }
  });

  it('暗号文の各文字は (a × 平文の番号 + b) を 26 で割った余りの文字。空白の位置は平文と同じ', () => {
    for (let seed = 0; seed < 100; seed++) {
      const puzzle = affineStage.generate(seeded(seed));
      const { a, b } = keyOf(puzzle.hintValues);
      expect(puzzle.ciphertext.length).toBe(puzzle.plaintext.length);
      [...puzzle.plaintext].forEach((p, i) => {
        const c = puzzle.ciphertext[i] ?? '';
        if (p === ' ') {
          expect(c).toBe(' ');
        } else {
          const n = p.charCodeAt(0) - 65;
          expect(c.charCodeAt(0) - 65).toBe((a * n + b) % 26);
        }
      });
    }
  });

  it('a の 11 通り、b の 26 通り、平文 10 通りのすべてが出うる', () => {
    const as = new Set<string>();
    const bs = new Set<string>();
    const plaintexts = new Set<string>();
    const random = seeded(42);
    for (let i = 0; i < 5000; i++) {
      const puzzle = affineStage.generate(random);
      as.add(puzzle.hintValues['a'] ?? '');
      bs.add(puzzle.hintValues['b'] ?? '');
      plaintexts.add(puzzle.plaintext);
    }
    expect(as.size).toBe(11);
    expect(bs.size).toBe(26);
    expect(plaintexts.size).toBe(10);
  });

  it('乱数が 0 や 1 に近い端でも範囲を外れない', () => {
    for (const r of [0, 0.999999999, 1]) {
      const puzzle = affineStage.generate(() => r);
      const { a, b } = keyOf(puzzle.hintValues);
      expect(A_CHOICES).toContain(a);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(25);
      expect(decrypt(puzzle.ciphertext, a, b)).toBe(puzzle.plaintext);
    }
  });

  it('与件は「最初の単語」だけで、id "first-word" を持ち平文の先頭の単語と一致する', () => {
    for (let seed = 0; seed < 50; seed++) {
      const puzzle = affineStage.generate(seeded(seed));
      expect(puzzle.givens).toEqual([
        { id: 'first-word', label: '最初の単語は', value: puzzle.plaintext.split(' ')[0], suffix: 'らしい' },
      ]);
    }
  });

  it('和訳がある', () => {
    for (let seed = 0; seed < 50; seed++) {
      expect(affineStage.generate(seeded(seed)).translation).not.toBe('');
    }
  });
});

describe('affineStage のデータ', () => {
  it('ヒントの 3 段目に、その回の鍵が差し込まれる', () => {
    for (let seed = 0; seed < 50; seed++) {
      const puzzle = affineStage.generate(seeded(seed));
      const { a, b } = keyOf(puzzle.hintValues);
      const answer = affineStage.hints[2];
      expect(answer.label).toBe('答え');
      expect(fillPlaceholders(answer.body, puzzle.hintValues)).toBe(`鍵は a = ${a}、b = ${b}`);
    }
  });

  it('ヒントの 1・2 段目に差し込み位置はなく、3 段目の鍵以外に値は漏れない', () => {
    expect(affineStage.hints[0].body).toBe('a に使える数は 12 個だけ。2 や 13 を選ぶと何が起きるか見てみよう');
    expect(affineStage.hints[0].body).not.toMatch(/\{/);
    expect(affineStage.hints[1].body).not.toMatch(/\{/);
  });

  it('アフィン表のツールを modulus 26 で装備し、与件はステージ共通には持たない', () => {
    expect(affineStage.tools).toEqual([{ id: 'affine-table', modulus: 26 }]);
    expect(affineStage.givens).toEqual([]);
  });

  it('クリア画面の対比は 3 段で、締めは「円盤では回せない暗号も、式にすれば解ける」', () => {
    expect(affineStage.debrief.lead).toBe('あなたが試した鍵');
    expect(affineStage.debrief.countSuffix).toBe('通り');
    expect(affineStage.debrief.rows.map((r) => `${r.label} ${r.value} ${r.unit}`)).toEqual([
      '総当たりでは 312 通り',
      'a だけ試せば 12 通り',
      '2 文字で連立すれば 1 回',
    ]);
    expect(affineStage.debrief.closing).toBe('円盤では回せない暗号も、式にすれば解ける');
  });

  it('「もっと知る」のカードは 4 枚で、すべて見出しと本文がある', () => {
    expect(affineStage.notes).toHaveLength(4);
    for (const card of affineStage.notes) {
      expect(card.title).not.toBe('');
      expect(card.body).not.toBe('');
    }
  });

  it('ステージ 2 の次（3 番目）に並び、最後のステージへの文言を持つ', () => {
    expect(exhibitionStages[2]).toBe(affineStage);
    expect(exhibitionStages.map((s) => s.id)).toEqual(['caesar', 'vigenere', 'affine']);
    expect(affineStage.arrival).toEqual({ challengeLabel: '最後の暗号に挑む', interceptHeadline: '最後の電文を傍受' });
    expect(exhibitionStages[1]?.arrival?.challengeLabel).toBe('次の暗号に挑む');
    expect(exhibitionStages[0].arrival).toBeUndefined();
  });
});

describe('affineStage.briefing（ステージ前の説明）', () => {
  const { briefing } = affineStage;

  it('例の行の暗号文の文字をつなげると、仮実装で NEKO を a=3, b=1 で暗号にした結果に一致し、まとめは「NEKO → それ」', () => {
    const joined = briefing.steps.map((s) => s.cipher).join('');
    expect(joined).toBe(encrypt('NEKO', 3, 1));
    expect(briefing.summary).toBe(`NEKO → ${encrypt('NEKO', 3, 1)}`);
  });

  it('例の行は円盤の番号を持たず、規則に「a には使えない数がある」ことを書かない', () => {
    for (const step of briefing.steps) expect(step.disk).toBeUndefined();
    expect(briefing.rule).not.toContain('使えない');
  });
});
