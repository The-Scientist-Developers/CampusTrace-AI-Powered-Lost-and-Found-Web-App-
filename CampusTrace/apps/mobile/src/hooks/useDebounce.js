import { useState, useEffect } from "react";

/**
 * Debounce hook - delays updating value until after specified delay
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {any} - Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up timeout to update debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timeout if value changes before delay completes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced callback hook - delays executing callback until after specified delay
 * @param {Function} callback - The callback to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @param {Array} dependencies - Dependencies array for useCallback
 * @returns {Function} - Debounced callback function
 */
export function useDebouncedCallback(callback, delay = 300, dependencies = []) {
  const [timeoutId, setTimeoutId] = useState(null);

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const debouncedCallback = (...args) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };

  return debouncedCallback;
}

export default useDebounce;
