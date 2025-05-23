const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BlacklistedTokenSchema = new Schema({
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true }
});

module.exports = mongoose.model('BlacklistedToken', BlacklistedTokenSchema);