const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  hospitalId: String,
  item: String,
  quantity: Number,
  urgency: { type: String, default: 'normal' },
  status: { type: String, default: 'pending' }
});

module.exports = mongoose.model('Request', RequestSchema);
