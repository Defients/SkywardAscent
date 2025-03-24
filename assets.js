// assets.js
import AssetImportWrapper from "./AssetImportWrapper";

// Map of asset paths with fallback names
const ASSETS = {
  // Menu assets
  menuBackground: [
    "/assets/images/backgrounds/menu_background.png",
    "Menu Background",
  ],
  logoImage: ["/assets/images/ui/skyward_ascent_logo.png", "Game Logo"],
  starsImage: ["/assets/images/effects/stars.png", "Stars Background"],

  // Hero images
  bladedancerImage: [
    "/assets/images/heroes/bladedancer.png",
    "Bladedancer Hero",
  ],
  manipulatorImage: [
    "/assets/images/heroes/manipulator.png",
    "Manipulator Hero",
  ],
  trackerImage: ["/assets/images/heroes/tracker.png", "Tracker Hero"],
  guardianImage: ["/assets/images/heroes/guardian.png", "Guardian Hero"],

  // Room backgrounds
  clubRoomImage: ["/assets/images/rooms/club_room.png", "Club Room"],
  diamondRoomImage: ["/assets/images/rooms/diamond_room.png", "Diamond Room"],
  heartRoomImage: ["/assets/images/rooms/heart_room.png", "Heart Room"],
  spadeRoomImage: ["/assets/images/rooms/spade_room.png", "Spade Room"],

  // Item images
  chestClosedImage: ["/assets/images/items/chest_closed.png", "Closed Chest"],
  chestOpenImage: ["/assets/images/items/chest_open.png", "Open Chest"],
  cardBackImage: ["/assets/images/cards/card_back.png", "Card Back"],

  // Sound effects
  buttonClickSound: ["/assets/sounds/ui/button_click.mp3", "Button Click"],
  cardFlipSound: ["/assets/sounds/ui/card_flip.mp3", "Card Flip"],
  victorySound: ["/assets/sounds/results/victory.mp3", "Victory"],
};

// Import all assets with fallbacks
const importedAssets = {};
Object.entries(ASSETS).forEach(([key, [path, fallback]]) => {
  if (path.endsWith(".mp3") || path.endsWith(".wav")) {
    importedAssets[key] = AssetImportWrapper.importSound(path);
  } else {
    importedAssets[key] = AssetImportWrapper.importImage(path, fallback);
  }
});

export default importedAssets;
