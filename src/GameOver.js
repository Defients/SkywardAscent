import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Tooltip } from "react-tooltip";
import "./styles/GameOver.css";
import PlaceholderUtils from "./PlaceholderUtils";

// Use placeholder images instead of direct imports
const victoryBgImg = PlaceholderUtils.createPlaceholder(
  "Victory Background",
  1200,
  800
);
const defeatBgImg = PlaceholderUtils.createPlaceholder(
  "Defeat Background",
  1200,
  800
);
const achievementBadgeImg = PlaceholderUtils.createPlaceholder(
  "Achievement Badge",
  100,
  100
);

// Define achievements directly since we can't import from context
const ACHIEVEMENTS = {
  first_victory: {
    title: "First Victory",
    description: "Complete your first successful run of the Astral Spire",
    icon: "🏆",
    points: 10,
  },
  flawless_victory: {
    title: "Flawless Victory",
    description: "Complete a run without any hero falling in battle",
    icon: "✨",
    points: 25,
  },
  legendary_collector: {
    title: "Legendary Collector",
    description: "Acquire at least one legendary weapon in a single run",
    icon: "⚡",
    points: 15,
  },
  wealthy_adventurer: {
    title: "Wealthy Adventurer",
    description: "Accumulate over 300 gold in a single run",
    icon: "💰",
    points: 20,
  },
  monster_slayer: {
    title: "Monster Slayer",
    description: "Defeat 20 monsters across all your runs",
    icon: "⚔️",
    points: 15,
  },
  dragon_tamer: {
    title: "Dragon Tamer",
    description: "Defeat the Dragon boss without any hero falling",
    icon: "🐉",
    points: 30,
  },
  cosmic_master: {
    title: "Cosmic Master",
    description: "Defeat Apexus with all heroes still alive",
    icon: "🌌",
    points: 50,
  },
};

