import React, { useState, useEffect, useRef } from "react";
import {
  rollDice,
  shuffleArray,
  RANKS,
  SUITS,
  ENCHANTMENTS,
  getSuitColorClass,
} from "../contexts/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip";
import "../styles/Combat.css";

const VYRIDION_MECHANICS = {
  COSMIC_RESONANCE_THRESHOLD: 15,
  FATE_ECHO_INTERVAL: 5,
  ENVIRONMENTAL_EFFECTS: {
    MATCH_BONUS: 1,
    SPADE_RISK: { TRIGGER: 1, DAMAGE: 2 },
  },
  ROLL_EFFECTS: {
    "1-3": {
      name: "Reality Surge",
      effect: (heroes, monster) => {
        const updatedHeroes = heroes.map((hero) => ({
          ...hero,
          health: Math.max(0, hero.health - 2),
        }));
        return { heroes: updatedHeroes, monster };
      },
    },
    "4-6": {
      name: "Astral Pulse",
      effect: (heroes, monster) => {
        const lowestHealthHero = heroes.reduce((lowest, current) =>
          current.health < lowest.health ? current : lowest
        );

        const updatedHeroes = heroes.map((hero) =>
          hero.id === lowestHealthHero.id
            ? { ...hero, health: Math.max(0, hero.health - 4) }
            : hero
        );

        const updatedMonster = {
          ...monster,
          health: Math.min(25, monster.health + 2),
        };

        return { heroes: updatedHeroes, monster: updatedMonster };
      },
    },
    "7-9": {
      name: "Crystalline Shield",
      effect: (heroes, monster) => {
        // Implement damage reduction for next turn
        return {
          heroes: heroes.map((hero) => ({
            ...hero,
            statusEffects: [...(hero.statusEffects || []), "HALF_DAMAGE"],
          })),
          monster,
        };
      },
    },
    "10-12": {
      name: "Temporal Shift",
      effect: (heroes, monster) => {
        // Disable next hero ability
        return {
          heroes: heroes.map((hero) => ({
            ...hero,
            statusEffects: [...(hero.statusEffects || []), "ABILITY_DISABLED"],
          })),
          monster,
        };
      },
    },
    "13-15": {
      name: "Gravity Flux",
      effect: (heroes, monster) => {
        // Tap a hero's weapon and deal damage
        const randomHeroIndex = Math.floor(Math.random() * heroes.length);
        const updatedHeroes = [...heroes];

        updatedHeroes[randomHeroIndex] = {
          ...updatedHeroes[randomHeroIndex],
          weapon: {
            ...updatedHeroes[randomHeroIndex].weapon,
            isTapped: true,
          },
          health: Math.max(0, updatedHeroes[randomHeroIndex].health - 3),
        };

        return { heroes: updatedHeroes, monster };
      },
    },
    "16-17": {
      name: "Ethereal Reprisal",
      effect: (heroes, monster) => {
        // Reduce next hero roll, conditional healing
        return {
          heroes: heroes.map((hero) => ({
            ...hero,
            statusEffects: [...(hero.statusEffects || []), "ROLL_REDUCTION"],
          })),
          monster: {
            ...monster,
            health:
              monster.health + (heroes.some((h) => h.lastRoll < 3) ? 3 : 0),
          },
        };
      },
    },
    "18-19": {
      name: "Reality Fracture",
      effect: (heroes, monster) => {
        const updatedHeroes = heroes.map((hero) => {
          const roll = rollDice(6);
          return {
            ...hero,
            health: roll % 2 === 1 ? Math.max(0, hero.health - 2) : hero.health,
            statusEffects:
              roll % 2 === 0
                ? [...(hero.statusEffects || []), "ROLL_BONUS"]
                : hero.statusEffects,
          };
        });

        return { heroes: updatedHeroes, monster };
      },
    },
    20: {
      name: "Astril Unmaking",
      effect: (heroes, monster) => {
        const updatedHeroes = heroes.map((hero) => {
          // Remove first Joker or special item
          const updatedInventory = hero.inventory.filter(
            (item) => item.type !== "JOKER" && !item.isSpecial
          );

          return {
            ...hero,
            inventory: updatedInventory,
          };
        });

        const updatedMonster = {
          ...monster,
          health: Math.min(25, monster.health + 3),
        };

        return { heroes: updatedHeroes, monster: updatedMonster };
      },
    },
  },
};

