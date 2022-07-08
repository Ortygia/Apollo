
import { AxiosInstance } from 'axios'
import cheerio from 'cheerio'
import { IArtist } from 'musicbrainz-api'
import { BaseLogger } from 'pino'
import FanArtApi from '../../utils/fanart'
import * as util from 'util'
import { Stream } from 'stream'
import { createWriteStream, existsSync, mkdirSync, statSync } from 'fs'
const pipeline = util.promisify(Stream.pipeline)
class ArtistService {
  log: BaseLogger
  axios: AxiosInstance
  constructor(log: BaseLogger, api: AxiosInstance) {
    this.log = log
    this.axios = api
  }

  async getArtistInfo(artist: IArtist, artistId: string) {
    let bio = ''
    let image = ''
    let banner = ''
    try {
      const tempb = await this.getFanArtArtistBanner(artistId)
      banner = tempb.artistbackground[0].url
    } catch (e) {
      this.log.error(e)
      this.log.info('Failed to get banner')
    }
    if (artist.relations) {
      for (const rel of artist.relations) {
        if (rel.url?.resource.includes('https://www.allmusic.com/artist/')) {
          this.log.info(rel.url.resource)
          image = await this.getAllMusicArtistImage(rel.url.resource)
          bio = await this.getAllMusicArtistBio(rel.url.resource)
          break
        }
      }
    }
    return { image, bio, banner }
  }

  async getAllMusicArtistImage(artist: string) {
    // TODO save image locally
    const response = await this.axios.get(artist)
    const $ = cheerio.load(response.data)
    const profile = $('.media-gallery-image')
    const image = profile[0].attribs.src
    this.log.info(image)
    return image
  }

  async getAllMusicArtistBio(artist: string) {
    // TODO save bio to DB
    const response = await this.axios.get(artist + '/biography')
    const $ = cheerio.load(response.data)
    const profile = $('.text')
    // Strip image tags. Strip large whitespace. Trim starting whitesapce
    const bio = profile.text().replaceAll(/<img.*">/g, '').replaceAll(/\s{4,}/gm, '\n\n').trim()
    return bio
  }

  async getFanArtArtistBanner(artist: string): Promise<any> {
    // TODO save image locally
    if (existsSync(process.cwd() + `/images/${artist}/banner/banner.jpg`)) {
      return `/images/${artist}/banner/banner.jpg`
    }
    const fanart = new FanArtApi('32abf8f327b3216b23336ab97e1a2c0f')
    const fArtist = await fanart.music.artist(artist)
    this.downloadFile(fArtist.artistbackground[0].url, artist, 'banner')
    return fArtist.artistbackground[0].url
  }

  async downloadFile(url: string, artistId: string, type: string) {
    try {
      const request = await this.axios.get(url, {
        responseType: 'stream'
      })
      const location = process.cwd() + `/images/${artistId}/${type}/banner` + url.slice(-4)
      if (!existsSync(process.cwd() + `/images/${artistId}/${type}`)) {
        mkdirSync(process.cwd() + `/images/${artistId}/${type}`, { recursive: true })
      }
      await pipeline(request.data, createWriteStream(location))
      this.log.info(`Download of ${url} successful`)
    } catch (error) {
      this.log.error(`Download of ${url} failed`)
      this.log.error(error)
    }
  }
}

export default ArtistService
