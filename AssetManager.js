/**
 * AssetManager.js - Handles game asset loading and management for Skyward Ascent
 * This utility manages loading and caching of images and other assets
 */

// Image paths organized by category
const IMAGES = {
  // Hero class images
  heroes: {
    bladedancer: {
      portrait: "/assets/images/heroes/bladedancer.png",
      card: "/assets/images/heroes/bladedancer_card.png",
      shadow: "/assets/images/heroes/shadowblade.png",
      rune: "/assets/images/heroes/runeblade.png",
      icon: "/assets/images/heroes/bladedancer_icon.png",
    },
    manipulator: {
      portrait: "/assets/images/heroes/manipulator.png",
      card: "/assets/images/heroes/manipulator_card.png",
      time: "/assets/images/heroes/timebender.png",
      illusion: "/assets/images/heroes/illusionist.png",
      icon: "/assets/images/heroes/manipulator_icon.png",
    },
    tracker: {
      portrait: "/assets/images/heroes/tracker.png",
      card: "/assets/images/heroes/tracker_card.png",
      hunt: "/assets/images/heroes/huntress.png",
      beast: "/assets/images/heroes/beastmaster.png",
      icon: "/assets/images/heroes/tracker_icon.png",
    },
    guardian: {
      portrait: "/assets/images/heroes/guardian.png",
      card: "/assets/images/heroes/guardian_card.png",
      sentinel: "/assets/images/heroes/sentinel.png",
      warden: "/assets/images/heroes/warden.png",
      icon: "/assets/images/heroes/guardian_icon.png",
    },
  },

  // Card images
  cards: {
    back: "/assets/images/cards/card_back.png",
    joker: "/assets/images/cards/joker.png",
    suits: {
      club: "/assets/images/cards/club.png",
      diamond: "/assets/images/cards/diamond.png",
      heart: "/assets/images/cards/heart.png",
      spade: "/assets/images/cards/spade.png",
    },
    ranks: {
      ace: "/assets/images/cards/ace.png",
      king: "/assets/images/cards/king.png",
      queen: "/assets/images/cards/queen.png",
      jack: "/assets/images/cards/jack.png",
    },
  },

  // Room backgrounds
  rooms: {
    club: "/assets/images/rooms/club_room.png",
    diamond: "/assets/images/rooms/diamond_room.png",
    heart: "/assets/images/rooms/heart_room.png",
    spade: "/assets/images/rooms/spade_room.png",
    spadeElite: "/assets/images/rooms/spade_elite_room.png",
    finalBoss: "/assets/images/rooms/final_boss_room.png",
  },

  // Background images
  backgrounds: {
    menu: "/assets/images/backgrounds/menu_background.png",
    tier1: "/assets/images/backgrounds/tier1_background.png",
    tier2: "/assets/images/backgrounds/tier2_background.png",
    tier3: "/assets/images/backgrounds/tier3_background.png",
    stars: "/assets/images/backgrounds/stars.png",
    fog: "/assets/images/backgrounds/fog.png",
  },

  // Item images
  items: {
    chest: {
      closed: "/assets/images/items/chest_closed.png",
      open: "/assets/images/items/chest_open.png",
    },
    potions: {
      minor: "/assets/images/items/minor_potion.png",
      major: "/assets/images/items/major_potion.png",
    },
    scrolls: {
      fiery: "/assets/images/items/fiery_scroll.png",
      toxic: "/assets/images/items/toxic_scroll.png",
      crusader: "/assets/images/items/crusader_scroll.png",
      fortune: "/assets/images/items/fortune_scroll.png",
      revival: "/assets/images/items/revival_scroll.png",
    },
    gear: {
      amulet: "/assets/images/items/amulet.png",
      attachedCard: "/assets/images/items/attached_card.png",
      luckycharm: "/assets/images/items/lucky_charm.png",
      mysticRune: "/assets/images/items/mystic_rune.png",
      cloakIcon: "/assets/images/items/cloak_icon.png",
      compass: "/assets/images/items/compass.png",
    },
    gold: "/assets/images/items/gold_coin.png",
    dice: "/assets/images/items/dice.png",
    forge: "/assets/images/items/forge.png",
    shopCounter: "/assets/images/items/shop_counter.png",
  },

  // Character images
  characters: {
    merchant: "/assets/images/characters/shopkeeper.png",
    monsters: {
      ooze: "/assets/images/monsters/abyssal_ooze.png",
      treant: "/assets/images/monsters/treant.png",
      sprite: "/assets/images/monsters/glimmering_sprite.png",
      assassin: "/assets/images/monsters/shadowy_assassin.png",
      banshee: "/assets/images/monsters/banshee.png",
      shade: "/assets/images/monsters/lunar_shade.png",
      elemental: "/assets/images/monsters/arcane_elemental.png",
      phoenix: "/assets/images/monsters/phoenix.png",
      gargoyle: "/assets/images/monsters/gargoyle.png",
      knight: "/assets/images/monsters/cursed_knight.png",
      minotaur: "/assets/images/monsters/minotaur.png",
      chimera: "/assets/images/monsters/chimera.png",
      drake: "/assets/images/monsters/ember_drake.png",
      wyrm: "/assets/images/monsters/frost_wyrm.png",
      nano: "/assets/images/monsters/nano_prototype.png",
      laser: "/assets/images/monsters/laser_turret.png",
      behemoth: "/assets/images/monsters/behemoth.png",
      cyclops: "/assets/images/monsters/cyclops.png",
      dragon: "/assets/images/monsters/dragon.png",
      titan: "/assets/images/monsters/titan.png",
      apexus: "/assets/images/monsters/apexus.png",
    },
  },

  // UI elements
  ui: {
    logo: "/assets/images/ui/skyward_ascent_logo.png",
    buttons: {
      normal: "/assets/images/ui/button.png",
      hover: "/assets/images/ui/button_hover.png",
      disabled: "/assets/images/ui/button_disabled.png",
    },
    icons: {
      heart: "/assets/images/ui/heart_icon.png",
      shield: "/assets/images/ui/shield_icon.png",
      sword: "/assets/images/ui/sword_icon.png",
      settings: "/assets/images/ui/settings_icon.png",
      save: "/assets/images/ui/save_icon.png",
      menu: "/assets/images/ui/menu_icon.png",
    },
    panels: {
      dialog: "/assets/images/ui/dialog_panel.png",
      inventory: "/assets/images/ui/inventory_panel.png",
      tooltip: "/assets/images/ui/tooltip.png",
      header: "/assets/images/ui/header_panel.png",
    },
  },

  // Effect animations
  effects: {
    heal: "/assets/images/effects/heal_effect.png",
    damage: "/assets/images/effects/damage_effect.png",
    critical: "/assets/images/effects/critical_effect.png",
    special: "/assets/images/effects/special_effect.png",
    fire: "/assets/images/effects/fire_effect.png",
    frost: "/assets/images/effects/frost_effect.png",
    lightning: "/assets/images/effects/lightning_effect.png",
    stars: "/assets/images/effects/stars.png",
    explosion: "/assets/images/effects/explosion.png",
    heartGlow: "/assets/images/effects/heart_glow.png",
  },
};

