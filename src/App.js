import React, { useState, useEffect, useCallback } from "react";
import { GameProvider } from "./contexts/GameContext";
import SetupPhase from "./SetupPhase";
import AdventureSetup from "./AdventureSetup";
import WeaponChest from "./WeaponChest";
import SpireClimb from "./SpireClimb";
import Combat from "./Combat";
import Merchant from "./Merchant";
import GameOver from "./GameOver";
import GameMenu from "./GameMenu";
import LoadingScreen from "./LoadingScreen";
import Tutorial from "./Tutorial";
import { AnimatePresence, motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/main.css";

// Sound effects
import useSound from "use-sound";

// Define constant for game phases
const PHASES = {
  MENU: "menu",
  SETUP: "setup",
  ADVENTURE_SETUP: "adventureSetup",
  WEAPON_CHEST: "weaponChest",
  SPIRE_CLIMB: "spireClimb",
  COMBAT: "combat",
  MERCHANT: "merchant",
  GAME_OVER: "gameOver",
  TUTORIAL: "tutorial",
  LOADING: "loading",
};

const App = () => {
  // Sound effects
  const [playClick] = useSound(
    process.env.PUBLIC_URL + "/assets/sounds/ui/button_click.mp3",
    { volume: 0.5 }
  );
  const [playTransition] = useSound(
    process.env.PUBLIC_URL + "/assets/sounds/ui/transition.mp3",
    { volume: 0.4 }
  );
  const [playVictory] = useSound(
    process.env.PUBLIC_URL + "/assets/sounds/results/victory.mp3",
    { volume: 0.6 }
  );
  const [playDefeat] = useSound(
    process.env.PUBLIC_URL + "/assets/sounds/results/defeat.mp3",
    { volume: 0.6 }
  );

  // Game state
  const [gamePhase, setGamePhase] = useState(PHASES.MENU);
  const [previousPhase, setPreviousPhase] = useState(null);
  const [gameData, setGameData] = useState({
    heroes: [],
    currentTier: 1,
    currentRoom: null,
    gold: 0,
    inventory: [],
    deck: {
      royaltyPile: [],
      peonPile: [],
      environmentPile: [],
    },
    monsters: [],
    currentMonster: null,
    gameStats: {
      monstersDefeated: 0,
      goldEarned: 0,
      roomsVisited: 0,
      itemsUsed: 0,
      combatRounds: 0,
      heroDeaths: 0,
    },
    settings: {
      soundEnabled: true,
      musicEnabled: true,
      animationsEnabled: true,
      tutorialShown: false,
    },
    saveDate: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Handle phase transitions with loading screen
  const changePhase = useCallback(
    (newPhase, withLoading = true) => {
      if (gameData.settings.soundEnabled) {
        playTransition();
      }

      setPreviousPhase(gamePhase);

      if (withLoading) {
        setIsLoading(true);
        setGamePhase(PHASES.LOADING);

        setTimeout(() => {
          setGamePhase(newPhase);
          setIsLoading(false);
        }, 800);
      } else {
        setGamePhase(newPhase);
      }
    },
    [gamePhase, gameData.settings.soundEnabled, playTransition]
  );

  // Update game statistics
  const updateGameStats = useCallback((stats) => {
    setGameData((prevData) => ({
      ...prevData,
      gameStats: {
        ...prevData.gameStats,
        ...stats,
      },
    }));
  }, []);

  // Show notification toast
  const showNotification = useCallback((message, type = "info") => {
    toast[type](message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }, []);

  // Handle game start from menu
  const handleStartGame = useCallback(
    (newGame = true) => {
      if (newGame) {
        // Reset game state for a new game
        setGameData((prevData) => ({
          ...prevData,
          heroes: [],
          currentTier: 1,
          currentRoom: null,
          gold: 0,
          inventory: [],
          deck: {
            royaltyPile: [],
            peonPile: [],
            environmentPile: [],
          },
          monsters: [],
          currentMonster: null,
          gameStats: {
            monstersDefeated: 0,
            goldEarned: 0,
            roomsVisited: 0,
            itemsUsed: 0,
            combatRounds: 0,
            heroDeaths: 0,
          },
          saveDate: new Date().toISOString(),
        }));
      }

      // Check if tutorial should be shown
      if (!gameData.settings.tutorialShown && newGame) {
        changePhase(PHASES.TUTORIAL, false);
      } else {
        changePhase(PHASES.SETUP);
      }
    },
    [changePhase, gameData.settings.tutorialShown]
  );

  // Handle tutorial completion
  const handleTutorialComplete = useCallback(() => {
    setGameData((prevData) => ({
      ...prevData,
      settings: {
        ...prevData.settings,
        tutorialShown: true,
      },
    }));

    changePhase(PHASES.SETUP);
  }, [changePhase]);

  // Save game to local storage
  const saveGame = useCallback(() => {
    try {
      const saveData = {
        ...gameData,
        saveDate: new Date().toISOString(),
      };
      localStorage.setItem("skywardAscent_saveGame", JSON.stringify(saveData));
      showNotification("Game saved successfully!", "success");
    } catch (error) {
      console.error("Failed to save game:", error);
      showNotification("Failed to save game.", "error");
    }
  }, [gameData, showNotification]);

  // Load game from local storage
  const loadGame = useCallback(() => {
    try {
      const savedGame = localStorage.getItem("skywardAscent_saveGame");
      if (savedGame) {
        setGameData(JSON.parse(savedGame));
        changePhase(PHASES.SPIRE_CLIMB);
        showNotification("Game loaded successfully!", "success");
      } else {
        showNotification("No saved game found.", "warning");
      }
    } catch (error) {
      console.error("Failed to load game:", error);
      showNotification("Failed to load game.", "error");
    }
  }, [changePhase, showNotification]);

  // Update settings
  const updateSettings = useCallback(
    (newSettings) => {
      setGameData((prevData) => ({
        ...prevData,
        settings: {
          ...prevData.settings,
          ...newSettings,
        },
      }));

      showNotification("Settings updated!", "success");
    },
    [showNotification]
  );

  // Handle victory and defeat sounds
  useEffect(() => {
    if (gamePhase === PHASES.GAME_OVER && previousPhase === PHASES.COMBAT) {
      if (gameData.settings.soundEnabled) {
        if (gameData.heroes.some((hero) => hero.health > 0)) {
          // Victory sound
          playVictory();
        } else {
          // Defeat sound
          playDefeat();
        }
      }
    }
  }, [
    gamePhase,
    previousPhase,
    gameData.heroes,
    gameData.settings.soundEnabled,
    playVictory,
    playDefeat,
  ]);

  // Render different components based on game phase
  const renderGamePhase = () => {
    switch (gamePhase) {
      case PHASES.MENU:
        return (
          <GameMenu
            onStartNewGame={() => handleStartGame(true)}
            onLoadGame={loadGame}
            onShowTutorial={() => changePhase(PHASES.TUTORIAL, false)}
            onUpdateSettings={updateSettings}
            settings={gameData.settings}
            hasSavedGame={Boolean(
              localStorage.getItem("skywardAscent_saveGame")
            )}
          />
        );
      case PHASES.LOADING:
        return <LoadingScreen previousPhase={previousPhase} />;
      case PHASES.TUTORIAL:
        return (
          <Tutorial
            onComplete={handleTutorialComplete}
            onSkip={() => changePhase(PHASES.SETUP)}
          />
        );
      case PHASES.SETUP:
        return (
          <SetupPhase
            onComplete={(data) => {
              setGameData((prevData) => ({ ...prevData, ...data }));
              changePhase(PHASES.ADVENTURE_SETUP);
              updateGameStats({ heroesRecruited: data.heroes.length });
            }}
            playSound={playClick}
          />
        );
      case PHASES.ADVENTURE_SETUP:
        return (
          <AdventureSetup
            gameData={gameData}
            onComplete={(data) => {
              setGameData((prevData) => ({ ...prevData, ...data }));
              changePhase(PHASES.WEAPON_CHEST);
              updateGameStats({ goldEarned: data.gold });
            }}
            playSound={playClick}
          />
        );
      case PHASES.WEAPON_CHEST:
        return (
          <WeaponChest
            gameData={gameData}
            onComplete={(data) => {
              setGameData((prevData) => ({ ...prevData, ...data }));
              changePhase(PHASES.SPIRE_CLIMB);
              if (data.gold > gameData.gold) {
                updateGameStats({ goldEarned: data.gold - gameData.gold });
              }
            }}
            playSound={playClick}
          />
        );
      case PHASES.SPIRE_CLIMB:
        return (
          <SpireClimb
            gameData={gameData}
            onEnterRoom={(roomType) => {
              setGameData((prevData) => ({
                ...prevData,
                currentRoom: roomType,
                gameStats: {
                  ...prevData.gameStats,
                  roomsVisited: prevData.gameStats.roomsVisited + 1,
                },
              }));

              if (
                roomType === "club" ||
                roomType === "spade" ||
                roomType === "spade+"
              ) {
                changePhase(PHASES.COMBAT);
              } else if (roomType === "diamond") {
                changePhase(PHASES.MERCHANT);
              } else {
                // Handle heart room directly in SpireClimb component
              }
            }}
            onComplete={(data) => {
              setGameData((prevData) => ({ ...prevData, ...data }));
              // If game completed
              if (data.gameCompleted) {
                changePhase(PHASES.GAME_OVER);
              }
            }}
            onSaveGame={saveGame}
            playSound={playClick}
          />
        );
      case PHASES.COMBAT:
        return (
          <Combat
            gameData={gameData}
            onComplete={(data) => {
              setGameData((prevData) => ({
                ...prevData,
                ...data,
                gameStats: {
                  ...prevData.gameStats,
                  monstersDefeated: prevData.gameStats.monstersDefeated + 1,
                  goldEarned:
                    prevData.gameStats.goldEarned +
                    (data.gold - prevData.gold || 0),
                },
              }));
              changePhase(PHASES.SPIRE_CLIMB);
            }}
            onDefeat={() => {
              changePhase(PHASES.GAME_OVER);
            }}
            updateStats={(stats) => updateGameStats(stats)}
            playSound={playClick}
          />
        );
      case PHASES.MERCHANT:
        return (
          <Merchant
            gameData={gameData}
            onComplete={(data) => {
              setGameData((prevData) => ({ ...prevData, ...data }));
              changePhase(PHASES.SPIRE_CLIMB);
            }}
            playSound={playClick}
          />
        );
      case PHASES.GAME_OVER:
        return (
          <GameOver
            gameData={gameData}
            onRestart={() => {
              changePhase(PHASES.MENU, false);
            }}
            playSound={playClick}
          />
        );
      default:
        return <div>Unknown game phase!</div>;
    }
  };

  return (
    <GameProvider
      value={{
        gameData,
        setGameData,
        gamePhase,
        changePhase,
        PHASES,
        updateGameStats,
        showNotification,
        saveGame,
      }}
    >
      <div className="skyward-ascent">
        <header className="game-header">
          <h1>
            <span className="title-sky">Sky</span>
            <span className="title-ward">ward</span>
            <span className="title-ascent">Ascent</span>
          </h1>
          {gamePhase !== PHASES.MENU &&
            gamePhase !== PHASES.SETUP &&
            gamePhase !== PHASES.LOADING && (
              <div className="game-stats">
                <div className="gold">
                  <span className="gold-icon">💰</span>
                  <span className="gold-amount">{gameData.gold}</span>
                </div>
                <div className="tier">
                  <span className="tier-icon">🏔️</span>
                  <span className="tier-level">
                    Tier {gameData.currentTier}
                  </span>
                </div>
                {gamePhase !== PHASES.GAME_OVER && (
                  <button
                    className="menu-button"
                    onClick={() => changePhase(PHASES.MENU, false)}
                    title="Return to Menu"
                  >
                    ≡
                  </button>
                )}
              </div>
            )}
        </header>

        <AnimatePresence mode="wait">
          <motion.main
            key={gamePhase}
            className="game-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderGamePhase()}
          </motion.main>
        </AnimatePresence>

        <footer className="game-footer">
          <p>
            Skyward Ascent • Digital Edition • Based on the game by Deffy Pyah
            Urz
          </p>
        </footer>

        <ToastContainer theme="dark" />
      </div>
    </GameProvider>
  );
};

export default App;
