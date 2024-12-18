// High-Level Flow for Real-Time Quiz

// 1. Backend Setup:
// - Node.js with Express for API and WebSocket endpoints.
// - Redis for real-time leaderboard storage and management.
// - MongoDB to store quiz data (questions, answers, metadata).

// 2. User Flow:
// - **Joining the Quiz:**
// - User enters a unique quiz ID and name
// - Backend verifies the ID and confirms participation. - Send name to Presentation page
// - **Quiz Start:**
// - Host starts the quiz using the Presentation Page.
// - First question is sent to all connected users and Presentation
// - **Answer Submission:**
// - Users submit answers in real-time via the User Page.
// - Server validates answers and updates scores in Redis. - Send question score, current score, ranking to user page
// - **Leaderboard Update:**
// - Server updates the leaderboard in Redis.
// - Leaderboard is pushed to Presentation page
// - **Question Transition:**
// - Button to move to the next question
// - **Final Leaderboard:**
// - At the end of the quiz, the final leaderboard is displayed.

# Real-Time Quiz Application API Specification

## Connection Details

### HTTP Base URL

```
http://localhost:3000/api
```

### WebSocket Connection

```javascript
const ws = new WebSocket("ws://localhost:3000");

ws.onopen = () => {
  console.log("Connected to server");
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle different message types based on data.type
};
```

## HTTP Endpoints

### Quiz Management

#### Create Quiz

```http
POST /quiz

Request Body:
{
  "quizId": "string",
  "title": "string",
  "questions": [
    {
      "question": "string",
      "options": ["string"],
      "correctAnswer": number,  // 0-based index
      "timeLimit": number,      // seconds
      "points": number
    }
  ]
}

Response: 201
{
  "quizId": "string",
  "title": "string",
  "active": boolean,
  "currentQuestion": number
}
```

#### Get Quiz

```http
GET /quiz/:quizId

Response: 200
{
  "quizId": "string",
  "title": "string",
  "active": boolean,
  "currentQuestion": number,
  "questions": [Question]
}
```

#### Start Quiz

```http
POST /quiz/:quizId/start

Response: 200
{
  "message": "Quiz started successfully",
  "currentQuestion": {
    "id": "string",
    "text": "string",
    "options": ["string"],
    "timeLimit": number
  }
}
```

#### Next Question

```http
POST /quiz/:quizId/next

Response: 200
{
  "message": "Moving to next question",
  "currentQuestion": {
    "id": "string",
    "text": "string",
    "options": ["string"],
    "timeLimit": number
  },
  "questionNumber": number,    // 1-based index
  "totalQuestions": number
}

// When quiz ends:
{
  "message": "Quiz completed",
  "leaderboard": [
    {
      "name": "string",
      "score": number
    }
  ]
}
```

## WebSocket Events

### Client -> Server Events

#### Join Quiz

```javascript
// Send when user wants to join a quiz
{
  "type": "JOIN_QUIZ",
  "quizId": "string",
  "userName": "string"
}

// Example:
ws.send(JSON.stringify({
  type: "JOIN_QUIZ",
  quizId: "DEMO123",
  userName: "John"
}));
```

#### Submit Answer

```javascript
// Send when user submits an answer
{
  "type": "SUBMIT_ANSWER",
  "quizId": "string",
  "userName": "string",
  "answer": number,      // 0-based index of the selected option
  "questionId": "string"
}

// Example:
ws.send(JSON.stringify({
  type: "SUBMIT_ANSWER",
  quizId: "DEMO123",
  userName: "John",
  answer: 2,
  questionId: "question_id_here"
}));
```

### Server -> Client Events

#### Join Response

```javascript
// Received after JOIN_QUIZ
{
  "type": "JOINED_QUIZ",
  "userName": "string",
  "quizId": "string"
}

// Example handler:
if (data.type === "JOINED_QUIZ") {
  console.log(`${data.userName} joined quiz ${data.quizId}`);
}
```