// Image cache
const imageCache = {};

// Load state tracking
let loadedCount = 0;
let totalToLoad = 0;
let isLoading = false;

/**
 * Get the flat list of all image paths
 * @returns {Array} - Array of all image paths
 */
const getAllImagePaths = () => {
  const paths = [];

  const processObject = (obj, paths) => {
    Object.values(obj).forEach((value) => {
      if (typeof value === "string") {
        paths.push(value);
      } else if (typeof value === "object" && value !== null) {
        processObject(value, paths);
      }
    });
  };

  processObject(IMAGES, paths);
  return paths;
};

/**
 * Preload an image and store it in the cache
 * @param {string} path - Path to the image
 * @returns {Promise} - Promise that resolves when the image is loaded
 */
const preloadImage = (path) => {
  return new Promise((resolve, reject) => {
    // Skip if already cached
    if (imageCache[path]) {
      resolve(imageCache[path]);
      return;
    }

    const img = new Image();

    img.onload = () => {
      imageCache[path] = img;
      loadedCount++;
      resolve(img);
    };

    img.onerror = () => {
      console.warn(`Failed to load image: ${path}`);
      loadedCount++;
      reject(new Error(`Failed to load image: ${path}`));
    };

    img.src = path;
  });
};

/**
 * Preload all images
 * @param {function} progressCallback - Callback function for loading progress
 * @returns {Promise} - Promise that resolves when all images are loaded
 */
export const preloadAllImages = (progressCallback) => {
  if (isLoading) {
    return Promise.reject(new Error("Already loading assets"));
  }

  isLoading = true;
  loadedCount = 0;

  const paths = getAllImagePaths();
  totalToLoad = paths.length;

  return Promise.all(
    paths.map((path) =>
      preloadImage(path)
        .then(() => {
          if (progressCallback) {
            progressCallback(loadedCount / totalToLoad);
          }
        })
        .catch(() => {
          // Continue loading even if some images fail
          if (progressCallback) {
            progressCallback(loadedCount / totalToLoad);
          }
        })
    )
  ).finally(() => {
    isLoading = false;
  });
};

/**
 * Preload a specific set of images
 * @param {Array} categories - Categories of images to preload
 * @param {function} progressCallback - Callback for loading progress
 * @returns {Promise} - Promise that resolves when images are loaded
 */
