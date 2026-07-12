import { useState, useEffect, useCallback } from 'react';

export function useFormDraft<T>(key: string, initialData: T, isEnabled: boolean = true) {
    // Determine initial state
    const [data, setData] = useState<T>(() => {
        if (!isEnabled) return initialData;
        try {
            const item = localStorage.getItem(key);
            if (item) {
                const parsed = JSON.parse(item);
                // Return saved draft
                return parsed.data as T;
            }
        } catch (error) {
            console.error('Error reading from localStorage', error);
        }
        return initialData;
    });

    const [hasDraft, setHasDraft] = useState<boolean>(() => {
        if (!isEnabled) return false;
        try {
            return !!localStorage.getItem(key);
        } catch {
            return false;
        }
    });
    
    const [draftSavedAt, setDraftSavedAt] = useState<string | null>(() => {
        if (!isEnabled) return null;
        try {
            const item = localStorage.getItem(key);
            if (item) {
                const parsed = JSON.parse(item);
                return parsed.timestamp || null;
            }
        } catch {
            return null;
        }
        return null;
    });

    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (!isEnabled) return;
        if (!isDirty) return; // Don't save on initial mount
        
        // Debounce saving slightly
        const timer = setTimeout(() => {
            try {
                const timestamp = new Date().toISOString();
                localStorage.setItem(key, JSON.stringify({ data, timestamp }));
                setHasDraft(true);
                setDraftSavedAt(timestamp);
            } catch (error) {
                console.error('Error saving to localStorage', error);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [data, key, isEnabled, isDirty]);

    // Custom setter that also marks dirty
    const handleSetData = useCallback((value: T | ((prev: T) => T)) => {
        setIsDirty(true);
        setData(value);
    }, []);

    // Overwrite data from external source (e.g. loading from API) without saving draft
    const loadExternalData = useCallback((value: T) => {
        setIsDirty(false); // Reset dirty flag so it doesn't immediately save as draft
        setData(value);
    }, []);

    const clearDraft = useCallback(() => {
        try {
            localStorage.removeItem(key);
            setHasDraft(false);
            setDraftSavedAt(null);
            setIsDirty(false);
            setData(initialData);
        } catch (error) {
            console.error('Error clearing localStorage', error);
        }
    }, [key, initialData]);

    return { 
        data, 
        setData: handleSetData, 
        loadExternalData,
        hasDraft, 
        clearDraft, 
        draftSavedAt 
    };
}
