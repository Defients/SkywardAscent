// AssetImportWrapper.js
import PlaceholderUtils from "./PlaceholderUtils";

const importImage = (path, fallbackText) => {
  try {
    // Attempt to import the image
    const image = require(path);
    return image;
  } catch (error) {
    console.warn(`Failed to load image: ${path}`);
    // Return a placeholder image
    return PlaceholderUtils.createPlaceholder(fallbackText || "Missing Image");
  }
};

const importSound = (path) => {
  try {
    // Attempt to import the sound
    const sound = require(path);
    return sound;
  } catch (error) {
    console.warn(`Failed to load sound: ${path}`);
    // Return a silent sound
    return null;
  }
};

export default {
  importImage,
  importSound,
};
