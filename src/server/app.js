'use strict'

require('dotenv').config()
let logger
const pino = require('pino')
const fastify = require('fastify')

switch (process.env.NODE_ENV) {
case 'development':
  logger = pino({
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
    level: 'info'
  })
  break
}

function buildFastify(scannerProccess) {
  const sLog = logger.child({ module: 'Scanner' })
  scannerProccess.on('message', (msg) => {
    sLog.info('Message from child', msg)
  })
  // scannerProccess.send({ hello: 'world' })

  scannerProccess.on('close', (code, signal) => {
    sLog.info(
      `Scanner process terminated due to receipt of signal ${signal}`)
  })

  // Send SIGHUP to process.
  const serverInstance = fastify({
    logger: logger
  })
  serverInstance.register(require('./routes/index'))
  serverInstance.register(require('../plugins/mApi'))
  serverInstance.register(require('../plugins/artist/index'))

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
