const { setupCache } = require('axios-cache-adapter')
const axios = require('axios')
'use strict'
const fastifyPlugin = require('fastify-plugin')
const ArtistService = require('./service')
const cache = setupCache({
  maxAge: 15 * 60 * 1000
})

// Create `axios` instance passing the newly created `cache.adapter`
const api = axios.create({
  adapter: cache.adapter
})
async function artistPlugin(fastify, opts, done) {
  const log = fastify.log.child({ module: 'User' })

  const artistService = new ArtistService(log, api)
  fastify.decorate('artist', artistService)
  fastify.decorate('acache', cache)
  done()
}

module.exports = fastifyPlugin(artistPlugin)
