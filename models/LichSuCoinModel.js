const mongoose = require('mongoose')

const lichsucoinSchema = new mongoose.Schema({
  content: { type: String },
  coin: { type: Number },
  method: { type: String },
  chap: { type: mongoose.Schema.Types.ObjectId, ref: 'chapter' },
  manga: { type: mongoose.Schema.Types.ObjectId, ref: 'manga' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  date: { type: Date },
  status: { type: Number, default: 0 }
})

const lichsucoin = mongoose.model('lichsucoin', lichsucoinSchema)
module.exports = lichsucoin
