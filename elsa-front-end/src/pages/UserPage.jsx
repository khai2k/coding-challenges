import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const UserPage = () => {
  const [userName, setUserName] = useState("");
  const [quizId, setQuizId] = useState("");
  const [joined, setJoined] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userScore, setUserScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [socket, setSocket] = useState(null);
  const [finalRanking, setFinalRanking] = useState(null);
  const [lastQuestionScore, setLastQuestionScore] = useState(null);

  useEffect(() => {
    const newSocket = io("http://localhost:4000");
    setSocket(newSocket);

    newSocket.on("JOINED_QUIZ", (data) => {
      setJoined(true);
    });

    newSocket.on("NEW_QUESTION", (question) => {
      setCurrentQuestion(question.question);
      setSelectedAnswer(null);
      setLastResult(null);
      setLastQuestionScore(null);
    });

    newSocket.on("ANSWER_RESULT", (data) => {
      setLastResult(data.correct);
      setUserScore(data.totalScore);
      setLastQuestionScore(data.questionScore);
    });

    newSocket.on("QUIZ_END", (data) => {
      setCurrentQuestion(null);
      setFinalRanking(data.leaderboard);
    });

    newSocket.on("ERROR", (data) => {
      alert(data.message);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (socket) {
      socket.emit("JOIN_QUIZ", {
        quizId,
        userName,
      });
    }
  };

  const handleAnswerSubmit = (answerIndex) => {
    if (!currentQuestion || selectedAnswer !== null || !socket) return;

    setSelectedAnswer(answerIndex);
    socket.emit("SUBMIT_ANSWER", {
      quizId,
      userName,
      answer: answerIndex,
      questionId: currentQuestion.id,
    });
  };

  return (
    <div className="user-page">
      {!joined ? (
        <div className="join-form">
          <h2>Join Quiz</h2>
          <form onSubmit={handleJoin}>
            <div>
              <label>Quiz ID:</label>
              <input
                type="text"
                value={quizId}
                onChange={(e) => setQuizId(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Your Name:</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>
            <button type="submit">Join</button>
          </form>
        </div>
      ) : (
        <div className="quiz-interface">
          <div className="user-info">
            <h2>Welcome, {userName}</h2>
            <div className="score-info">
              <p className="total-score">Total Score: {userScore}</p>
              {lastQuestionScore !== null && (
                <div
                  className={`last-question-score ${
                    lastResult ? "correct" : "incorrect"
                  }`}
                >
                  <p>Last Question: {lastQuestionScore} points</p>
                  <div className="score-badge">
                    {lastResult ? "+" : ""}
                    {lastQuestionScore}
                  </div>
                </div>
              )}
            </div>
          </div>

          {currentQuestion ? (
            <div className="question-section">
              <h3>Question:</h3>
              <p>{currentQuestion.text}</p>
              <div className="options">
                {currentQuestion?.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSubmit(index)}
                    disabled={selectedAnswer !== null}
                    className={selectedAnswer === index ? "selected" : ""}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {lastResult !== null && (
                <div
                  className={`result ${lastResult ? "correct" : "incorrect"}`}
                >
                  <p>{lastResult ? "Correct!" : "Incorrect!"}</p>
                  <p className="points">
                    {lastQuestionScore > 0
                      ? `+${lastQuestionScore}`
                      : lastQuestionScore}{" "}
                    points
                  </p>
                </div>
              )}
            </div>
          ) : finalRanking ? (
            <div className="final-results">
              <h2>Quiz Completed!</h2>
              <div className="final-ranking">
                <h3>Final Rankings</h3>
                <div className="ranking-list">
                  {finalRanking.map((player, index) => (
                    <div
                      key={index}
                      className={`ranking-item ${
                        player.name === userName ? "current-user" : ""
                      }`}
                    >
                      <div className="rank">{index + 1}</div>
                      <div className="player-info">
                        <span className="player-name">{player.name}</span>
                        <span className="player-score">
                          {player.score} points
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="your-position">
                  {finalRanking.findIndex(
                    (player) => player.name === userName
                  ) + 1}
                  th place
                </div>
              </div>
            </div>
          ) : (
            <div className="waiting">Waiting for the next question...</div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserPage;
