var mongoose = require('mongoose')
var passwordHash = require('password-hash');


// mongoose.Promise = global.Promise;

const AdminSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  fullname: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    unique: true,
    required: false,
  },
  password: {
    type: String,
    required: true,
  },

  token: {
    type: String,
    required: false,
    unique: true,
  },
  image: {
    type: String,
    required: false,
    default: 'https://eshendetesia.com/images/user-profile.png'
  },
  isDelete: {
    type: Boolean,
    required: false,
    default: false
  }
});

AdminSchema.methods.comparePassword = function (candidatePassword) {
  return passwordHash.verify(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', AdminSchema);