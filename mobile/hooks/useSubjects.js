import { useState, useCallback } from "react";

// Use localhost with: adb reverse tcp:5002 tcp:5002
const API_URL = "http://localhost:5002/api";

export const useSubjects = () => {

    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSubjects = useCallback(async () => {
        const response = await fetch(`${API_URL}/subjects`);
        if (!response.ok) {
            throw new Error(`Failed to fetch subjects: ${response.status}`);
        }
        const data = await response.json();
        setSubjects(data);
    }, []);

    const loadData = useCallback(async () => {
        setIsLoading(true);

        try {
            await Promise.all([fetchSubjects()]);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [fetchSubjects]);

    const addSubject = useCallback(async (subjectData) => {
        const response = await fetch(`${API_URL}/subjects`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subjectData),
        });
        if (!response.ok) throw new Error(`Failed to add subject: ${response.status}`);
        const newSubject = await response.json();
        setSubjects((prev) => [...prev, newSubject]);
        return newSubject;
    }, []);

    return { subjects, loadData, isLoading, addSubject };

}