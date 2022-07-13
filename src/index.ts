'use strict'
import { buildFastify, start } from './server/app'
async function run() {
  await start(await buildFastify())
}

run().catch((error) => console.error(error))
