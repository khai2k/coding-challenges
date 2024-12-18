import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import PresentationPage from "./pages/PresentationPage";
import UserPage from "./pages/UserPage";
import "./styles/quiz.css";

function App() {
  return (
    <BrowserRouter>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/presentation">Presentation</Link>
            </li>
            <li>
              <Link to="/join">Join Quiz</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/presentation" element={<PresentationPage />} />
          <Route path="/join" element={<UserPage />} />
          <Route path="/" element={<UserPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
