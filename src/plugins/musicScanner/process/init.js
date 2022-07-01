const MusicScanner = require('./musicScanner')
const logger = require('pino')({
  name: 'MusicScanner',
  transport: {
    target: 'pino-pretty',
    options: { destination: 1 }
  }
})
const scanner = new MusicScanner('', logger)
async function run() {
  scanner.initialize()
  await registerScannerEvents()
  await registerMasterEvents()

  process.send({ t: 'started', message: null })
}

async function registerMasterEvents() {
  process.on('message', message => {
    switch (message.t) {
    case 'startScan':
      scanner.startScanning()
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
