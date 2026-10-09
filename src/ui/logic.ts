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

/** ヒント本文の `{key}` を、その回の鍵の表記に置き換える */
export function fillHint(body: string, keyLabel: string): string {
  return body.split('{key}').join(keyLabel);
}
