'use strict'

require('dotenv').config()
const fastify = require('fastify')

async function buildFastify() {
  // Send SIGHUP to process.
  const serverInstance = fastify({ logger: getLogger() })
  serverInstance.register(require('./routes/index'))
  serverInstance.register(
    require('../plugins/sequelize'),
    {
      sequelizeOptions: {
        dialect: 'sqlite',
        storage: 'apollo.db'
      }
    }
  )

  serverInstance.register(require('../plugins/mApi'))
  serverInstance.register(require('../plugins/artist/'))
  serverInstance.register(require('../plugins/musicScanner'))
  return serverInstance
}

async function start(server) {
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

async function listen(server) {
  console.log(server.scannerManager.isRunning)
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
  }
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
        req(req) {
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
        req(req) {
          return {
            userAgent: req.headers['user-agent'],
            method: req.method,
            url: req.url,
            hostname: req.hostname,
            remoteAddress: req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.raw.ip
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
module.exports = { buildFastify, start }