const GameOver = ({ gameData, onRestart, playSound }) => {
  const [currentView, setCurrentView] = useState("summary");
  const [showStats, setShowStats] = useState(false);
  const [showHeroes, setShowHeroes] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [earnedAchievements, setEarnedAchievements] = useState([]);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shareText, setShareText] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [heroDetails, setHeroDetails] = useState(null);
  const [showTips, setShowTips] = useState(false);

  // Initialize and check for completion status
  useEffect(() => {
    // Determine if game was completed or the player was defeated
    const isDefeat = gameData.heroes.every((hero) => hero.health <= 0);
    const isVictory = gameData.gameCompleted && !isDefeat;

    // Play appropriate sound
    if (playSound) {
      playSound();
    }

    // Stagger the animations for a more dynamic reveal
    setTimeout(() => setShowStats(true), 1000);
    setTimeout(() => setShowHeroes(true), 2000);
    setTimeout(() => setShowAchievements(true), 3000);
    setTimeout(() => setAnimationComplete(true), 4000);

    // Generate share text
    generateShareText(isVictory);

    // Run confetti for victory
    if (isVictory) {
      setTimeout(() => {
        setShowConfetti(true);
        launchConfetti();
      }, 1500);
    }

    // Check achievements
    checkAchievements();
  }, []);

  // Generate shareable text summary for social media
  const generateShareText = (isVictory) => {
    const stats = getStatistics();
    let text = "";

    if (isVictory) {
      text = `🎮 I conquered Skyward Ascent! 🏔️\n`;
      text += `Defeated ${stats.monstersDefeated} monsters, collected ${stats.gold} gold, and reached the top of the Astral Spire with ${stats.heroesAlive}/3 heroes surviving!\n`;
      text += `Final Rating: ${getRating()} #SkywardAscent`;
    } else {
      text = `🎮 My journey in Skyward Ascent ended in defeat...\n`;
      text += `Made it to Tier ${stats.tiersCompleted}, defeated ${stats.monstersDefeated} monsters, and collected ${stats.gold} gold before falling.\n`;
      text += `I'll try again! #SkywardAscent`;
    }

    setShareText(text);
  };

  // Launch confetti effect for victory celebration
  const launchConfetti = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const colors = ["#00a8cc", "#4caf50", "#ff9800", "#9c27b0", "#e91e63"];

    const randomInRange = (min, max) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Launch confetti from sides
      confetti({
        particleCount,
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: { y: 0.6 },
        colors: colors,
        shapes: ["square", "circle"],
        scalar: randomInRange(0.4, 1),
      });

      confetti({
        particleCount,
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: { y: 0.6, x: 1 },
        colors: colors,
        shapes: ["square", "circle"],
        scalar: randomInRange(0.4, 1),
      });
    }, 250);
  };

  // Share results on social media or copy to clipboard
  const shareResults = () => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(shareText)
        .then(() => {
          setShowShare(true);
          setTimeout(() => setShowShare(false), 3000);
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
        });
    }
  };

  // Check which achievements were earned
  const checkAchievements = () => {
    const achievements = [];

    // Check for different achievements based on game stats
    if (
      gameData.gameCompleted &&
      !gameData.heroes.every((hero) => hero.health <= 0)
    ) {
      achievements.push("first_victory");

      // Check for flawless victory - no heroes fallen during the game
      if (!gameData.gameStats.heroDeaths) {
        achievements.push("flawless_victory");
      }

      // Check for cosmic master - defeated Apexus with all heroes alive
      if (gameData.heroes.every((hero) => hero.health > 0)) {
        achievements.push("cosmic_master");
      }
    }

    // Check for legendary weapon
    if (
      gameData.heroes.some(
        (hero) => hero.weapon && hero.weapon.rarity === "legendary"
      )
    ) {
      achievements.push("legendary_collector");
    }

    // Check for wealthy adventurer
    if (gameData.gold >= 300) {
      achievements.push("wealthy_adventurer");
    }

    // Check for monster slayer (20+ monsters defeated)
    if (gameData.gameStats.monstersDefeated >= 20) {
      achievements.push("monster_slayer");
    }

    // Check for dragon tamer if applicable
    if (
      gameData.gameStats.defeatedDragon &&
      !gameData.gameStats.heroDeathsDuringDragon
    ) {
      achievements.push("dragon_tamer");
    }

    // Set earned achievements
    setEarnedAchievements(achievements);
  };

  // Get final statistics
  const getStatistics = () => {
    return {
      gold: gameData.gold,
      tiersCompleted: gameData.currentTier - 1,
      heroesAlive: gameData.heroes.filter((hero) => hero.health > 0).length,
      heroesWithLegendary: gameData.heroes.filter(
        (hero) => hero.weapon && hero.weapon.rarity === "legendary"
      ).length,
      totalItems: gameData.inventory.length,
      monstersDefeated: gameData.gameStats.monstersDefeated || 0,
      roomsVisited: gameData.gameStats.roomsVisited || 0,
      itemsUsed: gameData.gameStats.itemsUsed || 0,
      combatRounds: gameData.gameStats.combatRounds || 0,
      heroDeaths: gameData.gameStats.heroDeaths || 0,
      goldSpent: gameData.gameStats.goldSpent || 0,
      healingReceived: gameData.gameStats.healingReceived || 0,
      damageTaken: gameData.gameStats.damageTaken || 0,
      damageDealt: gameData.gameStats.damageDealt || 0,
    };
  };

  const stats = getStatistics();

  // Check if game was completed or player was defeated
  const isDefeat = gameData.heroes.every((hero) => hero.health <= 0);
  const isVictory = gameData.gameCompleted && !isDefeat;

  // Generate result message
  const getResultMessage = () => {
    if (isVictory) {
      return "Victory! You have defeated the Astral Overlord Apexus and saved the realm!";
    } else if (isDefeat) {
      return "Defeat! Your party has fallen in battle.";
    } else {
      return "Game Over. Your adventure has come to an end.";
    }
  };

  // Generate performance rating
  const getRating = () => {
    let score = 0;

    // Add points for various achievements
    score += stats.tiersCompleted * 30;
    score += stats.heroesAlive * 20;
    score += stats.heroesWithLegendary * 15;
    score += Math.floor(stats.gold / 50);
    score += stats.totalItems * 5;
    score += stats.monstersDefeated * 2;
    score -= stats.heroDeaths * 10;

    // Extra points for achievements
    score += earnedAchievements.length * 10;

    // Return rating based on score
    if (score >= 200) return "Legendary Ascendant";
    if (score >= 150) return "Master Climber";
    if (score >= 100) return "Skilled Adventurer";
    if (score >= 50) return "Novice Explorer";
    return "Aspiring Hero";
  };

  // Handle tab changes
  const changeTab = (tab) => {
    if (playSound) playSound();
    setCurrentView(tab);
  };

  // Show detailed hero info
  const showHeroDetail = (hero) => {
    setHeroDetails(hero);
  };

  // Close hero detail view
  const closeHeroDetail = () => {
    setHeroDetails(null);
  };

  // Toggle gameplay tips
  const toggleTips = () => {
    setShowTips(!showTips);
  };

  // Generate tips based on gameplay stats
  const getGameplayTips = () => {
    const tips = [];

    if (stats.heroDeaths > 2) {
      tips.push(
        "Try keeping your heroes alive longer by prioritizing health potions and defensive items."
      );
    }

    if (stats.heroesWithLegendary === 0) {
      tips.push(
        "Focus on acquiring better weapons through elite monsters and careful card flipping in the weapon chest."
      );
    }

    if (stats.gold < 100) {
      tips.push(
        "Look for opportunities to earn more gold by choosing Diamond rooms and utilizing Fortune enchantments."
      );
    }

    if (stats.damageTaken > stats.damageDealt) {
      tips.push(
        "Try to improve your combat strategy by matching cards more effectively and utilizing class abilities."
      );
    }

    if (tips.length === 0) {
      tips.push(
        "You're doing great! Keep refining your strategy to climb even higher next time."
      );
    }

    return tips;
  };

  return (
    <div
      className={`game-over ${isVictory ? "victory" : "defeat"}`}
      style={{
        backgroundImage: `url(${isVictory ? victoryBgImg : defeatBgImg})`,
      }}
    >
      <motion.div
        className="result-header"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        <h2 className={isVictory ? "victory-title" : "defeat-title"}>
          {isVictory ? "Victory!" : "Defeat!"}
        </h2>

        <div className="result-message">{getResultMessage()}</div>
      </motion.div>

      <div className="content-tabs">
        <button
          className={`tab ${currentView === "summary" ? "active" : ""}`}
          onClick={() => changeTab("summary")}
        >
          <span className="tab-icon">📊</span>
          <span className="tab-text">Summary</span>
        </button>
        <button
          className={`tab ${currentView === "heroes" ? "active" : ""}`}
          onClick={() => changeTab("heroes")}
        >
          <span className="tab-icon">👥</span>
          <span className="tab-text">Heroes</span>
        </button>
        <button
          className={`tab ${currentView === "achievements" ? "active" : ""}`}
          onClick={() => changeTab("achievements")}
        >
          <span className="tab-icon">🏆</span>
          <span className="tab-text">Achievements</span>
        </button>
        <button
          className={`tab ${currentView === "tips" ? "active" : ""}`}
          onClick={() => changeTab("tips")}
        >
          <span className="tab-icon">💡</span>
          <span className="tab-text">Tips</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Summary View */}
        {currentView === "summary" && (
          <motion.div
            className="summary-view"
            key="summary"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence>
              {showStats && (
                <motion.div
                  className="game-stats"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3>Adventure Statistics</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-icon">🏔️</div>
                      <div className="stat-details">
                        <div className="stat-label">Tiers Completed</div>
                        <div className="stat-value">{stats.tiersCompleted}</div>
                      </div>
                    </div>

                    <div className="stat-item">
                      <div className="stat-icon">💰</div>
                      <div className="stat-details">
                        <div className="stat-label">Gold Acquired</div>
                        <div className="stat-value">{stats.gold}</div>
                      </div>
                    </div>

                    <div className="stat-item">
                      <div className="stat-icon">👤</div>
                      <div className="stat-details">
                        <div className="stat-label">Heroes Surviving</div>
                        <div className="stat-value">
                          {stats.heroesAlive} / 3
                        </div>
                      </div>
                    </div>

                    <div className="stat-item">
                      <div className="stat-icon">📦</div>
                      <div className="stat-details">
                        <div className="stat-label">Items Collected</div>
                        <div className="stat-value">{stats.totalItems}</div>
                      </div>
                    </div>

                    <div className="stat-item">
                      <div className="stat-icon">⚔️</div>
                      <div className="stat-details">
                        <div className="stat-label">Monsters Defeated</div>
                        <div className="stat-value">
                          {stats.monstersDefeated}
                        </div>
                      </div>
                    </div>

                    <div className="stat-item">
                      <div className="stat-icon">🏛️</div>
                      <div className="stat-details">
                        <div className="stat-label">Rooms Visited</div>
                        <div className="stat-value">{stats.roomsVisited}</div>
                      </div>
                    </div>

                    <div className="stat-item">
                      <div className="stat-icon">🎲</div>
                      <div className="stat-details">
                        <div className="stat-label">Combat Rounds</div>
                        <div className="stat-value">{stats.combatRounds}</div>
                      </div>
                    </div>

                    <div className="stat-item">
                      <div className="stat-icon">☠️</div>
                      <div className="stat-details">
                        <div className="stat-label">Hero Deaths</div>
                        <div className="stat-value">{stats.heroDeaths}</div>
                      </div>
                    </div>

                    {/* Advanced stats */}
                    <div className="stat-item">
                      <div className="stat-icon">💳</div>
                      <div className="stat-details">
                        <div className="stat-label">Gold Spent</div>
                        <div className="stat-value">{stats.goldSpent || 0}</div>
                      </div>
                    </div>

                    <div className="stat-item">
                      <div className="stat-icon">❤️</div>
                      <div className="stat-details">
                        <div className="stat-label">Healing Received</div>
                        <div className="stat-value">
                          {stats.healingReceived || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {animationComplete && (
                <motion.div
                  className="final-rating"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3>Performance Rating</h3>
                  <div className="rating">{getRating()}</div>
                  <div className="rating-stars">
                    {Array.from({
                      length:
                        getRating() === "Legendary Ascendant"
                          ? 5
                          : getRating() === "Master Climber"
                          ? 4
                          : getRating() === "Skilled Adventurer"
                          ? 3
                          : getRating() === "Novice Explorer"
                          ? 2
                          : 1,
                    }).map((_, i) => (
                      <span key={i} className="star">
                        ⭐
                      </span>
                    ))}
                  </div>

                  <motion.div
                    className="share-results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <button className="share-button" onClick={shareResults}>
                      <span className="share-icon">📋</span>
                      Copy Results to Share
                    </button>

                    <AnimatePresence>
                      {showShare && (
                        <motion.div
                          className="share-notification"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          Results copied to clipboard!
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Heroes View */}
        {currentView === "heroes" && (
          <motion.div
            className="heroes-view"
            key="heroes"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence>
              {showHeroes && (
                <motion.div
                  className="hero-results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3>Hero Journeys</h3>
                  <div className="hero-results-grid">
                    {gameData.heroes.map((hero, index) => (
                      <motion.div
                        key={index}
                        className={`hero-result ${
                          hero.health <= 0 ? "fallen" : "alive"
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.2 }}
                        onClick={() => showHeroDetail(hero)}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="hero-header">
                          <h4 className="hero-name">{hero.class}</h4>
                          <div
                            className={`hero-status ${
                              hero.health <= 0
                                ? "status-fallen"
                                : "status-alive"
                            }`}
                          >
                            {hero.health <= 0 ? "Fallen" : "Survived"}
                          </div>
                        </div>

                        <div className="hero-details">
                          <p className="hero-spec">
                            <span className="spec-label">Specialization:</span>
                            <span className="spec-value">
                              {hero.specialization}
                            </span>
                          </p>

                          <div className="hero-health-bar">
                            <div className="health-bar-label">Health:</div>
                            <div className="health-bar-container">
                              <div
                                className="health-bar-fill"
                                style={{
                                  width: `${
                                    (hero.health / hero.maxHealth) * 100
                                  }%`,
                                }}
                              ></div>
                              <div className="health-bar-text">
                                {hero.health}/{hero.maxHealth}
                              </div>
                            </div>
                          </div>

                          {hero.weapon && (
                            <div
                              className={`hero-weapon ${hero.weapon.rarity}`}
                            >
                              <span className="weapon-label">Weapon:</span>
                              <span className="weapon-value">
                                {hero.weapon.name}
                                {hero.weapon.enchant && (
                                  <span className="weapon-enchant">
                                    ({hero.weapon.enchant})
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="hero-journey">
                          <div className="journey-title">
                            Adventure Summary:
                          </div>
                          <p className="journey-text">
                            {hero.health <= 0
                              ? `${hero.class} fell in battle but contributed valiantly to the party's journey.`
                              : `${hero.class} survived the treacherous climb to the top of the Astral Spire.`}
                          </p>
                          <div className="view-details">
                            Click for details...
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hero Detail Modal */}
            <AnimatePresence>
              {heroDetails && (
                <motion.div
                  className="hero-detail-modal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="modal-content"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                  >
                    <div className="modal-header">
                      <h3>
                        {heroDetails.class} - {heroDetails.specialization}
                      </h3>
                      <button className="close-modal" onClick={closeHeroDetail}>
                        ✕
                      </button>
                    </div>

                    <div className="hero-detail-content">
                      <div className="hero-stats-section">
                        <div className="stat-row">
                          <div className="stat-label">Final Health:</div>
                          <div className="stat-value">
                            {heroDetails.health}/{heroDetails.maxHealth}
                          </div>
                        </div>

                        <div className="stat-row">
                          <div className="stat-label">Battles Fought:</div>
                          <div className="stat-value">
                            {heroDetails.battlesFought || "N/A"}
                          </div>
                        </div>

                        <div className="stat-row">
                          <div className="stat-label">Damage Dealt:</div>
                          <div className="stat-value">
                            {heroDetails.damageDealt || "N/A"}
                          </div>
                        </div>

                        <div className="stat-row">
                          <div className="stat-label">Abilities Used:</div>
                          <div className="stat-value">
                            {heroDetails.abilitiesUsed || "N/A"}
                          </div>
                        </div>
                      </div>

                      {heroDetails.weapon && (
                        <div className="hero-weapon-section">
                          <h4>Weapon</h4>
                          <div
                            className={`weapon-card ${heroDetails.weapon.rarity}`}
                          >
                            <div className="weapon-name">
                              {heroDetails.weapon.name}
                            </div>
                            <div className="weapon-rarity">
                              {heroDetails.weapon.rarity}
                            </div>
                            {heroDetails.weapon.enchant && (
                              <div className="weapon-enchant">
                                Enchantment: {heroDetails.weapon.enchant}
                              </div>
                            )}
                            <div className="weapon-effect">
                              {heroDetails.weapon.effect ||
                                "No effect details available"}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="hero-narrative">
                        <h4>Adventure Narrative</h4>
                        <p>
                          {heroDetails.health <= 0
                            ? `${heroDetails.class} fought bravely through the Astral Spire, but ultimately fell in battle. Their sacrifice will be remembered by the party.`
                            : `${heroDetails.class} demonstrated remarkable skill and resilience throughout the journey. Through battles against formidable foes and the perils of the spire, they emerged victorious.`}
                        </p>
                        <p>
                          {heroDetails.specialization === "Shadowblade"
                            ? "Using the powers of shadow, they struck quickly and decisively against their enemies."
                            : heroDetails.specialization === "Runeblade"
                            ? "Their mastery of rune magic augmented their combat prowess to devastating effect."
                            : heroDetails.specialization === "Timebender"
                            ? "Manipulating the flow of time itself, they created opportunities where none existed."
                            : heroDetails.specialization === "Illusionist"
                            ? "Their illusions confused and misdirected enemies, turning the tide of battle."
                            : heroDetails.specialization === "Huntress"
                            ? "With unerring accuracy, they found the weaknesses in every foe."
                            : heroDetails.specialization === "Beastmaster"
                            ? "Their animal companions proved invaluable allies throughout the journey."
                            : heroDetails.specialization === "Sentinel"
                            ? "Standing stalwart against overwhelming odds, they protected the party from harm."
                            : heroDetails.specialization === "Warden"
                            ? "Their protective magic ensured the party's survival through many challenges."
                            : "Their unique abilities were instrumental to the party's progress."}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Achievements View */}
        {currentView === "achievements" && (
          <motion.div
            className="achievements-view"
            key="achievements"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence>
              {showAchievements && (
                <motion.div
                  className="achievements-list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3>Achievements</h3>
                  <div className="achievements-grid">
                    {Object.keys(ACHIEVEMENTS).map((achievementId, index) => {
                      const achievement = ACHIEVEMENTS[achievementId];
                      const isEarned =
                        earnedAchievements.includes(achievementId);

                      return (
                        <motion.div
                          key={achievementId}
                          className={`achievement-item ${
                            isEarned ? "earned" : "locked"
                          }`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          whileHover={isEarned ? { scale: 1.03 } : {}}
                          data-tooltip-id="achievement-tooltip"
                          data-tooltip-content={
                            isEarned
                              ? `Earned! ${achievement.description}`
                              : `Locked: ${achievement.description}`
                          }
                        >
                          <div className="achievement-icon">
                            {isEarned ? (
                              <div className="earned-icon">
                                {achievement.icon}
                              </div>
                            ) : (
                              <div className="locked-icon">🔒</div>
                            )}
                          </div>
                          <div className="achievement-details">
                            <h4 className="achievement-title">
                              {achievement.title}
                            </h4>
                            <p className="achievement-description">
                              {achievement.description}
                            </p>
                            {isEarned && (
                              <div className="achievement-points">
                                +{achievement.points} points
                              </div>
                            )}
                          </div>
                          {isEarned && (
                            <img
                              src={achievementBadgeImg}
                              alt="Achievement Badge"
                              className="achievement-badge"
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="achievement-summary">
                    <div className="summary-earned">
                      <span className="earned-label">Achievements Earned:</span>
                      <span className="earned-value">
                        {earnedAchievements.length}/
                        {Object.keys(ACHIEVEMENTS).length}
                      </span>
                    </div>
                    <div className="summary-points">
                      <span className="points-label">Total Points:</span>
                      <span className="points-value">
                        {earnedAchievements.reduce(
                          (total, id) => total + ACHIEVEMENTS[id].points,
                          0
                        )}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Tips View */}
        {currentView === "tips" && (
          <motion.div
            className="tips-view"
            key="tips"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="tips-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3>Gameplay Tips</h3>

              <div className="tips-section">
                <h4>Improve Your Next Run</h4>
                <ul className="tips-list">
                  {getGameplayTips().map((tip, index) => (
                    <motion.li
                      key={index}
                      className="tip-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.2 }}
                    >
                      <div className="tip-icon">💡</div>
                      <div className="tip-text">{tip}</div>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="strategy-section">
                <h4>Advanced Strategies</h4>
                <div className="strategy-cards">
                  <motion.div
                    className="strategy-card"
                    whileHover={{ scale: 1.03 }}
                  >
                    <div className="strategy-header">
                      <div className="strategy-icon">⚔️</div>
                      <h5>Combat Mastery</h5>
                    </div>
                    <p>
                      Match cards to trigger hero abilities and maximize damage
                      output. Save potent abilities for elite monsters and
                      bosses.
                    </p>
                  </motion.div>

                  <motion.div
                    className="strategy-card"
                    whileHover={{ scale: 1.03 }}
                  >
                    <div className="strategy-header">
                      <div className="strategy-icon">🛡️</div>
                      <h5>Party Balance</h5>
                    </div>
                    <p>
                      A balanced party with complementary abilities performs
                      better. Consider including a Guardian for protection or a
                      Manipulator for control.
                    </p>
                  </motion.div>

                  <motion.div
                    className="strategy-card"
                    whileHover={{ scale: 1.03 }}
                  >
                    <div className="strategy-header">
                      <div className="strategy-icon">🏪</div>
                      <h5>Resource Management</h5>
                    </div>
                    <p>
                      Prioritize gold for essential items like healing potions.
                      Save gems for enchanting powerful weapons rather than
                      common ones.
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="restart-options"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <motion.button
          className="restart-button"
          onClick={onRestart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="button-icon">🔄</span>
          Begin a New Adventure
        </motion.button>
      </motion.div>

      {/* Victory confetti effect */}
      {showConfetti && (
        <div className="confetti-container" id="confetti-container"></div>
      )}

      {/* Tooltips */}
      <Tooltip id="achievement-tooltip" />
    </div>
  );
};

export default GameOver;
