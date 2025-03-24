import React, { useState, useEffect, useRef } from "react";
import { TIERS, HEART_ROOM_EFFECTS } from "./contexts/GameContext";
import HeartRoom from "./HeartRoom";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip";
import "./styles/SpireClimb.css";

// Import placeholder utilities
import PlaceholderUtils from "./PlaceholderUtils";

// Create placeholder images for assets (since we can't directly access the assets)
const createPlaceholder = (name, width = 200, height = 150) => {
  return PlaceholderUtils.createPlaceholder(name, width, height);
};

// Create placeholder images
const diamondRoomImg = createPlaceholder("Diamond Room", 320, 200);
const clubRoomImg = createPlaceholder("Club Room", 320, 200);
const heartRoomImg = createPlaceholder("Heart Room", 320, 200);
const spadeRoomImg = createPlaceholder("Spade Room", 320, 200);
const spadeEliteRoomImg = createPlaceholder("Elite Spade Room", 320, 200);
const finalBossRoomImg = createPlaceholder("Final Boss Room", 320, 200);
const fogImg = createPlaceholder("Fog", 100, 100);
const compassImg = createPlaceholder("Compass", 32, 32);

// Room mapping for images and descriptions
const ROOM_DATA = {
  diamond: {
    name: "Merchant",
    description: "Purchase items, weapons, and services with your gold.",
    icon: "♦️",
    image: diamondRoomImg,
    color: "#e74c3c",
  },
  club: {
    name: "Monster",
    description: "Battle a standard monster for gold and experience.",
    icon: "♣️",
    image: clubRoomImg,
    color: "#2ecc71",
  },
  heart: {
    name: "Blessing",
    description: "Choose one of several beneficial effects for your party.",
    icon: "❤️",
    image: heartRoomImg,
    color: "#e74c3c",
  },
  spade: {
    name: "Elite Monster",
    description: "Face a stronger monster for better rewards.",
    icon: "♠️",
    image: spadeRoomImg,
    color: "#34495e",
  },
  "spade+": {
    name: "Mini-Boss",
    description:
      "A challenging battle against a powerful foe with exceptional rewards.",
    icon: "♠️+",
    image: spadeEliteRoomImg,
    color: "#34495e",
  },
  final_boss: {
    name: "Final Boss",
    description: "The ultimate confrontation with Apexus, the Astral Overlord.",
    icon: "👑",
    image: finalBossRoomImg,
    color: "#9b59b6",
  },
};

