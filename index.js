import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/main.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// Initialize the game engine
import GameEngine from "./GameEngine";
GameEngine.initGame({ debug: false })
  .then(() => {
    console.log("Game engine initialized");
  })
  .catch((error) => {
    console.error("Game engine initialization failed:", error);
  });

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
