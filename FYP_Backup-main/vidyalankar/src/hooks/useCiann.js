// Custom hook for CIANN management
import { useState, useEffect, useCallback } from 'react';
import { ciannUtils } from '../utils/ciannUtils';

export const useCiann = () => {
  const [cianns, setCianns] = useState([]);
  const [currentCiann, setCurrentCiann] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load CIANN from localStorage on mount
  useEffect(() => {
    const storedCiann = ciannUtils.getCiannFromStorage();
    if (storedCiann) {
      setCurrentCiann(storedCiann);
    }
  }, []);

  // Fetch all CIANNs
  const fetchAllCianns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ciannUtils.fetchAllCianns();
      setCianns(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch CIANNs');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch CIANN by ID
  const fetchCiannById = useCallback(async (ciannId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await ciannUtils.fetchCiannById(ciannId);
      return data;
    } catch (err) {
      setError(err.message || `Failed to fetch CIANN ${ciannId}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new CIANN
  const createCiann = useCallback(async (ciannData) => {
    setLoading(true);
    setError(null);
    try {
      const validation = ciannUtils.validateCiann(ciannData);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const newCiann = await ciannUtils.createCiann(ciannData);
      setCianns(prev => [...prev, newCiann]);
      return newCiann;
    } catch (err) {
      setError(err.message || 'Failed to create CIANN');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update CIANN
  const updateCiann = useCallback(async (ciannId, ciannData) => {
    setLoading(true);
    setError(null);
    try {
      const validation = ciannUtils.validateCiann(ciannData);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const updatedCiann = await ciannUtils.updateCiann(ciannId, ciannData);
      setCianns(prev => prev.map(ciann => 
        ciann.ciannId === ciannId ? updatedCiann : ciann
      ));
      
      // Update current CIANN if it's the one being updated
      if (currentCiann && currentCiann.ciannId === ciannId) {
        setCurrentCiann(updatedCiann);
        ciannUtils.saveCiannToStorage(updatedCiann);
      }
      
      return updatedCiann;
    } catch (err) {
      setError(err.message || `Failed to update CIANN ${ciannId}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCiann]);

  // Delete CIANN
  const deleteCiann = useCallback(async (ciannId) => {
    setLoading(true);
    setError(null);
    try {
      await ciannUtils.deleteCiann(ciannId);
      setCianns(prev => prev.filter(ciann => ciann.ciannId !== ciannId));
      
      // Clear current CIANN if it's the one being deleted
      if (currentCiann && currentCiann.ciannId === ciannId) {
        setCurrentCiann(null);
        ciannUtils.clearCiannFromStorage();
      }
      
      return true;
    } catch (err) {
      setError(err.message || `Failed to delete CIANN ${ciannId}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCiann]);

  // Select current CIANN
  const selectCiann = useCallback((ciann) => {
    setCurrentCiann(ciann);
    ciannUtils.saveCiannToStorage(ciann);
  }, []);

  // Clear current CIANN
  const clearCurrentCiann = useCallback(() => {
    setCurrentCiann(null);
    ciannUtils.clearCiannFromStorage();
  }, []);

  // Validate current CIANN
  const validateCurrentCiann = useCallback(() => {
    if (!currentCiann) {
      return { isValid: false, error: 'No CIANN selected' };
    }
    return ciannUtils.validateCiann(currentCiann);
  }, [currentCiann]);

  return {
    // State
    cianns,
    currentCiann,
    loading,
    error,
    
    // Actions
    fetchAllCianns,
    fetchCiannById,
    createCiann,
    updateCiann,
    deleteCiann,
    selectCiann,
    clearCurrentCiann,
    validateCurrentCiann,
    
    // Utilities
    hasCiann: !!currentCiann,
    ciannId: currentCiann?.ciannId || null
  };
};

export default useCiann;