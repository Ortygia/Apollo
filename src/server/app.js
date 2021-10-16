'use strict'

require('dotenv').config()
let logger
const pino = require('pino')
const fastify = require('fastify')

switch (process.env.NODE_ENV) {
case 'development':
  logger = pino({
    name: 'Fastify',
    prettyPrint: { colorize: true },
    level: 'debug'
  })
  break
case 'test':
  logger = pino({
    level: 'silent'
  })
  break
case 'production':
  logger = pino({
    name: 'Fastify',
    level: 'info'
  })
  break
}

async function buildFastify() {
  // Send SIGHUP to process.
  const serverInstance = fastify({
    logger: logger
  })
  serverInstance.register(require('./routes/index'))
  serverInstance.register(
    require('../plugins/sequelize'),
    {
      sequelizeOptions: {
        dialect: 'sqlite',
        storage: 'apollo.sqlite'
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
  server.listen(3001, '0.0.0.0', (err, address) => {
    if (err) {
      server.log.error(err)
      process.exit(1)
    }
  })
}
module.exports = { buildFastify, start }
