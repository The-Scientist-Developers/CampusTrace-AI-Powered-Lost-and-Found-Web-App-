import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Optimized fetch hook with abort controller and timeout
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @param {number} timeout - Request timeout in ms (default: 15000)
 * @returns {object} - { data, loading, error, refetch }
 */
export function useOptimizedFetch(url, options = {}, timeout = 15000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async () => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(
      () => abortControllerRef.current.abort(),
      timeout
    );

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === "AbortError") {
        console.log("Request was cancelled or timed out");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(options), timeout]);

  useEffect(() => {
    fetchData();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Batch multiple fetch requests
 * @param {Array} requests - Array of {url, options} objects
 * @param {number} timeout - Request timeout in ms
 * @returns {object} - { data, loading, error, refetch }
 */
export function useBatchFetch(requests = [], timeout = 15000) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllersRef = useRef([]);

  const fetchAll = useCallback(async () => {
    // Cancel all previous requests
    abortControllersRef.current.forEach((controller) => controller.abort());
    abortControllersRef.current = [];

    setLoading(true);
    setError(null);

    try {
      const promises = requests.map(({ url, options = {} }) => {
        const controller = new AbortController();
        abortControllersRef.current.push(controller);

        const timeoutId = setTimeout(() => controller.abort(), timeout);

        return fetch(url, {
          ...options,
          signal: controller.signal,
        })
          .then((res) => {
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
          })
          .catch((err) => {
            clearTimeout(timeoutId);
            if (err.name !== "AbortError") throw err;
            return null;
          });
      });

      const results = await Promise.all(promises);
      setData(results.filter((r) => r !== null));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(requests), timeout]);

  useEffect(() => {
    if (requests.length > 0) {
      fetchAll();
    }

    return () => {
      abortControllersRef.current.forEach((controller) => controller.abort());
    };
  }, [fetchAll]);

  return { data, loading, error, refetch: fetchAll };
}

export default useOptimizedFetch;
