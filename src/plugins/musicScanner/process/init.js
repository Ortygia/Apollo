const MusicScanner = require('./musicScanner')
const logger = require('pino')({
  name: 'MusicScanner',
  level: 'debug'

})
const scanner = new MusicScanner('', logger)
async function run() {
  scanner.initialize()
  process.send({ t: 'started', message: null })
  // scanner.startScanning()
  // process.send({ t: 'started', message: null })
  registerMasterEvents()
  registerScannerEvents()
}

async function registerMasterEvents() {
  process.on('message', message => {
    switch (message.t) {
    case 'startScan':

      scanner.startFullScan()
      break

    case 'startPartialScan':
      scanner.startPartialScan()
      break
    }
  })
}

async function registerScannerEvents() {
  scanner.on('scanStatus', (status) => {
    process.send({ t: 'scanStatus', message: status })
  })
}
run().catch((error) => console.error(error))
