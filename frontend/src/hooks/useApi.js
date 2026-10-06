import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const useApi = (endpoint, options = {}) => {
  const [data, setData] = useState(options.initialData || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (customEndpoint = endpoint) => {
    if (!customEndpoint) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(customEndpoint);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (options.manual !== true) {
      fetchData();
    }
  }, [fetchData, options.manual]);

  return { data, loading, error, refetch: fetchData, setData };
};
