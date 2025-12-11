import { useState, useEffect } from 'react';
import { PackItem, UserPackItems } from '../types/packItems';

const STORAGE_KEY = 'user_pack_items';

export function usePackItems() {
    const [userItems, setUserItems] = useState<UserPackItems>({
        essentials: [
            { name: 'ICカード', required: true, category: 'essential' },
            { name: '鍵', required: true, category: 'essential' },
        ],
        personal: [],
    });

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setUserItems(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load pack items', e);
        }
    }, []);

    const addPersonalItem = (item: PackItem) => {
        setUserItems(prev => {
            const updated = {
                ...prev,
                personal: [...prev.personal, item],
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const removePersonalItem = (itemName: string) => {
        setUserItems(prev => {
            const updated = {
                ...prev,
                personal: prev.personal.filter(item => item.name !== itemName),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    return { userItems, addPersonalItem, removePersonalItem };
}

