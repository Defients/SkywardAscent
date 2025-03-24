import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./styles/GameMenu.css";
import PlaceholderUtils from "./PlaceholderUtils";

// Create placeholder images since we don't have access to the actual assets
const menuBackgroundImg = PlaceholderUtils.createPlaceholder(
  "Menu Background",
  1920,
  1080,
  "#0B1622"
);
const starsImg = PlaceholderUtils.createPlaceholder(
  "Stars Background",
  1920,
  1080,
  "#000000"
);
const logoImg = PlaceholderUtils.createPlaceholder(
  "Skyward Ascent Logo",
  400,
  200,
  "#16213E"
);

const GameMenu = ({
  onStartNewGame,
  onLoadGame,
  onShowTutorial,
  onUpdateSettings,
  settings,
  hasSavedGame,
}) => {
  // State management
  const [currentView, setCurrentView] = useState("main");
  const [showCredits, setShowCredits] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [newSettings, setNewSettings] = useState({ ...settings });
  const [activeButton, setActiveButton] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [infoContent, setInfoContent] = useState("");

  // For parallax effect animation
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [starOpacity, setStarOpacity] = useState(0.7);

  // Track mouse movement for parallax effect with throttling
  useEffect(() => {
    let lastUpdate = 0;
    const THROTTLE_MS = 30; // 30ms throttle for smoother performance

    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastUpdate > THROTTLE_MS) {
        setMousePosition({
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight,
        });
        lastUpdate = now;
      }
    };

    // Add breathing animation effect to stars
    const starBreathingInterval = setInterval(() => {
      setStarOpacity((prev) => {
        const newOpacity = prev + (Math.random() * 0.04 - 0.02); // Random drift
        return Math.max(0.5, Math.min(0.9, newOpacity)); // Clamp between 0.5 and 0.9
      });
    }, 500);

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(starBreathingInterval);
    };
  }, []);

  // Handle starting a new game with enhanced feedback
  const handleStartGame = () => {
    // If there's a saved game, confirm before starting new
    if (hasSavedGame) {
      setConfirmAction("newGame");
      setShowConfirmation(true);
    } else {
      onStartNewGame();
    }
  };

  // Handle confirmation actions with improved feedback
  const handleConfirm = () => {
    if (confirmAction === "newGame") {
      onStartNewGame();
    } else if (confirmAction === "resetSettings") {
      const defaultSettings = {
        soundEnabled: true,
        musicEnabled: true,
        animationsEnabled: true,
        tutorialShown: false,
      };

      setNewSettings(defaultSettings);
      onUpdateSettings(defaultSettings);
    }
    setShowConfirmation(false);
  };

  // Apply settings changes with validation
  const applySettings = () => {
    onUpdateSettings(newSettings);
    setCurrentView("main");
  };

  // Handle setting toggle with animation feedback
  const toggleSetting = (setting) => {
    setNewSettings({
      ...newSettings,
      [setting]: !newSettings[setting],
    });
  };

  // Reset settings to default with confirmation
  const resetSettings = () => {
    setConfirmAction("resetSettings");
    setShowConfirmation(true);
  };

  // Show info about a menu option
  const showInfo = useCallback((content) => {
    setInfoContent(content);
    setShowInfoPanel(true);
  }, []);

  // Hide the info panel
  const hideInfo = useCallback(() => {
    setShowInfoPanel(false);
  }, []);

  // Handle button hover effects
  const handleButtonHover = (button) => {
    setActiveButton(button);

    // Show relevant info depending on the button
    switch (button) {
      case "newGame":
        showInfo("Start a new adventure and climb the Astral Spire.");
        break;
      case "continue":
        showInfo(
          hasSavedGame
            ? "Continue your journey from where you left off."
            : "No saved game found. Start a new game first."
        );
        break;
      case "settings":
        showInfo("Adjust game settings like sound, music and animations.");
        break;
      case "tutorial":
        showInfo("Learn how to play Skyward Ascent with a guided tutorial.");
        break;
      case "credits":
        showInfo("See the team behind Skyward Ascent.");
        break;
      default:
        hideInfo();
    }
  };

  // Handle button hover end
  const handleButtonHoverEnd = () => {
    setActiveButton(null);
    hideInfo();
  };

  // Render main menu with enhanced animations
  const renderMainMenu = () => (
    <div className="main-menu">
      <div className="menu-logo">
        <motion.img
          src={logoImg}
          alt="Skyward Ascent"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 10,
            delay: 0.2,
          }}
        />
      </div>

      <motion.div
        className="text-logo"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <span className="logo-sky">Sky</span>
        <span className="logo-ward">ward</span>
        <span className="logo-ascent">Ascent</span>
      </motion.div>

      <div className="menu-buttons">
        <motion.button
          className={`menu-button primary ${
            activeButton === "newGame" ? "active" : ""
          }`}
          onClick={handleStartGame}
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
          onHoverStart={() => handleButtonHover("newGame")}
          onHoverEnd={handleButtonHoverEnd}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <span className="button-icon">🚀</span>
          <span className="button-text">New Game</span>
        </motion.button>

        <motion.button
          className={`menu-button ${hasSavedGame ? "" : "disabled"} ${
            activeButton === "continue" ? "active" : ""
          }`}
          onClick={hasSavedGame ? onLoadGame : null}
          whileHover={hasSavedGame ? { scale: 1.05, y: -3 } : {}}
          whileTap={hasSavedGame ? { scale: 0.95 } : {}}
          disabled={!hasSavedGame}
          onHoverStart={() => handleButtonHover("continue")}
          onHoverEnd={handleButtonHoverEnd}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <span className="button-icon">🎮</span>
          <span className="button-text">Continue</span>
        </motion.button>

        <motion.button
          className={`menu-button ${
            activeButton === "settings" ? "active" : ""
          }`}
          onClick={() => setCurrentView("settings")}
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
          onHoverStart={() => handleButtonHover("settings")}
          onHoverEnd={handleButtonHoverEnd}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <span className="button-icon">⚙️</span>
          <span className="button-text">Settings</span>
        </motion.button>

        <motion.button
          className={`menu-button ${
            activeButton === "tutorial" ? "active" : ""
          }`}
          onClick={onShowTutorial}
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
          onHoverStart={() => handleButtonHover("tutorial")}
          onHoverEnd={handleButtonHoverEnd}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        >
          <span className="button-icon">📘</span>
          <span className="button-text">Tutorial</span>
        </motion.button>

        <motion.button
          className={`menu-button ${
            activeButton === "credits" ? "active" : ""
          }`}
          onClick={() => setShowCredits(true)}
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
          onHoverStart={() => handleButtonHover("credits")}
          onHoverEnd={handleButtonHoverEnd}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.8 }}
        >
          <span className="button-icon">👥</span>
          <span className="button-text">Credits</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {showInfoPanel && (
          <motion.div
            className="info-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {infoContent}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="menu-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <p>
          Skyward Ascent • Digital Edition • Based on the game by Deffy Pyah Urz
        </p>
        <p>v0.1.0 • © 2023 All Rights Reserved</p>
      </motion.div>
    </div>
  );

  // Render settings menu with enhanced interactions
  const renderSettingsMenu = () => (
    <motion.div
      className="settings-menu"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2>Game Settings</h2>

      <div className="settings-list">
        <div className="setting-item">
          <span className="setting-label">Sound Effects</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={newSettings.soundEnabled}
              onChange={() => toggleSetting("soundEnabled")}
            />
            <span className="slider">
              <span className="toggle-state">
                {newSettings.soundEnabled ? "ON" : "OFF"}
              </span>
            </span>
          </label>
        </div>

        <div className="setting-item">
          <span className="setting-label">Music</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={newSettings.musicEnabled}
              onChange={() => toggleSetting("musicEnabled")}
            />
            <span className="slider">
              <span className="toggle-state">
                {newSettings.musicEnabled ? "ON" : "OFF"}
              </span>
            </span>
          </label>
        </div>

        <div className="setting-item">
          <span className="setting-label">Animations</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={newSettings.animationsEnabled}
              onChange={() => toggleSetting("animationsEnabled")}
            />
            <span className="slider">
              <span className="toggle-state">
                {newSettings.animationsEnabled ? "ON" : "OFF"}
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="settings-actions">
        <motion.button
          className="settings-button"
          onClick={() => setCurrentView("main")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Cancel
        </motion.button>
        <motion.button
          className="settings-button reset"
          onClick={resetSettings}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Reset
        </motion.button>
        <motion.button
          className="settings-button save"
          onClick={applySettings}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Apply
        </motion.button>
      </div>
    </motion.div>
  );

  // Render credits overlay with enhanced layout
  const renderCredits = () => (
    <div className="credits-overlay">
      <motion.div
        className="credits-content"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 15 }}
      >
        <h2 className="credits-title">Credits</h2>

        <div className="credits-sections">
          <div className="credits-section">
            <h3>Game Design</h3>
            <p>Deffy Pyah Urz</p>
          </div>

          <div className="credits-section">
            <h3>Development</h3>
            <p>Lead Developer: [Developer Name]</p>
            <p>UI/UX Design: [Designer Name]</p>
            <p>Art Assets: [Artist Name]</p>
          </div>

          <div className="credits-section">
            <h3>Music & Sound</h3>
            <p>Composition: [Composer Name]</p>
            <p>Sound Effects: [Sound Designer Name]</p>
          </div>

          <div className="credits-section">
            <h3>Special Thanks</h3>
            <p>
              All the testers and contributors who helped make this game
              possible!
            </p>
          </div>

          <div className="credits-section">
            <h3>Technologies Used</h3>
            <p>React, Framer Motion, HTML5, CSS3</p>
            <p>JavaScript ES6+, React Hooks, Web Audio API</p>
          </div>
        </div>

        <motion.button
          className="close-credits"
          onClick={() => setShowCredits(false)}
          whileHover={{ scale: 1.2, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          ✕
        </motion.button>
      </motion.div>
    </div>
  );

  // Render confirmation dialog with enhanced accessibility
  const renderConfirmation = () => (
    <div className="confirmation-overlay">
      <motion.div
        className="confirmation-dialog"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <h3>
          {confirmAction === "newGame" ? "Start New Game?" : "Reset Settings?"}
        </h3>
        <p>
          {confirmAction === "newGame"
            ? "Starting a new game will overwrite your current saved game. Are you sure?"
            : "This will reset all settings to their default values. Continue?"}
        </p>
        <div className="confirmation-buttons">
          <motion.button
            className="cancel-button"
            onClick={() => setShowConfirmation(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cancel
          </motion.button>
          <motion.button
            className="confirm-button"
            onClick={handleConfirm}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Confirm
          </motion.button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div
      className="game-menu"
      style={{
        backgroundImage: `url(${menuBackgroundImg})`,
        backgroundPosition: `${50 + mousePosition.x * 10}% ${
          50 + mousePosition.y * 10
        }%`,
      }}
    >
      <div className="menu-background"></div>
      <div
        className="stars-overlay"
        style={{
          backgroundImage: `url(${starsImg})`,
          backgroundPosition: `${mousePosition.x * 20}px ${
            mousePosition.y * 20
          }px`,
          opacity: starOpacity,
        }}
      ></div>

      <div className="menu-container">
        <AnimatePresence mode="wait">
          {currentView === "main" && (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderMainMenu()}
            </motion.div>
          )}

          {currentView === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderSettingsMenu()}
            </motion.div>
          )}
        </AnimatePresence>

        {showCredits && renderCredits()}
        {showConfirmation && renderConfirmation()}
      </div>

      {/* Floating particles for atmosphere */}
      <div className="particles-container">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 20 + 10}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default GameMenu;
