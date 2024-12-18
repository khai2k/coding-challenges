import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const PresentationPage = () => {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [quizStatus, setQuizStatus] = useState("idle"); // idle, active, completed
  const [socket, setSocket] = useState(null);
  const [joinedUsers, setJoinedUsers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0); // Add this for countdown
  const [finalRanking, setFinalRanking] = useState(null); // Add this state
  const [showingLeaderboard, setShowingLeaderboard] = useState(false);
  const [intermissionTime, setIntermissionTime] = useState(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    const newSocket = io("http://localhost:4000");
    setSocket(newSocket);

    if (newSocket) {
      newSocket.emit("JOIN_QUIZ", {
        quizId: "DEMO123",
        isHost: true,
      });
    }

    // Socket event listeners
    newSocket.on("NEW_QUESTION", (question) => {
      setShowingLeaderboard(false);
      // Check if question has nested structure
      const questionData = question.question || question;
      setCurrentQuestion(questionData);
      setTimeLeft(questionData.timeLimit);
      setCurrentQuestionNumber(questionData.questionNumber);
      setTotalQuestions(questionData.totalQuestions);
    });

    newSocket.on("LEADERBOARD_UPDATE", (data) => {
      setLeaderboard(data.leaderboard);
    });

    newSocket.on("QUIZ_END", (data) => {
      setQuizStatus("completed");
      setLeaderboard(data.leaderboard);
      setFinalRanking(data.leaderboard); // Set final ranking
      setTimeLeft(0); // Reset timer when quiz ends
    });

    newSocket.on("JOINED_QUIZ", (data) => {
      setJoinedUsers((prevUsers) => {
        if (!prevUsers.some((user) => user.userName === data.userName)) {
          return [
            ...prevUsers,
            { userName: data.userName, quizId: data.quizId },
          ];
        }
        return prevUsers;
      });
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  // Question timer effect
  useEffect(() => {
    let timer;
    if (timeLeft > 0 && quizStatus === "active" && !showingLeaderboard) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            showLeaderboardIntermission();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [timeLeft, quizStatus, showingLeaderboard]);

  // Intermission timer effect
  useEffect(() => {
    let timer;
    if (intermissionTime > 0 && showingLeaderboard) {
      timer = setInterval(() => {
        setIntermissionTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            nextQuestion();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [intermissionTime, showingLeaderboard]);

  const startQuiz = async () => {
    try {
      const response = await fetch(
        "http://localhost:4000/api/quiz/DEMO123/start",
        {
          method: "POST",
        }
      );
      const data = await response.json();
      setQuizStatus("active");

      setTimeLeft(data.currentQuestion.timeLimit); // Set initial time
    } catch (error) {
      console.error("Error starting quiz:", error);
    }
  };

  const nextQuestion = async () => {
    try {
      const response = await fetch(
        "http://localhost:4000/api/quiz/DEMO123/next",
        {
          method: "POST",
        }
      );
      const data = await response.json();

      if (data.message === "Quiz completed") {
        setQuizStatus("completed");
        setLeaderboard(data.leaderboard);
        setTimeLeft(0);
      }
    } catch (error) {
      console.error("Error moving to next question:", error);
    }
  };

  const showLeaderboardIntermission = () => {
    setShowingLeaderboard(true);
    setIntermissionTime(10); // Set 10 seconds intermission
  };

  // Helper function to format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="presentation-page">
      <h1>Quiz Presentation</h1>

      <div className="joined-users">
        <h3>Joined Users ({joinedUsers.length})</h3>
        <ul>
          {joinedUsers?.map((user, index) => (
            <li key={index}>
              {user.userName} - {user.quizId}
            </li>
          ))}
        </ul>
      </div>

      {quizStatus === "idle" && (
        <button onClick={startQuiz} className="start-button">
          Start Quiz
        </button>
      )}

      {quizStatus === "active" && !showingLeaderboard && currentQuestion && (
        <div className="question-section">
          <div className="question-header">
            <h2>
              Question {currentQuestionNumber} of {totalQuestions}
            </h2>
          </div>
          <div className="timer-container">
            <div className={`timer ${timeLeft <= 5 ? "timer-warning" : ""}`}>
              Time remaining: {formatTime(timeLeft)}
            </div>
            <div className="progress-bar">
              <div
                className="progress"
                style={{
                  width: `${(timeLeft / currentQuestion.timeLimit) * 100}%`,
                }}
              ></div>
            </div>
          </div>
          <div className="question-content">
            <p className="question-text">
              {currentQuestion?.text || "Loading question..."}
            </p>
            <ul className="question-options">
              {currentQuestion?.options?.map((option, index) => (
                <li key={index} className="option-item">
                  <span className="option-letter">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {showingLeaderboard && quizStatus === "active" && (
        <div className="intermission-leaderboard">
          <h2>Current Standings</h2>
          <div className="timer-container">
            <div
              className={`timer ${
                intermissionTime <= 3 ? "timer-warning" : ""
              }`}
            >
              Next question in: {intermissionTime}s
            </div>
            <div className="progress-bar">
              <div
                className="progress"
                style={{
                  width: `${(intermissionTime / 10) * 100}%`,
                }}
              ></div>
            </div>
          </div>
          <div className="ranking-list">
            {leaderboard?.map((player, index) => (
              <div key={index} className="ranking-item">
                <div className="rank">{index + 1}</div>
                <div className="player-info">
                  <span className="player-name">{player.name}</span>
                  <span className="player-score">{player.score} points</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {quizStatus === "completed" && finalRanking ? (
        <div className="final-results">
          <h2>Quiz Completed!</h2>
          <div className="final-ranking">
            <h3>Final Rankings</h3>
            <div className="ranking-list">
              {finalRanking.map((player, index) => (
                <div key={index} className="ranking-item">
                  <div className="rank">{index + 1}</div>
                  <div className="player-info">
                    <span className="player-name">{player.name}</span>
                    <span className="player-score">{player.score} points</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="leaderboard">
          <h2>Leaderboard</h2>
          <ul>
            {leaderboard?.map((player, index) => (
              <li key={index}>
                {player.name} - {player.score} points
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PresentationPage;
