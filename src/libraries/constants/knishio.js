// Knish.IO-specific constants

export const KNISHIO_SETTINGS = {
  salt: process.env.KNISHIO_APP_SALT,
  appSlug: process.env.KNISHIO_APP_SLUG,
  appToken: process.env.KNISHIO_APP_TOKEN,
  pubKeyField: process.env.KNISHIO_APP_PUBKEY_FIELD,
  masterToken: process.env.KNISHIO_APP_MASTER_TOKEN,
  encryptionToken: process.env.KNISHIO_APP_ENCRYPTION_TOKEN,
  encryptionPosition: process.env.KNISHIO_APP_ENCRYPTION_POSITION,
  siteUri: `${[true, 'true'].includes(process.env.KNISHIO_APP_MODE === 'prod' ? process.env.KNISHIO_PROD_HTTPS : process.env.KNISHIO_DEV_HTTPS) ? 'https' : 'http'}://${process.env.KNISHIO_APP_MODE === 'prod' ? process.env.KNISHIO_PROD_HOST : process.env.KNISHIO_DEV_HOST}:${process.env.KNISHIO_APP_MODE === 'prod' ? process.env.KNISHIO_PROD_PORT : process.env.KNISHIO_DEV_PORT}/`,
  serverUriConfig: {},
  serverUri: {},
  socketUri: `${[true, 'true'].includes(process.env.KNISHIO_SERVER_HTTPS) ? 'https' : 'http'}://${process.env.KNISHIO_SERVER_SOCKET_HOST}:${process.env.KNISHIO_SERVER_SOCKET_PORT}`,
  subscriptionSocketUri: `${[true, 'true'].includes(process.env.KNISHIO_SERVER_HTTPS) ? 'wss' : 'ws'}://${process.env.KNISHIO_SERVER_SOCKET_HOST}:${process.env.KNISHIO_SERVER_SOCKET_PORT}`,
  proxyUri: `${[true, 'true'].includes(process.env.KNISHIO_DEV_HTTPS) ? 'https' : 'http'}://${process.env.KNISHIO_DEV_PROXY}:${process.env.KNISHIO_DEV_PROXY_PORT}/`,
  stripeUrl: process.env.KNISHIO_APP_STRIPE_MICROSERVICE_URL,
  stripeIdentityUrl: process.env.KNISHIO_APP_STRIPE_IDENTITY_MICROSERVICE_URL,
  stripeIdentitySessionUrl: process.env.KNISHIO_APP_STRIPE_IDENTITY_SESSION_URL,
  stripeConnectId: process.env.KNISHIO_APP_STRIPE_CONNECT_ID,
  stripePublishableKey: process.env.KNISHIO_APP_STRIPE_MICROSERVICE_PUBLISHABLE_KEY,
  attomUrl: process.env.KNISHIO_APP_ATTOM_MICROSERVICE_URL,
  client: null,
  defaultModule: process.env.KNISHIO_APP_DEFAULT_MODULE,
  googleOAuthId: process.env.GOOGLE_OAUTH_ID,
  twitterOAuthId: process.env.TWITTER_OAUTH_ID,
  linkedInOAuthId: process.env.LINKEDIN_OAUTH_ID,
  metaMaskAuthEnabled: process.env.METAMASK_AUTH_ENABLED,
  firebaseAuthEnabled: process.env.FIREBASE_AUTH_ENABLED,

  types: {
    page: 'Page',
    walletBundle: 'walletBundle',
    secureMessage: 'SecureMessage',
    knishKitsInstance: 'KnishKitsInstance',
    store: `${process.env.KNISHIO_APP_MODEL_PREFIX}Store`,
    customStoreSchedule: `${process.env.KNISHIO_APP_MODEL_PREFIX}CustomStoreSchedule`,
    order: `${process.env.KNISHIO_APP_MODEL_PREFIX}Order`,
    product: `${process.env.KNISHIO_APP_MODEL_PREFIX}Product`,
    review: `${process.env.KNISHIO_APP_MODEL_PREFIX}Review`,
    reviewReply: `${process.env.KNISHIO_APP_MODEL_PREFIX}ReviewReply`,
    reviewVote: `${process.env.KNISHIO_APP_MODEL_PREFIX}ReviewVote`,
    payout: `${process.env.KNISHIO_APP_MODEL_PREFIX}Payout`,
    refund: `${process.env.KNISHIO_APP_MODEL_PREFIX}Refund`,
    dispute: `${process.env.KNISHIO_APP_MODEL_PREFIX}Dispute`,
    invite: `${process.env.KNISHIO_APP_MODEL_PREFIX}Invite`,
    favoriteStore: `${process.env.KNISHIO_APP_MODEL_PREFIX}FaveStore`,
    favoriteProduct: `${process.env.KNISHIO_APP_MODEL_PREFIX}FaveProduct`,
    favoriteLink: `${process.env.KNISHIO_APP_MODEL_PREFIX}FaveLink`,
    favoriteCommunity: `${process.env.KNISHIO_APP_MODEL_PREFIX}FaveCommunity`,
    role: `${process.env.KNISHIO_APP_MODEL_PREFIX}Role`,
    community: `${process.env.KNISHIO_APP_MODEL_PREFIX}Community`,
    report: `${process.env.KNISHIO_APP_MODEL_PREFIX}Report`, // KnishAid Report
    resource: `${process.env.KNISHIO_APP_MODEL_PREFIX}Resource`, // KnishAid Resource
    category: `${process.env.KNISHIO_APP_MODEL_PREFIX}Category`,
    KnishAidDocument: `${process.env.KNISHIO_APP_MODEL_PREFIX}KnishAidDocument`
  }
}

// Adding server URIs
const protocol = [true, 'true'].includes(process.env.KNISHIO_SERVER_HTTPS) ? 'https' : 'http'
const port = process.env.KNISHIO_SERVER_PORT
const path = process.env.KNISHIO_SERVER_PATH
const serverUris = typeof process.env.KNISHIO_SERVER_HOST === 'object' ? Object.values(process.env.KNISHIO_SERVER_HOST) : [process.env.KNISHIO_SERVER_HOST]

serverUris.forEach((host, index) => {
  KNISHIO_SETTINGS.serverUriConfig[host] = `${protocol}://${host}:${port}/${path}`
})
