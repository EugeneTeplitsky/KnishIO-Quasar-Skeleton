import Dexie from 'dexie'

export function connectionDB () {
  // Declaring indexedDB database
  const db = new Dexie('KnishIO')

  // Declare tables, IDs and indexes
  db.version(1)
    .stores({
      store: '++key, value'
    })

  return db
}

/**
 * Retrieve a field from IndexDb
 *
 * @param db
 * @param field
 * @param store
 * @returns {Promise|Q.Promise<any>|Dexie.Promise<any>|Promise<postcss.Result>|undefined}
 */
export function getDataPromise (db, field, store = 'store') {
  return db[store]
    .get({
      key: field
    })
    .then(function (foundData) {
      if (foundData) {
        return foundData.value
      } else return false
    })
    .catch(err => {
      console.error(err)
    })
}

/**
 * Update a field in IndexDb with new data
 *
 * @param db
 * @param field
 * @param newValue
 * @param store
 * @returns {Promise<T>}
 */
export async function setDataPromise (db, field, newValue, store = 'store') {
  return db[store].put({
    key: field,
    value: newValue
  })
    .catch(err => {
      console.error(err)
    })
}

/**
 * Delete a field from IndexDb
 *
 * @param db
 * @param field
 * @param store
 * @returns {Promise<T>}
 */
export async function deleteDataPromise (db, field, store = 'store') {
  return db[store].delete(field)
    .catch(err => {
      console.error(err)
    })
}
