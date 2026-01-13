export interface PackItem {
    name: string;
    required: boolean;
    reason?: string;
    category: 'essential' | 'personal' | 'event' | 'weather'| 'optional';
}
export interface UserPackItems {
    essentials: PackItem[];
    personal: PackItem[];
}