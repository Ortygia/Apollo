const Walk = require('@root/walk')
const mm = require('music-metadata')
const Sequelize = require('sequelize')
const EventEmitter = require('node:events')

const path = require('path')
const fsp = require('fs/promises')
const { throws } = require('node:assert')
class MusicScanner extends EventEmitter {
  constructor(mediaFolder, log) {
    super()
    this.scanning = false
    this.mediaFolder = mediaFolder
    this.db = null
    this.log = log
  }

  async initialize () {
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: 'apollo.db'
    })
    const models = [require('../../../models/song')]
    for (const model of models) {
      model(sequelize, Sequelize.DataTypes)
    }
    await sequelize.sync({ force: false, logging: false })

    this.db = sequelize
    this.log.info('Started scanner')
  }

  async stopScanning () {

  }

  updateScanStatus(status) {
    this.emit('scanStatus', status)
  }

  async startScanning() {
    // if (this.scanning) return false
    this.updateScanStatus(true)
    /*   await Walk.walk('I:\\Music', walkFunc.bind(this))
    // walkFunc must be async, or return a Promise
    async function walkFunc(err, pathname, dirent) {
      if (err) {
        // throw an error to stop walking
        // (or return to ignore and keep going)
        console.log(' Got eeror')
        console.warn('fs stat error for %s: %s', pathname, err.message)
        return null
      }
      if (dirent.isFile()) {
        if (dirent.name.endsWith('.flac')) {
          try {
            const metadata = await mm.parseFile(pathname)
            if (!await this.db.models.song.findOne({ where: { title: metadata.common.title, album: metadata.common.album } })) {
              await this.db.models.song.create({
                title: metadata.common.title,
                disk: metadata.common.disk.no,
                album: metadata.common.album,
                artist: metadata.common.artist,
                track: metadata.common.track.no,
                codec: metadata.format.codec,
                sampleRate: metadata.format.sampleRate,
                bitsPerSample: metadata.format.bitsPerSample,
                year: metadata.common.year,
                label: metadata.common.label,
                musicBrainzRecordingId: metadata.common.musicbrainz_recordingid,
                musicBrainzArtistId: metadata.common.musicbrainz_artistid,
                musicBrainzTrackId: metadata.common.musicbrainz_trackid
              })
              logger.info(`Artist: ${metadata.common.albumartist}, Album: ${metadata.common.album}, Title: ${metadata.common.title}`)
            } else {
              console.log('Already in db')
            }
          } catch (err) {
            logger.error(err)
            return null
          }
        } else if (dirent.name.includes('cover.')) { // Detect cover files and insert them into the DB on scan
          const dirPath = path.dirname(pathname)
          const files = await fsp.readdir(dirPath)
          for (const file of files) {
            if (file.endsWith('.flac')) {
              console.log(path.resolve(dirPath, file))
              try {
                const metadata = await mm.parseFile(path.resolve(dirPath, file))
                console.log(`cover is for ${metadata.common.album}`)
                break
              } catch (error) {
                console.log(error)
                break
              }
            }
          }
        }
      }
      return null
    }
    /*     const now = new Date()
    const isoString = now.toISOString()
    logger.info(isoString) */
    /*  const emitter = walk.walk('I:\\Music')
    emitter.on('errors', function (root, nodeStatsArray, next) {
      console.log(root)
      console.log(nodeStatsArray)
    })
    emitter.on('end', function () {
      console.log('all done')
    })
    emitter.on('directories', function (root, dirStatsArray, next) {
      // dirStatsArray is an array of `stat` objects with the additional attributes
      // * type
      // * error
      // * name
      console.log(dirStatsArray)
      console.log(root)
      next()
    })
    emitter.on('file', async (filename, stat, next) => {
      if (filename.endsWith('.flac')) {
        const metadata = await mm.parseFile(filename)
        logger.debug(filename)
        if (!await this.db.models.song.findOne({ where: { title: metadata.common.title, album: metadata.common.album } })) {
          await this.db.models.song.create({
            title: metadata.common.title,
            disk: metadata.common.disk.no,
            album: metadata.common.album,
            artist: metadata.common.artist,
            track: metadata.common.track.no,
            codec: metadata.format.codec,
            sampleRate: metadata.format.sampleRate,
            bitsPerSample: metadata.format.bitsPerSample,
            year: metadata.common.year,
            label: metadata.common.label,
            musicBrainzRecordingId: metadata.common.musicbrainz_recordingid,
            musicBrainzArtistId: metadata.common.musicbrainz_artistid,
            musicBrainzTrackId: metadata.common.musicbrainz_trackid
          })
          next()
          logger.info(`Artist: ${metadata.common.albumartist}, Album: ${metadata.common.album}, Title: ${metadata.common.title}`)
        } else {
          console.log('Already in db')
        }
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
    this.scanning = false */
  }
}

module.exports = MusicScanner
