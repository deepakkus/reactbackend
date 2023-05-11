var mongoose = require('mongoose')
var passwordHash = require('password-hash');

const CategorySchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        required: true,
    },
    createdOn: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    isDelete: {
        type: Boolean,
        required: false,
        default: false
      }
});

module.exports = mongoose.model('Category', CategorySchema);