/**
 * GameEngine.js - Core game engine for Skyward Ascent
 *
 * This module serves as the central coordinator for the game,
 * handling initialization, state management, and communication
 * between components.
 */

import AssetManager from "./AssetManager";
import AudioManager from "./AudioManager";
import SaveSystem from "./SaveSystem";

// Event system for component communication
const eventListeners = {};

// Game state
let gameState = {
  initialized: false,
  loading: false,
  loadingProgress: 0,
  currentPhase: null,
  previousPhase: null,
  gameData: null,
  settings: null,
  debug: false,
};

/**
 * Initialize the game engine
 * @param {Object} options - Initialization options
 * @returns {Promise} - Promise that resolves when initialization is complete
 */
export const initGame = async (options = {}) => {
  // Prevent multiple initializations
  if (gameState.initialized || gameState.loading) {
    console.warn("Game engine already initialized or initializing");
    return;
  }

  gameState.loading = true;
  gameState.debug = options.debug || false;

  try {
    // Load settings first
    const settings = SaveSystem.loadSettings();
    gameState.settings = settings;

    // Initialize audio with loaded settings
    AudioManager.initAudio(settings);

    // Initialize default game data
    gameState.gameData = initializeGameData();

    // Check for saved game
    if (SaveSystem.hasSavedGame() && !options.skipLoadSave) {
      try {
        // Validate save data
        if (SaveSystem.validateSaveData()) {
          // Create backup of current save
          SaveSystem.createBackup();

          // Load saved game
          const savedGame = SaveSystem.loadGame();
          if (savedGame) {
            gameState.gameData = savedGame;
            if (gameState.debug) {
              console.log("Loaded saved game:", savedGame);
            }
          }
        } else {
          console.warn("Save data validation failed, using default game data");
        }
      } catch (error) {
        console.error("Error loading saved game:", error);
      }
    }

    // Preload essential assets based on game phase
    await preloadEssentialAssets((progress) => {
      gameState.loadingProgress = progress;
      emit("loading-progress", { progress });
    });

    // Mark as initialized
    gameState.initialized = true;
    gameState.loading = false;

    // Set initial game phase
    changeGamePhase(options.initialPhase || "menu");

    // Emit initialized event
    emit("game-initialized", { gameData: gameState.gameData });

    return gameState;
  } catch (error) {
    gameState.loading = false;
    console.error("Game initialization failed:", error);
    throw error;
  }
};

/**
 * Initialize default game data
 * @returns {Object} - Default game data
 */
const initializeGameData = () => {
  return {
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
    rollBuff: 0,
    gameCompleted: false,
  };
};

/**
 * Preload essential assets based on game phase
 * @param {Function} progressCallback - Callback for loading progress
 * @returns {Promise} - Promise that resolves when assets are loaded
 */
const preloadEssentialAssets = async (progressCallback) => {
  // Define essential asset categories by game phase
  const essentialAssets = {
    global: [
      "ui.logo",
      "ui.buttons",
      "ui.panels",
      "backgrounds.menu",
      "items.gold",
      "effects.stars",
    ],
    menu: ["backgrounds.menu"],
    setup: [
      "heroes.bladedancer.portrait",
      "heroes.manipulator.portrait",
      "heroes.tracker.portrait",
      "heroes.guardian.portrait",
      "cards.back",
    ],
    weaponChest: ["items.chest", "cards.back", "cards.suits"],
    spireClimb: ["rooms", "backgrounds.fog", "items.compass"],
    combat: [
      "heroes.bladedancer.icon",
      "heroes.manipulator.icon",
      "heroes.tracker.icon",
      "heroes.guardian.icon",
      "items.dice",
      "effects",
    ],
    merchant: ["characters.merchant", "items.shopCounter", "items.forge"],
  };

  // Combine global assets with menu assets for initial load
  const initialAssets = [...essentialAssets.global, ...essentialAssets.menu];

  // Preload initial assets
  return AssetManager.preloadImageSet(initialAssets, progressCallback);
};

/**
 * Change the current game phase
 * @param {string} newPhase - New game phase
 * @param {Object} options - Phase change options
 */
