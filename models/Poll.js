const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pollSchema = new Schema({
  title: String,
  creator: String,
  options: Object,
  voters: Array
}, { timestamp: true });

module.exports = mongoose.model('poll', pollSchema);