export const preloadImageSet = (categories, progressCallback) => {
  if (isLoading) {
    return Promise.reject(new Error("Already loading assets"));
  }

  isLoading = true;
  loadedCount = 0;

  // Build list of images based on categories
  const paths = [];

  categories.forEach((category) => {
    const parts = category.split(".");
    let imageSet = IMAGES;

    // Navigate to the specified category
    for (const part of parts) {
      if (imageSet[part]) {
        imageSet = imageSet[part];
      } else {
        console.warn(`Invalid image category: ${category}`);
        return;
      }
    }

    // Process the category object
    if (typeof imageSet === "string") {
      paths.push(imageSet);
    } else {
      processObject(imageSet, paths);
    }
  });

  totalToLoad = paths.length;

  return Promise.all(
    paths.map((path) =>
      preloadImage(path)
        .then(() => {
          if (progressCallback) {
            progressCallback(loadedCount / totalToLoad);
          }
        })
        .catch(() => {
          // Continue loading even if some images fail
          if (progressCallback) {
            progressCallback(loadedCount / totalToLoad);
          }
        })
    )
  ).finally(() => {
    isLoading = false;
  });
};

/**
 * Get an image from the cache
 * @param {string} path - Path to the image
 * @returns {HTMLImageElement|null} - The image element or null if not found
 */
export const getImage = (path) => {
  return imageCache[path] || null;
};

/**
 * Get an image by category (useful for accessing via path)
 * @param {string} categoryPath - Dot-separated path to the image
 * @returns {HTMLImageElement|null} - The image element or null if not found
 */
export const getImageByCategory = (categoryPath) => {
  const parts = categoryPath.split(".");
  let imagePath = IMAGES;

  // Navigate to the specified category
  for (const part of parts) {
    if (imagePath[part]) {
      imagePath = imagePath[part];
    } else {
      console.warn(`Invalid image category: ${categoryPath}`);
      return null;
    }
  }

  if (typeof imagePath === "string") {
    return getImage(imagePath);
  }

  return null;
};

/**
 * Create a placeholder image for missing assets
 * @param {string} text - Text to display on the placeholder
 * @param {string} color - Background color of the placeholder
 * @returns {HTMLImageElement} - Placeholder image
 */
export const createPlaceholder = (text, color = "#3a3a5a") => {
  // Create canvas for the placeholder
  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 200;

  const ctx = canvas.getContext("2d");

  // Draw background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw text
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Wrap text if needed
  const words = text.split(" ");
  let line = "";
  let y = canvas.height / 2 - 20;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);

    if (metrics.width > canvas.width - 20 && i > 0) {
      ctx.fillText(line, canvas.width / 2, y);
      line = words[i] + " ";
      y += 30;
    } else {
      line = testLine;
    }
  }

  ctx.fillText(line, canvas.width / 2, y);

  // Draw missing icon
  ctx.font = "40px Arial";
  ctx.fillText("🖼️", canvas.width / 2, y - 60);

  // Convert to image
  const img = new Image();
  img.src = canvas.toDataURL("image/png");

  return img;
};

/**
 * Get the path for an image (useful for src attributes)
 * @param {string} categoryPath - Dot-separated path to the image
 * @returns {string|null} - The image path or null if not found
 */
export const getImagePath = (categoryPath) => {
  const parts = categoryPath.split(".");
  let imagePath = IMAGES;

  // Navigate to the specified category
  for (const part of parts) {
    if (imagePath[part]) {
      imagePath = imagePath[part];
    } else {
      console.warn(`Invalid image category: ${categoryPath}`);
      return null;
    }
  }

  if (typeof imagePath === "string") {
    return imagePath;
  }

  return null;
};

/**
 * Get loading progress information
 * @returns {Object} - Current loading progress
 */
export const getLoadingProgress = () => {
  return {
    isLoading,
    loaded: loadedCount,
    total: totalToLoad,
    progress: totalToLoad > 0 ? loadedCount / totalToLoad : 1,
  };
};

/**
 * Clear the image cache to free memory
 * @param {Array} exclude - Categories to exclude from clearing
 */
export const clearImageCache = (exclude = []) => {
  // If no exclusions, clear everything
  if (!exclude.length) {
    Object.keys(imageCache).forEach((key) => {
      delete imageCache[key];
    });
    return;
  }

  // Build list of paths to exclude
  const excludePaths = [];

  exclude.forEach((category) => {
    const parts = category.split(".");
    let imageSet = IMAGES;

    // Navigate to the specified category
    for (const part of parts) {
      if (imageSet[part]) {
        imageSet = imageSet[part];
      } else {
        return;
      }
    }

    // Process the category object
    if (typeof imageSet === "string") {
      excludePaths.push(imageSet);
    } else {
      processObject(imageSet, excludePaths);
    }
  });

  // Clear cache except excluded paths
  Object.keys(imageCache).forEach((key) => {
    if (!excludePaths.includes(key)) {
      delete imageCache[key];
    }
  });
};

/**
 * Helper function to process image objects recursively
 * @param {Object} obj - Object to process
 * @param {Array} paths - Array to add paths to
 */
const processObject = (obj, paths) => {
  Object.values(obj).forEach((value) => {
    if (typeof value === "string") {
      paths.push(value);
    } else if (typeof value === "object" && value !== null) {
      processObject(value, paths);
    }
  });
};

export default {
  preloadAllImages,
  preloadImageSet,
  getImage,
  getImageByCategory,
  createPlaceholder,
  getImagePath,
  getLoadingProgress,
  clearImageCache,
  IMAGES,
};
