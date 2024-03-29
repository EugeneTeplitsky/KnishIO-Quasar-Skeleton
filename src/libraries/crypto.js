import { Wallet } from '@wishknish/knishio-client-js/src/index'
import { KNISHIO_SETTINGS } from 'src/libraries/constants/knishio'

/**
 * Encrypts a string for the current user and for the app owner
 *
 * @param data
 * @param secretOrWallet
 * @param publicKeys
 * @returns {string}
 */
export const encryptString = (data, secretOrWallet, publicKeys = []) => {
  if (data) {
    // Encrypting for user and app owner

    // Are we specifying a secret, or a wallet?
    let encryptionWallet

    if (typeof secretOrWallet === 'string') {
      encryptionWallet = new Wallet({
        secret: secretOrWallet,
        token: KNISHIO_SETTINGS.encryptionToken,
        position: KNISHIO_SETTINGS.encryptionPosition
      })
    } else {
      encryptionWallet = secretOrWallet
    }

    // Retrieving sender's encryption public key
    const publicKey = encryptionWallet.getMyEncPublicKey()

    // If the additional public keys is supplied as a string, convert to array
    if (typeof publicKeys === 'string') {
      publicKeys = new Array(publicKeys)
    }

    // Encrypting message
    const encryptedData = encryptionWallet.encryptMyMessage(data, publicKey, ...publicKeys)
    return btoa(JSON.stringify(encryptedData))
  }
}

/**
 * Attempts to decrypt the given string
 *
 * @param data
 * @param secretOrWallet
 * @param fallbackValue
 * @returns {Array|Object}
 */
export const decryptString = (data, secretOrWallet, fallbackValue) => {
  if (data) {
    // Are we specifying a secret, or a wallet?
    let decryptionWallet

    if (typeof secretOrWallet === 'string') {
      // Instantiating the wallet that will decrypt the given message
      decryptionWallet = new Wallet({
        secret: secretOrWallet,
        token: KNISHIO_SETTINGS.encryptionToken,
        position: KNISHIO_SETTINGS.encryptionPosition
      })
    } else {
      decryptionWallet = secretOrWallet
    }

    try {
      const decrypted = JSON.parse(atob(data))
      return decryptionWallet.decryptMessage(decrypted) || fallbackValue
    } catch (e) {
      // Probably not actually encrypted
      console.error(e)
      return fallbackValue || data
    }
  }
}
