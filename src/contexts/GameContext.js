import React, { createContext, useContext } from "react";

// Create the game context
const GameContext = createContext();

// Provider component
export const GameProvider = ({ children, value }) => {
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

// Hook to use the game context
export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};

// Card utility functions
export const SUITS = {
  CLUB: "♣",
  DIAMOND: "♦",
  HEART: "♥",
  SPADE: "♠",
};

export const RANKS = {
  ACE: "A",
  TWO: "2",
  THREE: "3",
  FOUR: "4",
  FIVE: "5",
  SIX: "6",
  SEVEN: "7",
  EIGHT: "8",
  NINE: "9",
  TEN: "10",
  JACK: "J",
  QUEEN: "Q",
  KING: "K",
  JOKER: "Joker",
};

export const COLOR = {
  RED: "red",
  BLACK: "black",
};

// Helper to determine card color
export const getCardColor = (suit) => {
  if (suit === SUITS.HEART || suit === SUITS.DIAMOND) {
    return COLOR.RED;
  }
  return COLOR.BLACK;
};

// Get numeric value of card for game calculations
export const getCardValue = (rank) => {
  switch (rank) {
    case RANKS.ACE:
      return 1;
    case RANKS.TWO:
      return 2;
    case RANKS.THREE:
      return 3;
    case RANKS.FOUR:
      return 4;
    case RANKS.FIVE:
      return 5;
    case RANKS.SIX:
      return 6;
    case RANKS.SEVEN:
      return 7;
    case RANKS.EIGHT:
      return 8;
    case RANKS.NINE:
      return 9;
    case RANKS.TEN:
      return 10;
    case RANKS.JACK:
      return 11;
    case RANKS.QUEEN:
      return 12;
    case RANKS.KING:
      return 13;
    case RANKS.JOKER:
      return 0;
    default:
      return 0;
  }
};

// Get suit color class for CSS
export const getSuitColorClass = (suit) => {
  if (suit === SUITS.HEART || suit === SUITS.DIAMOND) {
    return "red-suit";
  }
  return "black-suit";
};

// Create a standard deck of cards
export const createDeck = () => {
  const deck = [];

  // Add standard cards
  Object.values(SUITS).forEach((suit) => {
    Object.values(RANKS).forEach((rank) => {
      if (rank !== RANKS.JOKER) {
        deck.push({
          id: `${rank}-${suit}`,
          rank,
          suit,
          color: getCardColor(suit),
          isTapped: false,
          value: getCardValue(rank),
        });
      }
    });
  });

  // Add jokers
  deck.push({
    id: "joker-1",
    rank: RANKS.JOKER,
    suit: null,
    color: null,
    isTapped: false,
    value: 0,
    isJoker: true,
  });
  deck.push({
    id: "joker-2",
    rank: RANKS.JOKER,
    suit: null,
    color: null,
    isTapped: false,
    value: 0,
    isJoker: true,
  });

  return deck;
};

// Shuffle an array (Fisher-Yates algorithm)
export const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Roll dice (d20 or d6)
export const rollDice = (sides = 20) => {
  return Math.floor(Math.random() * sides) + 1;
};

// Draw a card from the deck
export const drawCard = (deck, removeFromDeck = true) => {
  if (deck.length === 0) return null;
  const card = deck[0];
  return removeFromDeck ? { card, remainingDeck: deck.slice(1) } : card;
};

// Draw a card from the Peon pile
export const drawCardFromPeon = (peonPile, discardPile = []) => {
  // If pile is empty, shuffle discard and use it
  if (peonPile.length === 0) {
    if (discardPile.length === 0) {
      // If both piles are empty, create a new deck
      return null;
    }
    const shuffledDiscard = shuffleArray([...discardPile]);
    return {
      card: shuffledDiscard[0],
      peonPile: shuffledDiscard.slice(1),
      discardPile: [],
    };
  }

  // Get the top card and remaining pile
  return { card: peonPile[0], peonPile: peonPile.slice(1), discardPile };
};

// Calculate chances for different outcomes
export const calculateProbability = (favorableOutcomes, totalOutcomes) => {
  return parseFloat(((favorableOutcomes / totalOutcomes) * 100).toFixed(1));
};

// Check if a hero can use a specific item
export const canUseItem = (hero, item) => {
  // Check for hero-specific conditions
  if (item.type === "weapon" && item.class && item.class !== hero.class) {
    return false;
  }

  // Check for health potions when at full health
  if (
    item.type === "potion" &&
    item.subtype === "health" &&
    hero.health >= hero.maxHealth
  ) {
    return false;
  }

  // Check for revive items when hero is alive
  if (item.type === "revive" && hero.health > 0) {
    return false;
  }

  return true;
};

