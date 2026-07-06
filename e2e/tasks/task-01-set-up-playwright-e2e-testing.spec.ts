import { test, expect } from '@playwright/test'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

test.describe('Task 01: Set up Playwright E2E testing', () => {
  test('playwright.config.ts exists at repo root with baseURL set to http://localhost:3000', async () => {
    const configPath = join(process.cwd(), 'playwright.config.ts')
    
    // Check file exists
    expect(existsSync(configPath)).toBe(true)
    
    // Read and parse the config file
    const configContent = readFileSync(configPath, 'utf-8')
    
    // Verify baseURL is set to http://localhost:3000
    expect(configContent).toContain('baseURL')
    expect(configContent).toContain('http://localhost:3000')
    
    // More precise check - ensure it's in the use block
    const baseURLPattern = /baseURL:\s*['"]http:\/\/localhost:3000['"]/
    expect(configContent).toMatch(baseURLPattern)
  })

  test('@playwright/test appears in package.json devDependencies', async () => {
    const packageJsonPath = join(process.cwd(), 'package.json')
    
    // Check file exists
    expect(existsSync(packageJsonPath)).toBe(true)
    
    // Read and parse package.json
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    
    // Verify @playwright/test is in devDependencies
    expect(packageJson.devDependencies).toBeDefined()
    expect(packageJson.devDependencies['@playwright/test']).toBeDefined()
    
    // Verify it has a valid version
    const playwrightVersion = packageJson.devDependencies['@playwright/test']
    expect(playwrightVersion).toMatch(/^\^?\d+\.\d+\.\d+/)
  })

  test('npx playwright install --with-deps chromium exits with code 0', async () => {
    let exitCode: number
    
    try {
      // Execute the command
      execSync('npx playwright install --with-deps chromium', {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 120000 // 2 minute timeout for installation
      })
      exitCode = 0
    } catch (error: any) {
      exitCode = error.status || 1
    }
    
    expect(exitCode).toBe(0)
  })

  test('A smoke test at e2e/smoke.spec.ts loads the app home page and asserts the page title is not empty', async () => {
    const smokeTestPath = join(process.cwd(), 'e2e', 'smoke.spec.ts')
    
    // Check file exists
    expect(existsSync(smokeTestPath)).toBe(true)
    
    // Read the smoke test file
    const smokeTestContent = readFileSync(smokeTestPath, 'utf-8')
    
    // Verify it imports from @playwright/test
    expect(smokeTestContent).toContain("from '@playwright/test'")
    
    // Verify it uses page.goto (loads the page)
    expect(smokeTestContent).toMatch(/page\.goto\s*\(/)
    
    // Verify it gets the page title
    expect(smokeTestContent).toMatch(/page\.title\s*\(/)
    
    // Verify it asserts the title is not empty
    expect(smokeTestContent).toMatch(/expect\s*\([^)]*title[^)]*\)/)
    expect(smokeTestContent).toMatch(/not\.toBe\s*\(\s*['"]{2}\s*\)|\.not\.toBe\s*\(\s*['"]{2}\s*\)/)
  })

  test('npx playwright test e2e/smoke.spec.ts --reporter=line exits with code 0', async () => {
    let exitCode: number
    
    try {
      // Execute the smoke test
      execSync('npx playwright test e2e/smoke.spec.ts --reporter=line', {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 60000 // 1 minute timeout
      })
      exitCode = 0
    } catch (error: any) {
      exitCode = error.status || 1
      
      // Log the error output for debugging if test fails
      if (error.stdout) {
        console.log('stdout:', error.stdout.toString())
      }
      if (error.stderr) {
        console.log('stderr:', error.stderr.toString())
      }
    }
    
    expect(exitCode).toBe(0)
  })
})
