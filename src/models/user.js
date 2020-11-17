const mongoose = require('mongoose');
const { Schema } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'name is mandatory'],
    },
    email: {
        type: String,
        default: '',
        required: [true, 'emailid is mandatory'],
        unique : true,
    },
    password: {
        type: String,
        default: '',
        required: [true, 'password is mandatory'],
    },
    DOB: {
        type: Date,
        default: '',
    },
  }
);
userSchema.plugin(uniqueValidator);
const user = mongoose.model('user', userSchema);

module.exports= user;
