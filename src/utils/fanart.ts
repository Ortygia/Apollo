'use strict'
import axios from 'axios'
class FANART {
  engine: any
  config: any
  apiKey: string
  music: { artist: (id: string) => any; latest: (dt: string) => any; album: (id: string) => any; label: (id: string) => any }

  constructor(apiKey: string) {
    this.engine = axios
    this.apiKey = apiKey
    this.checkError(this.apiKey, 'API key')

    this.music = {
      artist: (id: string) => this.get('music/', { id }),
      latest: (dt: string) => this.get('music/latest', { id: false, date: dt }),
      album: (id: string) => this.get('music/albums/', { id }),
      label: (id: string) => this.get('music/labels/', { id })
    }
  }

  checkError(key:string, message:string) {
    if (!key) throw new Error('Missing ' + message)
  }

  get(path: string, opts: any, count = 1): any {
    this.checkError(opts.id, 'ID')

    count = isNaN(count) ? 1 : count

    const url = [
      'http://webservice.fanart.tv/v3/',
      path,
      opts.id ? opts.id : '',
      '?api_key=',
      this.apiKey,
      opts.date ? '&date=' + opts.date : ''
    ].join('')

    return this.engine({
      url,
      json: true,
      timeout: 1000
    }).then((response: { data: any }) =>
      response.data ? response.data : {}
    ).catch((error: any) => {
      if (count < 10) {
        count++
        return this.get(path, opts, count)
      } else {
        throw error
      }
    })
  }
}
export default FANART
