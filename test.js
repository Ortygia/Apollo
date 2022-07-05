const Walk = require('@root/walk')
const mm = require('music-metadata')
const taglib = require('./taglib3.node')
let db = null
const Sequelize = require('sequelize')

async function startScanning() {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'apollo.db'
  })

  const models = [require('./src/models/song')]
  for (const model of models) {
    model(sequelize, Sequelize.DataTypes)
  }
  db = sequelize
  await sequelize.sync({ force: false, logging: process.env.NODE_ENV === 'production' ? false : console.log })

  // if (this.scanning) return false
  console.time('scan')
  await Walk.walk('/mnt/h/music', walkFunc.bind(this))
  console.timeEnd('scan')
  // walkFunc must be async, or return a Promise
  async function walkFunc(err, pathname, dirent) {
    if (err) {
      console.warn('fs stat error for %s: %s', pathname, err.message)
      return null
    }
    if (dirent.isFile()) {
      if (dirent.name.endsWith('.flac')) {
        try {
          console.log(pathname)
          const metadata = await mm.parseFile(pathname)
          db.models.song.create({
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

          /*           console.time('taglib')
          const tags = taglib.readTagsSync(pathname)
          console.timeEnd('taglib') */
        } catch (err) {
          this.log.error(err)
          return null
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
async function  testFile(){ 
  const file= mm.parseFile("/mnt/h/Music/C/Chromeo/Chromeo ‎– She's In Control {2004} [Vice Records ‎– Vice 83673-2]/10 Ah oui comme ça.flac")
  console.log(await file)
}
testFile()
