import { chunkSubstr } from '@wishknish/knishio-client-js/src/libraries/strings'
import {
  colors,
  date
} from 'quasar'

import {
  PREFIX,
  SUFFIX
} from 'src/libraries/constants/names'
import { TIMESTAMP_FORMAT } from 'src/libraries/constants/defaults'
import moment from 'moment'

/**
 *
 * @returns {string}
 */
export function randomHexColor () {
  const hexString = '123456789abc'
  let hexCode = '#'
  for (let i = 0; i < 6; i++) {
    hexCode += hexString[Math.floor(Math.random() * hexString.length)]
  }
  return hexCode
}

/**
 * @param paletteColor
 * @returns {{background: string}}
 */
export function randomGradient (paletteColor = 'primary') {
  const color2 = colors.getPaletteColor(paletteColor)
  const color1 = randomHexColor()
  const angle = 180
  const gradient = `linear-gradient(${angle}deg, ${color1}, ${color2})`
  return { background: gradient }
}

/**
 * Truncates the middle of a string, replacing it with a separator
 *
 * @param content
 * @param limit
 * @param separator
 * @returns {string}
 */
export function truncateMiddle (content, limit = 6, separator = '…') {
  if (!content) { return '' }

  content = content.trim()
  const chunks = chunkSubstr(content, Math.ceil(content.length / 2))
  return String(chunks[0]).substring(0, Math.ceil(limit / 2)) +
    separator +
    String(chunks[1]).substring(String(chunks[1]).length - Math.ceil(limit / 2))
}

/**
 * Generates a random string of the given length out of the given alphabet
 *
 * @param length
 * @param alphabet
 * @returns {string}
 */
export function randomString (length = 256, alphabet = 'abcdef0123456789') {
  let randomStr = ''
  for (let i = 0; i < length; i++) {
    randomStr = randomStr.concat(alphabet.charAt(Math.floor(Math.random() * alphabet.length)))
  }
  return randomStr
}

/**
 * Formats a number for human readability
 *
 * @param x
 * @returns {string}
 */
export function numberWithCommas (x) {
  return x ? x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : x
}

/**
 * Removes cycles from JSON objects for stable stringification
 *
 * @param obj
 * @param stack
 * @return {*|{[p: string]: *}|null}
 */
export function decycle (obj, stack = []) {
  if (!obj || typeof obj !== 'object') { return obj }

  if (stack.includes(obj)) { return null }

  const s = stack.concat([obj])

  return Array.isArray(obj)
    ? obj.map(x => decycle(x, s))
    : Object.fromEntries(
      Object.entries(obj)
        .map(([k, v]) => [k, decycle(v, s)]))
}

/**
 * Makes the first letter in a string capitalized
 *
 * @param string
 * @returns {string}
 */
export function ucfirst (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

/**
 * Decodes HTML strings into actual HTMl
 *
 * @param value
 * @returns {string}
 */
export function htmlDecode (value) {
  const parser = new DOMParser()
  const dom = parser.parseFromString(`<!doctype html><body>${value}`, 'text/html')
  return dom.body.innerHTML
}

/**
 * Generates a random name
 *
 * @returns {string}
 */
export function randomName () {
  const selectedName1 = PREFIX[Math.floor(Math.random() * PREFIX.length)]
  const selectedName2 = SUFFIX[Math.floor(Math.random() * SUFFIX.length)]
  return `${selectedName1} ${selectedName2} ${Math.floor(Math.random() * 1000)}`
}

/**
 * Formats and humanizes a Date timestamp
 *
 * @param {number|string} timestamp
 * @param {string|null} format
 * @param {number} humanizeCutoff
 * @returns {string|*}
 */
export function formatTimestamp (timestamp, format = null, humanizeCutoff = 1000 * 60 * 60 * 12) {
  const nowDate = Date.now()
  const thenDate = Number(timestamp)

  if (humanizeCutoff > 0 && nowDate - thenDate > humanizeCutoff) {
    return date.formatDate(thenDate, format || TIMESTAMP_FORMAT)
  }

  return moment.duration(thenDate - nowDate, 'milliseconds').humanize(true)
}

/**
 * Checks if the string is a valid JSON string
 *
 * @param {string} str
 * @returns {boolean}
 */
export function isJson (str) {
  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }
  return true
}

/**
 * Checks if a given value exists in the given aray
 *
 * @param value
 * @param {array} arr
 * @returns {boolean}
 */
export function inArray (value, arr) {
  return this.getType(arr) === 'array' && arr.indexOf(value) !== -1
}

/**
 *
 * @param value
 * @returns {string}
 */
export function getType (value) {
  const regex = /^\[object (\S+?)]$/,
    matches = Object.prototype.toString.call(value).match(regex) || []

  return (matches[1] || 'undefined').toLowerCase()
}

/**
 * Recursive merge two objects
 *
 * @param obj1
 * @param obj2
 * @returns {*}
 */
export function mergeRecursive (obj1, obj2) {
  for (const param in obj2) {
    try {
      if (obj2[param].constructor === Object) {
        obj1[param] = mergeRecursive(obj1[param], obj2[param])
      } else {
        obj1[param] = obj2[param]
      }
    } catch (e) {
      obj1[param] = obj2[param]
    }
  }
  return obj1
}

/**
 * Turns a string into a slug
 *
 * @param input
 * @returns {string}
 */
export function slugify (input) {
  input = input.replace(/^\s+|\s+$/g, '')
  input = input.toLowerCase()

  const from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;'
  const to = 'aaaaeeeeiiiioooouuuunc------'

  for (let i = 0, l = from.length; i < l; i++) {
    input = input.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i))
  }

  input = input.replace(/[^a-z\d -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  return input
}

/**
 * Takes an input and outputs a CSV-ready string
 *
 * @param {*} val
 * @returns {string}
 */
export function wrapCsvValue (val) {
  let formatted = val
  formatted = formatted === void 0 || formatted === null ? '' : String(formatted)
  formatted = formatted.split('"').join('""')
  return `"${formatted}"`
}

/**
 * Unescapes a string
 *
 * @param {string} val
 * @returns {string}
 */
export function unescapeString (val) {
  return val.replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n')
    .replace(/\\'/g, '\'')
    .replace(/\\"/g, '"')
    .replace(/\\&/g, '&')
    .replace(/\\\\/g, '\\')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\x2F/g, '/')
    .replace(/\\x3C/g, '<')
    .replace(/\\x3E/g, '>')
}
