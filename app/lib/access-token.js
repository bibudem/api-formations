import axios from 'axios'
import Cache from 'ttl'
import { Boom } from '@hapi/boom'
import { camelCase } from 'camel-case'
import config from 'config'

import console from './console.js'

export class AccessToken {
  constructor({
    grantType = 'client_credentials',
    clientId,
    clientSecret,
    host,
    path,
    httpClientTimeout = 0 // axios default is `0` (no timeout)
  } = {}) {
    this.grantType = grantType;
    this.host = host;
    this.path = path;
    this.clientId = clientId;
    this.clientSecret = clientSecret;

    // Token data
    this.expiresAt = null;

    this.httpClientTimeout = httpClientTimeout;
    this.cache = new Cache({
      capacity: 1
    })
  }

  async requestToken({ grantType = this.grantType } = {}) {

    if (this.cache.get('token')) {
      return this.cache.get('token')
    }

    // Token is expired. Need to get a new one

    const responsePromise = new Promise((resolve, reject) => {
      const url = this.host + this.path

      axios.post(url, {
        grant_type: grantType,
        client_id: this.clientId,
        client_secret: this.clientSecret
      }, {
        // params: {
        //   grant_type: grantType,
        //   client_id: this.clientId,
        //   client_secret: this.clientSecret
        // },
        timeout: this.httpClientTimeout,
        proxy: false
      })
        .then(response => {

          const data = {}
          Object.keys(response.data).forEach(key => data[camelCase(key)] = response.data[key])

          if (response.status === 200) {
            // Success

            if (config.get('useCache') && typeof this.cache.get('token') === 'undefined') {
              this.cache.put('token', new Promise((resolve) => { resolve(data) }), ((data.expiresIn - 60) * 1000) || 10 * 60 * 1000);
            }

            return resolve(data);
          }

          console.debug('Failed: Got a status code of ' + response.status)

          throw data
        })
        .catch(axiosError => {
          console.log(axiosError.request.protocol)
          console.log(axiosError.request.host)
          console.log(axiosError.request.path)
          let error
          if (axiosError.response) {
            error = new Boom(axiosError.response.data.error_description, {
              statusCode: 500,
              data: axiosError.response.data
            })
          } else if (error.request) {
            error = new Boom(axiosError, {
              statusCode: 500
            })
            console.error(error.request)
          } else {
            error = new Boom(axiosError, {
              statusCode: 500
            })
            console.error(error.message)
          }

          return reject(error)

        })
    })

    return responsePromise;
  }

  /**
    * Determines if the current access token has already expired or if it is about to expire
    *
    * @param {Number} expirationWindowSeconds Window of time before the actual expiration to refresh the token
    * @returns {Boolean}
    */

  isExpired(expirationWindowSeconds = 0) {
    if (this.expiresAt) {
      expirationWindowSeconds = expirationWindowSeconds * 1000;
      console.log(new Date(this.expiresAt) - Date.now())
      return new Date(this.expiresAt) - Date.now() <= expirationWindowSeconds;
    }
    return true;
  }
}