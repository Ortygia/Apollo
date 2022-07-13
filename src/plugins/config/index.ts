'use strict'
import fp from 'fastify-plugin'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { readFileSync } from 'fs'
const configApi: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  readFileSync(process.cwd() + '/config.json')
}

export default fp(configApi)
