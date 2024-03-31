export const KNISHIO_SETTINGS = {
  salt: process.env.KNISHIO_SALT,
  cellSlug: process.env.KNISHIO_CELL_SLUG,
  auth2faEnabled: process.env.KNISHIO_2FA_ENABLED,
  admins: process.env.KNISHIO_APP_ADMINS,
  pubKeyField: process.env.KNISHIO_PUBKEY,
  encryptionToken: process.env.KNISHIO_ENCRYPTION_TOKEN,
  encryptionPosition: process.env.KNISHIO_ENCRYPTION_POSITION,
  serverUriConfig: typeof process.env.KNISHIO_URI === 'string' ? [...process.env.KNISHIO_URI.split(',')] : [],
  client: null,
  types: {
    walletBundle: 'walletBundle',
    secureMessage: 'SecureMessage'
  },
  typePrefix: process.env.KNISHIO_TYPE_PREFIX
}