// Class and specialization data
export const CLASS_DATA = {
  3: {
    name: "Bladedancer",
    blackSpec: "Shadowblade",
    redSpec: "Runeblade",
    health: 17,
    startingGold: 25,
    startingItems: ["Fiery Enchant Scroll", "Major Health Potion"],
    ability: "Step through the shadows and steal an enemy's attached card.",
    abilityDetails:
      "When activated, the Bladedancer steals one attached card from the monster. Also, the Bladedancer can choose a Rune to buff themselves: Rune of Devastation makes rolls 1-3 deal 3 damage, and Rune of Warding reduces all damage taken by 2.",
    rollEffects: {
      1: {
        name: "Stab",
        effect: "Deal 1 damage.",
        icon: "🗡️",
        color: "#e6ccff",
      },
      2: {
        name: "Strike",
        effect: "Deal 1 damage.",
        icon: "⚔️",
        color: "#e6ccff",
      },
      3: {
        name: "Backstab",
        effect:
          "Deal 2 damage. (Double if a Hero's attached card matched in this Hero Flip set.)",
        icon: "🔪",
        color: "#cc99ff",
      },
      4: {
        name: "Eviscerate",
        effect: "Deal 3 damage; roll again – if 5–6, crit for double damage.",
        icon: "💥",
        color: "#cc99ff",
      },
      5: {
        name: "Evasive Maneuver",
        effect:
          "Dodge the next monster attack over 2 (mark with 🔵); then deal 5 damage.",
        icon: "💨",
        color: "#9966ff",
      },
      6: {
        name: "Dismantle",
        effect:
          "Deal 4 damage and tap one of the monster's attached cards diagonally (if later matched, it untaps).",
        icon: "🔄",
        color: "#9966ff",
      },
    },
    description:
      "Swift and deadly, the Bladedancer excels at precision strikes and evasive maneuvers. With their exceptional agility, they can avoid attacks while dealing significant damage to their opponents.",
    weaponPreferences: ["daggers", "short swords", "rapiers"],
    strengths: ["mobility", "critical strikes", "evasion"],
    weaknesses: ["sustained damage", "area attacks"],
  },
  5: {
    name: "Manipulator",
    blackSpec: "Timebender",
    redSpec: "Illusionist",
    health: 17,
    startingGold: 30,
    startingItems: ["Mystic Rune", "Ability Blocker"],
    ability:
      "Bend time itself. Roll an extra time with +1. On a natural 6, increase all numbers by 2. Cast illusions that might cause incoming damage to miss on an even roll if you take 3+ damage.",
    abilityDetails:
      "The Manipulator controls the flow of time and reality itself. When their ability triggers, they roll an extra time with a +1 bonus. If they roll a natural 6, all numbers increase by 2. Additionally, their illusions might cause incoming damage of 3+ to miss entirely on an even dice roll.",
    rollEffects: {
      1: {
        name: "Psychic Blast",
        effect: "Deal 1 damage.",
        icon: "💫",
        color: "#ffccff",
      },
      2: { name: "", effect: "", icon: "▫️", color: "#ffccff" },
      3: {
        name: "Telekinesis",
        effect: "Roll—1–3: 2 damage; 4–6: 4 damage.",
        icon: "✨",
        color: "#ff99ff",
      },
      4: {
        name: "Mind Flay",
        effect:
          "Deal 3 damage; if roll 3–4 on a follow-up, continue for 2 damage and roll again.",
        icon: "🌀",
        color: "#ff99ff",
      },
      5: {
        name: "Mind Warp",
        effect:
          "Monster self-attacks for half its attached cards (min 3, max 8 damage).",
        icon: "🔮",
        color: "#ff66ff",
      },
      6: {
        name: "Psychic Vortex",
        effect: "Deal 5 damage; heal self for 2 and party members for 1.",
        icon: "🌌",
        color: "#ff66ff",
      },
    },
    description:
      "Masters of the mind and reality, Manipulators bend time and create powerful illusions. They can force enemies to attack themselves and provide healing to allies through their psychic prowess.",
    weaponPreferences: ["staves", "wands", "orbs"],
    strengths: ["control", "mind attacks", "versatility"],
    weaknesses: ["physical resilience", "consistency"],
  },
  7: {
    name: "Tracker",
    blackSpec: "Huntress",
    redSpec: "Beastmaster",
    health: 14,
    startingGold: 35,
    startingItems: ["Lucky Charm", "Camouflage Cloak"],
    ability:
      "Mark the target with a Hunter's Mark to add +1 damage to all Hero matches (tracked with 🔴). Plus, summon a Dire Beast to fight alongside you.",
    abilityDetails:
      "When the Tracker's ability activates, they mark the target with Hunter's Mark, adding +1 damage to all Hero matches. They also summon a loyal Dire Beast companion that fights independently, providing additional attacks and support abilities.",
    rollEffects: {
      1: {
        name: "Snipe",
        effect: "Deal 2 damage.",
        icon: "🏹",
        color: "#ccffcc",
      },
      2: { name: "", effect: "", icon: "▫️", color: "#ccffcc" },
      3: {
        name: "Precision Shot",
        effect: "Deal 3 damage.",
        icon: "🎯",
        color: "#99ff99",
      },
      4: {
        name: "Animal Companion",
        effect:
          "Your pet flips the next Peon card and attaches it (max 1 extra), then deals 2 damage.",
        icon: "🐺",
        color: "#99ff99",
      },
      5: {
        name: "Supportive Fire",
        effect:
          "Deal 3 damage; next Hero gets +1 to their roll (mark with ⚫).",
        icon: "💘",
        color: "#66ff66",
      },
      6: {
        name: "Aimed Shot",
        effect: "Deal 6 damage.",
        icon: "🔆",
        color: "#66ff66",
      },
    },
    direBeast: {
      1: {
        name: "Snarl",
        effect: "Deal 1 damage.",
        icon: "😾",
        color: "#ccffcc",
      },
      2: { name: "", effect: "", icon: "▫️", color: "#ccffcc" },
      3: {
        name: "Pounce",
        effect: "Deal 2 damage.",
        icon: "🐾",
        color: "#99ff99",
      },
      4: {
        name: "Healing Howl",
        effect: "Heal the lowest-health Hero for 3.",
        icon: "🐺",
        color: "#99ff99",
      },
      5: {
        name: "Snatch",
        effect: "Deal 2 damage; party gains +10 gold.",
        icon: "💰",
        color: "#66ff66",
      },
      6: {
        name: "Untamed Power",
        effect: "Deal 3 damage.",
        icon: "⚡",
        color: "#66ff66",
      },
    },
    description:
      "Expert rangers and nature masters, Trackers excel at precise ranged attacks and animal handling. Though less durable than other classes, they make up for it with their animal companions and powerful marking abilities.",
    weaponPreferences: ["bows", "crossbows", "throwing weapons"],
    strengths: ["ranged combat", "companion abilities", "consistent damage"],
    weaknesses: ["low health", "close combat"],
  },
  9: {
    name: "Guardian",
    blackSpec: "Sentinel",
    redSpec: "Warden",
    health: 18,
    startingGold: 20,
    startingItems: ["Common weapon (Stargazer Spear)", "PAC"],
    ability:
      "Stand strong by increasing your health by 7 (up to 20 in combat) and gain +1 on all rolls. Also, protect your party by redirecting roll damage to party members until they're at 5 health (with incoming damage reduced by 1).",
    abilityDetails:
      "When their ability activates, Guardians increase their health by 7 (up to a maximum of 20) and gain +1 on all dice rolls. They can also protect the party by redirecting damage to themselves until allies reach 5 health, with the redirected damage being reduced by 1.",
    rollEffects: {
      1: {
        name: "Hack",
        effect: "Deal 1 damage.",
        icon: "⚒️",
        color: "#ffddcc",
      },
      2: {
        name: "Slash",
        effect: "Deal 2 damage.",
        icon: "🔪",
        color: "#ffddcc",
      },
      3: {
        name: "Protective Strike",
        effect: "Deal 2 damage and heal party members by 1.",
        icon: "🛡️",
        color: "#ffbb99",
      },
      4: {
        name: "Vital Rend",
        effect: "Deal 3 damage and heal self for 2.",
        icon: "💔",
        color: "#ffbb99",
      },
      5: {
        name: "Sacrificial Strike",
        effect: "Deal 6 damage at the cost of 2 health.",
        icon: "☠️",
        color: "#ff9966",
      },
      6: {
        name: "Execute",
        effect:
          "Deal 4 damage; if the monster is left with 4 or less health, it dies.",
        icon: "⚔️",
        color: "#ff9966",
      },
    },
    description:
      "Steadfast defenders, Guardians focus on protecting their allies while still dealing solid damage. With the highest base health, they can withstand tremendous punishment while providing healing and protection to the party.",
    weaponPreferences: ["shields", "hammers", "heavy weapons"],
    strengths: ["protection", "healing", "high health"],
    weaknesses: ["mobility", "range"],
  },
};

