import { PackItem, UserPackItems } from '../types/packItems';
import { WeatherPoint } from '../types/weather';
import { EventItem } from '../types/event';

export function buildItems(
    wx: WeatherPoint,
    event: EventItem,
    userItems: UserPackItems
): PackItem[] {
    const items: PackItem[] = [];

    // 1. 必須アイテム（常に）
    items.push(...userItems.essentials);

    // 2. 天気に応じたアイテム
    if (wx.precipitationChance >= 50) {
        items.push({
            name: '折り畳み傘',
            required: true,
            reason: '雨予報',
            category: 'weather',
        });
    }
    if (wx.tempMax <= 12) {
        items.push({
            name: '手袋',
            required: false,
            reason: '寒い',
            category: 'weather',
        });
    }
    if (wx.tempMax >= 28) {
        items.push({
            name: '日焼け止め',
            required: false,
            reason: '暑い',
            category: 'weather',
        });
    }

    // 3. イベントタイプに応じたアイテム
    if (/会議|Meeting|mtg|ミーティング/i.test(event.title)) {
        items.push({
            name: 'ノートPC',
            required: true,
            reason: '会議資料',
            category: 'event',
        });
        items.push({
            name: 'メモ帳',
            required: false,
            reason: '会議メモ',
            category: 'event',
        });
    }
    if (/運動|gym|workout|ジム|トレーニング|運動/i.test(event.title)) {
        items.push({
            name: 'タオル',
            required: true,
            reason: '運動',
            category: 'event',
        });
        items.push({
            name: '着替え',
            required: false,
            reason: '運動後',
            category: 'event',
        });
    }
    if (/カフェ|レストラン|ランチ|ディナー|飲み会/i.test(event.title)) {
        items.push({
            name: '財布',
            required: true,
            reason: '支払い',
            category: 'event',
        });
    }
    if (/映画|movie|cinema/i.test(event.title)) {
        items.push({
            name: 'チケット',
            required: true,
            reason: '映画鑑賞',
            category: 'event',
        });
    }
    if (/買い物|shopping/i.test(event.title)) {
        items.push({
            name: 'エコバッグ',
            required: false,
            reason: '買い物',
            category: 'event',
        });
    }

    // 4. パーソナライズされたアイテム（過去の学習から）
    // 簡易版: 同じイベントタイプで過去に追加されたものを提案
    const suggestedPersonal = suggestPersonalItems(event, userItems.personal);
    items.push(...suggestedPersonal);

    // 5. オプションアイテム（常に提案）
    items.push(
        { name: '充電器', required: false, category: 'optional' },
        { name: '水筒', required: false, category: 'optional' }
    );

    // 重複を除去（同じ名前のアイテムは最初のもののみ）
    const uniqueItems: PackItem[] = [];
    const seenNames = new Set<string>();
    for (const item of items) {
        if (!seenNames.has(item.name)) {
            seenNames.add(item.name);
            uniqueItems.push(item);
        }
    }

    return uniqueItems;
}

function suggestPersonalItems(
    event: EventItem,
    personalItems: PackItem[]
): PackItem[] {
    // 簡易版: イベントタイトルにキーワードが含まれていれば提案
    // 実装時は、過去のイベント履歴と持ち物の関連性を学習
    const eventKeywords = event.title.toLowerCase();
    return personalItems.filter(item => {
        // 同じカテゴリのイベントで過去に使ったアイテムを提案
        // より高度な実装では、機械学習を使用
        return true; // 簡易版では全て提案
    });
}

