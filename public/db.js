// IndexedDB stuff here
let db
let budgetVersion

// open database
const request = indexedDB.open('budgieDB', budgetVersion || 21)

// onupgrade needed incase we need to update schema / database version
request.onupgradeneeded = (e) => {
  console.log('[IndexedDB] upgrade needed in budgieDB')

  const { oldVersion } = e
  const newVersion = e.newVersion || db.newVersion

  console.log(`[IndexedDB] DB Updated from version ${oldVersion} to ${newVersion}`)

  db = e.target.result

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('budgieStore', { autoIncrement: true })
  }
}

// onerror handler
request.onerror = (e) => {
  console.log(e.target.errorCode)
}

// function to check database
const checkDatabase = () => {
  console.log('[IndexedDB] Check DB Invoked')

  // open transaction
  let transaction = db.transaction(['budgieStore'], 'readwrite')

  // specify obj store
  const store = transaction.objectStore('budgieStore')

  // get all items from obj store
  const getAll = store.getAll()

  // if getAll is successful
  // create a fetch post request to bulk add data to the backend db
  getAll.onsuccess = async () => {
    if (getAll.result.length > 0) {
      const response = await fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        }
      })
      const res = await response.json()
      if (res.length !== 0) {
        // if response is good then clear items from obj store
        transaction = db.transaction(['budgieStore'], 'readwrite')

        const store = transaction.objectStore('budgieStore')

        store.clear()
        console.log('[IndexedDB] Clearing Store')
      }
    }
  }
}

// onsuccess handler
request.onsuccess = (e) => {
  console.log('[IndexedDB] Success')
  db = e.target.result // specify pointer to indexeddb

  if (navigator.online) {
    // if navigator online then check database function
    console.log('[IndexedDB] Backend Online')
    checkDatabase()
  }
}

// function to save to indexedDB
export const saveRecord = record => {
  console.log('[IndexedDB] Save record invoked')
  // open transaction
  const transaction = db.transaction(['budgieStore'], 'readwrite')

  // specify store
  const store = transaction.objectStore('budgieStore')

  // add to store
  store.add(record)
}

// event listener, when online check database function
window.addEventListener('online', checkDatabase)
