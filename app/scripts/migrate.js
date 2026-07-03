/* eslint-disable @typescript-eslint/no-require-imports */
'use strict'

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
})

async function migrate() {
  const client = await pool.connect()
  try {
    const migDir = path.join(__dirname, '..', 'migrations')
    const files = fs
      .readdirSync(migDir)
      .filter((/** @type {string} */ f) => f.endsWith('.sql'))
      .sort()

    for (const file of files) {
      console.log(`Running migration: ${file}`)
      const sql = fs.readFileSync(path.join(migDir, file), 'utf8')
      await client.query(sql)
      console.log(`Done: ${file}`)
    }
    console.log('All migrations complete.')
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
