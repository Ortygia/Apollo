'use strict'

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
async function indexRoutes(fastify: FastifyInstance) {
  /*  fastify.get('/:artistName', async (req, reply) => {
    const searchArtist = fastify.mapi.searchArtist(decodeURI(req.params.artistName))
    const artistId = (await searchArtist).artists[0].id
    const getArtist = await fastify.mapi.getArtist(artistId, ['url-rels'])
    const length = await fastify.acache.store.length()
    reply.status(200).send(await fastify.artist.getArtistInfo(getArtist, artistId))
  })

  fastify.get('/', async (req, reply) => {
    fastify.scannerManager.startScan()
    reply.status(200).send(fastify.scannerManager.isScanning)
  }) */
  fastify.get('/banner/:artistId', async (req: FastifyRequest<{
    Params: {
        artistId: string,
    };
    }>,
  reply: FastifyReply) => {
    const searchArtist = await fastify.artist.getFanArtArtistBanner(req.params.artistId)
    reply.status(200).send(searchArtist.artistbackground[0].url)
  })
  fastify.get('/full', async (req, reply) => {
    fastify.scannerManager.startScan()
    reply.status(200).send(fastify.scannerManager.isScanning)
  })
  fastify.get('/partial', async (req, reply) => {
    fastify.scannerManager.startPartialScan()
    reply.status(200).send(fastify.scannerManager.isScanning)
  })
  fastify.get('/', async (req, reply) => {
    reply.status(200).send('Hello from ts2aa')
  })
}

export default indexRoutes
