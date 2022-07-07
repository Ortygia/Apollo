import ArtistService from '../../src/plugins/artist/service'
import ScannerManager from '../../src/plugins/musicScanner/scannerManager'
declare module 'fastify' {
  export interface FastifyInstance {
    scannerManager: ScannerManager
    artist: ArtistService
  }
}
