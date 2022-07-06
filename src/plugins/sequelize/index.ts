'use strict'

import { Sequelize, DataTypes } from 'sequelize'
import fp from 'fastify-plugin'
import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from 'fastify'

export interface SequelizePluginOptions {
  dialect: string
  storage: string
}
const ConnectDB: FastifyPluginAsync<SequelizePluginOptions> = async (
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) => {
  const log = fastify.log.child({ module: 'Database' })
  const sequelize = new Sequelize(options)
  const models = [require('../../models/song')]
  for (const model of models) {
    model(sequelize, DataTypes)
  }
  await sequelize.sync({ force: false, logging: false })
  try {
    // first connection
    await sequelize.authenticate()
    log.info('Database connection is successfully established.')
  } catch (err) {
    log.info(`Connection could not established: ${err}`)
    throw (err)
  }
  fastify.decorate('db', sequelize)

  // close sequelize database connection before shutdown
  // 'onClose' is triggered when fastify.close() is invoked to stop the server
}

export default fp(ConnectDB)
