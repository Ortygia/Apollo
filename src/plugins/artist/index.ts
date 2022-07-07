import fp from 'fastify-plugin'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import axios from 'axios'
import { setupCache } from 'axios-cache-adapter'
import ArtistService from './service'

'use strict'

const cache = setupCache({
  maxAge: 15 * 60 * 1000
})

// Create `axios` instance passing the newly created `cache.adapter`
const api = axios.create({
  adapter: cache.adapter
})
const artistService: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  const log = fastify.log.child({ module: 'User' })

  const artistService = new ArtistService(log, api)
  fastify.decorate('artist', artistService)
  fastify.decorate('acache', cache)
}
export default fp(artistService)
