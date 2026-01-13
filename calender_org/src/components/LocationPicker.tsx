import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { geocodeToCoords } from '../utils/geocoding';

interface Props {
    locationLabel?: string | null;
    loading: boolean;
    error?: string | null;
    onManualSet: (lat: number, lon: number, label: string) => void;
}

export function LocationPicker({ locationLabel, loading, error, onManualSet }: Props) {
    const [editing, setEditing] = useState(false);
    const [query, setQuery] = useState('');
    const [resolving, setResolving] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleResolve = async () => {
        if (!query.trim()) return;
        setResolving(true);
        setLocalError(null);
        try {
            const result = await geocodeToCoords(query.trim());
            if (!result) {
                setLocalError('場所が見つかりませんでした');
            } else {
                onManualSet(result.lat, result.lon, result.label);
                setEditing(false);
            }
        } finally {
            setResolving(false);
        }
    };

    return (
        <div className="mt-3 mb-1 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 text-zinc-700">
                <MapPin className="h-4 w-4" />
                現在地:
                <span className="font-medium">{loading ? '取得中…' : (locationLabel ?? '未設定')}</span>
            </span>
            <button
                className="px-2 py-1 rounded border text-xs hover:bg-zinc-50"
                onClick={() => setEditing(s => !s)}
            >
                {editing ? '閉じる' : '変更'}
            </button>
            {(editing || error) && (
                <div className="flex items-center gap-2">
                    <input
                        className="px-2 py-1 border rounded text-sm"
                        placeholder="例: 渋谷駅 / Tokyo Station"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleResolve()}
                    />
                    <button
                        onClick={handleResolve}
                        disabled={resolving}
                        className="px-3 py-1 rounded bg-black text-white text-xs disabled:opacity-60"
                    >
                        {resolving ? '検索中…' : '設定'}
                    </button>
                    {(error || localError) && (
                        <span className="text-xs text-red-600">{localError ?? error}</span>
                    )}
                </div>
            )}
        </div>
    );
}


