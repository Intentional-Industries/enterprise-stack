import { test, expect } from '@playwright/test'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

test.describe('Task 01: Update header text to Intentional Industries', () => {
  test('File app/src/app/layout.tsx contains the string Intentional Industries in the header section', async () => {
    const layoutPath = join(process.cwd(), 'app', 'src', 'app', 'layout.tsx')
    
    // Check file exists
    expect(existsSync(layoutPath)).toBe(true)
    
    // Read the layout file
    const layoutContent = readFileSync(layoutPath, 'utf-8')
    
    // Verify 'Intentional Industries' appears in the file
    expect(layoutContent).toContain('Intentional Industries')
    
    // More specific check: verify it's in the nav/header section
    // Extract the nav section (between <nav> and </nav>)
    const navMatch = layoutContent.match(/<nav[\s\S]*?<\/nav>/i)
    expect(navMatch).toBeTruthy()
    
    if (navMatch) {
      const navSection = navMatch[0]
      expect(navSection).toContain('Intentional Industries')
    }
  })

  test('GET http://localhost:3001 returns HTML containing Intentional Industries in the response body', async ({ page }) => {
    // Navigate to the home page
    const response = await page.goto('http://localhost:3001')
    
    // Verify the response is successful
    expect(response).toBeTruthy()
    expect(response!.status()).toBe(200)
    
    // Get the response body
    const body = await response!.text()
    
    // Verify the response body contains 'Intentional Industries'
    expect(body).toContain('Intentional Industries')
    
    // Also verify it's visible in the DOM
    await expect(page.locator('nav .brand')).toHaveText('Intentional Industries')
  })

  test('The string Loop Harness does not appear in app/src/app/layout.tsx header section', async () => {
    const layoutPath = join(process.cwd(), 'app', 'src', 'app', 'layout.tsx')
    
    // Check file exists
    expect(existsSync(layoutPath)).toBe(true)
    
    // Read the layout file
    const layoutContent = readFileSync(layoutPath, 'utf-8')
    
    // Extract the nav section (between <nav> and </nav>)
    const navMatch = layoutContent.match(/<nav[\s\S]*?<\/nav>/i)
    expect(navMatch).toBeTruthy()
    
    if (navMatch) {
      const navSection = navMatch[0]
      // Verify 'Loop Harness' does NOT appear in the nav section
      expect(navSection).not.toContain('Loop Harness')
    }
    
    // Also check the entire file doesn't contain 'Loop Harness'
    expect(layoutContent).not.toContain('Loop Harness')
  })
})
