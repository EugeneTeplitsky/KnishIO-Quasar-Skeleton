import Meta from '@wishknish/knishio-client-js/src/Meta'
import KnishIOModel from 'src/models/KnishIOModel'

export default class WalletBundle extends KnishIOModel {
  /**
   * Queries the ledger to retrieve User data
   *
   * @param {KnishIOClient} client
   * @param {null|string} bundleHash
   * @param {null|string} usernameHash
   * @returns {Promise<boolean>}
   */
  async query (client, {
    bundleHash = null,
    usernameHash = null
  }) {
    const filters = []

    if (usernameHash) {
      filters.push({
        key: 'usernameHash',
        value: usernameHash,
        comparison: '='
      })
    }

    const result = await client.queryAtom({
      metaType: KnishIOModel.resolveMetaType(this.constructor.metaType),
      metaId: bundleHash || this.id,
      filter: filters,
      latest: true
    })
    if (result) {
      const payload = result.payload()
      if (payload.instances && payload.instances.length > 0) {
        if (bundleHash) {
          this.id = bundleHash
          this.createdAt = payload.instances[0].createdAt
        }
        this.loadMetas(payload.instances[0].metas)
        return true
      }
    }
    return false
  }

  /**
   * Retrieves a list of Users from Knish.IO
   *
   * @param {KnishIOClient} client
   * @param {null|string} bundleHash
   * @param {null|object} bundleHashes
   * @param {null|string|[]} appSlug
   * @param {null|object} usernameHashes
   * @param {null|string} publicName
   * @param {null|object} refHash
   * @param {null|string|object} queryArgs
   * @returns {Promise<{instances: *[]}>}
   */
  static async query (client, {
    bundleHash = null,
    bundleHashes = null,
    appSlug = null,
    usernameHashes = null,
    publicName = null,
    refHash = null,
    queryArgs = null
  }) {
    const filters = []

    if (appSlug) {
      filters.push({
        key: 'appSlug',
        value: appSlug,
        comparison: '='
      })
    }

    if (publicName) {
      filters.push({
        key: 'publicName',
        value: publicName,
        comparison: '=~'
      })
    }

    if (refHash) {
      filters.push({
        key: 'refhash',
        value: refHash,
        comparison: '='
      })
    }

    if (usernameHashes) {
      if (typeof usernameHashes === 'string') {
        filters.push({
          key: 'usernameHash',
          value: usernameHashes,
          comparison: '='
        })
      } else {
        for (const i in usernameHashes) {
          filters.push({
            key: 'usernameHash',
            value: usernameHashes[i],
            comparison: '=',
            criterion: 'OR'
          })
        }
      }
    }

    if (bundleHashes) {
      if (typeof bundleHashes === 'string') {
        filters.push({
          key: 'metaId',
          value: bundleHashes,
          comparison: '=~'
        })
      } else {
        for (const i in bundleHashes) {
          filters.push({
            key: 'metaId',
            value: bundleHashes[i],
            comparison: '=~',
            criterion: 'OR'
          })
        }
      }
    }

    const result = await client.queryMeta({
      metaType: KnishIOModel.resolveMetaType(this.metaType),
      metaId: bundleHash || null,
      filter: filters,
      latest: true,
      latestMetas: true,
      throughAtom: true,
      queryArgs
    })

    const rawUsers = result && result.instances && result.instances.length > 0 ? result.instances : []
    const users = []
    rawUsers.forEach(rawUser => {
      rawUser.metas = Meta.aggregateMeta(rawUser.metas)

      users.push(new WalletBundle(rawUser))
    })

    const returnObj = {
      instances: users
    }

    // If need pagination, return stores and rows number
    if (result && queryArgs && typeof result.paginatorInfo !== 'undefined' && result.paginatorInfo.total) {
      returnObj.paginatorInfo = result.paginatorInfo
    }

    return returnObj
  }
}
WalletBundle.metaType = 'WalletBundle'
