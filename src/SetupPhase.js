import React, { useState, useEffect } from "react";
import {
  createDeck,
  shuffleArray,
  RANKS,
  CLASS_DATA,
  getSuitColorClass,
} from "../contexts/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip";
import "../styles/SetupPhase.css";

// Hero class illustrations
import bladedancerImg from "../assets/images/heroes/bladedancer.png";
import manipulatorImg from "../assets/images/heroes/manipulator.png";
import trackerImg from "../assets/images/heroes/tracker.png";
import guardianImg from "../assets/images/heroes/guardian.png";

const heroImages = {
  3: bladedancerImg, // Bladedancer
  5: manipulatorImg, // Manipulator
  7: trackerImg, // Tracker
  9: guardianImg, // Guardian
};

const SetupPhase = ({ onComplete, playSound }) => {
  const [setupOption, setSetupOption] = useState(null);
  const [setupStage, setSetupStage] = useState("option");
  const [deck, setDeck] = useState([]);
  const [royaltyPile, setRoyaltyPile] = useState([]);
  const [peonPile, setPeonPile] = useState([]);
  const [classCards, setClassCards] = useState({
    3: null, // Bladedancer
    5: null, // Manipulator
    7: null, // Tracker
    9: null, // Guardian
  });
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAbilityDetails, setShowAbilityDetails] = useState(null);
  const [currentAnimation, setCurrentAnimation] = useState(null);

  // Initialize the deck
  useEffect(() => {
    const fullDeck = createDeck();
    setDeck(fullDeck);
    setIsLoading(false);
  }, []);

  // Split the deck into Royalty and Peon piles
  const splitDeck = () => {
    const royalty = deck.filter(
      (card) =>
        card.rank === RANKS.ACE ||
        card.rank === RANKS.KING ||
        card.rank === RANKS.QUEEN ||
        card.rank === RANKS.JACK
    );

    const peons = deck.filter(
      (card) =>
        card.rank !== RANKS.ACE &&
        card.rank !== RANKS.KING &&
        card.rank !== RANKS.QUEEN &&
        card.rank !== RANKS.JACK &&
        card.rank !== RANKS.JOKER
    );

    // Shuffle both piles
    setRoyaltyPile(shuffleArray(royalty));
    setPeonPile(shuffleArray(peons));
  };

  // Handle quick play setup
  const handleQuickPlay = () => {
    if (playSound) playSound();
    setSetupOption("quick");
    setSetupStage("class_selection");
    splitDeck();

    // For quick play, we just pick the first cards of each rank
    const quickClassCards = {};
    const ranks = ["3", "5", "7", "9"];

    ranks.forEach((rank) => {
      const numericRank = parseInt(rank);
      if (!isNaN(numericRank)) {
        const card = peonPile.find((c) => c.rank === rank);
        if (card) {
          quickClassCards[numericRank] = card;
        }
      }
    });

    setClassCards(quickClassCards);

    // Play card dealing animation
    setCurrentAnimation("dealing");
    setTimeout(() => {
      setCurrentAnimation(null);
    }, 1500);
  };

  // Handle advanced play setup
  const handleAdvancedPlay = () => {
    if (playSound) playSound();
    setSetupOption("advanced");
    setSetupStage("class_selection");
    splitDeck();

    // For advanced play, we create separate piles for each rank
    const advancedClassCards = {};
    const ranks = ["3", "5", "7", "9"];

    // Create piles for each rank
    ranks.forEach((rank) => {
      const numericRank = parseInt(rank);
      if (!isNaN(numericRank)) {
        const rankPile = peonPile.filter((c) => c.rank === rank);
        if (rankPile.length > 0) {
          // Shuffle and take the first card
          const shuffledPile = shuffleArray(rankPile);
          advancedClassCards[numericRank] = shuffledPile[0];
        }
      }
    });

    setClassCards(advancedClassCards);

    // Play card dealing animation
    setCurrentAnimation("dealing");
    setTimeout(() => {
      setCurrentAnimation(null);
    }, 1500);
  };

  // Toggle class selection
  const toggleClassSelection = (rank) => {
    if (playSound) playSound();
    const numericRank = parseInt(rank);
    if (selectedClasses.includes(numericRank)) {
      setSelectedClasses(selectedClasses.filter((r) => r !== numericRank));
    } else {
      if (selectedClasses.length < 3) {
        setSelectedClasses([...selectedClasses, numericRank]);
      }
    }
  };

  // Show ability details
  const toggleAbilityDetails = (rank) => {
    if (showAbilityDetails === rank) {
      setShowAbilityDetails(null);
    } else {
      setShowAbilityDetails(rank);
    }
  };

  // Complete setup and move to the next phase
  const completeSetup = () => {
    if (playSound) playSound();
    if (selectedClasses.length !== 3) {
      alert("Please select exactly 3 hero classes!");
      return;
    }

    // Create hero objects from selected classes
    const heroes = selectedClasses.map((rank) => {
      const card = classCards[rank];
      const classInfo = CLASS_DATA[rank];
      const specialization =
        card.color === "red" ? classInfo.redSpec : classInfo.blackSpec;

      return {
        class: classInfo.name,
        specialization,
        rank,
        card,
        health: classInfo.health,
        maxHealth: classInfo.health,
        ability: classInfo.ability,
        abilityDetails: classInfo.abilityDetails,
        rollEffects: classInfo.rollEffects,
        attachedCards: [],
        weapon: null,
        isTapped: false,
        markers: [],
      };
    });

    // The unused class rank for the weapon chest
    const unusedClassRank = Object.keys(classCards)
      .map(Number)
      .find((rank) => !selectedClasses.includes(rank));

    // Update game state and move to adventure setup
    onComplete({
      heroes,
      unusedClassRank,
      deck: {
        royaltyPile,
        peonPile,
        environmentPile: [], // Will be set up later
      },
    });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Preparing the decks and heroes...</div>
      </div>
    );
  }

  // Initial selection screen
  if (setupStage === "option") {
    return (
      <motion.div
        className="setup-options"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Welcome to Skyward Ascent</h2>
        <p className="intro-text">
          A brave band of heroes must climb the Astral Spire to defeat Apexus,
          the Astral Overlord. Will you rise to the challenge?
        </p>

        <div className="setup-buttons">
          <motion.button
            onClick={handleQuickPlay}
            className="quick-play"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="button-icon">⚡</span>
            <span className="button-text">Quick Play</span>
            <span className="button-desc">
              Get started fast with preset hero configurations
            </span>
          </motion.button>

          <motion.button
            onClick={handleAdvancedPlay}
            className="advanced-play"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="button-icon">🦾</span>
            <span className="button-text">Advanced Play</span>
            <span className="button-desc">
              Take control of your hero specializations
            </span>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Class selection screen
  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="class-selection"
        key="class-selection"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Choose Your Heroes</h2>
        <p className="selection-instructions">
          Select 3 heroes to form your party for the ascent
        </p>

        <div className="heroes-grid">
          {Object.entries(classCards).map(([rank, card]) => {
            if (!card) return null;

            const numericRank = parseInt(rank);
            const classInfo = CLASS_DATA[numericRank];
            const specialization =
              card.color === "red" ? classInfo.redSpec : classInfo.blackSpec;
            const isSelected = selectedClasses.includes(numericRank);

            return (
              <motion.div
                key={rank}
                className={`hero-card ${isSelected ? "selected" : ""}`}
                onClick={() => toggleClassSelection(rank)}
                initial={
                  currentAnimation === "dealing"
                    ? { opacity: 0, y: -100, rotateY: 180 }
                    : { opacity: 1 }
                }
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{
                  duration: 0.5,
                  delay: currentAnimation === "dealing" ? numericRank * 0.2 : 0,
                }}
                whileHover={{ y: -5 }}
              >
                <div className="hero-header">
                  <div className="card-display">
                    <div
                      className={`card-symbol ${getSuitColorClass(card.suit)}`}
                    >
                      {card.suit}
                    </div>
                    <div className="card-rank">{card.rank}</div>
                  </div>
                  <h3 className="hero-title">{classInfo.name}</h3>
                </div>

                <div className="hero-image-container">
                  <img
                    src={heroImages[numericRank]}
                    alt={classInfo.name}
                    className="hero-image"
                  />
                  <div className="specialization-badge">
                    <span
                      className={`spec-icon ${
                        card.color === "red" ? "red-spec" : "black-spec"
                      }`}
                    >
                      {card.color === "red" ? "🔥" : "🌑"}
                    </span>
                    <span className="spec-name">{specialization}</span>
                  </div>
                </div>

                <div className="hero-info">
                  <div className="hero-stats">
                    <div className="stat health">
                      <span className="stat-icon">❤️</span>
                      <span className="stat-value">{classInfo.health}</span>
                    </div>
                    <div className="stat gold">
                      <span className="stat-icon">💰</span>
                      <span className="stat-value">
                        {classInfo.startingGold}
                      </span>
                    </div>
                  </div>

                  <div className="hero-ability">
                    <div
                      className="ability-header"
                      onClick={() => toggleAbilityDetails(numericRank)}
                    >
                      <span className="ability-icon">⚛️</span>
                      <span className="ability-title">Special Ability</span>
                      <span className="expand-icon">
                        {showAbilityDetails === numericRank ? "▼" : "▶"}
                      </span>
                    </div>

                    <AnimatePresence>
                      {showAbilityDetails === numericRank && (
                        <motion.div
                          className="ability-details"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p>{classInfo.abilityDetails}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="hero-starting-items">
                    <h4>Starting Items:</h4>
                    <ul className="items-list">
                      {classInfo.startingItems.map((item, index) => (
                        <li key={index} className="item">
                          {item === "Common weapon (Stargazer Spear)"
                            ? "⚔️ Stargazer Spear"
                            : item === "Fiery Enchant Scroll"
                            ? "🔥 Fiery Scroll"
                            : item === "Major Health Potion"
                            ? "🧪 Major Health Potion"
                            : item === "Mystic Rune"
                            ? "🔯 Mystic Rune"
                            : item === "Ability Blocker"
                            ? "🛡️ Ability Blocker"
                            : item === "Lucky Charm"
                            ? "🍀 Lucky Charm"
                            : item === "Camouflage Cloak"
                            ? "👘 Camouflage Cloak"
                            : item === "PAC"
                            ? "🃏 Permanent Attached Card"
                            : item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="hero-footer">
                  <div className="card-badge">
                    {isSelected ? (
                      <span className="selected-badge">Selected</span>
                    ) : (
                      <span className="select-prompt">Click to Select</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="selection-summary">
          <div className="selected-count">
            <div className="count-bubble">
              <span className="count-number">{selectedClasses.length}</span>
              <span className="count-total">/3</span>
            </div>
            <span className="count-label">Heroes Selected</span>
          </div>

          <div className="selected-heroes">
            {selectedClasses.map((rank) => {
              const classInfo = CLASS_DATA[rank];
              return (
                <div key={rank} className="selected-hero-pill">
                  <img
                    src={heroImages[rank]}
                    alt={classInfo.name}
                    className="pill-image"
                  />
                  <span className="pill-name">{classInfo.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <motion.button
          onClick={completeSetup}
          className={`complete-button ${
            selectedClasses.length === 3 ? "ready" : "disabled"
          }`}
          disabled={selectedClasses.length !== 3}
          whileHover={selectedClasses.length === 3 ? { scale: 1.05 } : {}}
          whileTap={selectedClasses.length === 3 ? { scale: 0.95 } : {}}
        >
          Begin Adventure
        </motion.button>

        <Tooltip id="ability-tooltip" />
      </motion.div>
    </AnimatePresence>
  );
};

export default SetupPhase;
