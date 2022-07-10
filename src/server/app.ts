'use strict'
import 'dotenv/config'
import fastify, { FastifyInstance, FastifyRequest } from 'fastify'
import sequelize from '../plugins/sequelize/index'
import mApi from '../plugins/mApi'
import index from './routes/index'
import musicScanner from '../plugins/musicScanner'
import artistService from '../plugins/artist/index'
import artistRoutes from './routes/artists'
import albumRoutes from './routes/albums'
export async function buildFastify() {
  // Send SIGHUP to process.
  const serverInstance = fastify({ logger: getLogger() })
  await serverInstance.register(index)
  await serverInstance.register(artistRoutes, { prefix: '/artists' })
  await serverInstance.register(albumRoutes, { prefix: '/albums' })

  await serverInstance.register(sequelize, { storage: 'apollo.db', dialect: 'sqlite', logging: false })

  serverInstance.register(mApi)
  serverInstance.register(artistService)
  serverInstance.register(musicScanner)
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

function getLogger() {
  let logger = {}
  switch (process.env.NODE_ENV) {
  case 'development':
    logger = {
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: { destination: 1 }
      },
      serializers: {
        req(req: FastifyRequest) {
          return {
            method: req.method,
            url: req.url
          }
        }
      }
    }
    break
  case 'test':
    logger = {
      level: 'silent'
    }
    break
  case 'production':
    logger = {
      serializers: {
        req(req: FastifyRequest) {
          return {
            userAgent: req.headers['user-agent'],
            method: req.method,
            url: req.url,
            hostname: req.hostname,
            remoteAddress: req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']
          }
        }
      },
      level: 'info'
    }
    break
  }
  // Special case since in some jest tests we need to set the ENV to prod
  if (process.env.TEST_ENV) {
    logger = {
      level: 'silent'
    }
  }
  return logger
}
