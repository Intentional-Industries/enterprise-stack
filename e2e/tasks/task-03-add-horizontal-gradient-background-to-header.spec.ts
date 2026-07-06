import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Task 03: Add horizontal gradient background to header', () => {
  const cssFilePath = path.join(process.cwd(), 'app/src/app/globals.css');

  test('File app/src/app/globals.css contains a background or background-image property with linear-gradient for .site-header', async () => {
    // Read the CSS file
    const cssContent = fs.readFileSync(cssFilePath, 'utf-8');

    // Check for .site-header with background or background-image containing linear-gradient
    // Pattern should match: .site-header { ... background: linear-gradient(...) ... } or background-image: linear-gradient(...)
    const siteHeaderPattern = /\.site-header\s*\{[^}]*\}/gi;
    const matches = cssContent.match(siteHeaderPattern);
    
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(1);
    
    // Get the .site-header block content
    const siteHeaderBlock = matches![0];
    
    // Check if it contains background or background-image with linear-gradient
    const hasLinearGradient = /background(-image)?:\s*linear-gradient/i.test(siteHeaderBlock);
    
    expect(hasLinearGradient).toBe(true);
  });

  test('The gradient definition includes both black (black, #000, or #000000) and a navy blue color (e.g., #001f3f, #000080, or similar dark blue)', async () => {
    // Read the CSS file
    const cssContent = fs.readFileSync(cssFilePath, 'utf-8');

    // Find the .site-header block
    const siteHeaderPattern = /\.site-header\s*\{[^}]*\}/gi;
    const matches = cssContent.match(siteHeaderPattern);
    
    expect(matches).not.toBeNull();
    
    const siteHeaderBlock = matches![0];
    
    // Extract the linear-gradient content
    const gradientMatch = siteHeaderBlock.match(/linear-gradient\([^)]+\)/i);
    expect(gradientMatch).not.toBeNull();
    
    const gradientContent = gradientMatch![0];
    
    // Check for black color (black, #000, #000000)
    const hasBlack = /(black|#000000|#000(?![0-9a-fA-F]))/i.test(gradientContent);
    expect(hasBlack).toBe(true);
    
    // Check for navy blue or dark blue colors
    // Common navy/dark blue colors: #001f3f, #000080, #000033, #001a4d, etc.
    // We'll look for hex colors starting with #00 followed by a dark blue component
    const hasNavyBlue = /#00[0-9a-fA-F]{4}/i.test(gradientContent);
    expect(hasNavyBlue).toBe(true);
    
    // Additionally verify the gradient has at least two color stops
    const colorStops = gradientContent.split(',').length;
    expect(colorStops).toBeGreaterThanOrEqual(2);
  });

  test('Running `grep -i \'linear-gradient\' app/src/app/globals.css` returns at least one match in a header-related CSS rule', async () => {
    // Read the CSS file
    const cssContent = fs.readFileSync(cssFilePath, 'utf-8');
    
    // Simulate the grep command: grep -i 'linear-gradient' app/src/app/globals.css
    const lines = cssContent.split('\n');
    const matchingLines: string[] = [];
    
    lines.forEach((line) => {
      if (/linear-gradient/i.test(line)) {
        matchingLines.push(line);
      }
    });
    
    // Should have at least one match
    expect(matchingLines.length).toBeGreaterThanOrEqual(1);
    
    // Verify that at least one matching line is in a header-related context
    let foundHeaderRelated = false;
    
    // Check if any matching lines are associated with header-related selectors
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/linear-gradient/i.test(line)) {
        // Look backwards to find the selector
        for (let j = i; j >= 0; j--) {
          const previousLine = lines[j];
          // If we find a closing brace before a selector (and it's not the current line), break
          if (/^\s*\}\s*$/.test(previousLine) && j < i) {
            break;
          }
          // Check if this line contains a header-related selector
          // Look for: site-header, site-title, header, nav, .brand, page-header
          if (/(site-header|site-title|header|\\.brand|nav|page-header)/i.test(previousLine)) {
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
