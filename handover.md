�
Hugo v0.161 と Congo v1.6.4 の互換性問題。
Congoのテンプレートが古いHugo APIを使用している：

1. `head.html` の `.Site.Author.name` → Hugo v0.161では廃止
2. `analytics.html` の `.Site.IsServer` → 同様に廃止

`layouts/partials/head.html` をプロジェクト側にコピーして手動修正を試みたが、
`analytics.html` でも同様のエラーが発生し、修正箇所が多いと判断。

### 試みた対処
- `layouts/partials/head.html` をオーバーライドして `.Site.Author` を修正 → 別エラーが発生
- `hugo mod get github.com/jpanther/congo@v0.8.0` で旧バージョン指定 → タグが存在せずエラー

---

## 推奨する次のステップ

Hugo Modulesをやめて **git submodule方式** に切り替える。

```bash
cd ~/work/website2026

# クリーンアップ
rm -rf _vendor
rm go.mod go.sum
rm config/_default/module.toml
rm layouts/partials/head.html   # 手動修正ファイル

# git初期化
git init

# Congoをstableブランチのsubmoduleとして追加
git submodule add -b stable https://github.com/jpanther/congo.git themes/congo

# hugo.tomlにテーマを指定
echo 'theme = "congo"' >> hugo.toml

# 動作確認
hugo server
```

---

## ディレクトリ構成（現在）

```
website2026/
├── hugo.toml                    # メイン設定（要 theme = "congo" 追記）
├── go.mod                       # Hugo Modules（削除予定）
├── go.sum                       # Hugo Modules（削除予定）
├── config/
│   └── _default/
│       ├── config.toml          # サイト基本設定
│       ├── params.toml          # Congoパラメータ
│       ├── menus.toml           # ナビゲーションメニュー
│       ├── markup.toml          # Markdownレンダリング設定
│       └── module.toml          # テーマ指定（削除予定）
├── layouts/
│   └── partials/
│       └── head.html            # 手動修正ファイル（削除予定）
├── content/                     # コンテンツ（空）
├── assets/                      # カスタムCSS等（空）
└── _vendor/                     # vendored modules（削除予定）
    └── github.com/jpanther/congo/
    ```

---

## セットアップ後にやること

1. **基本情報の設定**（`config/_default/config.toml`）
   - サイトタイトル、言語（日英切替）、著者名

2. **プロフィールページの作成**
   - 所属：JAEA / Advanced Science Research Center
      - 研究内容：J-PARC E42/E88（カオン核相互作用）、RHIC-STAR BES-II

3. **論文リストページの作成**
   - Physical Review Letters投稿中の論文（J-PARC E42結果）を含む

4. **GitHub Pagesへのデプロイ設定**
   - リポジトリ名：`f-oura/website2026` または `f-oura.github.io`
      - GitHub Actionsでの自動デプロイ設定

---

## 参考リンク
- Congo公式ドキュメント：https://jpanther.github.io/congo/docs/
- Congo GitHubリポジトリ：https://github.com/jpanther/congo
- Hugo公式ドキュメント：https://gohugo.io/documentation/
~