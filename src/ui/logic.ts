import type { NormalizeRule } from '../stages/types';

/** 平文を比べる前に、規則に従って文字列を整える */
export function normalizeText(text: string, rule: NormalizeRule): string {
  let t = text;
  if (rule.ignoreCase) t = t.toLowerCase();
  if (rule.ignoreWhitespace) t = t.replace(/\s+/gu, '');
  if (rule.ignorePunctuation) t = t.replace(/[\p{P}\p{S}]/gu, '');
  return t;
}

/** クリア判定。鍵ではなく平文の一致で行う（DESIGN.md §3） */
export function isCorrect(candidate: string, plaintext: string, rule: NormalizeRule): boolean {
  return normalizeText(candidate, rule) === normalizeText(plaintext, rule);
}

/**
 * 本文の `{名前}` を、values の同じ名前の値に置き換える（ヒントの鍵、クリア画面の総数）。
 * values に無い名前の `{...}` はそのまま残す。
 */
export function fillPlaceholders(body: string, values: Readonly<Record<string, string>>): string {
  return body.replace(/\{(\w+)\}/g, (whole, name: string) => values[name] ?? whole);
}
