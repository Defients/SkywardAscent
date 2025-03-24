import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./styles/Tutorial.css";

// Import tutorial assets
const tutorialImages = {
  setup: `${process.env.PUBLIC_URL}/assets/images/tutorial/setup_tutorial.png`,
  classes: `${process.env.PUBLIC_URL}/assets/images/tutorial/classes_tutorial.png`,
  combat: `${process.env.PUBLIC_URL}/assets/images/tutorial/combat_tutorial.png`,
  rooms: `${process.env.PUBLIC_URL}/assets/images/tutorial/rooms_tutorial.png`,
  weapons: `${process.env.PUBLIC_URL}/assets/images/tutorial/weapons_tutorial.png`,
  merchant: `${process.env.PUBLIC_URL}/assets/images/tutorial/merchant_tutorial.png`,
  cards: `${process.env.PUBLIC_URL}/assets/images/tutorial/cards_tutorial.png`,
  heartRoom: `${process.env.PUBLIC_URL}/assets/images/tutorial/heart_room_tutorial.png`,
};

// Define tutorial sections
const tutorialSections = [
  {
    id: "welcome",
    title: "Welcome to Skyward Ascent",
    content:
      "A band of brave heroes must climb the Astral Spire to defeat Apexus, the Astral Overlord. You'll navigate through rooms, battle monsters, collect treasure, and upgrade your heroes as you ascend through the tiers of the spire.",
    image: null,
    tip: "You can access this tutorial at any time from the menu.",
  },
  {
    id: "setup",
    title: "Game Setup",
    content:
      "First, you'll choose three heroes from four available classes. Each class has unique abilities, starting items, and play styles. Your fourth, unused class will provide cards for your Weapon Chest.",
    image: tutorialImages.setup,
    tip: "Consider team synergy when selecting heroes. A balanced team with different strengths works well!",
  },
  {
    id: "classes",
    title: "Hero Classes",
    content:
      "Each hero has a class and specialization determined by their card's rank and color. Bladedancers deal critical damage, Manipulators control battlefield effects, Trackers provide support, and Guardians protect the party.",
    image: tutorialImages.classes,
    tip: "Red specializations often focus on offense, while Black specializations favor utility and control.",
  },
  {
    id: "cards",
    title: "Card Mechanics",
    content:
      "Skyward Ascent uses a standard 54-card deck (with Jokers). Cards are split into Royalty (face cards) and Peon (number cards) piles. The card's rank and suit will determine effects during combat and other game phases.",
    image: tutorialImages.cards,
    tip: "Pay attention to attached cards and their possible combinations. Matching attached cards during combat can trigger powerful effects!",
  },
  {
    id: "weapons",
    title: "Weapon Chest",
    content:
      "Before your adventure begins, one hero will receive a Weapon Chest. By flipping cards, you'll determine the rarity of the weapon they receive, from Common to Legendary. You might also earn gold and enchantments.",
    image: tutorialImages.weapons,
    tip: "Jokers automatically give Common weapons, but consecutive Peon cards or a Spade Royalty can yield better weapons!",
  },
  {
    id: "spire",
    title: "The Astral Spire",
    content:
      "The spire has three tiers, each with multiple rooms. As you climb, you'll encounter increasingly difficult challenges but also better rewards. The path sometimes splits, letting you choose which route to take.",
    image: tutorialImages.rooms,
    tip: "Different room types offer different experiences: Club (monster), Diamond (merchant), Heart (blessing), and Spade (elite monster).",
  },
  {
    id: "combat",
    title: "Combat System",
    content:
      "Combat involves flipping cards and rolling dice. When cards match with attached cards, special abilities can trigger. Your hero's class determines which weapons they can use and what effects their dice rolls will have.",
    image: tutorialImages.combat,
    tip: "When flipping cards for monsters or heroes, look for matches to trigger special abilities. The battle involves strategy in deciding when to use abilities and which dice rolls to aim for.",
  },
  {
    id: "merchant",
    title: "Merchants",
    content:
      "In Diamond rooms, you'll meet a merchant who sells health potions, consumables, gear, weapons, and enchantments. Spend your gold wisely to equip your heroes for the challenges ahead.",
    image: tutorialImages.merchant,
    tip: "Prioritize keeping your heroes alive with health potions, then focus on weapons and powerful gear that complement your heroes' abilities.",
  },
  {
    id: "heartRoom",
    title: "Heart Rooms",
    content:
      "Heart rooms offer blessings that can heal your party, revive fallen heroes, increase maximum health, provide gold, or offer other benefits. Choose wisely based on your current situation.",
    image: tutorialImages.heartRoom,
    tip: "Timing is crucial for Heart rooms. If multiple heroes are low on health, full party healing might be better than reviving a single hero.",
  },
  {
    id: "finalTips",
    title: "Final Tips & Strategy",
    content:
      "As you ascend higher, the challenges grow more difficult, but so do the rewards. Plan your path, manage your resources, and use each hero's abilities strategically. Victory against Apexus will require skill, planning, and a bit of luck!",
    image: null,
    tip: "Don't be discouraged by defeat - each run teaches you more about the game's mechanics and helps you refine your strategy. The Astral Spire awaits your conquest!",
  },
];

