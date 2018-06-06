/* global describe it afterEach */
const chai = require('chai')
const sinon = require('sinon')
const request = require('request')

chai.use(require('chai-like'))
chai.use(require('chai-things'))
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))

const { expect } = chai

var apiKey = process.env.TMDB_API_KEY

if (!apiKey || apiKey.length === 0) {
  throw new Error('Missing API key, please run `TMDB_API_KEY="{api key}" yarn test`')
}
var Generator = require('../index.js')
var MovieDB = new Generator(apiKey)

describe('\'MovieDB\' API', () => {
  it('should throw an error when key is missing', () => void
    expect(() => new Generator(null)).to.throw('Bad TheMovieDB API key.'))

  describe('#movie', function () {
    it('can get info on a movie', () =>
      expect(MovieDB.movie({ id: 550 }))
        .to.eventually.have.property('title', 'Fight Club'))
  })

  describe('#search', () => {
    it('can search for movie', () =>
      expect(MovieDB.search.movie({ query: 'Jack Reacher', year: 2016 }))
        .to.eventually.have.property('results')
        .that.is.an('Array')
        .that.contains.something.like({title: 'Jack Reacher: Never Go Back'}))
  })

  describe('errors', () => {
    afterEach((done) => {
      request.get.restore()
      done()
    })

    it('should reject if JSON body is not valid', () => {
      sinon.stub(request, 'get').yields(null, {statusCode: 200}, 'not JSON')
      return expect(MovieDB.movie({ id: 550 }))
        .to.be.rejected
    })

    it('should reject with res of the return if status_code is an error', () => {
      sinon.stub(request, 'get').yields(null, {status_code: 2, status_message: 'Invalid service: this service does not exist.'}, JSON.stringify({}))
      return expect(MovieDB.movie({ id: 550 }))
        .to.be.rejectedWith('Invalid service: this service does not exist.')
    })

    it('should reject with error for all other errors', () => {
      sinon.stub(request, 'get').yields(new Error('Some error'), {status_code: 1}, JSON.stringify({}))
      return expect(MovieDB.movie({ id: 550 }))
        .to.be.rejectedWith('Error: Some error')
    })
  })
})
