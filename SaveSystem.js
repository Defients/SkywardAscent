/**
 * SaveSystem.js - Handles game save/load functionality for Skyward Ascent
 * This utility manages saving and loading game state to/from localStorage
 */

// Save key constants
const SAVE_KEY = "skywardAscent_saveGame";
const SETTINGS_KEY = "skywardAscent_settings";
const ACHIEVEMENTS_KEY = "skywardAscent_achievements";

/**
 * Saves the current game state to localStorage
 * @param {Object} gameData - The current game state
 * @returns {boolean} - Whether the save was successful
 */
export const saveGame = (gameData) => {
  try {
    const saveData = {
      ...gameData,
      saveDate: new Date().toISOString(),
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    return true;
  } catch (error) {
    console.error("Failed to save game:", error);
    return false;
  }
};

/**
 * Loads a saved game from localStorage
 * @returns {Object|null} - The loaded game data or null if no save exists
 */
export const loadGame = () => {
  try {
    const savedGame = localStorage.getItem(SAVE_KEY);
    if (!savedGame) {
      return null;
    }

    return JSON.parse(savedGame);
  } catch (error) {
    console.error("Failed to load game:", error);
    return null;
  }
};

/**
 * Checks if a saved game exists
 * @returns {boolean} - Whether a saved game exists
 */
export const hasSavedGame = () => {
  return localStorage.getItem(SAVE_KEY) !== null;
};

/**
 * Deletes a saved game
 * @returns {boolean} - Whether the deletion was successful
 */
export const deleteSave = () => {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch (error) {
    console.error("Failed to delete save:", error);
    return false;
  }
};

/**
 * Saves user settings
 * @param {Object} settings - User settings
 * @returns {boolean} - Whether the save was successful
 */
export const saveSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error("Failed to save settings:", error);
    return false;
  }
};

/**
 * Loads user settings
 * @returns {Object} - The loaded settings or default settings if none exist
 */
export const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (!savedSettings) {
      return {
        soundEnabled: true,
        musicEnabled: true,
        animationsEnabled: true,
        tutorialShown: false,
      };
    }

    return JSON.parse(savedSettings);
  } catch (error) {
    console.error("Failed to load settings:", error);
    return {
      soundEnabled: true,
      musicEnabled: true,
      animationsEnabled: true,
      tutorialShown: false,
    };
  }
};

/**
 * Saves user achievements
 * @param {Object} achievements - User achievements
 * @returns {boolean} - Whether the save was successful
 */
export const saveAchievements = (achievements) => {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
    return true;
  } catch (error) {
    console.error("Failed to save achievements:", error);
    return false;
  }
};

/**
 * Loads user achievements
 * @returns {Object} - The loaded achievements or an empty object if none exist
 */
export const loadAchievements = () => {
  try {
    const savedAchievements = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (!savedAchievements) {
      return {};
    }

    return JSON.parse(savedAchievements);
  } catch (error) {
    console.error("Failed to load achievements:", error);
    return {};
  }
};

/**
 * Gets save metadata without loading the full save
 * @returns {Object|null} - Basic save info or null if no save exists
 */
export const getSaveInfo = () => {
  try {
    const savedGame = localStorage.getItem(SAVE_KEY);
    if (!savedGame) {
      return null;
    }

    const parsed = JSON.parse(savedGame);

    // Return only metadata to prevent loading large objects
    return {
      saveDate: parsed.saveDate,
      tier: parsed.currentTier,
      heroCount: parsed.heroes ? parsed.heroes.length : 0,
      gold: parsed.gold,
      hasInventory: parsed.inventory && parsed.inventory.length > 0,
    };
  } catch (error) {
    console.error("Failed to get save info:", error);
    return null;
  }
};

/**
 * Exports the current save as a JSON file
 * @param {Object} gameData - The current game state
 */
export const exportSave = (gameData) => {
  try {
    const saveData = {
      ...gameData,
      saveDate: new Date().toISOString(),
      exportVersion: "1.0",
    };

    const dataStr = JSON.stringify(saveData);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `skyward_ascent_save_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    return true;
  } catch (error) {
    console.error("Failed to export save:", error);
    return false;
  }
};

/**
 * Imports a save file
 * @param {File} file - The save file to import
 * @returns {Promise<Object|null>} - The imported game data or null if import failed
 */
export const importSave = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const saveData = JSON.parse(event.target.result);

        // Validate required fields
        if (!saveData.heroes || !saveData.currentTier) {
          reject(new Error("Invalid save file format"));
          return;
        }

        // Add current timestamp
        saveData.importDate = new Date().toISOString();

        // Save to localStorage
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));

        resolve(saveData);
      } catch (error) {
        console.error("Failed to parse save file:", error);
        reject(error);
      }
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      reject(error);
    };

    reader.readAsText(file);
  });
};

/**
 * Performs a backup check to ensure save data isn't corrupted
 * @returns {boolean} - Whether the save data is valid
 */
export const validateSaveData = () => {
  try {
    const savedGame = localStorage.getItem(SAVE_KEY);
    if (!savedGame) {
      return true; // No save exists, so it's valid
    }

    const parsed = JSON.parse(savedGame);

    // Check required fields
    if (!parsed.heroes || !Array.isArray(parsed.heroes)) {
      return false;
    }

    if (typeof parsed.currentTier !== "number") {
      return false;
    }

    if (typeof parsed.gold !== "number") {
      return false;
    }

    if (!parsed.inventory || !Array.isArray(parsed.inventory)) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Save validation failed:", error);
    return false;
  }
};

/**
 * Creates a backup of the current save
 */
export const createBackup = () => {
  try {
    const savedGame = localStorage.getItem(SAVE_KEY);
    if (!savedGame) {
      return false;
    }

    localStorage.setItem(`${SAVE_KEY}_backup`, savedGame);
    return true;
  } catch (error) {
    console.error("Failed to create backup:", error);
    return false;
  }
};

/**
 * Restores a save from backup
 * @returns {boolean} - Whether the restore was successful
 */
export const restoreFromBackup = () => {
  try {
    const backupSave = localStorage.getItem(`${SAVE_KEY}_backup`);
    if (!backupSave) {
      return false;
    }

    localStorage.setItem(SAVE_KEY, backupSave);
    return true;
  } catch (error) {
    console.error("Failed to restore from backup:", error);
    return false;
  }
};

export default {
  saveGame,
  loadGame,
  hasSavedGame,
  deleteSave,
  saveSettings,
  loadSettings,
  saveAchievements,
  loadAchievements,
  getSaveInfo,
  exportSave,
  importSave,
  validateSaveData,
  createBackup,
  restoreFromBackup,
};
