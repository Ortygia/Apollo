'use strict'
import fp from 'fastify-plugin'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { MusicBrainzApi } from 'musicbrainz-api'
const mbApi = new MusicBrainzApi({
  appName: 'Apollo',
  appVersion: '0.0.1',
  appContactInfo: 'ryleegeorge1@gmail.com'
})
const mApi: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  const log = fastify.log.child({ module: 'Scanner' })
  log.debug('Attaching MusicBrain API')
  fastify.decorate('mapi', mbApi)
  log.info('Attached MusicBrain API')
}

export default fp(mApi)
