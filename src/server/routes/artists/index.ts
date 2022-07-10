'use strict'

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { Artist } from '../../../models/artist'

async function artistRoutes(fastify: FastifyInstance) {
  fastify.get('/:artistId', async (req: FastifyRequest<{
    Params: {
      artistId: string,
    };
}>,
  reply: FastifyReply) => {
    const artist = await Artist.findOne({
      where: { id: req.params.artistId },
      include: { all: true }
    })

    reply.status(200).send(artist)
  })
  fastify.get('/', async (req: FastifyRequest<{
    Params: {
      artistId: string,
    };
}>,
  reply: FastifyReply) => {
    const artists = await Artist.findAll()

    reply.status(200).send(artists)
  })
}

export default artistRoutes