// Available weapon enchantments
export const ENCHANTMENTS = {
  fortune: {
    name: "Fortune's Favor",
    effect: "On a roll of 6, immediately roll again for +7g bonus. Can chain.",
    icon: "🍀",
    color: "#ffff99",
    description:
      "This enchantment brings tremendous luck to the wielder, creating opportunities for gold-finding with perfect strikes.",
  },
  crusader: {
    name: "Crusader",
    effect: "Rolling a 5 grants immediate use of the Hero's ability.",
    icon: "✝️",
    color: "#ffffff",
    description:
      "A holy enchantment that empowers the wielder to tap into their special abilities more frequently.",
  },
  fiery: {
    name: "Fiery",
    effect: "Rolls 3–4 get +2 extra damage.",
    icon: "🔥",
    color: "#ff6600",
    description:
      "This weapon burns with magical flame, causing additional burn damage on medium-power strikes.",
  },
  noxious: {
    name: "Noxious",
    effect: "Rolls 1–4 gain +1 extra damage.",
    icon: "☠️",
    color: "#66ff33",
    description:
      "The weapon drips with toxic poison, adding venom damage to most attacks.",
  },
  toxic: {
    name: "Toxic",
    effect: "Rolls 1–2 gain +1 extra damage.",
    icon: "🧪",
    color: "#00cc66",
    description:
      "A less potent but still effective poison coating that improves weaker attacks.",
  },
};

