import React, {useMemo} from 'react';
import {EventItem} from '../types/event';

interface Props {
    events: EventItem[];
    onRemove?: (id: string) => void;
}

export function MonthCalendar({events, onRemove}: Props) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const eventsByDate = useMemo(() => {
        const m = new Map<string, EventItem[]>();
        events.forEach(event => {
            const date = new Date(event.startISO).toISOString().slice(0, 10);
            if (!m.has(date)) m.set(date, []);
            m.get(date)?.push(event);
        });
        return m;
    }, [events]);

    const cells: Array<{day?: number, dateKey?: string}> = [];
    for (let i = 0; i < startWeekday; i++) cells.push({});
    for (let d = 1; d <= daysInMonth; d++) {
        const key = new Date(year, month, d).toISOString().slice(0, 10);
        cells.push({day: d, dateKey: key});
    }
    return (
        <div className="grid grid-cols-7 gap-2 text-sm">
        {['日','月','火','水','木','金','土'].map(w => (
            <div key={w} className="text-zinc-500 text-center">{w}</div>
          ))}
        {cells.map((c, idx) => {
        const evs = c.dateKey ? (eventsByDate.get(c.dateKey) ?? []) : [];
        return (
            <div key={idx} className="min-h-24 boarder rounded-lg p-2">
                <div className="text-center text-sm text-zinc-500">{c.day ?? ''}</div>
                    <div className="mt-1 space-y-1">
                        {evs.map(ev => (
                            <div key={ev.id} className="flex item-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-black"></span>
                                <span className="text-xs text-zinc-600">{ev.title}</span>
                                    {new Date(ev.startISO).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                            </div>
                        ))}
                    </div>
                    {onRemove && evs.length > 0 && (
                        <button onClick={() => onRemove(evs[0].id)} className="mt-2 text-xs text-red-500 hover:text-red-700">削除</button>
                    )}
                </div>
            );
            })}
        </div>
    );
}