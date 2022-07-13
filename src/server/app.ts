'use strict'
import 'dotenv/config'
import fastify, { FastifyInstance } from 'fastify'
import sequelize from '../plugins/sequelize/index'
import mApi from '../plugins/mApi'
import index from './routes/index'
import musicScanner from '../plugins/musicScanner'
import artistService from '../plugins/artist/index'
import artistRoutes from './routes/artists'
import albumRoutes from './routes/albums'
import fastifySensible from '@fastify/sensible'
import getLogger from '../utils/logger'
import config from '../plugins/config'
import { existsSync, mkdirSync } from 'fs'
const configDir = process.cwd() + '/data'

export async function buildFastify() {
  // Send SIGHUP to process.
  const serverInstance = fastify({ logger: getLogger() })
  await serverInstance.register(index)
  await serverInstance.register(artistRoutes, { prefix: '/artists' })
  await serverInstance.register(albumRoutes, { prefix: '/albums' })
  if (!existsSync(configDir)) mkdirSync(configDir)
  serverInstance.decorate('configDir', configDir)
  await serverInstance.register(sequelize, { storage: `${configDir}/deaftone.sqlite`, dialect: 'sqlite', logging: false })

  serverInstance.register(mApi)
  serverInstance.register(artistService)
  serverInstance.register(musicScanner)
  serverInstance.register(fastifySensible)
  // serverInstance.register(config)
  return serverInstance
}

export async function start(server: FastifyInstance) {
  const signals = ['SIGINT', 'SIGTERM']
  signals.forEach((signal) => {
    process.once(signal, async () => {
      await server.close()
      server.log.info('Closing server')
      process.exit(0)
    })
  })

  listen(server)
}

async function listen(server: FastifyInstance) {
  /*  console.log(server.scannerManager.isRunning)
  if (server.scannerManager.isRunning) {
    server.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
      if (err) {
        server.log.error(err)
        process.exit(1)
      }
    })
  } else {
    setTimeout(() => {
      listen(server)
    }, 200)
  } */
  server.listen({ port: 3030, host: '0.0.0.0' }, (err) => {
    if (err) {
      server.log.error(err)
      process.exit(1)
    }
  })
}
