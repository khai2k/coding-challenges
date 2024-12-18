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
