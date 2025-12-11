export interface WeatherPoint {
  dateISO: string; // e.g., "2025-11-07"
  condition: "sunny" | "cloudy" | "rain" | "wind" | "snow";
  tempMin: number; // °C
  tempMax: number; // °C
  humidity?: number; // % (dailyでは省略されることあり)
  windKmh?: number; // km/h
  precipitationChance: number; // %
}

