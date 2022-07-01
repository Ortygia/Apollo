'use strict'
const fastifyPlugin = require('fastify-plugin')
const MusicBrainzApi = require('musicbrainz-api').MusicBrainzApi
const mbApi = new MusicBrainzApi({
  appName: 'Apollo',
  appVersion: '0.0.1',
  appContactInfo: 'ryleegeorge1@gmail.com'
})
async function mApiPlugin(fastify, opts, done) {
  const log = fastify.log.child({ module: 'Scanner' })
  log.debug('Attaching MusicBrain API')
  fastify.decorate('mapi', mbApi)
  log.info('Attached MusicBrain API')
  done()
}

module.exports = fastifyPlugin(mApiPlugin)
