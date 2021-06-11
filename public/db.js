// IndexedDB stuff here
let db // global db variable
let budgetVersion // global db version

// open database
const request = indexedDB.open('budgieDB', budgetVersion || 21)

// onupgrade needed incase we need to update schema / database version
request.onupgradeneeded = (e) => {
  console.log('[IndexedDB] upgrade needed in budgieDB')

  const { oldVersion } = e
  const newVersion = e.newVersion || db.newVersion

  console.log(`[IndexedDB] DB Updated from version ${oldVersion} to ${newVersion}`)

  db = e.target.result // specify db to work on globally

  if (db.objectStoreNames.length === 0) { // if there are no object stores
    // create the object store and have an autoincrement index
    db.createObjectStore('budgieStore', { autoIncrement: true })
  }
}

// onerror handler to capture any errors
request.onerror = (e) => {
  console.log(e.target.errorCode)
}

// function to check database which is run when onsuccess is triggered
// used to send offline indexedDB data into the backend db
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
        // meaning that data was successfully sent to the backend
        transaction = db.transaction(['budgieStore'], 'readwrite')

        const store = transaction.objectStore('budgieStore')

        store.clear()
        console.log('[IndexedDB] Clearing Store')
      }
    }
  }
}

// onsuccess handler, if the database successfully opened
request.onsuccess = (e) => {
  console.log('[IndexedDB] Success')
  db = e.target.result // specify pointer to indexeddb

  if (navigator.online) {
    // if navigator online/browser is connected to the backend then run checkDatabase
    console.log('[IndexedDB] Backend Online')
    checkDatabase()
  }
}

// function to save to indexedDB,
// called on when the browser cannot fetch from the backend
const saveRecord = record => {
  console.log('[IndexedDB] Save record invoked')
  // open transaction
  const transaction = db.transaction(['budgieStore'], 'readwrite')

  // specify store
  const store = transaction.objectStore('budgieStore')

  // add to store
  store.add(record)
}

// event listener, when online run checkDatabase function
window.addEventListener('online', checkDatabase)
