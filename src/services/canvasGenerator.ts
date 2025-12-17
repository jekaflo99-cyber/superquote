
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
       ctx.fillRect(0,0, width, height);
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
  
  // Letter Spacing (New Feature)
  if (config.letterSpacing) {
      // Use canvas letterSpacing if supported, else ignore (polyfill is complex)
      (ctx as any).letterSpacing = `${config.letterSpacing * scaleFactor}px`;
  } else {
      (ctx as any).letterSpacing = '0px';
  }

  // Text Transform (New Feature)
  let textToDraw = config.text;
  if (config.textTransform === 'uppercase') textToDraw = textToDraw.toUpperCase();
  if (config.textTransform === 'lowercase') textToDraw = textToDraw.toLowerCase();

 // 3. Text Wrapping (Improved for \n support)
  // For vertical layouts, we keep 85% width to avoid hitting UI elements (like/comment buttons on Reels)
  const maxWidth = width * 0.85; 
  const lines: string[] = [];
  
  // Split by explicit newlines first, then wrap each paragraph
  const paragraphs = textToDraw.split('\n');
  
  paragraphs.forEach(paragraph => {
      const words = paragraph.split(' ');
      let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
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

          if (config.boxGradientColors && config.boxGradientColors.length >= 2) {
            
              const bgGradient = bgCtx.createLinearGradient(0, 0, width, height); // Diagonal gradient for box
              config.boxGradientColors.forEach((color, index) => {
                  bgGradient.addColorStop(index / (config.boxGradientColors!.length - 1), color);
              });
              bgCtx.fillStyle = bgGradient;
          } else {
              bgCtx.fillStyle = config.textBackgroundColor;
          }

          const radius = 0; // 0x Radius (Sharp corners)
          
          let paddingY = 0;
          let paddingX = 0;

          if (config.textBoxStyle === 'highlight') { // "Fit" mode
             // Minimal Padding 2px (at scale)
             paddingY = fontSize * 0.04; // ~2px scaled
             paddingX = fontSize * 0.01; // ~0.5px scaled
          } else { // "Block" mode
             paddingY = fontSize * 0.2; // Standard padding
             paddingX = fontSize * 0.35;
          }

          // Draw Single Block (Unified Box Style)
          let maxLineWidth = 0;
          lines.forEach(line => {
              const w = ctx.measureText(line).width;
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

          // Adjust Y to center the box around the text block
          const boxY = startY - (pxLineHeight / 2) - paddingY + (pxLineHeight - fontSize) / 2; 

          bgCtx.beginPath();
          bgCtx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
          bgCtx.fill();
         

          // Composite the background layer onto main canvas
          ctx.save();
          ctx.globalAlpha = config.textBackgroundOpacity;
          ctx.drawImage(bgCanvas, 0, 0);
          ctx.restore();
      }
  }

  // Helper to draw lines with specific settings
  const drawLines = (drawFn: (line: string, x: number, y: number, isJustify: boolean, justifyWidth: number) => void) => {
      lines.forEach((line, index) => {
        const y = startY + (index * pxLineHeight);
        
        // Justify Logic
        if (config.textAlign === 'justify') {
            const lineWords = line.split(' ');
            if (lineWords.length > 1 && index < lines.length - 1) { // Don't justify last line
                const totalWidthOfWords = lineWords.reduce((acc, word) => acc + ctx.measureText(word).width, 0);
                const spaceAvailable = maxWidth - totalWidthOfWords;
                const spacePerWord = spaceAvailable / (lineWords.length - 1);
                
                let currentX = width * 0.075;
                
                lineWords.forEach((word) => {
                    drawFn(word, currentX, y, false, 0);
                    currentX += ctx.measureText(word).width + spacePerWord;
                });
            } else {
                // Last line or single word behaves like left align
                const xPos = width * 0.075;
                drawFn(line, xPos, y, false, 0);
            }
        } else {
            // Standard Align
            ctx.textAlign = config.textAlign as CanvasTextAlign;
            let xPos = width / 2;
            if (config.textAlign === 'left') xPos = width * 0.075;
            if (config.textAlign === 'right') xPos = width * 0.925;
            
            drawFn(line, xPos, y, false, 0);
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
      ctx.lineWidth = config.textSuperStrokeWidth * scaleFactor * 1.0; 
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
      ctx.fillText(text, x, y);
  });
  ctx.restore();

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