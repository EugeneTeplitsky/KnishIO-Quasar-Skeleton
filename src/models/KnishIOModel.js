/**
 * Abstract KnishIOModel class
 *
 * @class KnishIOModel
 */
import Meta from '@wishknish/knishio-client-js/src/Meta'
import { KNISHIO_SETTINGS } from 'src/libraries/constants/knishio'
import { randomString } from 'src/libraries/strings'
import BaseException from '@wishknish/knishio-client-js/src/exception/BaseException'

export default class KnishIOModel {
  /**
   * Creates a new meta model instance using a MetaType instance as a data source
   *
   * @param {null|Object} rawInstance
   */
  constructor (rawInstance = null) {
    this.metas = {}
    if (rawInstance) {
      // Construct meta model object
      this.id = rawInstance.metaId

      if (typeof rawInstance.id !== 'undefined') {
        this.id = rawInstance.id
      }

      this.createdAt = rawInstance.createdAt

      // Load metadata
      if (rawInstance.metas) {
        this.loadMetas(rawInstance.metas)
      }
    }
  }

  /**
   * Return current model metatype
   * @returns {string}
   */
  getMetatype () {
    return KnishIOModel.resolveMetaType(this.constructor.metaType)
  }

  /**
   * Converts object metadata into class properties
   *
   * @param {Object} rawMetas
   */
  loadMetas (rawMetas) {
    this.metas = Meta.aggregateMeta(rawMetas)

    Object.keys(this.metas).forEach(key => {
      if (this.metas[key] === 'null') {
        this.metas[key] = null
      }
    })
  }

  /**
   * Queries the ledger to retrieve meta model data
   *
   * @param client
   * @param metaType
   * @param metaId
   * @returns {Promise<boolean>}
   */
  async query (client, {
    metaType = null,
    metaId = null
  }) {
    // Resolving type name from class
    let type
    if (metaType) {
      // MetaType was already provided
      type = metaType
    } else {
      // Resolving MetaType
      type = KnishIOModel.resolveMetaType(this.constructor.metaType)
    }

    const result = await client.queryAtom({
      isotope: 'M',
      metaType: type,
      metaId: metaId || this.id
    })

    console.log(result)

    if (result && result.instances && result.instances.length > 0) {
      if (metaId) {
        this.id = metaId
        this.createdAt = result.instances[0].createdAt
      }
      this.loadMetas(result.instances[0].metas)
      return true
    } else {
      return false
    }
  }

  /**
   * Save meta to ledger
   *
   * @param {KnishIOClient} client
   * @param {string|null} metaId
   * @param {string|null} metaType
   * @param {object} metaData
   * @return {Promise<{error_message: string, error: number}|{error_message, error: number}|{error_message: null, error: number}>}
   */
  async save (client, {
    metaId = null,
    metaType = null,
    metaData = {}
  }) {
    try {
      // Using existing metaId
      if (this.id) {
        metaId = this.id
      } else if (!metaId) {
        // Generating new metaId
        metaId = randomString(64)
      }

      // Using current metadata if no meta is provided
      if (Object.values(metaData).length === 0) {
        metaData = this.metas
      }

      // Resolving type name from class
      if (!metaType) {
        metaType = KnishIOModel.resolveMetaType(this.constructor.metaType)
      }

      for (const i in metaData) {
        if (typeof metaData[i] === 'number') {
          metaData[i] = metaData[i].toString()
        } else if (typeof metaData[i] === 'object') {
          metaData[i] = JSON.stringify(metaData[i])
        }
      }

      const response = await client.createMeta({
        metaType,
        metaId,
        meta: metaData
      })

      if (response.success()) {
        return {
          error: 0,
          error_message: null
        }
      } else {
        return {
          error: 1,
          error_message: null
        }
      }
    } catch (knishIoException) {
      return {
        error: 1,
        error_message: knishIoException
      }
    }
  }

  /**
   * Resolves a class name into a MetaType string
   *
   * @param {string} className
   * @returns {string}
   */
  static resolveMetaType (className) {
    let metaType

    // Need to compute MetaType from class name
    const resolvedType = className[0].toLowerCase() + className.slice(1)
    if (KNISHIO_SETTINGS.types[resolvedType]) {
      metaType = KNISHIO_SETTINGS.types[resolvedType]
    } else if (KNISHIO_SETTINGS.types[className]) {
      // Resolved meta type doesn't exist, trying class name
      metaType = KNISHIO_SETTINGS.types[className]
    } else if (className) {
      // No matches found - use base prefix plus class name
      metaType = `${process.env.KNISHIO_APP_MODEL_PREFIX}${className}`
    } else {
      throw new BaseException(`KnishIOModel::resolveMetaType - Unable to find MetaType for model ${className}!`)
    }

    return metaType
  }
}
