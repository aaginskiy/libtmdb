var request = require('request')
const methods = require('./methods.json')

module.exports = class MovieDB {
  constructor (apiKey) {
    if (!apiKey) throw Error('Bad TheMovieDB API key.')

    this.apiKey = apiKey
    this.base = 'https://api.themoviedb.org/3'
    //   this.apiUrls = {
    //     movieInfo: this.base + `/movie/:id?api_key=${this.apiKey}`,
    //     searchMovie: this.base + `/search/movie?api_key=${this.apiKey}&query=:query`
    //   }

    this.buildAPI()
  }

  // Based on github:vankasteelj/trakt.tv
  buildAPI () {
    for (let url in methods) {
      const urlParts = url.split('/')
      const name = urlParts.pop() // key for function

      let tmp = this
      for (let p = 1; p < urlParts.length; ++p) { // acts like mkdir -p
        tmp = tmp[urlParts[p]] || (tmp[urlParts[p]] = {})
      }

      tmp[name] = (() => {
        const method = methods[url] // closure forces copy
        return (params) => {
          return this.callAPI(method, params)
        }
      })()
    }
  }

  callAPI (method, params) {
    return new Promise((resolve, reject) => {
      let config = {
        uri: encodeURI(this.parseURI(method, params)),
        headers: {
          'Accept': 'application/json'
        }
      }

      request.get(config, (err, res, body) => {
        var json = null

        if (!err && res.statusCode === 200 && !res.status_code) {
          json = JSON.parse(body)

          return resolve(json)
        }

        if (res.status_code && res.status_code !== 1) {
          reject(new Error(res.status_message))
        }

        reject(new Error(err))
      })
    })
  }

  parseURI (method, params) {
    let url = method.url

    method.required.forEach((key) => {
      url = url.replace(`:${key}`, params[key])
      delete params[key]
    })

    for (let key in params) {
      url += `&${key}=${params[key]}`
    }

    url += `&api_key=${this.apiKey}`

    url = `${this.base}${url}`

    return url
  }
}
