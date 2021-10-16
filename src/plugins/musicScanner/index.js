'use strict'
const fastifyPlugin = require('fastify-plugin')
const MusicScanner = require('./musicScanner')

async function musicScannerPlugin(fastify, opts, done) {
  const musicScanner = new MusicScanner('./test_music', fastify)
  fastify.decorate('musicScanner', musicScanner)
  const log = fastify.log.child({ module: 'Scanner' })
  log.info('Attaching Muisc Scanenr')
  musicScanner.startScanning()
  done()
}

module.exports = fastifyPlugin(musicScannerPlugin)
