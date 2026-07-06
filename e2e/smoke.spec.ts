import { test, expect } from '@playwright/test'

test('home page loads and has a title', async ({ page }) => {
  await page.goto('/')
  const title = await page.title()
  expect(title).not.toBe('')
})
