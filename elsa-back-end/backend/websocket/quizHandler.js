const { redisClient } = require("../config/db");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");

const initializeSocketIO = (io) => {
  // Store IO instance globally for use in HTTP routes
  global.io = io;

  io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("JOIN_QUIZ", async (data) => {
      await handleJoinQuiz(socket, data);
    });

    socket.on("SUBMIT_ANSWER", async (data) => {
      await handleSubmitAnswer(socket, data);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
};

async function handleJoinQuiz(socket, data) {
  const { quizId, userName, isHost } = data;
  try {
    if (isHost) {
      // Join the quiz room
      socket.join(quizId);
    } else {
      const quiz = await Quiz.findOne({ quizId });
      if (!quiz) {
        socket.emit("ERROR", { message: "Quiz not found" });
        return;
      }

      // Join the quiz room
      socket.join(quizId);

      // Store user in Redis
      await redisClient.hSet(`quiz:${quizId}:users`, userName, "0");

      console.log("Joined quiz room", quizId);

      io.to(quizId).emit("JOINED_QUIZ", {
        userName,
        quizId,
      });
    }
  } catch (error) {
    console.error("Error joining quiz:", error);
    socket.emit("ERROR", { message: "Failed to join quiz" });
  }
}

async function handleSubmitAnswer(socket, data) {
  const { quizId, userName, answer, questionId } = data;
  try {
    // Validate answer and update score
    const question = await Question.findById(questionId);
    const isCorrect = question.correctAnswer === answer;
    const questionScore = isCorrect ? question.points : 0;

    // Get current total score
    const currentTotal = await redisClient.hGet(
      `quiz:${quizId}:users`,
      userName
    );
    // Calculate new total
    const totalScore = parseInt(currentTotal) + questionScore;
    // Update total score in Redis
    await redisClient.hSet(
      `quiz:${quizId}:users`,
      userName,
      totalScore.toString()
    );

    // Get updated leaderboard
    const leaderboard = await getLeaderboard(quizId);

    // Send score update to user
    socket.emit("ANSWER_RESULT", {
      correct: isCorrect,
      questionScore, // Score for this question
      totalScore, // Total accumulated score
    });

    // Broadcast leaderboard to all users in the quiz room
    io.to(quizId).emit("LEADERBOARD_UPDATE", {
      leaderboard,
    });
  } catch (error) {
    console.error("Error handling answer:", error);
    socket.emit("ERROR", { message: "Failed to process answer" });
  }
}

async function getLeaderboard(quizId) {
  const scores = await redisClient.hGetAll(`quiz:${quizId}:users`);
  return Object.entries(scores)
    .map(([name, score]) => ({ name, score: parseInt(score) }))
    .sort((a, b) => b.score - a.score);
}

// Function to broadcast to specific quiz room
function broadcastToQuiz(quizId, eventName, data) {
  io.to(quizId).emit(eventName, data);
}

module.exports = initializeSocketIO;
module.exports.broadcastToQuiz = broadcastToQuiz;
