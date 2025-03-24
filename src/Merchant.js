import React, { useState, useEffect } from "react";
import {
  drawCardFromPeon,
  SHOP_ITEMS,
  WEAPONS,
  ENCHANTMENTS,
} from "../contexts/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "react-tooltip";
import "../styles/Merchant.css";

// Import merchant assets
import merchantBgImg from "../assets/images/rooms/merchant_bg.png";
import shopkeeperImg from "../assets/images/characters/shopkeeper.png";
import shopCounterImg from "../assets/images/items/shop_counter.png";
import goldCoinImg from "../assets/images/items/gold_coin.png";
import forgeImg from "../assets/images/items/forge.png";

const Merchant = ({ gameData, onComplete, playSound }) => {
  const [selectedTab, setSelectedTab] = useState("health");
  const [selectedItem, setSelectedItem] = useState(null);
  const [targetHero, setTargetHero] = useState(null);
  const [message, setMessage] = useState(
    "Welcome to the Merchant! What would you like to purchase?"
  );
  const [gold, setGold] = useState(gameData.gold);
  const [inventory, setInventory] = useState([...gameData.inventory]);
  const [heroes, setHeroes] = useState([...gameData.heroes]);
  const [merchantItems, setMerchantItems] = useState({});
  const [showPurchaseConfirmation, setShowPurchaseConfirmation] =
    useState(false);
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
        if (item.minTier && item.minTier > gameData.currentTier) {
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
    if (gameData.currentTier >= 2) {
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
    if (gameData.currentTier >= 3) {
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
        price: calculateUpgradePrice("common"),
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
        return 50;
      case "rare":
        return 90;
      case "epic":
        return 110;
      default:
        return 50;
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
      if (hero.weapon.rarity === "epic" && gameData.currentTier < 3) {
        setMessage(`Epic weapons can only be upgraded to Legendary in Tier 3.`);
        return;
      }

      if (hero.weapon.rarity === "rare" && gameData.currentTier < 2) {
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
    switch (currentRarity) {
      case "common":
        return "rare";
      case "rare":
        return "epic";
      case "epic":
        return "legendary";
      default:
        return "rare";
    }
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
    const heroIndex = updatedHeroes.indexOf(forgeHero);

    if (heroIndex >= 0) {
      // Get a random weapon of the new rarity
      const weaponPool = WEAPONS[forgeUpgrade.to].filter(
        (w) => w.class === forgeHero.class
      );

      if (weaponPool.length > 0) {
        const newWeapon =
          weaponPool[Math.floor(Math.random() * weaponPool.length)];

        // Keep the enchantment if it exists
        const enchant = updatedHeroes[heroIndex].weapon.enchant;

        updatedHeroes[heroIndex].weapon = {
          ...newWeapon,
          rarity: forgeUpgrade.to,
          enchant: enchant,
        };

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
    }

    // Close forge
    setWeaponForgeOpen(false);
    setForgeHero(null);
    setForgeUpgrade(null);
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
          const heroIndex = updatedHeroes.indexOf(hero);
          updatedHeroes[heroIndex].health = updatedHeroes[heroIndex].maxHealth;
          setHeroes(updatedHeroes);
          setMessage(`${hero.class} was fully healed!`);
        } else if (
          (item.id === "revive_half" || item.id === "revive_full") &&
          hero
        ) {
          // Revive fallen hero
          const updatedHeroes = [...heroes];
          const heroIndex = updatedHeroes.indexOf(hero);
          updatedHeroes[heroIndex].health =
            item.id === "revive_half"
              ? Math.ceil(updatedHeroes[heroIndex].maxHealth / 2)
              : updatedHeroes[heroIndex].maxHealth;
          setHeroes(updatedHeroes);
          setMessage(`${hero.class} was revived!`);
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
          // Draw a card from the peon pile
          const card = drawCardFromPeon(gameData.deck.peonPile);

          // Attach it to the hero
          const updatedHeroes = [...heroes];
          const heroIndex = updatedHeroes.indexOf(hero);

          // Create a copy of attached cards and add the new one
          const attachedCards = [...updatedHeroes[heroIndex].attachedCards];
          attachedCards.push({ ...card, isPermanent: true });

          updatedHeroes[heroIndex].attachedCards = attachedCards;

          setHeroes(updatedHeroes);
          setMessage(
            `${hero.class} received a permanent ${card.rank}${card.suit} card!`
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
          // Get a random weapon of the appropriate rarity
          const rarity = item.rarity;
          const weaponPool = WEAPONS[rarity].filter(
            (w) => w.class === hero.class
          );

          if (weaponPool.length > 0) {
            const weapon =
              weaponPool[Math.floor(Math.random() * weaponPool.length)];

            // Equip the hero
            const updatedHeroes = [...heroes];
            const heroIndex = updatedHeroes.indexOf(hero);
            updatedHeroes[heroIndex].weapon = {
              ...weapon,
              rarity: rarity,
            };

            setHeroes(updatedHeroes);
            setMessage(`${hero.class} equipped with ${weapon.name}!`);
          } else {
            // Fallback if no weapons found
            const updatedHeroes = [...heroes];
            const heroIndex = updatedHeroes.indexOf(hero);
            updatedHeroes[heroIndex].weapon = {
              name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${
                hero.class
              } Weapon`,
              effect: "A powerful weapon suited for your class.",
              rarity: rarity,
              icon: "⚔️",
            };

            setHeroes(updatedHeroes);
            setMessage(`${hero.class} equipped with a ${rarity} weapon!`);
          }
        }
        break;

      case "enchant":
        if (hero && hero.weapon) {
          // Apply enchantment to weapon
          const updatedHeroes = [...heroes];
          const heroIndex = updatedHeroes.indexOf(hero);

          updatedHeroes[heroIndex].weapon = {
            ...updatedHeroes[heroIndex].weapon,
            enchant: item.enchantType,
          };

          setHeroes(updatedHeroes);
          setMessage(`${item.name} applied to ${hero.class}'s weapon!`);
        }
        break;
    }
  };

  // Complete transaction and leave merchant
  const finishShopping = () => {
    // Play sound
    if (playSound) playSound();

    // Update game state
    onComplete({
      gold,
      inventory,
      heroes,
    });
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
      style={{ backgroundImage: `url(${merchantBgImg})` }}
    >
      <div className="merchant-header">
        <h2>The Merchant</h2>
        <div className="merchant-message">{message}</div>
      </div>

      <div className="shop-layout">
        <div className="merchant-interface">
          <div className="merchant-tabs">
            <button
              className={`tab ${selectedTab === "health" ? "active" : ""}`}
              onClick={() => handleTabClick("health")}
            >
              <span className="tab-icon">❤️</span>
              <span className="tab-label">Health & Services</span>
            </button>
            <button
              className={`tab ${selectedTab === "consumables" ? "active" : ""}`}
              onClick={() => handleTabClick("consumables")}
            >
              <span className="tab-icon">🧪</span>
              <span className="tab-label">Consumables</span>
            </button>
            <button
              className={`tab ${selectedTab === "gear" ? "active" : ""}`}
              onClick={() => handleTabClick("gear")}
            >
              <span className="tab-icon">🎒</span>
              <span className="tab-label">Gear</span>
            </button>
            <button
              className={`tab ${selectedTab === "weapons" ? "active" : ""}`}
              onClick={() => handleTabClick("weapons")}
            >
              <span className="tab-icon">⚔️</span>
              <span className="tab-label">Weapons</span>
            </button>
            <button
              className={`tab ${selectedTab === "enchants" ? "active" : ""}`}
              onClick={() => handleTabClick("enchants")}
            >
              <span className="tab-icon">✨</span>
              <span className="tab-label">Enchants</span>
            </button>
            <button
              className={`tab ${selectedTab === "upgrades" ? "active" : ""}`}
              onClick={() => handleTabClick("upgrades")}
            >
              <span className="tab-icon">🔨</span>
              <span className="tab-label">Upgrades</span>
            </button>
          </div>

          <div className="merchant-items">
            {merchantItems[selectedTab] &&
            merchantItems[selectedTab].length > 0 ? (
              merchantItems[selectedTab].map((item, index) => (
                <motion.div
                  key={index}
                  className={`merchant-item ${
                    item.disabled ? "disabled" : ""
                  } ${selectedItem === item ? "selected" : ""}`}
                  whileHover={!item.disabled ? { scale: 1.03, y: -2 } : {}}
                  whileTap={!item.disabled ? { scale: 0.97 } : {}}
                  onClick={() => selectItem(item)}
                  onMouseEnter={() => showItemDetails(item)}
                  onMouseLeave={hideItemDetails}
                >
                  <div className="item-icon">{item.icon}</div>
                  <div className="item-details">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-description">{item.description}</p>
                  </div>
                  <div className="item-price">
                    <img
                      src={goldCoinImg}
                      alt="Gold"
                      className="gold-icon-img"
                    />
                    <span className="price-amount">{item.price}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="no-items-message">
                No items available in this category
              </div>
            )}
          </div>

          {/* Shop counter with shopkeeper */}
          <div className="shop-counter">
            <img
              src={shopCounterImg}
              alt="Shop Counter"
              className="counter-img"
            />
            <div className="shopkeeper">
              <img
                src={shopkeeperImg}
                alt="Shopkeeper"
                className="shopkeeper-img"
              />

              <AnimatePresence>
                {showDialogue && (
                  <motion.div
                    className="dialogue-bubble"
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p>{shopkeeperDialogue}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="merchant-sidebar">
          <div className="gold-display">
            <img src={goldCoinImg} alt="Gold" className="gold-icon-img" />
            <span className="gold-amount">{gold}</span>
          </div>

          <div className="heroes-list">
            <h3>Heroes</h3>
            {heroes.map((hero, index) => (
              <motion.div
                key={index}
                className={`hero-entry ${
                  targetHero === hero ? "selected" : ""
                } ${purchaseState === "selecting_hero" ? "selectable" : ""} ${
                  hero.health <= 0 ? "fallen" : ""
                }`}
                whileHover={
                  purchaseState === "selecting_hero" && hero.health > 0
                    ? { scale: 1.03, x: 5 }
                    : {}
                }
                whileTap={
                  purchaseState === "selecting_hero" && hero.health > 0
                    ? { scale: 0.97 }
                    : {}
                }
                onClick={() =>
                  purchaseState === "selecting_hero" && hero.health > 0
                    ? selectHero(hero)
                    : null
                }
              >
                <div className="hero-header">
                  <span className="hero-name">{hero.class}</span>
                  <span className="hero-health">
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
                        }}
                      >
                        {ENCHANTMENTS[hero.weapon.enchant]?.icon}
                      </span>
                    )}
                  </div>
                )}
                {showEnchantment && targetHero === hero && (
                  <div className="enchantment-preview">
                    <div
                      className="preview-enchant"
                      style={{
                        color: ENCHANTMENTS[selectedEnchantment]?.color,
                      }}
                    >
                      {ENCHANTMENTS[selectedEnchantment]?.icon}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="inventory-preview">
            <h3>Inventory</h3>
            <div className="inventory-items">
              {inventory.length > 0 ? (
                <div className="inventory-grid">
                  {inventory.map((item, index) => (
                    <div
                      key={index}
                      className="inventory-item"
                      data-tooltip-id="inventory-tooltip"
                      data-tooltip-content={
                        item.effect || item.description || item.name
                      }
                    >
                      <span className="item-icon">{item.icon}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-inventory">No items in inventory</p>
              )}
            </div>
          </div>

          <div className="transaction-history">
            <h3>Recent Purchases</h3>
            <div className="transactions">
              {transactionHistory.length > 0 ? (
                <div className="transaction-list">
                  {transactionHistory.slice(-3).map((transaction, index) => (
                    <div key={index} className="transaction-entry">
                      <div className="transaction-details">
                        <span className="transaction-item">
                          {transaction.item}
                        </span>
                        {transaction.target && (
                          <span className="transaction-target">
                            for {transaction.target}
                          </span>
                        )}
                      </div>
                      <div className="transaction-price">
                        <img
                          src={goldCoinImg}
                          alt="Gold"
                          className="small-gold-icon"
                        />
                        <span className="price-value">{transaction.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-transactions">No purchases yet</p>
              )}
            </div>
          </div>

          <motion.button
            className="finish-button"
            onClick={finishShopping}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="button-icon">🚪</span>
            Leave Shop
          </motion.button>
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
          >
            <motion.div
              className="confirmation-card"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3>Confirm Purchase</h3>

              <div className="purchase-details">
                <div className="item-preview">
                  <div className="preview-icon">{selectedItem.icon}</div>
                  <div className="preview-name">{selectedItem.name}</div>
                </div>

                {targetHero && (
                  <div className="target-preview">
                    <p>for {targetHero.class}</p>
                    {showEnchantment && (
                      <div className="enchantment-preview-large">
                        <div className="preview-weapon">
                          <span className="weapon-name">
                            {targetHero.weapon.name}
                          </span>
                          <span
                            className="preview-enchant"
                            style={{
                              color: ENCHANTMENTS[selectedEnchantment]?.color,
                            }}
                          >
                            {ENCHANTMENTS[selectedEnchantment]?.icon}
                          </span>
                        </div>
                        <p className="enchant-effect">
                          {ENCHANTMENTS[selectedEnchantment]?.effect}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="price-preview">
                  <img src={goldCoinImg} alt="Gold" className="gold-icon-img" />
                  <span className="preview-price">{selectedItem.price}</span>
                </div>
              </div>

              <div className="confirmation-buttons">
                <motion.button
                  className="cancel-button"
                  onClick={cancelPurchase}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="confirm-button"
                  onClick={purchaseItem}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Confirm
                </motion.button>
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
          >
            <motion.div
              className="forge-content"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3>Weapon Forge</h3>

              <div className="forge-image">
                <img src={forgeImg} alt="Forge" className="forge-img" />
                <div className="forge-effects"></div>
              </div>

              <div className="upgrade-details">
                <div className="current-weapon">
                  <h4>Current Weapon</h4>
                  <div className={`weapon-display ${forgeUpgrade.from}`}>
                    <div className="weapon-icon">
                      {forgeHero.weapon.icon || "⚔️"}
                    </div>
                    <div className="weapon-info">
                      <div className="weapon-name">{forgeHero.weapon.name}</div>
                      <div className="weapon-rarity">
                        {forgeUpgrade.from.toUpperCase()}
                      </div>
                    </div>
                    {forgeHero.weapon.enchant && (
                      <div
                        className="weapon-enchant"
                        style={{
                          color: ENCHANTMENTS[forgeHero.weapon.enchant]?.color,
                        }}
                      >
                        {ENCHANTMENTS[forgeHero.weapon.enchant]?.icon}
                      </div>
                    )}
                  </div>
                </div>

                <div className="upgrade-arrow">⟶</div>

                <div className="upgraded-weapon">
                  <h4>After Upgrade</h4>
                  <div className={`weapon-display ${forgeUpgrade.to}`}>
                    <div className="weapon-icon">⚔️</div>
                    <div className="weapon-info">
                      <div className="weapon-name">
                        {forgeUpgrade.to.charAt(0).toUpperCase() +
                          forgeUpgrade.to.slice(1)}{" "}
                        Weapon
                      </div>
                      <div className="weapon-rarity">
                        {forgeUpgrade.to.toUpperCase()}
                      </div>
                    </div>
                    {forgeHero.weapon.enchant && (
                      <div
                        className="weapon-enchant"
                        style={{
                          color: ENCHANTMENTS[forgeHero.weapon.enchant]?.color,
                        }}
                      >
                        {ENCHANTMENTS[forgeHero.weapon.enchant]?.icon}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="forge-price">
                <p>Upgrade Cost:</p>
                <div className="price-display">
                  <img src={goldCoinImg} alt="Gold" className="gold-icon-img" />
                  <span className="price-amount">{forgeUpgrade.price}</span>
                </div>
              </div>

              <div className="forge-buttons">
                <motion.button
                  className="cancel-button"
                  onClick={cancelForgeUpgrade}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="confirm-button"
                  onClick={completeForgeUpgrade}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={gold < forgeUpgrade.price}
                >
                  Forge Upgrade
                </motion.button>
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
            top: `${showItemDetail.tooltipY || "50%"}`,
            left: `${showItemDetail.tooltipX || "50%"}`,
          }}
        >
          <div className="tooltip-header">
            <div className="tooltip-icon">{showItemDetail.icon}</div>
            <div className="tooltip-title">{showItemDetail.name}</div>
          </div>
          <div className="tooltip-description">
            {showItemDetail.description}
          </div>
          <div className="tooltip-price">
            <span className="price-label">Price:</span>
            <img src={goldCoinImg} alt="Gold" className="small-gold-icon" />
            <span className="price-value">{showItemDetail.price}</span>
          </div>
          <div className="tooltip-action">
            {getItemActionLabel(showItemDetail)}
          </div>
        </div>
      )}

      {/* Purchase effect animation */}
      {purchaseEffect && (
        <div className={`purchase-effect ${purchaseEffect.type}`}>
          <div className="effect-content">
            <div className="effect-icon">
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
            <div className="effect-message">
              {purchaseEffect.name}
              {purchaseEffect.target && (
                <span className="effect-target">
                  {" "}
                  → {purchaseEffect.target}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tooltips */}
      <Tooltip id="weapon-tooltip" />
      <Tooltip id="inventory-tooltip" />
    </div>
  );
};

export default Merchant;
