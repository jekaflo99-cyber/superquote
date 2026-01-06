
import { type EditorConfig, type Template } from '../types';

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
    // We boost it by ~30% to fill the screen better and feel "native" to Reels.
    const formatBoost = isVertical ? 1.3 : 1.0;

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
                'paper': 'https://www.transparenttextures.com/patterns/old-mathematics.png',
                'leak': 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=1000&auto=format&fit=crop', // Abstract light leak-ish
                'dust': 'https://www.transparenttextures.com/patterns/p6-polka.png' // Placeholder for dust
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
                        ctx.fillStyle = ctx.createPattern(tImg, 'repeat')!;
                        ctx.fillRect(0, 0, width, height);
                    } else {
                        // Fit to screen for leaks and dust
                        const scale = Math.max(width / tImg.width, height / tImg.height);
                        const tx = (width / 2) - (tImg.width / 2) * scale;
                        const ty = (height / 2) - (tImg.height / 2) * scale;
                        ctx.drawImage(tImg, tx, ty, tImg.width * scale, tImg.height * scale);
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
    // Apply resolution multiplier AND format boost
    const scaleFactor = baseScaleFactor * resolutionMultiplier * formatBoost;
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
            // Fallback for older environments
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            gCtx.moveTo(x + r, y);
            gCtx.arcTo(x + w, y, x + w, y + h, r);
            gCtx.arcTo(x + w, y + h, x, y + h, r);
            gCtx.arcTo(x, y + h, x, y, r);
            gCtx.arcTo(x, y, x + w, y, r);
        }
    };

    const measureRichTextWidth = (richText: string): number => {
        const parts = richText.split(/(<b.*?>.*?<\/b>|<u.*?>.*?<\/u>)/gi);
        let totalWidth = 0;
        ctx.save();
        parts.forEach(part => {
            const content = part.replace(/<[^>]*>/g, "");
            if (!content) return;

            let textToMeasure = content;
            if (part.toLowerCase().startsWith('<b') || config.isBold) {
                ctx.font = `${config.isItalic ? 'italic' : 'normal'} 900 ${fontSize}px ${config.fontFamily}`;
                if (config.letterSpacing) (ctx as any).letterSpacing = `${config.letterSpacing * scaleFactor}px`;
                textToMeasure = content.toUpperCase();
            } else {
                ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${config.fontFamily}`;
                if (config.letterSpacing) (ctx as any).letterSpacing = `${config.letterSpacing * scaleFactor}px`;
            }
            totalWidth += ctx.measureText(textToMeasure).width;
        });
        ctx.restore();
        return totalWidth;
    };

    // Letter Spacing (New Feature)
    if (config.letterSpacing) {
        // Use canvas letterSpacing if supported, else ignore (polyfill is complex)
        (ctx as any).letterSpacing = `${config.letterSpacing * scaleFactor}px`;
    } else {
        (ctx as any).letterSpacing = '0px';
    }

    // Text Transform (New Feature)
    let textToDraw = config.text
        .replace(/<br\s*\/?>\s*/gi, '\n')
        .split('\n')
        .map(line => line.trim())
        .join('\n');
    if (config.textTransform === 'uppercase') textToDraw = textToDraw.toUpperCase();
    if (config.textTransform === 'lowercase') textToDraw = textToDraw.toLowerCase();

    // 3. Text Wrapping (Improved for \n support)
    // For vertical layouts, we keep 85% width to avoid hitting UI elements (like/comment buttons on Reels)
    const maxWidth = width * 0.85;

    // Split by explicit newlines first, then wrap each paragraph
    const paragraphs = textToDraw.split('\n');
    const wrappedParagraphs: string[][] = [];

    paragraphs.forEach(paragraph => {
        const words = paragraph.split(' ');
        const linesInPara: string[] = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = measureRichTextWidth(currentLine + " " + word);
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                linesInPara.push(currentLine);
                currentLine = word;
            }
        }
        linesInPara.push(currentLine);
        wrappedParagraphs.push(linesInPara);
    });

    const lines = wrappedParagraphs.flat();

    // Create a map to know which lines are NOT the last in their paragraph (for justify)
    const isNotLastLineMap = new Set<number>();
    let lineCounter = 0;
    wrappedParagraphs.forEach(pLines => {
        for (let j = 0; j < pLines.length - 1; j++) {
            isNotLastLineMap.add(lineCounter + j);
        }
        lineCounter += pLines.length;
    });

    // 4. Calculate Positioning
    // 4. Calculate Positioning (CORRIGIDO)
    const lineHeightMultiplier = config.lineHeight || 1.4;
    const pxLineHeight = fontSize * lineHeightMultiplier;
    const totalTextHeight = lines.length * pxLineHeight;

    let startY = height / 2; // valor inicial

    // padding padrão vertical (igual ao lateral 0.075)
    const verticalPadding = height * 0.075;

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
                paddingX = 0; // ZERO padding for ultimate tightness
            } else { // "Block" mode
                paddingY = fontSize * 0.20;
                paddingX = 0; // ZERO padding for ultimate tightness
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
                    const lineWidth = measureRichTextWidth(line);
                    if (lineWidth <= 0) return;

                    const lineBoxWidth = lineWidth + (paddingX * 2);
                    const lineBoxHeight = fontSize + (paddingY * 2);

                    let lineBoxX = 0;
                    if (config.textAlign === 'center') {
                        lineBoxX = (width - lineBoxWidth) / 2;
                    } else if (config.textAlign === 'left' || config.textAlign === 'justify') {
                        lineBoxX = (width * 0.075) - paddingX;
                    } else if (config.textAlign === 'right') {
                        lineBoxX = (width * 0.925) + paddingX - lineBoxWidth;
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
                lines.forEach(line => {
                    const w = measureRichTextWidth(line);
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
                    boxX = (width * 0.075) - paddingX;
                } else if (config.textAlign === 'right') {
                    boxX = (width * 0.925) + paddingX - boxWidth;
                } else if (config.textAlign === 'justify') {
                    boxX = (width * 0.075) - paddingX;
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
    const drawLines = (drawFn: (line: string, x: number, y: number) => void) => {
        lines.forEach((originalLine, index) => {
            // 1. LIMPEZA TOTAL: Garante que não há espaços nas pontas
            originalLine = originalLine.trim();
            if (!originalLine) return; // Salta linhas vazias

            const y = startY + (index * pxLineHeight);

            // 2. MEDIÇÃO PRECISA
            const lineWidth = measureRichTextWidth(originalLine);

            // 3. ALINHAMENTO INTELIGENTE
            ctx.textAlign = 'left'; // Forçamos left para o loop de pedaços
            let startX = width * 0.075; // Margem Esquerda Padrão

            if (config.textAlign === 'center') {
                startX = (width - lineWidth) / 2;
            } else if (config.textAlign === 'right') {
                startX = (width * 0.925) - lineWidth;
            }
            // (Nota: 'justify' cai aqui no default 'left', que é mais seguro)

            // 4. DESENHO DOS PEDAÇOS
            const parts = originalLine.split(/(<b.*?>.*?<\/b>|<u.*?>.*?<\/u>)/gi);
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
            drawLines((text, x, y) => ctx.fillText(text, x, y));
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
        ctx.shadowColor = shadowColorBase;

        // --- CORREÇÃO AQUI ---
        // Valores base mais altos para serem visíveis em HD
        // Se o resolutionMultiplier for 1.0 (1080p), usamos valores maiores:

        // Blur base: Se não definido, usa 30 (antes era 15, muito pouco para HD)
        const baseBlur = config.textShadowBlur !== undefined ? config.textShadowBlur : 30;
        const blurAmount = baseBlur * config.textShadowOpacity;

        ctx.shadowBlur = blurAmount * resolutionMultiplier * formatBoost;

        // Offset base: Aumentar de 4 para 10 ou 15px
        const baseOffset = 15;
        ctx.shadowOffsetX = baseOffset * resolutionMultiplier * formatBoost;
        ctx.shadowOffsetY = baseOffset * resolutionMultiplier * formatBoost;

        // --- FIM CORREÇÃO ---

        // Truque: Se isto é só a "passagem de sombra", 
        // define o preenchimento igual à sombra, mas com opacidade muito baixa
        // para não criar um "segundo texto" duro por cima.
        ctx.globalAlpha = config.textShadowOpacity ?? 0.5;
        ctx.fillStyle = shadowColorBase;

        drawLines((text, x, y) => ctx.fillText(text, x, y));
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

    drawLines((text, x, y) => {
        if (config.textOutlineWidth > 0) {
            ctx.strokeText(text, x, y);
        }
        // ONLY fill if not transparent OR if we have a gradient
        if (config.textColor !== 'transparent' || gradientApplied) {
            ctx.fillText(text, x, y);
        }
    });
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