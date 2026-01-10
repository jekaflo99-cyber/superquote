// @ts-ignore
import { franc } from "franc";
// @ts-ignore
import stopwords from "stopwords-iso";
import type { TextRun } from '../types';

// ---- types ----
interface Span {
    start: number;
    end: number;
    weight: "extraBold";
}

// ---- language mapping ----
const LANG_MAP: Record<string, string> = { por: "pt", eng: "en", spa: "es", fra: "fr" };
const ISO2_SET = new Set(["pt", "en", "es", "fr"]);

function normalizeLang(input?: string): string | null {
    if (!input) return null;
    const x = String(input).toLowerCase().trim();

    if (ISO2_SET.has(x)) return x;

    if (x === "ptpt" || x === "pt-pt" || x === "pt_pt") return "pt";
    if (x === "ptbr" || x === "pt-br" || x === "pt_br") return "pt";

    if (x === "por") return "pt";
    if (x === "eng") return "en";
    if (x === "spa") return "es";
    if (x === "fra") return "fr";

    return null;
}

const stripDiacritics = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Cache simples
const PLAN_CACHE = new Map<string, any>();
const CACHE_MAX = 2000;

function cacheGet(key: string) { return PLAN_CACHE.get(key); }
function cacheSet(key: string, value: any) {
    PLAN_CACHE.set(key, value);
    if (PLAN_CACHE.size > CACHE_MAX) {
        const firstKey = PLAN_CACHE.keys().next().value;
        if (firstKey) PLAN_CACHE.delete(firstKey);
    }
}

function guessLang(text: string): string {
    const code3 = franc(text || "", { minLength: 10 });
    return LANG_MAP[code3] || "en";
}

// ---- normalized text with index mapping (fix acentos) ----
function normalizeWithIndexMap(original: string) {
    const map: number[] = [];
    let norm = "";

    for (let i = 0; i < original.length; i++) {
        const ch = original[i];
        const stripped = stripDiacritics(ch);
        for (let k = 0; k < stripped.length; k++) {
            map.push(i);
            norm += stripped[k];
        }
    }

    return { norm, map };
}

// ---------------- RAKE core ----------------
function splitToCandidatePhrases(normTextLower: string, stopSet: Set<string>): string[][] {
    const cleaned = normTextLower
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();

    const words = cleaned.split(/\s+/g).filter(Boolean);

    const phrases: string[][] = [];
    let current: string[] = [];

    for (const w of words) {
        if (stopSet.has(w)) {
            if (current.length) phrases.push(current);
            current = [];
        } else {
            current.push(w);
        }
    }
    if (current.length) phrases.push(current);

    return phrases;
}

function rakeKeywords(text: string, options: { lang?: string, maxKeywords?: number } = {}) {
    const detected = normalizeLang(options.lang) || guessLang(text);

    const sw = (stopwords as any)[detected] || (stopwords as any).en;
    const stopSet = new Set<string>(sw.map((s: string) => stripDiacritics(s.toLowerCase())));

    const normLower = stripDiacritics(text.toLowerCase());
    const phrases = splitToCandidatePhrases(normLower, stopSet);

    const freq = new Map<string, number>();
    const degree = new Map<string, number>();

    for (const phrase of phrases) {
        const len = phrase.length;
        for (const w of phrase) {
            freq.set(w, (freq.get(w) || 0) + 1);
            degree.set(w, (degree.get(w) || 0) + (len - 1));
        }
    }

    const wordScore = new Map<string, number>();
    for (const [w, f] of freq.entries()) {
        const d = (degree.get(w) || 0) + f;
        wordScore.set(w, d / f);
    }

    const phraseScores = phrases
        .map((phrase) => {
            const score = phrase.reduce((sum, w) => sum + (wordScore.get(w) || 0), 0);
            return { phrase: phrase.join(" "), score, words: phrase.length };
        })
        .filter((p) => p.phrase.length >= 3)
        .filter((p) => !/^\d+$/.test(p.phrase));

    phraseScores.sort((a, b) => b.score - a.score);

    return {
        lang: detected,
        keywords: phraseScores.slice(0, options.maxKeywords || 10).map((x) => x.phrase),
    };
}

// ---------------- highlight selection ----------------
function extractNumericHighlights(text: string): string[] {
    const out: string[] = [];
    const re = /\b(r\$\s?\d+(?:[.,]\d+)?|\$\s?\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?%|\d+x)\b/gi;
    let m;
    while ((m = re.exec(text)) !== null) out.push(m[0]);
    return out;
}

function pickHighlights(text: string, options: { lang?: string, min?: number, max?: number } = {}): string[] {
    const { keywords } = rakeKeywords(text, { lang: options.lang, maxKeywords: 15 });

    const sorted = [...keywords].sort((a, b) => {
        const aw = a.split(" ").length;
        const bw = b.split(" ").length;
        if (aw !== bw) return aw - bw;
        return b.length - a.length;
    });

    const chosen: string[] = [];
    for (const kw of sorted) {
        if (chosen.length >= (options.max || 3)) break;

        const lower = kw.toLowerCase();
        const words = lower.split(" ");

        // Quality checks:
        if (words.length === 1) {
            // Single word highlights must be meaningful
            if (lower.length < 4 && !/\d/.test(lower)) continue;
            if (["para", "com", "uma", "uns", "este", "esta", "tudo", "mais"].includes(lower)) continue; // Extra safety filters
        }

        // Avoid words that are just common debris or symbols if rake missed them
        if (!/[\p{L}\p{N}]/u.test(lower)) continue;

        if (
            chosen.some(
                (c) => c.toLowerCase().includes(lower) || lower.includes(c.toLowerCase())
            )
        ) continue;

        chosen.push(kw);
    }

    const n = Math.max(options.min || 1, Math.min(options.max || 3, chosen.length));
    return chosen.slice(0, n);
}

