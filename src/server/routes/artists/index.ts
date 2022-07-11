'use strict'

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { Artist } from '../../../models/artist'

async function artistRoutes(fastify: FastifyInstance) {
  /**
 * @api {get} /artists/:artistId Request Artist information
 * @apiName Get Artist
 * @apiGroup Artists
 * @apiParam {String} artistId used to query db.
 */
  fastify.get('/:artistId', async (req: FastifyRequest<{
    Params: {
      artistId: string,
    };
  }>, reply: FastifyReply) => {
    const artist = await Artist.findOne({
      where: { id: req.params.artistId },
      include: { all: true }
    })
    reply.status(200).send(artist)
  })
  /**
 * @api {get} /artists Get all Artists from db
 * @apiGroup Artists
 * @apiName Get all Artists
 */
  fastify.get('/', async (_req, reply: FastifyReply) => {
    const artists = await Artist.findAll()
    reply.status(200).send(artists)
  })
}

export default artistRoutes
