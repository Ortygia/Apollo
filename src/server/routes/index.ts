'use strict'

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { createReadStream, statSync } from 'fs'
import { Album } from '../../models/album'
import { Artist } from '../../models/artist'
import { Song } from '../../models/song'
import computeRange from '../../utils'
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
  fastify.get('/getAlbumList', async (req: FastifyRequest<{
      Params: {
          artistId: string,
      };
  }>,
  reply: FastifyReply) => {
    const albums = await Album.findAll({
      raw: true,
      nest: true
    })
    reply.status(200).send(albums)
  })
  fastify.get('/getArtistAlbum', async (req: FastifyRequest<{
    Querystring: {
        id: string,
    };
}>,
  reply: FastifyReply) => {
    const album = await Album.findOne({
      where: { id: req.query.id },

      include: { all: true }
    })

    reply.status(200).send(album)
  })
  fastify.get('/getArtist', async (req: FastifyRequest<{
    Querystring: {
        id: string,
    };
}>,
  reply: FastifyReply) => {
    const album = await Artist.findOne({
      where: { id: req.query.id },
      include: { all: true }
    })

    reply.status(200).send(album)
  })
  fastify.get('/banner/:artistId', async (req: FastifyRequest<{
        Params: {
            artistId: string,
        };
    }>,
  reply: FastifyReply) => {
    const url = await fastify.artist.getFanArtArtistBanner(req.params.artistId)
    reply.status(200).send(url)
  })
  fastify.get('/stream/:songId', async (req: FastifyRequest<{
      Params: {
        songId: string,
      };
    }>,
  reply: FastifyReply) => {
    const song = await Song.findOne({ where: { id: req.params.songId } })
    if (song) {
      const stat = statSync(song.path)
      const range = computeRange(stat.size, req.headers.range)
      const stream = createReadStream(song.path, range)

      return reply
        .status(206)
        .headers({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: 0,
          connection: 'keep-alive',
          'Content-Type': 'audio/flac',
          'Accept-Ranges': 'bytes',
          'Content-Length': range.end - range.start + 1,
          'Content-Range': `bytes ${range.start}-${range.end}/${stat.size}`
        })
        .send(stream)
    } else {
      return reply.status(404).send('Song not found')
    }
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
    const songs = await Song.findAll()
    await console.log(songs)
    reply.status(200).send('Hello from ts2aa')
  })
}

export default indexRoutes
