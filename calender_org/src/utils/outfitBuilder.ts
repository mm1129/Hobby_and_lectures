import { WeatherPoint } from '../types/weather';
import { OutfitSuggestion, UserOutfitPreference } from '../types/outfit';

export function buildOutfit(
    wx: WeatherPoint,
    preference: UserOutfitPreference = { style: 'casual', temperature: 'comfortable' }
): OutfitSuggestion {
    const t = wx.tempMax;
    const style = preference.style;
    let base: Partial<OutfitSuggestion> = {};

    // 気温ベースの基本服装
    if (t <= 12) {
        base = { tops: 'ニット', outer: 'コート', bottoms: '厚手パンツ', shoes: 'ブーツ', notes: '寒冷。防寒優先' };
    } else if (t <= 18) {
        base = { tops: '長袖シャツ', outer: '薄手ジャケット', bottoms: 'チノ', shoes: '防水スニーカー' };
    } else if (t <= 24) {
        base = { tops: '長袖/薄手', bottoms: 'チノ', shoes: 'スニーカー' };
    } else {
        base = { tops: '半袖', bottoms: '軽量パンツ', shoes: '通気性スニーカー' };
    }

    // スタイルで調整
    switch (style) {
        case 'formal':
            if (t <= 18) {
                base = { ...base, tops: 'シャツ', outer: 'ジャケット', bottoms: 'スラックス', shoes: '革靴' };
            }
            break;
        case 'sporty':
            base = { ...base, tops: 'スポーツウェア', bottoms: 'トレーニングパンツ', shoes: 'ランニングシューズ', outer: undefined };
            break;
        case 'casual':
            // 既存のbaseをそのまま使用
            break;
        case 'street':
            base = { ...base, outer: 'パーカー', shoes: 'スニーカー' };
            break;
        case 'smart':
            base = { ...base, outer: 'カーディガン', shoes: 'ローファー' };
            break;
        case 'elegant':
            base = { ...base, outer: 'コート', shoes: 'ヒール' };
            break;
        case 'cool':
            base = { ...base, outer: 'デニムジャケット', shoes: 'ブーツ' };
            break;
        case 'cute':
            base = { ...base, tops: 'フリルブラウス', bottoms: 'スカート', shoes: 'フラットシューズ' };
            break;
        case 'sexy':
            base = { ...base, tops: 'タンクトップ', bottoms: 'スキニーパンツ', shoes: 'ヒール' };
            break;
        case 'naughty':
            base = { ...base, tops: 'レザージャケット', bottoms: 'スキニーパンツ', shoes: 'ブーツ' };
            break;
    }

    // 避けたいアイテムを除外（簡易版）
    if (preference.avoidItems) {
        Object.keys(base).forEach(key => {
            const value = base[key as keyof OutfitSuggestion];
            if (typeof value === 'string' && preference.avoidItems?.some(avoid => value.includes(avoid))) {
                // 代替案を提案（簡易版ではそのまま）
            }
        });
    }

    // 雨予報の場合は注意書きを追加
    const notes = wx.precipitationChance >= 50 ? '雨に備え防水推奨' : base.notes;

    return {
        tops: base.tops || '長袖シャツ',
        outer: base.outer,
        bottoms: base.bottoms || 'チノ',
        shoes: base.shoes || 'スニーカー',
        notes,
        style,
    };
}
