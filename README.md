# Aidech Management Web Slides

Aidech Management の営業用Webスライドです。Google Drive上のスライド画像を読み込み、台本を見ながら操作できます。

## 操作

- `→` / `Space`：次のスライド
- `←`：前のスライド
- `N`：現在スライドの台本を表示
- `S`：台本操作パネルを表示
- `M`：スライド一覧
- `F`：全画面
- `Esc`：パネルを閉じる

## 台本からのスライド操作

`S` キー、または右下の「台本操作」ボタンで台本操作パネルを開けます。  
台本カードをクリックすると、その台本に対応するスライドへ移動します。  
台本操作パネルを開いた状態では、`Enter` で次の台本、`Backspace` で前の台本に進めます。

## GitHub Pagesで公開

1. GitHub の `Settings` → `Pages`
2. `Deploy from a branch`
3. Branch: `main` / folder: `/root`
4. 保存後、発行URLを確認

## Vercelで公開

1. Vercel でこのリポジトリを Import
2. Framework Preset: `Other`
3. Build Command: 空欄
4. Output Directory: 空欄
5. Deploy

## 注意

スライド画像は Google Drive の画像URLを参照しています。画像が表示されない場合は、Drive側の共有設定を「リンクを知っている全員が閲覧可」にしてください。
