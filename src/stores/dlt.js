import { defineStore } from 'pinia'
import {
  generateBundleHash,
  generateSecret,
  KnishIOClient,
  Wallet
} from '@wishknish/knishio-client-js/src'
import WalletBundle from 'src/models/WalletBundle'
import AuthToken from '@wishknish/knishio-client-js/src/AuthToken'
import BaseException from '@wishknish/knishio-client-js/src/exception/BaseException'
import { KNISHIO_SETTINGS } from 'src/libraries/constants/knishio'
import {
  connectionDB,
  deleteDataPromise,
  getDataPromise,
  setDataPromise
} from 'src/libraries/storageDB'

import axios from 'boot/axios'
import { randomString } from 'src/libraries/strings'

// Declaring indexedDB database
const db = connectionDB()

const stateObj = {
  serverUris: [],
  client: null,
  profile: {
    publicName: null,
    avatar: null,
    cover: null
  },
  secret: null,
  bundle: null,
  wallets: {},
  createdAt: null,
  username: null,
  authToken: null,
  authTimeout: null,
  metas: null,
  isLoggedIn: false,
  isInitialized: false,
  hasError: false,
  userRoles: false,
  parentApp: null,
  favoriteCards: {},
  auth2fa: null
}

// Declaring actions object
const actionsObj = {
  connect: async function (endpointUris) {
    const validServers = await this.testEndpointUris(endpointUris)

    if (Object.values(validServers).length > 0) {
      this.serverUris = Object.values(validServers)
      console.info(`Creating Knish.IO client connected to ${Object.values(validServers).length} node(s)...`)
      this.client = new KnishIOClient({
        uri: this.serverUris,
        socketUri: KNISHIO_SETTINGS.subscriptionSocketUri,
        cellSlug: KNISHIO_SETTINGS.appSlug
      })
      this.hasError = false
    } else {
      console.error('No Knish.IO servers are available for connection!')
      this.hasError = true
    }
  },

  /**
   * Stores an existing user secret or produces a new one
   * This determines the user account all operations will work with
   *
   * @param {string|null} newSecret
   * @returns {Promise<void>}
   * @constructor
   */
  init: async function (newSecret = null) {
    console.groupCollapsed('DLT::init() - Initializing User...')

    console.info('DLT::init() - Beginning bootstrap procedure...')

    // Do we have a client available?
    if (this.client) {
      // Generating / recovering user's secret
      let secret
      if (newSecret) {
        console.info('DLT::init() - Replacing user secret...')
        secret = newSecret
      } else {
        console.info('DLT::init() - Retrieving user identity...')
        secret = await getDataPromise(db, 'secret')
      }

      // Authorizing, if necessary
      await this.authorize(newSecret)

      if (secret) {
        // Saving secret
        this.secret = secret
        await setDataPromise(db, 'secret', secret)

        // Generating bundle hash
        this.bundle = generateBundleHash(secret)
        console.info(`DLT::init() - Establishing bundle hash ${this.bundle}...`)

        // Get a username
        this.username = await getDataPromise(db, 'username')

        // Can we update metadata? If not, we will be logged out
        this.isLoggedIn = await this.update()
      } else {
        console.warn('DLT::init() - User is not logged in...')
        this.isLoggedIn = false
      }

      this.isInitialized = true
    } else {
      console.error('DLT::init() - No Knish.IO client available!')
    }

    console.info('DLT::init() - Bootstrap complete.')
    console.groupEnd()
  },

  /**
   * Verifies the user's login combination
   *
   * @param username
   * @param password
   * @param secret
   * @returns {Promise<boolean>}
   */
  async verifyLogin ({
    username = null,
    password = null,
    secret = null
  }) {
    console.log(`DLT::verifyLogin() - Starting login verification process with username ${username} password ${password}...`)

    if (!process.env.KNISHIO_APP_SALT) {
      throw new BaseException('DLT::login() - Salt is required for secure hashing!')
    }

    // Starting new Knish.IO session
    if (!secret) {
      secret = generateSecret(`${username}:${password}:${process.env.KNISHIO_APP_SALT}`)
    }

    // Generating bundle hash
    const bundle = generateBundleHash(secret)

    console.info(`DLT::verifyLogin() - Establishing bundle hash ${bundle}...`)

    const userBundle = new WalletBundle({})
    await userBundle.query(this.client, {
      bundleHash: bundle
    })

    // Match discovered?
    return userBundle.id && Object.keys(userBundle.metas).length > 0
  },

  /**
   * Attempts to log in the user by hashing a new secret and retrieving the user's data
   *
   * @param {string|null} username
   * @param {string|null} password
   * @param {string|null} secret
   * @param {string|null} auth2fa
   * @returns {Promise<boolean|string>}
   */
  async login ({
    username = null,
    password = null,
    secret = null,
    auth2fa = null
  }) {
    // Successful login, proceed to session initialization
    if (await this.verifyLogin({
      username,
      password,
      secret
    })) {
      if (process.env.KNISHIO_2FA_ENABLED) {
        // If 2FA hasn't been set, set it
        if (!this.auth2fa || auth2fa === null) {
          this.auth2fa = randomString(8)
          return this.auth2fa
        }

        // 2FA not matching?
        if (this.auth2fa !== auth2fa) {
          console.warn('DLT::login() - 2FA failure. Aborting login...')
          await this.logout()
          return false
        }
      }

      console.log('DLT::login() - Logging in...')

      // Starting new Knish.IO session
      if (!secret) {
        secret = generateSecret(`${username}:${password}:${process.env.KNISHIO_APP_SALT}`)
      }

      // Starting authorization process
      await this.authorize(secret)

      this.isLoggedIn = true
      this.username = username
      this.auth2fa = null
      await setDataPromise(db, 'username', username)
      await this.init(secret)
      return true
    } else {
      console.warn('DLT::login() - Failed to retrieve results for given auth user...')
      console.warn('DLT::login() - User not registered; Aborting login...')
      await this.logout()
      return false
    }
  },
  /**
   * Clears the user state to begin an empty session
   *
   * @returns {Promise<void>}
   */
  async logout () {
    console.log('DLT::logout() - Clearing user session...')
    this.isInitialized = false
    await this.client.deinitialize()
    this.isLoggedIn = false
    this.secret = null
    this.username = null
    this.bundle = null
    this.createdAt = null
    this.metas = null
    this.isInitialized = true
    this.userRoles = true
    this.profile = {}
    this.auth2fa = null

    await deleteDataPromise(db, 'username')
    await deleteDataPromise(db, 'secret')
    await deleteDataPromise(db, 'authToken')

    console.log('DLT::logout() - User session cleared...')
  },

  /**
   * Retrieves an authorization token from the ledger
   *
   * @param {string|null} newSecret
   * @returns {Promise<void>}
   */
  async authorize (newSecret = null) {
    console.log('DLT::authorize() - Starting authorization process...')

    if (this.client) {
      // Has a new secret: saving secret locally & update it on KnishIOClient
      if (newSecret) {
        console.log('DTL::authorize() - Replacing user secret...')
        await setDataPromise(db, 'secret', newSecret)
      }

      // Get stored secret & set it to the KnishIOClient
      console.log('DTL::authorize() - Retrieving user identity...')
      const secret = await getDataPromise(db, 'secret')
      if (secret) {
        this.client.setSecret(secret)
      }

      // Auth token default initialization
      const authTokenData = await getDataPromise(db, 'authToken')

      // Has a stored auth token data - restore an authToken object from it
      let authTokenObject = null
      if (authTokenData) {
        authTokenObject = AuthToken.restore(authTokenData, secret)
      }
      console.log(`DLT::init() - Retrieving auth token ${authTokenObject ? authTokenObject.getToken() : 'NONE'}...`)

      // Try to get a new auth token
      if (newSecret || !authTokenObject || authTokenObject.isExpired()) {
        // Get a new auth token
        const response = await this.client.requestAuthToken({ secret })
        if (response) {
          const payload = response.payload()
          const access = (Object.prototype.toString.call(payload) === '[object St,ring]') ? JSON.parse(payload) : payload

          if (typeof access.token !== 'undefined') {
            this.authToken = access.token
            this.resetAuthTimeout()
            this.setAuthTimeout(access)
          }
        }

        // Get an authToken from the client
        authTokenObject = this.client.getAuthToken()
        console.log(`DLT::init() - Get a new auth token ${authTokenObject.getToken()}...`)

        // Save authToken
        await setDataPromise(db, 'authToken', authTokenObject.getSnapshot())
      }

      // Set an auth token to the KnishIOClient
      this.client.setAuthToken(authTokenObject)
    } else {
      console.error('DLT::authorize() - No Knish.IO client available!')
    }
  },
  /**
   * Retrieves the latest metadata from the ledger and populates local state
   *
   * @returns {Promise<boolean>}
   */
  async update () {
    console.log('DLT::update() - Beginning remote update...')

    const bundleObject = new WalletBundle({})
    await bundleObject.query(this.client, {
      bundleHash: this.bundle
    })

    console.log(`DLT::update() - Retrieved ${Object.keys(bundleObject.metas).length} metadata fields...`)

    if (bundleObject.id && Object.keys(bundleObject.metas).length > 0) {
      this.isInitialized = false

      this.createdAt = Number(bundleObject.createdAt)

      // Generate a random cover
      this.profile = {
        avatar: bundleObject.metas.avatar,
        publicName: bundleObject.metas.publicName,
        username: await getDataPromise(db, 'username')
      }
      console.log('DLT::update() - Update complete...')
      return true
    } else {
      console.warn('DLT::update() - Cannot find user metadata...')
      await this.logout()
      return false
    }
  },

  /**
   * Validates the registration state of the user to ensure there is no duplicate
   *
   * @param {string|null} username
   * @param {string|null} password
   * @param {string|null} secret
   * @param {string|null} publicName
   * @param {boolean|null} auth2fa
   * @returns {Promise<boolean>}
   */
  async register ({
    username = null,
    password = null,
    secret = null,
    publicName = null,
    auth2fa = null
  }) {
    console.log('DLT::register() - Starting registration process...')

    // Failed login, meaning no collision was found - this is good
    if (!await this.verifyLogin({
      username,
      password,
      secret
    })) {
      if (process.env.KNISHIO_2FA_ENABLED) {
        // If 2FA hasn't been set, set it
        if (!this.auth2fa || auth2fa === null) {
          this.auth2fa = randomString(8)
          return this.auth2fa
        }

        // 2FA not matching?
        if (this.auth2fa !== auth2fa) {
          console.warn('DLT::login() - 2FA failure. Aborting login...')
          await this.logout()
          return false
        }
      }

      console.log('DLT::register() - Registering...')

      // Starting new Knish.IO session
      if (!secret) {
        secret = generateSecret(`${username}:${password}:${process.env.KNISHIO_APP_SALT}`)
      }

      // Starting authorization process
      await this.authorize(secret)

      this.isLoggedIn = true
      this.username = username
      this.auth2fa = null
      this.profile.publicName = publicName
      await setDataPromise(db, 'username', username)

      const saveParams = {
        metaData: {
          publicName,
          usernameHash: this.hash(username),
          appSlug: String(process.env.KNISHIO_APP_SLUG)
        },
        metaId: generateBundleHash(secret)
      }

      // Register user's metadata in the ledger
      const bundle = new WalletBundle({})
      const response = await bundle.save(this.client, saveParams)

      // All good, re-initialize user with new credentials
      if (response.error < 1) {
        await this.init()
        return true
      }

      // Ledger returned an exception!
      await this.logout()
      throw new BaseException(response.error_message)
    } else {
      // Successful login - registration not needed
      console.warn('DLT::register() - User already registered; Logging in instead...')
      await this.init()
      return true
    }
  },

  /**
   * Sets a timer on a repeat request for an auth token
   *
   * @param access
   */
  setAuthTimeout (access) {
    setTimeout(async () => {
      await this.authorize(this.client.hasSecret() ? this.client.getSecret() : null)
    }, access.time)
  },

  /**
   * Resets the auth token timer
   */
  resetAuthTimeout () {
    if (!this.authTimeout) {
      clearTimeout(this.authTimeout)
    }
    this.authTimeout = null
  },

  /**
   * Hashes a string with a salt
   *
   * @param {string} data
   * @param {number} length
   * @param {boolean} salted
   * @returns {string|*}
   */
  hash (data, length = 64, salted = true) {
    if (salted && !process.env.KNISHIO_APP_SALT) {
      throw new BaseException('DLT::hash() - Salt is required for secure hashing!')
    }

    return generateSecret(`${data}${salted ? `:${process.env.KNISHIO_APP_SALT}` : ''}`, length)
  },

  /**
   * Checks the ledger for presence of a given hashed username
   *
   * @param {string} username
   * @returns {Promise<boolean>}
   */
  async isUsernameUnique (username) {
    const usernameHash = this.hash(username)
    const result = await this.client.queryMeta({
      metaType: 'walletBundle',
      key: 'usernameHash',
      value: usernameHash
    })
    if (result && result.instances && result.instances.length > 0) {
      console.info(`DLT::isUsernameUnique() - Found a match for ${usernameHash}...`)
      return false
    } else {
      console.info(`DLT::isUsernameUnique() - No matches found for ${usernameHash}...`)
      return true
    }
  },

  /**
   * Checks the ledger for user already invited
   *
   * @param {string} recipient
   * @returns {Promise<boolean>}
   */
  async isUsernameInvited (recipient) {
    const usernameHash = this.hash(recipient)
    const result = await this.client.queryMeta({
      metaType: KNISHIO_SETTINGS.invite,
      key: 'recipientHashedEmail',
      value: usernameHash
    })
    if (result && result.instances && result.instances.length > 0) {
      console.info(`DLT::isUsernameInvited() - Found a match for ${usernameHash}...`)
      return false
    } else {
      console.info(`DLT::isUsernameInvited() - No matches found for ${usernameHash}...`)
      return true
    }
  },

  /**
   * Accepts an array of endpoint URIs and returns a list of those that respond
   *
   * @param uris
   * @returns {Promise<{}>}
   */
  async testEndpointUris (uris) {
    const validServers = {}

    for (const uriKey in uris) {
      console.info(`Testing connection to node hostname ${uris[uriKey]}...`)

      try {
        const response = await axios({
          method: 'get',
          url: uris[uriKey],
          data: {}
        })

        if (response.status === 200) {
          validServers[uriKey] = uris[uriKey]
          console.info(`DLT::testEndpointUris() - Node hostname ${uris[uriKey]} successfully added.`)
        }
      } catch (err) {
        console.error(err)
        console.warn(`DLT::testEndpointUris() - Node hostname ${uris[uriKey]} is not available.`)
      }
    }

    return validServers
  }
}

// Declaring getters object
const gettersObj = {

  /**
   * Returns whether the current user is a valid admin
   *
   * @returns {boolean}
   */
  userIsAuthorized () {
    const admins = typeof process.env.KNISHIO_APP_ADMINS === 'object' ? Object.values(process.env.KNISHIO_APP_ADMINS) : []
    return admins.includes(this.bundle)
  },

  /**
   * Returns a truncated version of the user's wallet bundle
   *
   * @returns {string}
   */
  shortBundle () {
    return this.bundle ? this.bundle.slice(this.bundle.length - 4).toUpperCase() : 'N/A'
  },

  /**
   * Returns the default encryption wallet for this app
   *
   * @returns {Wallet}
   */
  encryptionWallet () {
    return new Wallet({
      secret: this.secret,
      token: process.env.KNISHIO_APP_ENCRYPTION_TOKEN,
      position: process.env.KNISHIO_APP_ENCRYPTION_POSITION
    })
  }
}

export default defineStore('dlt', {
  state: () => (stateObj),
  actions: actionsObj,
  getters: gettersObj,
  persist: false
})
