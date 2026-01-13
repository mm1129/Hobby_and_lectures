import { useState, useEffect } from 'react';

interface Location {
    lat: number;
    lon: number;
    label?: string;
}

export function useGeolocation() {
    const [location, setLocation] = useState<Location | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(()=> {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            // ToDo: ユーザーの入力で場所を検索してその結果をsetLocationに
            // フォールバック: デフォルト位置（渋谷）を使用
            setLocation({
                lat: 35.658034,
                lon: 139.701636,
                label: "Shibuya",
            });
            setLoading(false);
            return;
        }
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    label: "Current Location",
                });
                setLoading(false);
            },
            (error) => {
                // フォールバック: デフォルト位置（渋谷）を使用
                setLocation({
                    lat: 35.658034,
                    lon: 139.701636,
                    label: "Shibuya",
                });
                setError(error.message);
                setLoading(false);
            },
            { timeout: 5000, enableHighAccuracy: false }
        );
    }, []);
    const setManualLocation = (loc: Location) => {
        setLocation(loc);
        setError(null);
        setLoading(false);
    };
    return { location, error, loading, setManualLocation };
}

