import { EventItem, TransportMode } from '../types/event';

export async function parseEventFromText(text: string): Promise<EventItem | null> {
    // 簡易版: 正規表現で抽出
    // TODO: OpenAI APIやClaude APIを使用してより正確に抽出

    const now = new Date();
    let targetDate = new Date(now);
    let hour = 9; // デフォルト9時
    let minute = 0;
    let title = '';
    let place = '未指定';
    let mode: TransportMode = 'train';

    // 日付の抽出
    const dateMatch = text.match(/(今日|明日|明後日|(\d{1,2})月(\d{1,2})日|(\d{1,2})\/(\d{1,2}))/);
    if (dateMatch) {
        const dateStr = dateMatch[1];
        if (dateStr === '今日') {
            targetDate = new Date(now);
        } else if (dateStr === '明日') {
            targetDate = new Date(now);
            targetDate.setDate(now.getDate() + 1);
        } else if (dateStr === '明後日') {
            targetDate = new Date(now);
            targetDate.setDate(now.getDate() + 2);
        } else if (dateMatch[2] && dateMatch[3]) {
            // "1月15日"形式
            const month = parseInt(dateMatch[2]) - 1;
            const day = parseInt(dateMatch[3]);
            targetDate = new Date(now.getFullYear(), month, day);
        } else if (dateMatch[4] && dateMatch[5]) {
            // "1/15"形式
            const month = parseInt(dateMatch[4]) - 1;
            const day = parseInt(dateMatch[5]);
            targetDate = new Date(now.getFullYear(), month, day);
        }
    }

    // 時刻の抽出
    const timeMatch = text.match(/(\d{1,2})時(?:(\d{1,2})分)?/);
    if (timeMatch) {
        hour = parseInt(timeMatch[1]);
        if (timeMatch[2]) {
            minute = parseInt(timeMatch[2]);
        }
    }

    // 場所の抽出（地名や駅名）
    const placeKeywords = ['渋谷', '新宿', '池袋', '上野', '東京', '本郷', '銀座', '六本木', '表参道', '原宿', '代々木', '恵比寿', '目黒', '品川'];
    for (const keyword of placeKeywords) {
        if (text.includes(keyword)) {
            place = keyword;
            break;
        }
    }
    
    // 駅名、建物名などの抽出
    if (place === '未指定') {
        const placeMatch = text.match(/([^\s]+駅|[^\s]+大学|[^\s]+ビル|[^\s]+ホール|[^\s]+会議室|[^\s]+カフェ|[^\s]+レストラン)/);
        if (placeMatch) {
            place = placeMatch[1];
        }
    }

    // タイトルの抽出（会議、ミーティング、打ち合わせなど）
    const titleMatch = text.match(/(会議|ミーティング|打ち合わせ|予定|イベント|セミナー|勉強会|飲み会|ランチ|ディナー|カフェ|映画|買い物|散歩|運動|ジム|トレーニング|レッスン|授業|講義|試験|面接|面談|デート|遊び)/);
    if (titleMatch) {
        title = titleMatch[1];
    } else {
        // タイトルが見つからない場合は、日時と場所以外の部分をタイトルにする
        const cleanedText = text
            .replace(/(今日|明日|明後日|\d{1,2}月\d{1,2}日|\d{1,2}\/\d{1,2})/g, '')
            .replace(/\d{1,2}時\d{1,2}分?/g, '')
            .replace(place, '')
            .trim();
        title = cleanedText || '予定';
    }

    // 交通手段の抽出
    if (/電車|JR|地下鉄|train/i.test(text)) {
        mode = 'train';
    } else if (/バス|bus/i.test(text)) {
        mode = 'bus';
    } else if (/歩き|徒歩|walk/i.test(text)) {
        mode = 'walk';
    } else if (/自転車|bike|cycle/i.test(text)) {
        mode = 'bike';
    } else if (/車|car|drive/i.test(text)) {
        mode = 'car';
    }

    // 日時が設定されていない場合はnullを返す
    if (!dateMatch && !timeMatch) {
        return null;
    }

    targetDate.setHours(hour, minute, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(hour + 1, minute, 0, 0); // デフォルト1時間

    const event: EventItem = {
        id: `event_${Date.now()}`,
        title: title || '予定',
        startISO: targetDate.toISOString(),
        endISO: endDate.toISOString(),
        place,
        bufferMinutes: 10,
        mode,
    };

    return event;
}
