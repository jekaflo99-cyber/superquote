import type { TextPlan } from '../types';
import { buildEmphasisPlan, spansToRuns } from './emphasisPlan';

const planCache = new Map<string, TextPlan>();

function wrapBalanced(text: string, maxLineLen = 26, maxLines = 6): string {
    const words = String(text).trim().split(/\s+/).filter(Boolean);
    if (words.length <= 2) return words.join(" ");

    const lines: string[] = [];
    let cur = "";

    for (const w of words) {
        const test = cur ? `${cur} ${w}` : w;
        if (test.length <= maxLineLen || !cur) {
            cur = test;
        } else {
            lines.push(cur);
            cur = w;
            if (lines.length === maxLines - 1) break;
        }
    }

    // word usedCount must account for everything ALREADY in 'lines'
    const usedText = lines.join(" ");
    const usedCount = usedText ? usedText.split(/\s+/).filter(Boolean).length : 0;

    const remaining = words.slice(usedCount);
    // 'cur' is the first word of the 'remaining' list if it wasn't pushed yet.
    // So we just join the remaining words.
    const last = remaining.join(" ");
    if (last) lines.push(last);

    while (lines.length > maxLines) {
        lines[lines.length - 2] = `${lines[lines.length - 2]} ${lines[lines.length - 1]}`.trim();
        lines.pop();
    }

    return lines.join("\n");
}

function makeImpactVariant(text: string): string {
    const words = String(text).trim().split(/\s+/).filter(Boolean);
    if (words.length <= 3) return text.trim();
    const mid = Math.ceil(words.length / 2);
    return `${words.slice(0, mid).join(" ")}\n${words.slice(mid).join(" ")}`.trim();
}

function makeCompactVariant(text: string): string {
    return wrapBalanced(text, 20, 4);
}

function breakText(text: string, mode: 'balanced' | 'compact' | 'impact'): string {
    if (mode === "impact") return makeImpactVariant(text);
    if (mode === "compact") return makeCompactVariant(text);
    return wrapBalanced(text);
}

export function buildTextPlan(options: {
    text: string;
    lang?: string;
    breakMode?: 'balanced' | 'compact' | 'impact',
    forcedHighlights?: string[],
    secondaryColor?: string
}): TextPlan {
    const { text, lang = 'pt', breakMode = 'balanced', forcedHighlights, secondaryColor } = options;
    const highlightsKey = forcedHighlights ? `FORCED:${forcedHighlights.join(',')}` : 'AUTO';
    const cacheKey = `${text}_${breakMode}_${lang}_${highlightsKey}_${secondaryColor}`;

    if (planCache.has(cacheKey)) {
        return planCache.get(cacheKey)!;
    }

    // 1. First build a rough plan to get the language normalization if needed
    const initialPlan = buildEmphasisPlan(text, { lang });

    // 2. Break the text based on the mode
    const textBroken = breakText(text, breakMode);

    // 3. Generate emphasis on the BROKEN text to ensure indices match
    const planBroken = buildEmphasisPlan(textBroken, {
        lang: initialPlan.lang,
        minHighlights: forcedHighlights ? 0 : 1,
        maxHighlights: 3,
        forcedHighlights
    });

    // 4. Convert spans to runs
    const runs = spansToRuns(textBroken, planBroken.spans, secondaryColor);

    const finalPlan: TextPlan = {
        textRaw: text,
        textBroken,
        breakMode,
        highlights: planBroken.highlights,
        spans: planBroken.spans,
        runs,
        lang: initialPlan.lang,
    };

    planCache.set(cacheKey, finalPlan);
    return finalPlan;
}
