import React, { useState, useEffect, useRef } from "react";
import {
  shuffleArray,
  RANKS,
  CLASS_DATA,
  WEAPONS,
  ENCHANTMENTS,
  getSuitColorClass,
} from "./GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip";
import "./styles/WeaponChest.css";

// Import placeholder utilities for images
import PlaceholderUtils from "./PlaceholderUtils";

// Create placeholder images for assets
const chestClosedImg = PlaceholderUtils.createPlaceholder(
  "Chest Closed",
  320,
  240
);
const chestOpenImg = PlaceholderUtils.createPlaceholder("Chest Open", 320, 240);
const cardBackImg = PlaceholderUtils.createPlaceholder("Card Back", 120, 170);

// Define suits directly here for clarity
const SUITS = {
  CLUB: "♣",
  DIAMOND: "♦",
  HEART: "♥",
  SPADE: "♠",
};

const WeaponChest = ({ gameData, onComplete, playSound }) => {
  const [selectedHero, setSelectedHero] = useState(null);
  const [chestPile, setChestPile] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [previousCards, setPreviousCards] = useState([]);
  const [flippedCard, setFlippedCard] = useState(null);
  const [weaponRarity, setWeaponRarity] = useState(null);
  const [weapon, setWeapon] = useState(null);
  const [goldBonus, setGoldBonus] = useState(0);
  const [enchant, setEnchant] = useState(null);
  const [flippingState, setFlippingState] = useState("selecting_hero");
  const [flipCount, setFlipCount] = useState(0);
  const [isGoldMultiplying, setIsGoldMultiplying] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [enchantFlips, setEnchantFlips] = useState([]);
  const [message, setMessage] = useState(
    "Choose a hero to receive the weapon chest"
  );
  const [isChestOpen, setIsChestOpen] = useState(false);
  const [isCardFlipping, setIsCardFlipping] = useState(false);
  const [cardRotation, setCardRotation] = useState(0);
  const [showFireworks, setShowFireworks] = useState(false);
  const [fireworksCount, setFireworksCount] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [hoveredWeapon, setHoveredWeapon] = useState(null);
  const [accessibilityAnnouncement, setAccessibilityAnnouncement] =
    useState("");
  const [cardHover, setCardHover] = useState(false);
  const [chestAnimation, setChestAnimation] = useState(false);

  // Ref for the card container
  const cardContainerRef = useRef(null);
  // Ref for accessibility announcements
  const announcementRef = useRef(null);

  // Tips to show during the chest opening
  const weaponChestTips = [
    "The Beginner's Welcome Weapon Chest™ can provide powerful gear to start your journey!",
    "Jokers automatically give you a Common weapon.",
    "Matching two Peon cards in a row gives you a Rare weapon!",
    "Finding a Spade Royalty card gives an Epic weapon the first time, or a Rare weapon after that.",
    "Three Peon cards in a row grant a Legendary weapon - but it's risky!",
    "Jokers during gold rolls grant your weapon an enchantment!",
    "Matching ranks on enchantment rolls gives a Fiery enchant, with a chance for Crusader.",
    "Different ranks on enchantment rolls give a Toxic enchant.",
    "Some weapons have special abilities that activate during combat.",
    "Enchantments enhance your weapon's abilities with magical effects.",
  ];

  // Change tip every 8 seconds
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % weaponChestTips.length);
    }, 8000);

    return () => clearInterval(tipInterval);
  }, []);

  // Handle accessibility announcements
  useEffect(() => {
    if (accessibilityAnnouncement) {
      if (announcementRef.current) {
        announcementRef.current.textContent = accessibilityAnnouncement;
      }
      // Clear announcement after screen reader has time to read it
      const timer = setTimeout(() => {
        setAccessibilityAnnouncement("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [accessibilityAnnouncement]);

  // Prepare the chest pile when a hero is selected
  useEffect(() => {
    if (selectedHero) {
      prepareChestPile();
    }
  }, [selectedHero]);

  // Play fireworks animation when rare+ weapon is earned
  useEffect(() => {
    if (weaponRarity && weaponRarity !== "common") {
      setShowFireworks(true);

      // Create multiple fireworks for higher rarities
      const fireworksTimer = setInterval(() => {
        setFireworksCount((prev) => prev + 1);
      }, 300);

      // Stop after a certain number based on rarity
      const maxFireworks =
        weaponRarity === "rare" ? 3 : weaponRarity === "epic" ? 5 : 7; // 7 for legendary

      setTimeout(() => {
        clearInterval(fireworksTimer);
        setTimeout(() => {
          setShowFireworks(false);
          setFireworksCount(0);
        }, 1500);
      }, maxFireworks * 300);
    }
  }, [weaponRarity]);

  // Prepare the pile for the weapon chest
  const prepareChestPile = () => {
    // Special audio for chest opening
    if (playSound) playSound();

    setIsChestOpen(true);
    setChestAnimation(true);

    setTimeout(() => {
      setChestAnimation(false);
    }, 1000);

    // Get unused class's Peon cards (3 cards)
    const unusedClassRank = gameData.unusedClassRank;
    const unusedClassCards = gameData.deck.peonPile
      .filter((card) => parseInt(card.rank) === unusedClassRank)
      .slice(0, 3);

    // Add a Joker
    const joker = gameData.deck.peonPile.find(
      (card) => card.rank === RANKS.JOKER
    );

    // Royalty cards for the selected hero's class
    const heroClassRank = selectedHero.rank;
    const heroRoyaltyCards = gameData.deck.royaltyPile.filter((card) => {
      if (card.rank === RANKS.JACK) return heroClassRank === 3;
      if (card.rank === RANKS.QUEEN) return heroClassRank === 5;
      if (card.rank === RANKS.KING) return heroClassRank === 7;
      if (card.rank === RANKS.ACE) return heroClassRank === 9;
      return false;
    });

    // Combine and shuffle
    const pile = [...unusedClassCards, joker, ...heroRoyaltyCards];
    setChestPile(shuffleArray(pile));

    setFlippingState("flipping_for_weapon");
    setMessage("Flip cards to determine your weapon...");
    setAccessibilityAnnouncement(
      `Chest opened for ${selectedHero.class}. You can now flip cards to determine your weapon.`
    );

    // Animation delay
    setTimeout(() => {
      setMessage("Click a card to flip it and try your luck!");
    }, 1500);
  };

  // Flip a card from the pile
  const flipCard = () => {
    if (chestPile.length === 0 || isCardFlipping) {
      return;
    }

    // Play flip sound
    if (playSound) playSound();

    // Start flip animation
    setIsCardFlipping(true);
    setCardRotation((prev) => prev + 360);

    // Wait for animation to progress before showing the card
    setTimeout(() => {
      // Get the top card
      const card = chestPile[0];
      const remainingPile = chestPile.slice(1);
      setChestPile(remainingPile);
      setFlippedCard(card);
      setCurrentCard(card);

      // Handle different flipping states
      if (flippingState === "flipping_for_weapon") {
        handleWeaponFlip(card);
      } else if (flippingState === "flipping_for_gold") {
        handleGoldFlip(card);
      } else if (flippingState === "flipping_for_enchant") {
        handleEnchantFlip(card);
      }

      // Add to previous cards
      setPreviousCards([...previousCards, card]);
      setFlipCount(flipCount + 1);
    }, 150); // Halfway through the flip

    // Reset flipping state at the end of animation
    setTimeout(() => {
      setIsCardFlipping(false);
    }, 300);
  };

  // Handle weapon determination flip
  const handleWeaponFlip = (card) => {
    // Process based on card type
    if (card.rank === RANKS.JOKER) {
      // Joker gives a Common weapon
      setWeaponRarity("common");
      setMessage("You got a Joker! This gives you a Common weapon.");
      setAccessibilityAnnouncement(
        "You flipped a Joker. You will receive a Common weapon."
      );
      selectWeapon("common");
      setFlippingState("flipping_for_gold");
      return;
    }

    // Royalty card logic
    if (
      card.rank === RANKS.JACK ||
      card.rank === RANKS.QUEEN ||
      card.rank === RANKS.KING ||
      card.rank === RANKS.ACE
    ) {
      if (card.suit === SUITS.SPADE) {
        // First Spade gives Epic, subsequent ones give Rare
        if (!previousCards.some((pc) => pc.suit === SUITS.SPADE)) {
          setWeaponRarity("epic");
          setMessage(
            "You flipped a Spade Royalty card! This gives you an Epic weapon!"
          );
          setAccessibilityAnnouncement(
            "You flipped a Spade Royalty card. You will receive an Epic weapon!"
          );
          selectWeapon("epic");
          setFlippingState("flipping_for_gold");
        } else {
          setWeaponRarity("rare");
          setMessage(
            "You flipped another Spade! This gives you a Rare weapon."
          );
          setAccessibilityAnnouncement(
            "You flipped another Spade. You will receive a Rare weapon."
          );
          selectWeapon("rare");
          setFlippingState("flipping_for_gold");
        }
      } else {
        // Non-Spade Royalty - discard and flip again
        setMessage(
          "You flipped a non-Spade Royalty card. Discard and flip again."
        );
        setAccessibilityAnnouncement(
          "You flipped a non-Spade Royalty card. It is discarded. Flip again."
        );
      }
      return;
    }

    // Peon card logic - consecutive flips rule
    const consecutivePeons = [...previousCards, card].filter(
      (c) =>
        c.rank !== RANKS.JOKER &&
        c.rank !== RANKS.JACK &&
        c.rank !== RANKS.QUEEN &&
        c.rank !== RANKS.KING &&
        c.rank !== RANKS.ACE
    );

    if (consecutivePeons.length === 2) {
      setWeaponRarity("rare");
      setMessage("Two Peon cards in a row! This gives you a Rare weapon.");
      setAccessibilityAnnouncement(
        "You've flipped two Peon cards in a row. You will receive a Rare weapon."
      );
      selectWeapon("rare");
      setFlippingState("flipping_for_gold");
    } else if (consecutivePeons.length === 3) {
      setWeaponRarity("legendary");
      setMessage(
        "Three Peon cards in a row! This gives you a Legendary weapon!"
      );
      setAccessibilityAnnouncement(
        "You've flipped three Peon cards in a row! You will receive a Legendary weapon!"
      );
      selectWeapon("legendary");
      setFlippingState("flipping_for_gold");
    } else {
      setMessage(
        "You flipped a Peon card. Keep flipping to try for better weapons."
      );
      setAccessibilityAnnouncement(
        "You flipped a Peon card. Keep flipping to try for better weapons."
      );
    }
  };

  // Handle the gold bonus flip
  const handleGoldFlip = (card) => {
    // Joker gives an enchant
    if (card.rank === RANKS.JOKER) {
      setMessage(
        "You got a Joker during the gold flip! Your weapon gains an enchant!"
      );
      setAccessibilityAnnouncement(
        "You flipped a Joker during the gold phase. Your weapon will gain an enchantment!"
      );
      setFlippingState("flipping_for_enchant");
      return;
    }

    // Royalty card stops gold flipping
    if (
      card.rank === RANKS.JACK ||
      card.rank === RANKS.QUEEN ||
      card.rank === RANKS.KING ||
      card.rank === RANKS.ACE
    ) {
      const goldAmount = card.suit === SUITS.SPADE ? 20 : 15;
      setGoldBonus((prevBonus) => prevBonus + goldAmount);
      setMessage(
        `Royalty card gives you ${goldAmount} gold. Gold flipping complete.`
      );
      setAccessibilityAnnouncement(
        `Royalty card gives you ${goldAmount} gold. Gold flipping complete.`
      );
      // Offer risk flip
      setFlippingState("risk_or_finish");
      return;
    }

    // Peon card acts as a multiplier
    if (isGoldMultiplying) {
      // Second Peon gives 3x
      setMultiplier(3);
      setMessage("Second Peon card! Your gold bonus is now 3x.");
      setAccessibilityAnnouncement(
        "You flipped a second Peon card. Your gold bonus is now tripled."
      );
    } else {
      // First Peon gives 2x
      setIsGoldMultiplying(true);
      setMultiplier(2);
      setMessage("Peon card! Your gold bonus is now 2x.");
      setAccessibilityAnnouncement(
        "You flipped a Peon card. Your gold bonus is now doubled."
      );
    }
  };

  // Handle enchant determination flip
  const handleEnchantFlip = (card) => {
    // Store the flipped card for enchant determination
    setEnchantFlips([...enchantFlips, card]);

    // We need two flips to determine enchant type
    if (enchantFlips.length === 0) {
      setMessage("Flip one more card to determine enchant type...");
      setAccessibilityAnnouncement(
        "Flip one more card to determine enchantment type."
      );
      return;
    }

    // Determine enchant based on ranks matching
    const firstFlip = enchantFlips[0];
    if (firstFlip.rank === card.rank) {
      // Ranks match - Fiery enchant (with option for third flip)
      setEnchant("fiery");
      setMessage(
        "Ranks match! Your weapon gets a Fiery enchant. Flip once more for a chance at Crusader!"
      );
      setAccessibilityAnnouncement(
        "The card ranks match! Your weapon gets a Fiery enchantment. You can flip once more for a chance at a Crusader enchantment."
      );
      setFlippingState("risk_for_crusader");
    } else {
      // Ranks don't match - Toxic enchant
      setEnchant("toxic");
      setMessage("Ranks don't match. Your weapon gets a Toxic enchant.");
      setAccessibilityAnnouncement(
        "The card ranks don't match. Your weapon gets a Toxic enchantment."
      );
      setFlippingState("complete");
    }
  };

  // Risk third flip for Crusader enchant
  const handleCrusaderRisk = () => {
    if (chestPile.length === 0 || isCardFlipping) {
      return;
    }

    // Play flip sound
    if (playSound) playSound();

    // Start flip animation
    setIsCardFlipping(true);
    setCardRotation((prev) => prev + 360);

    setTimeout(() => {
      // Get the top card
      const card = chestPile[0];
      const remainingPile = chestPile.slice(1);
      setChestPile(remainingPile);
      setFlippedCard(card);

      // Add to previous cards
      setPreviousCards([...previousCards, card]);

      // If this is a Joker, upgrade to Crusader
      if (card.rank === RANKS.JOKER) {
        setEnchant("crusader");
        setMessage("Success! Your weapon gets a Crusader enchant!");
        setAccessibilityAnnouncement(
          "Success! Your weapon gets a Crusader enchantment!"
        );
        setShowFireworks(true);

        // Create multiple fireworks
        const fireworksTimer = setInterval(() => {
          setFireworksCount((prev) => prev + 1);
        }, 300);

        setTimeout(() => {
          clearInterval(fireworksTimer);
          setTimeout(() => {
            setShowFireworks(false);
            setFireworksCount(0);
          }, 1500);
        }, 1500);
      } else {
        setMessage("No upgrade. Your weapon keeps the Fiery enchant.");
        setAccessibilityAnnouncement(
          "No upgrade. Your weapon keeps the Fiery enchantment."
        );
      }

      setFlippingState("complete");
    }, 150);

    // Reset flipping state
    setTimeout(() => {
      setIsCardFlipping(false);
    }, 300);
  };

  // Risk all-or-nothing flip for extra gold
  const handleGoldRisk = () => {
    if (chestPile.length === 0 || isCardFlipping) {
      return;
    }

    // Play flip sound
    if (playSound) playSound();

    // Start flip animation
    setIsCardFlipping(true);
    setCardRotation((prev) => prev + 360);

    setTimeout(() => {
      // Get the top card
      const card = chestPile[0];
      const remainingPile = chestPile.slice(1);
      setChestPile(remainingPile);
      setFlippedCard(card);

      // Add to previous cards
      setPreviousCards([...previousCards, card]);

      // If this is a Joker, get the bonus gold
      if (card.rank === RANKS.JOKER) {
        setGoldBonus((prevBonus) => prevBonus + 35);
        setMessage("Success! You get an extra 35 gold!");
        setAccessibilityAnnouncement("Success! You get an extra 35 gold!");
        setShowFireworks(true);

        // Create fireworks
        const fireworksTimer = setInterval(() => {
          setFireworksCount((prev) => prev + 1);
        }, 300);

        setTimeout(() => {
          clearInterval(fireworksTimer);
          setTimeout(() => {
            setShowFireworks(false);
            setFireworksCount(0);
          }, 1500);
        }, 900);
      } else {
        setGoldBonus(0);
        setMessage("Risk failed! You lose the gold bonus.");
        setAccessibilityAnnouncement("Risk failed! You lose the gold bonus.");
      }

      // If we have an enchant, we're done
      if (enchant) {
        setFlippingState("complete");
      } else {
        setFlippingState("end_without_enchant");
      }
    }, 150);

    // Reset flipping state
    setTimeout(() => {
      setIsCardFlipping(false);
    }, 300);
  };

  // Select a weapon based on rarity
  const selectWeapon = (rarity) => {
    // Get eligible weapons for the hero's class
    const eligibleWeapons = WEAPONS[rarity].filter(
      (w) => w.class === selectedHero.class
    );

    // Pick a random weapon from the eligible ones
    if (eligibleWeapons.length > 0) {
      const randomIndex = Math.floor(Math.random() * eligibleWeapons.length);
      setWeapon(eligibleWeapons[randomIndex]);
    } else {
      // Fallback if no weapons found
      setWeapon({
        name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${
          selectedHero.class
        } Weapon`,
        effect: "A powerful weapon suited for your class.",
        suit: SUITS.SPADE, // Default suit
        description: `A powerful ${rarity} weapon attuned to the ${selectedHero.class} class.`,
        icon: "⚔️",
      });
    }
  };

  // Complete the weapon chest process
  const completeWeaponChest = () => {
    // Play completion sound
    if (playSound) playSound();

    // Update the hero with their new weapon
    const updatedHeroes = gameData.heroes.map((hero) => {
      if (hero === selectedHero) {
        return {
          ...hero,
          weapon: {
            ...weapon,
            rarity: weaponRarity,
            enchant: enchant,
          },
        };
      }
      return hero;
    });

    // Calculate final gold bonus
    const finalGoldBonus = goldBonus * multiplier;

    // Set final accessibility announcement
    setAccessibilityAnnouncement(
      `Weapon chest complete. ${
        selectedHero.class
      } received a ${weaponRarity} ${weapon.name}${
        enchant ? ` with ${enchant} enchantment` : ""
      }. You gained ${finalGoldBonus} gold.`
    );

    // Complete and move to next phase
    onComplete({
      heroes: updatedHeroes,
      gold: gameData.gold + finalGoldBonus,
    });
  };

  // Get color class for rarity
  const getRarityColorClass = (rarity) => {
    switch (rarity) {
      case "common":
        return "rarity-common";
      case "rare":
        return "rarity-rare";
      case "epic":
        return "rarity-epic";
      case "legendary":
        return "rarity-legendary";
      default:
        return "";
    }
  };

  // Generate fireworks at random positions
  const renderFireworks = () => {
    return Array.from({ length: fireworksCount }).map((_, i) => {
      const top = Math.random() * 80;
      const left = Math.random() * 80 + 10;
      const size = Math.random() * 40 + 20;
      const delay = Math.random() * 0.5;

      // Different colors based on rarity
      const getColor = () => {
        switch (weaponRarity) {
          case "rare":
            return `hsl(${Math.random() * 60 + 200}, 100%, 60%)`;
          case "epic":
            return `hsl(${Math.random() * 60 + 270}, 100%, 60%)`;
          case "legendary":
            return `hsl(${Math.random() * 60 + 40}, 100%, 60%)`;
          default:
            return `hsl(${Math.random() * 360}, 100%, 60%)`;
        }
      };

      return (
        <div
          key={i}
          className="firework"
          style={{
            top: `${top}%`,
            left: `${left}%`,
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: getColor(),
            animationDelay: `${delay}s`,
          }}
          role="presentation"
          aria-hidden="true"
        ></div>
      );
    });
  };

  // Render hero selection
  if (flippingState === "selecting_hero") {
    return (
      <motion.div
        className="weapon-chest"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Beginner's Welcome Weapon Chest™</h2>
        <p className="chest-intro">
          Choose one hero to receive a special weapon from this magical chest!
        </p>

        <motion.div
          className="chest-image-container"
          animate={{ scale: [1, 1.05, 1], y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <img
            src={chestClosedImg}
            alt="Treasure Chest"
            className="chest-image"
          />
          <div className="chest-glow"></div>
        </motion.div>

        <div className="hero-selection">
          {gameData.heroes.map((hero, index) => (
            <motion.div
              key={index}
              className="hero-option"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedHero(hero);
                setAccessibilityAnnouncement(
                  `Selected ${hero.class} to receive the weapon chest.`
                );
              }}
            >
              <h3>{hero.class}</h3>
              <p className="hero-spec">{hero.specialization}</p>
              <div className="weapon-affinity">
                <span className="affinity-label">Weapon Affinity:</span>
                <div className="affinity-types">
                  {CLASS_DATA[hero.rank].weaponPreferences.map((weapon, i) => (
                    <span key={i} className="affinity-type">
                      {weapon}
                    </span>
                  ))}
                </div>
              </div>
              <motion.button
                className="select-button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label={`Select ${hero.class}`}
              >
                Select
              </motion.button>
            </motion.div>
          ))}
        </div>

        <div className="tip-container">
          <div className="tip-icon">💡</div>
          <div className="tip-text">{weaponChestTips[currentTip]}</div>
        </div>

        {/* Accessibility announcement region */}
        <div className="sr-only" aria-live="polite" ref={announcementRef}>
          {accessibilityAnnouncement}
        </div>
      </motion.div>
    );
  }

  // Render weapon chest flipping process
  return (
    <motion.div
      className="weapon-chest-flipping"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2>Beginner's Welcome Weapon Chest™</h2>

      {selectedHero && (
        <div className="selected-hero">
          <h3>Opening chest for {selectedHero.class}</h3>
          <p className="hero-spec">{selectedHero.specialization}</p>
        </div>
      )}

      <div className="chest-area">
        <motion.div
          className="chest-image-container"
          initial={{ scale: 1 }}
          animate={
            chestAnimation
              ? {
                  scale: [1, 1.2, 1.1],
                  y: [0, -20, -10],
                  transition: { duration: 1 },
                }
              : {}
          }
        >
          <img
            src={isChestOpen ? chestOpenImg : chestClosedImg}
            alt="Treasure Chest"
            className="chest-image"
          />
          <div className={`chest-glow ${isChestOpen ? "open" : ""}`}></div>
        </motion.div>

        <div className="chest-message" aria-live="polite">
          <span className="message-text">{message}</span>
        </div>
      </div>

      <div className="card-area">
        {showFireworks && renderFireworks()}

        <div className="card-container" ref={cardContainerRef}>
          {chestPile.length > 0 && (
            <motion.div
              className={`card deck ${cardHover ? "hover" : ""}`}
              onClick={flipCard}
              onMouseEnter={() => setCardHover(true)}
              onMouseLeave={() => setCardHover(false)}
              whileHover={{ scale: 1.05, y: -5 }}
              style={{ zIndex: 10 }}
              role="button"
              aria-label="Flip a card"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  flipCard();
                }
              }}
            >
              <img src={cardBackImg} alt="Card Back" />
              <div className="card-count">{chestPile.length}</div>
            </motion.div>
          )}

          {flippedCard && (
            <motion.div
              className={`card flipped ${getSuitColorClass(flippedCard.suit)}`}
              animate={{
                rotateY: cardRotation,
                transition: { duration: 0.3 },
              }}
              aria-label={`Flipped card: ${flippedCard.rank} of ${flippedCard.suit}`}
            >
              <div className="card-content">
                <div className="card-corner top-left">
                  <div className="card-rank">{flippedCard.rank}</div>
                  <div className="card-suit">{flippedCard.suit}</div>
                </div>
                <div className="card-center">
                  {flippedCard.rank === RANKS.JOKER ? (
                    <div className="card-joker">JOKER</div>
                  ) : (
                    <div className="card-suit large">{flippedCard.suit}</div>
                  )}
                </div>
                <div className="card-corner bottom-right">
                  <div className="card-rank">{flippedCard.rank}</div>
                  <div className="card-suit">{flippedCard.suit}</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="previous-cards" aria-label="Previously flipped cards">
          {previousCards.map((card, index) => (
            <div
              key={index}
              className={`previous-card ${getSuitColorClass(card.suit)}`}
              style={{
                zIndex: index,
                transform: `translateX(${index * 20}px) rotate(${
                  index * 5
                }deg)`,
              }}
              aria-label={`${card.rank} of ${card.suit}`}
            >
              <div className="card-mini-content">
                <span className="card-mini-rank">{card.rank}</span>
                <span className="card-mini-suit">{card.suit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chest-status">
        {weaponRarity && (
          <motion.div
            className={`weapon-result ${getRarityColorClass(weaponRarity)}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onMouseEnter={() => setHoveredWeapon(weapon)}
            onMouseLeave={() => setHoveredWeapon(null)}
            data-tooltip-id="weapon-tooltip"
            data-tooltip-content={weapon?.description}
          >
            <div className="weapon-header">
              <div className="weapon-icon">{weapon?.icon || "⚔️"}</div>
              <h4 className="weapon-name">
                {weapon?.name ||
                  `${
                    weaponRarity.charAt(0).toUpperCase() + weaponRarity.slice(1)
                  } Weapon`}
              </h4>
              <div className="weapon-rarity">{weaponRarity.toUpperCase()}</div>
            </div>
            {weapon && <p className="weapon-effect">{weapon.effect}</p>}
          </motion.div>
        )}

        {goldBonus > 0 && (
          <motion.div
            className="gold-result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="gold-icon">💰</div>
            <h4 className="gold-amount">
              Gold Bonus: {goldBonus}
              {multiplier > 1 && (
                <span className="gold-multiplier">
                  × {multiplier} = {goldBonus * multiplier}
                </span>
              )}
            </h4>
          </motion.div>
        )}

        {enchant && (
          <motion.div
            className="enchant-result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            data-tooltip-id="enchant-tooltip"
            data-tooltip-content={ENCHANTMENTS[enchant]?.description}
          >
            <div
              className="enchant-icon"
              style={{ color: ENCHANTMENTS[enchant]?.color }}
            >
              {ENCHANTMENTS[enchant]?.icon}
            </div>
            <div className="enchant-details">
              <h4 className="enchant-name">{ENCHANTMENTS[enchant]?.name}</h4>
              <p className="enchant-effect">{ENCHANTMENTS[enchant]?.effect}</p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="chest-actions">
        {[
          "flipping_for_weapon",
          "flipping_for_gold",
          "flipping_for_enchant",
        ].includes(flippingState) && (
          <motion.button
            onClick={flipCard}
            className="flip-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isCardFlipping}
            aria-label={`Flip Card (${chestPile.length} remaining)`}
          >
            <span className="button-icon">🎴</span>
            Flip Card ({chestPile.length} remaining)
          </motion.button>
        )}

        {flippingState === "risk_or_finish" && (
          <div className="decision-buttons">
            <motion.button
              onClick={() => handleGoldRisk()}
              className="risk-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Risk Flip for 35 gold or nothing"
            >
              <span className="button-icon">⚠️</span>
              Risk Flip (35 gold or nothing)
            </motion.button>
            <motion.button
              onClick={() => {
                setFlippingState("end_without_enchant");
                setAccessibilityAnnouncement("Taking the gold and finishing.");
              }}
              className="safe-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Take Gold and Finish"
            >
              <span className="button-icon">✅</span>
              Take Gold and Finish
            </motion.button>
          </div>
        )}

        {flippingState === "risk_for_crusader" && (
          <div className="decision-buttons">
            <motion.button
              onClick={handleCrusaderRisk}
              className="risk-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Flip for Crusader enchantment"
            >
              <span className="button-icon">⚠️</span>
              Flip for Crusader
            </motion.button>
            <motion.button
              onClick={() => {
                setFlippingState("complete");
                setAccessibilityAnnouncement("Keeping Fiery enchantment.");
              }}
              className="safe-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Keep Fiery Enchant"
            >
              <span className="button-icon">✅</span>
              Keep Fiery Enchant
            </motion.button>
          </div>
        )}

        {["complete", "end_without_enchant"].includes(flippingState) && (
          <motion.button
            onClick={completeWeaponChest}
            className="complete-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Complete Weapon Chest"
          >
            <span className="button-icon">🎉</span>
            Complete Weapon Chest
          </motion.button>
        )}
      </div>

      <div className="equipment-preview">
        <h3>Equipment Preview</h3>
        <div className="preview-content">
          <div className="hero-preview">
            <h4>{selectedHero.class}</h4>
            <div className="hero-weapon">
              {weapon ? (
                <div
                  className={`weapon-display ${getRarityColorClass(
                    weaponRarity
                  )}`}
                >
                  <span className="weapon-icon">{weapon.icon || "⚔️"}</span>
                  <span className="weapon-name">{weapon.name}</span>
                  {enchant && (
                    <span
                      className="weapon-enchant"
                      style={{ color: ENCHANTMENTS[enchant]?.color }}
                    >
                      {ENCHANTMENTS[enchant]?.icon}
                    </span>
                  )}
                </div>
              ) : (
                <span className="no-weapon">No weapon equipped</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility announcement region */}
      <div className="sr-only" aria-live="polite" ref={announcementRef}>
        {accessibilityAnnouncement}
      </div>

      <Tooltip id="weapon-tooltip" />
      <Tooltip id="enchant-tooltip" />
    </motion.div>
  );
};

export default WeaponChest;
