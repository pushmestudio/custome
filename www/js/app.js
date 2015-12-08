/**
 * @fileOverview メインモジュール(mainApp)、アプリ内の共通設定もここで定義している
 * 依存するモジュール(ionic, mainApp.controllers)についても指定している
 * @copyright PushMe Studio 2015
 */
angular.module('mainApp', ['ionic', 'mainApp.controllers'])

.run(function($ionicPlatform, $rootScope) {
  //デバッグ出力の有無、リリース時はfalseにする
  $rootScope.debugMode = true;

  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard for form inputs)
    // 20150910(tomita)キーボード用のPluginを使う予定はないのでコメントアウト
    /*
    if (window.cordova && window.cordova.plugins.Keyboard ) {
       cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    */
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

// Angular JSの外部ツール(AngulatUI Router)を使用したルーティングを記述
// URLの変更に応じて、呼び出すテンプレート(.html)を指定し、使用するコントローラーを指定
.config(function($stateProvider, $urlRouterProvider, $compileProvider) {
  /*
  $sceDelegateProvider.resourceUrlWhitelist([
    'self',
    , 'blob:**'
    , 'data:**'
    , 'content:**'
  ]);*/

  // ローカル画像を読込み，サムネイルや背景などで表示するための設定
  // この設定でサニタイズしない場合は，angularのセキュリティでUnsafe扱いとなってしまう
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(content|file|data|http):/);

  // 指定されたURLが下記ののいずれにも該当しない場合に表示するURLを指定
  // アプリ起動時には、/custome/init が表示される
  $urlRouterProvider.otherwise('/custome');

  // SPAの肝の部分
  // URLが変更された際に、<html></html>のすべてを読み込みなおすのでなく、
  // index.html内の<ion-nav-view>ここ</ion-nav-view>に、指定されたテンプレートが展開される

  $stateProvider
  // 今回使用する「タブ」を実現する大本の部分の指定。

  // tabs.html :
  // 複数のタブをここで定義している。
  // tabs.htmlの中で、タブ内で使用する画像や、文字列なども指定している
  // 新しいタブを作ったり、タブそのものを変更する場合は、tabs.htmlをを弄る。

  /*
  .state('custome', {
    url: '/custome',
    abstract: true,
    //templateUrl: "templates/tabs.html"
  })
  */

  // 各タブを選択時に表示するテンプレートやコントローラーなど指定
  // stateは階層構造を持ち、ドットで区切って設定する。以下のcustome.initは、customeが親view, initが子viewというイメージ
  // 子viewとして設定すると、テンプレートを表示する位置がデフォルトで親の内側になったり、URLが親のURLに続く(custome.initのurlは/custome/initとなる)

  // アプリ起動時の初期画面
  // タスクボード一覧を表示(暫定的)
  .state('custome', {
    // 2015/8/4 トーストを正常に表示させるため暫定的にCache無効 別の解決策が見つかれば削除予定
    cache: false,
    url: '/custome',
    templateUrl: 'templates/boardsList.html',
    controller: 'BoardsCtrl'
  })

  .state('templates', {
    url: '/templates',
    templateUrl: 'templates/boardTemplates.html',
    controller: 'BoardsCtrl'
  })

  .state('board', {
    // 2015/8/4 トーストを正常に表示させるため暫定的にCache無効 別の解決策が見つかれば削除予定
    cache: false,
    url: '/:boardId',
    templateUrl: 'templates/board.html',
    controller: 'BoardsDetailCtrl'
  })

  .state('pallet', {
    url: '/palletEdit',
    templateUrl: 'templates/boardPallet.html',
    controller: 'PalletCtrl'
  })

});
