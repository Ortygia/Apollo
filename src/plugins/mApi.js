'use strict'
const fastifyPlugin = require('fastify-plugin')
const MusicBrainzApi = require('musicbrainz-api').MusicBrainzApi
const mbApi = new MusicBrainzApi({
  appName: 'Apollo',
  appVersion: '0.0.1',
  appContactInfo: 'ryleegeorge1@gmail.com'
})
async function mApiPlugin(fastify) {
  console.log('mApi connected')
  fastify.decorate('mapi', mbApi)
}

module.exports = fastifyPlugin(mApiPlugin)
