[English](README.md) | [日本語](README.ja.md) | [中文](README.zh.md)

# BookRoll PDF ダウンローダー

[BookRoll](https://www.let.media.kyoto-u.ac.jp/project/digital-teaching-material-delivery-system-bookroll/) の電子教材を全ページ自動でキャプチャし、1つのPDFとして保存するChrome拡張機能です。

## インストール方法

1. このリポジトリをダウンロードして解凍する
2. Chromeで `chrome://extensions` を開く
3. 右上の**デベロッパーモード**をオンにする
4. **パッケージ化されていない拡張機能を読み込む**をクリックし、解凍したフォルダを選択する
5. ツールバーに拡張機能のアイコンが表示される

## 使い方

1. ChromeでBookRollの教材ページを開く
2. 拡張機能のアイコンをクリックする
3. **Scan Pages** をクリック — 自動的に全ページをめくりながらキャプチャする
4. スキャン完了後、**Download PDF** をクリックする

## 注意事項

- スキャン中はページを操作しないでください
- ページが `material-canvas` 要素でレンダリングされているBookRollに対応しています
- 個人利用のみを目的としています。各大学の利用規約および著作権に従ってご利用ください。

## 仕組み

各ページの `canvas.material-canvas` 要素の内容を読み取り、キャンバスのピクセル特徴を比較することでページ遷移を検出します。取得した画像を外部ライブラリなしでPDFバイナリに直接組み立てて保存します。