// Sample weapons data with expanded details
export const WEAPONS = {
  common: [
    {
      name: "Frostbite Dagger",
      suit: SUITS.CLUB,
      class: "Bladedancer",
      effect:
        'Rolls 1–2: deal damage then roll again. On 1–3, place a 🔵 marker ("chill") on the monster (–1 to its rolls). Subsequent chills add +1 damage.',
      description:
        "A swift blade that glistens with magical frost. The cold slows enemies and creates openings for additional strikes.",
      icon: "❄️",
      image: "frost_dagger.png",
    },
    {
      name: "Serpent's Kiss",
      suit: SUITS.DIAMOND,
      class: "Bladedancer",
      effect: "Applies a Noxious enchant at combat start (does not stack).",
      description:
        "A curved dagger with a snake-like hilt that secretes venom with each strike.",
      icon: "🐍",
      image: "serpent_dagger.png",
    },
    {
      name: "Moonshadow Shiv",
      suit: SUITS.HEART,
      class: "Bladedancer",
      effect:
        "Rolls 1–4: enter Stealth (track with 🔴). While stealthed, monster matches don't hurt you. Rolls 5–6: break stealth and add +3 damage.",
      description:
        "A dark blade that lets the wielder slip into shadows, becoming nearly invisible until delivering a powerful strike.",
      icon: "🌙",
      image: "moon_shiv.png",
    },
    {
      name: "Astral Rod",
      suit: SUITS.DIAMOND,
      class: "Manipulator",
      effect:
        "Telekinesis now: roll 1–2 = 2 damage, 3–4 = 3 damage, 5–6 = 4 damage. On a 5–6, grant +1 to a party member's next roll (tracked with ⚫).",
      description:
        "A starry staff that hums with cosmic energy, enhancing telekinetic abilities and supporting allies.",
      icon: "☄️",
      image: "astral_rod.png",
    },
    {
      name: "Celestial Scepter",
      suit: SUITS.HEART,
      class: "Manipulator",
      effect:
        "Psychic Blast now deals 3 damage and heals another party member by 2.",
      description:
        "A scepter crowned with a swirling galaxy that turns even basic psychic attacks into healing energy.",
      icon: "🌠",
      image: "celestial_scepter.png",
    },
    {
      name: "Longshot",
      suit: SUITS.HEART,
      class: "Tracker",
      effect:
        "All Snipe rolls grant +10 gold; Precision Shots add +1 damage and +20 gold.",
      description:
        "A bow with exceptional range that somehow discovers hidden treasures as it strikes enemies.",
      icon: "🏹",
      image: "longshot_bow.png",
    },
    {
      name: "Thunderstrike Bow",
      suit: SUITS.SPADE,
      class: "Tracker",
      effect:
        "All Snipes gain +1 damage; Precision Shots: if roll even → monster stunned (mark with ⚫), if odd → +30 gold; Animal Companion now deals 4 damage.",
      description:
        "A lightning-imbued bow that can paralyze targets with thunderous shots and empowers animal companions.",
      icon: "⚡",
      image: "thunder_bow.png",
    },
    {
      name: "Stargazer Spear",
      suit: SUITS.SPADE,
      class: "Guardian",
      effect:
        "Protective Strike now heals for 2 instead of 1; Vital Rend heals for 3 instead of 2.",
      description:
        "A cosmic spear that channels healing energy with each strike, greatly improving the Guardian's support capabilities.",
      icon: "✨",
      image: "stargazer_spear.png",
    },
  ],
  rare: [
    {
      name: "Starforged Blade",
      suit: SUITS.SPADE,
      class: "Bladedancer",
      effect:
        "All rolls get +1 damage; on a 6, roll again. Both Runes are permanently active (mark diagonally).",
      description:
        "A magnificent blade forged from star metal, glowing with cosmic energy. It enhances all attacks and enables both offensive and defensive runes simultaneously.",
      icon: "🌟",
      image: "starforged_blade.png",
    },
    {
      name: "Voidweaver Enigma",
      suit: SUITS.CLUB,
      class: "Manipulator",
      effect:
        "Can reroll its own roll once per turn; Mind Warp rounds up instead of down.",
      description:
        "A mysterious staff made of impossible geometry that bends probability itself, allowing manipulation of dice results and enhancing mind attacks.",
      icon: "🔮",
      image: "voidweaver_staff.png",
    },
    {
      name: "Beast Whisperer",
      suit: SUITS.DIAMOND,
      class: "Tracker",
      effect:
        "Animal Companion gains an extra attached card (max 2); Snipe now deals 3 damage and Precision Shot deals 4.",
      description:
        "A bow carved with ancient animal spirits that greatly enhances the bond between Tracker and beasts, while improving basic attacks.",
      icon: "🦊",
      image: "beast_bow.png",
    },
    {
      name: "Bulwark of Dawn",
      suit: SUITS.HEART,
      class: "Guardian",
      effect:
        "Gain +1 health after every roll; Execute now works on enemies with 6 or less health.",
      description:
        "A mighty shield that continuously regenerates the Guardian's vitality and improves execution capabilities against weakened foes.",
      icon: "🛡️",
      image: "bulwark_shield.png",
    },
  ],
  epic: [
    {
      name: "Shadowtide Reaper",
      suit: SUITS.CLUB,
      class: "Bladedancer",
      effect:
        "Backstab and Eviscerate now deal double damage; on a roll of 6, steal 1 attached card from the monster.",
      description:
        "A legendary pair of midnight-black daggers that dance with shadow energy, massively improving critical attacks and stealing enemy power.",
      icon: "🌑",
      image: "shadowtide_daggers.png",
    },
    {
      name: "Eternal Starweaver Staff",
      suit: SUITS.DIAMOND,
      class: "Manipulator",
      effect:
        "Gain the other spec's ability when matching a class card; on a 5, opt for Psychic Vortex.",
      description:
        "An ancient staff said to contain the knowledge of both Timebender and Illusionist traditions, granting access to both specializations' abilities.",
      icon: "✴️",
      image: "eternal_staff.png",
    },
    {
      name: "Stormcaller's Embrace",
      suit: SUITS.HEART,
      class: "Tracker",
      effect:
        "Your Dire Beast gets its own attached card and +1 to all rolls; Aimed Shot applies Hunter's Mark automatically.",
      description:
        "A legendary bow that forms an unbreakable bond with your animal companion, greatly enhancing its power while improving marking abilities.",
      icon: "⚡",
      image: "stormcaller_bow.png",
    },
    {
      name: "Astral Bulwark",
      suit: SUITS.SPADE,
      class: "Guardian",
      effect:
        "Protective Strike heals all heroes for 2; reduced damage from protecting allies is now 2 instead of 1.",
      description:
        "A cosmic shield that radiates healing energy throughout the party and significantly improves the Guardian's protective capabilities.",
      icon: "🌌",
      image: "astral_shield.png",
    },
  ],
  legendary: [
    {
      name: "Twilight's Kiss",
      suit: SUITS.SPADE,
      class: "Bladedancer",
      effect:
        "All attacks have 50% chance to trigger Backstab, Eviscerate, and Dismantle effects simultaneously; immune to monster special abilities.",
      description:
        "The ultimate shadowblade, forged from the void between stars. It moves with impossible speed, layering multiple deadly effects with each strike while protecting the wielder from special attacks.",
      icon: "⚜️",
      image: "twilight_kiss.png",
    },
    {
      name: "Eternity's Whisper",
      suit: SUITS.CLUB,
      class: "Manipulator",
      effect:
        "Roll twice for every ability and choose the better result; Psychic Vortex now deals 8 damage and heals the party fully.",
      description:
        "A staff containing fragments of time itself, granting unprecedented control over rolls while massively improving the most powerful psychic abilities.",
      icon: "🌀",
      image: "eternity_staff.png",
    },
    {
      name: "Apex Predator",
      suit: SUITS.HEART,
      class: "Tracker",
      effect:
        "Summons 2 Dire Beasts; Aimed Shot now executes monsters below 25% health; gain double gold from all sources.",
      description:
        "The ultimate hunting weapon, connecting the wielder to the primal spirit of the hunt. It summons multiple companion beasts, executes wounded prey, and discovers vast treasures.",
      icon: "👑",
      image: "apex_bow.png",
    },
    {
      name: "Divine Aegis",
      suit: SUITS.DIAMOND,
      class: "Guardian",
      effect:
        "Immune to damage below 4; Execute now works on any health level when rolling a 6; revive fallen allies once per combat at 50% health.",
      description:
        "A shield of the gods themselves, practically making the Guardian immortal while providing unprecedented execution power and the ability to revive fallen allies.",
      icon: "⚱️",
      image: "divine_shield.png",
    },
  ],
};

