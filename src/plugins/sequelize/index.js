'use strict'

const fastifyPlugin = require('fastify-plugin')
const Sequelize = require('sequelize')
const defaults = {
  instance: 'sequelize',
  sequelizeOptions: {}
}

async function sequelizePlugin (fastify, opts, done) {
  const log = fastify.log.child({ module: 'Database' })

  const options = Object.assign({}, defaults, opts)
  const sequelize = new Sequelize(options.sequelizeOptions)
  const models = [require('../../models/song')]
  for (const model of models) {
    model(sequelize, Sequelize.DataTypes)
  }
  await sequelize.sync({ force: false })
  try {
    // first connection
    await sequelize.authenticate()
    log.info('Database connection is successfully established.')
    done()
  } catch (err) {
    log.info(`Connection could not established: ${err}`)
    throw (err)
  }
  fastify.decorate('db', sequelize)

  // close sequelize database connection before shutdown
  // 'onClose' is triggered when fastify.close() is invoked to stop the server
  fastify.addHook(
    'onClose',
    (instance, done) => sequelize.close().then(() => done())
  )
}

module.exports = fastifyPlugin(sequelizePlugin)
