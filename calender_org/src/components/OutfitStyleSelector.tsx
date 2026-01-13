import React from 'react';
import {OutfitStyle} from '../types/outfitStyle';

interface Props {
    currentStyle: OutfitStyle;
    onStyleChange: (style: OutfitStyle) => void;
}

export function OutfitStyleSelector({currentStyle, onStyleChange}: Props) {
    const styles : {value: OutfitStyle, label: string}[] = [
        {value: 'formal', label: '正式'},
        {value: 'casual', label: 'カジュアル'},
        {value: 'sporty', label: 'スポーツ'},
        {value: 'street', label: '街頭'},
        {value: 'smart', label: 'スマート'},
        {value: 'elegant', label: 'エレガント'},
        {value: 'cool', label: 'クール'},
        {value: 'cute', label: 'キュート'},
        {value: 'sexy', label: 'セクシー'},
        {value: 'naughty', label: 'ナイーナイ'},
    ]
    return (
        <div className="flex gap-2">
            {styles.map(style => (
                <button
                key={style.value}

                onClick={() => onStyleChange(style.value)}
                className={`px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors ${currentStyle === style.value ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                >
                    {style.label}
                </button>
            ))}
        </div>
    );
}
