import { useState, useCallback } from "react";

const API_URL = "http://localhost:5002/api";

export const useTopics = (subjectId) => {
    const [topics, setTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadTopics = useCallback(async () => {
        if (!subjectId) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/topics/${subjectId}`);
            if (!response.ok) throw new Error(`Failed to fetch topics: ${response.status}`);
            const data = await response.json();
            setTopics(data);
        } catch (error) {
            console.error("Error loading topics:", error);
        } finally {
            setIsLoading(false);
        }
    }, [subjectId]);

    return { topics, loadTopics, isLoading };
};
