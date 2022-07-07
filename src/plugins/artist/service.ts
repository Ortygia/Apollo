
import { AxiosInstance } from 'axios'
import cheerio from 'cheerio'
import { IArtist } from 'musicbrainz-api'
import { BaseLogger } from 'pino'
import FANART from '../../utils/fanart'
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
    const response = await this.axios.get(artist)
    const $ = cheerio.load(response.data)
    const profile = $('.media-gallery-image')
    const image = profile[0].attribs.src
    this.log.info(image)
    return image
  }

  async getAllMusicArtistBio(artist: string) {
    const response = await this.axios.get(artist + '/biography')
    const $ = cheerio.load(response.data)
    const profile = $('.text')
    // Strip image tags. Strip large whitespace. Trim starting whitesapce
    const bio = profile.text().replaceAll(/<img.*">/g, '').replaceAll(/\s{4,}/gm, '\n\n').trim()
    return bio
  }

  async getFanArtArtistBanner(artist: string) {
    const fanart = new FANART('32abf8f327b3216b23336ab97e1a2c0f')
    return await fanart.music.artist(artist)
  }
}

export default ArtistService
