const bench = require('nanobench')
const SeqScanner = require('./sequilizeScanner')
const BetterScanner = require('./betterScanner')

bench('Scanner - Sequilize', async function (b) {
  const logger = require('pino')({
    name: 'MusicScanner',
    level: 'info'

  })
  const scanner = new SeqScanner('', logger)
  await scanner.initialize()

  b.start()
  await scanner.startFullScan()
  b.end()
})

bench('Scanner - better-sqlite3', async function (b) {
  const logger = require('pino')({
    name: 'MusicScanner',
    level: 'info'

  })
  const scanner = new BetterScanner('better.db', logger)
  await scanner.initialize()

  b.start()
  await scanner.startFullScan()
  b.end()
})

bench('Scanner - better-sqlite3 wal', async function (b) {
  const logger = require('pino')({
    name: 'MusicScanner',
    level: 'info'

  })
  const scanner = new BetterScanner('betterwal.db', logger, true)
  await scanner.initialize()

  b.start()
  await scanner.startFullScan()
  b.end()
})
