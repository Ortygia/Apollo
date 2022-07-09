'use strict'

import { Sequelize } from 'sequelize'
import fp from 'fastify-plugin'
import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from 'fastify'
import song, { Song } from '../../models/song'
import directory from '../../models/directory'
import album, { Album } from '../../models/album'

export interface SequelizePluginOptions {
  dialect: string
  storage: string,
  logging: boolean,
}
const ConnectDB: FastifyPluginAsync<SequelizePluginOptions> = async (
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) => {
  const log = fastify.log.child({ module: 'Database' })
  const sequelize = new Sequelize(options)
  const models = [song, directory, album]
  for (const model of models) {
    log.debug(`Loading model: ${model}`)
    model(sequelize)
  }

  Album.hasMany(Song, { foreignKey: 'albumId', as: 'songs' })
  Song.belongsTo(Album, { foreignKey: 'albumId', as: 'album' })
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
