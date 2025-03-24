import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "../styles/LoadingScreen.css"; // Using the existing CSS file

const LoadingScreen = ({ previousPhase, progress = 0 }) => {
  const [tip, setTip] = useState("");
  const [quote, setQuote] = useState({ text: "", author: "" });

  // Tips shown during loading
  const tips = [
    "Match your cards wisely during combat to trigger powerful abilities.",
    "Each hero class has unique strengths and weaknesses - consider your party composition carefully.",
    "Spade rooms contain elite monsters with better rewards.",
    "Heart rooms offer blessings that can heal or provide other benefits to your party.",
    "Diamond rooms contain merchants where you can spend your hard-earned gold.",
    "Club rooms contain standard monsters - a good way to earn gold and experience.",
    "Some weapons can be enchanted to gain additional abilities.",
    "Keep your heroes alive! A balanced party performs better than a single strong hero.",
    "The higher you climb the spire, the more difficult the challenges become.",
    "Different environment cards can significantly affect your combat effectiveness.",
  ];

  // Quotes for loading screen
  const quotes = [
    {
      text: "The journey to the stars begins with a single step upward.",
      author: "Astral Sage",
    },
    {
      text: "In the darkest depths of the spire, the brightest heroes shine.",
      author: "Guardian Proverb",
    },
    {
      text: "Time flows differently within the spire - be mindful of each decision.",
      author: "The Timebender",
    },
    {
      text: "The greatest weapon is not forged of metal, but of will and wit.",
      author: "Bladedancer Teaching",
    },
    {
      text: "Even the mightiest colossus can be felled by the clever tracker.",
      author: "Hunter's Wisdom",
    },
  ];

  // Choose a random tip and quote on initial render
  useEffect(() => {
    setTip(tips[Math.floor(Math.random() * tips.length)]);
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  // Get loading message based on previous phase
  const getLoadingMessage = () => {
    switch (previousPhase) {
      case "menu":
        return "Preparing your adventure...";
      case "setup":
        return "Setting up heroes...";
      case "adventureSetup":
        return "Packing supplies...";
      case "weaponChest":
        return "Forging weapons...";
      case "spireClimb":
        return "Exploring the spire...";
      case "combat":
        return "Engaging in battle...";
      case "merchant":
        return "Completing transaction...";
      case "gameOver":
        return "Preparing next journey...";
      default:
        return "Loading Skyward Ascent...";
    }
  };

  // Loading icon/symbol based on previous phase
  const getLoadingIcon = () => {
    switch (previousPhase) {
      case "menu":
        return "🎮";
      case "setup":
        return "👥";
      case "adventureSetup":
        return "🎒";
      case "weaponChest":
        return "⚔️";
      case "spireClimb":
        return "🏔️";
      case "combat":
        return "⚔️";
      case "merchant":
        return "💰";
      case "gameOver":
        return "🏆";
      default:
        return "🌟";
    }
  };

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-icon">
          <div className="spire-icon pulse">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, ease: "linear", repeat: Infinity }}
            >
              {getLoadingIcon()}
            </motion.div>
          </div>
        </div>

        <div className="loading-message">{getLoadingMessage()}</div>

        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3 }}
          ></motion.div>
        </div>

        <div className="loading-tip">
          <div className="tip-icon">💡</div>
          <p className="tip-text">{tip}</p>
        </div>

        <div className="loading-quote">
          <p className="quote-text">"{quote.text}"</p>
          <p className="quote-author">— {quote.author}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
