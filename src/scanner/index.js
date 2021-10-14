'use strict'
const pino = require('pino')
const logger = pino({
  prettyPrint: { colorize: true },
  level: 'debug'
})
const MusicScanner = require('./musicScanner')
async function run() {
  process.on('message', (msg) => {
    logger.info('Message from parent:', msg)
  })
  const scanner = new MusicScanner({
    mediaFolder: './test_music'
  })
  scanner.startScanning()
/*   let counter = 0
  setInterval(() => {
    process.send({ counter: counter++ })
  }, 1000) */
}

run().catch((error) => console.error(error))
