# オペレーションガイド
## チケット使用方針
### ストーリー
優先順位の意味は各Termによって変わるが、数字が大きいほど優先順位が高い

- Descriptionには完了基準を書く
- ストーリーポイント、優先度、"Story"、それぞれ適切なラベルを選ぶ

  * 5(Urgent): 早々に取り掛かるイメージ
  * 4: 中間リリースで終わっているくらいのイメージ
  * 3: 大体3くらいまでが確実にリリース期間中に終わらせるイメージ
  * 2: 優先順位見直しの中で昇格すればリリースまでに実施の可能性もあるようなイメージ
  * 1(Lowest): 恐らく今回はやらないだろうけど...くらいのイメージ

- マイルストーンはイテレーションを示す
- ユーザーストーリはいつでも誰でも追加OK

  * チームで合意前は"Story"及び"TBD"ラベルのみを付けておく

### タスク

- ストーリに紐づくタスクではSubjectの先頭にチケット番号(#xx)を書く
- "Task"をラベルとして記載する
- 原則、優先順位やストーリーポイントは付さない
- アサイン担当には誰かを割り当てる
- マイルストーンは適切なものを選ぶ

### マージリクエスト
次の内容をテンプレートとする

- 変更内容の概要
- テストケース実施のための事前準備
- テストケース
- やり残し、今回レビュー対象外のもの、その他

## 作業手順方針

1. 最新のマスターを取得する
    * `git checkout master; git pull --ff-only`

2. これからやろうとしている作業の固まりがわかるブランチを切る
    * `git checkout -b feature-動名詞-目的語` (e.g. feature-adding-boardName)

3. 作業の区切り毎にコミットする(一行目がNetwork欄に表示されるので長くなり過ぎないように注意)
    * `git add .; git commit -m "動詞(命令形) 目的語 #チケットNO"`

    もし詳細を書いた方がいい場合は次のとおりにする

    `git add .; git commit` (エディタ起動)

    ```
    一行目 動詞(命令形) 目的語 #チケットNO 二行目
    (空行)
    三行目以降、自由記述による詳細
    ```
    尚、チケット記載の処理が次のコミットで終了、というタイミングの場合は、

    `git commit -m "動詞(命令形) 目的語 close #111, #108"`とすれば、チケット111と108が、マスターにマージされた後、自動で閉じる

4. commitしたらpush
    * `git push` (git configのpush.defaultを変更していない場合はgit push ブランチ名 とする必要がある)

5. ブランチ全体(チケット記載の処理の実装)が終わるまで3, 4繰り返し、作業途中でMasterの更新があれば可能な限り早いタイミングで取り込む
    * `git merge origin/master`
    * コンフリクトが発生したら、`git mergetool`あるいは、自分で各コンフリクト発生ファイルのコンフリクト発生箇所を特定して修正

6. チケット記載の処理の実装が終わったら最新のMasterを取り込んで(`git merge origin/master`)からマージリクエストの作成(GitLab上にて)、レビューを依頼

7. 再修正が必要な場合は、同じブランチ上(例えば、feature-adding-boardNameでマージリクエストを出していたなら同じくfeature-adding-boardName)で修正し、再Push。こうすれば、既存のマージリクエストが使いまわせる。

8. 無事マージされたら終了

その他、必要に応じて[リファレンス参照](http://qiita.com/tkhm/items/8d9d669e140aef63cdb9)

## JSDoc アノテーション記載方針
**なるべく** (絶対じゃないよ！大事)JSDocのアノテーションを付与することで、自分以外の人や、数カ月後の自分が見たときに辛い思いをしないようにする。また、付したアノテーションによって、`jsdoc`でドキュメントを生成するとそれとなくいい感じになる。

### 各モジュール
各ctrlやservicesなどに次のように付加する。
下記のように、`.factory`や`.controller`直後に記載。

* `@module` モジュール名。`ファイル名.モジュール名`とする(サイドメニューがファイルごとに綺麗に索引できるので)
* `@description` このモジュールの説明
* `@requires` 依存するモジュール名(JSDocで見るときにこれがあると楽なので)、1つにつき1行

```
angular.module('mainApp.dbConnector', ['mainApp.services'])
/**
 * @module dbConnector.DBConn
 * @description DB接続
 * @requires d
 */
.factory('DBConn', function(d) {
    var module = this;
    :
    :
}
```

### 各関数
下記のように各変数に記載。また、おまけだが、面倒なときは、`@private`をつけることで一時的に記載を省略するのもOK。

* `@function` 関数名
* `@description` この関数の説明
* `@param` 引数、複数あるときは1つの引数に付き1行使う
* `@return` 戻り値
* `@see {@link }` 実装のあたり参考にした情報など"{}"内にリンクを、その後に説明を

```
/**
 * @function getAllMyBoard
 * @description ボード配列を引数にDBから全件取得する
 * @param allMyBoard ボード配列
 * @return myBoard ボードの一覧オブジェクト
 * @see {@link http://usejsdoc.org/} JSDocのアノテーションつけるときはここで探したわ～
 */
var getAllMyBoard = function(allMyBoard) {
  return myBoard;
}
```

### jsdocによるドキュメントの作り方

1. jsdocをインストールする

  `npm -g install jsdoc`

2. jsdocを生成する

  プロジェクトルート(`custome`)にて`jsdoc -r www/js`とすれば、`out`以下が全て更新される

* 参考情報
  - [jsdoc3/jsdoc · GitHub](https://github.com/jsdoc3/jsdoc)
  - [Use JSDoc: Index](http://usejsdoc.org/)
