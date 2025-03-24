/**
 * AudioManager.js - Handles game audio functionality for Skyward Ascent
 * This utility manages sound effects and music throughout the game
 */

// Sound effect paths
const SOUNDS = {
  // UI sounds
  buttonClick: "/assets/sounds/ui/button_click.mp3",
  cardFlip: "/assets/sounds/ui/card_flip.mp3",
  menuOpen: "/assets/sounds/ui/menu_open.mp3",
  notification: "/assets/sounds/ui/notification.mp3",
  transition: "/assets/sounds/ui/transition.mp3",

  // Combat sounds
  attack: "/assets/sounds/combat/attack.mp3",
  criticalHit: "/assets/sounds/combat/critical_hit.mp3",
  dodge: "/assets/sounds/combat/dodge.mp3",
  heal: "/assets/sounds/combat/heal.mp3",
  magicAttack: "/assets/sounds/combat/magic_attack.mp3",
  monsterHit: "/assets/sounds/combat/monster_hit.mp3",
  diceRoll: "/assets/sounds/combat/dice_roll.mp3",
  heroHit: "/assets/sounds/combat/hero_hit.mp3",

  // Room sounds
  treasureOpen: "/assets/sounds/rooms/treasure_open.mp3",
  merchantBell: "/assets/sounds/rooms/merchant_bell.mp3",
  heartRoomChime: "/assets/sounds/rooms/heart_room_chime.mp3",
  doorOpen: "/assets/sounds/rooms/door_open.mp3",

  // Result sounds
  victory: "/assets/sounds/results/victory.mp3",
  defeat: "/assets/sounds/results/defeat.mp3",
  levelUp: "/assets/sounds/results/level_up.mp3",
  getItem: "/assets/sounds/results/get_item.mp3",
  goldCoins: "/assets/sounds/results/gold_coins.mp3",
};

// Music track paths
const MUSIC = {
  title: "/assets/music/title_theme.mp3",
  tier1: "/assets/music/tier1_theme.mp3",
  tier2: "/assets/music/tier2_theme.mp3",
  tier3: "/assets/music/tier3_theme.mp3",
  combat: "/assets/music/combat_theme.mp3",
  boss: "/assets/music/boss_theme.mp3",
  merchant: "/assets/music/merchant_theme.mp3",
  victory: "/assets/music/victory_theme.mp3",
  defeat: "/assets/music/defeat_theme.mp3",
};

// Audio cache for preloaded sounds
const audioCache = {};

// Current music track
let currentMusic = null;
let currentMusicName = "";

// Settings
let soundEnabled = true;
let musicEnabled = true;
let soundVolume = 0.7;
let musicVolume = 0.5;

/**
 * Initialize the audio system
 * @param {Object} settings - Audio settings
 */
export const initAudio = (settings = {}) => {
  soundEnabled =
    settings.soundEnabled !== undefined ? settings.soundEnabled : true;
  musicEnabled =
    settings.musicEnabled !== undefined ? settings.musicEnabled : true;
  soundVolume = settings.soundVolume || 0.7;
  musicVolume = settings.musicVolume || 0.5;

  // Preload important sound effects
  preloadSounds([
    SOUNDS.buttonClick,
    SOUNDS.transition,
    SOUNDS.attack,
    SOUNDS.diceRoll,
    SOUNDS.cardFlip,
  ]);
};

/**
 * Preload sound effects to reduce delay when playing
 * @param {Array} soundPaths - Array of sound file paths to preload
 */
export const preloadSounds = (soundPaths) => {
  if (!soundEnabled) return;

  soundPaths.forEach((path) => {
    if (!audioCache[path]) {
      const audio = new Audio(path);
      audio.load();
      audioCache[path] = audio;
    }
  });
};

/**
 * Play a sound effect
 * @param {string} soundName - Key of the sound to play
 * @param {Object} options - Options like volume and playback rate
 * @returns {HTMLAudioElement|null} - The audio element or null if sound is disabled
 */
export const playSound = (soundName, options = {}) => {
  if (!soundEnabled || !SOUNDS[soundName]) return null;

  const path = SOUNDS[soundName];
  let audio;

  // Use cached audio if available, otherwise create new
  if (audioCache[path]) {
    audio = audioCache[path].cloneNode();
  } else {
    audio = new Audio(path);
    audioCache[path] = audio;
  }

  // Apply options
  audio.volume = options.volume !== undefined ? options.volume : soundVolume;
  if (options.rate) audio.playbackRate = options.rate;
  if (options.loop) audio.loop = options.loop;

  // Play the sound
  audio.play().catch((error) => {
    console.warn(`Failed to play sound ${soundName}:`, error);
  });

  return audio;
};

/**
 * Play music track
 * @param {string} trackName - Key of the music track to play
 * @param {Object} options - Options like volume and loop
 */
