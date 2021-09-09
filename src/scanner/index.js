'use strict'
const pino = require('pino')
const logger = pino({
  prettyPrint: { colorize: true },
  level: 'debug'
})
async function run() {
  process.on('message', (msg) => {
    logger.info('Message from parent:', msg)
  })
  const counter = 0
/*   setInterval(() => {
    process.send({ counter: counter++ })
  }, 1000) */
}
run().catch((error) => console.error(error))
