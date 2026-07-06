import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Task 02: Apply white font color to header', () => {
  const cssFilePath = path.join(process.cwd(), 'app/src/app/globals.css');

  test('File app/src/app/globals.css contains a CSS rule for .site-header or .site-title with color property set to white', async () => {
    // Read the CSS file
    const cssContent = fs.readFileSync(cssFilePath, 'utf-8');

    // Check for .site-header or .site-title with white color
    // White can be: white, #fff, #ffffff, or rgb(255,255,255) or rgb(255, 255, 255)
    const whiteColorPattern = /\.(site-header|site-title)\s*\{[^}]*color:\s*(white|#fff|#ffffff|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))[^}]*\}/gi;
    
    const matches = cssContent.match(whiteColorPattern);
    
    // Should find at least one match
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(1);
    
    // Verify the content more specifically
    const hasSiteHeader = /\.site-header\s*\{[^}]*color:\s*(white|#fff|#ffffff|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))/i.test(cssContent);
    const hasSiteTitle = /\.site-title\s*\{[^}]*color:\s*(white|#fff|#ffffff|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))/i.test(cssContent);
    
    expect(hasSiteHeader || hasSiteTitle).toBe(true);
  });

  test('Running grep command returns at least one match in a header-related selector', async () => {
    // Read the CSS file
    const cssContent = fs.readFileSync(cssFilePath, 'utf-8');
    
    // Simulate the grep command: grep -E 'color:\s*(white|#fff|#ffffff|rgb\(255,\s*255,\s*255\))' app/src/app/globals.css
    const grepPattern = /color:\s*(white|#fff|#ffffff|rgb\(255,\s*255,\s*255\))/g;
    const lines = cssContent.split('\n');
    const matchingLines: string[] = [];
    
    lines.forEach((line, index) => {
      if (grepPattern.test(line)) {
        matchingLines.push(line);
      }
    });
    
    // Should have at least one match
    expect(matchingLines.length).toBeGreaterThanOrEqual(1);
    
    // Verify that at least one matching line is in a header-related context
    // We need to check if the match appears within a header-related selector block
    let foundHeaderRelated = false;
    
    // Check if any matching lines are associated with header-related selectors
    // We'll look for context around each match
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/color:\s*(white|#fff|#ffffff|rgb\(255,\s*255,\s*255\))/.test(line)) {
        // Look backwards to find the selector
        for (let j = i; j >= 0; j--) {
          const previousLine = lines[j];
          // If we find a closing brace before a selector, break
          if (/^\s*\}\s*$/.test(previousLine) && j !== i) {
            break;
          }
          // Check if this line contains a header-related selector
          if (/(site-header|site-title|header|\.brand|nav\s+h[1-6]|\.page-header)/i.test(previousLine)) {
            foundHeaderRelated = true;
            break;
          }
        }
      }
      if (foundHeaderRelated) break;
    }
    
    expect(foundHeaderRelated).toBe(true);
  });
});
