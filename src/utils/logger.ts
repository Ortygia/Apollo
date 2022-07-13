import { FastifyRequest } from 'fastify'

export default function getLogger(name?: string) {
  let logger = {}
  switch (process.env.NODE_ENV) {
  case 'development':
    logger = {
      level: 'debug',
      name,
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
      name,
      level: 'info',
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
      }
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
