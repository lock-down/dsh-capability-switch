<p align="right"><a href="README.md">中文</a> | <a href="README.en.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ru.md">Русский</a> | <a href="README.pt.md">Português</a></p>

# DSH Skills と MCP 管理

DSH のサイドバーからローカル Skills と MCP サーバーを管理するプラグインです。DSH のテーマトークンを使用し、iframe は埋め込みません。サイドバーのエントリは `Skills と MCP` です。

グローバルの `~/.agents/skills` はモデルの Skill カタログに入りません。明示的に同期した Skill だけが DSH に追加されます。

![Skills 管理画面](docs/screenshots/overview.png)

## 主な機能

- ユーザー/プロジェクト Skill の検索、作成、編集、有効化、無効化、削除。
- グローバル Agent ディレクトリの Skill をモデルから隠し、選択した Skill のみ同期。
- シンボリックリンク/コピー同期、同期モードの表示、同期前のプレビューとバックアップ。
- チェックボックスによる複数選択と一括削除。
- `.zip` Skill パッケージをドラッグ＆ドロップまたはファイル選択でインポート。
- MCP Manager とスタンドアロン MCP のフォーム/JSON 編集、接続テスト、再接続、インポート、ホスト承認。
- npm インストールの自動更新と GitHub Release ノート。

## インストール

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

ソースからインストールする場合は、リポジトリを取得して `npm install --ignore-scripts` を実行し、DSH の「プラグイン」→「プラグインを追加」でディレクトリを選択します。現在のバージョンは DSH `0.2.3-alpha.2` を対象に検証しています。

## 言語

UI は DSH の「設定 → 一般 → 言語」に従い、`zh`、`en`、`ja`、`es`、`fr`、`de`、`ru`、`pt` の 8 言語に対応します。言語を切り替えると UI は自動的に更新されます。

Skill と MCP の一覧内容は翻訳されません。名前、説明、SKILL.md の内容、コマンド、URL は元の言語のまま表示されます。

## データと権限

ローカルの `~/.dsh/skills`、`~/.agents/skills`、`~/.dsh/capability-switch`、現在の DSH プロファイルの `cordis.patch.yml` にアクセスします。ネットワークアクセスは npm registry（自動更新）と GitHub Releases API（リリースノート）に限られます。Skills、MCP 設定、認証情報はアップロードしません。

## ドキュメント

完全なドキュメントは [English](README.en.md) または [中文](README.md) を参照してください。

## ライセンス

[MIT](LICENSE)