// ---------------- spans (start/end no ORIGINAL) ----------------
function findHighlightSpans(text: string, highlights: string[]): Span[] {
    const { norm, map } = normalizeWithIndexMap(text);
    const lower = norm.toLowerCase();

    const needles = highlights
        .map((h) => stripDiacritics(h).trim())
        .filter(Boolean)
        .sort((a, b) => b.length - a.length);

    const rangesNorm: [number, number][] = [];

    for (const h of needles) {
        const needle = h.toLowerCase();
        let idx = 0;

        while (idx < lower.length) {
            const found = lower.indexOf(needle, idx);
            if (found === -1) break;

            const before = found - 1;
            const after = found + needle.length;

            const okBefore = before < 0 || !/[\p{L}\p{N}]/u.test(lower[before]);
            const okAfter = after >= lower.length || !/[\p{L}\p{N}]/u.test(lower[after]);

            if (okBefore && okAfter) rangesNorm.push([found, found + needle.length]);
            idx = found + needle.length;
        }
    }

    rangesNorm.sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    for (const [s, e] of rangesNorm) {
        const last = merged[merged.length - 1];
        if (!last || s > last[1]) merged.push([s, e]);
        else last[1] = Math.max(last[1], e);
    }

    const spans = merged.map(([s, e]) => {
        const start = map[s] ?? 0;
        const end = (map[e - 1] ?? (text.length - 1)) + 1;
        return { start, end, weight: "extraBold" as const };
    });

    spans.sort((a, b) => a.start - b.start);
    const finalSpans: Span[] = [];
    for (const sp of spans) {
        const last = finalSpans[finalSpans.length - 1];
        if (!last || sp.start > last.end) finalSpans.push({ ...sp });
        else last.end = Math.max(last.end, sp.end);
    }

    return finalSpans;
}

// ---------------- public API ----------------
export function buildEmphasisPlan(text: string, opts: { lang?: string, minHighlights?: number, maxHighlights?: number, forcedHighlights?: string[] } = {}) {
    const raw = String(text || "");
    const forcedLang = normalizeLang(opts.lang);
    const lang = forcedLang || guessLang(raw);

    const highlightsKey = opts.forcedHighlights ? `FORCED:${opts.forcedHighlights.join(',')}` : 'AUTO';
    const cacheKey = `${lang}::${raw}::${highlightsKey}`;
    const cached = cacheGet(cacheKey);
    if (cached) return cached;

    const minHighlights = opts.minHighlights ?? 1;
    const maxHighlights = opts.maxHighlights ?? 3;

    const numeric = extractNumericHighlights(raw);
    const semantic = pickHighlights(raw, { lang, min: 0, max: 8 });

    const combined = [...numeric, ...semantic];
    const unique: string[] = [];
    const seen = new Set<string>();
    for (const h of combined) {
        const key = stripDiacritics(h.toLowerCase());
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(h);
    }

    const take = Math.max(minHighlights, Math.min(maxHighlights, unique.length));
    const highlights = opts.forcedHighlights || unique.slice(0, take);

    const spans = findHighlightSpans(raw, highlights);

    const plan = { lang, highlights, spans };
    cacheSet(cacheKey, plan);
    return plan;
}

export function spansToRuns(text: string, spans: Span[], extraBoldColor?: string): TextRun[] {
    const runs: TextRun[] = [];
    const raw = String(text || "");
    let pos = 0;
    const sorted = [...(spans || [])].sort((a, b) => a.start - b.start);

    for (const s of sorted) {
        if (s.start > pos) runs.push({ text: raw.slice(pos, s.start), weight: "regular" });
        runs.push({
            text: raw.slice(s.start, s.end),
            weight: s.weight || "extraBold",
            color: extraBoldColor
        });
        pos = s.end;
    }
    if (pos < raw.length) runs.push({ text: raw.slice(pos), weight: "regular" });

    return runs;
}

export function splitRunsIntoLines(runs: TextRun[]): TextRun[][] {
    const lines: TextRun[][] = [];
    let currentLine: TextRun[] = [];

    runs.forEach(run => {
        // Split by newline, but keep the empty matches to represent the lines
        const parts = run.text.split('\n');
        parts.forEach((part, i) => {
            if (i > 0) {
                // If we hit a newline, we MUST push the current line even if empty
                lines.push(currentLine);
                currentLine = [];
            }
            if (part.length > 0) {
                currentLine.push({ text: part, weight: run.weight, color: run.color });
            }
        });
    });
    // Always push the final remaining currentLine
    lines.push(currentLine);
    return lines;
}
