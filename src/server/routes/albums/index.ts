'use strict'

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { Album } from '../../../models/album'

async function albumRoutes(fastify: FastifyInstance) {
  fastify.get('/:albumId', async (req: FastifyRequest<{
    Params: {
      albumId: string,
    },
    Querystring: {
      songs: boolean
    }
}>,
  reply: FastifyReply) => {
    let album
    if (req.query.songs) {
      album = await Album.findOne({
        where: { id: req.params.albumId },
        include: { all: true }
      })
    } else {
      album = await Album.findOne({
        where: { id: req.params.albumId }
      })
    }
    reply.status(200).send(album)
  })
  fastify.get('/', async (req: FastifyRequest<{
    Params: {
      artistId: string,
    };
}>,
  reply: FastifyReply) => {
    const albums = await Album.findAll()
    reply.status(200).send(albums)
  })
}

export default albumRoutes
