import { MongoClient } from 'mongodb'

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set')
  throw new Error('Please add your Mongo URI to .env')
}

console.log('Attempting to connect to MongoDB...')
const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
      .then(client => {
        console.log('Successfully connected to MongoDB')
        // Initialize collections if they don't exist
        const db = client.db('jstreak')
        return Promise.all([
          db.collection('journals').createIndex({ username: 1, date: 1 }, { unique: true }),
          db.collection('users').createIndex({ username: 1 }, { unique: true })
        ]).then(() => client)
      })
      .catch(err => {
        console.error('Failed to connect to MongoDB:', err)
        throw err
      })
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
    .then(client => {
      console.log('Successfully connected to MongoDB')
      // Initialize collections if they don't exist
      const db = client.db('jstreak')
      return Promise.all([
        db.collection('journals').createIndex({ username: 1, date: 1 }, { unique: true }),
        db.collection('users').createIndex({ username: 1 }, { unique: true })
      ]).then(() => client)
    })
    .catch(err => {
      console.error('Failed to connect to MongoDB:', err)
      throw err
    })
}

export default clientPromise
