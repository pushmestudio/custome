# 全体概要
Ionicを使用したハイブリッドアプリケーション。現時点ではAndroidのみ対応。

# セットアップ

* Requirement: Java8 or later, NodeJS, Yarn(JS), Android SDK
* Recommendation: Atom + パッケージ2種(linter by atom-community, linter-eslint by AtomLinter), Android Studio

Java, NodeJS, Yarnはそれぞれインストール後にパスを通す。(CLI上で`java`, `node`, `yarn`のコマンドが実行できる状態ならOK)

Android SDKについては、SDKとツールのみあれば良いが、ページが度々変わるなど、手順の確立が難しいので、基本的にはAndroid Studioをダウンロードする。細かなセットアップはWikiを参照。

上記を準備後、ブラウザで動かすなら`yarn serve`(`yarn ionic serve`と同じ)、Android環境を整えるなら`yarn setup`(`yarn ionic state restore`と同じ)を実施する。

# その他
## Cordovaのプラグインについて
`cordova plugin add xxxxxx --save`で追加することにより、`package.json`に記録可能。
`yarn setup`(`ionic state restore`)を実施することで、`package.json`に保存してあるプラットフォームとプラグインを復元可能なので、`--save`処理は非常に重要。