const Tutorial = ({ onComplete, onSkip, playSound }) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [animationDirection, setAnimationDirection] = useState("next");
  const [showTutorial, setShowTutorial] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [showOverview, setShowOverview] = useState(false);

  // Handle automatic advancement (optional)
  useEffect(() => {
    let timer;
    if (autoAdvance && currentSectionIndex < tutorialSections.length - 1) {
      timer = setTimeout(() => {
        nextSection();
      }, 10000); // 10 seconds per section
    }
    return () => clearTimeout(timer);
  }, [currentSectionIndex, autoAdvance]);

  // Get current section
  const currentSection = tutorialSections[currentSectionIndex];

  // Navigation functions
  const nextSection = () => {
    if (playSound) playSound();
    if (currentSectionIndex < tutorialSections.length - 1) {
      setAnimationDirection("next");
      setCurrentSectionIndex(currentSectionIndex + 1);
    } else {
      completeTutorial();
    }
  };

  const previousSection = () => {
    if (playSound) playSound();
    if (currentSectionIndex > 0) {
      setAnimationDirection("prev");
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const jumpToSection = (index) => {
    if (playSound) playSound();
    if (index !== currentSectionIndex) {
      setAnimationDirection(index > currentSectionIndex ? "next" : "prev");
      setCurrentSectionIndex(index);
    }
    setShowOverview(false);
  };

  const completeTutorial = () => {
    if (playSound) playSound();
    setShowTutorial(false);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 500);
  };

  const skipTutorial = () => {
    if (playSound) playSound();
    setShowTutorial(false);
    setTimeout(() => {
      if (onSkip) onSkip();
    }, 500);
  };

  const toggleOverview = () => {
    if (playSound) playSound();
    setShowOverview(!showOverview);
  };

  // If tutorial is hidden, render nothing
  if (!showTutorial) {
    return null;
  }

  return (
    <div className="tutorial-container">
      {/* Overview panel */}
      <AnimatePresence>
        {showOverview && (
          <motion.div
            className="tutorial-overview"
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.3 }}
          >
            <h3>Tutorial Sections</h3>
            <ul className="overview-list">
              {tutorialSections.map((section, index) => (
                <li
                  key={section.id}
                  className={index === currentSectionIndex ? "active" : ""}
                  onClick={() => jumpToSection(index)}
                >
                  <span className="section-number">{index + 1}</span>
                  <span className="section-title">{section.title}</span>
                </li>
              ))}
            </ul>
            <button className="close-overview" onClick={toggleOverview}>
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main tutorial content */}
      <div className="tutorial-content">
        {/* Progress bar */}
        <div className="tutorial-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${
                  ((currentSectionIndex + 1) / tutorialSections.length) * 100
                }%`,
              }}
            ></div>
          </div>
          <div className="progress-text">
            {currentSectionIndex + 1} / {tutorialSections.length}
          </div>
        </div>

        {/* Section title */}
        <AnimatePresence mode="wait">
          <motion.h2
            key={`title-${currentSection.id}`}
            className="section-title"
            initial={{
              opacity: 0,
              x: animationDirection === "next" ? 50 : -50,
            }}
            animate={{ opacity: 1, x: 0 }}
            exit={{
              opacity: 0,
              x: animationDirection === "next" ? -50 : 50,
            }}
            transition={{ duration: 0.3 }}
          >
            {currentSection.title}
          </motion.h2>
        </AnimatePresence>

        {/* Main content area */}
        <div className="main-content-area">
          {/* Image section */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`image-${currentSection.id}`}
              className="tutorial-image-container"
              initial={{
                opacity: 0,
                x: animationDirection === "next" ? 100 : -100,
              }}
              animate={{ opacity: 1, x: 0 }}
              exit={{
                opacity: 0,
                x: animationDirection === "next" ? -100 : 100,
              }}
              transition={{ duration: 0.3 }}
            >
              {currentSection.image ? (
                <img
                  src={currentSection.image}
                  alt={currentSection.title}
                  className="tutorial-image"
                />
              ) : (
                <div className="tutorial-placeholder">
                  <div className="placeholder-icon">🎮</div>
                  <div className="placeholder-text">Skyward Ascent</div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Text content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${currentSection.id}`}
              className="tutorial-text"
              initial={{
                opacity: 0,
                y: 30,
              }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: 30,
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <p className="section-content">{currentSection.content}</p>

              <div className="tip-container">
                <div className="tip-icon">💡</div>
                <p className="tip-text">{currentSection.tip}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="tutorial-navigation">
          <motion.button
            className="nav-button overview-button"
            onClick={toggleOverview}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="button-icon">≡</span>
            <span className="button-text">Overview</span>
          </motion.button>

          <div className="main-nav-buttons">
            <motion.button
              className="nav-button prev-button"
              onClick={previousSection}
              disabled={currentSectionIndex === 0}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="button-icon">←</span>
              <span className="button-text">Previous</span>
            </motion.button>

            <motion.button
              className="nav-button next-button"
              onClick={nextSection}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="button-text">
                {currentSectionIndex === tutorialSections.length - 1
                  ? "Finish"
                  : "Next"}
              </span>
              <span className="button-icon">
                {currentSectionIndex === tutorialSections.length - 1
                  ? "✓"
                  : "→"}
              </span>
            </motion.button>
          </div>

          <motion.button
            className="nav-button skip-button"
            onClick={skipTutorial}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="button-icon">↪</span>
            <span className="button-text">Skip</span>
          </motion.button>
        </div>
      </div>

      {/* Auto-advance toggle */}
      <div className="auto-advance-toggle">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={autoAdvance}
            onChange={() => setAutoAdvance(!autoAdvance)}
          />
          <span className="toggle-text">Auto-advance</span>
        </label>
      </div>
    </div>
  );
};

export default Tutorial;
