
import { type EditorConfig, type Template, type TextRun } from '../types';
// Unused import removed

/**
 * Generates a Blob from the configuration using HTML5 Canvas.
 * This simulates the Android Canvas drawing process but for Web.
 */
export const generateImage = async (
    config: EditorConfig,
    template: Template,
    width: number,
    height: number,
    isPremium: boolean,
    excludeText: boolean = false
): Promise<Blob | null> => {
    // Base reference width is 1080px.
    // We calculate a scale multiplier for higher resolutions (e.g. 2048px).
    const baseWidth = 1080;
    const resolutionMultiplier = width / baseWidth;
    // --- AUTOMATIC BALANCE LOGIC ---
    // Detects if the output is Vertical (Story/Reels/TikTok)
    const isVertical = height > width;

    // Applies a "Boost" to content size for vertical formats.
    // Since vertical screens are taller, standard text looks tiny. 
    // We boost it by ~15% (was 30%) to fill the screen better and feel "native" to Reels,
    // but without overwhelming the tighter safe zone.
    const formatBoost = isVertical ? 1.15 : 1.0;

    // --- SAFE BOX / PADDING LOGIC ---
    // Using a consistent 10% margin across all formats to match the visual "safety box"
    const horizonMarginPercent = 0.10;
    const verticalMarginPercent = 0.10;
    const horizontalPadding = width * horizonMarginPercent;
    const verticalPadding = height * verticalMarginPercent;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // 1. Draw Background
    if (template.backgroundType === 'solid') {
        ctx.fillStyle = template.value;
        ctx.fillRect(0, 0, width, height);
    } else if (template.backgroundType === 'gradient') {
        // Basic gradient parsing simulation for linear gradients
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        if (template.value.includes('#f6d365')) {
            gradient.addColorStop(0, '#f6d365');
            gradient.addColorStop(1, '#fda085');
        } else if (template.value.includes('#30cfd0')) {
            gradient.addColorStop(0, '#30cfd0');
            gradient.addColorStop(1, '#330867');
        } else {
            // Fallback for unparsed gradients
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, width, height);
        }

        // Check if context style was set to gradient (it wasn't in previous fallback block)
        if (template.value.includes('linear-gradient')) {
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        }
    } else if (template.backgroundType === 'image') {
        try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = template.value;
            });

            // Cover logic
            const scale = Math.max(width / img.width, height / img.height);
            const x = (width / 2) - (img.width / 2) * scale;
            const y = (height / 2) - (img.height / 2) * scale;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            // Overlay
            if (template.overlayOpacity) {
                ctx.fillStyle = `rgba(0,0,0,${template.overlayOpacity})`;
                ctx.fillRect(0, 0, width, height);
            }
        } catch (e) {
            console.error("Failed to load image", e);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, width, height);
        }
    }

    // 1.5 Draw Texture Overlay
    if (config.textureType && config.textureType !== 'none' && config.textureOpacity && config.textureOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = config.textureOpacity;
        ctx.globalCompositeOperation = 'screen'; // Default for most overlays

        if (config.textureType === 'grain') {
            // Procedural Grain (Noise)
            const grainCanvas = document.createElement('canvas');
            grainCanvas.width = 128; // Small tile
            grainCanvas.height = 128;
            const gCtx = grainCanvas.getContext('2d');
            if (gCtx) {
                const gData = gCtx.createImageData(128, 128);
                for (let i = 0; i < gData.data.length; i += 4) {
                    const v = Math.random() * 255;
                    gData.data[i] = v;
                    gData.data[i + 1] = v;
                    gData.data[i + 2] = v;
                    gData.data[i + 3] = 255;
                }
                gCtx.putImageData(gData, 0, 0);
                ctx.fillStyle = ctx.createPattern(grainCanvas, 'repeat')!;
                ctx.fillRect(0, 0, width, height);
            }
        } else {
            // Image-based textures (Paper, Leak, Dust)
            // Using placeholder URLs for these as we don't have the assets yet
            // In a real app, these would be local assets
            const textureUrls: Record<string, string> = {
                'paper': 'https://images.unsplash.com/photo-1586075010471-9799292db3b8?auto=format&fit=crop&q=80&w=1000',
                'leak': 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=1000&auto=format&fit=crop',
                'dust': 'https://www.transparenttextures.com/patterns/dust.png'
            };

            const url = textureUrls[config.textureType];
            if (url) {
                try {
                    const tImg = new Image();
                    tImg.crossOrigin = "anonymous";
                    await new Promise((resolve, reject) => {
                        tImg.onload = resolve;
                        tImg.onerror = reject;
                        tImg.src = url;
                    });

                    if (config.textureType === 'paper') {
                        ctx.globalCompositeOperation = 'multiply';
                    } else {
                        ctx.globalCompositeOperation = 'screen';
                    }

                    // Tiling or Scaling
                    if (config.textureType === 'dust') {
                        // Apply filter for refined visibility
                        ctx.filter = 'brightness(1.2) contrast(1.1)';
                        ctx.fillStyle = ctx.createPattern(tImg, 'repeat')!;
                        ctx.fillRect(0, 0, width, height);
                        ctx.filter = 'none';
                    } else {
                        // Fit to screen for leaks and realistic textures
                        const scale = Math.max(width / tImg.width, height / tImg.height);
                        const sw = tImg.width * scale;
                        const sh = tImg.height * scale;
                        const tx = (width - sw) / 2;
                        const ty = (height - sh) / 2;
                        ctx.drawImage(tImg, tx, ty, sw, sh);
                    }
                } catch (e) {
                    console.error("Failed to load texture", e);
                }
            }
        }
        ctx.restore();
    }

    // If excludeText is true, we stop here (used for preview background only)
    if (excludeText) {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.9);
        });
    }

    // 2. Configure Text Font & Style
    const baseScaleFactor = 3.6;
    // We remove the formatBoost to ensure the export is identical to the editor preview.
    const scaleFactor = baseScaleFactor * resolutionMultiplier;
    const fontSize = config.fontSize * scaleFactor;

    const fontWeight = config.isBold ? 'bold' : 'normal';
    const fontStyle = config.isItalic ? 'italic' : 'normal';
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${config.fontFamily}`;
    ctx.textBaseline = 'middle';

    // --- HELPERS ---
    const drawRoundedRect = (gCtx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        if (typeof (gCtx as any).roundRect === 'function') {
            (gCtx as any).roundRect(x, y, w, h, r);
        } else {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            gCtx.moveTo(x + r, y);
            gCtx.arcTo(x + w, y, x + w, y + h, r);
            gCtx.arcTo(x + w, y + h, x, y + h, r);
            gCtx.arcTo(x, y + h, x, y, r);
            gCtx.arcTo(x, y, x + w, y, r);
        }
    };

    const measureRichTextWidth = (richText: string, lineRuns?: TextRun[]): number => {
        if (lineRuns) {
            let totalWidth = 0;
            ctx.save();
            lineRuns.forEach(run => {
                ctx.font = `${fontStyle} ${run.weight === 'extraBold' ? '900' : fontWeight} ${fontSize}px ${config.fontFamily}`;
                if (config.letterSpacing) (ctx as any).letterSpacing = `${config.letterSpacing * scaleFactor}px`;
                const textToMeasure = (run.weight === 'extraBold' || config.textTransform === 'uppercase') ? run.text.toUpperCase() : run.text;
                totalWidth += ctx.measureText(textToMeasure).width;
            });
            ctx.restore();
            return totalWidth;
        }
        return ctx.measureText(richText).width;
    };

    // Text Transform & Base Text
    let textToDraw = config.text
        .replace(/<br\s*\/?>\s*/gi, '\n')
        .split('\n')
        .map(line => line.trim())
        .join('\n');
    if (config.textTransform === 'uppercase') textToDraw = textToDraw.toUpperCase();
    if (config.textTransform === 'lowercase') textToDraw = textToDraw.toLowerCase();

    // Letter Spacing
    if (config.letterSpacing) {
        (ctx as any).letterSpacing = `${config.letterSpacing * scaleFactor}px`;
    } else {
        (ctx as any).letterSpacing = '0px';
    }

    // 3. Text Wrapping (Pixel-based to match Browser)
    const maxWidth = width - (horizontalPadding * 2);

    let lines: string[] = [];
    let linesOfRuns: TextRun[][] | undefined = undefined;

    const wrapRunsByWidth = (runs: TextRun[], maxW: number): TextRun[][] => {
        const result: TextRun[][] = [];
        let currentLine: TextRun[] = [];
        let currentLineWidth = 0;

        const words: { text: string, weight?: "regular" | "extraBold", color?: string }[] = [];
        runs.forEach(run => {
            const parts = run.text.split(/(\s+|\n)/);
            parts.forEach(p => {
                if (p === "") return;
                words.push({ text: p, weight: run.weight, color: run.color });
            });
        });

        words.forEach(wordObj => {
            if (wordObj.text === '\n') {
                result.push(currentLine);
                currentLine = [];
                currentLineWidth = 0;
                return;
            }

            ctx.save();
            ctx.font = `${fontStyle} ${wordObj.weight === 'extraBold' ? '900' : fontWeight} ${fontSize}px ${config.fontFamily}`;
            const wordToMeasure = (wordObj.weight === 'extraBold' || config.textTransform === 'uppercase') ? wordObj.text.toUpperCase() : wordObj.text;
            const wordWidth = ctx.measureText(wordToMeasure).width;
            ctx.restore();

            if (currentLineWidth + wordWidth > maxW && currentLine.length > 0 && wordObj.text.trim() !== "") {
                result.push(currentLine);
                currentLine = [];
                currentLineWidth = 0;

                if (wordObj.text.startsWith(' ')) {
                    wordObj.text = wordObj.text.trimStart();
                }
            }

            const lastRun = currentLine[currentLine.length - 1];
            if (lastRun && lastRun.weight === wordObj.weight && lastRun.color === wordObj.color) {
                lastRun.text += wordObj.text;
            } else {
                currentLine.push({ text: wordObj.text, weight: (wordObj.weight as any) || 'regular', color: wordObj.color });
            }

            // Re-measure after possible trim and push
            ctx.save();
            ctx.font = `${fontStyle} ${wordObj.weight === 'extraBold' ? '900' : fontWeight} ${fontSize}px ${config.fontFamily}`;
            const finalW = (wordObj.weight === 'extraBold' || config.textTransform === 'uppercase') ? wordObj.text.toUpperCase() : wordObj.text;
            currentLineWidth += ctx.measureText(finalW).width;
            ctx.restore();
        });

        if (currentLine.length > 0) result.push(currentLine);
        return result;
    };

    if (config.textRuns && config.textRuns.length > 0) {
        linesOfRuns = wrapRunsByWidth(config.textRuns, maxWidth);
    } else {
        linesOfRuns = wrapRunsByWidth([{ text: textToDraw, weight: 'regular' }], maxWidth);
    }
    lines = linesOfRuns.map(l => l.map(r => r.text).join(''));

    // Create a map to know which lines are NOT the last in their paragraph (for justify)
    const isNotLastLineMap = new Set<number>();
    let totalLineIdx = 0;
    textToDraw.split('\n').forEach(para => {
        const pWrapped = wrapRunsByWidth([{ text: para, weight: 'regular' }], maxWidth);
        for (let j = 0; j < pWrapped.length - 1; j++) {
            isNotLastLineMap.add(totalLineIdx + j);
        }
        totalLineIdx += pWrapped.length;
    });

    // 4. Calculate Positioning
    // 4. Calculate Positioning (CORRIGIDO)
    const lineHeightMultiplier = config.lineHeight || 1.4;
    const pxLineHeight = fontSize * lineHeightMultiplier;
    const totalTextHeight = lines.length * pxLineHeight;

    let startY = height / 2; // valor inicial

    // padding padrão vertical (dinâmico baseado no formato)
    // verticalPadding já calculado acima

    if (config.verticalAlign === 'top') {
        // Começa no topo + padding + metade da altura da primeira linha (pois o baseline é middle)
        startY = verticalPadding + (pxLineHeight / 2);
    }
    else if (config.verticalAlign === 'bottom') {
        // A conta é: Altura total - Padding - Altura do Texto + ajuste da primeira linha
        // Isso garante que a ÚLTIMA linha fique encostada no padding de baixo
        startY = (height - verticalPadding) - totalTextHeight + (pxLineHeight / 2);
    }
    else {
        // CENTER
        // (Altura da tela - Altura do Texto) / 2 = Onde começa o bloco
        // + (Metade da linha) para compensar o baseline 'middle'
        startY = (height - totalTextHeight) / 2 + (pxLineHeight / 2);
    }
    // 5. Draw Text Background (Offline Buffer to prevent Overlap)
    if (config.textBackgroundOpacity > 0) {
        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = width;
        bgCanvas.height = height;
        const bgCtx = bgCanvas.getContext('2d');

        if (bgCtx) {
            // Box Gradient Logic

            const radius = fontSize * 0.24; // Increased rounded corners for better visibility

            let paddingY = 0;
            let paddingX = 0;

            if (config.textBoxStyle === 'highlight') { // "Fit" mode
                paddingY = fontSize * 0.15;
                paddingX = fontSize * 0.3;
            } else { // "Block" mode
                paddingY = fontSize * 0.20;
                paddingX = fontSize * 0.3;
            }

            if (config.boxGradientColors && config.boxGradientColors.length >= 2) {
                // Gradient relative to the text area, not the whole canvas
                const bgGradient = bgCtx.createLinearGradient(0, startY - paddingY, 0, startY + totalTextHeight + paddingY);
                config.boxGradientColors.forEach((color, index) => {
                    bgGradient.addColorStop(index / (config.boxGradientColors!.length - 1), color);
                });
                bgCtx.fillStyle = bgGradient;
            } else {
                bgCtx.fillStyle = config.textBackgroundColor;
            }

            // Subtle border for box to match preview (rgba(255,255,255,0.2))
            bgCtx.strokeStyle = 'rgba(255,255,255,0.2)';
            bgCtx.lineWidth = 1 * resolutionMultiplier;

            // Draw Box(es)
            if (config.textBoxStyle === 'highlight') {
                // Per-Line Box Mode
                lines.forEach((line, index) => {
                    const lineWidth = measureRichTextWidth(line, linesOfRuns ? linesOfRuns[index] : undefined);
                    if (lineWidth <= 0) return;

                    const lineBoxWidth = lineWidth + (paddingX * 2);
                    const lineBoxHeight = fontSize + (paddingY * 2);

                    let lineBoxX = 0;
                    if (config.textAlign === 'center') {
                        lineBoxX = (width - lineBoxWidth) / 2;
                    } else if (config.textAlign === 'left' || config.textAlign === 'justify') {
                        lineBoxX = horizontalPadding - paddingX;
                    } else if (config.textAlign === 'right') {
                        lineBoxX = (width - horizontalPadding) + paddingX - lineBoxWidth;
                    }

                    const lineY = startY + (index * pxLineHeight);
                    const lineBoxY = lineY - (fontSize / 2) - paddingY;

                    bgCtx.beginPath();
                    drawRoundedRect(bgCtx, lineBoxX, lineBoxY, lineBoxWidth, lineBoxHeight, radius);
                    bgCtx.fill();
                    bgCtx.stroke();
                });
            } else {
                // Unified Block Mode
                let maxLineWidth = 0;
                lines.forEach((line, index) => {
                    const w = measureRichTextWidth(line, linesOfRuns ? linesOfRuns[index] : undefined);
                    if (w > maxLineWidth) maxLineWidth = w;
                });

                if (config.textAlign === 'justify' && lines.length > 1) {
                    maxLineWidth = maxWidth;
                }

                const boxWidth = maxLineWidth + (paddingX * 2);
                const boxHeight = totalTextHeight + (paddingY * 2) - (pxLineHeight - fontSize);

                let boxX = 0;
                if (config.textAlign === 'center') {
                    boxX = (width - boxWidth) / 2;
                } else if (config.textAlign === 'left') {
                    boxX = horizontalPadding - paddingX;
                } else if (config.textAlign === 'right') {
                    boxX = (width - horizontalPadding) + paddingX - boxWidth;
                } else if (config.textAlign === 'justify') {
                    boxX = horizontalPadding - paddingX;
                }

                const boxY = startY - (pxLineHeight / 2) - paddingY + (pxLineHeight - fontSize) / 2;

                bgCtx.beginPath();
                drawRoundedRect(bgCtx, boxX, boxY, boxWidth, boxHeight, radius);
                bgCtx.fill();
                bgCtx.stroke();
            }


            // 3. Apply colored fill (from bgCanvas)
            ctx.save();
            ctx.globalAlpha = config.textBackgroundOpacity;
            ctx.drawImage(bgCanvas, 0, 0);
            ctx.restore();
        }
    }


    // --- VERSÃO HTML (SUPORTA <b> e <u>) ---
    const drawLines = (
        drawFn: (line: string, x: number, y: number, run?: TextRun) => void,
        applyRunStyles: boolean = false
    ) => {
        lines.forEach((originalLine, index) => {
            // 1. LIMPEZA TOTAL: Garante que não há espaços nas pontas
            originalLine = originalLine.trim();
            if (!originalLine) return; // Salta linhas vazias

            const y = startY + (index * pxLineHeight);

            // 3. ALINHAMENTO INTELIGENTE
            ctx.textAlign = 'left'; // Forçamos left para o loop de pedaços
            let startX = horizontalPadding; // Margem Esquerda Dinâmica

            const lineWidth = measureRichTextWidth(originalLine, linesOfRuns ? linesOfRuns[index] : undefined);

            if (config.textAlign === 'center') {
                startX = (width - lineWidth) / 2;
            } else if (config.textAlign === 'right') {
                startX = (width - horizontalPadding) - lineWidth;
            }
            // (Nota: 'justify' cai aqui no default 'left', que é mais seguro)

            // 4. DESENHO DOS PEDAÇOS
            let currentX = startX;

            // --- JUSTIFY LOGIC ---
            let extraSpace = 0;
            const isJustify = config.textAlign === 'justify' && isNotLastLineMap.has(index);
            if (isJustify) {
                const spaceCount = (originalLine.match(/ /g) || []).length;
                if (spaceCount > 0) {
                    extraSpace = (maxWidth - lineWidth) / spaceCount;
                }
            }

            if (linesOfRuns) {
                const lineRuns = linesOfRuns[index];
                lineRuns.forEach(run => {
                    const wordsInRun = run.text.split(' ');
                    wordsInRun.forEach((word, wIdx) => {
                        let textToDraw = word;
                        if (wIdx < wordsInRun.length - 1) textToDraw += " ";

                        ctx.save();
                        ctx.font = `${fontStyle} ${run.weight === 'extraBold' ? '900' : fontWeight} ${fontSize}px ${config.fontFamily}`;
                        if (config.letterSpacing) (ctx as any).letterSpacing = `${config.letterSpacing * scaleFactor}px`;

                        if (applyRunStyles && run.color) {
                            ctx.fillStyle = run.color;
                            ctx.strokeStyle = run.color;
                        }
                        if (run.weight === 'extraBold') {
                            textToDraw = textToDraw.toUpperCase();
                        }

                        drawFn(textToDraw, currentX, y, run);

                        const wordWidth = ctx.measureText(textToDraw).width;
                        currentX += wordWidth;

                        if (isJustify && textToDraw.endsWith(" ")) {
                            currentX += extraSpace;
                        }
                        ctx.restore();
                    });
                });
            } else {
                const parts = originalLine.split(/(<b.*?>.*?<\/b>|<u.*?>.*?<\/u>)/gi);
                parts.forEach(part => {
                    // Remove tags para verificar se tem conteúdo
                    const content = part.replace(/<[^>]*>/g, "");
                    if (!content) return;

                    let isBold = part.toLowerCase().startsWith('<b');
                    let isUnderline = part.toLowerCase().startsWith('<u');

                    // Split part into words if justifying to apply extra space
                    const wordsInPart = content.split(' ');

                    wordsInPart.forEach((word, wIdx) => {
                        let textToDraw = word;
                        if (wIdx < wordsInPart.length - 1) textToDraw += " ";

                        ctx.save();
                        if (isBold || config.isBold) {
                            ctx.font = `${config.isItalic ? 'italic' : 'normal'} 900 ${fontSize}px ${config.fontFamily}`;
                            if (config.letterSpacing) (ctx as any).letterSpacing = `${config.letterSpacing * scaleFactor}px`;
                            textToDraw = textToDraw.toUpperCase();
                        } else {
                            // Reset font in case it was changed by bold part
                            ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${config.fontFamily}`;
                            if (config.letterSpacing) (ctx as any).letterSpacing = `${config.letterSpacing * scaleFactor}px`;
                        }

                        if (isUnderline) {
                            // Drawing highlighter (consistent with preview <u> style)
                            ctx.save();
                            ctx.globalAlpha = 0.25; // 75% transparent matches color-mix(..., transparent 75%)
                            ctx.fillStyle = ctx.fillStyle; // Use current text color
                            const hHeight = fontSize * 0.55;
                            const hY = y - fontSize * 0.15; // Vertical alignment of the highlight
                            ctx.fillRect(currentX, hY, ctx.measureText(textToDraw).width, hHeight);
                            ctx.restore();
                        }

                        drawFn(textToDraw, currentX, y);

                        const wordWidth = ctx.measureText(textToDraw).width;
                        currentX += wordWidth;

                        // Add extra justify space if this word ended with a space
                        if (isJustify && textToDraw.endsWith(" ")) {
                            currentX += extraSpace;
                        }

                        ctx.restore();
                    });
                });
            }
        });
    };

    // 6. Draw Glow Pass (Behind everything)
    if (config.textGlowWidth > 0) {
        ctx.save();
        // FIX: Use scaleFactor for blur calculation to match resolution
        // We multiply by ~0.5 to match CSS 'spread' visual
        ctx.shadowBlur = config.textGlowWidth * scaleFactor * 0.8;
        ctx.shadowColor = config.textGlowColor;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = config.textGlowColor;

        // FIX: Draw Multiple Times for Intensity (Stacking)
        // Canvas shadow is faint. Drawing 3 times mimics the "Neon" CSS intensity.
        const passes = 3;
        for (let i = 0; i < passes; i++) {
            drawLines((text, x, y) => ctx.fillText(text, x, y), true);
        }
        ctx.restore();
    }
    // 7. Draw 3D Fake / Shifted Text Pass (Behind Main, possibly behind or mixed with shadow)
    if (config.text3DOffsetX !== 0 || config.text3DOffsetY !== 0) {
        ctx.save();
        ctx.fillStyle = config.text3DColor;
        // Adjust offsets for scale
        // FIX: Use scaleFactor directly to match font scaling.
        // Previously dividing by 3 made the effect too subtle on export.
        const offsetX = config.text3DOffsetX * scaleFactor;
        const offsetY = config.text3DOffsetY * scaleFactor;

        drawLines((text, x, y) => {
            ctx.fillText(text, x + offsetX, y + offsetY);
        });
        ctx.restore();
    }

    // 8. Draw Drop Shadow Pass (Enhanced)
    if (config.textShadowOpacity > 0) {
        ctx.save();

        const shadowColorBase = config.textShadowColor || '#000000';

        // Convert hex to rgba to apply opacity properly to the shadow color
        // This is better than globalAlpha which can affect the blur intensity/distribution
        const r = parseInt(shadowColorBase.slice(1, 3), 16);
        const g = parseInt(shadowColorBase.slice(3, 5), 16);
        const b = parseInt(shadowColorBase.slice(5, 7), 16);
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${config.textShadowOpacity})`;

        // Scale blur and offsets to match resolution
        // The preview uses 4px 4px 5px. We scale these by resolutionMultiplier * formatBoost
        const scaledBlur = (config.textShadowBlur || 5) * resolutionMultiplier * formatBoost * 2; // Added 2x for visual match
        const scaledOffset = 6 * resolutionMultiplier * formatBoost; // Slightly larger than 4 to look premium in HD

        ctx.shadowBlur = scaledBlur;

        // TRICK: Draw text far off-screen so only the shadow is visible on the canvas
        // This prevents the "3D" hard-edge look.
        const offscreenOffset = 5000;
        ctx.shadowOffsetX = scaledOffset + offscreenOffset;
        ctx.shadowOffsetY = scaledOffset;

        ctx.fillStyle = 'rgba(0,0,0,1)'; // Must be solid for shadow effect to be strong

        drawLines((text, x, y) => {
            // Draw text shifted to the left by offscreenOffset
            // The shadowOffsetX will bring the shadow back to its destination (+scaledOffset)
            ctx.fillText(text, x - offscreenOffset, y);
        });
        ctx.restore();
    }

    // 9. Draw Outline & Main Text
    ctx.save();


    // Super Stroke Logic (Behind Main Text)
    if (config.textSuperStrokeWidth && config.textSuperStrokeWidth > 0) {
        ctx.save();
        // FIX: Use scaleFactor directly to match font scaling.
        // 0.5 factor aligns roughly with how CSS stroke width behaves relative to font size container.
        // This ensures 20px stroke looks like 20px regardless of 1080p or 4K.
        // FIX: Match preview scaling (roughly 0.6x of the width value)
        ctx.lineWidth = config.textSuperStrokeWidth * scaleFactor * 0.65;
        ctx.strokeStyle = config.textSuperStrokeColor;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;

        drawLines((text, x, y) => {
            ctx.strokeText(text, x, y);
        });
        ctx.restore();
    }

    // Outline setup
    // Outline setup
    if (config.textOutlineWidth > 0) {
        // FIX: Match CSS visual logic ((val * 0.2) * scale * 2)
        // We multiply by 2 because strokeText is drawn BEHIND fillText, hiding half the stroke.
        ctx.lineWidth = (config.textOutlineWidth * 0.2) * scaleFactor * 2;
        ctx.strokeStyle = config.textOutlineColor;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
    }

    // Text Gradient Logic
    let gradientApplied = false;
    if (config.textGradientColors && config.textGradientColors.length >= 2) {
        try {
            // Calculate bounding box of text for gradient
            // We add padding (0.6x line height) to top/bottom to ensures gradient covers
            // all font ascenders/descenders regardless of alignment or weird font metrics.
            // startY is the middle of the first line.
            // FIX: Use fontSize (em height) instead of line height for tighter gradient fit.
            // This prevents gradient from stretching into the leading (empty space), 
            // making colors more distinct on the actual glyphs.
            // We define gradient from slightly above top line to slightly below bottom line.
            const gradTop = startY - (fontSize * 0.6);
            const gradBottom = startY + ((lines.length - 1) * pxLineHeight) + (fontSize * 0.6);

            const textGradient = ctx.createLinearGradient(0, gradTop, 0, gradBottom);
            config.textGradientColors.forEach((color, index) => {
                textGradient.addColorStop(index / (config.textGradientColors!.length - 1), color);
            });
            ctx.fillStyle = textGradient;
            gradientApplied = true;
        } catch (e) {
            console.error("Gradient generation failed", e);
        }
    }

    if (!gradientApplied) {
        // Fallback: If textColor is 'transparent' (common in presets that expect gradient), 
        // fallback to white so text doesn't disappear if gradient fails.
        if (config.textColor === 'transparent') {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = config.textColor;
        }
    }

    drawLines((text, x, y, run) => {
        if (config.textOutlineWidth > 0) {
            ctx.strokeText(text, x, y);
        }
        // ONLY fill if not transparent OR if we have a gradient OR if the individual run has a color
        if (config.textColor !== 'transparent' || gradientApplied || (run && run.color)) {
            ctx.fillText(text, x, y);
        }
    }, true);
    ctx.restore();

    // 9a. Masking (Destination-in)


    // 10. Watermark (Free Version Only)
    if (!isPremium) {
        ctx.save();

        const wmText = "SuperQuote";
        // Scale watermark too so it doesn't look tiny on reels
        const wmFontSize = width * 0.04 * (isVertical ? 1.5 : 1.0);

        // Use a bold sans-serif font for readability
        ctx.font = `900 ${wmFontSize}px Inter, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Low opacity as requested
        ctx.globalAlpha = 0.18;

        // Subtle shadow for vsibility on light/dark backgrounds
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4 * resolutionMultiplier;
        ctx.shadowOffsetX = 1 * resolutionMultiplier;
        ctx.shadowOffsetY = 1 * resolutionMultiplier;

        // Position: Center-Bottom (10% from bottom)
        const x = width / 2;
        const y = height * 0.96;

        // Draw Quote Icon + Text
        ctx.fillText(`${wmText}`, x, y);

        ctx.restore();
    }

    // 11. Export
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/jpeg', 0.9);
    });
};