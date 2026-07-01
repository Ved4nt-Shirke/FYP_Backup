// Custom hook for Ciaan management
import { useState, useEffect, useCallback } from 'react';
import { CiaanUtils } from '../utils/CiannUtils';

export const useCiaan = () => {
  const [Ciaans, setCiaans] = useState([]);
  const [currentCiaan, setCurrentCiaan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load Ciaan from localStorage on mount
  useEffect(() => {
    const storedCiaan = CiaanUtils.getCiaanFromStorage();
    if (storedCiaan) {
      setCurrentCiaan(storedCiaan);
    }
  }, []);

  // Fetch all Ciaans
  const fetchAllCiaans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await CiaanUtils.fetchAllCiaans();
      setCiaans(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch Ciaans');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Ciaan by ID
  const fetchCiaanById = useCallback(async (CiaanId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await CiaanUtils.fetchCiaanById(CiaanId);
      return data;
    } catch (err) {
      setError(err.message || `Failed to fetch Ciaan ${CiaanId}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new Ciaan
  const createCiaan = useCallback(async (CiaanData) => {
    setLoading(true);
    setError(null);
    try {
      const validation = CiaanUtils.validateCiaan(CiaanData);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const newCiaan = await CiaanUtils.createCiaan(CiaanData);
      setCiaans(prev => [...prev, newCiaan]);
      return newCiaan;
    } catch (err) {
      setError(err.message || 'Failed to create Ciaan');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update Ciaan
  const updateCiaan = useCallback(async (CiaanId, CiaanData) => {
    setLoading(true);
    setError(null);
    try {
      const validation = CiaanUtils.validateCiaan(CiaanData);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const updatedCiaan = await CiaanUtils.updateCiaan(CiaanId, CiaanData);
      setCiaans(prev => prev.map(Ciaan =>
        Ciaan.CiaanId === CiaanId ? updatedCiaan : Ciaan
      ));

      // Update current Ciaan if it's the one being updated
      if (currentCiaan && currentCiaan.CiaanId === CiaanId) {
        setCurrentCiaan(updatedCiaan);
        CiaanUtils.saveCiaanToStorage(updatedCiaan);
      }

      return updatedCiaan;
    } catch (err) {
      setError(err.message || `Failed to update Ciaan ${CiaanId}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCiaan]);

  // Delete Ciaan
  const deleteCiaan = useCallback(async (CiaanId) => {
    setLoading(true);
    setError(null);
    try {
      await CiaanUtils.deleteCiaan(CiaanId);
      setCiaans(prev => prev.filter(Ciaan => Ciaan.CiaanId !== CiaanId));

      // Clear current Ciaan if it's the one being deleted
      if (currentCiaan && currentCiaan.CiaanId === CiaanId) {
        setCurrentCiaan(null);
        CiaanUtils.clearCiaanFromStorage();
      }

      return true;
    } catch (err) {
      setError(err.message || `Failed to delete Ciaan ${CiaanId}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCiaan]);

  // Select current Ciaan
  const selectCiaan = useCallback((Ciaan) => {
    setCurrentCiaan(Ciaan);
    CiaanUtils.saveCiaanToStorage(Ciaan);
  }, []);

  // Clear current Ciaan
  const clearCurrentCiaan = useCallback(() => {
    setCurrentCiaan(null);
    CiaanUtils.clearCiaanFromStorage();
  }, []);

  // Validate current Ciaan
  const validateCurrentCiaan = useCallback(() => {
    if (!currentCiaan) {
      return { isValid: false, error: 'No Ciaan selected' };
    }
    return CiaanUtils.validateCiaan(currentCiaan);
  }, [currentCiaan]);

  return {
    // State
    Ciaans,
    currentCiaan,
    loading,
    error,

    // Actions
    fetchAllCiaans,
    fetchCiaanById,
    createCiaan,
    updateCiaan,
    deleteCiaan,
    selectCiaan,
    clearCurrentCiaan,
    validateCurrentCiaan,

    // Utilities
    hasCiaan: !!currentCiaan,
    CiaanId: currentCiaan?.CiaanId || null
  };
};

export default useCiaan;