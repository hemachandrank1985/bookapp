import { useState, useEffect } from 'react';

/**
 * Custom hook for persisting state in LocalStorage.
 * @param {string} key LocalStorage key name
 * @param {any} initialValue Initial value to fall back on if nothing is in local storage
 */
export function useLocalStorage(key, initialValue) {
  // Initialize state
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage key ' + key + ':', error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage.
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error setting localStorage key ' + key + ':', error);
    }
  };

  return [storedValue, setValue];
}
