import {useState, useEffect} from 'react';
import {EventItem} from '../types/event';

const STORAGE_KEY = 'calendar_events';
export function useCalendar() {
    const [events, setEvents] = useState<EventItem[]>([]);
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setEvents(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load events:', e);
        }
    }, []);

    const addEvent = (event: EventItem) => {
        setEvents((prev) => {
            const updated = [...prev, event];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const getNextEvent = (): EventItem | null => {
        const now = new Date();
        const upcoming = events
            .filter((event) => new Date(event.startISO) > now)
            .sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime());
        return upcoming.length > 0 ? upcoming[0] : null;
    };

    const removeEvent = (id: string) => {
        setEvents((prev) => {
            const updated = prev.filter((event) => event.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    return { events, addEvent, getNextEvent, removeEvent };
}