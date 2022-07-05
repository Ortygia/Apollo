const Walk = require('@root/walk')
const mm = require('music-metadata')
const Sequelize = require('sequelize')
const EventEmitter = require('node:events')
const SequelizeSimpleCache = require('sequelize-simple-cache')
const p = require('path')
const fsp = require('fs/promises')
const fs = require('fs')
const directory = require('../../../models/directory')
const path = require('node:path')
class MusicScanner extends EventEmitter {
  constructor(mediaFolder, log) {
    super()
    this.scanning = false
    this.mediaFolder = mediaFolder
    this.db = null
    this.log = log
    this.song = null
    this.albumsToUpdate = []
  }

  async initialize () {
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: 'apollo.db',
      logging: false
    })

    const models = [require('../../../models/song'), require('../../../models/directory'), require('../../../models/album')]
    for (const model of models) {
      model(sequelize, Sequelize.DataTypes)
    }

    // this.song = cache.init())
    await sequelize.sync({ force: false, logging: process.env.NODE_ENV === 'production' ? false : console.log })

    this.db = sequelize
    this.db.logging = false
    this.log.info('Started scanner')
  }

  async stopScanning () {

  }

  updateScanStatus(status) {
    this.emit('scanStatus', status)
  }

  async startFullScan() {
    // if (this.scanning) return false
    console.time('fullScan')
    this.updateScanStatus(true)
    await Walk.walk('/mnt/h/Music', walkFunc.bind(this))
    // walkFunc must be async, or return a Promise
    async function walkFunc(err, pathname, dirent) {
      if (err) {
        console.warn('fs stat error for %s: %s', pathname, err.message)
        return null
      }
      if (dirent.isDirectory()) {
        if (pathname === '/mnt/h/Music') return true
        const stats = fs.statSync(pathname)
        this.updateOrCreate(this.db.models.directory, { path: pathname }, { path: pathname, mtime: stats.mtimeMs })
      }
      if (dirent.isFile()) {
        if (dirent.name.endsWith('.flac')) {
          await this.processFile(pathname)
        } else if (dirent.name.includes('cover.')) { // Detect cover files and insert them into the DB on scan
          this.processCover(pathname)
        }
      }
      return null
    }
    console.timeEnd('fullScan')
  }

  async startPartialScan() {
    console.time('partialScan')
    // if (this.scanning) return false
    this.updateScanStatus(true)
    const directories = await this.db.models.directory.findAll()
    const unchanged = []
    for (const directory of directories) {
      const path = directory.dataValues.path
      if (path === '/mnt/h/Music') continue
      this.log.debug(`Checking unchanged list for dir ${path}`)
      this.log.debug(`Scanning dir ${path}`)
      if (!fs.existsSync(path)) {
        this.log.debug(`Deleting dir ${path}`)
        await this.db.query(`DELETE FROM directories WHERE path like '%${path}%'`)
        await this.db.query(`DELETE FROM songs WHERE path like '%${path}%'`)
        await this.db.query(`DELETE FROM albums WHERE path like '%${p.resolve(path, '..', '..')}%'`)
        continue
      }
      const mtime = directory.dataValues.mtime
      const stats = fs.statSync(path)
      if (stats.mtimeMs > mtime) {
        await this.walkDirectory(path)
      } else {
        this.log.debug(`Directory ${path} has not changed`)
      }
      // }
    }
    // this.updateAlbums()
    // await this.createAlbums()
    console.timeEnd('partialScan')
  }

  async walkDirectory(path) {
    console.time('scan')
    await Walk.walk(path, walkFunc.bind(this))
    console.timeEnd('scan')
    // walkFunc must be async, or return a Promise
    async function walkFunc(err, pathname, dirent) {
      if (err) {
        console.warn('fs stat error for %s: %s', pathname, err.message)
        return null
      }
      if (dirent.isDirectory()) {
        const stats = fs.statSync(path)
        await this.updateOrCreate(this.db.models.directory, { path: pathname }, { path: pathname, mtime: stats.mtimeMs })
      }
      if (dirent.isFile()) {
        if (dirent.name.endsWith('.flac')) {
          const metadata = await mm.parseFile(pathname)
          await this.updateOrCreate(this.db.models.song, { path: pathname }, {
            path: pathname,
            title: metadata.common.title || 'Unknown',
            disk: metadata.common.disk.no,
            album: metadata.common.album || 'Unknown',
            artist: metadata.common.artist || 'Unknown',
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
          this.albumsToUpdate.push({
            path: pathname,
            title: metadata.common.title || 'Unknown',
            disk: metadata.common.disk.no,
            album: metadata.common.album || 'Unknown',
            artist: metadata.common.artist || 'Unknown',
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
          // this.processFile(pathname)
        } else if (dirent.name.includes('cover.')) { // Detect cover files and insert them into the DB on scan
          this.processCover(pathname)
        }
      }
      return null
    }
  }

  /* async startScanning() {
    // if (this.scanning) return false
    this.updateScanStatus(true)
    console.time('scan')
    await Walk.walk('/mnt/h/Music', walkFunc.bind(this))
    console.timeEnd('scan')
    // walkFunc must be async, or return a Promise
    async function walkFunc(err, pathname, dirent) {
      if (err) {
        console.warn('fs stat error for %s: %s', pathname, err.message)
        return null
      }
      if (dirent.isDirectory()) {
        if(pathname === '/mnt/h/Music') return true
        const directory = await this.db.models.directory.findOne({ where: { path: pathname } })
        const stats = fs.statSync(pathname)
        if (!directory) {
          //this.createDirectory(pathname, stats.mtimeMs)
        } else {
          console.log(pathname)
          console.log(`DBTIME:${directory.mtime} FTIME:${stats.mtimeMs}`)
          if (stats.mtimeMs > directory.mtime) {
            this.updateOrCreate(this.db.models.directory, {path: pathname},{path: pathname, mtime: stats.mtimeMs} )
            console.log('Directory changed')
          } else {
            console.log('Directory not changed')
            return false
          }
        }
        //await this.db.models.directory.create({name: pathname, mtime: fs.statSync(pathname).mtimeMs})
      }
      if (dirent.isFile()) {
        if (dirent.name.endsWith('.flac')) {
          this.processFile(pathname)
        } else if (dirent.name.includes('cover.')) { // Detect cover files and insert them into the DB on scan
          this.processCover(pathname)
        }
      }
      return null
    }
  } */
  /*   async processDirectory(pathname) {
    const directory = await this.db.models.directory.findOne({ where: { path: pathname } })
    const stats = fs.statSync(pathname)
    if (!directory) {
      this.createDirectory(pathname, stats.mtimeMs)
    } else {
      if (stats.mtimeMs > directory.mtime) {
        this.updateOrCreate(this.db.models.directory, {path: pathname},{path: pathname, mtime: stats.mtimeMs} )
        console.log('Directory changed')
      } else {
        console.log('Directory not changed')
        return false
      }
    }
  } */
  async processFile(pathname) {
    try {
      const metadata = await mm.parseFile(pathname)
      // this.processTrack(metadata, String(pathname))
      await this.db.models.song.create({
        path: pathname,
        title: metadata.common.title || 'Unknown',
        disk: metadata.common.disk.no,
        album: metadata.common.album || 'Unknown',
        artist: metadata.common.artist || 'Unknown',
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
      this.log.info(`Artist: ${metadata.common.albumartist}, Album: ${metadata.common.album}, Title: ${metadata.common.title}`)
    } catch (err) {
      this.log.error(err)
      return null
    }
  }

  async processCover(pathname) {
    const dirPath = p.dirname(pathname)
    const files = await fsp.readdir(dirPath)
    for (const file of files) {
      if (file.endsWith('.flac')) {
        try {
          const metadata = await mm.parseFile(p.resolve(dirPath, file))
          this.log.debug(`Cover is for ${metadata.common.album}`)
          break
        } catch (error) {
          this.log.error(error)
          break
        }
      }
    }
  }

  async processTrack(metadata, path) {
    await this.updateOrCreate(this.db.models.song, { path },
      {
        path,
        title: metadata.common.title || 'Unknown',
        disk: metadata.common.disk.no,
        album: metadata.common.album || 'Unknown',
        artist: metadata.common.artist || 'Unknown',
        track: metadata.common.track.no,
        codec: metadata.format.codec,
        sampleRate: metadata.format.sampleRate,
        bitsPerSample: metadata.format.bitsPerSample,
        year: metadata.common.year,
        label: metadata.common.label,
        musicBrainzRecordingId: metadata.common.musicbrainz_recordingid,
        musicBrainzArtistId: metadata.common.musicbrainz_artistid,
        musicBrainzTrackId: metadata.common.musicbrainz_trackid
      }
    )
  }

  async createAlbums() {
    const albums = await this.db.models.song.aggregate('album', 'DISTINCT', { plain: false })
    this.db.models.song.findAll({
      attributes: ['album'],
      group: ['album']
    }).then(async (albums) => {
      for (const album of albums) {
        const _album = await this.db.models.song.findOne({ where: { album: album.dataValues.album } })
        await this.db.models.album.create({
          path: p.resolve(_album.dataValues.path, '..', '..'),
          name: _album.dataValues.album,
          year: _album.dataValues.year || 'Unknown'
        })
      }
    }
    )
  }

  async updateAlbums() {
    for (const album of this.albumsToUpdate) {
      this.log.debug(`Updating album ${album.album}`)
      const ppath = p.resolve(album.path, '..', '..')
      await this.updateOrCreate(this.db.models.album, { path: ppath },
        {
          path: ppath,
          name: album.album,
          year: album.year
        }
      )
    }

    this.albumsToUpdate = []
  }

  async updateOrCreate (model, where, newItem) {
    // First try to find the record
    const foundItem = await model.findOne({ where })
    if (!foundItem) {
      // Item not found, create a new one
      const item = await model.create(newItem)
      return { item, created: true }
    }
    // Found an item, update it
    const item = await model.update(newItem, { where })
    return { item, created: false }
  }
}

module.exports = MusicScanner
