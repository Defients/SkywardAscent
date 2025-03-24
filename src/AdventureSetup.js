import React, { useState, useEffect } from "react";
import { useGameContext, CLASS_DATA } from "./contexts/GameContext";
import "./styles/AdventureSetup.css";

const AdventureSetup = ({ gameData, onComplete }) => {
  const [setupOption, setSetupOption] = useState(null);
  const [gold, setGold] = useState(0);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple loading simulation
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle quick play adventure setup
  const handleQuickPlay = () => {
    setSetupOption("quick");

    // In quick play, start with 110g, health potions, and a common weapon
    setGold(110);
    setItems([
      { name: "Minor Health Potion", type: "potion", icon: "🧪" },
      { name: "Major Health Potion", type: "potion", icon: "🧪" },
    ]);
  };

  // Handle advanced play adventure setup
  const handleAdvancedPlay = () => {
    setSetupOption("advanced");

    // Calculate starting gold and items based on selected heroes
    let totalGold = 0;
    const allItems = [];

    gameData.heroes.forEach((hero) => {
      const classData = CLASS_DATA[hero.rank];
      totalGold += classData.startingGold;

      // Add starting items
      classData.startingItems.forEach((itemName) => {
        allItems.push({
          name: itemName,
          type: getItemType(itemName),
          icon: getItemIcon(itemName),
        });
      });
    });

    setGold(totalGold);
    setItems(allItems);
  };

  // Helper to determine item type
  const getItemType = (itemName) => {
    if (itemName.includes("Potion")) return "potion";
    if (itemName.includes("Scroll")) return "scroll";
    if (itemName.includes("weapon")) return "weapon";
    return "misc";
  };

  // Helper to get appropriate icon for items
  const getItemIcon = (itemName) => {
    if (itemName.includes("Potion")) return "🧪";
    if (itemName.includes("Scroll")) return "📜";
    if (itemName.includes("weapon")) return "⚔️";
    if (itemName.includes("Charm")) return "🔮";
    if (itemName.includes("Rune")) return "🔯";
    if (itemName.includes("Blocker")) return "🛡️";
    if (itemName.includes("Cloak")) return "👘";
    return "📦";
  };

  // Complete adventure setup and move to next phase
  const completeSetup = () => {
    onComplete({
      gold,
      inventory: items,
      // If in advanced mode and selected Guardian, they start with a weapon
      heroes: gameData.heroes.map((hero) => {
        if (hero.class === "Guardian" && setupOption === "advanced") {
          return {
            ...hero,
            weapon: {
              name: "Stargazer Spear",
              rarity: "common",
              effect:
                "Protective Strike now heals for 2 instead of 1; Vital Rend heals for 3 instead of 2.",
            },
          };
        }
        return hero;
      }),
    });
  };

  if (isLoading) {
    return <div className="loading">Setting up your adventure...</div>;
  }

  // Initial adventure setup selection
  if (!setupOption) {
    return (
      <div className="adventure-options">
        <h2>Choose Adventure Setup</h2>
        <div className="setup-buttons">
          <button onClick={handleQuickPlay} className="quick-play">
            ⚡ Quick Play Adventure
          </button>
          <button onClick={handleAdvancedPlay} className="advanced-play">
            🦾 Advanced Play Adventure
          </button>
        </div>
      </div>
    );
  }

  // Display adventure setup details
  return (
    <div className="adventure-setup">
      <h2>Adventure Setup Complete</h2>

      <div className="heroes-summary">
        <h3>Your Heroic Party</h3>
        <div className="hero-party">
          {gameData.heroes.map((hero, index) => (
            <div key={index} className="hero-summary">
              <h4>
                {hero.class} - {hero.specialization}
              </h4>
              <p>Health: {hero.health}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="resources">
        <div className="gold-summary">
          <h3>Starting Gold</h3>
          <p className="gold-amount">
            <span className="gold-icon">💰</span>
            {gold} gold
          </p>
        </div>

        <div className="items-summary">
          <h3>Starting Items</h3>
          {items.length > 0 ? (
            <ul className="item-list">
              {items.map((item, index) => (
                <li key={index} className={`item ${item.type}`}>
                  <span className="item-icon">{item.icon}</span>
                  {item.name}
                </li>
              ))}
            </ul>
          ) : (
            <p>No starting items</p>
          )}
        </div>
      </div>

      <button onClick={completeSetup} className="continue-button">
        Continue to Weapon Chest
      </button>
    </div>
  );
};

export default AdventureSetup;
