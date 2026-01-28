import { Artifact, ParsedHtml } from "../types";

// Helper to determine if an element looks like a "Card" container
const isCardContainer = (el: Element) => {
  const className = el.className.toLowerCase();
  return (
    className.includes('card') || 
    className.includes('container') || 
    className.includes('section') ||
    el.tagName === 'DIV' || el.tagName === 'SECTION'
  );
};

// Extract HTML code blocks from Markdown text OR raw HTML input
export const extractArtifacts = (text: string): Artifact[] => {
  const artifacts: Artifact[] = [];
  const now = Date.now();

  // 1. Detect blocks (Markdown or Raw)
  let blocks: string[] = [];
  const mdMatches = [...text.matchAll(/```html([\s\S]*?)```/gi)];
  
  if (mdMatches.length > 0) {
    blocks = mdMatches.map(m => m[1].trim());
  } else {
    const rawMatches = [...text.matchAll(/(<!DOCTYPE html>[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/gi)];
    if (rawMatches.length > 0) {
      blocks = rawMatches.map(m => m[0].trim());
    } else {
      // Fallback for single raw snippet
      const trimmed = text.trim();
      if (/<[a-z][\s\S]*>/i.test(trimmed) && (trimmed.includes('<div') || trimmed.includes('<style'))) {
        blocks = [trimmed];
      }
    }
  }

  // 2. Process each block
  blocks.forEach((block, blockIndex) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(block, 'text/html');
      
      const headContent = doc.head.innerHTML;
      
      // Filter helper to get significant DOM elements
      const getMeaningfulChildren = (el: Element) => {
        return Array.from(el.children).filter(child => 
            !['SCRIPT', 'STYLE', 'LINK', 'META', 'BR', 'NOSCRIPT', 'TEMPLATE'].includes(child.tagName)
        );
      };

      let targets = getMeaningfulChildren(doc.body);

      // --- Nested Structure Handling ---
      // If the body has only one child (e.g., a wrapper div), check if that wrapper contains the cards.
      if (targets.length === 1) {
        const container = targets[0];
        const innerChildren = getMeaningfulChildren(container);
        
        if (innerChildren.length > 1) {
            const containerClass = (container.className || '').toLowerCase();
            
            // Heuristics to decide if we should peel off the wrapper
            
            // 1. Does the wrapper name imply a collection?
            const isWrapperName = /wrapper|container|list|grid|group|collection/.test(containerClass);
            
            // 2. Do the children look like cards/slides?
            const childrenHaveCardClass = innerChildren.some(child => 
                (child.className || '').toLowerCase().match(/card|slide|page|section|item/)
            );
            
            // 3. Are the children structural tags often used for cards?
            const childrenAreSections = innerChildren.every(child => 
                ['SECTION', 'ARTICLE', 'ASIDE'].includes(child.tagName)
            );

            // 4. Do NOT split if the container implies it is a SINGLE card itself (unless it's a 'card-wrapper')
            // e.g., <div class="card">...</div> should probably not be split into its header/body parts.
            // But <div class="card-wrapper"> should be split.
            // Regex \bcard\b matches "card" but also "card-wrapper" because - is a non-word char boundary.
            // So we check strict equality or known patterns.
            const isCardName = /\bcard\b/.test(containerClass) || containerClass === 'card';
            
            // Decision logic:
            // - If it explicitly looks like a wrapper (card-wrapper), SPLIT.
            // - If children look like cards/sections, SPLIT.
            // - BUT if it looks like a single card (isCardName) and NOT a wrapper (isWrapperName), DO NOT SPLIT.
            
            let shouldDescend = false;
            
            if (isWrapperName) {
                shouldDescend = true;
            } else if (childrenHaveCardClass || childrenAreSections) {
                // If it's just "card", assume it's a single card unit, unless children are explicitly "card" too?
                // Example: <div class="card"><div class="card-header">...</div></div> -> Don't split.
                // Example: <div><section class="card">...</section><section class="card">...</section></div> -> Split.
                if (!isCardName) {
                    shouldDescend = true;
                }
            }
            
            if (shouldDescend) {
                targets = innerChildren;
            }
        }
      }

      // --- Artifact Generation ---
      if (targets.length > 1) {
        targets.forEach((child, childIndex) => {
          // Construct a full document for this specific card
          const titleText = child.querySelector('h1, h2, h3')?.textContent?.trim() || 
                            child.getAttribute('title') || 
                            child.getAttribute('aria-label') ||
                            `Card ${childIndex + 1}`;
          
          const splitCode = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${headContent}
</head>
<body style="margin:0; padding:0; background: transparent;">
  ${child.outerHTML}
</body>
</html>`;

          artifacts.push({
            id: `artifact-split-${now}-${blockIndex}-${childIndex}`,
            code: splitCode,
            title: titleText.length > 30 ? titleText.substring(0, 30) + '...' : titleText,
            type: 'html'
          });
        });
      } else {
        // Just one card or no clear structure, keep as is
        const titleMatch = block.match(/<title>(.*?)<\/title>/i);
        artifacts.push({
          id: `artifact-block-${now}-${blockIndex}`,
          code: block,
          title: titleMatch ? titleMatch[1] : `Artifact ${blockIndex + 1}`,
          type: 'html'
        });
      }
    } catch (e) {
      console.error("Error splitting HTML block:", e);
      // Fallback
      artifacts.push({
        id: `artifact-err-${now}-${blockIndex}`,
        code: block,
        title: `Artifact ${blockIndex + 1}`,
        type: 'html'
      });
    }
  });

  return artifacts;
};

// Parse HTML string to separate Style and Body for safe embedding
export const parseHtmlForPreview = (html: string, wrapperId: string): ParsedHtml => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  
  // Extract Styles
  const styles = Array.from(doc.querySelectorAll('style'))
    .map(style => style.innerHTML)
    .join('\n');

  // Extract Body Content
  const bodyContent = doc.body.innerHTML;

  // Scope the CSS
  // Replaces "body" with the wrapper ID to ensure styles apply within the preview container
  let scopedStyles = styles.replace(/(^|}|,)\s*body/g, `$1 #${wrapperId}`);
  
  return {
    styles: scopedStyles,
    bodyContent
  };
};