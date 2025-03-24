import React, { useState, useEffect, useRef } from "react";
import { TIERS, HEART_ROOM_EFFECTS } from "../contexts/GameContext";
import HeartRoom from "./HeartRoom";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip";
import "../styles/SpireClimb.css";

// Import images
import diamondRoomImg from "../assets/images/rooms/diamond_room.png";
import clubRoomImg from "../assets/images/rooms/club_room.png";
import heartRoomImg from "../assets/images/rooms/heart_room.png";
import spadeRoomImg from "../assets/images/rooms/spade_room.png";
import spadeEliteRoomImg from "../assets/images/rooms/spade_elite_room.png";
import finalBossRoomImg from "../assets/images/rooms/final_boss_room.png";
import fogImg from "../assets/images/rooms/fog.png";
import compassImg from "../assets/images/items/compass.png";

const SpireClimb = ({
  gameData,
  onEnterRoom,
  onComplete,
  onSaveGame,
  playSound,
}) => {
  const [currentTierPath, setCurrentTierPath] = useState([]);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [showingHeartRoom, setShowingHeartRoom] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);
  const [message, setMessage] = useState("");
  const [roomIcons, setRoomIcons] = useState({});
  const [pathPosition, setPathPosition] = useState(0);
  const [pathAnimation, setPathAnimation] = useState(false);
  const [showRoomPreview, setShowRoomPreview] = useState(false);
  const [previewRoom, setPreviewRoom] = useState(null);
  const [partyStatus, setPartyStatus] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [fogOfWar, setFogOfWar] = useState(true);
  const [revealedRooms, setRevealedRooms] = useState([]);
  const [showTierCompletion, setShowTierCompletion] = useState(false);

  // Refs
  const pathRef = useRef(null);

  // Room images mapping
  const roomImages = {
    diamond: diamondRoomImg,
    club: clubRoomImg,
    heart: heartRoomImg,
    spade: spadeRoomImg,
    "spade+": spadeEliteRoomImg,
    final_boss: finalBossRoomImg,
  };

  // Initialize when component mounts or tier changes
  useEffect(() => {
    initializeTierPath();

    // Initialize party status
    updatePartyStatus();

    // If tier is changed, show tier completion animation
    if (gameData.previousTier && gameData.currentTier > gameData.previousTier) {
      setShowTierCompletion(true);
      setTimeout(() => {
        setShowTierCompletion(false);
      }, 3000);
    }
  }, [gameData.currentTier]);

  // Update party status
  const updatePartyStatus = () => {
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

    setPartyStatus({
      aliveCount: aliveHeroes.length,
      totalHealth,
      maxHealth,
      healthPercentage,
      status,
    });
  };

  // Set up the path for the current tier
  const initializeTierPath = () => {
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

    // Initialize revealed rooms
    // Initially reveal only the first few rooms
    setRevealedRooms([0, 1]);
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
      setShowingHeartRoom(true);
      return;
    }

    // Handle final boss room
    if (currentRoom === "final_boss") {
      setMessage("The final confrontation awaits...");
      // Show special animation or confirmation
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

    setRevealedRooms([...new Set([...revealedRooms, ...nextRoomIndexes])]);
  };

  // Toggle fog of war
  const toggleFogOfWar = () => {
    // Play sound effect
    if (playSound) playSound();

    setFogOfWar(!fogOfWar);
  };

  // Get a friendly name for room types
  const getRoomName = (roomType) => {
    switch (roomType) {
      case "diamond":
        return "Merchant";
      case "club":
        return "Monster";
      case "heart":
        return "Blessing";
      case "spade":
        return "Elite Monster";
      case "spade+":
        return "Mini-Boss";
      case "final_boss":
        return "Final Boss";
      default:
        return roomType;
    }
  };

  // Get an icon for room types
  const getRoomIcon = (roomType) => {
    switch (roomType) {
      case "diamond":
        return "♦️";
      case "club":
        return "♣️";
      case "heart":
        return "❤️";
      case "spade":
        return "♠️";
      case "spade+":
        return "♠️+";
      case "final_boss":
        return "👑";
      default:
        return "❓";
    }
  };

  // Get room description for hovering
  const getRoomDescription = (roomType) => {
    switch (roomType) {
      case "diamond":
        return "Merchant Room: Purchase items, weapons, and services with your gold.";
      case "club":
        return "Monster Room: Battle a standard monster for gold and experience.";
      case "heart":
        return "Blessing Room: Choose one of several beneficial effects for your party.";
      case "spade":
        return "Elite Monster Room: Face a stronger monster for better rewards.";
      case "spade+":
        return "Mini-Boss Room: A challenging battle against a powerful foe with exceptional rewards.";
      case "final_boss":
        return "Final Boss: The ultimate confrontation with Apexus, the Astral Overlord.";
      default:
        return "Unknown room type.";
    }
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
  const handleHeartRoomComplete = (benefits) => {
    // Apply heart room benefits
    setShowingHeartRoom(false);

    // Update heroes or game state based on benefits
    // This would depend on what was selected in the HeartRoom

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
          transition={{ duration: 0.5 }}
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
          </div>
          <div className="next-tier">
            <h3>Entering {getTierName(gameData.currentTier)}</h3>
            <p>Prepare for greater challenges and rewards...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render the spire climb interface
  return (
    <div className="spire-climb">
      <div className="spire-header">
        <h2>The Astral Spire - {getTierName(gameData.currentTier)}</h2>
        <div className="spire-message">{message}</div>
      </div>

      {/* Top controls & info bar */}
      <div className="spire-controls">
        <div className="tier-progress">
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
          >
            <img src={compassImg} alt="Toggle Fog" className="compass-icon" />
          </button>

          <button
            className="inventory-button"
            onClick={() => setShowInventory(!showInventory)}
            data-tooltip-id="spire-tooltip"
            data-tooltip-content="View Inventory"
          >
            🎒
          </button>

          <button
            className="menu-button"
            onClick={() => setShowMenu(!showMenu)}
            data-tooltip-id="spire-tooltip"
            data-tooltip-content="Menu"
          >
            ≡
          </button>
        </div>
      </div>

      {/* Main path visualization */}
      <div className="path-visualization" ref={pathRef}>
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
                      >
                        <button
                          className={`room-button choice ${pathRoom}`}
                          onClick={() => handlePathSelection(pathIndex)}
                          data-tooltip-id="spire-tooltip"
                          data-tooltip-content={getRoomDescription(pathRoom)}
                        >
                          <div className="room-icon">
                            {roomIcons[`${index}-${pathIndex}`] ||
                              getRoomIcon(pathRoom)}
                          </div>
                          <div className="room-name">
                            {getRoomName(pathRoom)}
                          </div>
                          <img
                            src={roomImages[pathRoom] || clubRoomImg}
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
                className={`path-room ${roomStatus}`}
                onMouseEnter={() =>
                  handleRoomHover(Array.isArray(room) ? "choice" : room, index)
                }
                onMouseLeave={handleRoomLeave}
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
                        src={roomImages[room] || clubRoomImg}
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
                    }`}
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
          >
            <div className="preview-header">
              <div className="preview-icon">{getRoomIcon(previewRoom)}</div>
              <h3 className="preview-title">{getRoomName(previewRoom)}</h3>
            </div>
            <p className="preview-description">
              {getRoomDescription(previewRoom)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Heroes status */}
      <div className="heroes-status">
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

        <div className="hero-list">
          {gameData.heroes.map((hero, index) => (
            <div
              key={index}
              className={`hero-status ${hero.health <= 0 ? "fallen" : ""}`}
              data-tooltip-id="hero-tooltip"
              data-tooltip-content={`${hero.class} - ${hero.specialization}
Health: ${hero.health}/${hero.maxHealth}
${hero.weapon ? `Weapon: ${hero.weapon.name}` : "No weapon equipped"}`}
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
        </div>
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
                >
                  ✕
                </button>
              </div>

              <div className="menu-options">
                <button className="menu-option" onClick={handleSaveGame}>
                  <span className="option-icon">💾</span>
                  <span className="option-text">Save Game</span>
                </button>

                <button className="menu-option" onClick={toggleFogOfWar}>
                  <span className="option-icon">{fogOfWar ? "🔍" : "🌫️"}</span>
                  <span className="option-text">
                    {fogOfWar ? "Show All Rooms" : "Enable Fog of War"}
                  </span>
                </button>

                <button
                  className="menu-option"
                  onClick={() => setShowInventory(true)}
                >
                  <span className="option-icon">🎒</span>
                  <span className="option-text">View Inventory</span>
                </button>
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
