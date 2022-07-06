import fp from 'fastify-plugin'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import ScannerManager from './scannerManager'
'use strict'
const scannerPlugin: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  // const musicScanner = new MusicScanner('./test_music', fastify)
  const log = fastify.log.child({ module: 'Scanner' })
  log.debug('Attaching Muisc Scanner')

  const manager = new ScannerManager(log)
  manager.startChild()
  fastify.decorate('scannerManager', manager)
  log.info('Attached Muisc Scanner')
}

export default fp(scannerPlugin)
