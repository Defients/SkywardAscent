import React, { useState, useEffect } from "react";
import { ACHIEVEMENTS } from "../contexts/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import "../styles/GameOver.css";

// Import background images
import victoryBgImg from "../assets/images/backgrounds/victory_bg.png";
import defeatBgImg from "../assets/images/backgrounds/defeat_bg.png";
import achievementBadgeImg from "../assets/images/items/achievement_badge.png";

const GameOver = ({ gameData, onRestart, playSound }) => {
  const [currentView, setCurrentView] = useState("summary");
  const [showStats, setShowStats] = useState(false);
  const [showHeroes, setShowHeroes] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [earnedAchievements, setEarnedAchievements] = useState([]);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

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
    // This would need additional tracking in the gameData

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
          Summary
        </button>
        <button
          className={`tab ${currentView === "heroes" ? "active" : ""}`}
          onClick={() => changeTab("heroes")}
        >
          Heroes
        </button>
        <button
          className={`tab ${currentView === "achievements" ? "active" : ""}`}
          onClick={() => changeTab("achievements")}
        >
          Achievements
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
                        </div>
                      </motion.div>
                    ))}
                  </div>
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
          Begin a New Adventure
        </motion.button>
      </motion.div>

      {/* Victory confetti effect */}
      {showConfetti && (
        <div className="confetti-container" id="confetti-container"></div>
      )}
    </div>
  );
};

export default GameOver;
