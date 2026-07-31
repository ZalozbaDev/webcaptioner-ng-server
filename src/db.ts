import mongoose from 'mongoose'

const buildMongoUri = () => {
  const { MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_HOST, MONGODB_DATABASE } =
    process.env

  if (!MONGODB_USERNAME || !MONGODB_PASSWORD || !MONGODB_HOST || !MONGODB_DATABASE) {
    throw new Error(
      'Missing MongoDB config: MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_HOST, MONGODB_DATABASE are required'
    )
  }

  const user = encodeURIComponent(MONGODB_USERNAME)
  const pass = encodeURIComponent(MONGODB_PASSWORD)
  return `mongodb://${user}:${pass}@${MONGODB_HOST}/${MONGODB_DATABASE}`
}

export const connectDB = async () => {
  try {
    await mongoose.connect(buildMongoUri())
    console.log('🚀 Connected to MongoDB')
  } catch (error) {
    console.log('❌ Error connecting to MongoDB:', error)
    process.exit(1)
  }
}
