const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema({
  quizId: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    },
  ],
  active: {
    type: Boolean,
    default: false,
  },
  currentQuestion: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Quiz", QuizSchema);
