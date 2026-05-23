/**
 * migrate_verdict.js
 * Sets personalRating = 'Great' for all watched movies that have no verdict yet.
 * Run once: node migrate_verdict.js
 */

require('dotenv').config()
const mongoose = require('mongoose')

const movieSchema = new mongoose.Schema(
  {
    title: String,
    watched: Boolean,
    personalRating: String,
  },
  { timestamps: true, strict: false }
)
const Movie = mongoose.model('Movie', movieSchema)

async function main() {
  console.log('🔌 Connecting to MongoDB...')
  await mongoose.connect(process.env.MONGO_URI)
  console.log('✅ Connected\n')

  const result = await Movie.updateMany(
    { watched: true, personalRating: { $in: [null, '', undefined] } },
    { $set: { personalRating: 'Great' } }
  )

  console.log(`✅ Updated ${result.modifiedCount} watched movies → verdict: Great`)
  await mongoose.disconnect()
  console.log('Done!')
}

main().catch((err) => { console.error(err); process.exit(1) })
