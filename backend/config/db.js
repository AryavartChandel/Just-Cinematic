const mongoose = require('mongoose')

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI is missing. Add it to backend/.env to enable MongoDB.')
    return
  }

  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB connected')
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

module.exports = connectDB