#### Error Response

```javascript
// Received when an error occurs
{
  "type": "ERROR",
  "message": "string"
}

// Example handler:
if (data.type === "ERROR") {
  console.error(data.message);
}
```

#### New Question

```javascript
// Received when a new question starts
{
  "type": "NEW_QUESTION",
  "question": {
    "id": "string",
    "text": "string",
    "options": ["string"],
    "timeLimit": number
  }
}

// Example handler:
if (data.type === "NEW_QUESTION") {
  displayQuestion(data.question);
  startTimer(data.question.timeLimit);
}
```

#### Answer Result

```javascript
// Received after submitting an answer
{
  "type": "ANSWER_RESULT",
  "correct": boolean,
  "score": number,
  "leaderboard": [
    {
      "name": "string",
      "score": number
    }
  ]
}

// Example handler:
if (data.type === "ANSWER_RESULT") {
  showResult(data.correct);
  updateScore(data.score);
  updateLeaderboard(data.leaderboard);
}
```

#### Leaderboard Update

```javascript
// Received when leaderboard changes
{
  "type": "LEADERBOARD_UPDATE",
  "leaderboard": [
    {
      "name": "string",
      "score": number
    }
  ]
}

// Example handler:
if (data.type === "LEADERBOARD_UPDATE") {
  updateLeaderboard(data.leaderboard);
}
```

#### Quiz End

```javascript
// Received when quiz ends
{
  "type": "QUIZ_END",
  "leaderboard": [
    {
      "name": "string",
      "score": number
    }
  ]
}

// Example handler:
if (data.type === "QUIZ_END") {
  showFinalResults(data.leaderboard);
}
```

## Implementation Example

### Frontend Setup

```javascript
class QuizClient {
  constructor(quizId, userName) {
    this.quizId = quizId;
    this.userName = userName;
    this.ws = new WebSocket("ws://localhost:3000");
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.ws.onopen = () => {
      this.joinQuiz();
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.ws.onclose = () => {
      console.log("Disconnected from server");
      // Implement reconnection logic here
    };
  }

  joinQuiz() {
    this.ws.send(
      JSON.stringify({
        type: "JOIN_QUIZ",
        quizId: this.quizId,
        userName: this.userName,
      })
    );
  }

  submitAnswer(answer, questionId) {
    this.ws.send(
      JSON.stringify({
        type: "SUBMIT_ANSWER",
        quizId: this.quizId,
        userName: this.userName,
        answer,
        questionId,
      })
    );
  }

  handleMessage(data) {
    switch (data.type) {
      case "JOINED_QUIZ":
        break;
      case "NEW_QUESTION":
        this.displayQuestion(data.question);
        break;
      case "ANSWER_RESULT":
        this.showResult(data.correct, data.score);
        this.updateLeaderboard(data.leaderboard);
        break;
      case "QUIZ_END":
        this.showFinalResults(data.leaderboard);
        break;
      case "ERROR":
        console.error(data.message);
        break;
    }
  }
}
```

### Usage Example

```javascript
// Create quiz instance
const quiz = new QuizClient("DEMO123", "John");

// Host controls
async function startQuiz() {
  const response = await fetch("http://localhost:3000/api/quiz/DEMO123/start", {
    method: "POST",
  });
  const data = await response.json();
}

async function nextQuestion() {
  const response = await fetch("http://localhost:3000/api/quiz/DEMO123/next", {
    method: "POST",
  });
  const data = await response.json();
}
```

## Notes

- All HTTP responses may return appropriate error status codes (400, 404, 500) with error messages
- WebSocket connections should implement reconnection logic for reliability
- Time limits are in seconds
- Answer indices are 0-based (0 to options.length-1)
- Question numbers in HTTP responses are 1-based for display purposes
- Implement proper error handling for both HTTP and WebSocket connections
- Consider implementing a heartbeat mechanism for WebSocket connections
- Handle WebSocket reconnection gracefully
