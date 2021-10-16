'use strict'
const pino = require('pino')
const logger = pino({
  prettyPrint: { colorize: true },
  level: 'debug'
})
const MusicScanner = require('./musicScanner')
const scanner = new MusicScanner({
  mediaFolder: './test_music'
})
async function run() {
  process.on('message', async (msg) => {
    logger.info(`Message from parent: ${msg}`)
    switch (msg) {
    case 'isScanning':
      process.send({ event: 'isScanning', value: await scanner.scanning })
      break
    case 'scanStart':
      scanner.startScanning()
      break
    }
  })

/*   let counter = 0
  setInterval(() => {
    process.send({ counter: counter++ })
  }, 1000) */
}

run().catch((error) => console.error(error))