// Monster data structure with enhanced details
export const MONSTERS = {
  jack: [
    {
      name: "Abyssal Ooze",
      rank: RANKS.JACK,
      health: 12,
      goldMultiplier: 7,
      minGold: 20,
      special:
        "Ooze Trail: Tap to start oozing; Hero's 1–2 rolls now reflect 3 damage; every match reflects 1 damage to the matching Hero; also deals 1 damage to the party.",
      specialIcon: "🟢",
      description:
        "A corrosive slime that oozes across the floor, leaving damaging trails and reflecting attacks back at heroes.",
      image: "abyssal_ooze.png",
      vulnerabilities: ["fire", "cold"],
      resistances: ["physical"],
      rollEffects: {
        1: "Deal 1 damage to the Hero*.",
        2: "",
        3: "Deal 2 damage to the party.",
        4: "Regenerates 4 health.",
        5: "Draw two cards from the Peon pile as new attached cards (max 3). Deal 3 damage to the Hero*.",
        6: "Growing Pains: Draw one card as a new attached card (max 3). Deal 2 damage (+2 per attached card) to the Hero*.",
      },
    },
    {
      name: "Treant",
      rank: RANKS.JACK,
      health: 14,
      goldMultiplier: 0,
      minGold: 25,
      special:
        "Thorns: Tap to suddenly grow thorns; Hero's rolls reflect 2 damage.",
      specialIcon: "🌲",
      description:
        "A massive walking tree with a protective bark hide and thorn-covered branches that damage attackers.",
      image: "treant.png",
      vulnerabilities: ["fire"],
      resistances: ["physical", "water"],
      rollEffects: {
        1: "Heal the party by 1 and itself by 4.",
        2: "Deal 2 damage to the Hero*.",
        3: "Heal itself for 5.",
        4: "Deal 4 damage to the Hero with highest/lowest current health.",
        5: "Tap the Hero's class card (disable its ability/matching) and deal 1 damage.",
        6: "Ensnaring Root: Flip all weapons (their effects, including enchants, are nullified for the rest of combat). Deal 3 damage to the party.",
      },
    },
    {
      name: "The Glimmering Sprite",
      rank: RANKS.JACK,
      health: 13,
      goldMultiplier: 0,
      minGold: 25,
      special:
        "Illusionary Assault: If in an illusionary state → attack the Hero with the highest attached card (min 5 damage). Otherwise → attack the Hero with the lowest attached card (max 5 damage).",
      specialIcon: "✨",
      description:
        "A mischievous fairy-like creature that confuses heroes with illusions and tricks, becoming unpredictable in combat.",
      image: "glimmering_sprite.png",
      vulnerabilities: ["psychic"],
      resistances: ["light", "illusion"],
      rollEffects: {
        1: "Deal 3 damage to the Hero*.",
        2: "Deal 2 damage to the Hero*.",
        3: "Deal 1 damage to the party.",
        4: "Swap attached card with the Hero*; if repeated, swap with the next Hero; deal 3 damage to the swapped target.",
        5: "Steal an attached card from the Hero* (limit: 1 total at a time); deal 3 damage.",
        6: "Enter illusionary state: Rolls 1–2 heal the Sprite instead; rerolling a 6 untaps the card (returning to normal) then deal 6 damage to the Hero*.",
      },
    },
    {
      name: "Shadowy Assassin",
      rank: RANKS.JACK,
      health: 14,
      goldMultiplier: 0,
      minGold: 35,
      special:
        "Assassinate: Targets the Hero with the lowest health. Deals 4 damage (plus an extra 3 if that Hero is 5 health below the next lowest) and then taps (vanishes).",
      specialIcon: "🗡️",
      description:
        "A deadly rogue who targets the weakest member of the party and can vanish into shadows between attacks.",
      image: "shadowy_assassin.png",
      vulnerabilities: ["light"],
      resistances: ["shadow", "physical"],
      rollEffects: {
        1: "Deal 2 damage to the Hero*.",
        2: "Deal 3 damage to the Hero* and heal for 2.",
        3: "Deal 4 damage to the Hero* and heal for 1.",
        4: "Deal 3 damage to the Hero* then vanish (next damage roll is skipped; then untap).",
        5: "Roll the die and deal that amount +1 (max 5); if still vanished, the maximum damage increases to 7.",
        6: "Killing Spree: Deal 4 damage to the Hero*, 3 damage to the next Hero, and 2 to the last Hero.",
      },
    },
  ],
  queen: [
    {
      name: "Banshee",
      rank: RANKS.QUEEN,
      health: 15,
      goldMultiplier: 0,
      minGold: 35,
      special:
        "Psychic Scream: Screams so loudly it incapacitates Heroes (dealing 2 damage to all) and buys time for a roll.",
      specialIcon: "👻",
      description:
        "A wailing spirit whose haunting cries can incapacitate heroes and drain their life force.",
      image: "banshee.png",
      vulnerabilities: ["light"],
      resistances: ["physical", "cold"],
      rollEffects: {
        1: "Deal 1 damage to the Hero*.",
        2: "",
        3: "Unleash a haunting cry; next Hero's turn is skipped and deal 2 damage to the Hero*.",
        4: "Become intangible (reduce next incoming damage by half, mark by tapping); deal 3 damage to the Hero*.",
        5: "Deal 3 damage to the Hero* and heal self for 2.",
        6: "Siphon Life: Deal 4 damage to the Hero* and heal self for 5.",
      },
    },
    {
      name: "Lunar Shade",
      rank: RANKS.QUEEN,
      health: 11,
      goldMultiplier: 0,
      minGold: 30,
      special:
        "When enraged, deals 1.5× damage for rolls 1–3 (tracked by tapping).",
      specialIcon: "🌙",
      description:
        "A shadow creature born from moonlight that grows stronger as it becomes enraged, dealing devastating damage in its fury.",
      image: "lunar_shade.png",
      vulnerabilities: ["light"],
      resistances: ["shadow", "physical"],
      rollEffects: {
        1: "Deal 2 damage to the Hero*.",
        2: "Deal 3 damage to the Hero*.",
        3: "Deal 4 damage to the lowest-health Hero.",
        4: "Fade from sight and regenerate 6 health.",
        5: "Deal 6 damage to the highest-health Hero.",
        6: "Twilight Burst: Deal 4 damage to the party.",
      },
    },
    {
      name: "Arcane Elemental",
      rank: RANKS.QUEEN,
      health: 12,
      goldMultiplier: 0,
      minGold: 30,
      special: "Arcane Surge: Rolls double damage (max 6) to the Hero*.",
      specialIcon: "🔮",
      description:
        "A being of pure magical energy that can surge with arcane power, doubling its attack damage suddenly.",
      image: "arcane_elemental.png",
      vulnerabilities: ["physical"],
      resistances: ["magic", "elemental"],
      rollEffects: {
        1: "Deal 2 damage to the Hero*.",
        2: "",
        3: "",
        4: "Deal 3 damage to the party.",
        5: "",
        6: "Arcane Explosion: Self-destruct and deal 7 damage to the party. Each Hero must roll; if even, they avoid the blast.",
      },
    },
    {
      name: "Phoenix",
      rank: RANKS.QUEEN,
      health: 14,
      goldMultiplier: 0,
      minGold: 45,
      special:
        "Rebirth: When reduced to 0, reborn with 8 health (only once). Additional matching effects increase rebirth health and damage (tracked by 🟡 stacks; max 3).",
      specialIcon: "🔥",
      description:
        "A fiery bird that can be reborn from its own ashes once per combat, becoming stronger through the rebirth process.",
      image: "phoenix.png",
      vulnerabilities: ["water"],
      resistances: ["fire", "physical"],
      rollEffects: {
        1: "Deal 1 damage to the party.",
        2: "",
        3: "Deal 2 damage to two chosen Heroes.",
        4: "Deal 4 damage to the Hero* and add 1 Juiced stack.",
        5: "Deal 2 damage to the Hero* and add 2 Juiced stacks.",
        6: "Phoenix Requiem: Unleash full fury and deal 3 damage to the party.",
      },
    },
  ],
  king: [
    {
      name: "Gargoyle",
      rank: RANKS.KING,
      health: 17,
      goldMultiplier: 0,
      minGold: 40,
      special:
        "Shatter: Sends rock shards; damage depends on the target's health (5 if 15+, 4 if 7–14, 3 otherwise).",
      specialIcon: "🗿",
      description:
        "A stone creature that can animate and hurl deadly rock shards at heroes, with damage based on their current strength.",
      image: "gargoyle.png",
      vulnerabilities: ["magic"],
      resistances: ["physical", "bladed"],
      rollEffects: {
        1: "Deal 2 damage to the Hero*.",
        2: "",
        3: "Deal 2 damage to the party.",
        4: "",
        5: "Deal 5 damage to the Hero*.",
        6: "Rock Solid: Become immune for one turn; any roll damage taken is reflected (mark by tapping).",
      },
    },
    {
      name: "Cursed Knight",
      rank: RANKS.KING,
      health: 13,
      goldMultiplier: 0,
      minGold: 30,
      special:
        "Accursed Arsenal: Picks up a stronger weapon (taps), dealing extra damage per attached card.",
      specialIcon: "⚔️",
      description:
        "A once-noble warrior corrupted by dark magic, who wields an arsenal of cursed weapons that grow stronger throughout combat.",
      image: "cursed_knight.png",
      vulnerabilities: ["holy"],
      resistances: ["shadow", "physical"],
      rollEffects: {
        1: "Deal 1 damage to the Hero*.",
        2: "Deal 2 damage to the Hero*.",
        3: "Deal 3 damage to the Hero*.",
        4: "Deal 2 damage to the party.",
        5: "Deal 4 damage to the Hero* and heal self for 3.",
        6: "Clashing Steel: Steal an attached card from the Hero* and deal 3 damage.",
      },
    },
    {
      name: "Minotaur",
      rank: RANKS.KING,
      health: 15,
      goldMultiplier: 0,
      minGold: 40,
      special:
        "Maze Guardian: When health drops to 7 or below, enter rage (+2 to all rolls and +1 damage; can rage again at 11, tracked by tapping).",
      specialIcon: "🐂",
      description:
        "A powerful bull-headed creature that becomes increasingly enraged as it takes damage, growing stronger at low health levels.",
      image: "minotaur.png",
      vulnerabilities: ["mental"],
      resistances: ["physical", "blunt"],
      rollEffects: {
        1: "Deal 3 damage to the party member with the most health.",
        2: "Regenerate 4 health.",
        3: "",
        4: "Deal 2 damage to the party.",
        5: "Deal 3 damage to the party.",
        6: "Savage Onslaught: Deal 6 damage to the Hero* and take 3 damage.",
      },
    },
    {
      name: "Chimera",
      rank: RANKS.KING,
      health: 16,
      goldMultiplier: 0,
      minGold: 45,
      special:
        "Hybrid Might: Uses three \"heads\": Goat's Head (1–2): Discards the Hero's attached card. Lion's Head (3–4): Attacks for 5 damage. Scorpid Tail (5–6): Stings the Hero (next roll is missed, tracked by 🟡).",
      specialIcon: "🦁",
      description:
        "A fearsome hybrid creature with multiple heads that each possess different attack methods and abilities.",
      image: "chimera.png",
      vulnerabilities: ["none"],
      resistances: ["varied"],
      rollEffects: {
        1: "Deal 2 damage to the highest-health Hero and 1 to others.",
        2: "",
        3: "",
        4: "Deal 2 damage to the party.",
        5: "Deal 5 damage to the Hero*.",
        6: "Blood Trail: Attempt to execute a target at or below 7 health (if none, deal 5 damage to the lowest-health target). Roll even to evade.",
      },
    },
  ],
  ace: [
    {
      name: "Ember Drake",
      rank: RANKS.ACE,
      health: 15,
      goldMultiplier: 0,
      minGold: 45,
      special:
        "Flame On: Taps to be engulfed in flames; all roll damage increases by 1. Matches reflect accordingly.",
      specialIcon: "🔥",
      description:
        "A young dragon that can engulf itself in flames, increasing all damage dealt and reflecting damage to attackers.",
      image: "ember_drake.png",
      vulnerabilities: ["water"],
      resistances: ["fire", "physical"],
      rollEffects: {
        1: "Deal 1 damage to the party.",
        2: "Deal 2 damage to the party.",
        3: "Deal 3 damage to the party.",
        4: "Deal 5 damage to the Hero*.",
        5: "Deal 6 damage to the Hero*; if the roll is even, spread damage evenly to the party.",
        6: "Inferno: Burn all attached cards (they become tapped and cannot match). For each attached card, the Hero takes 3 damage.",
      },
    },
    {
      name: "Frost Wyrm",
      rank: RANKS.ACE,
      health: 16,
      goldMultiplier: 0,
      minGold: 45,
      special:
        "Glacial Freeze: Freezes the battlefield; roots Heroes (tracked by 🟡). Rooted Heroes must roll 3–6 to break free; failure causes damage. If in a Frozen Tomb, take 4 damage.",
      specialIcon: "❄️",
      description:
        "An ancient ice dragon that can freeze heroes in place and trap them in ice tombs that deal continuous damage.",
      image: "frost_wyrm.png",
      vulnerabilities: ["fire"],
      resistances: ["cold", "water"],
      rollEffects: {
        1: "Deal 2 damage to the Hero*.",
        2: "Deal 2 damage to the Hero* and 1 damage to others.",
        3: "Deal 4 damage to the Hero*.",
        4: "Deal 3 damage to the Hero* and 2 damage to others.",
        5: "Deal 4 damage to rooted (🟡) Heroes.",
        6: "Frozen Tomb: Hero* is trapped in ice (immobilized, taking 6 damage). Must roll 5–6 next turn to break free (tracked by tapping diagonally).",
      },
    },
    {
      name: "Nano Prototype",
      rank: RANKS.ACE,
      health: 17,
      goldMultiplier: 0,
      minGold: 50,
      special:
        "Nano Overload: Nanobots flare up and add extra damage. If a Hero doesn't already have a nanobot, they take 6 damage; if they do, different effects occur.",
      specialIcon: "⚙️",
      description:
        "An advanced mechanical construct that can infect heroes with nanobots, causing varied and escalating damage over time.",
      image: "nano_prototype.png",
      vulnerabilities: ["lightning"],
      resistances: ["physical", "poison"],
      rollEffects: {
        1: "Deal 2 damage to the Hero*; attach a nanobot (tracked by 🟡) if they don't already have one.",
        2: "Deal 3 damage to the Hero*.",
        3: "If the Hero has a nanobot, deal 5 damage; otherwise, 2 damage.",
        4: "Attach a nanobot to ALL Heroes (tracked by 🟡). If already attached, deal 2 damage.",
        5: "Any Hero with a nanobot: tap their attached card and take 3 damage.",
        6: "Auto-repair Bot: All nanobots return (remove 🟡), healing Nano Prototype (amount varies by count: 2/5/9).",
      },
    },
    {
      name: "Laser Turret",
      rank: RANKS.ACE,
      health: 15,
      goldMultiplier: 0,
      minGold: 55,
      special:
        "Melting Beam: Deals 7 damage if the Hero* is below half health; otherwise, 5 damage.",
      specialIcon: "🔫",
      description:
        "A high-tech weapon system that can target the party's weak points and overcharge its attacks for devastating damage.",
      image: "laser_turret.png",
      vulnerabilities: ["emp", "water"],
      resistances: ["physical", "energy"],
      rollEffects: {
        1: "Deal 4 damage to the highest-health Hero; disables Retargeting Protocol.",
        2: "Deal 3 damage to the Hero*; if odd, fires double lasers.",
        3: "Regenerate 3 health.",
        4: "Overcharge next attack (tap). Next damage roll is doubled; if already overcharged, do nothing.",
        5: "Lock onto target with highest/lowest health; deal 5 damage.",
        6: "Retargeting Protocol: Enables retargeting to the lowest-health Hero until disabled; if already enabled, deal 6 damage to the Hero*.",
      },
    },
  ],
  boss: [
    {
      name: "Behemoth",
      rank: "Boss",
      health: 20,
      goldMultiplier: 0,
      minGold: 75,
      special:
        "Overpowering Presence: Roll twice with reduced effect; all damage is reduced by 1. A roll of 6 increases the execution range to 10.",
      specialIcon: "🦣",
      description:
        "A gigantic creature of incredible strength that can crush heroes with raw power and execute weakened targets.",
      image: "behemoth.png",
      vulnerabilities: ["agility"],
      resistances: ["physical", "brute"],
      rollEffects: {
        1: "Deal 3 damage to the party.",
        2: "",
        3: "Deal 6 damage to the Hero*.",
        4: "Do nothing.",
        5: "Deal 5 damage to the lowest-health party member and 1 damage to all others.",
        6: "Colossal Wrath: Crush all party members below 7 health (instant death) or deal 7 damage to the Hero with highest/lowest health.",
      },
    },
    {
      name: "Cyclops",
      rank: "Boss",
      health: 17,
      goldMultiplier: 0,
      minGold: 75,
      special:
        "One Eyed Freak: Fix its eye on the next-turn Hero (tracked by 🟡); all further damage rolls targeting the party deal double damage to that Hero.",
      specialIcon: "👁️",
      description:
        "A towering humanoid with a single eye that can focus its gaze on specific heroes, dealing devastating targeted damage.",
      image: "cyclops.png",
      vulnerabilities: ["eye attacks"],
      resistances: ["blunt", "physical"],
      rollEffects: {
        1: "Deal 2 damage to the party.",
        2: "Deal 3 damage to the party.",
        3: "",
        4: "Deal 4 damage to the party.",
        5: "Deal 6 damage to the Hero*.",
        6: "Laser: Fire a beam dealing 8 damage unless the Hero rolls even to dodge.",
      },
    },
    {
      name: "Dragon",
      rank: "Boss",
      health: 18,
      goldMultiplier: 0,
      minGold: 80,
      special:
        "Fire Breath: The current Hero and the next Hero get caught in flames (6 and 5 damage respectively).",
      specialIcon: "🐉",
      description:
        "A majestic and terrifying dragon that can breathe devastating fire and buffet heroes with powerful wings.",
      image: "dragon.png",
      vulnerabilities: ["ice"],
      resistances: ["fire", "physical"],
      rollEffects: {
        1: "Deal 2 damage to the party.",
        2: "Deal 5 damage to the Hero*.",
        3: "",
        4: "Deal 7 damage to the lowest-health party member.",
        5: "Deal 9 damage to the highest-health party member.",
        6: "Wind Buffet: The Dragon flaps its wings, tapping all attached cards. Deal 3 damage + 1 extra per attached card to all Heroes. Next 6 rolls deal 4 damage to the party.",
      },
    },
    {
      name: "Titan",
      rank: "Boss",
      health: 19,
      goldMultiplier: 0,
      minGold: 70,
      special:
        "Unyielding Strength: When Titan's health drops below half, it enrages. All rolls then deal extra damage and heal Titan for 2.",
      specialIcon: "👹",
      description:
        "A colossal humanoid of ancient power that grows stronger as it takes damage, capable of devastating physical attacks.",
      image: "titan.png",
      vulnerabilities: ["magic"],
      resistances: ["physical", "elemental"],
      rollEffects: {
        1: "Deal 3 damage to the Hero*.",
        2: "",
        3: "Deal 4 damage to the Hero* and 2 damage to the rest of the party.",
        4: "Deal 4 damage to the Hero* (8 if enraged).",
        5: "Heal for (double the roll) +2 (up to a max of 8).",
        6: "Titan's Grip: Grab and shake the Hero*, dealing 6 damage and causing their next roll to be skipped.",
      },
    },
    {
      name: "Apexus, the Astral Overlord",
      rank: "Final Boss",
      health: 25,
      goldMultiplier: 0,
      minGold: 100,
      special:
        "Cosmic Dominion: Each turn, Apexus gains a stack of Cosmic Power (🌟). At 3 stacks, unleashes Supernova (10 damage to all heroes, then resets stacks).",
      specialIcon: "🌌",
      description:
        "The final boss of the Astral Spire, a godlike entity that wields cosmic power and threatens to destroy the entire realm if not stopped.",
      image: "apexus.png",
      vulnerabilities: ["sacred weapons"],
      resistances: ["all standard damage types"],
      rollEffects: {
        1: "Deal 4 damage to all heroes.",
        2: "Cosmic Shift: Randomly swap all heroes' attached cards and deal 3 damage to each.",
        3: "Star Fall: Deal 5 damage to two random heroes.",
        4: "Reality Warp: Disable all heroes' abilities for 1 turn and deal 2 damage to each.",
        5: "Gravitational Pull: Draw all heroes' attached cards to Apexus (max 5 total) and deal 3 damage per card stolen.",
        6: "Dimensional Collapse: All heroes with less than 10 health must roll a 5+ or be instantly defeated. Others take 8 damage.",
      },
    },
  ],
};

