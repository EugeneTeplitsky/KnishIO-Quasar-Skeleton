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
import { randomString } from 'src/libraries/strings'
import axios from 'axios'

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

const actionsObj = {
  /**
   * Connects to the Knish.IO servers.
   * @param {string[]} endpointUris - Array of endpoint URIs.
   */
  async connect (endpointUris) {
    const validServers = await this.testEndpointUris(endpointUris)

    if (Object.values(validServers).length > 0) {
      this.serverUris = Object.values(validServers)
      console.info(`Creating Knish.IO client connected to ${Object.values(validServers).length} node(s)...`)
      this.client = new KnishIOClient({
        uri: this.serverUris,
        cellSlug: KNISHIO_SETTINGS.cellSlug
      })
      this.hasError = false
    } else {
      console.error('No Knish.IO servers are available for connection!')
      this.hasError = true
    }
  },

  /**
   * Initializes the user session.
   * @param {string|null} [newSecret=null] - New user secret.
   */
  async init (newSecret = null) {
    console.groupCollapsed('DLT::init() - Initializing User...')
    console.info('DLT::init() - Beginning bootstrap procedure...')

    if (!this.client) {
      console.error('DLT::init() - No Knish.IO client available!')
      return
    }

    let secret
    if (newSecret) {
      console.info('DLT::init() - Replacing user secret...')
      secret = newSecret
    } else {
      console.info('DLT::init() - Retrieving user identity...')
      secret = await getDataPromise(db, 'secret')
    }

    await this.authorize(newSecret)

    if (secret) {
      this.secret = secret
      await setDataPromise(db, 'secret', secret)

      this.bundle = generateBundleHash(secret)
      console.info(`DLT::init() - Establishing bundle hash ${this.bundle}...`)

      this.username = await getDataPromise(db, 'username')

      this.isLoggedIn = await this.update()
    } else {
      console.warn('DLT::init() - User is not logged in...')
      this.isLoggedIn = false
    }

    this.isInitialized = true
    console.info('DLT::init() - Bootstrap complete.')
    console.groupEnd()
  },

  /**
   * Verifies the user's login credentials.
   * @param {Object} options - Login options.
   * @param {string|null} [options.username=null] - Username.
   * @param {string|null} [options.password=null] - Password.
   * @param {string|null} [options.secret=null] - User secret.
   * @returns {Promise<boolean>} - True if login is verified, false otherwise.
   */
  async verifyLogin ({
    username = null,
    password = null,
    secret = null
  }) {
    console.log(`DLT::verifyLogin() - Starting login verification process with username ${username} password ${password}...`)

    if (!KNISHIO_SETTINGS.salt) {
      throw new BaseException('DLT::login() - Salt is required for secure hashing!')
    }

    if (!secret) {
      secret = generateSecret(`${username}:${password}:${KNISHIO_SETTINGS.salt}`)
    }

    const bundle = generateBundleHash(secret)
    console.info(`DLT::verifyLogin() - Establishing bundle hash ${bundle}...`)

    const userBundle = new WalletBundle({})
    await userBundle.query(this.client, { bundleHash: bundle })

    return userBundle.id && Object.keys(userBundle.metas).length > 0
  },

  /**
   * Logs in the user.
   * @param {Object} options - Login options.
   * @param {string|null} [options.username=null] - Username.
   * @param {string|null} [options.password=null] - Password.
   * @param {string|null} [options.secret=null] - User secret.
   * @param {string|null} [options.auth2fa=null] - Two-factor authentication code.
   * @returns {Promise<boolean|string>} - True if login is successful, false or 2FA code if login fails.
   */
  async login ({
    username = null,
    password = null,
    secret = null,
    auth2fa = null
  }) {
    if (await this.verifyLogin({
      username,
      password,
      secret
    })) {
      if (process.env.KNISHIO_2FA_ENABLED) {
        if (!this.auth2fa || auth2fa === null) {
          this.auth2fa = randomString(8)
          return this.auth2fa
        }

        if (this.auth2fa !== auth2fa) {
          console.warn('DLT::login() - 2FA failure. Aborting login...')
          await this.logout()
          return false
        }
      }

      console.log('DLT::login() - Logging in...')

      if (!secret) {
        secret = generateSecret(`${username}:${password}:${KNISHIO_SETTINGS.salt}`)
      }

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
   * Clears the user session.
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
   * Retrieves an authorization token from the ledger.
   * @param {string|null} [newSecret=null] - New user secret.
   */
  async authorize (newSecret = null) {
    console.log('DLT::authorize() - Starting authorization process...')

    if (!this.client) {
      console.error('DLT::authorize() - No Knish.IO client available!')
      return
    }

    if (newSecret) {
      console.log('DTL::authorize() - Replacing user secret...')
      await setDataPromise(db, 'secret', newSecret)
    }

    console.log('DTL::authorize() - Retrieving user identity...')
    const secret = await getDataPromise(db, 'secret')
    if (secret) {
      this.client.setSecret(secret)
    }

    const authTokenData = await getDataPromise(db, 'authToken')

    let authTokenObject = null
    if (authTokenData) {
      authTokenObject = AuthToken.restore(authTokenData, secret)
    }
    console.log(`DLT::init() - Retrieving auth token ${authTokenObject?.getToken() ?? 'NONE'}...`)

    if (newSecret || !authTokenObject || authTokenObject.isExpired()) {
      const response = await this.client.requestAuthToken({ secret })
      if (response) {
        const {
          token,
          time
        } = response.payload()

        if (token) {
          this.authToken = token
          this.resetAuthTimeout()
          this.setAuthTimeout({ time })
        }
      }

      authTokenObject = this.client.getAuthToken()
      console.log(`DLT::init() - Get a new auth token ${authTokenObject.getToken()}...`)

      await setDataPromise(db, 'authToken', authTokenObject.getSnapshot())
    }

    this.client.setAuthToken(authTokenObject)
  },

  /**
   * Retrieves the latest metadata from the ledger and updates the local state.
   * @returns {Promise<boolean>} - True if update is successful, false otherwise.
   */
  async update () {
    console.log('DLT::update() - Beginning remote update...')

    const bundleObject = new WalletBundle({})
    await bundleObject.query(this.client, { bundleHash: this.bundle })

    console.log(`DLT::update() - Retrieved ${Object.keys(bundleObject.metas).length} metadata fields...`)

    if (bundleObject.id && Object.keys(bundleObject.metas).length > 0) {
      this.isInitialized = false

      this.createdAt = Number(bundleObject.createdAt)

      const {
        avatar,
        publicName
      } = bundleObject.metas
      this.profile = {
        avatar,
        publicName,
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
   * Registers a new user.
   * @param {Object} options - Registration options.
   * @param {string|null} [options.username=null] - Username.
   * @param {string|null} [options.password=null] - Password.
   * @param {string|null} [options.secret=null] - User secret.
   * @param {string|null} [options.publicName=null] - Public name.
   * @param {boolean|null} [options.auth2fa=null] - Two-factor authentication enabled.
   * @returns {Promise<boolean|string>} - True if registration is successful, false or 2FA code if registration fails.
   */
  async register ({
    username = null,
    password = null,
    secret = null,
    publicName = null,
    auth2fa = null
  }) {
    console.log('DLT::register() - Starting registration process...')

    if (await this.verifyLogin({
      username,
      password,
      secret
    })) {
      console.warn('DLT::register() - User already registered; Logging in instead...')
      await this.init()
      return true
    }

    if (process.env.KNISHIO_2FA_ENABLED) {
      if (!this.auth2fa || auth2fa === null) {
        this.auth2fa = randomString(8)
        return this.auth2fa
      }

      if (this.auth2fa !== auth2fa) {
        console.warn('DLT::login() - 2FA failure. Aborting login...')
        await this.logout()
        return false
      }
    }

    console.log('DLT::register() - Registering...')

    if (!secret) {
      secret = generateSecret(`${username}:${password}:${KNISHIO_SETTINGS.salt}`)
    }

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

    const bundle = new WalletBundle({})
    const response = await bundle.save(this.client, saveParams)

    if (response.error < 1) {
      await this.init()
      return true
    }

    await this.logout()
    throw new BaseException(response.error_message)
  },

  /**
   * Sets a timer for requesting an auth token.
   * @param {Object} options - Auth token options.
   * @param {number} options.time - Time in milliseconds.
   */
  setAuthTimeout ({ time }) {
    setTimeout(async () => {
      await this.authorize(this.client.hasSecret() ? this.client.getSecret() : null)
    }, time)
  },

  /**
   * Resets the auth token timer.
   */
  resetAuthTimeout () {
    if (this.authTimeout) {
      clearTimeout(this.authTimeout)
      this.authTimeout = null
    }
  },

  /**
   * Hashes a string with a salt.
   * @param {string} data - String to hash.
   * @param {number} [length=64] - Length of the hash.
   * @param {boolean} [salted=true] - Whether to salt the hash.
   * @returns {string} - Hashed string.
   */
  hash (data, length = 64, salted = true) {
    if (salted && !KNISHIO_SETTINGS.salt) {
      throw new BaseException('DLT::hash() - Salt is required for secure hashing!')
    }

    return generateSecret(`${data}${salted ? `:${KNISHIO_SETTINGS.salt}` : ''}`, length)
  },

  /**
   * Checks if a username is unique in the ledger.
   * @param {string} username - Username to check.
   * @returns {Promise<boolean>} - True if the username is unique, false otherwise.
   */
  async isUsernameUnique (username) {
    const usernameHash = this.hash(username)
    const result = await this.client.queryMeta({
      metaType: 'walletBundle',
      key: 'usernameHash',
      value: usernameHash
    })

    if (result?.instances?.length > 0) {
      console.info(`DLT::isUsernameUnique() - Found a match for ${usernameHash}...`)
      return false
    } else {
      console.info(`DLT::isUsernameUnique() - No matches found for ${usernameHash}...`)
      return true
    }
  },

  /**
   * Tests the availability of endpoint URIs.
   * @param {object} uris - Array of endpoint URIs to test.
   * @returns {Promise<Object>} - Object containing the valid server URIs.
   */
  async testEndpointUris (uris) {
    const validServers = {}
    for (const uriKey of Object.keys(uris)) {
      const uri = uris[uriKey]
      console.info(`Testing connection to node hostname ${uri}...`)
      try {
        const response = await axios.get(uris[uriKey])

        if (response.status === 200) {
          validServers[uriKey] = uris[uriKey]
          console.info(`DLT::testEndpointUris() - Node hostname ${uris[uriKey]} successfully added.`)
        }
      } catch (err) {
        console.error(`DLT::testEndpointUris() - Error testing node hostname ${uris[uriKey]}:`, err)
        console.warn(`DLT::testEndpointUris() - Node hostname ${uris[uriKey]} is not available.`)
      }
    }

    return validServers
  }
}

const gettersObj = {
  /**
   * Checks if the current user is an authorized admin.
   * @returns {boolean} - True if the user is an authorized admin, false otherwise.
   */
  userIsAuthorized () {
    const admins = Array.isArray(process.env.KNISHIO_APP_ADMINS)
      ? process.env.KNISHIO_APP_ADMINS
      : []
    return admins.includes(this.bundle)
  },

  /**
   * Returns a truncated version of the user's wallet bundle.
   * @returns {string} - Truncated wallet bundle.
   */
  shortBundle () {
    return this.bundle
      ? this.bundle.slice(this.bundle.length - 4).toUpperCase()
      : 'N/A'
  },

  /**
   * Returns the default encryption wallet for the app.
   * @returns {Wallet} - Default encryption wallet.
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
  state: () => stateObj,
  actions: actionsObj,
  getters: gettersObj,
  persist: false
})
