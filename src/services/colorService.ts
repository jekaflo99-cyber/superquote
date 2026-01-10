export interface ColorRGB {
    r: number;
    g: number;
    b: number;
}
export interface ColorHSL { h: number; s: number; l: number; }

export function hexToRgb(hex: string): ColorRGB {
    if (!hex || hex === 'transparent') return { r: 0, g: 0, b: 0 };
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(rgb: ColorRGB): string {
    return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
}

export function rgbToHsl(rgb: ColorRGB): ColorHSL {
    let r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
    if (max === min) h = s = 0;
    else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s, l };
}

export function hslToRgb(hsl: ColorHSL): ColorRGB {
    let h = hsl.h / 360, s = hsl.s, l = hsl.l;
    let r, g, b;
    if (s === 0) r = g = b = l;
    else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export function getLuminance(rgb: ColorRGB): number {
    const a = [rgb.r, rgb.g, rgb.b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function getContrast(rgb1: ColorRGB, rgb2: ColorRGB): number {
    const l1 = getLuminance(rgb1) + 0.05, l2 = getLuminance(rgb2) + 0.05;
    return l1 > l2 ? l1 / l2 : l2 / l1;
}

// Simple palette extraction from URL (client-side only as it uses Canvas)
export async function extractPaletteFromImage(imageUrl: string): Promise<string[]> {
    if (!imageUrl) return [];
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve([]);

            canvas.width = 50; canvas.height = 50;
            ctx.drawImage(img, 0, 0, 50, 50);

            try {
                const data = ctx.getImageData(0, 0, 50, 50).data;
                const counts: Record<string, number> = {};
                for (let i = 0; i < data.length; i += 16) {
                    const r = Math.round(data[i] / 32) * 32;
                    const g = Math.round(data[i + 1] / 32) * 32;
                    const b = Math.round(data[i + 2] / 32) * 32;
                    const hex = rgbToHex({ r, g, b });
                    counts[hex] = (counts[hex] || 0) + 1;
                }
                resolve(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(s => s[0]));
            } catch (e) { resolve([]); }
        };
        img.onerror = () => resolve([]);
    });
}

export function chooseSmartColor(candidates: string[], bgColors: string[], baseTextColor: string, isNoteStyle: boolean): string {
    const bgRgb = hexToRgb(bgColors[0] || "#ffffff");
    const textRgb = hexToRgb(baseTextColor || "#000000");
    const bgHsl = rgbToHsl(bgRgb);

    // 1. Generate safe derivatives
    const allCandidates = [...new Set(candidates)];
    allCandidates.forEach(c => {
        const hsl = rgbToHsl(hexToRgb(c));
        allCandidates.push(rgbToHex(hslToRgb({ ...hsl, l: Math.max(0, hsl.l - 0.2) })));
        allCandidates.push(rgbToHex(hslToRgb({ ...hsl, l: Math.min(1, hsl.l + 0.2) })));
    });

    // 2. Filter by contrast with background
    const contrasty = allCandidates.filter(c => getContrast(hexToRgb(c), bgRgb) >= 3.0);

    // Heuristic for Note Style (Yellowish)
    if (isNoteStyle) {
        const bestNote = ["#1F2A44", "#1C1C1C", "#3B2B20", "#1E3B2F"].find(c => getContrast(hexToRgb(c), bgRgb) >= 4.5);
        if (bestNote) return bestNote;
    }

    if (contrasty.length === 0) return baseTextColor;

    // 3. Score
    const scored = contrasty.map(c => {
        const rgb = hexToRgb(c);
        const hsl = rgbToHsl(rgb);
        let score = 0;

        // Contrast bonuses
        const cBg = getContrast(rgb, bgRgb);
        const cText = getContrast(rgb, textRgb);
        score += cBg * 2;
        score += cText * 3;

        // Harmony with background
        const hDiff = Math.abs(hsl.h - bgHsl.h);
        const isAnalogous = hDiff < 30 || hDiff > 330;
        const isComplementary = Math.abs(hDiff - 180) < 30;

        if (isComplementary) score += 15;
        if (isAnalogous && hsl.l < bgHsl.l - 0.2) score += 10;

        // saturation limits
        if (hsl.s > 0.45) score -= 10;
        if (hsl.s < 0.1) score -= 5;

        // Luminance limits based on background
        if (bgHsl.l > 0.6 && hsl.l > 0.5) score -= 20;
        if (bgHsl.l < 0.4 && hsl.l < 0.5) score -= 20;

        return { color: c, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.color || baseTextColor;
}