// Initial tier structure
export const TIERS = {
  1: [
    "diamond",
    "club",
    "club",
    "heart",
    ["spade", "heart"],
    "diamond",
    "club",
    "spade",
    "heart",
    "spade+",
    "diamond",
  ],
  2: [
    "club",
    "spade",
    "diamond",
    "heart",
    "club",
    "club",
    "diamond",
    "club",
    "heart",
    ["spade", "spade", "heart"],
    "diamond",
    "spade+",
    "diamond",
  ],
  3: [
    "spade",
    "spade",
    "heart",
    "diamond",
    [
      "spade",
      "spade+",
      "heart",
      "club",
      "diamond",
      "spade",
      "club",
      "spade",
      "heart",
      "club",
      ["diamond", "heart"],
    ],
    "spade+",
    "diamond",
    "heart",
    "final_boss",
  ],
};

// Merchant shop items with detailed metadata
export const SHOP_ITEMS = {
  health: [
    {
      id: "minor_potion",
      name: "Minor Health Potion [mHP]",
      description:
        "Heals 12 health. Use on your turn (costs your roll). Usable between rooms.",
      price: 40,
      icon: "🧪",
      category: "health",
      rarity: "common",
      effect: "Restore 12 health to a hero.",
      useLocation: ["combat", "spire"],
      limitPerInventory: 0,
    },
    {
      id: "major_potion",
      name: "Major Health Potion [MHP]",
      description:
        "Fully heals a Hero. Use on your turn (costs your roll). Usable between rooms.",
      price: 70,
      icon: "🧪",
      category: "health",
      rarity: "uncommon",
      effect: "Fully restore a hero's health.",
      useLocation: ["combat", "spire"],
      limitPerInventory: 0,
    },
    {
      id: "guardian_angel",
      name: "Guardian Angel [GA]",
      description:
        "If a Hero dies in combat, they are instantly resurrected with half max health.",
      price: 125,
      icon: "👼",
      category: "health",
      rarity: "rare",
      effect: "Auto-revive a hero upon death with half health.",
      useLocation: ["combat"],
      limitPerInventory: 2,
    },
  ],
  consumables: [
    {
      id: "lucky_charm",
      name: "Lucky Charm [LC]",
      description:
        "Skip a table tier for Spade room rewards. Limit: 1 per inventory.",
      price: 42,
      icon: "🍀",
      category: "consumable",
      rarity: "uncommon",
      effect: "Improves reward rolls in Spade rooms.",
      useLocation: ["spire"],
      limitPerInventory: 1,
    },
    {
      id: "mystic_rune",
      name: "Mystic Rune [MR]",
      description: "Activate the Hero's spec ability. Limit: 2 per inventory.",
      price: 50,
      icon: "🔯",
      category: "consumable",
      rarity: "uncommon",
      effect: "Manually trigger hero specialization ability.",
      useLocation: ["combat"],
      limitPerInventory: 2,
    },
    {
      id: "ability_blocker",
      name: "Ability Blocker [AB]",
      description:
        "Negates a monster's special effect (one-time use). Limit: 1 per inventory.",
      price: 65,
      icon: "🛡️",
      category: "consumable",
      rarity: "rare",
      effect: "Block a monster's special ability once.",
      useLocation: ["combat"],
      limitPerInventory: 1,
    },
    {
      id: "scroll_revival",
      name: "Scroll of Revival [SoR]",
      description:
        "Revives a Hero to half health (rounded up). Only usable between rooms. Limit: 2 per inventory.",
      price: 80,
      icon: "📜",
      category: "consumable",
      rarity: "rare",
      effect: "Revive a fallen hero outside of combat.",
      useLocation: ["spire"],
      limitPerInventory: 2,
    },
  ],
  gear: [
    {
      id: "amulet_nullification",
      name: "Amulet of Nullification [AoN]",
      description:
        "Negates a monster's special effect once per combat. Limit: 1 per party.",
      price: 110,
      icon: "📿",
      category: "gear",
      rarity: "epic",
      effect: "Block a monster's special ability once per combat.",
      useLocation: ["combat"],
      limitPerInventory: 1,
      limitPerParty: 1,
    },
    {
      id: "permanent_attached_card",
      name: "Permanent Attached Card [PAC]",
      description:
        "Flip the next Peon card and attach it to a Hero (remains post-combat). Limit: 1 per Hero.",
      price: 50,
      icon: "🃏",
      category: "gear",
      rarity: "uncommon",
      effect: "Permanently attach a Peon card to a hero.",
      useLocation: ["spire"],
      limitPerHero: 1,
    },
    {
      id: "fortune_amulet",
      name: "Fortune Amulet [FA]",
      description: "Gain +15 gold after each combat. Limit: 1 per party.",
      price: 130,
      icon: "💰",
      category: "gear",
      rarity: "rare",
      effect: "Provides bonus gold after every combat.",
      useLocation: ["passive"],
      limitPerParty: 1,
    },
    {
      id: "divine_protection",
      name: "Divine Protection [DP]",
      description:
        "Prevent the first 2 damage from every monster attack. Limit: 1 per hero.",
      price: 95,
      icon: "🛡️",
      category: "gear",
      rarity: "rare",
      effect: "Reduces all incoming damage by 2.",
      useLocation: ["passive"],
      limitPerHero: 1,
    },
  ],
};

