const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: [
    {
      type: String,
      required: true,
    },
  ],
  correctAnswer: {
    type: Number,
    required: true,
  },
  timeLimit: {
    type: Number,
    default: 30,
  },
  points: {
    type: Number,
    default: 1000,
  },
});

module.exports = mongoose.model("Question", QuestionSchema);
