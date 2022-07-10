'use strict'
const LastFM = require('last-fm')
const lastfm = new LastFM('f240783eb61d397d198f1d1379353b98', { userAgent: 'Deaftone/0.0.1 (https://github.com/112RG/Deaftone)' })
const MusicBrainzApi = require('musicbrainz-api').MusicBrainzApi
const cheerio = require('cheerio')
const axios = require('axios').default
const mbApi = new MusicBrainzApi({
  appName: 'Deaftone',
  appVersion: '0.0.1',
  appContactInfo: 'ryleegeorge1@gmail.com'
})
async function run() {
/*   lastfm.artistInfo({ name: 'Billie Eilish' }, (err, data) => {
    if (err) {
      console.log(err)
      return
    }
    console.log(data)
  }) */

  const searchArtist = mbApi.searchArtist('Johnny Cash')

  const getArtist = mbApi.getArtist((await searchArtist).artists[0].id, ['url-rels'])
  for (const rel of (await getArtist).relations) {
    if (rel.url.resource.includes('https://www.allmusic.com/artist/')) {
      // console.log(await getGeniusArtistImage(rel.url.resource))
      console.log(await getAllMusicArtistImage(rel.url.resource))
      console.log(await getAllMusicArtistBio(rel.url.resource))
    }
  }
}

async function getGeniusArtistImage(artist) {
  const response = await axios.get(artist)
  const $ = cheerio.load(response.data)
  const profile = $('.user_avatar')
  return profile[0].attribs.style.slice(23, -3)
}

async function getTidalArtistImage(artist) {
  console.log(artist)
  const response = await axios.get(artist)
  const $ = cheerio.load(response.data)
  console.log(response.data)
  const profile = $('.css-bo0y9o')
  console.log(profile)
  return profile[0]
}

async function getAllMusicArtistImage(artist) {
  const response = await axios.get(artist)
  const $ = cheerio.load(response.data)
  const profile = $('.media-gallery-image')
  return profile[0].attribs.src
}

async function getAllMusicArtistBio(artist) {
  const response = await axios.get(artist + '/biography')
  const $ = cheerio.load(response.data)
  const profile = $('.text')

  // Strip image tags. Strip large whitespace. Trim starting whitesapce
  const bio = profile.text().replaceAll(/<img.*">/g, '').replaceAll(/\s{4,}/gm, '\n\n').trim()
  return bio
}
run().catch((error) => console.error(error))
