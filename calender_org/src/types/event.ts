export type TransportMode = 'train' | 'bus' | 'walk' | 'bike' | 'car';

export interface EventItem {
  id: string;
  title: string;
  startISO: string; // 予定開始
  endISO: string;   // 予定終了
  place: string;
  lat?: number;
  lon?: number;
  travelMinutes?: number; // 入力がなければ推定
  bufferMinutes: number;  // 余裕時間
  mode: TransportMode;
}

export interface TransitETA {
  minutes: number;
  mode: TransportMode;
  walkMinutes?: number;
  transfers?: number;
  updatedAtISO: string;
}