export const playMusic = (trackName, options = {}) => {
  if (!musicEnabled || !MUSIC[trackName]) return;

  // If same track is already playing, don't restart
  if (currentMusicName === trackName && currentMusic && !currentMusic.paused) {
    return;
  }

  // Stop current music if playing
  if (currentMusic) {
    stopMusic();
  }

  // Start new music
  const path = MUSIC[trackName];
  currentMusic = new Audio(path);
  currentMusicName = trackName;

  currentMusic.volume =
    options.volume !== undefined ? options.volume : musicVolume;
  currentMusic.loop = options.loop !== undefined ? options.loop : true;

  // Handle track ending
  currentMusic.addEventListener("ended", () => {
    if (!currentMusic.loop) {
      currentMusic = null;
      currentMusicName = "";
    }
  });

  // Fade in if requested
  if (options.fadeIn) {
    const targetVolume = currentMusic.volume;
    currentMusic.volume = 0;

    const fadeStep = () => {
      if (currentMusic) {
        if (currentMusic.volume < targetVolume) {
          currentMusic.volume = Math.min(
            currentMusic.volume + 0.02,
            targetVolume
          );
          setTimeout(fadeStep, 50);
        }
      }
    };

    currentMusic
      .play()
      .then(fadeStep)
      .catch((error) => {
        console.warn(`Failed to play music ${trackName}:`, error);
      });
  } else {
    currentMusic.play().catch((error) => {
      console.warn(`Failed to play music ${trackName}:`, error);
    });
  }
};

/**
 * Stop the currently playing music
 * @param {Object} options - Options like fadeOut
 */
export const stopMusic = (options = {}) => {
  if (!currentMusic) return;

  if (options.fadeOut) {
    // Fade out gradually
    const fadeStep = () => {
      if (currentMusic) {
        if (currentMusic.volume > 0.02) {
          currentMusic.volume -= 0.02;
          setTimeout(fadeStep, 50);
        } else {
          currentMusic.pause();
          currentMusic = null;
          currentMusicName = "";
        }
      }
    };

    fadeStep();
  } else {
    // Stop immediately
    currentMusic.pause();
    currentMusic = null;
    currentMusicName = "";
  }
};

/**
 * Pause the currently playing music
 */
export const pauseMusic = () => {
  if (currentMusic) {
    currentMusic.pause();
  }
};

/**
 * Resume the paused music
 */
export const resumeMusic = () => {
  if (currentMusic && musicEnabled) {
    currentMusic.play().catch((error) => {
      console.warn(`Failed to resume music:`, error);
    });
  }
};

/**
 * Update music/sound settings
 * @param {Object} settings - New audio settings
 */
export const updateAudioSettings = (settings = {}) => {
  const prevSoundEnabled = soundEnabled;
  const prevMusicEnabled = musicEnabled;

  if (settings.soundEnabled !== undefined) {
    soundEnabled = settings.soundEnabled;
  }

  if (settings.musicEnabled !== undefined) {
    musicEnabled = settings.musicEnabled;
  }

  if (settings.soundVolume !== undefined) {
    soundVolume = settings.soundVolume;
  }

  if (settings.musicVolume !== undefined && currentMusic) {
    musicVolume = settings.musicVolume;
    currentMusic.volume = musicVolume;
  }

  // Handle music toggle
  if (prevMusicEnabled && !musicEnabled && currentMusic) {
    stopMusic();
  } else if (!prevMusicEnabled && musicEnabled && currentMusicName) {
    playMusic(currentMusicName);
  }
};

/**
 * Play appropriate music for the current game state
 * @param {string} gamePhase - Current game phase
 * @param {Object} gameData - Current game data
 */
export const setMusicForGameState = (gamePhase, gameData = {}) => {
  if (!musicEnabled) return;

  switch (gamePhase) {
    case "menu":
      playMusic("title", { fadeIn: true });
      break;
    case "spireClimb":
      const tierMusic = `tier${gameData.currentTier || 1}`;
      playMusic(tierMusic, { fadeIn: true });
      break;
    case "combat":
      // Check if fighting a boss
      const isBoss =
        gameData.currentRoom === "spade+" ||
        gameData.currentRoom === "final_boss";
      playMusic(isBoss ? "boss" : "combat", { fadeIn: true });
      break;
    case "merchant":
      playMusic("merchant", { fadeIn: true });
      break;
    case "gameOver":
      // Check if victory or defeat
      const isVictory =
        gameData.gameCompleted && !gameData.heroes.every((h) => h.health <= 0);
      playMusic(isVictory ? "victory" : "defeat", {
        loop: false,
        fadeIn: true,
      });
      break;
    default:
      // Keep current music for other phases
      break;
  }
};

/**
 * Play a sequence of sounds with timing
 * @param {Array} sequence - Array of {sound, delay} objects
 */
export const playSoundSequence = (sequence) => {
  if (!soundEnabled || !sequence.length) return;

  let currentIndex = 0;

  const playNext = () => {
    if (currentIndex >= sequence.length) return;

    const { sound, delay, options } = sequence[currentIndex];
    playSound(sound, options);

    currentIndex++;
    if (currentIndex < sequence.length) {
      setTimeout(playNext, delay);
    }
  };

  playNext();
};

/**
 * Get information about current audio state
 * @returns {Object} - Current audio state information
 */
export const getAudioState = () => {
  return {
    soundEnabled,
    musicEnabled,
    soundVolume,
    musicVolume,
    currentTrack: currentMusicName,
    isPlaying: currentMusic && !currentMusic.paused,
  };
};

export default {
  initAudio,
  playSound,
  playMusic,
  stopMusic,
  pauseMusic,
  resumeMusic,
  updateAudioSettings,
  setMusicForGameState,
  playSoundSequence,
  getAudioState,
  SOUNDS,
  MUSIC,
};