export const changeGamePhase = (newPhase, options = {}) => {
  // Skip if same phase and not forced
  if (newPhase === gameState.currentPhase && !options.force) {
    return;
  }

  const previousPhase = gameState.currentPhase;
  gameState.previousPhase = previousPhase;
  gameState.currentPhase = newPhase;

  // Preload assets for the new phase if needed
  if (options.preloadAssets !== false) {
    preloadPhaseAssets(newPhase);
  }

  // Play appropriate music for the phase
  AudioManager.setMusicForGameState(newPhase, gameState.gameData);

  // Play transition sound if enabled
  if (gameState.settings.soundEnabled && options.playTransition !== false) {
    AudioManager.playSound("transition");
  }

  // Emit phase change event
  emit("phase-change", {
    previousPhase,
    newPhase,
    gameData: gameState.gameData,
  });

  if (gameState.debug) {
    console.log(`Game phase changed: ${previousPhase} -> ${newPhase}`);
  }
};

/**
 * Preload assets for a specific game phase
 * @param {string} phase - Game phase to preload assets for
 */
const preloadPhaseAssets = (phase) => {
  // Define asset categories to preload by phase
  const assetsByPhase = {
    menu: ["backgrounds.menu", "ui.logo", "ui.buttons"],
    setup: [
      "heroes.bladedancer",
      "heroes.manipulator",
      "heroes.tracker",
      "heroes.guardian",
      "cards.back",
    ],
    adventureSetup: [
      "heroes.bladedancer.icon",
      "heroes.manipulator.icon",
      "heroes.tracker.icon",
      "heroes.guardian.icon",
      "items.gold",
    ],
    weaponChest: ["items.chest", "cards.back", "cards.suits", "effects.stars"],
    spireClimb: ["rooms", "backgrounds.fog", "items.compass"],
    combat: ["characters.monsters", "items.dice", "effects", "cards.back"],
    merchant: [
      "characters.merchant",
      "items.shopCounter",
      "items.forge",
      "items.gold",
    ],
    gameOver: ["backgrounds.stars", "effects.stars"],
  };

  // Get asset categories for the phase
  const categories = assetsByPhase[phase];
  if (!categories) return;

  // Preload the assets in the background
  AssetManager.preloadImageSet(categories, (progress) => {
    emit("phase-assets-progress", { phase, progress });
  })
    .then(() => {
      emit("phase-assets-loaded", { phase });
    })
    .catch((error) => {
      console.warn(`Failed to preload assets for phase ${phase}:`, error);
    });
};

/**
 * Update game data and propagate changes
 * @param {Object} updates - Game data updates
 * @param {Object} options - Update options
 */
export const updateGameData = (updates, options = {}) => {
  // Merge updates with current game data
  gameState.gameData = {
    ...gameState.gameData,
    ...updates,
  };

  // Save game if requested
  if (options.save) {
    saveGame();
  }

  // Emit update event
  emit("game-data-updated", {
    gameData: gameState.gameData,
    updates,
    source: options.source || "manual",
  });

  if (gameState.debug) {
    console.log("Game data updated:", updates);
  }
};

/**
 * Save the current game state
 * @param {Object} options - Save options
 * @returns {boolean} - Whether the save was successful
 */
export const saveGame = (options = {}) => {
  const result = SaveSystem.saveGame(gameState.gameData);

  if (result) {
    // Play save sound if enabled
    if (gameState.settings.soundEnabled && options.playSound !== false) {
      AudioManager.playSound("notification");
    }

    // Emit save event
    emit("game-saved", { gameData: gameState.gameData });
  } else {
    // Emit save failed event
    emit("game-save-failed");
  }

  return result;
};

/**
 * Update game settings
 * @param {Object} newSettings - New settings
 */
export const updateSettings = (newSettings) => {
  // Merge new settings with current settings
  gameState.settings = {
    ...gameState.settings,
    ...newSettings,
  };

  // Save settings
  SaveSystem.saveSettings(gameState.settings);

  // Update audio settings
  AudioManager.updateAudioSettings(gameState.settings);

  // Emit settings updated event
  emit("settings-updated", { settings: gameState.settings });

  if (gameState.debug) {
    console.log("Settings updated:", newSettings);
  }
};

