import React, { useState, useEffect, useRef } from "react";
import { rollDice } from "./contexts/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip";
import "./styles/HeartRoom.css";

// Import placeholder utils for images
import PlaceholderUtils from "./PlaceholderUtils";

// Define heart room effects
const HEART_ROOM_EFFECTS = [
  {
    id: "heal_all",
    title: "Full Restoration",
    description: "Fully restore all Heroes' health.",
    icon: "❤️",
    effect: "restoreAll",
  },
  {
    id: "revive_one",
    title: "Revive Champion",
    description:
      "Revive one fallen Hero at half max health and add +5 health to others.",
    icon: "⚕️",
    effect: "reviveOneBoostOthers",
  },
  {
    id: "revive_two",
    title: "Mass Revival",
    description: "Revive two fallen Heroes at half max health (rounded down).",
    icon: "✝️",
    effect: "reviveTwo",
  },
  {
    id: "increase_max",
    title: "Vitality Blessing",
    description:
      "Increase all Heroes' max health to 20 (and heal the difference).",
    icon: "💪",
    effect: "increaseMaxHealth",
  },
  {
    id: "gold_blessing",
    title: "Fortune's Favor",
    description: "Gain gold based on a d20 roll × 10 (minimum 100g).",
    icon: "💰",
    effect: "goldBonus",
  },
  {
    id: "roll_buff",
    title: "Cosmic Attunement",
    description: "Permanently buff all die rolls by +1 (limit once).",
    icon: "🎲",
    effect: "buffRolls",
  },
];

// Create placeholder images
const createPlaceholder = (text, width = 200, height = 200) => {
  return PlaceholderUtils.createPlaceholder(text, width, height);
};

const heartRoomBgImg = createPlaceholder("Heart Room Background", 1200, 800);
const heartAltarImg = createPlaceholder("Heart Altar", 300, 200);
const heartGlowImg = createPlaceholder("Heart Glow", 400, 300);

