export interface GeocodedLocation {
    lat: number;
    lon: number;
    label: string;
}

// Resolve text address to coordinates using OpenStreetMap Nominatim (no API key).
// Note: Nominatim usage policy encourages identifying User-Agent and rate limiting.
export async function geocodeToCoords(query: string): Promise<GeocodedLocation | null> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=0`;
    const res = await fetch(url, {
        headers: {
            // Keep simple but identify the app politely.
            'Accept': 'application/json',
        }
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;
    const top = json[0];
    const lat = parseFloat(top.lat);
    const lon = parseFloat(top.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    return { lat, lon, label: top.display_name ?? query };
}


