import React, { useState, useEffect } from "react";
import {
  createDeck,
  shuffleArray,
  RANKS,
  CLASS_DATA,
  getSuitColorClass,
} from "./contexts/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip";
import "./styles/SetupPhase.css";

// Absolute paths to images
const bladedancerImg = "/assets/images/heroes/portraits/bladedancer.png";
const manipulatorImg = "/assets/images/heroes/portraits/manipulator.png";
const trackerImg = "/assets/images/heroes/portraits/tracker.png";
const guardianImg = "/assets/images/heroes/portraits/guardian.png";

// Mapping of hero ranks to their respective images
const heroImages = {
  3: bladedancerImg, // Bladedancer
  5: manipulatorImg, // Manipulator
  7: trackerImg, // Tracker
  9: guardianImg, // Guardian
};

// Hero emojis for quick selection
const heroEmojis = {
  3: "🗡️", // Bladedancer - sword
  5: "🔮", // Manipulator - crystal ball
  7: "🏹", // Tracker - bow and arrow
  9: "🛡️", // Guardian - shield
};

const SetupPhase = ({ onComplete, playSound }) => {
  // State management for setup process
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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hoveredClass, setHoveredClass] = useState(null);
  const [emojiHovered, setEmojiHovered] = useState(null);
  const [debugMode, setDebugMode] = useState(false); // For debugging

  // Initialize the deck with loading animation
  useEffect(() => {
    // Simulate progressive loading for better user experience
    const loadingInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 95) {
          clearInterval(loadingInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);

    // Initialize deck with timeout to show loading animation
    const initTimeout = setTimeout(() => {
      try {
        const fullDeck = createDeck();
        setDeck(fullDeck);
        setIsLoading(false);
        clearInterval(loadingInterval);
        setLoadingProgress(100);
      } catch (error) {
        console.error("Error initializing deck:", error);
        setErrorMessage(
          "Failed to initialize the game deck. Please refresh the page."
        );
        setIsLoading(false);
      }
    }, 1200);

    return () => {
      clearInterval(loadingInterval);
      clearTimeout(initTimeout);
    };
  }, []);

  // Split the deck into Royalty and Peon piles
  const splitDeck = () => {
    try {
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
    } catch (error) {
      console.error("Error splitting deck:", error);
      setErrorMessage("Error preparing game cards. Please try again.");
    }
  };

  // Debug function to create fallback cards if needed
  const createFallbackCards = () => {
    const fallbackCards = {};
    const requiredRanks = [3, 5, 7, 9];

    requiredRanks.forEach((rank) => {
      if (!classCards[rank]) {
        // Create a fallback card
        fallbackCards[rank] = {
          id: `fallback-${rank}`,
          rank: rank.toString(),
          suit: "♠",
          color: "black",
          isTapped: false,
          value: rank,
        };
        console.log(`Created fallback card for rank ${rank}`);
      }
    });

    // Update classCards with fallbacks
    setClassCards((prev) => ({ ...prev, ...fallbackCards }));
  };

  // Toggle class selection with improved feedback
  const toggleClassSelection = (rank) => {
    if (playSound) playSound();
    const numericRank = parseInt(rank);

    if (selectedClasses.includes(numericRank)) {
      setSelectedClasses(selectedClasses.filter((r) => r !== numericRank));
    } else {
      if (selectedClasses.length < 3) {
        setSelectedClasses([...selectedClasses, numericRank]);

        // Highlight the newly selected class in the table
        const tableRow = document.querySelector(
          `.comparison-table tr[data-rank="${numericRank}"]`
        );
        if (tableRow) {
          tableRow.classList.add("pulse-animation");
          setTimeout(() => {
            tableRow.classList.remove("pulse-animation");
          }, 800);
        }
      } else {
        // Provide visual feedback that 3 is the maximum
        const element = document.querySelector(
          `.hero-card[data-rank="${rank}"]`
        );
        if (element) {
          element.classList.add("shake-animation");
          setTimeout(() => {
            element.classList.remove("shake-animation");
          }, 500);
        }
      }
    }
  };

  // Show ability details with improved accessibility
  const toggleAbilityDetails = (rank) => {
    if (showAbilityDetails === rank) {
      setShowAbilityDetails(null);
    } else {
      setShowAbilityDetails(rank);
    }
  };

  // Handle quick play setup with enhanced animation
  const handleQuickPlay = () => {
    if (playSound) playSound();
    setSetupOption("quick");
    setSetupStage("class_selection");
    splitDeck();

    // For quick play, we just pick the first cards of each rank
    const quickClassCards = {};
    const ranks = [3, 5, 7, 9]; // Use numbers instead of strings for consistency

    // Debug: Log peon pile to check for rank values
    if (debugMode) {
      console.log("Peon pile before assignment:", peonPile);
    }

    ranks.forEach((rank) => {
      // Use both string and number comparison to be safe
      const card = peonPile.find(
        (c) => c.rank === rank || c.rank === rank.toString()
      );

      if (card) {
        quickClassCards[rank] = card;
        if (debugMode) {
          console.log(`Found card for rank ${rank}:`, card);
        }
      } else {
        // Fallback: manually create a card for this rank with default values
        quickClassCards[rank] = {
          id: `fallback-${rank}`,
          rank: rank.toString(), // ensure string format
          suit: "♠", // default to spades
          color: "black", // default to black
          isTapped: false,
          value: rank,
        };

        if (debugMode) {
          console.log(`Created fallback card for rank ${rank}`);
        }
      }
    });

    if (debugMode) {
      console.log("Final class cards:", quickClassCards);
    }

    setClassCards(quickClassCards);

    // Play card dealing animation
    setCurrentAnimation("dealing");
    setTimeout(() => {
      setCurrentAnimation(null);
    }, 1500);
  };

  // Handle advanced play setup with enhanced options
  const handleAdvancedPlay = () => {
    if (playSound) playSound();
    setSetupOption("advanced");
    setSetupStage("class_selection");
    splitDeck();

    // For advanced play, we create separate piles for each rank
    const advancedClassCards = {};
    const ranks = [3, 5, 7, 9]; // Use numbers instead of strings for consistency

    // Debug: Log peon pile to check for rank values
    if (debugMode) {
      console.log("Peon pile before advanced assignment:", peonPile);
    }

    // Create piles for each rank
    ranks.forEach((rank) => {
      // Use both string and number comparison to be safe
      const rankPile = peonPile.filter(
        (c) => c.rank === rank || c.rank === rank.toString()
      );

      if (rankPile.length > 0) {
        // Shuffle and take the first card
        const shuffledPile = shuffleArray(rankPile);
        advancedClassCards[rank] = shuffledPile[0];

        if (debugMode) {
          console.log(
            `Found ${rankPile.length} cards for rank ${rank}, selected:`,
            shuffledPile[0]
          );
        }
      } else {
        // Fallback: manually create a card for this rank with default values
        advancedClassCards[rank] = {
          id: `fallback-${rank}`,
          rank: rank.toString(), // ensure string format
          suit: "♠", // default to spades
          color: "black", // default to black
          isTapped: false,
          value: rank,
        };

        if (debugMode) {
          console.log(`Created fallback card for rank ${rank}`);
        }
      }
    });

    if (debugMode) {
      console.log("Final advanced class cards:", advancedClassCards);
    }

    setClassCards(advancedClassCards);

    // Play card dealing animation
    setCurrentAnimation("dealing");
    setTimeout(() => {
      setCurrentAnimation(null);
    }, 1500);
  };

  // Complete setup and move to the next phase with validation
  const completeSetup = () => {
    if (playSound) playSound();

    if (selectedClasses.length !== 3) {
      // Enhanced error feedback
      setErrorMessage("Please select exactly 3 hero classes!");
      setTimeout(() => {
        setErrorMessage(null);
      }, 3000);
      return;
    }

    try {
      // Safety check - verify all selected classes have cards
      const missingCards = selectedClasses.filter((rank) => !classCards[rank]);

      if (missingCards.length > 0) {
        // Some cards are missing - create fallbacks first
        createFallbackCards();
        console.log("Created fallbacks for missing cards:", missingCards);
        // Small delay to ensure state updates before continuing
        setTimeout(() => {
          completeSetupWithValidation();
        }, 100);
      } else {
        // All cards exist, proceed normally
        completeSetupWithValidation();
      }
    } catch (error) {
      console.error("Error in setup validation:", error);
      setErrorMessage("Error creating hero party. Please try again.");
    }
  };

  // Helper function to complete setup after validation
  const completeSetupWithValidation = () => {
    try {
      // Double check that all cards exist before proceeding
      for (const rank of selectedClasses) {
        if (!classCards[rank]) {
          throw new Error(
            `Card for rank ${rank} is still undefined after fallback creation`
          );
        }
      }

      // Create hero objects from selected classes
      const heroes = selectedClasses.map((rank) => {
        const card = classCards[rank];
        const classInfo = CLASS_DATA[rank];

        // Handle possible undefined color with a fallback
        const cardColor = card.color || "black";
        const specialization =
          cardColor === "red" ? classInfo.redSpec : classInfo.blackSpec;

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
          id: `hero-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Add unique ID for better tracking
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
    } catch (error) {
      console.error("Error completing setup:", error);
      setErrorMessage(`Error creating hero party: ${error.message}`);
    }
  };

  // Hover handlers for class cards
  const handleClassHover = (rank) => {
    setHoveredClass(rank);
    setShowTooltip(true);
  };

  const handleClassLeave = () => {
    setHoveredClass(null);
    setShowTooltip(false);
  };

  // Emoji hover effects
  const handleEmojiHover = (rank) => {
    setEmojiHovered(rank);
  };

  const handleEmojiLeave = () => {
    setEmojiHovered(null);
  };

  // Loading screen with progress bar
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <div className="loading-text">Preparing the decks and heroes...</div>
          <div className="loading-progress-bar">
            <div
              className="loading-progress-fill"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <div className="loading-percentage">{loadingProgress}%</div>
        </div>
      </div>
    );
  }

  // Error display
  if (errorMessage) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{errorMessage}</div>
          <button
            onClick={() => window.location.reload()}
            className="error-button"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Initial selection screen with enhanced design
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
            aria-label="Quick Play - Get started fast with preset hero configurations"
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
            aria-label="Advanced Play - Take control of your hero specializations"
          >
            <span className="button-icon">🦾</span>
            <span className="button-text">Advanced Play</span>
            <span className="button-desc">
              Take control of your hero specializations
            </span>
          </motion.button>
        </div>

        {/* Added game description section */}
        <div className="game-description">
          <h3>Card-based Adventure Game</h3>
          <p>
            Skyward Ascent combines deck-building, role-playing, and strategic
            combat as you climb the magical Astral Spire. Choose your heroes
            wisely - each class offers unique abilities, strengths, and
            weaknesses.
          </p>
        </div>
      </motion.div>
    );
  }

  // Class selection screen with enhanced features
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
            // Add fallback handling for color property
            const cardColor = card.color || "black";
            const specialization =
              cardColor === "red" ? classInfo.redSpec : classInfo.blackSpec;
            const isSelected = selectedClasses.includes(numericRank);

            return (
              <motion.div
                key={rank}
                className={`hero-card ${isSelected ? "selected" : ""}`}
                onClick={() => toggleClassSelection(rank)}
                onMouseEnter={() => handleClassHover(numericRank)}
                onMouseLeave={handleClassLeave}
                data-rank={rank}
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
                aria-label={`${classInfo.name} - ${specialization} specialization`}
                role="button"
                aria-pressed={isSelected}
              >
                <div className="hero-header">
                  <div className="card-display">
                    <div
                      className={`card-symbol ${getSuitColorClass(card.suit)}`}
                      aria-label={`Card: ${card.rank} of ${card.suit}`}
                    >
                      {card.suit}
                    </div>
                    <div className="card-rank">{card.rank}</div>
                  </div>
                  <div
                    className="hero-title"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent event from bubbling to parent
                      toggleClassSelection(rank);
                    }}
                    style={{
                      cursor: "pointer", // Show pointer cursor to indicate clickability
                      padding: "10px", // Make clickable area larger
                    }}
                  >
                    <h3>{classInfo.name}</h3>
                  </div>
                </div>

                <div className="hero-image-container">
                  <img
                    src={heroImages[numericRank]}
                    alt={`${classInfo.name} hero portrait`}
                    className="hero-image"
                    loading="lazy"
                  />
                  <div className="specialization-badge">
                    <span
                      className={`spec-icon ${
                        cardColor === "red" ? "red-spec" : "black-spec"
                      }`}
                    >
                      {cardColor === "red" ? "🔥" : "🌑"}
                    </span>
                    <span className="spec-name">{specialization}</span>
                  </div>
                </div>

                <div className="hero-info">
                  <div className="hero-stats">
                    <div className="stat health">
                      <span className="stat-icon" aria-label="Health">
                        ❤️
                      </span>
                      <span className="stat-value">{classInfo.health}</span>
                    </div>
                    <div className="stat gold">
                      <span className="stat-icon" aria-label="Starting Gold">
                        💰
                      </span>
                      <span className="stat-value">
                        {classInfo.startingGold}
                      </span>
                    </div>
                  </div>

                  <div className="hero-ability">
                    <div
                      className="ability-header"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent toggling class selection
                        toggleAbilityDetails(numericRank);
                      }}
                      aria-expanded={showAbilityDetails === numericRank}
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

                {/* Enhanced hero footer with more details */}
                <div className="hero-footer">
                  <div className="card-badge">
                    {isSelected ? (
                      <span className="selected-badge">Selected</span>
                    ) : (
                      <span className="select-prompt">Click to Select</span>
                    )}
                  </div>

                  <div className="hero-strengths">
                    <span className="strengths-label">Strengths:</span>
                    <div className="strengths-list">
                      {classInfo.strengths.map((strength, i) => (
                        <span key={i} className="strength-tag">
                          {strength}
                        </span>
                      ))}
                    </div>
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
                  <button
                    className="remove-hero"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleClassSelection(rank);
                    }}
                    aria-label={`Remove ${classInfo.name} from selection`}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enhanced class details tooltip */}
        {showTooltip && hoveredClass && (
          <div className="class-tooltip">
            <h4>{CLASS_DATA[hoveredClass].name}</h4>
            <p>{CLASS_DATA[hoveredClass].description}</p>
            <div className="tooltip-weapons">
              <span className="tooltip-label">Preferred Weapons:</span>
              {CLASS_DATA[hoveredClass].weaponPreferences.join(", ")}
            </div>
          </div>
        )}

        <motion.button
          onClick={completeSetup}
          className={`complete-button ${
            selectedClasses.length === 3 ? "ready" : "disabled"
          }`}
          disabled={selectedClasses.length !== 3}
          whileHover={selectedClasses.length === 3 ? { scale: 1.05 } : {}}
          whileTap={selectedClasses.length === 3 ? { scale: 0.95 } : {}}
          aria-disabled={selectedClasses.length !== 3}
        >
          Begin Adventure
        </motion.button>

        {/* Added class comparison table with clickable emojis */}
        <div className="class-comparison">
          <h3>Class Comparison</h3>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Health</th>
                <th>Starting Gold</th>
                <th>Style</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(CLASS_DATA).map(([rank, info]) => {
                const numericRank = parseInt(rank);
                const isSelected = selectedClasses.includes(numericRank);
                const isHovered = emojiHovered === numericRank;

                return (
                  <tr
                    key={rank}
                    data-rank={numericRank}
                    className={isSelected ? "selected-row" : ""}
                  >
                    <td className="class-cell">
                      <motion.span
                        className={`select-emoji ${
                          isSelected ? "selected" : ""
                        } ${isHovered ? "hovered" : ""}`}
                        onClick={() => toggleClassSelection(rank)}
                        onMouseEnter={() => handleEmojiHover(numericRank)}
                        onMouseLeave={handleEmojiLeave}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={`Select ${info.name}`}
                        role="button"
                      >
                        {heroEmojis[numericRank]}
                      </motion.span>
                      <span className="class-name">{info.name}</span>
                    </td>
                    <td>{info.health}</td>
                    <td>{info.startingGold}</td>
                    <td>
                      {info.description?.split(".")[0] || "Strategic combat"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="table-tip">
            <span className="tip-icon">💡</span>
            <span className="tip-text">
              Click on the icons to the left of hero names to quickly select
              them
            </span>
          </div>
        </div>

        <Tooltip id="ability-tooltip" />

        {/* Add CSS styles as a regular style element */}
        <style>
          {`
          .comparison-table .class-cell {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .select-emoji {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 18px;
          }
          
          .select-emoji.selected {
            background: rgba(240, 199, 94, 0.5);
            box-shadow: 0 0 10px rgba(240, 199, 94, 0.7);
          }
          
          .select-emoji.hovered {
            transform: scale(1.1);
          }
          
          .selected-row {
            background: rgba(240, 199, 94, 0.15);
          }
          
          .pulse-animation {
            animation: pulse 0.8s ease;
          }
          
          @keyframes pulse {
            0% { background-color: transparent; }
            50% { background-color: rgba(240, 199, 94, 0.3); }
            100% { background-color: rgba(240, 199, 94, 0.15); }
          }
          
          .table-tip {
            margin-top: 10px;
            font-size: 14px;
            color: #b8b8c0;
            display: flex;
            align-items: center;
            gap: 5px;
          }
          
          .tip-icon {
            font-size: 16px;
          }
          
          .shake-animation {
            animation: shake 0.5s ease;
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-5px); }
            40%, 80% { transform: translateX(5px); }
          }
        `}
        </style>
      </motion.div>
    </AnimatePresence>
  );
};

export default SetupPhase;
