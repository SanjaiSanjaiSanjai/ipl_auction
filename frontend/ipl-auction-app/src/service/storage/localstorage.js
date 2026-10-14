export const setLocalstorage = (key, value) => {
    try {
        const string_value = JSON.stringify(value);
        localStorage.setItem(key, string_value);
        console.log("Localstorage is set successfully...");
        return true;
    } catch (err) {
        console.error("Error storing value in localstorage:", err);
        return false;
    }
}

export const getLocalStorage = (key) => {
    try {
        const value = localStorage.getItem(key);

        // If key doesn't exist
        if (value === null) {
            return null;
        }

        return JSON.parse(value);
    } catch (error) {
        console.error("Error getting localStorage:", error);
        return null;
    }
};

export const removeLocalStorage = (key) => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error("Error removing localStorage:", error);
    }
};


export const clearLocalStorage = () => {
    try {
        localStorage.clear();
    } catch (error) {
        console.error("Error clearing localStorage:", error);
    }
};