const HeartRoom = ({ gameData, onComplete, playSound }) => {
  // State management
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
  const [focusedHeroIndex, setFocusedHeroIndex] = useState(null);
  const [pulsateEffect, setPulsateEffect] = useState(false);
  const [accessibilityAnnounce, setAccessibilityAnnounce] = useState("");
  const [loadingEffect, setLoadingEffect] = useState(false);
  const [ambientPulse, setAmbientPulse] = useState(false);
  const [scenarioText, setScenarioText] = useState("");
  const [showScenario, setShowScenario] = useState(true);

  // Refs
  const announcementRef = useRef(null);
  const optionsContainerRef = useRef(null);

  // Initialize when component mounts with enhanced loading
  useEffect(() => {
    // Start ambient pulse effect
    setAmbientPulse(true);

    // Set the scenario text
    setScenarioText(
      "As you enter the heart-shaped room, a warm energy embraces your party. The central altar pulses with a soothing crimson light, offering respite from your journey. Ancient runes along the walls speak of restoration and blessing."
    );

    // Show loading effect
    setLoadingEffect(true);

    // Prepare the available benefits with a delay for visual effect
    setTimeout(() => {
      prepareAvailableBenefits();
      setLoadingEffect(false);

      // Entry animation sequence
      setAnimationState("enter");
      setTimeout(() => {
        setShowScenario(false);
        setTimeout(() => {
          setAnimationState("selection");

          // Start pulsating effect on the options
          setPulsateEffect(true);
          setTimeout(() => {
            setPulsateEffect(false);
          }, 2000);

          // Set accessibility announcement
          setAccessibilityAnnounce(
            "Heart Room blessings are available. Choose one to help your party."
          );
        }, 500);
      }, 4000);
    }, 1500);

    // Cleanup animation states
    return () => {
      setAmbientPulse(false);
      setPulsateEffect(false);
    };
  }, []);

  // Handle accessibility announcements
  useEffect(() => {
    if (accessibilityAnnounce && announcementRef.current) {
      announcementRef.current.textContent = accessibilityAnnounce;
    }
  }, [accessibilityAnnounce]);

  // Prepare available benefits based on game state with enhanced logic
  const prepareAvailableBenefits = () => {
    // Create a copy of benefits
    const availableBenefits = [...HEART_ROOM_EFFECTS];

    // Check if there are any fallen heroes
    const fallenHeroes = gameData.heroes.filter((hero) => hero.health <= 0);
    const allHeroesMaxHealth = gameData.heroes.every(
      (hero) => hero.maxHealth >= 20
    );

    // Add a special effect if all heroes are at low health but none are fallen
    if (
      fallenHeroes.length === 0 &&
      gameData.heroes.every((hero) => hero.health < hero.maxHealth / 2)
    ) {
      availableBenefits.push({
        id: "emergency_heal",
        title: "Emergency Rejuvenation",
        description: "Heal all heroes by 75% of their missing health.",
        icon: "⚡",
        effect: "emergencyHeal",
      });
    }

    // Disable benefits that are not applicable
    const options = availableBenefits.map((benefit) => {
      let disabled = false;

      switch (benefit.id) {
        case "revive_one":
          // Disable if no heroes are fallen
          disabled = fallenHeroes.length === 0;
          break;
        case "revive_two":
          // Disable if fewer than 2 heroes are fallen
          disabled = fallenHeroes.length < 2;
          break;
        case "increase_max":
          // Disable if all heroes already have 20 max health
          disabled = allHeroesMaxHealth;
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

  // Handle selection of a benefit with enhanced feedback
  const selectBenefit = (benefit) => {
    // Play sound effect with optional volume/pitch adjustment based on benefit type
    if (playSound) {
      const soundOptions = {};
      if (benefit.id === "gold_blessing") {
        soundOptions.pitch = 1.2; // Higher pitch for gold sound
      } else if (benefit.id.includes("revive")) {
        soundOptions.volume = 0.8; // Different volume for revival
      }
      playSound(soundOptions);
    }

    if (benefit.disabled) {
      setAccessibilityAnnounce(
        `${benefit.title} is not available in your current situation.`
      );
      return;
    }

    // Visual feedback for selection
    setSelectedBenefit(benefit);
    setAnimationState("confirmation");

    // Set confirmation message with rich details
    setEffectDescription(getEffectDescription(benefit));

    // Accessibility announcement
    setAccessibilityAnnounce(
      `${benefit.title} selected. ${getEffectDescription(benefit)}`
    );

    // Scroll to top if needed for mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Get detailed effect description with flavor text
  const getEffectDescription = (benefit) => {
    switch (benefit.id) {
      case "heal_all":
        return "The altar's energy will wash over your party, mending wounds and restoring vitality to all heroes. Each hero will be fully restored to their maximum health.";
      case "revive_one":
        return "The sacred light will reach into the beyond, bringing back one fallen hero with half their maximum health. The remaining heroes will be rejuvenated with +5 health.";
      case "revive_two":
        return "A powerful resurrection spell will be cast, enabling two fallen heroes to return to battle. Each will be revived with half their maximum health.";
      case "increase_max":
        return "The heart room's blessing will strengthen your heroes' life force, increasing their maximum health capacity to 20 and healing them by the difference.";
      case "gold_blessing":
        return "Fortune smiles upon your party. The altar will generate gold based on the favor of fate (a d20 roll × 10), with a guaranteed minimum of 100 gold.";
      case "roll_buff":
        return "The cosmic alignment grants your party enhanced precision and luck. All future dice rolls will gain a permanent +1 bonus, giving you an edge in combat.";
      case "emergency_heal":
        return "A surge of restorative energy targets the most grievous wounds of your party, healing each hero by 75% of their missing health.";
      default:
        return "Select this blessing to apply its effects to your party.";
    }
  };

  // Confirm the selected benefit with enhanced animation
  const confirmBenefit = () => {
    // Play confirmation sound effect
    if (playSound) playSound();

    // Change animation state
    setAnimationState("complete");
    setShowConfirmation(false);

    // Show loading effect briefly for dramatic pause
    setLoadingEffect(true);
    setTimeout(() => {
      setLoadingEffect(false);

      // Apply the effect
      applyEffect(selectedBenefit);
    }, 800);
  };

  // Cancel the selection with feedback
  const cancelSelection = () => {
    // Play cancel sound effect
    if (playSound) playSound();

    setSelectedBenefit(null);
    setAnimationState("selection");

    // Reset pulsate effect for options
    setPulsateEffect(true);
    setTimeout(() => {
      setPulsateEffect(false);
    }, 1500);

    // Accessibility announcement
    setAccessibilityAnnounce("Selection canceled. Please choose a blessing.");
  };

  // Apply the selected effect with enhanced visual feedback
  const applyEffect = (benefit) => {
    // Create a copy of heroes to modify
    const heroes = [...gameData.heroes];
    let goldAdjustment = 0;
    let rollBuffApplied = false;

    switch (benefit.id) {
      case "heal_all":
        // Fully restore all heroes with staggered healing animation
        heroes.forEach((hero, index) => {
          const originalHealth = hero.health;
          hero.health = hero.maxHealth;

          // Staggered focus effect for each hero
          setTimeout(() => {
            setFocusedHeroIndex(index);
            setTimeout(() => {
              setFocusedHeroIndex(null);
            }, 600);
          }, index * 400);
        });

        setMessage("All heroes have been fully healed!");
        setUpdatedHeroes(heroes);
        setShowHealEffect(true);
        setAccessibilityAnnounce(
          "All heroes have been fully restored to maximum health."
        );
        break;

      case "revive_one":
        // Find a fallen hero with interactive selection if multiple are available
        const fallenHeroes = heroes.filter((hero) => hero.health <= 0);

        if (fallenHeroes.length > 1) {
          // This should be handled with a selection UI in a real implementation
          // For this example, we'll just take the first fallen hero
          const firstFallenIndex = heroes.findIndex((hero) => hero.health <= 0);

          if (firstFallenIndex >= 0) {
            // Revive the fallen hero with dramatic effect
            setFocusedHeroIndex(firstFallenIndex);
            heroes[firstFallenIndex].health = Math.ceil(
              heroes[firstFallenIndex].maxHealth / 2
            );

            // Add health to others with sequential healing
            heroes.forEach((hero, index) => {
              if (index !== firstFallenIndex && hero.health > 0) {
                const newHealth = Math.min(hero.maxHealth, hero.health + 5);
                hero.health = newHealth;

                // Staggered focus for other heroes
                setTimeout(() => {
                  setFocusedHeroIndex(index);
                  setTimeout(() => {
                    setFocusedHeroIndex(null);
                  }, 400);
                }, (index + 2) * 300);
              }
            });

            setMessage(
              `${heroes[firstFallenIndex].class} has been revived and others gained +5 health!`
            );
            setAccessibilityAnnounce(
              `${heroes[firstFallenIndex].class} has been revived with ${heroes[firstFallenIndex].health} health. All other heroes gained 5 health.`
            );
          }
        } else if (fallenHeroes.length === 1) {
          const fallenIndex = heroes.findIndex((hero) => hero.health <= 0);

          // Revive with dramatic effect
          setFocusedHeroIndex(fallenIndex);
          heroes[fallenIndex].health = Math.ceil(
            heroes[fallenIndex].maxHealth / 2
          );

          // Heal others
          heroes.forEach((hero, index) => {
            if (index !== fallenIndex && hero.health > 0) {
              hero.health = Math.min(hero.maxHealth, hero.health + 5);

              // Staggered focus
              setTimeout(() => {
                setFocusedHeroIndex(index);
                setTimeout(() => {
                  setFocusedHeroIndex(null);
                }, 400);
              }, (index + 2) * 300);
            }
          });

          setMessage(
            `${heroes[fallenIndex].class} has been revived and others gained +5 health!`
          );
          setAccessibilityAnnounce(
            `${heroes[fallenIndex].class} has been revived with ${heroes[fallenIndex].health} health. All other heroes gained 5 health.`
          );
        }

        setUpdatedHeroes(heroes);
        setShowHealEffect(true);
        break;

      case "revive_two":
        // Find up to two fallen heroes with dramatic revival sequence
        const fallenIndices = [];
        heroes.forEach((hero, index) => {
          if (hero.health <= 0 && fallenIndices.length < 2) {
            fallenIndices.push(index);
          }
        });

        if (fallenIndices.length > 0) {
          // Revive the fallen heroes with staggered animation
          fallenIndices.forEach((index, reviveOrder) => {
            setTimeout(() => {
              setFocusedHeroIndex(index);
              heroes[index].health = Math.floor(heroes[index].maxHealth / 2);

              // Update after each revival for visual feedback
              setUpdatedHeroes([...heroes]);

              setTimeout(() => {
                setFocusedHeroIndex(null);
              }, 800);
            }, reviveOrder * 1200);
          });

          setMessage(`${fallenIndices.length} heroes have been revived!`);
          setAccessibilityAnnounce(
            `${fallenIndices.length} heroes have been revived, each with half their maximum health.`
          );
        }

        setUpdatedHeroes(heroes);
        setShowHealEffect(true);
        break;

      case "increase_max":
        // Increase max health to 20 with sequential animation
        heroes.forEach((hero, index) => {
          if (hero.maxHealth < 20) {
            const healthDiff = 20 - hero.maxHealth;

            // Show focus on affected heroes
            setTimeout(() => {
              setFocusedHeroIndex(index);

              // Update stats with animation
              hero.maxHealth = 20;
              hero.health = Math.min(20, hero.health + healthDiff);
              setUpdatedHeroes([...heroes]);

              setTimeout(() => {
                setFocusedHeroIndex(null);
              }, 600);
            }, index * 500);
          }
        });

        setMessage("All heroes' maximum health increased to 20!");
        setUpdatedHeroes(heroes);
        setShowHealEffect(true);
        setAccessibilityAnnounce(
          "All heroes' maximum health has been increased to 20, and they've been healed by the difference."
        );
        break;

      case "gold_blessing":
        // Roll for gold with enhanced animation
        setIsRolling(true);
        setMessage("The altar shimmers as fate determines your reward...");

        // Animate dice rolling with increasing pace
        let rollCounter = 0;
        let rollSpeed = 200;
        const rollInterval = setInterval(() => {
          const tempRoll = rollDice(20);
          setRollResult(tempRoll);
          rollCounter++;

          // Increase speed as we get closer to the final roll
          if (rollCounter > 5) {
            rollSpeed = 100;
          }
          if (rollCounter > 8) {
            rollSpeed = 50;
          }

          if (rollCounter >= 12) {
            clearInterval(rollInterval);

            // Final roll with dramatic pause
            setTimeout(() => {
              const finalRoll = rollDice(20);
              setRollResult(finalRoll);

              // Calculate gold with bonus for high rolls
              let goldGain = Math.max(100, finalRoll * 10);

              // Bonus for natural 20
              if (finalRoll === 20) {
                goldGain = 250; // Special bonus for perfect roll
                setMessage(
                  `Perfect roll! Extraordinary fortune grants you ${goldGain} gold!`
                );
              } else if (finalRoll >= 15) {
                goldGain += 20; // Small bonus for high rolls
                setMessage(`Excellent roll! You gained ${goldGain} gold!`);
              } else {
                setMessage(`Rolled ${finalRoll}! Gained ${goldGain} gold!`);
              }

              goldAdjustment = goldGain;
              setUpdatedGold(gameData.gold + goldGain);
              setIsRolling(false);
              setShowGoldEffect(true);

              setAccessibilityAnnounce(
                `Dice roll result: ${finalRoll}. You've gained ${goldGain} gold pieces.`
              );
            }, 500);
          }
        }, rollSpeed);
        break;

      case "roll_buff":
        // Apply permanent roll buff with cosmic animation
        rollBuffApplied = true;
        setMessage("All future die rolls will get +1!");
        setAccessibilityAnnounce(
          "Cosmic attunement successful. All future dice rolls will receive a +1 bonus."
        );

        // Show effect on all heroes sequentially
        heroes.forEach((hero, index) => {
          setTimeout(() => {
            setFocusedHeroIndex(index);
            setTimeout(() => {
              setFocusedHeroIndex(null);
            }, 400);
          }, index * 500);
        });
        break;

      case "emergency_heal":
        // Apply emergency healing with dramatic effect
        heroes.forEach((hero, index) => {
          if (hero.health > 0) {
            const missingHealth = hero.maxHealth - hero.health;
            const healAmount = Math.floor(missingHealth * 0.75);

            // Focus effect
            setTimeout(() => {
              setFocusedHeroIndex(index);
              hero.health = Math.min(hero.maxHealth, hero.health + healAmount);
              setUpdatedHeroes([...heroes]);

              setTimeout(() => {
                setFocusedHeroIndex(null);
              }, 500);
            }, index * 400);
          }
        });

        setMessage("Emergency rejuvenation has healed your party's wounds!");
        setShowHealEffect(true);
        setAccessibilityAnnounce(
          "Emergency healing applied. Each hero recovered 75% of their missing health."
        );
        break;

      default:
        setMessage("Blessing applied.");
        break;
    }

    // Mark effect as complete after animations with appropriate delay
    const completionDelay =
      benefit.id === "gold_blessing"
        ? 3500
        : benefit.id === "revive_two"
        ? 3000
        : 2500;

    setTimeout(() => {
      setEffectComplete(true);
      setAccessibilityAnnounce(
        "Effect complete. Preparing to continue your journey."
      );
    }, completionDelay);

    // Prepare data for completion callback
    const updates = {
      heroes: heroes,
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
    }, completionDelay + 1500);
  };

  // Focus handler for accessibility
  const handleOptionKeyPress = (e, benefit) => {
    if (e.key === "Enter" || e.key === " ") {
      selectBenefit(benefit);
    }
  };

  return (
    <div
      className="heart-room"
      style={{ backgroundImage: `url(${heartRoomBgImg})` }}
      role="region"
      aria-label="Heart Room"
    >
      <AnimatePresence mode="wait">
        {/* Scenario introduction */}
        {showScenario && (
          <motion.div
            className="room-scenario"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="scenario-content">
              <h2>Heart Room</h2>
              <p>{scenarioText}</p>
              <motion.div
                className="continue-prompt"
                animate={{
                  opacity: [0.5, 1, 0.5],
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop",
                }}
              >
                The altar awaits your decision...
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Entry animation */}
        {animationState === "enter" && !showScenario && (
          <motion.div
            className="room-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Heart Room
            </motion.h2>
            <motion.div
              className="intro-text"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <p>
                The heart-shaped altar pulses with healing light. Choose a
                blessing to aid your party's ascent...
              </p>
            </motion.div>
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
            <motion.h2
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              Heart Room Blessing
            </motion.h2>

            <div className="altar-container">
              <img
                src={heartAltarImg}
                alt="Heart Altar"
                className="altar-image"
              />
              <motion.div
                className="altar-glow"
                animate={{
                  scale: ambientPulse ? [1, 1.1, 1] : 1,
                  opacity: ambientPulse ? [0.7, 1, 0.7] : 0.7,
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "loop",
                }}
              >
                <img
                  src={heartGlowImg}
                  alt=""
                  aria-hidden="true"
                  className="glow-image"
                />
              </motion.div>
            </div>

            <div className="blessing-message">
              {message}
              {rollResult && (
                <div className="roll-result">Dice Roll: {rollResult}</div>
              )}
            </div>

            <div
              className="benefits-grid"
              ref={optionsContainerRef}
              role="listbox"
              aria-label="Available blessings"
            >
              {benefitOptions.map((benefit, index) => (
                <motion.div
                  key={benefit.id}
                  className={`benefit-option ${
                    benefit.disabled ? "disabled" : ""
                  } ${selectedBenefit === benefit ? "selected" : ""}`}
                  onClick={() => selectBenefit(benefit)}
                  onKeyPress={(e) => handleOptionKeyPress(e, benefit)}
                  whileHover={!benefit.disabled ? { scale: 1.05, y: -5 } : {}}
                  whileTap={!benefit.disabled ? { scale: 0.95 } : {}}
                  animate={
                    pulsateEffect && !benefit.disabled
                      ? {
                          scale: [1, 1.03, 1],
                          boxShadow: [
                            "0 0 0px rgba(255,255,255,0.3)",
                            "0 0 20px rgba(255,255,255,0.7)",
                            "0 0 0px rgba(255,255,255,0.3)",
                          ],
                        }
                      : {}
                  }
                  transition={{
                    duration: 1.5,
                    delay: index * 0.15,
                    ease: "easeInOut",
                  }}
                  data-tooltip-id="benefit-tooltip"
                  data-tooltip-content={getEffectDescription(benefit)}
                  tabIndex={!benefit.disabled ? 0 : -1}
                  role="option"
                  aria-selected={selectedBenefit === benefit}
                  aria-disabled={benefit.disabled}
                >
                  <div className="benefit-light"></div>
                  <div className="benefit-icon">{benefit.icon}</div>
                  <h3 className="benefit-title">{benefit.title}</h3>
                  <p className="benefit-description">{benefit.description}</p>
                  {benefit.disabled && (
                    <div className="disabled-overlay" aria-hidden="true">
                      <span className="disabled-text">Not Available</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div
              className="heart-room-heroes"
              aria-label="Heroes' current status"
            >
              <h3>Heroes Status</h3>
              <div className="heroes-list">
                {gameData.heroes.map((hero, index) => (
                  <motion.div
                    key={index}
                    className={`hero-status ${
                      hero.health <= 0
                        ? "fallen"
                        : hero.health < hero.maxHealth / 2
                        ? "critical"
                        : hero.health < hero.maxHealth
                        ? "wounded"
                        : "healthy"
                    } ${focusedHeroIndex === index ? "focused" : ""}`}
                    animate={
                      focusedHeroIndex === index
                        ? {
                            scale: [1, 1.1, 1],
                            boxShadow: [
                              "0 0 0px rgba(255,255,255,0.3)",
                              "0 0 30px rgba(255,255,255,0.8)",
                              "0 0 0px rgba(255,255,255,0.3)",
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 0.8 }}
                  >
                    <div className="hero-name">{hero.class}</div>
                    <div className="hero-health-bar">
                      <motion.div
                        className="health-fill"
                        initial={{
                          width: `${(hero.health / hero.maxHealth) * 100}%`,
                        }}
                        animate={{
                          width: `${(hero.health / hero.maxHealth) * 100}%`,
                        }}
                        transition={{ duration: 0.8 }}
                      ></motion.div>
                      <div className="health-text">
                        {hero.health} / {hero.maxHealth}
                      </div>
                    </div>
                    {hero.health <= 0 && <div className="fallen-icon">✝️</div>}
                  </motion.div>
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
            <motion.div
              className="confirmation-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <h2>Confirm Blessing</h2>

              <motion.div
                className="selected-blessing"
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  className="blessing-icon"
                  animate={{
                    rotate: [0, 5, 0, -5, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop",
                  }}
                >
                  {selectedBenefit.icon}
                </motion.div>
                <div className="blessing-details">
                  <h3>{selectedBenefit.title}</h3>
                  <p>{selectedBenefit.description}</p>
                </div>
              </motion.div>

              <div className="effect-description">
                <p>{effectDescription}</p>
              </div>

              <div className="confirmation-buttons">
                <motion.button
                  className="cancel-button"
                  onClick={cancelSelection}
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: "rgba(255, 100, 100, 0.3)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="confirm-button"
                  onClick={confirmBenefit}
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: "rgba(100, 255, 150, 0.3)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  Confirm
                </motion.button>
              </div>
            </motion.div>
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
            <motion.h2
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              Blessing Applied
            </motion.h2>

            <motion.div
              className="effect-animation"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                rotate: isRolling ? [0, 10, -10, 5, -5, 0] : 0,
              }}
              transition={{
                duration: isRolling ? 0.3 : 0.5,
                repeat: isRolling ? Infinity : 0,
              }}
            >
              {isRolling ? (
                <div className="dice-rolling">
                  <motion.div
                    className="dice"
                    animate={{
                      rotate: [0, 90, 180, 270, 360],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      repeatType: "loop",
                    }}
                  >
                    {rollResult || "?"}
                  </motion.div>
                </div>
              ) : (
                <div className="effect-icon">
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      rotate: [0, 5, 0, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "loop",
                    }}
                  >
                    {selectedBenefit?.icon}
                  </motion.div>
                  {showHealEffect && (
                    <motion.div
                      className="heal-effect"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [0, 1.5, 2],
                        opacity: [0, 0.8, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: 2,
                        repeatType: "loop",
                      }}
                    ></motion.div>
                  )}
                  {showGoldEffect && (
                    <motion.div
                      className="gold-effect"
                      initial={{ y: 0, opacity: 0 }}
                      animate={{
                        y: [-30, -60],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 1.8,
                        repeat: 3,
                        repeatType: "loop",
                        times: [0, 0.5, 1],
                      }}
                    >
                      <span className="gold-icon">💰</span>
                      <span className="gold-particles">
                        <span className="particle">✨</span>
                        <span className="particle">✨</span>
                        <span className="particle">✨</span>
                      </span>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>

            <motion.div
              className="effect-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {message}
            </motion.div>

            {/* Show updated heroes status */}
            {selectedBenefit?.id !== "gold_blessing" && (
              <motion.div
                className="updated-heroes"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <h3>Updated Hero Status</h3>
                <div className="heroes-list">
                  {updatedHeroes.map((hero, index) => {
                    const originalHero = gameData.heroes[index];
                    const hasChanged =
                      hero.health !== originalHero.health ||
                      hero.maxHealth !== originalHero.maxHealth;
                    const isResurrected =
                      originalHero.health <= 0 && hero.health > 0;

                    return (
                      <motion.div
                        key={index}
                        className={`hero-status ${
                          hero.health <= 0 ? "fallen" : "alive"
                        } ${hasChanged ? "changed" : ""} ${
                          isResurrected ? "resurrected" : ""
                        } ${focusedHeroIndex === index ? "focused" : ""}`}
                        animate={
                          focusedHeroIndex === index
                            ? {
                                scale: [1, 1.1, 1],
                                boxShadow: [
                                  "0 0 0px rgba(255,255,255,0.3)",
                                  "0 0 30px rgba(255,255,255,0.8)",
                                  "0 0 0px rgba(255,255,255,0.3)",
                                ],
                              }
                            : {}
                        }
                      >
                        <div className="hero-name">{hero.class}</div>
                        <div className="hero-health-bar">
                          <motion.div
                            className="health-fill"
                            initial={{
                              width: `${
                                (originalHero.health / originalHero.maxHealth) *
                                100
                              }%`,
                            }}
                            animate={{
                              width: `${(hero.health / hero.maxHealth) * 100}%`,
                            }}
                            transition={{ duration: 1 }}
                          ></motion.div>
                          <div className="health-text">
                            {hero.health} / {hero.maxHealth}
                            {hasChanged && (
                              <motion.span
                                className={`health-change ${
                                  hero.health > originalHero.health
                                    ? "positive"
                                    : "negative"
                                }`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8, duration: 0.4 }}
                              >
                                {hero.health > originalHero.health
                                  ? `+${hero.health - originalHero.health}`
                                  : hero.health < originalHero.health
                                  ? `-${originalHero.health - hero.health}`
                                  : ""}
                              </motion.span>
                            )}
                          </div>
                        </div>
                        {isResurrected && (
                          <motion.div
                            className="resurrection-effect"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                              scale: [0, 1.2, 1],
                              opacity: [0, 0.8, 1],
                            }}
                            transition={{ duration: 1.2 }}
                          >
                            <span className="resurrection-icon">✨</span>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Show updated gold if applicable */}
            {selectedBenefit?.id === "gold_blessing" && (
              <motion.div
                className="updated-gold"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <h3>Gold Received</h3>
                <motion.div
                  className="gold-change"
                  animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 0 0px rgba(255, 215, 0, 0.3)",
                      "0 0 20px rgba(255, 215, 0, 0.7)",
                      "0 0 0px rgba(255, 215, 0, 0.3)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop",
                  }}
                >
                  <span className="gold-icon">💰</span>
                  <span className="gold-amount">{updatedGold}</span>
                  <motion.span
                    className="gold-difference"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.4 }}
                  >
                    (+{updatedGold - gameData.gold})
                  </motion.span>
                </motion.div>
              </motion.div>
            )}

            {effectComplete && (
              <motion.div
                className="continue-message"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  y: [0, -5, 0],
                }}
                transition={{
                  opacity: { delay: 1, duration: 0.5 },
                  y: {
                    delay: 1.5,
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "loop",
                  },
                }}
              >
                Continuing to next room...
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Loading overlay */}
        {loadingEffect && (
          <motion.div
            className="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="loading-spinner">
              <motion.div
                className="spinner-heart"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  scale: { duration: 0.8, repeat: Infinity },
                  rotate: { duration: 2, repeat: Infinity },
                }}
              >
                ❤️
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accessibility region for announcements */}
      <div className="sr-only" aria-live="polite" ref={announcementRef}>
        {accessibilityAnnounce}
      </div>

      <Tooltip id="benefit-tooltip" />
    </div>
  );
};

export default HeartRoom;
