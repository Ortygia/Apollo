const walk = require('walkdir')
const mm = require('music-metadata')
const logger = require('pino')({ name: 'MusicScanner', prettyPrint: true })
const path = require('path')
const fsp = require('fs/promises')
class MusicScanner {
  constructor(options = { }) {
    this.options = Object.assign(options)
    this.scanning = false
    this.mediaFolder = options.mediaFolder
  }

  async initialize () {

  }

  async stopScanning () {

  }

  async startScanning() {
    if (this.scanning) return false
    this.scanning = true
    /*     const now = new Date()
    const isoString = now.toISOString()
    logger.info(isoString) */

    const emitter = walk(this.mediaFolder)
    emitter.on('file', async function(filename, stat) {
      if (filename.endsWith('.flac')) {
        const metadata = await mm.parseFile(filename)
        logger.debug(filename)
        logger.info(`Artist: ${metadata.common.albumartist}, Album: ${metadata.common.album}, Title: ${metadata.common.title}`)
      } else if (filename.includes('cover.')) { // Detect cover files and insert them into the DB on scan
        const dirPath = path.dirname(filename)
        const files = await fsp.readdir(dirPath)
        for (const file of files) {
          if (file.endsWith('.flac')) {
            const metadata = await mm.parseFile(path.resolve(dirPath, file))
            console.log(`cover is for ${metadata.common.album}`)
            break
          }
        }
      }
    })
    this.scanning = false
  }
}

module.exports = MusicScanner
