const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const { redisClient } = require("../config/db");

// Create a new quiz
router.post("/quiz", async (req, res) => {
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get quiz by ID
router.get("/quiz/:quizId", async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ quizId: req.params.quizId });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start quiz endpoint
router.post("/quiz/:quizId/start", async (req, res) => {
  const { quizId } = req.params;
  try {
    const quiz = await Quiz.findOne({ quizId }).populate("questions");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    quiz.active = true;
    quiz.currentQuestion = 0;
    await quiz.save();

    // Get the first question
    const question = quiz.questions[0];

    // Broadcast to all Socket.IO clients in the quiz room
    global.io &&
      global.io.to(quizId).emit("NEW_QUESTION", {
        question: {
          id: question._id,
          text: question.question,
          options: question.options,
          timeLimit: question.timeLimit,
          questionNumber: quiz.currentQuestion + 1,
          totalQuestions: quiz.questions.length,
        },
      });

    res.json({
      message: "Quiz started successfully",
      currentQuestion: question,
    });
  } catch (error) {
    console.error("Error starting quiz:", error);
    res.status(500).json({ message: "Failed to start quiz" });
  }
});

// Move to next question endpoint
router.post("/quiz/:quizId/next", async (req, res) => {
  const { quizId } = req.params;
  try {
    const quiz = await Quiz.findOne({ quizId }).populate("questions");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Check if quiz is active
    if (!quiz.active) {
      return res.status(400).json({ message: "Quiz is not active" });
    }

    // Check if we've reached the end of questions
    if (quiz.currentQuestion >= quiz.questions.length - 1) {
      // End the quiz
      quiz.active = false;
      await quiz.save();

      // Get final leaderboard
      const leaderboard = await getLeaderboard(quizId);

      // Broadcast quiz end to all clients in the quiz room
      global.io &&
        global.io.to(quizId).emit("QUIZ_END", {
          leaderboard,
        });

      return res.json({
        message: "Quiz completed",
        leaderboard,
      });
    }

    // Move to next question
    quiz.currentQuestion += 1;
    await quiz.save();

    const nextQuestion = quiz.questions[quiz.currentQuestion];

    // Broadcast new question to all clients in the quiz room
    global.io &&
      global.io.to(quizId).emit("NEW_QUESTION", {
        question: {
          id: nextQuestion._id,
          text: nextQuestion.question,
          options: nextQuestion.options,
          timeLimit: nextQuestion.timeLimit,
        },
      });

    res.json({
      message: "Moving to next question",
      currentQuestion: nextQuestion,
      questionNumber: quiz.currentQuestion + 1,
      totalQuestions: quiz.questions.length,
    });
  } catch (error) {
    console.error("Error moving to next question:", error);
    res.status(500).json({ message: "Failed to move to next question" });
  }
});

// Add this function after the routes
async function getLeaderboard(quizId) {
  const scores = await redisClient.hGetAll(`quiz:${quizId}:users`);
  return Object.entries(scores)
    ?.map(([name, score]) => ({ name, score: parseInt(score) }))
    .sort((a, b) => b.score - a.score);
}

module.exports = router;
