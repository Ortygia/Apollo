/* eslint-disable @typescript-eslint/no-var-requires */
import song, { Song } from '../../../models/song'
import directory, { Directory } from '../../../models/directory'
import album, { Album } from '../../../models/album'
import artist, { Artist } from '../../../models/artist'

const Walk = require('@root/walk')
const mm = require('music-metadata')
const Sequelize = require('sequelize')
const EventEmitter = require('node:events')
const p = require('path')
const fsp = require('fs/promises')
const fs = require('fs')
let songsToSave = []
let songsFailedToSave = []
const configDir = process.cwd() + '/data'

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
      storage: `${configDir}/deaftone.sqlite`,
      logging: false
    })

    const models = [song, directory, album, artist]
    for (const model of models) {
      model(sequelize)
    }

    await sequelize.sync({ force: false, logging: process.env.NODE_ENV === 'production' ? false : false })
    this.db = sequelize
    this.db.logging = false

    // Setup associtations
    Album.hasMany(Song, { foreignKey: 'albumId', as: 'songs' })
    Song.belongsTo(Album, { foreignKey: 'albumId', as: 'album' })
    Artist.hasMany(Album, { foreignKey: 'artistId', as: 'albums' })
    this.log.info('Scanner started')
  }

  updateScanStatus(status) {
    this.emit('scanStatus', status)
  }

  // Called once on initial run
  async startFullScan() {
    console.time('fullScan')
    this.updateScanStatus(true)

    // Start walking musicDir
    await Walk.walk('/mnt/h/Music', walkFunc.bind(this))
    async function walkFunc(err, pathname, dirent) {
      if (err) {
        console.warn('fs stat error for %s: %s', pathname, err.message)
        return null
      }
      if (dirent.isDirectory()) {
        // Get stats then add to DB
        const stats = fs.statSync(pathname)
        await Directory.create({
          path: pathname,
          mtime: stats.mtimeMs
        })
      }
      // Check if file and check if flac (currently only supported) if so process it if not check if cover then process it
      if (dirent.isFile()) {
        if (dirent.name.endsWith('.flac')) {
          await this.processFile(pathname)
        } else if (dirent.name.includes('cover.')) { // Detect cover files and insert them into the DB on scan
          this.processCover(pathname)
        }
      }
      return null
    }
    console.time('updateAlbums')
    await this.updateAlbums()
    console.timeEnd('updateAlbums')
    console.time('updateArtists')
    await this.updateArtists()
    console.timeEnd('updateArtists')
    console.timeEnd('fullScan')
    console.log(songsFailedToSave)
  }

  // Called to update a already scanned library
  async startPartialScan() {
    console.time('partialScan')
    if (this.scanning) return false
    this.updateScanStatus(true)

    // Load all directories from DB
    const directories = await Directory.findAll()
    for (const directory of directories) {
      const path = directory.dataValues.path

      // Delete if it doesn't exists from albums and songs with path like
      if (!fs.existsSync(path)) {
        this.db.query(`DELETE FROM directories WHERE path like '%${path}%'`)
        this.db.query(`DELETE FROM songs WHERE path like '%${path}%'`)
        this.db.query(`DELETE FROM albums WHERE path like '%${p.resolve(path, '..', '..')}%'`)
        continue
      }

      // Check if directory has changed if so walk it
      const mtime = directory.dataValues.mtime
      const stats = fs.statSync(path)
      if (stats.mtimeMs > mtime) {
        this.log.debug(`Directory ${path} has changed walking.. `)
        await this.walkDirectory(path)
      }
    }

    await this.updateAlbums()
    await this.updateArtists()
    await this.cleanUpOrphans()
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
        await Directory.findOrCreate({ where: { path: pathname }, defaults: { path: pathname, mtime: stats.mtimeMs } })
      }
      if (dirent.isFile()) {
        if (dirent.name.endsWith('.flac')) {
          const metadata = await mm.parseFile(pathname)
          // Update or create song
          // TODO insert ore values
          await Song.upsert({
            path: pathname,
            title: metadata.common.title || 'Unknown',
            disk: metadata.common.disk.no,
            albumName: metadata.common.album || 'Unknown',
            artist: metadata.common.albumartist || metadata.common.artist || 'Unknown',
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
      songsToSave.push({
        path: pathname,
        title: metadata.common.title || 'Unknown',
        disk: metadata.common.disk.no,
        albumName: metadata.common.album || 'Unknown',
        artist: metadata.common.albumartist || metadata.common.artist || 'Unknown',
        track: metadata.common.track.no,
        codec: metadata.format.codec,
        sampleRate: metadata.format.sampleRate,
        bitsPerSample: metadata.format.bitsPerSample,
        year: metadata.common.year

      })

      // Batch save songs to DB speeds up scanning alot
      if (songsToSave.length > 50) {
        Song.bulkCreate(songsToSave).then(() => console.log('Users data have been saved'))
        songsToSave = []
      }
      this.log.debug(`Artist: ${metadata.common.albumartist}, Album: ${metadata.common.album}, Title: ${metadata.common.title}`)
    } catch (err) {
      songsFailedToSave = songsToSave + songsFailedToSave
      this.log.error(err)
      return null
    }
  }

  /** Update with DB logic */
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
  /**
   * Get all Songs from db group by albumName and artist.
   * Then loop through them checking if there is a associtated albums. If so update all songs for that album with albumId
   * If not we create the album and update all songs with the newly created ID
   */

  async updateAlbums() {
    const songs = await Song.findAll({
      attributes: ['albumName', 'year', 'path', 'albumId', 'artist', 'id'],
      group: ['albumName', 'artist']
    })
    for (const song of songs) {
      const _dbAlbum = await Album.findOne({
        where: {
          name: song.albumName,
          artistName: song.artist,
          year: song.year || 'Unknown'
        }
      })
      if (_dbAlbum) {
        await this.db.query(`UPDATE songs SET albumId="${_dbAlbum.id}" WHERE albumName="${song.albumName.replaceAll('"', '')}" AND artist="${song.artist}"`)
      } else {
        const _newAlbum = await Album.create({
          path: p.resolve(song.path, '..', '..'),
          artistName: song.artist,
          name: song.albumName,
          year: song.year || 'Unknown'
        })
        this.log.debug(`Adding album ${_newAlbum.name} with id ${_newAlbum.id}`)

        await _newAlbum.save()
        await this.db.query(`UPDATE songs SET albumId="${_newAlbum.id}" WHERE albumName="${song.albumName.replaceAll('"', '')}" AND artist="${song.artist}"`)
      }
    }
  }

  /**
   * Get all Artists from db group by albumName.
   * Then loop through them checking if there is a associtated albums. If so update all albums for that artists with artistId
   * If not we create the artist and update all albums with the newly created ID
   */
  async updateArtists() {
    const albums = await Song.findAll({
      attributes: ['albumName', 'year', 'path', 'albumId', 'artist', 'id'],
      group: ['albumName']
    })
    for (const album of albums) {
      const artist = await Artist.findOne({ where: { name: album.artist } })
      if (artist) {
        await this.db.query(`UPDATE albums SET artistId="${artist.id}" WHERE name="${album.albumName.replaceAll('"', '')}" AND artistName="${album.artist}"`)
      } else {
        const newArtist = await Artist.create({
          name: album.artist
        })
        await newArtist.save()
        this.log.debug(`Adding artist ${newArtist.name} with id ${newArtist.id}`)

        await this.db.query(`UPDATE albums SET artistId="${newArtist.id}" WHERE name="${album.albumName.replaceAll('"', '')}" AND artistName="${album.artist}"`)
      }
    }
  }

  // Black magic cleanup orphans function
  async cleanUpOrphans() {
    const a = await Album.findAll({
      include: [{
        model: Song,
        as: 'songs',
        required: false
      }],
      where: {
        '$songs.id$': null
      },
      subQuery: false
    })
    a.every((e) => {
      console.log(e.title)
      return e.destroy()
    })
    const art = await Artist.findAll({
      include: [{
        model: Album,
        as: 'albums',
        required: false
      }],
      where: {
        '$albums.id$': null
      },
      subQuery: false
    })
    art.every((e) => {
      console.log(e.name)
      return e.destroy()
    })
  }
}

module.exports = MusicScanner
