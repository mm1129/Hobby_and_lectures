# My All-in-one Calender

[demo]

https://github.com/user-attachments/assets/0a4b55b5-f570-499b-b3cb-d6e14c0c7dc2

[Motivation]
This all-in-one calendar shows the weather and suggests appropriate clothes, items to bring, and the time to leave home for your next event.
With this, users can prepare for their upcoming schedule at a glance, without having to search for anything.

本実装は、ソフトウェア開発の授業第1週に、AIの支援を受けながら私が作成させていただいた叩き台です。
その後、別リポジトリにてチームメンバーと協力し、大幅な改変・改良を行いました（team-2a の皆さまに心より感謝申し上げます）。
本リポジトリは、当初私が担当した部分を記録として残すとともに、今後の参照用として保存しているものです。

完成系（チームで作成）：
https://team2a-mirror.vercel.app/
（画像生成には有料のAPIを要するためdemoになっている）
This won a 1st prize in Software Project class!

[My role]
天気予報
持ち物提案
服装提案
画像生成
位置情報
カレンダー
チャット


[How to use]
nodeがある前提で以下を実装
```
npm install
npm i -D @vitejs/plugin-react
npm i -D @tailwindcss/postcss
npm run dev
# ビルド
npm run build
npm run preview
```

実装はcursorを参考にreact+tailwind, typescriptで行いました。
実装内容:
- カレンダー、チャット、天気、服装・持ち物の提案、位置情報の取得or入力
- 服装：天気や趣味嗜好に合わせる、持ち物：天気や予定に合わせた提案
ToDo:
- [ ] 今はチャット入力のパースがルールベース→AIでスムーズにパースする
- [ ] UIやスタイル
- [ ] 服装の「スタイル」のキーワード　適切な言葉に
- [ ] AIでもっと便利にorルールベースの精緻化：　服装、持ち物、チャット
- [ ] 電車でのルート提供・乗換案内
- [ ] チャット・音声・画像処理の向上
- [ ] 「大胆・セクシー」を減らし、男性用の無難なファッションも
- [ ] 「次の予定」「予定の概況」にはそれが何日なのかを示す
- [ ] ウィジェットに
