import React, { useState, useEffect, useRef } from "react";
import {
  rollDice,
  shuffleArray,
  MONSTERS,
  RANKS,
  SUITS,
  ENCHANTMENTS,
  getSuitColorClass,
} from "./contexts/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip";
import "./styles/Combat.css";

// Import placeholder utilities for images
import PlaceholderUtils from "./PlaceholderUtils";

// Create placeholder images since we don't have direct access to assets
const createPlaceholder = (text, width = 200, height = 200) => {
  return PlaceholderUtils.createPlaceholder(text, width, height);
};

const diceImg = createPlaceholder("Dice", 64, 64);
const cardBackImg = createPlaceholder("Card Back", 120, 170);
const healthPotionImg = createPlaceholder("Health Potion", 32, 32);
const shieldImg = createPlaceholder("Shield", 32, 32);

const Combat = ({ gameData, onComplete, onDefeat, updateStats, playSound }) => {
  // Game state variables
  const [currentMonster, setCurrentMonster] = useState(null);
  const [monsterImage, setMonsterImage] = useState(null);
  const [monsterHealth, setMonsterHealth] = useState(0);
  const [monsterMaxHealth, setMonsterMaxHealth] = useState(0);
  const [heroes, setHeroes] = useState(gameData.heroes);
  const [environment, setEnvironment] = useState(null);
  const [environmentEffects, setEnvironmentEffects] = useState([]);
  const [turnOrder, setTurnOrder] = useState("right"); // or 'left'
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [monsterAttachedCards, setMonsterAttachedCards] = useState([]);
  const [monsterFlipCards, setMonsterFlipCards] = useState([]);
  const [heroFlipCards, setHeroFlipCards] = useState([]);
  const [combatLog, setCombatLog] = useState([]);
  const [peonPile, setPeonPile] = useState([...gameData.deck.peonPile]);
  const [discardPile, setDiscardPile] = useState([]);
  const [combatPhase, setCombatPhase] = useState("setup"); // setup, monster_flip, monster_roll, hero_flip, hero_roll, end
  const [monsterRoll, setMonsterRoll] = useState(null);
  const [heroRoll, setHeroRoll] = useState(null);
  const [combatEnded, setCombatEnded] = useState(false);
  const [rewards, setRewards] = useState({
    gold: 0,
    items: [],
  });
  const [message, setMessage] = useState("Preparing for battle...");
  const [showDice, setShowDice] = useState(false);
  const [diceAnimation, setDiceAnimation] = useState(false);
  const [diceResult, setDiceResult] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [cardRotation, setCardRotation] = useState(0);
  const [effectAnimation, setEffectAnimation] = useState(null);
  const [showMonsterEffect, setShowMonsterEffect] = useState(false);
  const [monsterEffectText, setMonsterEffectText] = useState("");
  const [roundCount, setRoundCount] = useState(0);
  const [showInventory, setShowInventory] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [targetHero, setTargetHero] = useState(null);
  const [shakeMonster, setShakeMonster] = useState(false);
  const [healAnimation, setHealAnimation] = useState(null);
  const [damageNumbers, setDamageNumbers] = useState([]);
  const [showRollTable, setShowRollTable] = useState(false);
  const [currentRollEffect, setCurrentRollEffect] = useState(null);
  const [combatDifficulty, setCombatDifficulty] = useState("normal"); // new state for difficulty
  const [showStrategy, setShowStrategy] = useState(false); // new state for strategy tips
  const [statusEffects, setStatusEffects] = useState([]); // track battlefield effects
  const [showAbilityPrompt, setShowAbilityPrompt] = useState(false); // prompt for abilities

  // Refs
  const logContainerRef = useRef(null);
  const monsterRef = useRef(null);
  const combatContainerRef = useRef(null);

  // Load monster image
  useEffect(() => {
    if (currentMonster) {
      try {
        // Create a placeholder for the monster image
        const placeholderImg = createPlaceholder(
          currentMonster.name,
          320,
          320,
          "#3a3a5a"
        );
        setMonsterImage(placeholderImg);
      } catch (error) {
        console.error("Failed to load monster image:", error);
        setMonsterImage(null);
      }
    }
  }, [currentMonster]);

  // Auto-scroll combat log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [combatLog]);

  // Initialize combat when component mounts
  useEffect(() => {
    if (
      gameData.currentRoom === "club" ||
      gameData.currentRoom === "spade" ||
      gameData.currentRoom === "spade+"
    ) {
      initializeCombat();
    }
  }, [gameData.currentRoom]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "f" && combatPhase === "hero_flip") {
        handleHeroFlip();
      } else if (e.key === "r" && combatPhase === "hero_roll") {
        rollForHero();
      } else if (e.key === "i") {
        setShowInventory((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [combatPhase]);

  // Initialize the combat encounter
  const initializeCombat = () => {
    // Play combat start sound
    if (playSound) playSound();

    // Determine combat difficulty
    const difficulty =
      gameData.currentRoom === "club"
        ? "normal"
        : gameData.currentRoom === "spade"
        ? "hard"
        : "boss";

    setCombatDifficulty(difficulty);

    // Select a monster based on the room type and difficulty
    let monster;
    if (difficulty === "normal") {
      // Regular monster - random selection
      const monsterCategory = getRandomMonsterCategory();
      const monsterList = MONSTERS[monsterCategory];
      monster = monsterList[Math.floor(Math.random() * monsterList.length)];
    } else if (difficulty === "hard") {
      // Elite monster - harder selection
      const monsterCategory = getRandomMonsterCategory(true); // true for harder
      const monsterList = MONSTERS[monsterCategory];
      monster = monsterList[Math.floor(Math.random() * monsterList.length)];
      // Elite monsters have +25% health
      const baseHealth = monster.health;
      monster.health = Math.floor(baseHealth * 1.25);
    } else if (difficulty === "boss") {
      // Mini-boss monster
      const bossList = MONSTERS.boss;
      monster = bossList[Math.floor(Math.random() * bossList.length)];
    }

    setCurrentMonster(monster);

    // Set monster health
    const health = monster.health;
    setMonsterHealth(health);
    setMonsterMaxHealth(health);

    // Add log entry
    addToCombatLog(`A ${monster.name} appears! Health: ${health}`, "encounter");

    // Add flavor text based on monster type
    addFlavorText(monster);

    // Prepare environment pile
    setupEnvironmentPile();

    setCombatPhase("choose_turn_order");
    setMessage(
      "Choose which direction the heroes will take turns (left or right)"
    );
  };

  // Add flavor text for monster encounters
  const addFlavorText = (monster) => {
    let flavorText = "";

    // Different text based on monster rank
    if (monster.rank === RANKS.JACK) {
      flavorText = `The ${monster.name} emerges from the shadows, its eyes fixed on your party.`;
    } else if (monster.rank === RANKS.QUEEN) {
      flavorText = `A formidable ${monster.name} stands before you, radiating dangerous power.`;
    } else if (monster.rank === RANKS.KING) {
      flavorText = `The mighty ${monster.name} roars a challenge, eager for battle!`;
    } else if (monster.rank === RANKS.ACE) {
      flavorText = `An overwhelming presence fills the room as the ${monster.name} appears.`;
    } else if (monster.rank === "Boss") {
      flavorText = `The ground trembles as the ${monster.name} approaches. This will be a legendary battle!`;
    }

    addToCombatLog(flavorText, "flavor");
  };

  // Get a random monster category
  const getRandomMonsterCategory = (harder = false) => {
    const categories = ["jack", "queen", "king", "ace"];

    // Adjust difficulty based on current tier
    const tierBias = gameData.currentTier - 1;

    if (harder) {
      // For elite monsters, bias toward harder categories
      const index = Math.min(
        Math.floor(Math.random() * 3) + 1 + tierBias,
        categories.length - 1
      ); // 1, 2, or 3 (queen, king, ace) with tier bias
      return categories[index];
    }

    // Regular distribution with slight tier bias
    const baseIndex = Math.floor(Math.random() * categories.length);
    const adjustedIndex = Math.min(
      baseIndex + Math.floor(tierBias / 2),
      categories.length - 1
    );
    return categories[adjustedIndex];
  };

  // Setup the environment pile
  const setupEnvironmentPile = () => {
    // Use the unused Royalty cards from the fourth hero
    const fourthClassRank = [3, 5, 7, 9].find(
      (rank) => !heroes.some((hero) => hero.rank === rank)
    );

    // Get the corresponding royalty cards
    let environmentPile = gameData.deck.royaltyPile.filter((card) => {
      if (fourthClassRank === 3) return card.rank === RANKS.JACK;
      if (fourthClassRank === 5) return card.rank === RANKS.QUEEN;
      if (fourthClassRank === 7) return card.rank === RANKS.KING;
      if (fourthClassRank === 9) return card.rank === RANKS.ACE;
      return false;
    });

    // Ensure a Club card is on top for first combat
    if (!gameData.gameStats.combatRounds) {
      const clubCard = environmentPile.find((card) => card.suit === SUITS.CLUB);
      if (clubCard) {
        // Remove from pile
        environmentPile = environmentPile.filter((card) => card !== clubCard);
        // Add to front
        environmentPile.unshift(clubCard);
      }
    } else {
      // Shuffle for subsequent combats
      environmentPile = shuffleArray(environmentPile);
    }

    // Set the environment pile in the game context
    gameData.deck.environmentPile = environmentPile;

    // The current environment is the top card
    setEnvironment(environmentPile[0]);

    // Get environment name based on suit
    const environmentName = getEnvironmentName(environmentPile[0].suit);

    // Add log entry
    addToCombatLog(
      `Environment: ${environmentName} (${environmentPile[0].suit})`,
      "environment"
    );
  };

  // Get environment name based on suit
  const getEnvironmentName = (suit) => {
    switch (suit) {
      case SUITS.CLUB:
        return "Training Grounds";
      case SUITS.DIAMOND:
        return "Ancient Library";
      case SUITS.HEART:
        return "Mystical Armory";
      case SUITS.SPADE:
        return "Elemental Chamber";
      default:
        return "Unknown Environment";
    }
  };

  // Choose turn order
  const setTurnOrderDirection = (direction) => {
    // Play sound
    if (playSound) playSound();

    setTurnOrder(direction);
    addToCombatLog(
      `Turn order set to ${
        direction === "right" ? "clockwise" : "counter-clockwise"
      }`,
      "system"
    );
    assignAttachedCards();
  };

  // Assign attached cards to heroes and monster
  const assignAttachedCards = () => {
    const updatedHeroes = [...heroes];
    const monsterCards = [];

    // Draw cards for each hero
    updatedHeroes.forEach((hero) => {
      const card = drawCardFromPeon();
      hero.attachedCards = [card];
    });

    // Draw two cards for the monster
    monsterCards.push(drawCardFromPeon());
    monsterCards.push(drawCardFromPeon());
    setMonsterAttachedCards(monsterCards);

    setHeroes(updatedHeroes);

    // Check if we need to redeal (4 cards of the same rank)
    const allRanks = [
      ...updatedHeroes.flatMap((hero) => [
        hero.card.rank,
        ...hero.attachedCards.map((c) => c.rank),
      ]),
      ...monsterCards.map((c) => c.rank),
    ];

    // Count occurrences of each rank
    const rankCounts = {};
    allRanks.forEach((rank) => {
      rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });

    // If any rank appears 4 times, redeal
    if (Object.values(rankCounts).some((count) => count >= 4)) {
      addToCombatLog(
        "4 cards of the same rank detected. Redealing attached cards...",
        "system"
      );
      // Return cards to the pile
      updatedHeroes.forEach((hero) => {
        returnCardToPeon(hero.attachedCards[0]);
        hero.attachedCards = [];
      });
      monsterCards.forEach((card) => returnCardToPeon(card));
      setMonsterAttachedCards([]);

      // Shuffle and redeal
      setPeonPile(shuffleArray([...peonPile]));
      assignAttachedCards(); // Recursive call
      return;
    }

    // Log attached cards
    addToCombatLog("Attached cards assigned:", "system");
    updatedHeroes.forEach((hero) => {
      addToCombatLog(
        `${hero.class}: ${hero.attachedCards[0].rank}${hero.attachedCards[0].suit}`,
        "cards"
      );
    });
    addToCombatLog(
      `Monster: ${monsterCards[0].rank}${monsterCards[0].suit}, ${monsterCards[1].rank}${monsterCards[1].suit}`,
      "cards"
    );

    // Flip the environment card to apply any effects
    flipEnvironmentCard();
  };

  // Flip the environment card and apply effects
  const flipEnvironmentCard = () => {
    const environment = gameData.deck.environmentPile[0];
    setEnvironment(environment);

    // Apply environment effects
    const effects = [];

    switch (environment.suit) {
      case SUITS.CLUB: // Training Grounds
        addToCombatLog(
          "Training Grounds: A neutral environment with no special effects.",
          "environment"
        );
        effects.push({
          name: "Training Grounds",
          description: "A neutral environment with no special effects.",
          icon: "🏟️",
        });
        break;
      case SUITS.DIAMOND: // Library
        addToCombatLog(
          "Ancient Library: Everyone gets an extra attached card.",
          "environment"
        );
        effects.push({
          name: "Ancient Library",
          description:
            "The ancient knowledge provides additional strategic options. Everyone gets an extra attached card.",
          icon: "📚",
        });

        // Give heroes extra cards
        const libraryHeroes = [...heroes];
        libraryHeroes.forEach((hero) => {
          const extraCard = drawCardFromPeon();
          hero.attachedCards.push(extraCard);
          addToCombatLog(
            `${hero.class} gets ${extraCard.rank}${extraCard.suit}`,
            "cards"
          );
        });
        setHeroes(libraryHeroes);

        // Give monster an extra card
        const extraMonsterCard = drawCardFromPeon();
        setMonsterAttachedCards([...monsterAttachedCards, extraMonsterCard]);
        addToCombatLog(
          `Monster gets ${extraMonsterCard.rank}${extraMonsterCard.suit}`,
          "cards"
        );
        break;
      case SUITS.HEART: // Armory
        addToCombatLog(
          "Mystical Armory: Heroes get +2 on first roll; monster gets +1 on first three rolls.",
          "environment"
        );
        effects.push({
          name: "Mystical Armory",
          description:
            "Weapons and shields line the walls. Heroes get +2 on their first roll; monster gets +1 on first three rolls.",
          icon: "⚔️",
        });

        // Add status effect for tracking
        setStatusEffects([
          ...statusEffects,
          {
            type: "armory_bonus",
            duration: 3, // applies to first 3 rounds
            details: "Armory effect: Combat bonuses active",
          },
        ]);
        break;
      case SUITS.SPADE: // Elemental Chamber
        addToCombatLog(
          "Elemental Chamber: Black heroes get +1 on rolls; Red heroes get extra attached card; monster gets +3 health.",
          "environment"
        );
        effects.push({
          name: "Elemental Chamber",
          description:
            "Powerful elemental energies flow through this room. Black heroes get +1 on all rolls; Red heroes get an extra attached card; monster gains 3 health (max 20).",
          icon: "🌀",
        });

        // Apply health bonus to monster
        setMonsterHealth(Math.min(monsterHealth + 3, 20));
        setMonsterMaxHealth(Math.min(monsterMaxHealth + 3, 20));

        // Apply attached card bonus to red heroes
        const spadeHeroes = [...heroes];
        spadeHeroes.forEach((hero) => {
          if (hero.card.color === "red") {
            const extraCard = drawCardFromPeon();
            hero.attachedCards.push(extraCard);
            addToCombatLog(
              `${hero.class} (red) gets ${extraCard.rank}${extraCard.suit}`,
              "cards"
            );
          }
        });
        setHeroes(spadeHeroes);

        // Add status effect for tracking
        setStatusEffects([
          ...statusEffects,
          {
            type: "elemental_bonus",
            duration: -1, // permanent for this combat
            details: "Elemental effect: Combat bonuses active",
          },
        ]);
        break;
      default:
        addToCombatLog("No environment effect applied.", "environment");
        effects.push({
          name: "Neutral Ground",
          description: "A standard battlefield with no special effects.",
          icon: "⚖️",
        });
    }

    setEnvironmentEffects(effects);

    // Rotate the environment pile
    gameData.deck.environmentPile.push(gameData.deck.environmentPile.shift());

    // Start combat
    setCombatPhase("monster_flip");
    setMessage("Monster's turn to flip cards");

    // Show strategy tips for the first combat
    if (!gameData.gameStats.combatRounds) {
      setTimeout(() => {
        setShowStrategy(true);
        setTimeout(() => {
          setShowStrategy(false);
        }, 6000);
      }, 2000);
    }
  };

  // Draw a card from the Peon pile
  const drawCardFromPeon = () => {
    if (peonPile.length === 0) {
      // If pile is empty, shuffle discard and use it
      setPeonPile(shuffleArray([...discardPile]));
      setDiscardPile([]);

      // Add log entry
      addToCombatLog(
        "Peon pile exhausted. Reshuffling discard pile.",
        "system"
      );
    }

    // Get the top card
    const card = peonPile[0];

    // Remove from pile
    setPeonPile(peonPile.slice(1));

    return card;
  };

  // Return a card to the Peon pile
  const returnCardToPeon = (card) => {
    setPeonPile([...peonPile, card]);
  };

  // Add a message to the combat log
  const addToCombatLog = (message, type = "info") => {
    setCombatLog((prevLog) => [
      ...prevLog,
      {
        text: message,
        timestamp: new Date().toLocaleTimeString(),
        type: type,
      },
    ]);
  };

  // Handle monster flip
  const handleMonsterFlip = () => {
    if (combatPhase !== "monster_flip" || isFlipping) return;

    // Play flip sound
    if (playSound) playSound();

    setIsFlipping(true);
    setCardRotation((prev) => prev + 360);

    // Flip two cards
    const card1 = drawCardFromPeon();
    const card2 = drawCardFromPeon();

    setTimeout(() => {
      setMonsterFlipCards([card1, card2]);

      addToCombatLog(
        `Monster flips: ${card1.rank}${card1.suit}, ${card2.rank}${card2.suit}`,
        "cards"
      );

      // Check for matches with monster's attached cards
      const matches = [card1, card2].filter((card) =>
        monsterAttachedCards.some((attached) => attached.rank === card.rank)
      );

      if (matches.length > 0) {
        // Monster's special ability triggers
        addToCombatLog(
          `Monster's special ability triggered: ${currentMonster.special}`,
          "monster_ability"
        );
        // Apply monster special based on the monster type
        applyMonsterSpecial();

        // Show monster special effect
        setMonsterEffectText(currentMonster.special);
        setShowMonsterEffect(true);
        setTimeout(() => {
          setShowMonsterEffect(false);
        }, 2000);
      } else {
        // Check for damage from match rules
        const matchDamage = calculateMatchDamage("monster", [card1, card2]);
        if (matchDamage > 0) {
          // Apply damage to current hero
          applyDamageToHero(heroes[currentHeroIndex], matchDamage);
          addToCombatLog(
            `Match damage: ${matchDamage} to ${heroes[currentHeroIndex].class}`,
            "damage"
          );

          // Show damage number
          addDamageNumber(heroes[currentHeroIndex], matchDamage);
        }
      }

      // Move to monster roll phase
      setTimeout(() => {
        setCombatPhase("monster_roll");
        setMessage("Monster is rolling the dice");

        // Add flipped cards to discard
        setDiscardPile([...discardPile, card1, card2]);

        // Automatically roll for monster after a brief delay
        setTimeout(() => {
          rollForMonster();
        }, 1000);

        setIsFlipping(false);
      }, 1000);
    }, 150);
  };

  // Apply the monster's special ability
  const applyMonsterSpecial = () => {
    // This would be implemented based on the specific monster
    // Each monster has a unique special ability

    addToCombatLog(
      `${currentMonster.name}'s special ability activated!`,
      "monster_ability"
    );

    // Check for ability blocker item
    const hasAbilityBlocker = statusEffects.some(
      (effect) => effect.type === "ability_blocked"
    );

    if (hasAbilityBlocker) {
      addToCombatLog(
        "Ability Blocker negated the monster's special!",
        "system"
      );

      // Remove the ability blocker status
      setStatusEffects(
        statusEffects.filter((effect) => effect.type !== "ability_blocked")
      );

      return;
    }

    // Show visual effect
    setEffectAnimation("monster_special");
    setTimeout(() => {
      setEffectAnimation(null);
    }, 1000);

    // Apply specific effects based on monster type
    if (currentMonster.rank === RANKS.JACK) {
      // Jack monster specials often affect attached cards
      if (currentMonster.name === "Abyssal Ooze") {
        // Ooze trail reflects damage
        setStatusEffects([
          ...statusEffects,
          {
            type: "damage_reflection",
            duration: -1, // until combat end
            details: "Ooze Trail: Reflects damage on low rolls",
          },
        ]);

        // Apply minor damage to all heroes
        heroes.forEach((hero) => {
          if (hero.health > 0) {
            applyDamageToHero(hero, 1);
          }
        });

        addToCombatLog(
          "Ooze Trail activated: Heroes' low rolls will reflect 3 damage!",
          "monster_ability"
        );
      } else if (currentMonster.name === "Treant") {
        // Thorns reflect damage to attackers
        setStatusEffects([
          ...statusEffects,
          {
            type: "thorns",
            duration: -1, // until combat end
            details: "Thorns: Attackers may take 2 reflection damage",
          },
        ]);

        addToCombatLog(
          "Thorns activated: Heroes may take reflection damage on attacks!",
          "monster_ability"
        );
      }
      // Add more monster-specific logic here
    } else if (currentMonster.rank === RANKS.QUEEN) {
      // Queen monster specials often have control effects
      if (currentMonster.name === "Banshee") {
        // Psychic scream incapacitates heroes
        heroes.forEach((hero) => {
          if (hero.health > 0) {
            applyDamageToHero(hero, 2);
          }
        });

        addToCombatLog(
          "Psychic Scream dealt 2 damage to all heroes!",
          "monster_ability"
        );
      } else if (currentMonster.name === "Lunar Shade") {
        // Enraged increases damage
        setStatusEffects([
          ...statusEffects,
          {
            type: "lunar_enrage",
            duration: -1, // until combat end
            details: "Enraged: Monster deals 1.5x damage for low rolls",
          },
        ]);

        addToCombatLog(
          "Lunar Shade becomes enraged, increasing damage from low rolls!",
          "monster_ability"
        );
      }
      // Add more monster-specific logic here
    }
    // Add conditions for KING and ACE rank monsters
  };

  // Roll for the monster
  const rollForMonster = () => {
    // Play dice roll sound
    if (playSound) playSound();

    setShowDice(true);
    setDiceAnimation(true);
    setIsRolling(true);

    // Determine which die to use based on monster
    const dieType = 20; // Default to d20, could be d6 for some monsters

    // Simulate dice rolling animation
    const rollInterval = setInterval(() => {
      setDiceResult(Math.floor(Math.random() * dieType) + 1);
    }, 50);

    // Stop rolling after a short time
    setTimeout(() => {
      clearInterval(rollInterval);

      // Roll the die
      let roll = rollDice(dieType);

      // Apply Armory environment bonus if active (first 3 rounds)
      if (environment.suit === SUITS.HEART && roundCount < 3) {
        roll += 1;
        addToCombatLog(
          "Armory effect: Monster gets +1 to roll!",
          "environment"
        );
      }

      setDiceResult(roll);
      setMonsterRoll(roll);
      setIsRolling(false);

      addToCombatLog(`Monster rolls: ${roll}`, "roll");

      // Apply roll effect based on monster's roll table
      setTimeout(() => {
        applyMonsterRollEffect(roll);

        // Move to hero flip phase
        setTimeout(() => {
          setShowDice(false);
          setCombatPhase("hero_flip");
          setMessage(`${heroes[currentHeroIndex].class}'s turn to flip cards`);
        }, 1000);
      }, 500);
    }, 1000);
  };

  // Apply the monster's roll effect
  const applyMonsterRollEffect = (roll) => {
    // Get the effect from the monster's roll effects
    const effect =
      currentMonster.rollEffects[roll] ||
      currentMonster.rollEffects[Math.min(6, Math.max(1, roll))]; // Fallback to 1-6 range

    if (!effect || effect === "") {
      addToCombatLog("Monster does nothing this turn.", "monster_action");
      return;
    }

    addToCombatLog(`Monster effect: ${effect}`, "monster_action");

    // Display effect animation
    setEffectAnimation("monster_attack");

    // Apply effect logic based on the effect text
    // This would be a complex implementation in the full game
    // For now, we'll handle some common effects

    // Check for damage to current hero
    if (effect.includes("Deal") && effect.includes("Hero*")) {
      // Extract damage amount
      const damageMatch = effect.match(/Deal (\d+) damage/);
      if (damageMatch && damageMatch[1]) {
        const damage = parseInt(damageMatch[1]);

        // Apply enrage multiplier if active
        let finalDamage = damage;
        if (
          statusEffects.some(
            (effect) => effect.type === "lunar_enrage" && roll <= 3 // Only applies to low rolls
          )
        ) {
          finalDamage = Math.floor(damage * 1.5);
          addToCombatLog(
            `Enraged effect increases damage to ${finalDamage}!`,
            "monster_ability"
          );
        }

        applyDamageToHero(heroes[currentHeroIndex], finalDamage);
        addToCombatLog(
          `Monster deals ${finalDamage} damage to ${heroes[currentHeroIndex].class}`,
          "damage"
        );

        // Show damage number
        addDamageNumber(heroes[currentHeroIndex], finalDamage);

        // Shake hero effect
        shakeHero(currentHeroIndex);
      }
    }

    // Check for damage to party
    if (effect.includes("Deal") && effect.includes("party")) {
      // Extract damage amount
      const damageMatch = effect.match(/Deal (\d+) damage/);
      if (damageMatch && damageMatch[1]) {
        const damage = parseInt(damageMatch[1]);
        // Apply to all heroes
        heroes.forEach((hero, index) => {
          if (hero.health > 0) {
            applyDamageToHero(hero, damage);
            // Show damage number
            addDamageNumber(hero, damage);

            // Shake hero effect
            shakeHero(index);
          }
        });
        addToCombatLog(`Monster deals ${damage} damage to the party`, "damage");
      }
    }

    // Check for healing
    if (effect.includes("Regenerate") || effect.includes("heal")) {
      // Extract healing amount
      const healMatch = effect.match(/(Regenerate|heal).* (\d+)/i);
      if (healMatch && healMatch[2]) {
        const healing = parseInt(healMatch[2]);
        healMonster(healing);
        addToCombatLog(`Monster heals for ${healing}`, "heal");

        // Show heal animation
        setHealAnimation("monster");
        setTimeout(() => {
          setHealAnimation(null);
        }, 1000);
      }
    }

    // Reset effect animation
    setTimeout(() => {
      setEffectAnimation(null);
    }, 600);
  };

  // Handle hero flip
  const handleHeroFlip = () => {
    if (combatPhase !== "hero_flip" || isFlipping) return;

    // Play flip sound
    if (playSound) playSound();

    setIsFlipping(true);
    setCardRotation((prev) => prev + 360);

    // Flip two cards
    const card1 = drawCardFromPeon();
    const card2 = drawCardFromPeon();

    setTimeout(() => {
      setHeroFlipCards([card1, card2]);

      const currentHero = heroes[currentHeroIndex];

      addToCombatLog(
        `${currentHero.class} flips: ${card1.rank}${card1.suit}, ${card2.rank}${card2.suit}`,
        "cards"
      );

      // Check for matches with hero's class card
      const matches = [card1, card2].filter(
        (card) => currentHero.card.rank === card.rank
      );

      if (matches.length > 0 && !currentHero.isTapped) {
        // Hero's spec ability triggers
        addToCombatLog(
          `${currentHero.class}'s specialization ability triggered!`,
          "hero_ability"
        );
        // Apply hero special based on class
        applyHeroSpecial(currentHero);

        // Show effect animation
        setEffectAnimation("hero_special");

        // Tap the hero to mark ability used
        const updatedHeroes = [...heroes];
        updatedHeroes[currentHeroIndex].isTapped = true;
        setHeroes(updatedHeroes);

        // Show ability animation
        setShowAbilityPrompt(true);
        setTimeout(() => {
          setShowAbilityPrompt(false);
        }, 2000);
      } else {
        // Check for damage from match rules
        const matchDamage = calculateMatchDamage("hero", [card1, card2]);
        if (matchDamage > 0) {
          // Apply damage to monster
          applyDamageToMonster(matchDamage);
          addToCombatLog(`Match damage: ${matchDamage} to monster`, "damage");

          // Shake monster effect
          setShakeMonster(true);
          setTimeout(() => {
            setShakeMonster(false);
          }, 300);
        }
      }

      // Move to hero roll phase
      setTimeout(() => {
        setCombatPhase("hero_roll");
        setMessage(`${currentHero.class} is rolling the dice`);

        // Add flipped cards to discard
        setDiscardPile([...discardPile, card1, card2]);
        setIsFlipping(false);

        // Reset effect animation
        setEffectAnimation(null);
      }, 1000);
    }, 150);
  };

  // Apply the hero's special ability
  const applyHeroSpecial = (hero) => {
    switch (hero.class) {
      case "Bladedancer":
        // Steal an attached card from monster
        if (monsterAttachedCards.length > 0) {
          const card = monsterAttachedCards[0];
          setMonsterAttachedCards(monsterAttachedCards.slice(1));

          const heroesArray = [...heroes];
          const heroIndex = heroesArray.indexOf(hero);
          heroesArray[heroIndex].attachedCards.push(card);
          setHeroes(heroesArray);

          addToCombatLog(
            `${hero.class} steals ${card.rank}${card.suit} from monster`,
            "hero_ability"
          );
        }
        break;
      case "Manipulator":
        // Roll extra with +1
        addToCombatLog(`${hero.class} will roll again with +1`, "hero_ability");

        // Add status effect for the roll phase
        setStatusEffects([
          ...statusEffects,
          {
            type: "extra_roll",
            duration: 1, // just for this turn
            details: "Extra roll with +1 modifier",
            heroIndex: heroes.indexOf(hero),
          },
        ]);
        break;
      case "Tracker":
        // Add Hunter's Mark for +1 damage to matches
        addToCombatLog(
          `${hero.class} marks the target with Hunter's Mark (+1 damage to all matches)`,
          "hero_ability"
        );
        // Add a marker to track this
        const trackerHeroes = [...heroes];
        const trackerIndex = trackerHeroes.indexOf(hero);
        trackerHeroes[trackerIndex].markers.push("🔴");
        setHeroes(trackerHeroes);
        break;
      case "Guardian":
        // Increase health by 7 (up to 20)
        const guardianHeroes = [...heroes];
        const guardianIndex = guardianHeroes.indexOf(hero);
        const newHealth = Math.min(hero.health + 7, 20);
        guardianHeroes[guardianIndex].health = newHealth;
        setHeroes(guardianHeroes);

        // Show heal animation
        setHealAnimation(`hero_${guardianIndex}`);
        setTimeout(() => {
          setHealAnimation(null);
        }, 1000);

        addToCombatLog(
          `${hero.class} stands strong! Health increased to ${newHealth}`,
          "heal"
        );
        break;
    }
  };

  // Roll for the current hero
  const rollForHero = () => {
    if (combatPhase !== "hero_roll" || isRolling) return;

    // Play dice roll sound
    if (playSound) playSound();

    const currentHero = heroes[currentHeroIndex];

    setShowDice(true);
    setDiceAnimation(true);
    setIsRolling(true);

    // Simulate dice rolling animation
    const rollInterval = setInterval(() => {
      setDiceResult(Math.floor(Math.random() * 20) + 1);
    }, 50);

    // Stop rolling after a short time
    setTimeout(() => {
      clearInterval(rollInterval);

      // Roll d20
      let roll = rollDice(20);

      // Apply roll bonuses based on environment and status effects

      // Apply first-roll bonus from Armory (Heart environment)
      if (
        environment.suit === SUITS.HEART &&
        !heroes[currentHeroIndex].hasRolled
      ) {
        roll += 2;
        addToCombatLog(
          "Armory effect: +2 to hero's first roll!",
          "environment"
        );

        // Mark the hero as having rolled
        const rollMarkedHeroes = [...heroes];
        rollMarkedHeroes[currentHeroIndex].hasRolled = true;
        setHeroes(rollMarkedHeroes);
      }

      // Apply black hero bonus from Elemental Chamber (Spade environment)
      if (
        environment.suit === SUITS.SPADE &&
        currentHero.card.color === "black"
      ) {
        roll += 1;
        addToCombatLog(
          "Elemental Chamber effect: +1 to black hero's roll!",
          "environment"
        );
      }

      // Apply roll bonus marker if present
      if (currentHero.markers.includes("⚫")) {
        roll += 1;

        // Remove the marker
        const markerRemovedHeroes = [...heroes];
        const heroIdx = markerRemovedHeroes.indexOf(currentHero);
        markerRemovedHeroes[heroIdx].markers = markerRemovedHeroes[
          heroIdx
        ].markers.filter((m) => m !== "⚫");
        setHeroes(markerRemovedHeroes);

        addToCombatLog(`${currentHero.class} uses +1 roll bonus!`, "system");
      }

      setDiceResult(roll);
      setHeroRoll(roll);
      setIsRolling(false);

      addToCombatLog(`${currentHero.class} rolls: ${roll}`, "roll");

      // Get the roll effect for display
      const rollEffect =
        currentHero.rollEffects[Math.min(6, Math.max(1, roll))];
      if (rollEffect && rollEffect.name) {
        setCurrentRollEffect(rollEffect);
        setShowRollTable(true);
      }

      // Apply roll effect based on hero's class
      setTimeout(() => {
        applyHeroRollEffect(currentHero, roll);

        // Check for Manipulator extra roll effect
        const extraRoll = statusEffects.find(
          (effect) =>
            effect.type === "extra_roll" &&
            effect.heroIndex === currentHeroIndex
        );

        if (extraRoll) {
          // Remove this status effect
          setStatusEffects(
            statusEffects.filter(
              (effect) =>
                !(
                  effect.type === "extra_roll" &&
                  effect.heroIndex === currentHeroIndex
                )
            )
          );

          // Roll again with +1 bonus
          setTimeout(() => {
            const bonusRoll = rollDice(20) + 1;
            addToCombatLog(
              `${currentHero.class} uses extra roll with +1 bonus: ${bonusRoll}!`,
              "roll"
            );

            // Get the roll effect for the bonus roll
            const bonusRollEffect =
              currentHero.rollEffects[Math.min(6, Math.max(1, bonusRoll))];
            if (bonusRollEffect && bonusRollEffect.name) {
              setCurrentRollEffect(bonusRollEffect);
              setShowRollTable(true);
            }

            // Apply the bonus roll effect
            setTimeout(() => {
              applyHeroRollEffect(currentHero, bonusRoll);
              proceedAfterRoll();
            }, 1000);
          }, 1500);
        } else {
          proceedAfterRoll();
        }
      }, 1000);
    }, 1000);

    // Function to proceed after rolls are complete
    const proceedAfterRoll = () => {
      // Check if combat has ended
      if (monsterHealth <= 0) {
        endCombat(true);
        return;
      }

      // Check if all heroes are defeated
      if (heroes.every((hero) => hero.health <= 0)) {
        endCombat(false);
        return;
      }

      // Hide dice and roll table
      setTimeout(() => {
        setShowDice(false);
        setShowRollTable(false);

        // Advance to next hero or back to monster
        advanceTurn();
      }, 1500);
    };
  };

  // Apply the hero's roll effect
  const applyHeroRollEffect = (hero, roll) => {
    // Get effect from hero's roll effects table
    const rollEffect = hero.rollEffects[Math.min(6, Math.max(1, roll))];

    if (!rollEffect || !rollEffect.name) {
      addToCombatLog(`${hero.class} does nothing this turn.`, "hero_action");
      return;
    }

    addToCombatLog(
      `${hero.class} uses ${rollEffect.name}: ${rollEffect.effect}`,
      "hero_action"
    );

    // Show effect animation
    setEffectAnimation("hero_attack");

    // Apply effect based on the roll and hero class
    switch (hero.class) {
      case "Bladedancer":
        applyBladedancerEffect(hero, roll, rollEffect);
        break;
      case "Manipulator":
        applyManipulatorEffect(hero, roll, rollEffect);
        break;
      case "Tracker":
        applyTrackerEffect(hero, roll, rollEffect);
        break;
      case "Guardian":
        applyGuardianEffect(hero, roll, rollEffect);
        break;
    }

    // Reset effect animation
    setTimeout(() => {
      setEffectAnimation(null);
    }, 600);
  };

  // Apply Bladedancer roll effects
  const applyBladedancerEffect = (hero, roll, rollEffect) => {
    // Check if thorns effect will apply for damage reflection
    const thornEffect = statusEffects.find(
      (effect) => effect.type === "thorns"
    );

    switch (roll) {
      case 1: // Stab - 1 damage
        applyDamageToMonster(1);

        // Apply thorns damage reflection
        if (thornEffect) {
          applyDamageToHero(hero, 2);
          addToCombatLog(
            `${hero.class} takes 2 reflection damage from Thorns!`,
            "monster_ability"
          );
          addDamageNumber(hero, 2);
        }
        break;
      case 2: // Strike - 1 damage
        applyDamageToMonster(1);

        // Apply thorns damage reflection
        if (thornEffect) {
          applyDamageToHero(hero, 2);
          addToCombatLog(
            `${hero.class} takes 2 reflection damage from Thorns!`,
            "monster_ability"
          );
          addDamageNumber(hero, 2);
        }
        break;
      case 3: // Backstab - 2 damage (double if attached card matched)
        const damage = heroFlipCards.some((card) =>
          hero.attachedCards.some((attached) => attached.rank === card.rank)
        )
          ? 4
          : 2;
        applyDamageToMonster(damage);
        break;
      case 4: // Eviscerate - 3 damage, roll for crit
        const critRoll = rollDice(6);
        const critDamage = critRoll >= 5 ? 6 : 3;
        applyDamageToMonster(critDamage);
        if (critRoll >= 5) {
          addToCombatLog(
            `Critical hit! Double damage (${critDamage})`,
            "hero_action"
          );

          // Show critical hit effect
          setEffectAnimation("critical_hit");
          setTimeout(() => {
            setEffectAnimation(null);
          }, 600);
        }
        break;
      case 5: // Evasive Maneuver - dodge next attack, deal 5 damage
        applyDamageToMonster(5);
        // Mark hero with dodge
        const dodgeHeroes = [...heroes];
        const dodgeIndex = dodgeHeroes.indexOf(hero);
        dodgeHeroes[dodgeIndex].markers.push("🔵");
        setHeroes(dodgeHeroes);
        break;
      case 6: // Dismantle - 4 damage, tap monster attached card
        applyDamageToMonster(4);
        // Tap a monster card if available
        if (monsterAttachedCards.length > 0) {
          const updatedCards = [...monsterAttachedCards];
          updatedCards[0].isTapped = true;
          setMonsterAttachedCards(updatedCards);
          addToCombatLog(
            `${hero.class} taps one of the monster's attached cards`,
            "hero_action"
          );
        }
        break;
    }
  };

  // Apply Manipulator roll effects
  const applyManipulatorEffect = (hero, roll, rollEffect) => {
    switch (roll) {
      case 1: // Psychic Blast - 1 damage
        applyDamageToMonster(1);
        break;
      case 3: // Telekinesis - Roll for damage
        const tkRoll = rollDice(6);
        const tkDamage = tkRoll <= 3 ? 2 : 4;
        applyDamageToMonster(tkDamage);
        addToCombatLog(
          `Telekinesis roll: ${tkRoll}, deals ${tkDamage} damage`,
          "hero_action"
        );
        break;
      case 4: // Mind Flay - 3 damage, possible follow-up
        applyDamageToMonster(3);
        const followUpRoll = rollDice(6);
        if (followUpRoll >= 3 && followUpRoll <= 4) {
          applyDamageToMonster(2);
          addToCombatLog(
            `Follow-up Mind Flay for 2 additional damage`,
            "hero_action"
          );

          // Roll again
          const secondFollowRoll = rollDice(6);
          addToCombatLog(`Second follow-up roll: ${secondFollowRoll}`, "roll");
          // This could be expanded for continuous mind flay
        }
        break;
      case 5: // Mind Warp - Monster self-attacks
        const attachedCount = monsterAttachedCards.length;
        const selfDamage = Math.min(
          8,
          Math.max(3, Math.floor(attachedCount / 2))
        );
        applyDamageToMonster(selfDamage);
        addToCombatLog(
          `Monster attacks itself for ${selfDamage} damage`,
          "hero_action"
        );

        // Show effect animation
        setEffectAnimation("mind_warp");
        setTimeout(() => {
          setEffectAnimation("monster_self_attack");
          setTimeout(() => {
            setEffectAnimation(null);
          }, 600);
        }, 600);
        break;
      case 6: // Psychic Vortex - 5 damage, heal
        applyDamageToMonster(5);
        // Heal self for 2
        const vortexHeroes = [...heroes];
        const heroIndex = vortexHeroes.indexOf(hero);
        vortexHeroes[heroIndex].health = Math.min(
          vortexHeroes[heroIndex].maxHealth,
          vortexHeroes[heroIndex].health + 2
        );

        // Show heal animation for self
        setHealAnimation(`hero_${heroIndex}`);

        // Heal party for 1
        vortexHeroes.forEach((h, idx) => {
          if (idx !== heroIndex && h.health > 0) {
            h.health = Math.min(h.maxHealth, h.health + 1);
          }
        });

        setHeroes(vortexHeroes);

        // Reset heal animation
        setTimeout(() => {
          setHealAnimation(null);
        }, 1000);

        addToCombatLog(
          `${hero.class} heals self for 2 and party for 1`,
          "heal"
        );
        break;
    }
  };

  // Apply Tracker roll effects
  const applyTrackerEffect = (hero, roll, rollEffect) => {
    switch (roll) {
      case 1: // Snipe - 2 damage
        applyDamageToMonster(2);
        break;
      case 3: // Precision Shot - 3 damage
        applyDamageToMonster(3);
        break;
      case 4: // Animal Companion - pet flips card, deals 2 damage
        // Flip a card for the pet
        const petCard = drawCardFromPeon();
        addToCombatLog(
          `Animal Companion flips: ${petCard.rank}${petCard.suit}`,
          "cards"
        );

        // Show pet animation
        setEffectAnimation("animal_companion");

        // Attach it to the hero if not at max
        if (hero.attachedCards.length < 2) {
          const companionHeroes = [...heroes];
          const heroIndex = companionHeroes.indexOf(hero);
          companionHeroes[heroIndex].attachedCards.push(petCard);
          setHeroes(companionHeroes);
          addToCombatLog(
            `Pet attaches ${petCard.rank}${petCard.suit} to ${hero.class}`,
            "hero_action"
          );
        } else {
          addToCombatLog(
            `${hero.class} already has maximum attached cards`,
            "system"
          );
          setDiscardPile([...discardPile, petCard]);
        }

        // Deal 2 damage
        setTimeout(() => {
          applyDamageToMonster(2);
          setEffectAnimation(null);
        }, 600);
        break;
      case 5: // Supportive Fire - 3 damage, next hero gets +1
        applyDamageToMonster(3);

        // Mark next hero for +1 roll
        const nextHeroIndex = getNextHeroIndex();
        if (nextHeroIndex !== currentHeroIndex) {
          const supportHeroes = [...heroes];
          supportHeroes[nextHeroIndex].markers.push("⚫");
          setHeroes(supportHeroes);
          addToCombatLog(
            `${heroes[nextHeroIndex].class} gets +1 to next roll`,
            "hero_action"
          );
        }
        break;
      case 6: // Aimed Shot - 6 damage
        // Show charging animation
        setEffectAnimation("aimed_shot_charge");

        setTimeout(() => {
          // Show release animation
          setEffectAnimation("aimed_shot_release");
          applyDamageToMonster(6);

          setTimeout(() => {
            setEffectAnimation(null);
          }, 600);
        }, 600);
        break;
    }
  };

  // Apply Guardian roll effects
  const applyGuardianEffect = (hero, roll, rollEffect) => {
    switch (roll) {
      case 1: // Hack - 1 damage
        applyDamageToMonster(1);
        break;
      case 2: // Slash - 2 damage
        applyDamageToMonster(2);
        break;
      case 3: // Protective Strike - 2 damage, heal party
        applyDamageToMonster(2);

        // Heal party for 1
        const protectHeroes = [...heroes];
        protectHeroes.forEach((h) => {
          if (h !== hero && h.health > 0) {
            h.health = Math.min(h.maxHealth, h.health + 1);
          }
        });

        setHeroes(protectHeroes);

        // Show heal animation for party
        setHealAnimation("party");
        setTimeout(() => {
          setHealAnimation(null);
        }, 1000);

        addToCombatLog(`${hero.class} heals party for 1`, "heal");
        break;
      case 4: // Vital Rend - 3 damage, heal self
        applyDamageToMonster(3);

        // Heal self for 2
        const vitalHeroes = [...heroes];
        const heroIndex = vitalHeroes.indexOf(hero);
        vitalHeroes[heroIndex].health = Math.min(
          vitalHeroes[heroIndex].maxHealth,
          vitalHeroes[heroIndex].health + 2
        );

        setHeroes(vitalHeroes);

        // Show heal animation
        setHealAnimation(`hero_${heroIndex}`);
        setTimeout(() => {
          setHealAnimation(null);
        }, 1000);

        addToCombatLog(`${hero.class} heals self for 2`, "heal");
        break;
      case 5: // Sacrificial Strike - 6 damage, costs 2 health
        applyDamageToMonster(6);

        // Take 2 damage
        const sacrificeHeroes = [...heroes];
        const sacrificeIndex = sacrificeHeroes.indexOf(hero);
        sacrificeHeroes[sacrificeIndex].health -= 2;

        // Show self-damage animation
        addDamageNumber(hero, 2);

        // Check if hero died from this
        if (sacrificeHeroes[sacrificeIndex].health <= 0) {
          sacrificeHeroes[sacrificeIndex].health = 0;
          addToCombatLog(
            `${hero.class} falls from sacrificial damage!`,
            "hero_action"
          );
        } else {
          addToCombatLog(
            `${hero.class} takes 2 damage from sacrifice`,
            "damage"
          );
        }

        setHeroes(sacrificeHeroes);
        break;
      case 6: // Execute - 4 damage, kill if <= 4 health
        const damage = 4;

        // Show execute animation
        setEffectAnimation("execute_charge");

        setTimeout(() => {
          applyDamageToMonster(damage);

          // Show execute strike animation
          setEffectAnimation("execute_strike");

          // Check for execution
          if (monsterHealth - damage <= 4 && monsterHealth - damage > 0) {
            // Execute the monster
            setTimeout(() => {
              setMonsterHealth(0);
              addToCombatLog(
                `${hero.class} executes the ${currentMonster.name}!`,
                "hero_action"
              );

              // Show execution animation
              setEffectAnimation("execution");
              setTimeout(() => {
                setEffectAnimation(null);
                endCombat(true);
              }, 1000);
            }, 600);
          } else {
            setTimeout(() => {
              setEffectAnimation(null);
            }, 600);
          }
        }, 600);
        break;
    }
  };

  // Calculate damage from card matching
  const calculateMatchDamage = (source, cards) => {
    // This is a simplified version of the matching rules
    if (source === "monster") {
      // Monster match damage
      // If a match, deal 2 damage to current hero
      for (const card of cards) {
        if (
          monsterAttachedCards.some((attached) => attached.rank === card.rank)
        ) {
          return 2;
        }
      }
    } else if (source === "hero") {
      // Hero match damage
      const currentHero = heroes[currentHeroIndex];

      // Check for tapped cards
      if (currentHero.isTapped) {
        return 2; // Tapped class card match
      }

      // Check for roll total = 10
      if (
        cards.reduce((sum, card) => {
          const rankValue = isNaN(parseInt(card.rank))
            ? card.rank === "A"
              ? 1
              : 10
            : parseInt(card.rank);
          return sum + rankValue;
        }, 0) === 10
      ) {
        return 2; // Total 10 match
      }

      // Check for non-class rank match
      for (const card of cards) {
        if (
          currentHero.attachedCards.some(
            (attached) =>
              attached.rank === card.rank &&
              attached.rank !== currentHero.card.rank
          )
        ) {
          return 1; // Non-class rank match
        }
      }
    }

    return 0; // No match
  };

  // Apply damage to a hero
  const applyDamageToHero = (hero, damage) => {
    // Check for dodge (Evasive Maneuver)
    if (hero.markers.includes("🔵") && damage > 2) {
      addToCombatLog(`${hero.class} dodges the attack!`, "hero_action");

      // Remove the dodge marker
      const dodgeHeroes = [...heroes];
      const heroIndex = dodgeHeroes.indexOf(hero);
      dodgeHeroes[heroIndex].markers = dodgeHeroes[heroIndex].markers.filter(
        (m) => m !== "🔵"
      );
      setHeroes(dodgeHeroes);

      return;
    }

    // Apply damage
    const updatedHeroes = [...heroes];
    const heroIndex = updatedHeroes.indexOf(hero);
    updatedHeroes[heroIndex].health = Math.max(
      0,
      updatedHeroes[heroIndex].health - damage
    );

    // Check if hero died
    if (updatedHeroes[heroIndex].health === 0) {
      addToCombatLog(`${hero.class} has fallen!`, "damage");

      // Update game stats for hero deaths
      if (updateStats) {
        updateStats({ heroDeaths: 1 });
      }
    } else {
      addToCombatLog(
        `${hero.class} takes ${damage} damage, health: ${updatedHeroes[heroIndex].health}`,
        "damage"
      );
    }

    setHeroes(updatedHeroes);
  };

  // Apply damage to the monster
  const applyDamageToMonster = (damage) => {
    // Apply Hunter's Mark bonus if present
    const hunterBonus = heroes.some(
      (hero) => hero.markers.includes("🔴") && hero.health > 0
    )
      ? 1
      : 0;

    const totalDamage = damage + hunterBonus;

    // Apply damage
    const newHealth = Math.max(0, monsterHealth - totalDamage);
    setMonsterHealth(newHealth);

    // Show damage number
    const monsterElement = monsterRef.current;
    if (monsterElement) {
      const rect = monsterElement.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 3;

      // Add damage number
      setDamageNumbers((prev) => [
        ...prev,
        {
          id: Date.now(),
          value: totalDamage,
          x,
          y,
          type: "monster",
        },
      ]);

      // Remove after animation
      setTimeout(() => {
        setDamageNumbers((prev) => prev.filter((d) => d.id !== Date.now()));
      }, 1500);
    }

    if (hunterBonus > 0) {
      addToCombatLog(
        `Hunter's Mark adds +${hunterBonus} damage!`,
        "hero_ability"
      );
    }

    if (newHealth === 0) {
      addToCombatLog(`${currentMonster.name} is defeated!`, "victory");
    } else {
      addToCombatLog(
        `Monster takes ${totalDamage} damage, health: ${newHealth}`,
        "damage"
      );
    }
  };

  // Add a damage number display
  const addDamageNumber = (target, value) => {
    // Find the position for the damage number
    let x = 0,
      y = 0;

    if (target === "monster") {
      const monsterElement = monsterRef.current;
      if (monsterElement) {
        const rect = monsterElement.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 3;
      }
    } else {
      // For heroes, get the position from the DOM
      const heroIndex = heroes.indexOf(target);
      const heroElement = document.querySelector(
        `.hero[data-index="${heroIndex}"]`
      );
      if (heroElement) {
        const rect = heroElement.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 3;
      }
    }

    // Add the damage number
    setDamageNumbers((prev) => [
      ...prev,
      {
        id: Date.now(),
        value,
        x,
        y,
        type: target === "monster" ? "monster" : "hero",
      },
    ]);

    // Remove after animation
    setTimeout(() => {
      setDamageNumbers((prev) => prev.filter((d) => d.id !== Date.now()));
    }, 1500);
  };

  // Create a shake effect for a hero
  const shakeHero = (index) => {
    const heroElement = document.querySelector(`.hero[data-index="${index}"]`);
    if (heroElement) {
      heroElement.classList.add("shake");
      setTimeout(() => {
        heroElement.classList.remove("shake");
      }, 500);
    }
  };

  // Heal the monster
  const healMonster = (amount) => {
    const newHealth = Math.min(monsterMaxHealth, monsterHealth + amount);
    setMonsterHealth(newHealth);
    addToCombatLog(`Monster heals for ${amount}, health: ${newHealth}`, "heal");

    // Show heal animation
    setHealAnimation("monster");
    setTimeout(() => {
      setHealAnimation(null);
    }, 1000);
  };

  // Get the index of the next alive hero
  const getNextHeroIndex = () => {
    let nextIndex = currentHeroIndex;
    let count = 0;

    // Prevent infinite loop
    while (count < heroes.length) {
      // Move to next hero based on turn order
      nextIndex =
        turnOrder === "right"
          ? (nextIndex + 1) % heroes.length
          : (nextIndex - 1 + heroes.length) % heroes.length;

      // Check if hero is alive
      if (heroes[nextIndex].health > 0) {
        return nextIndex;
      }

      count++;
    }

    // All heroes are dead, return current (this shouldn't happen normally)
    return currentHeroIndex;
  };

  // Handle item usage from inventory
  const handleItemUse = (itemIndex) => {
    const item = gameData.inventory[itemIndex];

    // Play sound effect
    if (playSound) playSound();

    // Check if item requires a target
    if (
      item.type === "potion" ||
      item.type === "scroll" ||
      item.requiresTarget
    ) {
      setSelectedItem(item);
      setMessage(`Select a hero to use ${item.name} on.`);
    } else if (item.id === "ability_blocker") {
      // Apply ability blocker immediately
      setStatusEffects([
        ...statusEffects,
        {
          type: "ability_blocked",
          duration: 1, // One-time use
          details: "Blocks the next monster special ability",
        },
      ]);

      addToCombatLog(
        `Ability Blocker used! The monster's next special ability will be negated.`,
        "item"
      );

      // Remove item from inventory
      const updatedInventory = [...gameData.inventory];
      updatedInventory.splice(itemIndex, 1);
      gameData.inventory = updatedInventory;

      // Update game stats for item usage
      if (updateStats) {
        updateStats({ itemsUsed: 1 });
      }

      // Close inventory
      setShowInventory(false);
    } else {
      // Apply other item effects immediately
      applyItemEffect(item);

      // Remove item from inventory
      const updatedInventory = [...gameData.inventory];
      updatedInventory.splice(itemIndex, 1);
      gameData.inventory = updatedInventory;

      // Update game stats for item usage
      if (updateStats) {
        updateStats({ itemsUsed: 1 });
      }
    }
  };

  // Apply an item's effect
  const applyItemEffect = (item, hero = null) => {
    // Apply different effects based on item type
    switch (item.id) {
      case "minor_potion":
        if (hero) {
          // Heal the targeted hero for 12
          const potionHeroes = [...heroes];
          const heroIndex = potionHeroes.indexOf(hero);
          potionHeroes[heroIndex].health = Math.min(
            potionHeroes[heroIndex].maxHealth,
            potionHeroes[heroIndex].health + 12
          );
          setHeroes(potionHeroes);

          // Show heal animation
          setHealAnimation(`hero_${heroIndex}`);
          setTimeout(() => {
            setHealAnimation(null);
          }, 1000);

          addToCombatLog(
            `${hero.class} used Minor Health Potion and healed for 12.`,
            "item"
          );
        }
        break;
      case "major_potion":
        if (hero) {
          // Fully heal the targeted hero
          const majorPotionHeroes = [...heroes];
          const heroIndex = majorPotionHeroes.indexOf(hero);
          majorPotionHeroes[heroIndex].health =
            majorPotionHeroes[heroIndex].maxHealth;
          setHeroes(majorPotionHeroes);

          // Show heal animation
          setHealAnimation(`hero_${heroIndex}`);
          setTimeout(() => {
            setHealAnimation(null);
          }, 1000);

          addToCombatLog(
            `${hero.class} used Major Health Potion and fully healed.`,
            "item"
          );
        }
        break;
      case "guardian_angel":
        if (hero) {
          // Add guardian angel status to hero
          const angelHeroes = [...heroes];
          const heroIndex = angelHeroes.indexOf(hero);

          // Add status effect
          setStatusEffects([
            ...statusEffects,
            {
              type: "guardian_angel",
              duration: -1, // until combat end
              details: "Will revive on death with half health",
              heroIndex: heroIndex,
            },
          ]);

          addToCombatLog(
            `${hero.class} is now protected by a Guardian Angel.`,
            "item"
          );
        }
        break;
      case "toxic_scroll":
        if (hero) {
          // Apply Toxic enchant to hero's weapon
          const toxicHeroes = [...heroes];
          const heroIndex = toxicHeroes.indexOf(hero);

          if (toxicHeroes[heroIndex].weapon) {
            toxicHeroes[heroIndex].weapon.enchant = "toxic";
            setHeroes(toxicHeroes);

            addToCombatLog(
              `${hero.class}'s weapon is now enchanted with Toxic!`,
              "item"
            );
          } else {
            addToCombatLog(`${hero.class} has no weapon to enchant.`, "system");
          }
        }
        break;
      case "fiery_scroll":
        if (hero) {
          // Apply Fiery enchant to hero's weapon
          const fieryHeroes = [...heroes];
          const heroIndex = fieryHeroes.indexOf(hero);

          if (fieryHeroes[heroIndex].weapon) {
            fieryHeroes[heroIndex].weapon.enchant = "fiery";
            setHeroes(fieryHeroes);

            addToCombatLog(
              `${hero.class}'s weapon is now enchanted with Fiery!`,
              "item"
            );
          } else {
            addToCombatLog(`${hero.class} has no weapon to enchant.`, "system");
          }
        }
        break;
      case "fortune_scroll":
        if (hero) {
          // Apply Fortune enchant to hero's weapon
          const fortuneHeroes = [...heroes];
          const heroIndex = fortuneHeroes.indexOf(hero);

          if (fortuneHeroes[heroIndex].weapon) {
            fortuneHeroes[heroIndex].weapon.enchant = "fortune";
            setHeroes(fortuneHeroes);

            addToCombatLog(
              `${hero.class}'s weapon is now enchanted with Fortune's Favor!`,
              "item"
            );
          } else {
            addToCombatLog(`${hero.class} has no weapon to enchant.`, "system");
          }
        }
        break;
    }

    // Reset selection state
    setSelectedItem(null);
    setTargetHero(null);
    setShowInventory(false);
  };

  // Handle hero selection for item use
  const handleHeroSelect = (hero) => {
    if (selectedItem) {
      // Apply the selected item to the chosen hero
      applyItemEffect(selectedItem, hero);

      // Remove the item from inventory
      const itemIndex = gameData.inventory.findIndex(
        (item) => item === selectedItem
      );
      if (itemIndex >= 0) {
        const updatedInventory = [...gameData.inventory];
        updatedInventory.splice(itemIndex, 1);
        gameData.inventory = updatedInventory;

        // Update game stats for item usage
        if (updateStats) {
          updateStats({ itemsUsed: 1 });
        }
      }
    }
  };

  // Advance to the next turn
  const advanceTurn = () => {
    // Check for status effects that should expire after a turn
    const updatedStatusEffects = statusEffects.filter((effect) => {
      // Keep permanent effects
      if (effect.duration === -1) return true;

      // Decrement duration for others
      effect.duration -= 1;
      return effect.duration > 0;
    });

    setStatusEffects(updatedStatusEffects);

    // Increment round counter if we've gone through all heroes
    if (
      heroes.every((h) => h.health <= 0) ||
      (currentHeroIndex === heroes.length - 1 && turnOrder === "right") ||
      (currentHeroIndex === 0 && turnOrder === "left")
    ) {
      setRoundCount((prevCount) => prevCount + 1);

      // Update combat rounds stat
      if (updateStats) {
        updateStats({ combatRounds: 1 });
      }
    }

    // Move to next hero if current phase was hero_roll
    if (combatPhase === "hero_roll") {
      const nextIndex = getNextHeroIndex();

      // If we looped back to the first hero, it's monster's turn again
      if (
        (nextIndex === 0 && roundCount > 0) || // We've completed a round
        heroes.every((h) => h.health <= 0) // All heroes are defeated
      ) {
        setCombatPhase("monster_flip");
        setMessage("Monster's turn to flip cards");
      } else {
        setCurrentHeroIndex(nextIndex);
        setCombatPhase("hero_flip");
        setMessage(`${heroes[nextIndex].class}'s turn to flip cards`);
      }
    }
  };

  // End combat and determine rewards
  const endCombat = (victory) => {
    setCombatEnded(true);

    if (victory) {
      // Play victory sound if available
      if (playSound) playSound();

      // Calculate gold reward based on difficulty
      let goldReward;
      if (currentMonster.goldMultiplier) {
        // Roll for gold
        const goldRoll = rollDice(20);
        goldReward = Math.max(
          currentMonster.minGold || 0,
          goldRoll * currentMonster.goldMultiplier
        );
      } else {
        goldReward = currentMonster.minGold || 25; // Default
      }

      // Apply difficulty multipliers
      if (combatDifficulty === "hard") {
        goldReward = Math.floor(goldReward * 1.5); // 50% more gold for elite monsters
      } else if (combatDifficulty === "boss") {
        goldReward = Math.floor(goldReward * 2); // Double gold for bosses
      }

      setRewards({
        gold: goldReward,
        items: [], // Additional rewards would be added here
      });

      addToCombatLog(`Victory! Earned ${goldReward} gold`, "victory");
      setMessage(`You defeated the ${currentMonster.name}!`);

      // Update monsters defeated stat
      if (updateStats) {
        updateStats({ monstersDefeated: 1 });
      }

      // If in a Spade room, roll for extra rewards
      if (combatDifficulty === "hard" || combatDifficulty === "boss") {
        rollForSpecialRewards();
      }

      // Celebration animation
      setEffectAnimation("victory");
      setTimeout(() => {
        setEffectAnimation(null);
      }, 2000);
    } else {
      // Play defeat sound if available
      if (playSound) playSound();

      addToCombatLog("Defeat! All heroes have fallen.", "defeat");
      setMessage("Game over! Your party has been defeated.");

      // Defeat animation
      setEffectAnimation("defeat");
      setTimeout(() => {
        setEffectAnimation(null);
      }, 2000);
    }
  };

  // Roll for additional rewards in hard/boss combats
  const rollForSpecialRewards = () => {
    // Different reward tables based on difficulty
    const rewardTable =
      combatDifficulty === "boss"
        ? getBossRewardTable()
        : getEliteRewardTable();

    const rewardRoll = rollDice(6);

    addToCombatLog(`Rolling for special rewards: ${rewardRoll}`, "roll");

    // Check reward table (elite monster - spade room)
    if (rewardTable[rewardRoll]) {
      const rewardInfo = rewardTable[rewardRoll];

      // Apply the reward
      if (rewardInfo.goldBonus) {
        setRewards((prev) => ({
          ...prev,
          gold: prev.gold + rewardInfo.goldBonus,
        }));
      }

      if (rewardInfo.item) {
        setRewards((prev) => ({
          ...prev,
          items: [...prev.items, rewardInfo.item],
        }));
      }

      if (rewardInfo.effect === "heal") {
        // Heal heroes
        const healedHeroes = [...heroes];
        healedHeroes.forEach((hero) => {
          if (hero.health > 0) {
            hero.health = Math.min(
              hero.maxHealth,
              hero.health + rewardInfo.healAmount
            );
          }
        });
        setHeroes(healedHeroes);

        // Show heal animation
        setHealAnimation("party");
        setTimeout(() => {
          setHealAnimation(null);
        }, 1000);
      }

      addToCombatLog(`Reward: ${rewardInfo.description}`, "reward");

      // Check for additional roll
      if (rewardInfo.additionalRoll) {
        setTimeout(() => {
          const secondRoll = rollDice(6);
          addToCombatLog(
            `Rolling on second reward table: ${secondRoll}`,
            "roll"
          );

          // Process second-tier reward
          if (rewardTable.tier2 && rewardTable.tier2[secondRoll]) {
            const tier2Reward = rewardTable.tier2[secondRoll];

            // Apply the tier 2 reward
            if (tier2Reward.goldBonus) {
              setRewards((prev) => ({
                ...prev,
                gold: prev.gold + tier2Reward.goldBonus,
              }));
            }

            if (tier2Reward.item) {
              setRewards((prev) => ({
                ...prev,
                items: [...prev.items, tier2Reward.item],
              }));
            }

            addToCombatLog(
              `Bonus Reward: ${tier2Reward.description}`,
              "reward"
            );
          }
        }, 1000);
      }
    }
  };

  // Elite monster (spade room) reward table
  const getEliteRewardTable = () => {
    return {
      1: {
        goldBonus: 5,
        description: "+5 gold",
      },
      2: {
        goldBonus: 25,
        description: "+25 gold",
      },
      3: {
        item: {
          id: "minor_potion",
          name: "Minor Health Potion",
          type: "potion",
          icon: "🧪",
          description:
            "Heals 12 health. Use on your turn (costs your roll). Usable between rooms.",
        },
        description: "Minor Health Potion",
      },
      4: {
        item: {
          id: "toxic_scroll",
          name: "Toxic Scroll",
          type: "scroll",
          icon: "📜",
          description: "Apply Toxic enchantment to a weapon",
        },
        description: "Toxic Scroll",
      },
      5: {
        effect: "heal",
        healAmount: 10,
        description: "+10 health to all heroes",
      },
      6: {
        additionalRoll: true,
        description: "Rolling on second reward table...",
        tier2: {
          1: {
            item: {
              id: "fiery_scroll",
              name: "Fiery Scroll",
              type: "scroll",
              icon: "🔥",
              description: "Apply Fiery enchantment to a weapon",
            },
            description: "Fiery Scroll",
          },
          2: {
            effect: "heal",
            healAmount: 10,
            description: "+10 health to party",
          },
          3: {
            goldBonus: 50,
            description: "+50 gold",
          },
          4: {
            item: {
              id: "crusader_scroll",
              name: "Crusader Scroll",
              type: "scroll",
              icon: "✝️",
              description: "Apply Crusader enchantment to a weapon",
            },
            description: "Crusader Scroll",
          },
          5: {
            item: {
              id: "major_potion",
              name: "Major Health Potion",
              type: "potion",
              icon: "🧪",
              description:
                "Fully heals a Hero. Use on your turn (costs your roll). Usable between rooms.",
            },
            description: "Major Health Potion",
          },
          6: {
            goldBonus: 75,
            description: "+75 gold (Jackpot!)",
          },
        },
      },
    };
  };

  // Boss reward table
  const getBossRewardTable = () => {
    return {
      1: {
        goldBonus: 25,
        description: "+25 gold",
      },
      2: {
        goldBonus: 50,
        description: "+50 gold",
      },
      3: {
        item: {
          id: "major_potion",
          name: "Major Health Potion",
          type: "potion",
          icon: "🧪",
          description:
            "Fully heals a Hero. Use on your turn (costs your roll). Usable between rooms.",
        },
        description: "Major Health Potion",
      },
      4: {
        item: {
          id: "fiery_scroll",
          name: "Fiery Scroll",
          type: "scroll",
          icon: "🔥",
          description: "Apply Fiery enchantment to a weapon",
        },
        description: "Fiery Scroll",
      },
      5: {
        effect: "heal",
        healAmount: 15,
        description: "+15 health to all heroes",
      },
      6: {
        additionalRoll: true,
        description: "Rolling on second reward table...",
        tier2: {
          1: {
            item: {
              id: "guardian_angel",
              name: "Guardian Angel",
              type: "item",
              icon: "👼",
              description:
                "If a Hero dies in combat, they are instantly resurrected with half max health.",
            },
            description: "Guardian Angel",
          },
          2: {
            effect: "revive",
            description: "Revive one fallen hero",
          },
          3: {
            goldBonus: 75,
            description: "+75 gold",
          },
          4: {
            item: {
              id: "crusader_scroll",
              name: "Crusader Scroll",
              type: "scroll",
              icon: "✝️",
              description: "Apply Crusader enchantment to a weapon",
            },
            description: "Crusader Scroll",
          },
          5: {
            item: {
              id: "fortune_scroll",
              name: "Fortune Scroll",
              type: "scroll",
              icon: "🍀",
              description: "Apply Fortune enchantment to a weapon",
            },
            description: "Fortune Scroll",
          },
          6: {
            goldBonus: 100,
            item: {
              id: "major_potion",
              name: "Major Health Potion",
              type: "potion",
              icon: "🧪",
              description:
                "Fully heals a Hero. Use on your turn (costs your roll). Usable between rooms.",
            },
            description: "Jackpot! +100 gold and Major Health Potion",
          },
        },
      },
    };
  };

  // Complete combat and return to game
  const finishCombat = () => {
    // Play sound
    if (playSound) playSound();

    // Update game state
    if (combatEnded) {
      if (monsterHealth <= 0) {
        // Victory - update gold and items
        onComplete({
          gold: gameData.gold + rewards.gold,
          inventory: [...gameData.inventory, ...rewards.items],
        });
      } else {
        // Defeat
        onDefeat();
      }
    }
  };

  // Render damage numbers
  const renderDamageNumbers = () => {
    return damageNumbers.map((damage) => (
      <motion.div
        key={damage.id}
        className={`damage-number ${
          damage.type === "monster" ? "monster-damage" : "hero-damage"
        }`}
        initial={{ opacity: 1, y: 0, x: damage.x, top: damage.y }}
        animate={{ opacity: 0, y: -50 }}
        transition={{ duration: 1.5 }}
      >
        {damage.value}
      </motion.div>
    ));
  };

  // Render health bar
  const renderHealthBar = (current, max, type = "hero") => {
    const percentage = Math.max(0, Math.min(100, (current / max) * 100));

    let colorClass = "health-high";
    if (percentage < 25) colorClass = "health-critical";
    else if (percentage < 50) colorClass = "health-low";
    else if (percentage < 75) colorClass = "health-medium";

    return (
      <div className={`health-bar ${type}-health`}>
        <div
          className={`health-fill ${colorClass}`}
          style={{ width: `${percentage}%` }}
        ></div>
        <div className="health-text">
          {current}/{max}
        </div>
      </div>
    );
  };

  // Render color-coded combat log
  const renderCombatLog = () => {
    return combatLog.map((entry, index) => {
      let entryClass = "info";

      // Define CSS classes based on entry type
      switch (entry.type) {
        case "damage":
          entryClass = "damage";
          break;
        case "heal":
          entryClass = "heal";
          break;
        case "hero_ability":
          entryClass = "hero-ability";
          break;
        case "monster_ability":
          entryClass = "monster-ability";
          break;
        case "victory":
          entryClass = "victory";
          break;
        case "defeat":
          entryClass = "defeat";
          break;
        case "cards":
          entryClass = "cards";
          break;
        case "roll":
          entryClass = "roll";
          break;
        case "environment":
          entryClass = "environment";
          break;
        case "flavor":
          entryClass = "flavor";
          break;
        case "item":
          entryClass = "item";
          break;
        case "reward":
          entryClass = "reward";
          break;
      }

      return (
        <div key={index} className={`log-entry ${entryClass}`}>
          <span className="log-time">{entry.timestamp}</span>
          <span className="log-text">{entry.text}</span>
        </div>
      );
    });
  };

  // Render hero status with enhanced tooltips
  const renderHeroStatus = (hero, index) => {
    // Get additional status info for tooltips
    const hasGuardianAngel = statusEffects.some(
      (effect) => effect.type === "guardian_angel" && effect.heroIndex === index
    );

    // Check for weapon enchantment
    const enchantInfo = hero.weapon?.enchant
      ? ENCHANTMENTS[hero.weapon.enchant]
      : null;

    return (
      <div
        key={index}
        className={`hero ${index === currentHeroIndex ? "active" : ""} ${
          hero.health <= 0 ? "defeated" : ""
        } ${
          healAnimation === `hero_${index}` || healAnimation === "party"
            ? "healing"
            : ""
        }`}
        data-index={index}
        onClick={() => (selectedItem ? handleHeroSelect(hero) : null)}
        data-tooltip-id="hero-tooltip"
        data-tooltip-content={`${hero.class} - ${hero.specialization}
Health: ${hero.health}/${hero.maxHealth}
${hero.weapon ? `Weapon: ${hero.weapon.name}` : "No weapon equipped"}
${hasGuardianAngel ? "Protected by Guardian Angel" : ""}
${enchantInfo ? `Enchantment: ${enchantInfo.name}` : ""}`}
      >
        <div className="hero-header">
          <h4 className="hero-name">{hero.class}</h4>
          <div className="hero-spec">{hero.specialization}</div>
        </div>

        {renderHealthBar(hero.health, hero.maxHealth)}

        <div className="hero-body">
          <div className="hero-attached-cards">
            <div
              className={`class-card ${getSuitColorClass(hero.card.suit)} ${
                hero.isTapped ? "tapped" : ""
              }`}
            >
              <span className="card-mini-rank">{hero.card.rank}</span>
              <span className="card-mini-suit">{hero.card.suit}</span>
            </div>
            {hero.attachedCards.map((card, cardIndex) => (
              <div
                key={cardIndex}
                className={`attached-card ${getSuitColorClass(card.suit)} ${
                  card.isTapped ? "tapped" : ""
                }`}
              >
                <span className="card-mini-rank">{card.rank}</span>
                <span className="card-mini-suit">{card.suit}</span>
              </div>
            ))}
          </div>

          {hero.markers.length > 0 && (
            <div className="hero-markers">
              {hero.markers.map((marker, markerIndex) => (
                <span key={markerIndex} className="marker">
                  {marker}
                </span>
              ))}
            </div>
          )}

          {hero.weapon && (
            <div
              className={`hero-weapon ${hero.weapon.rarity}`}
              data-tooltip-id="weapon-tooltip"
              data-tooltip-content={hero.weapon.effect}
            >
              <div className="weapon-name">{hero.weapon.name}</div>
              {hero.weapon.enchant && (
                <div
                  className="weapon-enchant"
                  style={{
                    color: ENCHANTMENTS[hero.weapon.enchant]?.color,
                  }}
                  data-tooltip-id="enchant-tooltip"
                  data-tooltip-content={
                    ENCHANTMENTS[hero.weapon.enchant]?.effect
                  }
                >
                  {ENCHANTMENTS[hero.weapon.enchant]?.icon}
                </div>
              )}
            </div>
          )}

          {/* Special status indicators */}
          {hasGuardianAngel && (
            <div className="hero-status-effect guardian-angel">
              <span className="status-icon">👼</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render combat UI
  return (
    <div className="combat-container" ref={combatContainerRef}>
      <div className="combat-header">
        <h2>
          Combat -{" "}
          {combatDifficulty === "normal"
            ? "Standard Monster"
            : combatDifficulty === "hard"
            ? "Elite Monster"
            : "Boss"}
        </h2>
        <div className="combat-message">{message}</div>
      </div>

      {/* Strategy tip overlay */}
      <AnimatePresence>
        {showStrategy && (
          <motion.div
            className="strategy-tips"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="tip-header">
              <span className="tip-icon">💡</span>
              <h3>Combat Strategy</h3>
              <button
                className="close-tips"
                onClick={() => setShowStrategy(false)}
              >
                ×
              </button>
            </div>
            <ul className="tip-list">
              <li>Match cards to do damage and trigger special abilities</li>
              <li>Use hero abilities strategically - timing matters!</li>
              <li>Pay attention to environment effects for advantages</li>
              <li>Save healing items for critical situations</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Environment Display */}
      {environment && (
        <div className="environment-display">
          <div className="environment-header">
            <div
              className={`environment-icon ${getSuitColorClass(
                environment.suit
              )}`}
            >
              {environment.suit === SUITS.CLUB
                ? "🏟️"
                : environment.suit === SUITS.DIAMOND
                ? "📚"
                : environment.suit === SUITS.HEART
                ? "⚔️"
                : environment.suit === SUITS.SPADE
                ? "🌀"
                : "⚖️"}
            </div>
            <h3 className="environment-name">
              {getEnvironmentName(environment.suit)}
            </h3>
          </div>
          <div className="environment-effects">
            {environmentEffects.map((effect, index) => (
              <div
                key={index}
                className="environment-effect"
                data-tooltip-id="effect-tooltip"
                data-tooltip-content={effect.description}
              >
                <span className="effect-icon">{effect.icon}</span>
                <span className="effect-name">{effect.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monster display */}
      {currentMonster && (
        <div
          className={`monster-display ${shakeMonster ? "shake" : ""} ${
            healAnimation === "monster" ? "healing" : ""
          } ${combatDifficulty === "boss" ? "boss-monster" : ""}`}
          ref={monsterRef}
        >
          <div className="monster-header">
            <h3 className="monster-name">{currentMonster.name}</h3>
            <div
              className="monster-special-badge"
              data-tooltip-id="monster-tooltip"
              data-tooltip-content={currentMonster.special}
              onClick={() => setShowMonsterEffect((prev) => !prev)}
            >
              <span className="special-icon">
                {currentMonster.specialIcon || "⚡"}
              </span>
              <span className="special-text">Special</span>
            </div>
          </div>

          <div className="monster-body">
            <div className="monster-image-container">
              {monsterImage ? (
                <div
                  className="monster-image"
                  style={{ backgroundImage: `url(${monsterImage})` }}
                ></div>
              ) : (
                <div className="monster-placeholder">
                  {currentMonster.specialIcon || "👹"}
                </div>
              )}

              {showMonsterEffect && (
                <div className="monster-effect-bubble">
                  <div className="effect-icon">
                    {currentMonster.specialIcon || "⚡"}
                  </div>
                  <div className="effect-text">
                    {monsterEffectText || currentMonster.special}
                  </div>
                </div>
              )}

              {/* Monster attached cards */}
              <div className="monster-attached-cards">
                {monsterAttachedCards.map((card, index) => (
                  <div
                    key={index}
                    className={`attached-card ${getSuitColorClass(card.suit)} ${
                      card.isTapped ? "tapped" : ""
                    }`}
                  >
                    <span className="card-mini-rank">{card.rank}</span>
                    <span className="card-mini-suit">{card.suit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="monster-stats">
              {renderHealthBar(monsterHealth, monsterMaxHealth, "monster")}

              <div className="monster-info">
                <div className="monster-rank">
                  <span className="info-label">Rank:</span>
                  <span className="info-value">{currentMonster.rank}</span>
                </div>
                <div className="monster-gold">
                  <span className="info-label">Gold:</span>
                  <span className="info-value">
                    {currentMonster.goldMultiplier
                      ? `${currentMonster.goldMultiplier}× roll (min ${currentMonster.minGold})`
                      : currentMonster.minGold}
                  </span>
                </div>
              </div>

              <div className="monster-status">
                {currentMonster.vulnerabilities && (
                  <div
                    className="vulnerabilities"
                    data-tooltip-id="vulnerability-tooltip"
                    data-tooltip-content="Monster takes extra damage from these types"
                  >
                    <span className="status-label">Weak to:</span>
                    <div className="status-icons">
                      {currentMonster.vulnerabilities.map((v, i) => (
                        <span key={i} className="vulnerability-icon">
                          {v === "fire"
                            ? "🔥"
                            : v === "cold"
                            ? "❄️"
                            : v === "physical"
                            ? "⚔️"
                            : v === "magic"
                            ? "✨"
                            : v === "light"
                            ? "☀️"
                            : v === "water"
                            ? "💧"
                            : v === "lightning"
                            ? "⚡"
                            : "⭐"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {currentMonster.resistances && (
                  <div
                    className="resistances"
                    data-tooltip-id="resistance-tooltip"
                    data-tooltip-content="Monster takes reduced damage from these types"
                  >
                    <span className="status-label">Resistant to:</span>
                    <div className="status-icons">
                      {currentMonster.resistances.map((r, i) => (
                        <span key={i} className="resistance-icon">
                          {r === "fire"
                            ? "🔥"
                            : r === "cold"
                            ? "❄️"
                            : r === "physical"
                            ? "⚔️"
                            : r === "magic"
                            ? "✨"
                            : r === "shadow"
                            ? "🌑"
                            : r === "water"
                            ? "💧"
                            : r === "poison"
                            ? "☠️"
                            : "⭐"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status effects display */}
      {statusEffects.length > 0 && (
        <div className="status-effects-display">
          <h4>Active Effects</h4>
          <div className="effects-list">
            {statusEffects.map((effect, index) => (
              <div
                key={index}
                className="effect-tag"
                data-tooltip-id="status-tooltip"
                data-tooltip-content={effect.details}
              >
                <span className="effect-name">
                  {effect.type === "ability_blocked"
                    ? "🛡️ Ability Blocked"
                    : effect.type === "guardian_angel"
                    ? "👼 Guardian Angel"
                    : effect.type === "damage_reflection"
                    ? "☣️ Damage Reflection"
                    : effect.type === "thorns"
                    ? "🌵 Thorns"
                    : effect.type === "lunar_enrage"
                    ? "🌓 Enraged"
                    : effect.type === "elemental_bonus"
                    ? "🌀 Elemental"
                    : effect.type === "armory_bonus"
                    ? "⚔️ Armory"
                    : effect.type === "extra_roll"
                    ? "🎲 Extra Roll"
                    : "⚙️ " + effect.type}
                </span>
                {effect.duration > 0 && (
                  <span className="effect-duration">{effect.duration}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card and dice area */}
      <div className="card-dice-area">
        {/* Turn order selection */}
        {combatPhase === "choose_turn_order" && (
          <div className="turn-order-selection">
            <h3>Choose Turn Direction</h3>
            <p>Select which direction heroes will take turns:</p>
            <div className="direction-buttons">
              <motion.button
                onClick={() => setTurnOrderDirection("left")}
                className="direction-button left"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="direction-arrow">←</span>
                <span className="direction-label">Left</span>
              </motion.button>
              <motion.button
                onClick={() => setTurnOrderDirection("right")}
                className="direction-button right"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="direction-label">Right</span>
                <span className="direction-arrow">→</span>
              </motion.button>
            </div>
          </div>
        )}

        {/* Monster cards */}
        {combatPhase === "monster_flip" && (
          <div className="monster-flips">
            <div className="card-pile" onClick={handleMonsterFlip}>
              {peonPile.length > 0 && (
                <div className="card-stack">
                  <img
                    src={cardBackImg}
                    alt="Card back"
                    className="card-back"
                  />
                  <div className="card-count">{peonPile.length}</div>
                </div>
              )}
            </div>

            <div className="flipped-area">
              {monsterFlipCards.map((card, index) => (
                <motion.div
                  key={index}
                  className={`flipped-card ${getSuitColorClass(card.suit)}`}
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: cardRotation }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="card-content">
                    <div className="card-corner top-left">
                      <div className="card-rank">{card.rank}</div>
                      <div className="card-suit">{card.suit}</div>
                    </div>
                    <div className="card-center">
                      {card.rank === RANKS.JOKER ? (
                        <div className="card-joker">JOKER</div>
                      ) : (
                        <div className="card-suit large">{card.suit}</div>
                      )}
                    </div>
                    <div className="card-corner bottom-right">
                      <div className="card-rank">{card.rank}</div>
                      <div className="card-suit">{card.suit}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              className="flip-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleMonsterFlip}
              disabled={isFlipping}
            >
              <span className="button-icon">🎴</span>
              Monster Flip
            </motion.button>
          </div>
        )}

        {/* Hero cards */}
        {combatPhase === "hero_flip" && (
          <div className="hero-flips">
            <div className="card-pile" onClick={handleHeroFlip}>
              {peonPile.length > 0 && (
                <div className="card-stack">
                  <img
                    src={cardBackImg}
                    alt="Card back"
                    className="card-back"
                  />
                  <div className="card-count">{peonPile.length}</div>
                </div>
              )}
            </div>

            <div className="flipped-area">
              {heroFlipCards.map((card, index) => (
                <motion.div
                  key={index}
                  className={`flipped-card ${getSuitColorClass(card.suit)}`}
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: cardRotation }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="card-content">
                    <div className="card-corner top-left">
                      <div className="card-rank">{card.rank}</div>
                      <div className="card-suit">{card.suit}</div>
                    </div>
                    <div className="card-center">
                      {card.rank === RANKS.JOKER ? (
                        <div className="card-joker">JOKER</div>
                      ) : (
                        <div className="card-suit large">{card.suit}</div>
                      )}
                    </div>
                    <div className="card-corner bottom-right">
                      <div className="card-rank">{card.rank}</div>
                      <div className="card-suit">{card.suit}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              className="flip-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleHeroFlip}
              disabled={isFlipping}
            >
              <span className="button-icon">🎴</span>
              {heroes[currentHeroIndex].class} Flip
            </motion.button>
          </div>
        )}

        {/* Dice rolling */}
        {(combatPhase === "monster_roll" || combatPhase === "hero_roll") &&
          showDice && (
            <div className="dice-container">
              <motion.div
                className={`dice ${diceAnimation ? "rolling" : ""}`}
                animate={
                  isRolling
                    ? {
                        rotate: [0, 45, 90, 135, 180, 225, 270, 315, 360],
                        scale: [1, 1.2, 1, 1.2, 1, 1.2, 1],
                      }
                    : {}
                }
                transition={{ duration: 1, repeat: isRolling ? Infinity : 0 }}
              >
                <img src={diceImg} alt="Dice" className="dice-image" />
                {!isRolling && <div className="dice-result">{diceResult}</div>}
              </motion.div>

              {combatPhase === "hero_roll" && (
                <motion.button
                  className="roll-button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={rollForHero}
                  disabled={isRolling}
                >
                  <span className="button-icon">🎲</span>
                  {heroes[currentHeroIndex].class} Roll
                </motion.button>
              )}
            </div>
          )}

        {/* Roll effect table */}
        {showRollTable && currentRollEffect && (
          <motion.div
            className="roll-effect-table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div
              className="effect-header"
              style={{ backgroundColor: currentRollEffect.color }}
            >
              <div className="effect-icon">{currentRollEffect.icon}</div>
              <div className="effect-name">{currentRollEffect.name}</div>
            </div>
            <div className="effect-description">{currentRollEffect.effect}</div>
          </motion.div>
        )}

        {/* Ability activation prompt */}
        <AnimatePresence>
          {showAbilityPrompt && (
            <motion.div
              className="ability-prompt"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="ability-prompt-icon">✨</div>
              <div className="ability-prompt-text">
                {heroes[currentHeroIndex].class}'s ability activated!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Heroes display */}
      <div className="heroes-display">
        {heroes.map((hero, index) => renderHeroStatus(hero, index))}
      </div>

      {/* Item selection prompt */}
      {selectedItem && (
        <div className="item-selection-prompt">
          <div className="prompt-text">
            Select a hero to use {selectedItem.name} on
          </div>
          <button
            className="cancel-button"
            onClick={() => {
              setSelectedItem(null);
              setMessage(`${heroes[currentHeroIndex].class}'s turn`);
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Combat log */}
      <div className="combat-log">
        <div className="log-header">
          <h4>Combat Log</h4>
          <div className="round-counter">Round: {roundCount}</div>
        </div>
        <div className="log-entries" ref={logContainerRef}>
          {renderCombatLog()}
        </div>

        <div className="log-actions">
          <motion.button
            className="inventory-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowInventory(!showInventory)}
          >
            <span className="button-icon">🎒</span>
            Inventory
          </motion.button>
        </div>
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
          >
            <motion.div
              className="inventory-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
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

              <div className="inventory-items">
                {gameData.inventory.length > 0 ? (
                  gameData.inventory.map((item, index) => (
                    <div
                      key={index}
                      className="inventory-item"
                      onClick={() => handleItemUse(index)}
                    >
                      <div className="item-icon">{item.icon}</div>
                      <div className="item-details">
                        <div className="item-name">{item.name}</div>
                        <div className="item-description">
                          {item.description}
                        </div>
                      </div>
                      <button className="use-button">Use</button>
                    </div>
                  ))
                ) : (
                  <div className="empty-inventory">No items in inventory</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combat ended options */}
      <AnimatePresence>
        {combatEnded && (
          <motion.div
            className="combat-results"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            <h3
              className={monsterHealth <= 0 ? "victory-title" : "defeat-title"}
            >
              {monsterHealth <= 0 ? "Victory!" : "Defeat!"}
            </h3>

            {monsterHealth <= 0 && (
              <div className="rewards">
                <div className="gold-reward">
                  <span className="gold-icon">💰</span>
                  <span className="gold-amount">{rewards.gold} gold</span>
                </div>

                {rewards.items.length > 0 && (
                  <div className="item-rewards">
                    <h4>Items:</h4>
                    <div className="reward-items">
                      {rewards.items.map((item, index) => (
                        <div key={index} className="reward-item">
                          <span className="item-icon">{item.icon}</span>
                          <span className="item-name">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <motion.button
              onClick={finishCombat}
              className="finish-combat"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {monsterHealth <= 0 ? "Continue Adventure" : "Game Over"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Special effects */}
      {effectAnimation && (
        <div className={`effect-animation ${effectAnimation}`}>
          {effectAnimation === "victory" && (
            <div className="victory-effect">
              <div className="victory-text">Victory!</div>
              <div className="victory-sparkles"></div>
            </div>
          )}

          {effectAnimation === "defeat" && (
            <div className="defeat-effect">
              <div className="defeat-text">Defeat</div>
              <div className="defeat-darkness"></div>
            </div>
          )}

          {effectAnimation === "critical_hit" && (
            <div className="critical-hit-effect">
              <div className="critical-text">CRITICAL!</div>
            </div>
          )}

          {effectAnimation === "execution" && (
            <div className="execution-effect">
              <div className="execution-text">EXECUTION!</div>
            </div>
          )}
        </div>
      )}

      {/* Damage numbers */}
      {renderDamageNumbers()}

      {/* Keyboard shortcuts help */}
      <div className="keyboard-shortcuts">
        <div className="shortcut">
          <span className="key">F</span>
          <span className="action">Flip</span>
        </div>
        <div className="shortcut">
          <span className="key">R</span>
          <span className="action">Roll</span>
        </div>
        <div className="shortcut">
          <span className="key">I</span>
          <span className="action">Inventory</span>
        </div>
      </div>

      {/* Tooltips */}
      <Tooltip id="monster-tooltip" />
      <Tooltip id="effect-tooltip" />
      <Tooltip id="weapon-tooltip" />
      <Tooltip id="enchant-tooltip" />
      <Tooltip id="vulnerability-tooltip" />
      <Tooltip id="resistance-tooltip" />
      <Tooltip id="hero-tooltip" />
      <Tooltip id="status-tooltip" />
    </div>
  );
};

export default Combat;
