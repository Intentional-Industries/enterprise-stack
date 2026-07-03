/* eslint-disable @typescript-eslint/no-require-imports */
'use strict'

const fs = require('fs')
const path = require('path')
const {
  CognitoIdentityProviderClient,
  ListUserPoolsCommand,
  DescribeUserPoolCommand,
  CreateUserPoolCommand,
  CreateUserPoolClientCommand,
} = require('@aws-sdk/client-cognito-identity-provider')

const ENV_PATH = path.join(__dirname, '..', '.env.local')
const CACHE_PATH = path.join(__dirname, '..', '.cognito-local.json')

const endpoint = process.env.COGNITO_ENDPOINT

if (!endpoint) {
  console.log('COGNITO_ENDPOINT not set — skipping cognito-local provisioning (using real AWS Cognito).')
  process.exit(0)
}

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint,
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
})

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'))
  } catch {
    return null
  }
}

function writeCache(data) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2))
}

function upsertEnv(key, value) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : ''
  const line = `${key}=${value}`
  const pattern = new RegExp(`^#?\\s*${key}=.*$`, 'm')
  content = pattern.test(content) ? content.replace(pattern, line) : `${content.trimEnd()}\n${line}\n`
  fs.writeFileSync(ENV_PATH, content)
}

async function waitUntilReady(maxAttempts = 30) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await client.send(new ListUserPoolsCommand({ MaxResults: 1 }))
      return
    } catch (err) {
      if (attempt === maxAttempts) throw err
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}

async function main() {
  await waitUntilReady()

  const cache = readCache()
  if (cache) {
    try {
      await client.send(new DescribeUserPoolCommand({ UserPoolId: cache.userPoolId }))
      upsertEnv('COGNITO_USER_POOL_ID', cache.userPoolId)
      upsertEnv('COGNITO_CLIENT_ID', cache.clientId)
      console.log(`cognito-local: reusing existing pool ${cache.userPoolId}`)
      return
    } catch {
      console.log('cognito-local: cached pool is gone (fresh volume) — recreating...')
    }
  }

  const { UserPool } = await client.send(
    new CreateUserPoolCommand({
      PoolName: 'intentional-local',
      UsernameAttributes: ['email'],
      AutoVerifiedAttributes: ['email'],
    })
  )
  const userPoolId = UserPool.Id

  const { UserPoolClient } = await client.send(
    new CreateUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientName: 'intentional-local-client',
      GenerateSecret: false,
      ExplicitAuthFlows: ['ALLOW_USER_PASSWORD_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH'],
    })
  )
  const clientId = UserPoolClient.ClientId

  writeCache({ userPoolId, clientId })
  upsertEnv('COGNITO_USER_POOL_ID', userPoolId)
  upsertEnv('COGNITO_CLIENT_ID', clientId)

  console.log(`cognito-local: created pool ${userPoolId} / client ${clientId}`)
}

main().catch((err) => {
  console.error('cognito-local setup failed:', err)
  process.exit(1)
})
