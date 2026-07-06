# E2E Testing

## Overview

This directory contains end-to-end (E2E) browser automation tests using Playwright. These tests verify the application's functionality from a user's perspective by automating real browser interactions.

## Configuration

The Playwright configuration is defined in `playwright.config.ts` at the repository root:

- **Test directory**: `./e2e`
- **Base URL**: `http://localhost:3000`
- **Browser**: Chromium
- **Timeout**: 30 seconds per test
- **Screenshots/videos**: Captured on failure for debugging

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install --with-deps chromium
   ```

3. Ensure the application is running locally:
   ```bash
   ./dev
   ```

### Execute Tests

Run all E2E tests:
```bash
npm run test:e2e
```

Run a specific test file:
```bash
npx playwright test e2e/smoke.spec.ts --reporter=line
```

Run tests in headed mode (visible browser):
```bash
npx playwright test --headed
```

## Test Structure

### smoke.spec.ts

Basic smoke test that verifies:
- The home page loads successfully
- The page has a non-empty title

This test serves as a health check to ensure the application is running and accessible.

## Test Development Guidelines

- All interactive UI elements should have `data-testid` attributes for reliable selection
- Tests should be independent and able to run in any order
- Use page object models for complex user flows to improve maintainability
- Avoid hardcoded waits; rely on Playwright's auto-waiting mechanisms

## Relationship to Acceptance Tests

Note: This E2E test setup is separate from the full acceptance test suite in the `acceptance/` directory. The acceptance suite is designed to run against live AWS deployments and includes more comprehensive scenarios including authentication flows and database interactions.

The E2E tests in this directory are focused on local development workflows and provide faster feedback during development.
