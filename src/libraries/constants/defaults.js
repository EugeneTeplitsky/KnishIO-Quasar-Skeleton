export const APP_SETTINGS = {
  appUri: `${[true, 'true'].includes(process.env.KNISHIO_APP_QR_HTTPS) ? 'https' : 'http'}://${process.env.KNISHIO_APP_QR_HOST}`,
  appHost: `${process.env.KNISHIO_APP_QR_HOST}`,
  appEmail: process.env.KNISHIO_APP_SUPPORT_EMAIL
}

export const TIMESTAMP_FORMAT = 'YYYY-MM-DD hh:mm A'
export const DATE_FORMAT = 'MM-DD-YYYY'
export const PAGINATION_DEFAULTS = {
  rowsPerPage: 10,
  page: 1,
  sortBy: 'created_at',
  descending: true,
  rowsNumber: 0
}
