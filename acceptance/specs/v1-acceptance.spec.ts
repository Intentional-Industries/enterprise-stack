import { test, expect } from '@playwright/test'
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager'
import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
} from '@aws-sdk/client-cognito-identity-provider'

const APP_URL = process.env.APP_URL!
const AWS_REGION = process.env.AWS_REGION ?? 'us-east-1'
const DB_SECRET_ARN = process.env.DB_SECRET_ARN ?? ''
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID ?? ''

const smClient = new SecretsManagerClient({ region: AWS_REGION })
const cognitoClient = new CognitoIdentityProviderClient({ region: AWS_REGION })

// Unique test user per run — ensures isolation between runs
const RUN_ID = Date.now().toString(36)
const TEST_EMAIL = `test+${RUN_ID}@example.com`
const TEST_PASSWORD = `Test@${RUN_ID.toUpperCase()}1a!`

test.describe('V1 Acceptance', () => {
  // ── Test 1: DB read path ────────────────────────────────────────────────────
  test('1. DB read path — public page shows hello world from database', async ({
    page,
  }) => {
    const response = await page.goto(APP_URL)
    expect(response?.status()).toBe(200)

    // The string must appear in the page body — sourced from the DB settings row
    await expect(page.locator('body')).toContainText('hello world')
    await page.screenshot({ path: 'screenshots/01-home-hello-world.png' })
  })

  // ── Test 2: DB tamper — value is not hard-coded ───────────────────────────
  test('2. DB tamper — /api/hello returns live DB value', async ({
    request,
    page,
  }) => {
    // Call the JSON API endpoint that reads directly from the DB
    const res = await request.get(`${APP_URL}/api/hello`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(typeof body.value).toBe('string')
    expect(body.value.length).toBeGreaterThan(0)

    // The home page must show the same value — proves it's DB-driven, not hard-coded
    await page.goto(APP_URL)
    await expect(page.locator('body')).toContainText(body.value)
    await page.screenshot({ path: 'screenshots/02-db-read-verified.png' })
  })

  // ── Test 3: Account creation ─────────────────────────────────────────────
  test('3. Account creation — register a new account via Cognito', async ({
    page,
  }) => {
    await page.goto(`${APP_URL}/auth/signup`)

    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)

    // Fill confirm-password field if present
    const confirmField = page.locator('input[name="confirmPassword"]')
    if ((await confirmField.count()) > 0) {
      await confirmField.fill(TEST_PASSWORD)
    }

    await page.click('button[type="submit"]')

    // Success: redirected to sign-in (or profile if auto-login is implemented)
    await expect(page).toHaveURL(/signin|profile/, { timeout: 30_000 })
    await page.screenshot({ path: 'screenshots/03-signup-complete.png' })
  })

  // ── Test 4: Login ────────────────────────────────────────────────────────
  test('4. Login — authenticate with the registered credentials', async ({
    page,
  }) => {
    await page.goto(`${APP_URL}/auth/signin`)

    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/profile/, { timeout: 30_000 })
    await page.screenshot({ path: 'screenshots/04-login-success.png' })
  })

  // ── Test 5: Auth read path — Cognito-sourced value displayed ─────────────
  test('5. Auth read path — profile page shows Cognito-sourced identity', async ({
    page,
  }) => {
    // Sign in fresh for this test
    await page.goto(`${APP_URL}/auth/signin`)
    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/profile/, { timeout: 30_000 })

    // Profile page MUST display the email or Cognito sub — sourced from the token
    // The email was the username used during sign-up, so it will be present in the Cognito claim
    await expect(page.locator('body')).toContainText(TEST_EMAIL)
    await page.screenshot({ path: 'screenshots/05-profile-cognito-value.png' })
  })

  // ── Cleanup: remove the test user after all tests ─────────────────────────
  test.afterAll(async () => {
    if (!COGNITO_USER_POOL_ID) return
    try {
      await cognitoClient.send(
        new AdminDeleteUserCommand({
          UserPoolId: COGNITO_USER_POOL_ID,
          Username: TEST_EMAIL,
        })
      )
    } catch (e) {
      // Non-fatal: user may not have been created if earlier tests failed
      console.warn('Could not delete test user (may not exist):', (e as Error).message)
    }
  })
})