const SpireClimb = ({
  gameData,
  onEnterRoom,
  onComplete,
  onSaveGame,
  playSound,
}) => {
  // State for path and progression
  const [currentTierPath, setCurrentTierPath] = useState([]);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [selectedPath, setSelectedPath] = useState(null);
  const [pathPosition, setPathPosition] = useState(0);
  const [pathAnimation, setPathAnimation] = useState(false);
  const [revealedRooms, setRevealedRooms] = useState([]);
  const [fogOfWar, setFogOfWar] = useState(true);

  // UI state
  const [message, setMessage] = useState("");
  const [showRoomPreview, setShowRoomPreview] = useState(false);
  const [previewRoom, setPreviewRoom] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [roomIcons, setRoomIcons] = useState({});
  const [partyStatus, setPartyStatus] = useState(null);

  // Special states
  const [showingHeartRoom, setShowingHeartRoom] = useState(false);
  const [showTierCompletion, setShowTierCompletion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showTips, setShowTips] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);

  // Animation states
  const [roomEnterAnimation, setRoomEnterAnimation] = useState(false);
  const [pathRevealAnimation, setPathRevealAnimation] = useState(false);
  const [heroStatusAnimation, setHeroStatusAnimation] = useState(false);

  // Refs
  const pathRef = useRef(null);
  const tierProgressRef = useRef(null);

  // Initialize when component mounts or tier changes
  useEffect(() => {
    try {
      setIsLoading(true);
      initializeTierPath();
      updatePartyStatus();

      // Handle tier transitions
      if (
        gameData.previousTier &&
        gameData.currentTier > gameData.previousTier
      ) {
        setShowTierCompletion(true);
        setTimeout(() => {
          setShowTierCompletion(false);
        }, 5000); // Show completion screen for 5 seconds
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Error initializing spire climb:", err);
      setError("Failed to initialize the spire. Please try again.");
      setIsLoading(false);
    }
  }, [gameData.currentTier]);

  // Tips rotation
  useEffect(() => {
    const tipsList = [
      "💡 Different room types offer different rewards and challenges!",
      "💡 Heart rooms can heal your party or provide powerful buffs.",
      "💡 Save your strongest heroes for elite monster rooms (♠️).",
      "💡 Use the compass to reveal the path ahead when planning your route.",
      "💡 Don't forget to visit merchants to spend your hard-earned gold!",
      "💡 Your party's health status affects combat performance.",
      "💡 Each tier of the spire is more challenging than the last.",
      "💡 When choosing paths, consider your party's current health and capabilities.",
    ];

    if (showTips) {
      const interval = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % tipsList.length);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [showTips]);

  // Update party status
  const updatePartyStatus = () => {
    try {
      const aliveHeroes = gameData.heroes.filter((hero) => hero.health > 0);
      const totalHealth = aliveHeroes.reduce(
        (total, hero) => total + hero.health,
        0
      );
      const maxHealth = aliveHeroes.reduce(
        (total, hero) => total + hero.maxHealth,
        0
      );
      const healthPercentage =
        maxHealth > 0 ? (totalHealth / maxHealth) * 100 : 0;

      let status;
      if (healthPercentage >= 80) {
        status = { text: "Excellent", color: "#4caf50" };
      } else if (healthPercentage >= 60) {
        status = { text: "Good", color: "#8bc34a" };
      } else if (healthPercentage >= 40) {
        status = { text: "Fair", color: "#ffc107" };
      } else if (healthPercentage >= 20) {
        status = { text: "Poor", color: "#ff9800" };
      } else {
        status = { text: "Critical", color: "#f44336" };
      }

      // Trigger animation when status changes
      if (partyStatus && partyStatus.status?.text !== status.text) {
        setHeroStatusAnimation(true);
        setTimeout(() => setHeroStatusAnimation(false), 1000);
      }

      setPartyStatus({
        aliveCount: aliveHeroes.length,
        totalHealth,
        maxHealth,
        healthPercentage,
        status,
      });
    } catch (err) {
      console.error("Error updating party status:", err);
    }
  };

  // Set up the path for the current tier
  const initializeTierPath = () => {
    try {
      const tierPath = TIERS[gameData.currentTier];
      if (!tierPath) {
        // Game completed
        setMessage("You have reached the end of the spire!");
        onComplete({ gameCompleted: true });
        return;
      }

      // Generate room icons
      const icons = {};
      tierPath.forEach((room, index) => {
        if (Array.isArray(room)) {
          // For each path choice, create an icon
          room.forEach((pathRoom, pathIndex) => {
            icons[`${index}-${pathIndex}`] = getRoomIcon(pathRoom);
          });
        } else {
          icons[index] = getRoomIcon(room);
        }
      });

      setRoomIcons(icons);
      setCurrentTierPath(tierPath);
      setCurrentRoomIndex(0);
      setMessage(
        `Tier ${gameData.currentTier}: ${getTierName(gameData.currentTier)}`
      );

      // Initialize revealed rooms - show first few rooms
      setRevealedRooms([0, 1]);
      setPathRevealAnimation(true);
      setTimeout(() => setPathRevealAnimation(false), 1500);

      // Show tips for new players
      if (gameData.currentTier === 1) {
        setShowTips(true);
      }

      // Add welcome notification
      addNotification(
        `Welcome to ${getTierName(gameData.currentTier)}!`,
        "info"
      );
    } catch (err) {
      console.error("Error initializing tier path:", err);
      setError("Failed to generate the spire path. Please try again.");
    }
  };

  // Add a notification
  const addNotification = (text, type = "info") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, text, type }]);

    // Auto-remove after delay
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  // Get tier name based on current tier
  const getTierName = (tier) => {
    switch (tier) {
      case 1:
        return "The Lower Spire";
      case 2:
        return "The Middle Ascent";
      case 3:
        return "The Upper Heights";
      default:
        return `Tier ${tier}`;
    }
  };

  // Handle room selection when path splits
  const handlePathSelection = (pathIndex) => {
    // Play sound effect
    if (playSound) playSound();

    setSelectedPath(pathIndex);

    // Get the selected path
    const choices = currentTierPath[currentRoomIndex];
    const selectedRoom = choices[pathIndex];

    // Update the path with the selection
    const updatedPath = [...currentTierPath];
    updatedPath[currentRoomIndex] = selectedRoom;
    setCurrentTierPath(updatedPath);

    // Animate path selection
    setPathAnimation(true);
    addNotification(`Path selected: ${getRoomName(selectedRoom)}`, "success");

    setTimeout(() => {
      setPathAnimation(false);
      // Move to the room
      proceedToRoom();
    }, 800);
  };

  // Proceed to the current room
  const proceedToRoom = () => {
    // Play sound effect
    if (playSound) playSound();

    // Animate room entry
    setRoomEnterAnimation(true);
    setTimeout(() => setRoomEnterAnimation(false), 1000);

    // If at the end of the tier, move to next tier
    if (currentRoomIndex >= currentTierPath.length) {
      setMessage(
        `Completed Tier ${gameData.currentTier}. Moving to next tier...`
      );

      // Heal all heroes at tier completion
      const updatedHeroes = gameData.heroes.map((hero) => ({
        ...hero,
        health: hero.maxHealth,
        isTapped: false,
      }));

      addNotification(
        `Tier ${gameData.currentTier} completed! All heroes fully healed.`,
        "success"
      );

      onComplete({
        heroes: updatedHeroes,
        currentTier: gameData.currentTier + 1,
        previousTier: gameData.currentTier,
      });
      return;
    }

    // Get the current room
    const currentRoom = currentTierPath[currentRoomIndex];

    // If room is an array, it's a path split
    if (Array.isArray(currentRoom)) {
      setMessage("The path splits ahead. Choose your route:");
      return;
    }

    // Reveal next rooms in fog of war
    revealNextRooms();

    // Handle heart room separately
    if (currentRoom === "heart") {
      setMessage(
        "You've entered a Heart Room. Choose a blessing for your party."
      );
      setShowingHeartRoom(true);
      return;
    }

    // Handle final boss room
    if (currentRoom === "final_boss") {
      setMessage("The final confrontation awaits...");
      // Show special animation or confirmation
      addNotification(
        "Prepare for the ultimate battle with Apexus, the Astral Overlord!",
        "warning"
      );

      setTimeout(() => {
        onEnterRoom("final_boss");
      }, 2000);
      return;
    }

    // Proceed to the selected room
    setMessage(`Entering ${getRoomName(currentRoom)} room...`);
    onEnterRoom(currentRoom);
  };

  // Reveal next rooms in fog of war
  const revealNextRooms = () => {
    const nextRoomIndexes = [currentRoomIndex + 1];

    // Also reveal the room after next if it exists
    if (currentRoomIndex + 2 < currentTierPath.length) {
      nextRoomIndexes.push(currentRoomIndex + 2);
    }

    // Apply reveal animation to newly revealed rooms
    setPathRevealAnimation(true);
    setTimeout(() => setPathRevealAnimation(false), 1500);

    setRevealedRooms([...new Set([...revealedRooms, ...nextRoomIndexes])]);
  };

  // Toggle fog of war
  const toggleFogOfWar = () => {
    // Play sound effect
    if (playSound) playSound();

    setFogOfWar(!fogOfWar);
    addNotification(
      fogOfWar ? "Map fully revealed!" : "Fog of war enabled",
      "info"
    );
  };

  // Get a friendly name for room types
  const getRoomName = (roomType) => {
    return ROOM_DATA[roomType]?.name || roomType;
  };

  // Get an icon for room types
  const getRoomIcon = (roomType) => {
    return ROOM_DATA[roomType]?.icon || "❓";
  };

  // Get room description for hovering
  const getRoomDescription = (roomType) => {
    return ROOM_DATA[roomType]?.description || "Unknown room type.";
  };

  // Show preview of a room
  const handleRoomHover = (roomType, index) => {
    // Only show preview if room is revealed in fog of war
    if (fogOfWar && !revealedRooms.includes(index)) {
      return;
    }

    setPreviewRoom(roomType);
    setShowRoomPreview(true);
  };

  // Hide room preview
  const handleRoomLeave = () => {
    setShowRoomPreview(false);
  };

  // Move to next room after current room is completed
  const continueToNextRoom = () => {
    setCurrentRoomIndex(currentRoomIndex + 1);
    setShowingHeartRoom(false);
    setSelectedPath(null);

    // Update path position for animation
    setPathPosition(currentRoomIndex + 1);

    // Check if we're at the end of the tier
    if (currentRoomIndex + 1 >= currentTierPath.length) {
      setMessage(
        `Completed Tier ${gameData.currentTier}. Moving to next tier...`
      );

      // Heal all heroes at tier completion
      const updatedHeroes = gameData.heroes.map((hero) => ({
        ...hero,
        health: hero.maxHealth,
        isTapped: false,
      }));

      onComplete({
        heroes: updatedHeroes,
        currentTier: gameData.currentTier + 1,
        previousTier: gameData.currentTier,
      });
    } else {
      // Proceed to the next room
      setTimeout(() => {
        proceedToRoom();
      }, 500);
    }
  };

  // Handle heart room completion
  const handleHeartRoomComplete = (updates) => {
    // Apply heart room benefits
    setShowingHeartRoom(false);

    // Add notification based on what happened in the heart room
    if (updates.heroes) {
      // Check what was updated
      if (
        gameData.heroes.some((h, i) => h.health !== updates.heroes[i].health)
      ) {
        addNotification("Hearts restored with the blessing!", "success");
      }
    }

    if (updates.gold && updates.gold > gameData.gold) {
      addNotification(
        `Gained ${
          updates.gold - gameData.gold
        } gold from the heart room blessing!`,
        "success"
      );
    }

    if (updates.rollBuff) {
      addNotification(
        "All future dice rolls will be enhanced by +1!",
        "success"
      );
    }

    // Move to next room
    continueToNextRoom();
  };

  // Handle save game
  const handleSaveGame = () => {
    // Play sound effect
    if (playSound) playSound();

    // Call parent save function
    if (onSaveGame) {
      onSaveGame();
      addNotification("Game saved successfully!", "success");
    }

    // Close menu
    setShowMenu(false);
  };

  // Get room accessibility status
  const getRoomStatus = (index) => {
    if (index < currentRoomIndex) {
      return "completed";
    } else if (index === currentRoomIndex) {
      return "current";
    } else {
      if (fogOfWar && !revealedRooms.includes(index)) {
        return "hidden";
      }
      return "upcoming";
    }
  };

  // If showing loading
  if (isLoading) {
    return (
      <div className="spire-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Mapping the Astral Spire...</div>
      </div>
    );
  }

  // If there's an error
  if (error) {
    return (
      <div className="spire-error">
        <div className="error-icon">⚠️</div>
        <div className="error-message">{error}</div>
        <button onClick={initializeTierPath} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  // If showing heart room
  if (showingHeartRoom) {
    return (
      <HeartRoom
        gameData={gameData}
        onComplete={handleHeartRoomComplete}
        playSound={playSound}
      />
    );
  }

  // Render tier completion animation
  if (showTierCompletion) {
    return (
      <div className="tier-completion">
        <motion.div
          className="completion-content"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <h2>Tier {gameData.currentTier - 1} Completed!</h2>
          <div className="tier-rewards">
            <div className="reward">
              <span className="reward-icon">❤️</span>
              <span className="reward-text">All heroes fully healed</span>
            </div>
            <div className="reward">
              <span className="reward-icon">🏆</span>
              <span className="reward-text">Progress saved</span>
            </div>
            <div className="reward">
              <span className="reward-icon">🌟</span>
              <span className="reward-text">Experience gained</span>
            </div>
          </div>
          <div className="next-tier">
            <h3>Entering {getTierName(gameData.currentTier)}</h3>
            <p>Prepare for greater challenges and rewards...</p>

            <motion.div
              className="tier-facts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <div className="tier-fact">
                <span className="fact-icon">⚔️</span>
                <span className="fact-text">Monsters will be stronger</span>
              </div>
              <div className="tier-fact">
                <span className="fact-icon">💰</span>
                <span className="fact-text">Rewards will be more valuable</span>
              </div>
              <div className="tier-fact">
                <span className="fact-icon">🧠</span>
                <span className="fact-text">Strategy becomes more crucial</span>
              </div>
            </motion.div>

            <motion.button
              className="continue-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3, duration: 0.5 }}
              onClick={() => setShowTierCompletion(false)}
            >
              Begin Ascent
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render the spire climb interface
  return (
    <div className="spire-climb">
      {/* Notifications area */}
      <div className="notifications-area">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              className={`notification ${notification.type}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              <span className="notification-icon">
                {notification.type === "success"
                  ? "✅"
                  : notification.type === "warning"
                  ? "⚠️"
                  : notification.type === "error"
                  ? "❌"
                  : "ℹ️"}
              </span>
              <span className="notification-text">{notification.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="spire-header">
        <h2>The Astral Spire - {getTierName(gameData.currentTier)}</h2>
        <div className="spire-message">{message}</div>
      </div>

      {/* Tips section */}
      <AnimatePresence>
        {showTips && (
          <motion.div
            className="tips-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="tip-content">
              {/* Dynamically rendered current tip */}
              <motion.div
                key={currentTip}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="current-tip"
              >
                {/* This would show the current tip from our tips array */}
              </motion.div>
            </div>
            <button
              className="close-tips"
              onClick={() => setShowTips(false)}
              aria-label="Close tips"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top controls & info bar */}
      <div className="spire-controls">
        <div className="tier-progress" ref={tierProgressRef}>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${(currentRoomIndex / currentTierPath.length) * 100}%`,
              }}
            ></div>
          </div>
          <div className="room-count">
            Room {currentRoomIndex + 1} of {currentTierPath.length}
          </div>
        </div>

        <div className="controls-right">
          <button
            className={`fog-toggle ${fogOfWar ? "active" : "inactive"}`}
            onClick={toggleFogOfWar}
            data-tooltip-id="spire-tooltip"
            data-tooltip-content="Toggle Fog of War"
            aria-label={fogOfWar ? "Show all rooms" : "Enable fog of war"}
          >
            <img src={compassImg} alt="Toggle Fog" className="compass-icon" />
          </button>

          <button
            className="inventory-button"
            onClick={() => setShowInventory(!showInventory)}
            data-tooltip-id="spire-tooltip"
            data-tooltip-content="View Inventory"
            aria-label="View inventory"
          >
            🎒
          </button>

          <button
            className="menu-button"
            onClick={() => setShowMenu(!showMenu)}
            data-tooltip-id="spire-tooltip"
            data-tooltip-content="Menu"
            aria-label="Open menu"
          >
            ≡
          </button>
        </div>
      </div>

      {/* Main path visualization */}
      <div
        className={`path-visualization ${
          pathRevealAnimation ? "revealing" : ""
        } ${roomEnterAnimation ? "entering-room" : ""}`}
        ref={pathRef}
      >
        <div className={`path-container ${pathAnimation ? "animating" : ""}`}>
          {currentTierPath.map((room, index) => {
            const roomStatus = getRoomStatus(index);

            // For path choice
            if (Array.isArray(room) && index === currentRoomIndex) {
              return (
                <div key={`choice-${index}`} className="path-choice">
                  <div className="path-choice-label">Choose your path:</div>
                  <div className="path-options">
                    {room.map((pathRoom, pathIndex) => (
                      <motion.div
                        key={`option-${index}-${pathIndex}`}
                        className="path-option"
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onMouseEnter={() => handleRoomHover(pathRoom, index)}
                        onMouseLeave={handleRoomLeave}
                        aria-label={`${getRoomName(pathRoom)} path option`}
                      >
                        <button
                          className={`room-button choice ${pathRoom}`}
                          onClick={() => handlePathSelection(pathIndex)}
                          data-tooltip-id="spire-tooltip"
                          data-tooltip-content={getRoomDescription(pathRoom)}
                          aria-label={`Select ${getRoomName(pathRoom)} path`}
                        >
                          <div className="room-icon">
                            {roomIcons[`${index}-${pathIndex}`] ||
                              getRoomIcon(pathRoom)}
                          </div>
                          <div className="room-name">
                            {getRoomName(pathRoom)}
                          </div>
                          <img
                            src={ROOM_DATA[pathRoom]?.image || clubRoomImg}
                            alt={getRoomName(pathRoom)}
                            className="room-image"
                          />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            }

            // Regular room
            return (
              <div
                key={`room-${index}`}
                className={`path-room ${roomStatus} ${
                  pathRevealAnimation &&
                  revealedRooms.includes(index) &&
                  roomStatus === "upcoming"
                    ? "revealing"
                    : ""
                }`}
                onMouseEnter={() =>
                  handleRoomHover(Array.isArray(room) ? "choice" : room, index)
                }
                onMouseLeave={handleRoomLeave}
                aria-label={
                  Array.isArray(room)
                    ? "Path Split"
                    : `${getRoomName(room)} room ${
                        roomStatus === "completed"
                          ? "completed"
                          : roomStatus === "current"
                          ? "current"
                          : "upcoming"
                      }`
                }
              >
                {Array.isArray(room) ? (
                  <div className="path-split">
                    <div className="split-icon">🔀</div>
                    <div className="split-text">Path Split</div>
                  </div>
                ) : (
                  <div className={`room ${room}`}>
                    <div className="room-icon">
                      {roomIcons[index] || getRoomIcon(room)}
                    </div>
                    <div className="room-name">{getRoomName(room)}</div>
                    {roomStatus === "hidden" && fogOfWar ? (
                      <div className="fog-overlay">
                        <img src={fogImg} alt="Fog" className="fog-image" />
                        <span className="fog-icon">?</span>
                      </div>
                    ) : (
                      <img
                        src={ROOM_DATA[room]?.image || clubRoomImg}
                        alt={getRoomName(room)}
                        className="room-image"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Connector lines between rooms */}
          <div className="path-connections">
            {currentTierPath.map((_, index) => {
              if (index < currentTierPath.length - 1) {
                return (
                  <div
                    key={`connector-${index}`}
                    className={`path-connector ${
                      index < currentRoomIndex ? "completed" : ""
                    } ${index === currentRoomIndex ? "current" : ""}`}
                    aria-hidden="true"
                  ></div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>

      {/* Room preview */}
      <AnimatePresence>
        {showRoomPreview && previewRoom && (
          <motion.div
            className="room-preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            role="status"
            aria-live="polite"
          >
            <div className="preview-header">
              <div className="preview-icon">{getRoomIcon(previewRoom)}</div>
              <h3 className="preview-title">{getRoomName(previewRoom)}</h3>
            </div>
            <p className="preview-description">
              {getRoomDescription(previewRoom)}
            </p>
            {previewRoom === "heart" && (
              <div className="preview-extra">
                <p>
                  Possible blessings: healing, revive, stat boosts, and more!
                </p>
              </div>
            )}
            {(previewRoom === "club" ||
              previewRoom === "spade" ||
              previewRoom === "spade+") && (
              <div className="preview-extra">
                <p>
                  Prepare for combat! Stronger monsters give better rewards.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Heroes status */}
      <div
        className={`heroes-status ${
          heroStatusAnimation ? "status-changed" : ""
        }`}
      >
        <div className="status-header">
          <h3>Party Status</h3>
          {partyStatus && (
            <div
              className="party-condition"
              style={{ color: partyStatus.status.color }}
            >
              {partyStatus.status.text}
            </div>
          )}
        </div>

        <motion.div
          className="hero-list"
          initial={{ opacity: 1 }}
          animate={{
            x: heroStatusAnimation ? [0, -5, 5, -5, 5, 0] : 0,
          }}
          transition={{ duration: 0.5 }}
        >
          {gameData.heroes.map((hero, index) => (
            <div
              key={index}
              className={`hero-status ${hero.health <= 0 ? "fallen" : ""}`}
              data-tooltip-id="hero-tooltip"
              data-tooltip-content={`${hero.class} - ${hero.specialization}
Health: ${hero.health}/${hero.maxHealth}
${hero.weapon ? `Weapon: ${hero.weapon.name}` : "No weapon equipped"}`}
              tabIndex={0}
              aria-label={`${hero.class}: ${hero.health} of ${
                hero.maxHealth
              } health ${hero.health <= 0 ? "- Fallen" : ""}`}
            >
              <div className="hero-portrait">
                <div className="hero-class">{hero.class.charAt(0)}</div>
                {hero.health <= 0 && <div className="fallen-marker">✝️</div>}
              </div>
              <div className="hero-details">
                <div className="hero-name">{hero.class}</div>
                <div className="hero-health-bar">
                  <div
                    className="health-fill"
                    style={{
                      width: `${(hero.health / hero.maxHealth) * 100}%`,
                      backgroundColor:
                        hero.health < hero.maxHealth * 0.25
                          ? "#f44336"
                          : hero.health < hero.maxHealth * 0.5
                          ? "#ff9800"
                          : hero.health < hero.maxHealth * 0.75
                          ? "#ffc107"
                          : "#4caf50",
                    }}
                  ></div>
                </div>
                <div className="hero-health-value">
                  {hero.health}/{hero.maxHealth}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Action buttons */}
      <div className="spire-actions">
        {Array.isArray(currentTierPath[currentRoomIndex]) ? (
          <div className="path-instructions">Choose which path to take</div>
        ) : (
          <motion.button
            className="proceed-button"
            onClick={proceedToRoom}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`Enter ${getRoomName(
              currentTierPath[currentRoomIndex]
            )} Room`}
          >
            <span className="button-icon">🚪</span>
            Enter {getRoomName(currentTierPath[currentRoomIndex])} Room
          </motion.button>
        )}
      </div>

      {/* Inventory modal */}
      <AnimatePresence>
        {showInventory && (
          <motion.div
            className="inventory-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            role="dialog"
            aria-label="Inventory"
          >
            <motion.div
              className="inventory-content"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="inventory-header">
                <h3>Inventory</h3>
                <button
                  className="close-button"
                  onClick={() => setShowInventory(false)}
                  aria-label="Close inventory"
                >
                  ✕
                </button>
              </div>

              <div className="gold-display">
                <span className="gold-icon">💰</span>
                <span className="gold-amount">{gameData.gold}</span>
              </div>

              <div className="inventory-items">
                {gameData.inventory.length > 0 ? (
                  <div className="items-grid">
                    {gameData.inventory.map((item, index) => (
                      <div
                        key={index}
                        className="inventory-item"
                        data-tooltip-id="item-tooltip"
                        data-tooltip-content={
                          item.description || item.effect || item.name
                        }
                        tabIndex={0}
                        aria-label={item.name}
                      >
                        <div className="item-icon">{item.icon}</div>
                        <div className="item-name">{item.name}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-inventory">No items in inventory</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu modal */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            className="menu-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            role="dialog"
            aria-label="Game Menu"
          >
            <motion.div
              className="menu-content"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="menu-header">
                <h3>Game Menu</h3>
                <button
                  className="close-button"
                  onClick={() => setShowMenu(false)}
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              <div className="menu-options">
                <button
                  className="menu-option"
                  onClick={handleSaveGame}
                  aria-label="Save game"
                >
                  <span className="option-icon">💾</span>
                  <span className="option-text">Save Game</span>
                </button>

                <button
                  className="menu-option"
                  onClick={toggleFogOfWar}
                  aria-label={fogOfWar ? "Show all rooms" : "Enable fog of war"}
                >
                  <span className="option-icon">{fogOfWar ? "🔍" : "🌫️"}</span>
                  <span className="option-text">
                    {fogOfWar ? "Show All Rooms" : "Enable Fog of War"}
                  </span>
                </button>

                <button
                  className="menu-option"
                  onClick={() => setShowInventory(true)}
                  aria-label="View inventory"
                >
                  <span className="option-icon">🎒</span>
                  <span className="option-text">View Inventory</span>
                </button>

                <button
                  className="menu-option"
                  onClick={() => setShowTips(!showTips)}
                  aria-label={showTips ? "Hide tips" : "Show tips"}
                >
                  <span className="option-icon">💡</span>
                  <span className="option-text">
                    {showTips ? "Hide Tips" : "Show Tips"}
                  </span>
                </button>
              </div>

              <div className="menu-status">
                <div className="status-item">
                  <span className="status-label">Current Tier:</span>
                  <span className="status-value">{gameData.currentTier}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Heroes Alive:</span>
                  <span className="status-value">
                    {gameData.heroes.filter((h) => h.health > 0).length}/3
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Rooms Visited:</span>
                  <span className="status-value">
                    {gameData.gameStats?.roomsVisited || 0}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltips */}
      <Tooltip id="spire-tooltip" />
      <Tooltip id="hero-tooltip" />
      <Tooltip id="item-tooltip" />
    </div>
  );
};

export default SpireClimb;
