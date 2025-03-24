import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip";
import PlaceholderUtils from "./PlaceholderUtils";

// Mock data for shop items (would be imported from GameContext in real implementation)
const SHOP_ITEMS = {
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
      id: "heal_max",
      name: "Full Healing [FH]",
      description: "Merchant completely heals a hero on the spot.",
      price: 50,
      icon: "❤️",
      category: "health",
      rarity: "service",
      effect: "Fully restore a hero's health immediately.",
      useLocation: ["merchant"],
      requiresTarget: true,
      limitPerVisit: 1,
    },
    {
      id: "revive_half",
      name: "Revive Service (Half) [RS½]",
      description:
        "Merchant revives a fallen hero with half health (rounded up).",
      price: 85,
      icon: "💫",
      category: "health",
      rarity: "service",
      effect: "Revive a fallen hero with half health.",
      useLocation: ["merchant"],
      requiresTarget: true,
      limitPerVisit: 1,
    },
    {
      id: "revive_full",
      name: "Revive Service (Full) [RSF]",
      description: "Merchant revives a fallen hero with full health.",
      price: 125,
      icon: "✨",
      category: "health",
      rarity: "service",
      effect: "Revive a fallen hero with full health.",
      useLocation: ["merchant"],
      requiresTarget: true,
      limitPerVisit: 1,
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
    {
      id: "health_boost",
      name: "Health Boost [HB]",
      description: "Adds +5 health to all heroes immediately.",
      price: 60,
      icon: "💗",
      category: "health",
      rarity: "service",
      effect: "All heroes gain +5 health (up to their maximum).",
      useLocation: ["merchant"],
      limitPerVisit: 1,
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
    {
      id: "toxic_scroll",
      name: "Toxic Scroll [TS]",
      description: "Apply the Toxic enchantment to any weapon.",
      price: 35,
      icon: "☣️",
      category: "consumable",
      rarity: "uncommon",
      effect: "Apply Toxic enchantment to a weapon.",
      useLocation: ["spire"],
      limitPerInventory: 1,
    },
    {
      id: "fiery_scroll",
      name: "Fiery Scroll [FS]",
      description: "Apply the Fiery enchantment to any weapon.",
      price: 55,
      icon: "🔥",
      category: "consumable",
      rarity: "uncommon",
      effect: "Apply Fiery enchantment to a weapon.",
      useLocation: ["spire"],
      limitPerInventory: 1,
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
      requiresTarget: true,
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

// Mock enchantments data
const ENCHANTMENTS = {
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

// Create placeholder images as we don't have access to the actual asset files
const createPlaceholder = (text, width = 200, height = 200) => {
  return PlaceholderUtils.createPlaceholder(text, width, height);
};

// Sample weapon rarities
const WEAPON_RARITIES = ["common", "rare", "epic", "legendary"];

const Merchant = ({ gameData = {}, onComplete, playSound }) => {
  // Use default mock data if gameData isn't provided
  const defaultGameData = {
    heroes: [
      {
        id: 1,
        class: "Bladedancer",
        specialization: "Shadowblade",
        health: 14,
        maxHealth: 17,
        weapon: {
          name: "Serpent's Kiss",
          rarity: "common",
          icon: "🗡️",
        },
      },
      {
        id: 2,
        class: "Manipulator",
        specialization: "Timebender",
        health: 12,
        maxHealth: 17,
        weapon: null,
      },
      {
        id: 3,
        class: "Guardian",
        specialization: "Sentinel",
        health: 0, // Fallen hero
        maxHealth: 18,
        weapon: {
          name: "Stargazer Spear",
          rarity: "common",
          enchant: "fiery",
        },
      },
    ],
    gold: 150,
    inventory: [
      {
        id: "minor_potion",
        name: "Minor Health Potion",
        icon: "🧪",
        type: "potion",
      },
      {
        id: "mystic_rune",
        name: "Mystic Rune",
        icon: "🔯",
        type: "consumable",
      },
    ],
    currentTier: 1,
  };

  const data = Object.keys(gameData).length > 0 ? gameData : defaultGameData;

  const [selectedTab, setSelectedTab] = useState("health");
  const [selectedItem, setSelectedItem] = useState(null);
  const [targetHero, setTargetHero] = useState(null);
  const [message, setMessage] = useState(
    "Welcome to the Merchant! What would you like to purchase?"
  );
  const [gold, setGold] = useState(data.gold);
  const [inventory, setInventory] = useState([...data.inventory]);
  const [heroes, setHeroes] = useState([...data.heroes]);
  const [merchantItems, setMerchantItems] = useState({});
  const [purchaseState, setPurchaseState] = useState("browsing"); // browsing, selecting_hero, confirming, purchased
  const [showItemDetail, setShowItemDetail] = useState(null);
  const [shopkeeperDialogue, setShopkeeperDialogue] = useState(
    getRandomDialogue()
  );
  const [showDialogue, setShowDialogue] = useState(true);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [weaponForgeOpen, setWeaponForgeOpen] = useState(false);
  const [forgeHero, setForgeHero] = useState(null);
  const [forgeUpgrade, setForgeUpgrade] = useState(null);
  const [showEnchantment, setShowEnchantment] = useState(false);
  const [selectedEnchantment, setSelectedEnchantment] = useState(null);
  const [purchaseEffect, setPurchaseEffect] = useState(null);
  const [itemsBoughtCount, setItemsBoughtCount] = useState(0);

  // Create placeholder images
  const shopkeeperImg = createPlaceholder("Shopkeeper", 200, 300);
  const shopCounterImg = createPlaceholder("Shop Counter", 400, 100);
  const goldCoinImg = createPlaceholder("Gold Coin", 30, 30);
  const forgeImg = createPlaceholder("Forge", 300, 200);
  const merchantBgImg = createPlaceholder("Merchant Background", 1200, 800);

  // Define shopkeeper dialogues
  function getRandomDialogue() {
    const dialogues = [
      "Welcome to my shop, travelers! Take your time browsing my wares.",
      "Ah, customers from the lower spire! I have everything you need for your ascent.",
      "Weapons, potions, enchantments - I've got it all, for the right price of course!",
      "Gold well spent is better than gold well kept, especially in these dangerous times.",
      "My items are of the finest quality - straight from the Astral Forges!",
      "Need something to give you an edge against the monsters? You've come to the right place!",
      "Buy now or regret later when you're facing Apexus with inferior equipment!",
    ];

    return dialogues[Math.floor(Math.random() * dialogues.length)];
  }

  // Initialize when component mounts
  useEffect(() => {
    // Customize merchant inventory based on current tier
    initializeMerchantInventory();

    // Change dialogue periodically
    const dialogueInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        // 30% chance to change dialogue
        setShopkeeperDialogue(getRandomDialogue());
        setShowDialogue(true);

        // Hide dialogue after a few seconds
        setTimeout(() => {
          setShowDialogue(false);
        }, 5000);
      }
    }, 10000);

    return () => clearInterval(dialogueInterval);
  }, []);

  // Initialize merchant inventory based on current tier
  const initializeMerchantInventory = () => {
    // Create a copy of all shop items
    const allItems = { ...SHOP_ITEMS };
    const tierItems = {};

    // Process each category
    Object.keys(allItems).forEach((category) => {
      // Filter items based on tier
      tierItems[category] = allItems[category].filter((item) => {
        // Check tier restrictions
        if (item.minTier && item.minTier > data.currentTier) {
          return false;
        }

        // Check for inventory limits
        if (item.limitPerInventory > 0) {
          const countInInventory = inventory.filter(
            (invItem) => invItem.id === item.id
          ).length;
          if (countInInventory >= item.limitPerInventory) {
            return false;
          }
        }

        // Check for party limits
        if (item.limitPerParty > 0) {
          const countInInventory = inventory.filter(
            (invItem) => invItem.id === item.id
          ).length;
          if (countInInventory >= item.limitPerParty) {
            return false;
          }
        }

        return true;
      });
    });

    // Add weapons based on tier
    tierItems.weapons = [];

    // Common weapons always available
    tierItems.weapons.push({
      id: "common_weapon",
      name: "Common Weapon",
      description: "A basic weapon suited for your class.",
      price: 65,
      icon: "⚔️",
      category: "weapon",
      rarity: "common",
      requiresTarget: true,
    });

    // Rare weapons always available
    tierItems.weapons.push({
      id: "rare_weapon",
      name: "Rare Weapon",
      description: "A powerful weapon with special abilities.",
      price: 150,
      icon: "🗡️",
      category: "weapon",
      rarity: "rare",
      requiresTarget: true,
    });

    // Epic weapons available from tier 2+
    if (data.currentTier >= 2) {
      tierItems.weapons.push({
        id: "epic_weapon",
        name: "Epic Weapon",
        description: "An extraordinary weapon with powerful abilities.",
        price: 200,
        icon: "🔱",
        category: "weapon",
        rarity: "epic",
        requiresTarget: true,
      });
    }

    // Legendary weapons available from tier 3+
    if (data.currentTier >= 3) {
      tierItems.weapons.push({
        id: "legendary_weapon",
        name: "Legendary Weapon",
        description: "A legendary weapon of unsurpassed power.",
        price: 257,
        icon: "⚡",
        category: "weapon",
        rarity: "legendary",
        requiresTarget: true,
      });
    }

    // Weapon upgrades
    tierItems.upgrades = [
      {
        id: "weapon_upgrade",
        name: "Weapon Upgrade",
        description: "Upgrade your weapon to the next rarity level.",
        price: 85,
        icon: "🔨",
        category: "upgrade",
        requiresTarget: true,
      },
    ];

    // Enchantments
    tierItems.enchants = Object.keys(ENCHANTMENTS).map((key) => ({
      id: `${key}_enchant`,
      name: ENCHANTMENTS[key].name,
      description: ENCHANTMENTS[key].effect,
      price: getEnchantPrice(key),
      icon: ENCHANTMENTS[key].icon,
      category: "enchant",
      enchantType: key,
      requiresTarget: true,
    }));

    setMerchantItems(tierItems);
  };

  // Calculate upgrade price based on current weapon rarity
  const calculateUpgradePrice = (currentRarity) => {
    switch (currentRarity) {
      case "common":
        return 85;
      case "rare":
        return 120;
      case "epic":
        return 180;
      default:
        return 85;
    }
  };

  // Get price for enchantment
  const getEnchantPrice = (enchantType) => {
    switch (enchantType) {
      case "crusader":
        return 75;
      case "fiery":
        return 50;
      case "toxic":
        return 30;
      case "fortune":
        return 65;
      case "noxious":
        return 40;
      default:
        return 50;
    }
  };

  // Toggle tab selection
  const handleTabClick = (tab) => {
    // Play sound
    if (playSound) playSound();

    setSelectedTab(tab);

    // Reset selection state
    setSelectedItem(null);
    setTargetHero(null);
    setPurchaseState("browsing");

    // Update message based on tab
    switch (tab) {
      case "health":
        setMessage(
          "Health potions and services to keep your heroes fighting fit!"
        );
        break;
      case "consumables":
        setMessage("One-time use items that can turn the tide of battle!");
        break;
      case "gear":
        setMessage("Permanent equipment to enhance your heroes' abilities!");
        break;
      case "weapons":
        setMessage("Powerful weapons for inflicting damage on your enemies!");
        break;
      case "enchants":
        setMessage("Magical enchantments to enhance your weapons!");
        break;
      case "upgrades":
        setMessage("Upgrade your existing weapons to greater power!");
        break;
      default:
        setMessage("Welcome to the Merchant! What would you like to purchase?");
    }
  };

  // Select an item to purchase
  const selectItem = (item) => {
    // Play sound
    if (playSound) playSound();

    // Skip if disabled
    if (item.disabled) {
      setMessage(
        `${item.name} is not available until Tier ${item.minTier || 2}.`
      );
      return;
    }

    // Check if can afford
    if (item.price > gold) {
      setMessage(`You cannot afford ${item.name} (${item.price}g).`);

      // Update shopkeeper dialogue
      setShopkeeperDialogue(
        "Sorry, friend. No gold, no goods! Come back when you're a bit richer."
      );
      setShowDialogue(true);

      // Hide dialogue after a few seconds
      setTimeout(() => {
        setShowDialogue(false);
      }, 4000);

      return;
    }

    setSelectedItem(item);

    // If item requires a target, prompt for hero selection
    if (item.requiresTarget) {
      setPurchaseState("selecting_hero");
      setMessage(`Select a hero to receive ${item.name}.`);
    } else {
      // If no target required, go to purchase confirmation
      setPurchaseState("confirming");
      setMessage(`Confirm purchase of ${item.name} for ${item.price} gold?`);
    }
  };

  // Select a hero as target for the item
  const selectHero = (hero) => {
    // Play sound
    if (playSound) playSound();

    if (!selectedItem) return;

    // For weapon upgrades, check if hero has a weapon
    if (selectedItem.category === "upgrade" && !hero.weapon) {
      setMessage(`${hero.class} doesn't have a weapon to upgrade!`);
      return;
    }

    // For weapon upgrades, check if weapon can be upgraded further
    if (selectedItem.category === "upgrade" && hero.weapon) {
      if (hero.weapon.rarity === "legendary") {
        setMessage(
          `${hero.class}'s ${hero.weapon.name} is already Legendary and cannot be upgraded further.`
        );
        return;
      }

      // Check tier restrictions
      if (hero.weapon.rarity === "epic" && data.currentTier < 3) {
        setMessage(`Epic weapons can only be upgraded to Legendary in Tier 3.`);
        return;
      }

      if (hero.weapon.rarity === "rare" && data.currentTier < 2) {
        setMessage(
          `Rare weapons can only be upgraded to Epic in Tier 2 or higher.`
        );
        return;
      }

      // Open the forge for upgrades
      setForgeHero(hero);
      setForgeUpgrade({
        from: hero.weapon.rarity,
        to: getNextRarity(hero.weapon.rarity),
        price: calculateUpgradePrice(hero.weapon.rarity),
      });
      setWeaponForgeOpen(true);
      return;
    }

    // For enchantments, check if hero has a weapon
    if (selectedItem.category === "enchant" && !hero.weapon) {
      setMessage(`${hero.class} doesn't have a weapon to enchant!`);
      return;
    }

    setTargetHero(hero);
    setPurchaseState("confirming");

    // Update message based on item type
    if (selectedItem.category === "weapon") {
      setMessage(
        `Equip ${hero.class} with ${selectedItem.name} for ${selectedItem.price} gold?`
      );
    } else if (selectedItem.category === "enchant") {
      setMessage(
        `Apply ${selectedItem.name} to ${hero.class}'s ${hero.weapon.name} for ${selectedItem.price} gold?`
      );
      // Show enchantment preview
      setSelectedEnchantment(selectedItem.enchantType);
      setShowEnchantment(true);
    } else {
      setMessage(
        `Give ${selectedItem.name} to ${hero.class} for ${selectedItem.price} gold?`
      );
    }
  };

  // Get next rarity level
  const getNextRarity = (currentRarity) => {
    const rarityIndex = WEAPON_RARITIES.indexOf(currentRarity);
    if (rarityIndex < WEAPON_RARITIES.length - 1) {
      return WEAPON_RARITIES[rarityIndex + 1];
    }
    return currentRarity;
  };

  // Complete the purchase
  const purchaseItem = () => {
    // Play purchase sound
    if (playSound) playSound();

    // Deduct gold
    setGold(gold - selectedItem.price);

    // Apply item effect
    if (targetHero) {
      applyItemEffect(selectedItem, targetHero);
    } else {
      applyItemEffect(selectedItem);
    }

    // Add to transaction history
    setTransactionHistory([
      ...transactionHistory,
      {
        item: selectedItem.name,
        price: selectedItem.price,
        target: targetHero ? targetHero.class : null,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    // Show purchase effect
    setPurchaseEffect({
      type: selectedItem.category,
      name: selectedItem.name,
      target: targetHero ? targetHero.class : null,
    });

    setTimeout(() => {
      setPurchaseEffect(null);
    }, 2000);

    // Update shopkeeper dialogue
    const purchaseResponses = [
      "Excellent choice! It will serve you well in your ascent.",
      "A fine purchase indeed! Enjoy your new acquisition.",
      "Thank you for your business! Would you like to see anything else?",
      "Money well spent! That will certainly aid you against the monsters above.",
      "A discerning customer! I can see you have taste.",
    ];

    setShopkeeperDialogue(
      purchaseResponses[Math.floor(Math.random() * purchaseResponses.length)]
    );
    setShowDialogue(true);

    // Hide dialogue after a few seconds
    setTimeout(() => {
      setShowDialogue(false);
    }, 3000);

    // Reset purchase state
    setPurchaseState("browsing");
    setSelectedItem(null);
    setTargetHero(null);
    setShowEnchantment(false);
    setItemsBoughtCount((prev) => prev + 1);

    // Random chance for special deals after multiple purchases
    if (itemsBoughtCount >= 2 && Math.random() > 0.7) {
      setTimeout(() => {
        setShopkeeperDialogue(
          "Since you're such a good customer, I might have some special items for you next time you visit!"
        );
        setShowDialogue(true);

        setTimeout(() => {
          setShowDialogue(false);
        }, 4000);
      }, 3500);
    }
  };

  // Cancel the purchase
  const cancelPurchase = () => {
    // Play sound
    if (playSound) playSound();

    if (purchaseState === "selecting_hero") {
      // Return to browsing
      setPurchaseState("browsing");
      setSelectedItem(null);
    } else if (purchaseState === "confirming") {
      // If was selecting hero, go back to that step
      if (selectedItem && selectedItem.requiresTarget) {
        setPurchaseState("selecting_hero");
        setTargetHero(null);
        setShowEnchantment(false);
      } else {
        // Otherwise return to browsing
        setPurchaseState("browsing");
        setSelectedItem(null);
      }
    }

    setMessage("Welcome to the Merchant! What would you like to purchase?");
  };

  // Complete the weapon forge upgrade
  const completeForgeUpgrade = () => {
    // Play forge sound
    if (playSound) playSound();

    // Deduct gold
    setGold(gold - forgeUpgrade.price);

    // Update hero's weapon
    const updatedHeroes = [...heroes];
    const heroIndex = updatedHeroes.findIndex((h) => h.id === forgeHero.id);

    if (heroIndex >= 0) {
      // Create a new upgraded weapon
      const newWeapon = {
        name: getNewWeaponName(forgeHero.class, forgeUpgrade.to),
        rarity: forgeUpgrade.to,
        // Keep the enchantment if it exists
        enchant: updatedHeroes[heroIndex].weapon?.enchant,
        icon: getWeaponIcon(forgeUpgrade.to),
      };

      updatedHeroes[heroIndex].weapon = newWeapon;
      setHeroes(updatedHeroes);

      // Add to transaction history
      setTransactionHistory([
        ...transactionHistory,
        {
          item: `Weapon Upgrade (${forgeUpgrade.from} → ${forgeUpgrade.to})`,
          price: forgeUpgrade.price,
          target: forgeHero.class,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      // Show upgrade effect
      setPurchaseEffect({
        type: "forge",
        name: `Upgraded to ${newWeapon.name}`,
        target: forgeHero.class,
      });

      setTimeout(() => {
        setPurchaseEffect(null);
      }, 2000);

      // Update message
      setMessage(
        `${forgeHero.class}'s weapon has been upgraded to ${newWeapon.name}!`
      );

      // Update shopkeeper dialogue
      setShopkeeperDialogue(
        "The forge has served you well! That weapon will strike fear into your enemies!"
      );
      setShowDialogue(true);

      // Hide dialogue after a few seconds
      setTimeout(() => {
        setShowDialogue(false);
      }, 3000);
    }

    // Close forge
    setWeaponForgeOpen(false);
    setForgeHero(null);
    setForgeUpgrade(null);
  };

  // Helper function to get a weapon name based on class and rarity
  const getNewWeaponName = (heroClass, rarity) => {
    const weaponNames = {
      Bladedancer: {
        common: "Serpent's Kiss",
        rare: "Moonshadow Shiv",
        epic: "Shadowtide Reaper",
        legendary: "Twilight's Kiss",
      },
      Manipulator: {
        common: "Astral Rod",
        rare: "Voidweaver Enigma",
        epic: "Celestial Scepter",
        legendary: "Eternity's Whisper",
      },
      Tracker: {
        common: "Longshot",
        rare: "Beast Whisperer",
        epic: "Stormcaller's Embrace",
        legendary: "Apex Predator",
      },
      Guardian: {
        common: "Stargazer Spear",
        rare: "Bulwark of Dawn",
        epic: "Astral Bulwark",
        legendary: "Divine Aegis",
      },
    };

    return weaponNames[heroClass]?.[rarity] || `${rarity} ${heroClass} Weapon`;
  };

  // Get appropriate icon for weapon rarity
  const getWeaponIcon = (rarity) => {
    switch (rarity) {
      case "common":
        return "⚔️";
      case "rare":
        return "🗡️";
      case "epic":
        return "🔱";
      case "legendary":
        return "⚡";
      default:
        return "⚔️";
    }
  };

  // Cancel the forge upgrade
  const cancelForgeUpgrade = () => {
    // Play sound
    if (playSound) playSound();

    // Close forge
    setWeaponForgeOpen(false);
    setForgeHero(null);
    setForgeUpgrade(null);

    // Reset purchase state
    setPurchaseState("browsing");
    setSelectedItem(null);
    setTargetHero(null);

    setMessage("Welcome to the Merchant! What would you like to purchase?");
  };

  // Apply an item's effect
  const applyItemEffect = (item, hero = null) => {
    // Apply different effects based on item type and category
    switch (item.category) {
      case "health":
        if (
          item.id === "minor_potion" ||
          item.id === "major_potion" ||
          item.id === "guardian_angel"
        ) {
          // Add potion to inventory
          setInventory([
            ...inventory,
            {
              id: item.id,
              name: item.name,
              type: "potion",
              icon: item.icon,
              effect: item.description,
            },
          ]);

          setMessage(`${item.name} added to inventory.`);
        } else if (item.id === "health_boost") {
          // Add health to all heroes
          const updatedHeroes = heroes.map((hero) => ({
            ...hero,
            health: Math.min(hero.maxHealth, hero.health + 5),
          }));
          setHeroes(updatedHeroes);
          setMessage("All heroes received +5 health!");
        } else if (item.id === "heal_max" && hero) {
          // Fully heal the targeted hero
          const updatedHeroes = [...heroes];
          const heroIndex = updatedHeroes.findIndex((h) => h.id === hero.id);
          if (heroIndex >= 0) {
            updatedHeroes[heroIndex].health =
              updatedHeroes[heroIndex].maxHealth;
            setHeroes(updatedHeroes);
            setMessage(`${hero.class} was fully healed!`);
          }
        } else if (
          (item.id === "revive_half" || item.id === "revive_full") &&
          hero
        ) {
          // Revive fallen hero
          const updatedHeroes = [...heroes];
          const heroIndex = updatedHeroes.findIndex((h) => h.id === hero.id);
          if (heroIndex >= 0) {
            updatedHeroes[heroIndex].health =
              item.id === "revive_half"
                ? Math.ceil(updatedHeroes[heroIndex].maxHealth / 2)
                : updatedHeroes[heroIndex].maxHealth;
            setHeroes(updatedHeroes);
            setMessage(`${hero.class} was revived!`);
          }
        }
        break;

      case "consumable":
        // Add consumable to inventory
        setInventory([
          ...inventory,
          {
            id: item.id,
            name: item.name,
            type: "consumable",
            icon: item.icon,
            effect: item.description,
          },
        ]);

        setMessage(`${item.name} added to inventory.`);
        break;

      case "gear":
        if (item.id === "permanent_attached_card" && hero) {
          // In a real implementation, would draw a card from the peon pile
          // For this demo, we'll just notify about it
          setMessage(
            `${hero.class} would receive a permanent attached card from the peon pile.`
          );
        } else {
          // Add gear to inventory
          setInventory([
            ...inventory,
            {
              id: item.id,
              name: item.name,
              type: "gear",
              icon: item.icon,
              effect: item.description,
            },
          ]);

          setMessage(`${item.name} added to inventory.`);
        }
        break;

      case "weapon":
        if (hero) {
          // Get a weapon name for the appropriate rarity and class
          const weaponName = getNewWeaponName(hero.class, item.rarity);

          // Equip the hero
          const updatedHeroes = [...heroes];
          const heroIndex = updatedHeroes.findIndex((h) => h.id === hero.id);
          if (heroIndex >= 0) {
            updatedHeroes[heroIndex].weapon = {
              name: weaponName,
              rarity: item.rarity,
              icon: getWeaponIcon(item.rarity),
            };

            setHeroes(updatedHeroes);
            setMessage(`${hero.class} equipped with ${weaponName}!`);
          }
        }
        break;

      case "enchant":
        if (hero && hero.weapon) {
          // Apply enchantment to weapon
          const updatedHeroes = [...heroes];
          const heroIndex = updatedHeroes.findIndex((h) => h.id === hero.id);
          if (heroIndex >= 0) {
            updatedHeroes[heroIndex].weapon = {
              ...updatedHeroes[heroIndex].weapon,
              enchant: item.enchantType,
            };

            setHeroes(updatedHeroes);
            setMessage(`${item.name} applied to ${hero.class}'s weapon!`);
          }
        }
        break;
    }
  };

  // Complete transaction and leave merchant
  const finishShopping = () => {
    // Play sound
    if (playSound) playSound();

    // Update game state
    if (onComplete) {
      onComplete({
        gold,
        inventory,
        heroes,
      });
    } else {
      console.log("Shopping completed:", { gold, inventory, heroes });
    }
  };

  // Show item detail
  const showItemDetails = (item) => {
    setShowItemDetail(item);
  };

  // Hide item detail
  const hideItemDetails = () => {
    setShowItemDetail(null);
  };

  // Get item action label
  const getItemActionLabel = (item) => {
    switch (item.category) {
      case "weapon":
        return "Equip";
      case "enchant":
        return "Apply";
      case "upgrade":
        return "Upgrade";
      default:
        return "Buy";
    }
  };

  return (
    <div
      className="merchant"
      style={{
        backgroundImage: `url(${merchantBgImg})`,
        padding: "20px",
        minHeight: "100vh",
        backgroundColor: "#16213e",
        color: "#e1e1e6",
        fontFamily: "Montserrat, sans-serif",
      }}
    >
      <div
        className="merchant-header"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{ margin: "0 0 10px 0", fontSize: "28px", color: "#f0c75e" }}
        >
          The Merchant
        </h2>
        <div
          className="merchant-message"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            padding: "10px 15px",
            borderRadius: "5px",
            fontSize: "16px",
            maxWidth: "800px",
            textAlign: "center",
          }}
        >
          {message}
        </div>
      </div>

      <div
        className="shop-layout"
        style={{
          display: "flex",
          gap: "20px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          className="merchant-interface"
          style={{
            flex: "3",
            backgroundColor: "rgba(22, 33, 62, 0.8)",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <div
            className="merchant-tabs"
            style={{
              display: "flex",
              borderBottom: "1px solid #2a3a5a",
            }}
          >
            {[
              "health",
              "consumables",
              "gear",
              "weapons",
              "enchants",
              "upgrades",
            ].map((tab) => (
              <button
                key={tab}
                className={`tab ${selectedTab === tab ? "active" : ""}`}
                onClick={() => handleTabClick(tab)}
                style={{
                  padding: "12px 16px",
                  backgroundColor:
                    selectedTab === tab ? "#2a3a5a" : "transparent",
                  border: "none",
                  color: selectedTab === tab ? "#f0c75e" : "#e1e1e6",
                  fontWeight: selectedTab === tab ? "bold" : "normal",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  flex: "1",
                  fontSize: "14px",
                }}
              >
                <span className="tab-icon" style={{ marginRight: "8px" }}>
                  {tab === "health"
                    ? "❤️"
                    : tab === "consumables"
                    ? "🧪"
                    : tab === "gear"
                    ? "🎒"
                    : tab === "weapons"
                    ? "⚔️"
                    : tab === "enchants"
                    ? "✨"
                    : "🔨"}
                </span>
                <span className="tab-label">
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </span>
              </button>
            ))}
          </div>

          <div
            className="merchant-items"
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {merchantItems[selectedTab] &&
            merchantItems[selectedTab].length > 0 ? (
              merchantItems[selectedTab].map((item, index) => (
                <div
                  key={index}
                  className={`merchant-item ${
                    item.disabled ? "disabled" : ""
                  } ${selectedItem === item ? "selected" : ""}`}
                  onClick={() => selectItem(item)}
                  onMouseEnter={() => showItemDetails(item)}
                  onMouseLeave={hideItemDetails}
                  style={{
                    display: "flex",
                    backgroundColor:
                      selectedItem === item
                        ? "rgba(240, 199, 94, 0.2)"
                        : "rgba(42, 58, 90, 0.5)",
                    padding: "12px",
                    borderRadius: "6px",
                    cursor: item.disabled ? "not-allowed" : "pointer",
                    opacity: item.disabled ? 0.5 : 1,
                    transition: "background-color 0.2s",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    className="item-icon"
                    style={{
                      fontSize: "24px",
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(0, 0, 0, 0.3)",
                      borderRadius: "6px",
                    }}
                  >
                    {item.icon}
                  </div>
                  <div className="item-details" style={{ flex: "1" }}>
                    <h3
                      className="item-name"
                      style={{
                        margin: "0 0 5px 0",
                        fontSize: "16px",
                        fontWeight: "bold",
                      }}
                    >
                      {item.name}
                    </h3>
                    <p
                      className="item-description"
                      style={{
                        margin: "0",
                        fontSize: "14px",
                        color: "#b8b8c0",
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                  <div
                    className="item-price"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      fontWeight: "bold",
                      color: gold >= item.price ? "#f0c75e" : "#ff5555",
                    }}
                  >
                    <span className="gold-icon" style={{ marginRight: "5px" }}>
                      💰
                    </span>
                    <span className="price-amount">{item.price}</span>
                  </div>
                </div>
              ))
            ) : (
              <div
                className="no-items-message"
                style={{
                  textAlign: "center",
                  padding: "30px",
                  color: "#8888a0",
                }}
              >
                No items available in this category
              </div>
            )}
          </div>

          {/* Shop counter with shopkeeper */}
          <div
            className="shop-counter"
            style={{
              position: "relative",
              borderTop: "1px solid #2a3a5a",
              padding: "20px",
              minHeight: "120px",
            }}
          >
            <div
              className="counter-img"
              style={{
                width: "100%",
                height: "30px",
                backgroundColor: "#2a3a5a",
                borderRadius: "5px 5px 0 0",
                position: "absolute",
                bottom: "70px",
                left: "0",
              }}
            ></div>
            <div
              className="shopkeeper"
              style={{
                position: "absolute",
                bottom: "70px",
                right: "50px",
                width: "100px",
                height: "150px",
              }}
            >
              <div
                className="shopkeeper-img"
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#4a5a7a",
                  borderRadius: "8px 8px 0 0",
                }}
              ></div>

              <AnimatePresence>
                {showDialogue && (
                  <motion.div
                    className="dialogue-bubble"
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      position: "absolute",
                      top: "-80px",
                      right: "-20px",
                      backgroundColor: "white",
                      color: "#333",
                      padding: "10px 15px",
                      borderRadius: "10px",
                      maxWidth: "250px",
                      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                      zIndex: 10,
                    }}
                  >
                    <p style={{ margin: "0", fontSize: "14px" }}>
                      {shopkeeperDialogue}
                    </p>
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-10px",
                        right: "30px",
                        width: "20px",
                        height: "20px",
                        backgroundColor: "white",
                        transform: "rotate(45deg)",
                      }}
                    ></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div
          className="merchant-sidebar"
          style={{
            flex: "1",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          <div
            className="gold-display"
            style={{
              backgroundColor: "rgba(240, 199, 94, 0.2)",
              padding: "10px 15px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              fontWeight: "bold",
              fontSize: "18px",
              color: "#f0c75e",
            }}
          >
            <span
              className="gold-icon"
              style={{ marginRight: "10px", fontSize: "24px" }}
            >
              💰
            </span>
            <span className="gold-amount">{gold}</span>
          </div>

          <div
            className="heroes-list"
            style={{
              backgroundColor: "rgba(22, 33, 62, 0.8)",
              borderRadius: "8px",
              padding: "15px",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0", fontSize: "18px" }}>Heroes</h3>
            {heroes.map((hero, index) => (
              <div
                key={index}
                className={`hero-entry ${
                  targetHero === hero ? "selected" : ""
                } ${purchaseState === "selecting_hero" ? "selectable" : ""} ${
                  hero.health <= 0 ? "fallen" : ""
                }`}
                onClick={() =>
                  purchaseState === "selecting_hero" && hero.health > 0
                    ? selectHero(hero)
                    : null
                }
                style={{
                  padding: "12px",
                  backgroundColor:
                    targetHero === hero
                      ? "rgba(240, 199, 94, 0.2)"
                      : "rgba(42, 58, 90, 0.5)",
                  marginBottom: "10px",
                  borderRadius: "6px",
                  cursor:
                    purchaseState === "selecting_hero" && hero.health > 0
                      ? "pointer"
                      : "default",
                  opacity: hero.health <= 0 ? 0.6 : 1,
                  transition: "all 0.2s",
                }}
              >
                <div
                  className="hero-header"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span className="hero-name" style={{ fontWeight: "bold" }}>
                    {hero.class}
                  </span>
                  <span
                    className="hero-health"
                    style={{
                      color:
                        hero.health <= 0
                          ? "#ff5555"
                          : hero.health < hero.maxHealth / 2
                          ? "#ffaa55"
                          : "#55ff7f",
                    }}
                  >
                    {hero.health > 0
                      ? `${hero.health}/${hero.maxHealth}`
                      : "Fallen"}
                  </span>
                </div>
                {hero.weapon && (
                  <div
                    className={`hero-weapon ${hero.weapon.rarity}`}
                    data-tooltip-id="weapon-tooltip"
                    data-tooltip-content={hero.weapon.effect}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      padding: "5px 8px",
                      backgroundColor: "rgba(0, 0, 0, 0.3)",
                      borderRadius: "4px",
                      color:
                        hero.weapon.rarity === "legendary"
                          ? "#ffaa33"
                          : hero.weapon.rarity === "epic"
                          ? "#bb55ff"
                          : hero.weapon.rarity === "rare"
                          ? "#55aaff"
                          : "#ffffff",
                    }}
                  >
                    <span className="weapon-icon">
                      {hero.weapon.icon || "⚔️"}
                    </span>
                    <span className="weapon-name">{hero.weapon.name}</span>
                    {hero.weapon.enchant && (
                      <span
                        className="weapon-enchant"
                        style={{
                          color: ENCHANTMENTS[hero.weapon.enchant]?.color,
                          marginLeft: "auto",
                        }}
                      >
                        {ENCHANTMENTS[hero.weapon.enchant]?.icon}
                      </span>
                    )}
                  </div>
                )}
                {showEnchantment && targetHero === hero && (
                  <div
                    className="enchantment-preview"
                    style={{
                      marginTop: "8px",
                      padding: "5px 8px",
                      backgroundColor: "rgba(0, 0, 0, 0.3)",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      border: `1px dashed ${
                        ENCHANTMENTS[selectedEnchantment]?.color || "#ffffff"
                      }`,
                    }}
                  >
                    <div
                      className="preview-enchant"
                      style={{
                        color: ENCHANTMENTS[selectedEnchantment]?.color,
                      }}
                    >
                      {ENCHANTMENTS[selectedEnchantment]?.icon}
                    </div>
                    <span style={{ fontSize: "12px", fontStyle: "italic" }}>
                      Preview
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div
            className="inventory-preview"
            style={{
              backgroundColor: "rgba(22, 33, 62, 0.8)",
              borderRadius: "8px",
              padding: "15px",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0", fontSize: "18px" }}>
              Inventory
            </h3>
            <div className="inventory-items">
              {inventory.length > 0 ? (
                <div
                  className="inventory-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "8px",
                  }}
                >
                  {inventory.map((item, index) => (
                    <div
                      key={index}
                      className="inventory-item"
                      data-tooltip-id="inventory-tooltip"
                      data-tooltip-content={
                        item.effect || item.description || item.name
                      }
                      style={{
                        width: "36px",
                        height: "36px",
                        backgroundColor: "rgba(42, 58, 90, 0.8)",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                      }}
                    >
                      <span className="item-icon">{item.icon}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  className="empty-inventory"
                  style={{
                    textAlign: "center",
                    color: "#8888a0",
                    padding: "10px",
                  }}
                >
                  No items in inventory
                </p>
              )}
            </div>
          </div>

          <div
            className="transaction-history"
            style={{
              backgroundColor: "rgba(22, 33, 62, 0.8)",
              borderRadius: "8px",
              padding: "15px",
              flex: "1",
              minHeight: "120px",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0", fontSize: "18px" }}>
              Recent Purchases
            </h3>
            <div className="transactions">
              {transactionHistory.length > 0 ? (
                <div
                  className="transaction-list"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {transactionHistory.slice(-3).map((transaction, index) => (
                    <div
                      key={index}
                      className="transaction-entry"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px",
                        backgroundColor: "rgba(42, 58, 90, 0.5)",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    >
                      <div className="transaction-details">
                        <span
                          className="transaction-item"
                          style={{ fontWeight: "bold" }}
                        >
                          {transaction.item}
                        </span>
                        {transaction.target && (
                          <span
                            className="transaction-target"
                            style={{
                              marginLeft: "5px",
                              fontSize: "12px",
                              color: "#b8b8c0",
                            }}
                          >
                            for {transaction.target}
                          </span>
                        )}
                      </div>
                      <div
                        className="transaction-price"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          color: "#f0c75e",
                        }}
                      >
                        <span
                          className="gold-icon"
                          style={{ marginRight: "5px" }}
                        >
                          💰
                        </span>
                        <span className="price-value">{transaction.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  className="no-transactions"
                  style={{
                    textAlign: "center",
                    color: "#8888a0",
                    padding: "10px",
                  }}
                >
                  No purchases yet
                </p>
              )}
            </div>
          </div>

          <button
            className="finish-button"
            onClick={finishShopping}
            style={{
              backgroundColor: "#f0c75e",
              color: "#16213e",
              border: "none",
              padding: "12px 20px",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <span className="button-icon">🚪</span>
            Leave Shop
          </button>
        </div>
      </div>

      {/* Purchase confirmation overlay */}
      <AnimatePresence>
        {purchaseState === "confirming" && selectedItem && (
          <motion.div
            className="purchase-confirmation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
            }}
          >
            <motion.div
              className="confirmation-card"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                backgroundColor: "#16213e",
                borderRadius: "8px",
                padding: "20px",
                width: "100%",
                maxWidth: "500px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
              }}
            >
              <h3
                style={{
                  textAlign: "center",
                  margin: "0 0 20px 0",
                  color: "#f0c75e",
                  fontSize: "24px",
                }}
              >
                Confirm Purchase
              </h3>

              <div
                className="purchase-details"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "15px",
                  margin: "20px 0",
                }}
              >
                <div
                  className="item-preview"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                  }}
                >
                  <div
                    className="preview-icon"
                    style={{
                      fontSize: "32px",
                      width: "60px",
                      height: "60px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(240, 199, 94, 0.2)",
                      borderRadius: "8px",
                    }}
                  >
                    {selectedItem.icon}
                  </div>
                  <div
                    className="preview-name"
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                    }}
                  >
                    {selectedItem.name}
                  </div>
                </div>

                {targetHero && (
                  <div
                    className="target-preview"
                    style={{
                      backgroundColor: "rgba(42, 58, 90, 0.5)",
                      padding: "10px 15px",
                      borderRadius: "6px",
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    <p style={{ margin: "0 0 10px 0" }}>
                      for {targetHero.class}
                    </p>
                    {showEnchantment && (
                      <div
                        className="enchantment-preview-large"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <div
                          className="preview-weapon"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            className="weapon-name"
                            style={{
                              padding: "5px 10px",
                              backgroundColor: "rgba(0, 0, 0, 0.3)",
                              borderRadius: "4px",
                              color:
                                targetHero.weapon.rarity === "legendary"
                                  ? "#ffaa33"
                                  : targetHero.weapon.rarity === "epic"
                                  ? "#bb55ff"
                                  : targetHero.weapon.rarity === "rare"
                                  ? "#55aaff"
                                  : "#ffffff",
                            }}
                          >
                            {targetHero.weapon.name}
                          </span>
                          <span
                            className="preview-enchant"
                            style={{
                              color: ENCHANTMENTS[selectedEnchantment]?.color,
                              fontSize: "24px",
                            }}
                          >
                            {ENCHANTMENTS[selectedEnchantment]?.icon}
                          </span>
                        </div>
                        <p
                          className="enchant-effect"
                          style={{
                            margin: "0",
                            fontSize: "14px",
                            fontStyle: "italic",
                            color: "#b8b8c0",
                          }}
                        >
                          {ENCHANTMENTS[selectedEnchantment]?.effect}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div
                  className="price-preview"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 20px",
                    backgroundColor: "rgba(240, 199, 94, 0.2)",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    fontSize: "18px",
                    color: "#f0c75e",
                  }}
                >
                  <span className="gold-icon" style={{ fontSize: "24px" }}>
                    💰
                  </span>
                  <span className="preview-price">{selectedItem.price}</span>
                </div>
              </div>

              <div
                className="confirmation-buttons"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "15px",
                  marginTop: "20px",
                }}
              >
                <button
                  className="cancel-button"
                  onClick={cancelPurchase}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "rgba(255, 85, 85, 0.2)",
                    color: "#ff5555",
                    border: "1px solid #ff5555",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "16px",
                    transition: "all 0.2s",
                  }}
                >
                  Cancel
                </button>
                <button
                  className="confirm-button"
                  onClick={purchaseItem}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#f0c75e",
                    color: "#16213e",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "16px",
                    transition: "all 0.2s",
                  }}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weapon forge overlay */}
      <AnimatePresence>
        {weaponForgeOpen && forgeHero && forgeUpgrade && (
          <motion.div
            className="forge-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
            }}
          >
            <motion.div
              className="forge-content"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                backgroundColor: "#16213e",
                borderRadius: "8px",
                padding: "20px",
                width: "100%",
                maxWidth: "600px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
              }}
            >
              <h3
                style={{
                  textAlign: "center",
                  margin: "0 0 20px 0",
                  color: "#f0c75e",
                  fontSize: "24px",
                }}
              >
                Weapon Forge
              </h3>

              <div
                className="forge-image"
                style={{
                  margin: "20px auto",
                  width: "200px",
                  height: "120px",
                  position: "relative",
                  backgroundColor: "rgba(255, 102, 0, 0.2)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div className="forge-img" style={{ fontSize: "40px" }}>
                  🔥
                </div>
                <div
                  className="forge-effects"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      "radial-gradient(circle, rgba(255,102,0,0.2) 0%, rgba(255,102,0,0) 70%)",
                    animation: "pulse 2s infinite",
                  }}
                ></div>
              </div>

              <div
                className="upgrade-details"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  margin: "30px 0",
                  gap: "20px",
                }}
              >
                <div
                  className="current-weapon"
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <h4 style={{ margin: "0 0 10px 0", color: "#b8b8c0" }}>
                    Current Weapon
                  </h4>
                  <div
                    className={`weapon-display ${forgeUpgrade.from}`}
                    style={{
                      backgroundColor: "rgba(42, 58, 90, 0.8)",
                      padding: "15px",
                      borderRadius: "6px",
                      width: "100%",
                      color:
                        forgeUpgrade.from === "legendary"
                          ? "#ffaa33"
                          : forgeUpgrade.from === "epic"
                          ? "#bb55ff"
                          : forgeUpgrade.from === "rare"
                          ? "#55aaff"
                          : "#ffffff",
                    }}
                  >
                    <div
                      className="weapon-icon"
                      style={{
                        fontSize: "26px",
                        textAlign: "center",
                        marginBottom: "10px",
                      }}
                    >
                      {forgeHero.weapon.icon || "⚔️"}
                    </div>
                    <div
                      className="weapon-info"
                      style={{ textAlign: "center" }}
                    >
                      <div
                        className="weapon-name"
                        style={{
                          fontWeight: "bold",
                          marginBottom: "5px",
                        }}
                      >
                        {forgeHero.weapon.name}
                      </div>
                      <div
                        className="weapon-rarity"
                        style={{
                          fontSize: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        {forgeUpgrade.from.toUpperCase()}
                      </div>
                    </div>
                    {forgeHero.weapon.enchant && (
                      <div
                        className="weapon-enchant"
                        style={{
                          color: ENCHANTMENTS[forgeHero.weapon.enchant]?.color,
                          textAlign: "center",
                          marginTop: "10px",
                          fontSize: "24px",
                        }}
                      >
                        {ENCHANTMENTS[forgeHero.weapon.enchant]?.icon}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className="upgrade-arrow"
                  style={{
                    fontSize: "30px",
                    color: "#f0c75e",
                  }}
                >
                  ⟶
                </div>

                <div
                  className="upgraded-weapon"
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <h4 style={{ margin: "0 0 10px 0", color: "#b8b8c0" }}>
                    After Upgrade
                  </h4>
                  <div
                    className={`weapon-display ${forgeUpgrade.to}`}
                    style={{
                      backgroundColor: "rgba(42, 58, 90, 0.8)",
                      padding: "15px",
                      borderRadius: "6px",
                      width: "100%",
                      color:
                        forgeUpgrade.to === "legendary"
                          ? "#ffaa33"
                          : forgeUpgrade.to === "epic"
                          ? "#bb55ff"
                          : forgeUpgrade.to === "rare"
                          ? "#55aaff"
                          : "#ffffff",
                      border: `1px dashed ${
                        forgeUpgrade.to === "legendary"
                          ? "#ffaa33"
                          : forgeUpgrade.to === "epic"
                          ? "#bb55ff"
                          : forgeUpgrade.to === "rare"
                          ? "#55aaff"
                          : "#ffffff"
                      }`,
                    }}
                  >
                    <div
                      className="weapon-icon"
                      style={{
                        fontSize: "26px",
                        textAlign: "center",
                        marginBottom: "10px",
                      }}
                    >
                      {getWeaponIcon(forgeUpgrade.to)}
                    </div>
                    <div
                      className="weapon-info"
                      style={{ textAlign: "center" }}
                    >
                      <div
                        className="weapon-name"
                        style={{
                          fontWeight: "bold",
                          marginBottom: "5px",
                        }}
                      >
                        {getNewWeaponName(forgeHero.class, forgeUpgrade.to)}
                      </div>
                      <div
                        className="weapon-rarity"
                        style={{
                          fontSize: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        {forgeUpgrade.to.toUpperCase()}
                      </div>
                    </div>
                    {forgeHero.weapon.enchant && (
                      <div
                        className="weapon-enchant"
                        style={{
                          color: ENCHANTMENTS[forgeHero.weapon.enchant]?.color,
                          textAlign: "center",
                          marginTop: "10px",
                          fontSize: "24px",
                        }}
                      >
                        {ENCHANTMENTS[forgeHero.weapon.enchant]?.icon}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div
                className="forge-price"
                style={{
                  textAlign: "center",
                  margin: "20px 0",
                  padding: "10px",
                  backgroundColor: "rgba(240, 199, 94, 0.1)",
                  borderRadius: "6px",
                }}
              >
                <p style={{ margin: "0 0 10px 0", color: "#b8b8c0" }}>
                  Upgrade Cost:
                </p>
                <div
                  className="price-display"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#f0c75e",
                  }}
                >
                  <span className="gold-icon">💰</span>
                  <span className="price-amount">{forgeUpgrade.price}</span>
                </div>
              </div>

              <div
                className="forge-buttons"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "15px",
                  marginTop: "20px",
                }}
              >
                <button
                  className="cancel-button"
                  onClick={cancelForgeUpgrade}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "rgba(255, 85, 85, 0.2)",
                    color: "#ff5555",
                    border: "1px solid #ff5555",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "16px",
                    transition: "all 0.2s",
                  }}
                >
                  Cancel
                </button>
                <button
                  className="confirm-button"
                  onClick={completeForgeUpgrade}
                  disabled={gold < forgeUpgrade.price}
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor:
                      gold < forgeUpgrade.price ? "#666" : "#f0c75e",
                    color: "#16213e",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    cursor:
                      gold < forgeUpgrade.price ? "not-allowed" : "pointer",
                    fontSize: "16px",
                    transition: "all 0.2s",
                    opacity: gold < forgeUpgrade.price ? 0.7 : 1,
                  }}
                >
                  Forge Upgrade
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item details tooltip */}
      {showItemDetail && (
        <div
          className="item-tooltip"
          style={{
            position: "absolute",
            top: `${showItemDetail.tooltipY || "50%"}`,
            left: `${showItemDetail.tooltipX || "50%"}`,
            backgroundColor: "rgba(22, 33, 62, 0.95)",
            padding: "12px",
            borderRadius: "6px",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
            zIndex: 50,
            maxWidth: "300px",
            border: "1px solid #2a3a5a",
          }}
        >
          <div
            className="tooltip-header"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "8px",
            }}
          >
            <div className="tooltip-icon" style={{ fontSize: "24px" }}>
              {showItemDetail.icon}
            </div>
            <div
              className="tooltip-title"
              style={{
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              {showItemDetail.name}
            </div>
          </div>
          <div
            className="tooltip-description"
            style={{
              fontSize: "14px",
              color: "#b8b8c0",
              marginBottom: "10px",
              lineHeight: "1.4",
            }}
          >
            {showItemDetail.description}
          </div>
          <div
            className="tooltip-price"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <span
              className="price-label"
              style={{ fontSize: "12px", color: "#8888a0" }}
            >
              Price:
            </span>
            <span className="gold-icon" style={{ color: "#f0c75e" }}>
              💰
            </span>
            <span
              className="price-value"
              style={{
                fontWeight: "bold",
                color: gold >= showItemDetail.price ? "#f0c75e" : "#ff5555",
              }}
            >
              {showItemDetail.price}
            </span>
          </div>
          <div
            className="tooltip-action"
            style={{
              backgroundColor: "#2a3a5a",
              color: "#f0c75e",
              padding: "5px 10px",
              borderRadius: "4px",
              fontSize: "12px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            {getItemActionLabel(showItemDetail)}
          </div>
        </div>
      )}

      {/* Purchase effect animation */}
      {purchaseEffect && (
        <div
          className={`purchase-effect ${purchaseEffect.type}`}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor:
              purchaseEffect.type === "health"
                ? "rgba(85, 255, 127, 0.8)"
                : purchaseEffect.type === "weapon"
                ? "rgba(255, 170, 51, 0.8)"
                : purchaseEffect.type === "enchant"
                ? "rgba(187, 85, 255, 0.8)"
                : purchaseEffect.type === "forge"
                ? "rgba(255, 102, 0, 0.8)"
                : "rgba(85, 170, 255, 0.8)",
            color: "#16213e",
            padding: "15px 25px",
            borderRadius: "8px",
            zIndex: 200,
            boxShadow: "0 0 30px rgba(255, 255, 255, 0.5)",
            animation: "fadeInOut 2s forwards",
          }}
        >
          <div
            className="effect-content"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <div className="effect-icon" style={{ fontSize: "30px" }}>
              {purchaseEffect.type === "health"
                ? "❤️"
                : purchaseEffect.type === "weapon"
                ? "⚔️"
                : purchaseEffect.type === "enchant"
                ? "✨"
                : purchaseEffect.type === "forge"
                ? "🔨"
                : "📦"}
            </div>
            <div
              className="effect-message"
              style={{
                fontWeight: "bold",
                fontSize: "18px",
              }}
            >
              {purchaseEffect.name}
              {purchaseEffect.target && (
                <span
                  className="effect-target"
                  style={{
                    fontSize: "14px",
                    opacity: 0.8,
                    display: "block",
                  }}
                >
                  {" → "}
                  {purchaseEffect.target}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tooltips */}
      <Tooltip id="weapon-tooltip" />
      <Tooltip id="inventory-tooltip" />

      {/* CSS for animations */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { opacity: 0.4; }
        }
        
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -70%); }
          20% { opacity: 1; transform: translate(-50%, -50%); }
          80% { opacity: 1; transform: translate(-50%, -50%); }
          100% { opacity: 0; transform: translate(-50%, -30%); }
        }
      `}</style>
    </div>
  );
};

export default Merchant;