const VyridionCombat = ({
  gameData,
  onComplete,
  onDefeat,
  updateStats,
  playSound,
}) => {
  // State Management
  const [currentMonster, setCurrentMonster] = useState(null);
  const [monsterHealth, setMonsterHealth] = useState(25);
  const [monsterAttachedCards, setMonsterAttachedCards] = useState([]);
  const [damageCounter, setDamageCounter] = useState(0);
  const [cosmicResonanceTriggered, setCosmicResonanceTriggered] =
    useState(false);

  // Combat State
  const [heroes, setHeroes] = useState(
    gameData.heroes.map((hero) => ({
      ...hero,
      statusEffects: [],
      lastRoll: null,
      matchBonus: 0,
    }))
  );
  const [heroFlipCards, setHeroFlipCards] = useState([]);
  const [heroRoll, setHeroRoll] = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  const [combatPhase, setCombatPhase] = useState("SETUP");
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  // Environment and Game Mechanics
  const [environment, setEnvironment] = useState({
    name: "Nexus Pinnacle",
    description: "Final confrontation of the Astrilith",
    suit: SUITS.SPADE,
  });

  // Logging Utility
  const addToCombatLog = (message, type = "info") => {
    setCombatLog((prev) => [
      ...prev,
      {
        text: message,
        timestamp: new Date().toLocaleTimeString(),
        type,
      },
    ]);
  };

  // Initialize Combat
  useEffect(() => {
    initializeCombat();
  }, []);

  const initializeCombat = () => {
    // Initialize Vyridion's attached cards
    const initialAttachedCards = drawMultipleCards(3);
    setMonsterAttachedCards(initialAttachedCards);

    // Set Vyridion as the current monster
    setCurrentMonster({
      name: "Vyridion, The Astril Conductor",
      health: 25,
      specialIcon: "🌌",
      special: "Cosmic Resonance",
      rank: "Final Boss",
    });

    addToCombatLog(
      "Vyridion, The Astril Conductor emerges in the Nexus Pinnacle!"
    );
    setCombatPhase("HERO_FLIP");
  };

  // Card Drawing Mechanics
  const drawCardFromPeon = () => {
    if (gameData.deck.peonPile.length === 0) {
      // Reshuffle discard pile if needed
      return null;
    }
    const card = gameData.deck.peonPile[0];
    gameData.deck.peonPile.shift();
    return card;
  };

  const drawMultipleCards = (count) => {
    const cards = [];
    for (let i = 0; i < count; i++) {
      const card = drawCardFromPeon();
      if (card) cards.push(card);
    }
    return cards;
  };

  // Hero Flip Mechanics
  const handleHeroFlip = () => {
    const currentHero = heroes[currentHeroIndex];
    const flippedCards = [drawCardFromPeon(), drawCardFromPeon()];

    setHeroFlipCards(flippedCards);

    // Check for environmental match bonus
    const matchBonus = checkMatchEffects(flippedCards);
    const updatedHeroes = [...heroes];
    updatedHeroes[currentHeroIndex].matchBonus = matchBonus;

    // Check for Spade flip risk
    const updatedCards = applyEnvironmentalEffect(flippedCards);

    // Add log entry
    addToCombatLog(
      `${currentHero.class} flips ${updatedCards
        .map((c) => `${c.rank}${c.suit}`)
        .join(", ")}`
    );

    // Prepare for roll phase
    setCombatPhase("HERO_ROLL");
  };

  // Match and Environmental Effects
  const checkMatchEffects = (cards) => {
    let matchBonus = 0;

    // Check for matching ranks with monster's attached cards
    const matches = cards.filter((card) =>
      monsterAttachedCards.some((attached) => attached.rank === card.rank)
    );

    // Apply bonus for matches
    matchBonus +=
      matches.length * VYRIDION_MECHANICS.ENVIRONMENTAL_EFFECTS.MATCH_BONUS;

    return matchBonus;
  };

  const applyEnvironmentalEffect = (heroFlipCards) => {
    let updatedCards = [...heroFlipCards];

    // Check for Spade flip risk
    updatedCards.forEach((card) => {
      if (card.suit === SUITS.SPADE) {
        const riskRoll = rollDice(6);
        if (riskRoll === 1) {
          // Take damage from Spade flip
          const updatedHeroes = [...heroes];
          updatedHeroes[currentHeroIndex].health -= 2;
          setHeroes(updatedHeroes);

          addToCombatLog(
            `Spade flip risk: ${updatedHeroes[currentHeroIndex].class} takes 2 damage!`,
            "danger"
          );
        }
      }
    });

    return updatedCards;
  };

  // Hero Roll Mechanics
  const handleHeroRoll = () => {
    const currentHero = heroes[currentHeroIndex];
    const roll = rollDice(20);

    // Apply roll modifications from status effects
    let modifiedRoll = roll;
    const heroStatusEffects = currentHero.statusEffects || [];

    if (heroStatusEffects.includes("ROLL_REDUCTION")) {
      modifiedRoll = Math.max(1, modifiedRoll - 1);
    }

    if (heroStatusEffects.includes("ROLL_BONUS")) {
      modifiedRoll = Math.min(20, modifiedRoll + 1);
    }

    // Store last roll for potential future effects
    const updatedHeroes = [...heroes];
    updatedHeroes[currentHeroIndex].lastRoll = modifiedRoll;
    updatedHeroes[currentHeroIndex].statusEffects = updatedHeroes[
      currentHeroIndex
    ].statusEffects.filter(
      (effect) => effect !== "ROLL_REDUCTION" && effect !== "ROLL_BONUS"
    );

    setHeroes(updatedHeroes);
    setHeroRoll(modifiedRoll);

    // Add log entry
    addToCombatLog(`${currentHero.class} rolls ${modifiedRoll}`, "roll");

    // Apply hero roll damage to Vyridion
    applyHeroDamage(modifiedRoll);

    // Prepare for next hero or monster turn
    advanceTurn();
  };

  // Hero Damage Application
  const applyHeroDamage = (roll) => {
    const currentHero = heroes[currentHeroIndex];
    let baseDamage = Math.floor(roll / 4); // Basic damage scaling

    // Add match bonus
    baseDamage += currentHero.matchBonus || 0;

    // Apply damage to Vyridion
    const newHealth = Math.max(0, monsterHealth - baseDamage);
    setMonsterHealth(newHealth);

    // Check Fate's Echo
    checkFateEcho(baseDamage);

    // Check Cosmic Resonance
    checkCosmicResonance();

    addToCombatLog(
      `${currentHero.class} deals ${baseDamage} damage to Vyridion!`,
      "damage"
    );
  };

  // Fate's Echo Mechanic
  const checkFateEcho = (damage) => {
    const newDamageCounter = damageCounter + damage;

    if (newDamageCounter >= 5) {
      const fateEchoCard = drawCardFromPeon();
      const isEven = parseInt(fateEchoCard.rank) % 2 === 0;

      if (isEven) {
        // Vyridion loses additional health
        setMonsterHealth((prev) => Math.max(0, prev - 2));
        addToCombatLog(
          "Fate's Echo: Even card - Vyridion loses 2 health!",
          "damage"
        );
      } else {
        // Vyridion regains health
        setMonsterHealth((prev) => Math.min(25, prev + 2));
        addToCombatLog(
          "Fate's Echo: Odd card - Vyridion regains 2 health!",
          "heal"
        );
      }

      // Reset damage counter
      setDamageCounter(0);
    } else {
      setDamageCounter(newDamageCounter);
    }
  };

  // Cosmic Resonance Trigger
  const checkCosmicResonance = () => {
    if (monsterHealth <= 15 && !cosmicResonanceTriggered) {
      triggerCosmicResonance();
    }
  };

  // Cosmic Resonance Effect
  const triggerCosmicResonance = () => {
    setCosmicResonanceTriggered(true);

    // Force heroes to discard an attached card
    const updatedHeroes = heroes.map((hero) => {
      if (hero.attachedCards.length > 0) {
        hero.attachedCards.shift();
        addToCombatLog(
          `${hero.class} forced to discard an attached card!`,
          "danger"
        );
      }
      return hero;
    });

    setHeroes(updatedHeroes);
    addToCombatLog("COSMIC RESONANCE ACTIVATED!", "special");
  };

  // Turn Advancement
  const advanceTurn = () => {
    const nextHeroIndex = (currentHeroIndex + 1) % heroes.length;

    if (nextHeroIndex === 0) {
      // Monster's turn
      handleMonsterTurn();
    } else {
      // Next hero's turn
      setCurrentHeroIndex(nextHeroIndex);
      setCombatPhase("HERO_FLIP");
    }
  };

  // Monster Turn Mechanics
  const handleMonsterTurn = () => {
    // Roll for monster's action
    const monsterRoll = rollDice(20);

    // Find the corresponding roll effect
    const effectKey = Object.keys(VYRIDION_MECHANICS.ROLL_EFFECTS).find(
      (range) => {
        const [min, max] = range.split("-").map(Number);
        return monsterRoll >= min && monsterRoll <= max;
      }
    );

    const effect = VYRIDION_MECHANICS.ROLL_EFFECTS[effectKey];

    // Apply the effect
    const { heroes: updatedHeroes, monster: updatedMonster } = effect.effect(
      heroes,
      { ...currentMonster, health: monsterHealth }
    );

    // Update game state
    setHeroes(updatedHeroes);
    setMonsterHealth(updatedMonster.health);

    // Log the monster's action
    addToCombatLog(`Vyridion uses ${effect.name}!`, "monster");

    // Check for combat end conditions
    checkCombatEnd();

    // Reset for next round
    setCurrentHeroIndex(0);
    setCombatPhase("HERO_FLIP");
  };

  // Combat End Conditions
  const checkCombatEnd = () => {
    // Check if Vyridion is defeated
    if (monsterHealth <= 0) {
      endCombat(true);
      return;
    }

    // Check if all heroes are defeated
    if (heroes.every((hero) => hero.health <= 0)) {
      endCombat(false);
      return;
    }
  };

  // End Combat Mechanics
  const endCombat = (victory) => {
    if (victory) {
      // Calculate rewards
      const rewards = {
        gold: 150,
        items: [
          {
            type: "LEGENDARY_WEAPON_CHOICE",
            description: "Choose a Legendary Weapon or Enchantment",
          },
        ],
      };

      addToCombatLog("Vyridion falls! The Astrilith trembles!", "victory");

      // Complete combat with victory
      onComplete({
        ...gameData,
        gold: gameData.gold + rewards.gold,
        gameCompleted: true,
        rewards,
      });
    } else {
      addToCombatLog("The heroes have fallen. Reality reshapes...", "defeat");

      // Trigger defeat
      onDefeat();
    }
  };

  // Render Combat UI
  return (
    <div className="combat-container vyridion-final-battle">
      <div className="combat-header">
        <h2>Nexus Pinnacle - Final Confrontation</h2>
        <div className="combat-message">
          Vyridion, The Astril Conductor awaits
        </div>
      </div>

      {/* Monster Display */}
      <div className="monster-display">
        <div className="monster-header">
          <h3 className="monster-name">Vyridion, The Astril Conductor</h3>
        </div>
        <div className="monster-health">
          <div
            className="health-bar"
            style={{
              width: `${(monsterHealth / 25) * 100}%`,
              backgroundColor: monsterHealth > 15 ? "#4caf50" : "#f44336",
            }}
          >
            {monsterHealth} / 25
          </div>
        </div>
      </div>

      {/* Heroes Display */}
      <div className="heroes-display">
        {heroes.map((hero, index) => (
          <div
            key={hero.id}
            className={`hero ${index === currentHeroIndex ? "active" : ""}`}
          >
            <h4>{hero.class}</h4>
            <div className="hero-health">
              {hero.health} / {hero.maxHealth}
            </div>
            {hero.statusEffects.length > 0 && (
              <div className="hero-status-effects">
                {hero.statusEffects.map((effect) => (
                  <span key={effect} className="status-effect">
                    {effect}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Combat Actions */}
      <div className="combat-actions">
        {combatPhase === "HERO_FLIP" && (
          <button onClick={handleHeroFlip}>
            Flip Cards for {heroes[currentHeroIndex].class}
          </button>
        )}
        {combatPhase === "HERO_ROLL" && (
          <button onClick={handleHeroRoll}>
            Roll for {heroes[currentHeroIndex].class}
          </button>
        )}
      </div>

      {/* Combat Log */}
      <div className="combat-log">
        {combatLog.map((entry, index) => (
          <div key={index} className={`log-entry ${entry.type}`}>
            {entry.timestamp} - {entry.text}
          </div>
        ))}
      </div>

      {/* Vyridion's Attached Cards */}
      <div className="monster-attached-cards">
        {monsterAttachedCards.map((card, index) => (
          <div key={index} className="attached-card">
            {card.rank}
            {card.suit}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VyridionCombat;
