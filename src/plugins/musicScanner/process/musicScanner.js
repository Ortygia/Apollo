/* eslint-disable @typescript-eslint/no-var-requires */
const Walk = require('@root/walk')
const mm = require('music-metadata')
const Sequelize = require('sequelize')
const EventEmitter = require('node:events')
const p = require('path')
const fsp = require('fs/promises')
const fs = require('fs')
const { default: song, Song } = require('../../../models/song')
const { default: directory, Directory } = require('../../../models/directory')
const { default: album, Album } = require('../../../models/album')
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

    const models = [song, directory, album]
    for (const model of models) {
      model(sequelize)
    }
    await sequelize.sync({ force: false, logging: process.env.NODE_ENV === 'production' ? false : false })

    this.db = sequelize
    this.db.logging = false
    this.log.info('Scanner started')
  }

  updateScanStatus(status) {
    this.emit('scanStatus', status)
  }

  async startFullScan() {
    // if (this.scanning) return false
    console.time('fullScan')
    this.updateScanStatus(true)
    await Walk.walk('/mnt/g/aa', walkFunc.bind(this))
    // walkFunc must be async, or return a Promise
    async function walkFunc(err, pathname, dirent) {
      if (err) {
        console.warn('fs stat error for %s: %s', pathname, err.message)
        return null
      }
      if (dirent.isDirectory()) {
        if (pathname === '/mnt/g/aa') return true
        const stats = fs.statSync(pathname)

        await Directory.create({
          path: pathname,
          mtime: stats.mtimeMs
        })
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
    await this.updateAlbums()
    console.timeEnd('fullScan')
  }

  async startPartialScan() {
    console.time('partialScan')
    if (this.scanning) return false
    this.updateScanStatus(true)
    const directories = await Directory.findAll()
    for (const directory of directories) {
      const path = directory.dataValues.path
      if (path === '/mnt/g/aa') continue
      if (!fs.existsSync(path)) {
        this.db.query(`DELETE FROM directories WHERE path like '%${path}%'`)
        this.db.query(`DELETE FROM songs WHERE path like '%${path}%'`)
        this.db.query(`DELETE FROM albums WHERE path like '%${p.resolve(path, '..', '..')}%'`)
        continue
      }
      const mtime = directory.dataValues.mtime
      const stats = fs.statSync(path)
      if (stats.mtimeMs > mtime) {
        await this.walkDirectory(path)
      } else {
        this.log.debug(`Directory ${path} has not changed`)
      }
    }
    // this.updateAlbums()
    await this.updateAlbums()
    await this.cleanUpOrphanAlbums()
    this.updateScanStatus(false)
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
          // this.processFile(pathname)
        } else if (dirent.name.includes('cover.')) { // Detect cover files and insert them into the DB on scan
          this.processCover(pathname)
        }
      }
      return null
    }
  }

  async processFile(pathname) {
    try {
      const metadata = await mm.parseFile(pathname)
      const song = await Song.create({
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
      song.save()
      this.log.debug(`Artist: ${metadata.common.albumartist}, Album: ${metadata.common.album}, Title: ${metadata.common.title}`)
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

  async updateAlbums() {
    const albums = await Song.findAll({
      attributes: ['album', 'year', 'path', 'albumId'],
      group: ['album']
    })
    for (const album of albums) {
      const _dbAlbum = await Album.findOne({
        where: {
          name: album.album,
          year: album.year || 'Unknown'
        }
      })
      if (_dbAlbum) {
        await this.db.query(`UPDATE songs SET albumId="${_dbAlbum.id}" WHERE path LIKE "%${p.resolve(_dbAlbum.path, '..')}%"`)
      } else {
        const _newAlbum = await Album.create({
          path: p.resolve(album.path, '..', '..'),
          name: album.album,
          year: album.year || 'Unknown'
        })
        this.db.query(`UPDATE songs SET albumId="${_newAlbum.id}" WHERE path LIKE "%${p.resolve(_newAlbum.path, '..')}%"`)
      }
    }
  }

  async cleanUpOrphanAlbums() {
    await this.db.models.album.findAll().then((items) => {
      return items.map((item) => {
        return item.dataValues.name
      })
    })
    await this.db.models.song.findAll({
      attributes: ['album', 'year', 'path'],
      group: ['album']
    }).then((items) => {
      return items.map((item) => {
        return item.dataValues.album
      })
    })
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
