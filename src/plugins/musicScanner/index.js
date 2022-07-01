'use strict'
const fastifyPlugin = require('fastify-plugin')
const ScannerManager = require('./scannerManager')

async function musicScannerPlugin(fastify, opts, done) {
  // const musicScanner = new MusicScanner('./test_music', fastify)
  const log = fastify.log.child({ module: 'Scanner' })
  log.debug('Attaching Muisc Scanner')

  const manager = new ScannerManager(log)
  manager.startChild(log)
  fastify.decorate('scannerManager', manager)
  log.info('Attached Muisc Scanner')

  done()
}

module.exports = fastifyPlugin(musicScannerPlugin)
