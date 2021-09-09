'use strict'
const { buildFastify, start } = require('./src/server/app')
const { fork } = require('child_process')

async function run() {
  const scannerProccess = startScannerProccess()
  await start(await buildFastify(scannerProccess))
}

function startScannerProccess() {
  const child = fork('./src/scanner/index.js')

  return child
}
run().catch((error) => console.error(error))
