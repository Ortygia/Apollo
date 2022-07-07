const Walk = require('@root/walk')
const mm = require('music-metadata')
const EventEmitter = require('node:events')
const p = require('path')
const fsp = require('fs/promises')
const fs = require('fs')
const Database = require('better-sqlite3')

class BetterScanner extends EventEmitter {
  constructor(dbName, log, walmode) {
    super()
    this.scanning = false
    this.dbName = dbName
    this.db = null
    this.walmode = walmode | false
    this.log = log
    this.song = null
    this.albumsToUpdate = []
  }

  async initialize () {
    const db = new Database(this.dbName)

    if (this.walmode) db.pragma('journal_mode = WAL')

    this.db = db

    const createAlbumTable = "CREATE TABLE IF NOT EXISTS users('name' varchar, 'surname' varchar, 'date_of_birth' DATE DEFAULT, 'email' varchar, 'username' varchar PRIMARY KEY, 'password' varchar );"
    const createDirectoryTable = "CREATE TABLE IF NOT EXISTS users('name' varchar, 'surname' varchar, 'date_of_birth' DATE DEFAULT, 'email' varchar, 'username' varchar PRIMARY KEY, 'password' varchar );"

    this.db.logging = false
    this.log.debug('Started scanner')
  }

  updateScanStatus(status) {
    this.emit('scanStatus', status)
  }

  async startFullScan() {
    this.updateScanStatus(true)
    await Walk.walk('/Users/ryleegeorge/projects/music/', walkFunc.bind(this))
    async function walkFunc(err, pathname, dirent) {
      if (err) {
        console.warn('fs stat error for %s: %s', pathname, err.message)
        return null
      }
      if (dirent.isDirectory()) {
        if (pathname === '/mnt/g/aa') return true
        const stats = fs.statSync(pathname)
        await this.db.models.directory.create({
          path: pathname,
          mtime: stats.mtimeMs
        })

        const stmt = this.db.prepare('insert or replace into sessions values (?,?,?,?,?)')
        stmt.run(this._dcId, this._serverAddress,
          this._port, this._authKey ? this._authKey.key : Buffer.alloc(0), this._takeoutId)
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
  }

  async processFile(pathname) {
    try {
      const metadata = await mm.parseFile(pathname)
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

  async updateAlbums() {
    const albums = await this.db.models.song.findAll({
      attributes: ['album', 'year', 'path', 'albumId'],
      group: ['album']
    })
    for (const album of albums) {
      const _dbAlbum = await this.updateOrCreate(this.db.models.album, { id: album.dataValues.albumId || 'unknown' },
        {
          path: p.resolve(album.dataValues.path, '..', '..'),
          name: album.dataValues.album,
          year: album.dataValues.year || 'Unknown'
        }
      )
      if (_dbAlbum.created) await this.db.query(`UPDATE songs SET albumId="${_dbAlbum.item.dataValues.id}" WHERE path LIKE "%${p.resolve(album.dataValues.path, '..')}%"`)
    }
  }
}

module.exports = BetterScanner
