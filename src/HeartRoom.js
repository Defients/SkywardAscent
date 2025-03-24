import React, { useState, useEffect } from "react";
import { rollDice, HEART_ROOM_EFFECTS } from "../contexts/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip";
import "../styles/HeartRoom.css";

// Import images
import heartRoomBgImg from "../assets/images/rooms/heart_room_bg.png";
import heartAltarImg from "../assets/images/rooms/heart_altar.png";
import heartGlowImg from "../assets/images/effects/heart_glow.png";

const HeartRoom = ({ gameData, onComplete, playSound }) => {
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [rollResult, setRollResult] = useState(null);
  const [message, setMessage] = useState(
    "Choose a blessing from the Heart Room"
  );
  const [benefitOptions, setBenefitOptions] = useState([]);
  const [isRolling, setIsRolling] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [effectDescription, setEffectDescription] = useState("");
  const [animationState, setAnimationState] = useState("enter"); // enter, selection, confirmation, complete
  const [effectComplete, setEffectComplete] = useState(false);
  const [updatedHeroes, setUpdatedHeroes] = useState([...gameData.heroes]);
  const [updatedGold, setUpdatedGold] = useState(gameData.gold);
  const [showHealEffect, setShowHealEffect] = useState(false);
  const [showGoldEffect, setShowGoldEffect] = useState(false);

  // Initialize when component mounts
  useEffect(() => {
    // Prepare the available benefits
    prepareAvailableBenefits();

    // Entry animation
    setAnimationState("enter");
    setTimeout(() => {
      setAnimationState("selection");
    }, 1500);
  }, []);

  // Prepare available benefits based on game state
  const prepareAvailableBenefits = () => {
    // Create a copy of benefits
    const availableBenefits = [...HEART_ROOM_EFFECTS];

    // Disable benefits that are not applicable
    const options = availableBenefits.map((benefit) => {
      let disabled = false;

      switch (benefit.id) {
        case "revive_one":
          // Disable if no heroes are fallen
          disabled = !gameData.heroes.some((hero) => hero.health <= 0);
          break;
        case "revive_two":
          // Disable if fewer than 2 heroes are fallen
          disabled =
            gameData.heroes.filter((hero) => hero.health <= 0).length < 2;
          break;
        case "increase_max":
          // Disable if all heroes already have 20 max health
          disabled = gameData.heroes.every((hero) => hero.maxHealth >= 20);
          break;
        case "roll_buff":
          // Disable if already have roll buff
          disabled = gameData.rollBuff;
          break;
        default:
          break;
      }

      return { ...benefit, disabled };
    });

    setBenefitOptions(options);
  };

  // Handle selection of a benefit
  const selectBenefit = (benefit) => {
    // Play sound effect
    if (playSound) playSound();

    if (benefit.disabled) return;

    setSelectedBenefit(benefit);
    setAnimationState("confirmation");

    // Set confirmation message
    setEffectDescription(getEffectDescription(benefit));
  };

  // Get detailed effect description
  const getEffectDescription = (benefit) => {
    switch (benefit.id) {
      case "heal_all":
        return "All heroes will be fully restored to maximum health.";
      case "revive_one":
        return "Choose one fallen hero to revive at half maximum health. Other heroes will gain +5 health.";
      case "revive_two":
        return "Choose two fallen heroes to revive, each at half maximum health.";
      case "increase_max":
        return "All heroes' maximum health will be increased to 20, and they will be healed by the difference.";
      case "gold_blessing":
        return "Roll a d20 and gain gold equal to the result × 10 (minimum 100 gold).";
      case "roll_buff":
        return "All dice rolls in combat will be permanently increased by +1. This can only be obtained once per game.";
      default:
        return "Select this blessing to apply its effects.";
    }
  };

  // Confirm the selected benefit
  const confirmBenefit = () => {
    // Play sound effect
    if (playSound) playSound();

    setAnimationState("complete");
    setShowConfirmation(false);

    // Apply the effect
    applyEffect(selectedBenefit);
  };

  // Cancel the selection
  const cancelSelection = () => {
    // Play sound effect
    if (playSound) playSound();

    setSelectedBenefit(null);
    setAnimationState("selection");
  };

  // Apply the selected effect
  const applyEffect = (benefit) => {
    // Create a copy of heroes to modify
    const heroes = [...gameData.heroes];
    let goldAdjustment = 0;
    let rollBuffApplied = false;

    switch (benefit.id) {
      case "heal_all":
        // Fully restore all heroes
        heroes.forEach((hero) => {
          hero.health = hero.maxHealth;
        });
        setMessage("All heroes have been fully healed!");
        setUpdatedHeroes(heroes);
        setShowHealEffect(true);
        break;

      case "revive_one":
        // Find a fallen hero
        const fallenIndex = heroes.findIndex((hero) => hero.health <= 0);

        if (fallenIndex >= 0) {
          // Revive the fallen hero
          heroes[fallenIndex].health = Math.ceil(
            heroes[fallenIndex].maxHealth / 2
          );

          // Add health to others
          heroes.forEach((hero, index) => {
            if (index !== fallenIndex && hero.health > 0) {
              hero.health = Math.min(hero.maxHealth, hero.health + 5);
            }
          });

          setMessage(
            `${heroes[fallenIndex].class} has been revived and others gained +5 health!`
          );
          setUpdatedHeroes(heroes);
          setShowHealEffect(true);
        }
        break;

      case "revive_two":
        // Find up to two fallen heroes
        const fallenIndices = [];
        heroes.forEach((hero, index) => {
          if (hero.health <= 0 && fallenIndices.length < 2) {
            fallenIndices.push(index);
          }
        });

        if (fallenIndices.length > 0) {
          // Revive the fallen heroes
          fallenIndices.forEach((index) => {
            heroes[index].health = Math.floor(heroes[index].maxHealth / 2);
          });

          setMessage(`${fallenIndices.length} heroes have been revived!`);
          setUpdatedHeroes(heroes);
          setShowHealEffect(true);
        }
        break;

      case "increase_max":
        // Increase max health to 20
        heroes.forEach((hero) => {
          if (hero.maxHealth < 20) {
            const healthDiff = 20 - hero.maxHealth;
            hero.maxHealth = 20;
            hero.health = Math.min(20, hero.health + healthDiff);
          }
        });

        setMessage("All heroes' maximum health increased to 20!");
        setUpdatedHeroes(heroes);
        setShowHealEffect(true);
        break;

      case "gold_blessing":
        // Roll for gold
        setIsRolling(true);

        // Animate dice rolling
        let rollCounter = 0;
        const rollInterval = setInterval(() => {
          const tempRoll = rollDice(20);
          setRollResult(tempRoll);
          rollCounter++;

          if (rollCounter >= 10) {
            clearInterval(rollInterval);

            // Final roll
            const roll = rollDice(20);
            setRollResult(roll);

            const goldGain = Math.max(100, roll * 10);
            goldAdjustment = goldGain;
            setUpdatedGold(gameData.gold + goldGain);
            setMessage(`Rolled ${roll}! Gained ${goldGain} gold!`);
            setIsRolling(false);
            setShowGoldEffect(true);
          }
        }, 100);
        break;

      case "roll_buff":
        // Apply permanent roll buff
        rollBuffApplied = true;
        setMessage("All future die rolls will get +1!");
        break;

      default:
        setMessage("Blessing applied.");
        break;
    }

    // Mark effect as complete after animations
    setTimeout(() => {
      setEffectComplete(true);
    }, 2500);

    // Prepare data for completion callback
    const updates = {
      heroes: updatedHeroes,
    };

    if (goldAdjustment > 0) {
      updates.gold = gameData.gold + goldAdjustment;
    }

    if (rollBuffApplied) {
      updates.rollBuff = true;
    }

    // After a delay, complete the room
    setTimeout(() => {
      onComplete(updates);
    }, 3500);
  };

  // Render the hero selection for revive benefits
  const renderHeroSelection = () => {
    return (
      <div className="hero-selection">
        <h3>Select heroes to revive:</h3>
        <div className="fallen-heroes">
          {gameData.heroes
            .filter((hero) => hero.health <= 0)
            .map((hero, index) => (
              <div
                key={index}
                className="fallen-hero"
                onClick={() => {
                  // Logic to select this hero for revival
                }}
              >
                <div className="hero-name">{hero.class}</div>
                <div className="hero-spec">{hero.specialization}</div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className="heart-room"
      style={{ backgroundImage: `url(${heartRoomBgImg})` }}
    >
      <AnimatePresence mode="wait">
        {/* Entry animation */}
        {animationState === "enter" && (
          <motion.div
            className="room-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2>Heart Room</h2>
            <div className="intro-text">
              <p>
                You've entered a sanctuary of mystical energy. The heart-shaped
                altar pulses with healing light...
              </p>
            </div>
          </motion.div>
        )}

        {/* Selection phase */}
        {animationState === "selection" && (
          <motion.div
            className="blessing-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <h2>Heart Room Blessing</h2>

            <div className="altar-container">
              <img
                src={heartAltarImg}
                alt="Heart Altar"
                className="altar-image"
              />
              <div className="altar-glow">
                <img
                  src={heartGlowImg}
                  alt="Heart Glow"
                  className="glow-image"
                />
              </div>
            </div>

            <div className="blessing-message">
              {message}
              {rollResult && (
                <div className="roll-result">Dice Roll: {rollResult}</div>
              )}
            </div>

            <div className="benefits-grid">
              {benefitOptions.map((benefit) => (
                <motion.div
                  key={benefit.id}
                  className={`benefit-option ${
                    benefit.disabled ? "disabled" : ""
                  } ${selectedBenefit === benefit ? "selected" : ""}`}
                  onClick={() => selectBenefit(benefit)}
                  whileHover={!benefit.disabled ? { scale: 1.05, y: -5 } : {}}
                  whileTap={!benefit.disabled ? { scale: 0.95 } : {}}
                  data-tooltip-id="benefit-tooltip"
                  data-tooltip-content={getEffectDescription(benefit)}
                >
                  <div className="benefit-light"></div>
                  <div className="benefit-icon">{benefit.icon}</div>
                  <h3 className="benefit-title">{benefit.title}</h3>
                  <p className="benefit-description">{benefit.description}</p>
                  {benefit.disabled && (
                    <div className="disabled-overlay">
                      <span className="disabled-text">Not Available</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="heart-room-heroes">
              <h3>Heroes Status</h3>
              <div className="heroes-list">
                {gameData.heroes.map((hero, index) => (
                  <div
                    key={index}
                    className={`hero-status ${
                      hero.health <= 0
                        ? "fallen"
                        : hero.health < hero.maxHealth
                        ? "wounded"
                        : "healthy"
                    }`}
                  >
                    <div className="hero-name">{hero.class}</div>
                    <div className="hero-health-bar">
                      <div
                        className="health-fill"
                        style={{
                          width: `${(hero.health / hero.maxHealth) * 100}%`,
                        }}
                      ></div>
                      <div className="health-text">
                        {hero.health} / {hero.maxHealth}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Confirmation phase */}
        {animationState === "confirmation" && selectedBenefit && (
          <motion.div
            className="blessing-confirmation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="confirmation-content">
              <h2>Confirm Blessing</h2>

              <div className="selected-blessing">
                <div className="blessing-icon">{selectedBenefit.icon}</div>
                <div className="blessing-details">
                  <h3>{selectedBenefit.title}</h3>
                  <p>{selectedBenefit.description}</p>
                </div>
              </div>

              <div className="effect-description">
                <p>{effectDescription}</p>
              </div>

              <div className="confirmation-buttons">
                <motion.button
                  className="cancel-button"
                  onClick={cancelSelection}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="confirm-button"
                  onClick={confirmBenefit}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Confirm
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Effect application phase */}
        {animationState === "complete" && (
          <motion.div
            className="blessing-applied"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2>Blessing Applied</h2>

            <div className="effect-animation">
              {isRolling ? (
                <div className="dice-rolling">
                  <div className="dice">{rollResult || "?"}</div>
                </div>
              ) : (
                <div className="effect-icon">
                  {selectedBenefit?.icon}
                  {showHealEffect && <div className="heal-effect"></div>}
                  {showGoldEffect && <div className="gold-effect"></div>}
                </div>
              )}
            </div>

            <div className="effect-message">{message}</div>

            {/* Show updated heroes status */}
            {selectedBenefit?.id !== "gold_blessing" && (
              <div className="updated-heroes">
                <h3>Updated Hero Status</h3>
                <div className="heroes-list">
                  {updatedHeroes.map((hero, index) => {
                    const originalHero = gameData.heroes[index];
                    const hasChanged =
                      hero.health !== originalHero.health ||
                      hero.maxHealth !== originalHero.maxHealth;

                    return (
                      <div
                        key={index}
                        className={`hero-status ${
                          hero.health <= 0 ? "fallen" : "alive"
                        } ${hasChanged ? "changed" : ""}`}
                      >
                        <div className="hero-name">{hero.class}</div>
                        <div className="hero-health-bar">
                          <div
                            className="health-fill"
                            style={{
                              width: `${(hero.health / hero.maxHealth) * 100}%`,
                            }}
                          ></div>
                          <div className="health-text">
                            {hero.health} / {hero.maxHealth}
                            {hasChanged && (
                              <span className="health-change">
                                {hero.health > originalHero.health
                                  ? `+${hero.health - originalHero.health}`
                                  : hero.health < originalHero.health
                                  ? `-${originalHero.health - hero.health}`
                                  : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Show updated gold if applicable */}
            {selectedBenefit?.id === "gold_blessing" && (
              <div className="updated-gold">
                <h3>Gold Received</h3>
                <div className="gold-change">
                  <span className="gold-icon">💰</span>
                  <span className="gold-amount">{updatedGold}</span>
                  <span className="gold-difference">
                    (+{updatedGold - gameData.gold})
                  </span>
                </div>
              </div>
            )}

            {effectComplete && (
              <div className="continue-message">Continuing to next room...</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Tooltip id="benefit-tooltip" />
    </div>
  );
};

export default HeartRoom;