// Achievement system
export const ACHIEVEMENTS = {
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

// Heart room effects
export const HEART_ROOM_EFFECTS = [
  {
    id: "heal_all",
    title: "Full Restoration",
    description: "Fully restore all Heroes' health.",
    icon: "❤️",
    effect: "restoreAll",
  },
  {
    id: "revive_one",
    title: "Revive Champion",
    description:
      "Revive one fallen Hero at half max health and add +5 health to others.",
    icon: "⚕️",
    effect: "reviveOneBoostOthers",
  },
  {
    id: "revive_two",
    title: "Mass Revival",
    description: "Revive two fallen Heroes at half max health (rounded down).",
    icon: "✝️",
    effect: "reviveTwo",
  },
  {
    id: "increase_max",
    title: "Vitality Blessing",
    description:
      "Increase all Heroes' max health to 20 (and heal the difference).",
    icon: "💪",
    effect: "increaseMaxHealth",
  },
  {
    id: "gold_blessing",
    title: "Fortune's Favor",
    description: "Gain gold based on a d20 roll × 10 (minimum 100g).",
    icon: "💰",
    effect: "goldBonus",
  },
  {
    id: "roll_buff",
    title: "Cosmic Attunement",
    description: "Permanently buff all die rolls by +1 (limit once).",
    icon: "🎲",
    effect: "buffRolls",
  },
];
