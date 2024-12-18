require("dotenv").config({ path: "../../.env" });
const mongoose = require("mongoose");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const { connectMongoDB } = require("../config/db");

const sampleQuestions = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2, // Paris (0-based index)
    timeLimit: 30,
    points: 1000,
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1, // Mars
    timeLimit: 30,
    points: 1000,
  },
  {
    question: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctAnswer: 1, // 4
    timeLimit: 15,
    points: 500,
  },
  {
    question: "Who painted the Mona Lisa?",
    options: [
      "Vincent van Gogh",
      "Pablo Picasso",
      "Leonardo da Vinci",
      "Michelangelo",
    ],
    correctAnswer: 2, // Leonardo da Vinci
    timeLimit: 30,
    points: 1000,
  },
];

const sampleQuiz = {
  quizId: "DEMO123",
  title: "Sample Quiz",
  active: false,
  currentQuestion: 0,
};

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Clear existing data
    await Quiz.deleteMany({});
    await Question.deleteMany({});

    // Create questions
    const createdQuestions = await Question.create(sampleQuestions);

    // Create quiz with references to questions
    const quiz = new Quiz({
      ...sampleQuiz,
      questions: createdQuestions.map((q) => q._id),
    });
    await quiz.save();

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