/**
 * Reset the game to a new state
 * @param {Object} options - Reset options
 */
export const resetGame = (options = {}) => {
  // Initialize new game data
  gameState.gameData = initializeGameData();

  // Preserve settings
  gameState.gameData.settings = gameState.settings;

  // Delete saved game if requested
  if (options.deleteSave) {
    SaveSystem.deleteSave();
  }

  // Change to initial phase
  changeGamePhase(options.initialPhase || "menu");

  // Emit reset event
  emit("game-reset");

  if (gameState.debug) {
    console.log("Game reset");
  }
};

/**
 * Check achievement conditions and update if met
 * @param {string} achievementId - Achievement ID to check
 * @returns {boolean} - Whether the achievement was earned
 */
export const checkAchievement = (achievementId) => {
  // Load current achievements
  const achievements = SaveSystem.loadAchievements();

  // Skip if already earned
  if (achievements[achievementId]) {
    return false;
  }

  // Define achievement conditions
  const conditions = {
    first_victory: () =>
      gameState.gameData.gameCompleted &&
      gameState.gameData.heroes.some((h) => h.health > 0),

    flawless_victory: () =>
      gameState.gameData.gameCompleted &&
      gameState.gameData.heroes.every((h) => h.health > 0) &&
      gameState.gameData.gameStats.heroDeaths === 0,

    legendary_collector: () =>
      gameState.gameData.heroes.some(
        (h) => h.weapon && h.weapon.rarity === "legendary"
      ),

    wealthy_adventurer: () => gameState.gameData.gold >= 300,

    monster_slayer: () => gameState.gameData.gameStats.monstersDefeated >= 20,

    dragon_tamer: () => false, // Need to implement tracking for this

    cosmic_master: () =>
      gameState.gameData.gameCompleted &&
      gameState.gameData.heroes.every((h) => h.health > 0),
  };

  // Check condition
  const conditionFn = conditions[achievementId];
  if (!conditionFn) return false;

  const earned = conditionFn();
  if (earned) {
    // Update achievement
    achievements[achievementId] = {
      earned: true,
      date: new Date().toISOString(),
    };

    // Save achievements
    SaveSystem.saveAchievements(achievements);

    // Emit achievement earned event
    emit("achievement-earned", { achievementId });

    if (gameState.debug) {
      console.log(`Achievement earned: ${achievementId}`);
    }
  }

  return earned;
};

/**
 * Event system methods
 */

/**
 * Register an event listener
 * @param {string} event - Event name
 * @param {Function} callback - Event callback
 * @param {Object} options - Event options
 * @returns {Function} - Unsubscribe function
 */
export const on = (event, callback, options = {}) => {
  if (!eventListeners[event]) {
    eventListeners[event] = [];
  }

  const listener = { callback, options };
  eventListeners[event].push(listener);

  // Return unsubscribe function
  return () => {
    eventListeners[event] = eventListeners[event].filter((l) => l !== listener);
  };
};

/**
 * Remove an event listener
 * @param {string} event - Event name
 * @param {Function} callback - Event callback
 */
export const off = (event, callback) => {
  if (!eventListeners[event]) return;

  eventListeners[event] = eventListeners[event].filter(
    (l) => l.callback !== callback
  );
};

/**
 * Emit an event
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const emit = (event, data = {}) => {
  if (!eventListeners[event]) return;

  // Add timestamp to event data
  const eventData = {
    ...data,
    timestamp: Date.now(),
  };

  // Call listeners
  eventListeners[event].forEach((listener) => {
    try {
      listener.callback(eventData);
    } catch (error) {
      console.error(`Error in ${event} event listener:`, error);
    }
  });
};

/**
 * Get current game state
 * @returns {Object} - Current game state
 */
export const getGameState = () => {
  return { ...gameState };
};

/**
 * Get current game data
 * @returns {Object} - Current game data
 */
export const getGameData = () => {
  return { ...gameState.gameData };
};

export default {
  initGame,
  changeGamePhase,
  updateGameData,
  saveGame,
  updateSettings,
  resetGame,
  checkAchievement,
  on,
  off,
  emit,
  getGameState,
  getGameData,
  AudioManager,
  AssetManager,
  SaveSystem,
};
