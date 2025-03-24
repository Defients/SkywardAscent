import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/GameMenu.css"; // Using the existing CSS file

// Import background images (would need to be provided)
import menuBackgroundImg from "../assets/images/backgrounds/menu_background.png";
import starsImg from "../assets/images/effects/stars.png";
import logoImg from "../assets/images/ui/skyward_ascent_logo.png";

const GameMenu = ({
  onStartNewGame,
  onLoadGame,
  onShowTutorial,
  onUpdateSettings,
  settings,
  hasSavedGame,
}) => {
  const [currentView, setCurrentView] = useState("main");
  const [showCredits, setShowCredits] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [newSettings, setNewSettings] = useState({ ...settings });

  // For animation
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse movement for parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Handle starting a new game
  const handleStartGame = () => {
    // If there's a saved game, confirm before starting new
    if (hasSavedGame) {
      setConfirmAction("newGame");
      setShowConfirmation(true);
    } else {
      onStartNewGame();
    }
  };

  // Handle confirmation actions
  const handleConfirm = () => {
    if (confirmAction === "newGame") {
      onStartNewGame();
    } else if (confirmAction === "resetSettings") {
      setNewSettings({
        soundEnabled: true,
        musicEnabled: true,
        animationsEnabled: true,
        tutorialShown: false,
      });
      onUpdateSettings({
        soundEnabled: true,
        musicEnabled: true,
        animationsEnabled: true,
        tutorialShown: false,
      });
    }
    setShowConfirmation(false);
  };

  // Apply settings changes
  const applySettings = () => {
    onUpdateSettings(newSettings);
    setCurrentView("main");
  };

  // Handle setting toggle
  const toggleSetting = (setting) => {
    setNewSettings({
      ...newSettings,
      [setting]: !newSettings[setting],
    });
  };

  // Reset settings to default
  const resetSettings = () => {
    setConfirmAction("resetSettings");
    setShowConfirmation(true);
  };

  // Render main menu
  const renderMainMenu = () => (
    <div className="main-menu">
      <div className="menu-logo">
        <img src={logoImg} alt="Skyward Ascent" />
      </div>

      <div className="text-logo">
        <span className="logo-sky">Sky</span>
        <span className="logo-ward">ward</span>
        <span className="logo-ascent">Ascent</span>
      </div>

      <div className="menu-buttons">
        <motion.button
          className="menu-button primary"
          onClick={handleStartGame}
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          New Game
        </motion.button>

        <motion.button
          className={`menu-button ${hasSavedGame ? "" : "disabled"}`}
          onClick={hasSavedGame ? onLoadGame : null}
          whileHover={hasSavedGame ? { scale: 1.05, y: -3 } : {}}
          whileTap={hasSavedGame ? { scale: 0.95 } : {}}
          disabled={!hasSavedGame}
        >
          Continue
        </motion.button>

        <motion.button
          className="menu-button"
          onClick={() => setCurrentView("settings")}
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          Settings
        </motion.button>

        <motion.button
          className="menu-button"
          onClick={onShowTutorial}
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          Tutorial
        </motion.button>

        <motion.button
          className="menu-button"
          onClick={() => setShowCredits(true)}
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          Credits
        </motion.button>
      </div>

      <div className="menu-footer">
        <p>
          Skyward Ascent • Digital Edition • Based on the game by Deffy Pyah Urz
        </p>
        <p>v0.1.0 • © 2023 All Rights Reserved</p>
      </div>
    </div>
  );

  // Render settings menu
  const renderSettingsMenu = () => (
    <div className="settings-menu">
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
            <span className="slider"></span>
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
            <span className="slider"></span>
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
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="settings-actions">
        <button
          className="settings-button"
          onClick={() => setCurrentView("main")}
        >
          Cancel
        </button>
        <button className="settings-button reset" onClick={resetSettings}>
          Reset
        </button>
        <button className="settings-button save" onClick={applySettings}>
          Apply
        </button>
      </div>
    </div>
  );

  // Render credits overlay
  const renderCredits = () => (
    <div className="credits-overlay">
      <div className="credits-content">
        <h2>Credits</h2>

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
        </div>

        <button className="close-credits" onClick={() => setShowCredits(false)}>
          ✕
        </button>
      </div>
    </div>
  );

  // Render confirmation dialog
  const renderConfirmation = () => (
    <div className="confirmation-overlay">
      <div className="confirmation-dialog">
        <h3>
          {confirmAction === "newGame" ? "Start New Game?" : "Reset Settings?"}
        </h3>
        <p>
          {confirmAction === "newGame"
            ? "Starting a new game will overwrite your current saved game. Are you sure?"
            : "This will reset all settings to their default values. Continue?"}
        </p>
        <div className="confirmation-buttons">
          <button
            className="cancel-button"
            onClick={() => setShowConfirmation(false)}
          >
            Cancel
          </button>
          <button className="confirm-button" onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="game-menu"
      style={{
        backgroundPosition: `${50 + mousePosition.x * 10}% ${
          50 + mousePosition.y * 10
        }%`,
      }}
    >
      <div className="menu-background"></div>
      <div
        className="stars-overlay"
        style={{
          backgroundPosition: `${mousePosition.x * 20}px ${
            mousePosition.y * 20
          }px`,
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
    </div>
  );
};

export default GameMenu;
