'use strict'

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { Album } from '../../../models/album'
import { Artist } from '../../../models/artist'
import { Song } from '../../../models/song'

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
      include: {
        model: Album,
        as: 'albums'
      },
      order: [
        [fastify.db.Sequelize.col('Albums.year'), 'DESC']
      ]
    })

    if (!artist) return reply.notFound()
    reply.status(200).send(artist)
  })
  /**
 * @api {get} /artists Get all Artists from db
 * @apiGroup Artists
 * @apiName Get all Artists
 */
  fastify.get('/', async (_req, reply: FastifyReply) => {
    const artists = await Artist.findAll({
      order: [
        ['name', 'ASC']
      ]
    })
    reply.status(200).send(artists)
  })
}

export default artistRoutes
