const mongoose = require('mongoose');

const { Schema } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');
var moment = require('moment');

const questionSchema = new Schema(
  {
    title: {
        type: String,
        required: [true, 'Question Title is mandatory'],
      },
    questionText: {
      type: String,
      required: [true, 'Question Text is mandatory'],
    },
    askedBy: {
      },
      
    postDate: {
        type:String,
        default:moment().format("dddd, MMMM Do YYYY, h:mm:ss a")
    },
    tags : [],
    answers: [],
    acceptStatus :{
      type:String,
      default:'false'
  }
  }
);
questionSchema.plugin(uniqueValidator);
const question = mongoose.model('question', questionSchema);

module.exports = question;
