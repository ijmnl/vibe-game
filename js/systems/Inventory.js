class Inventory {
    constructor() {
        this.items = {}; // { itemName: { name, quantity, type, description } }
        this.maxItems = 99; // Max items per type
    }

    // Add an item to inventory
    addItem(itemName, quantity = 1) {
        const itemData = CONFIG.ITEMS[itemName];
        if (!itemData) {
            console.warn(`Unknown item: ${itemName}`);
            return false;
        }

        if (!this.items[itemName]) {
            this.items[itemName] = {
                name: itemName,
                quantity: 0,
                ...itemData
            };
        }

        const newQuantity = this.items[itemName].quantity + quantity;
        if (newQuantity > this.maxItems) {
            this.items[itemName].quantity = this.maxItems;
            return false; // Inventory full
        }

        this.items[itemName].quantity = newQuantity;
        return true;
    }

    // Use an item
    useItem(itemName, target) {
        if (!this.items[itemName] || this.items[itemName].quantity <= 0) {
            return { success: false, reason: 'Item not available' };
        }

        const item = this.items[itemName];
        
        switch (item.type) {
            case 'heal':
                if (target.healMonster) {
                    target.healMonster(item.value);
                    this.items[itemName].quantity--;
                    
                    if (this.items[itemName].quantity <= 0) {
                        delete this.items[itemName];
                    }
                    
                    return { success: true, message: `Used ${itemName}. Restored ${item.value} HP.` };
                }
                break;
                
            case 'ball':
                // Balls are used in battle, not here
                return { success: false, reason: 'Cannot use ball outside battle' };
                
            default:
                return { success: false, reason: 'Unknown item type' };
        }

        return { success: false, reason: 'Cannot use item on target' };
    }

    // Get item count
    getItemCount(itemName) {
        return this.items[itemName]?.quantity || 0;
    }

    // Get all items
    getAllItems() {
        return Object.values(this.items);
    }

    // Remove an item
    removeItem(itemName, quantity = 1) {
        if (!this.items[itemName]) {
            return false;
        }

        this.items[itemName].quantity -= quantity;
        
        if (this.items[itemName].quantity <= 0) {
            delete this.items[itemName];
        }

        return true;
    }

    // Check if has item
    hasItem(itemName, quantity = 1) {
        return (this.items[itemName]?.quantity || 0) >= quantity;
    }

    // Get save data
    getSaveData() {
        const saveData = {};
        for (const [itemName, item] of Object.entries(this.items)) {
            saveData[itemName] = {
                name: item.name,
                quantity: item.quantity
            };
        }
        return saveData;
    }

    // Load save data
    loadSaveData(data) {
        for (const [itemName, item] of Object.entries(data)) {
            this.items[itemName] = {
                name: item.name,
                quantity: item.quantity,
                ...CONFIG.ITEMS[itemName]
            };
        }
    }
}
