// モジュールを登録(mainApp)
// 依存するモジュールを指定(ionic, mainApp.controllers)
angular.module('mainApp', ['ionic', 'mainApp.controllers'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})


// Angular JSの外部ツール(AngulatUI Router)を使用したルーティングを記述
//
// URLの変更に応じて、
// 呼び出すテンプレート(.html)を指定し、使用するコントローラーを指定
//
.config(function($stateProvider, $urlRouterProvider) {

  // 指定されたURLが下記ののいずれにも該当しない場合に表示するURLを指定
  // アプリ起動時には、/custome/init が表示される
  $urlRouterProvider.otherwise('/custome/init');


  // SPAの肝の部分
  // URLが変更された際に、<html></html>のすべてを読み込みなおすのでなく、
  // index.html内の<ion-nav-view>ここ</ion-nav-view>に、指定されたテンプレートが展開される

  $stateProvider
  // 今回使用する「タブ」を実現する大本の部分の指定。

  // tabs.html :
  // 複数のタブをここで定義している。
  // tabs.htmlの中で、タブ内で使用する画像や、文字列なども指定している
  // 新しいタブを作ったり、タブそのものを変更する場合は、tabs.htmlをを弄る。


  .state('custome', {
    url: "/custome",
    abstract: true,
    templateUrl: "templates/tabs.html"
  })

  // 各タブを選択時に表示するテンプレートやコントローラーなど指定
  // stateは階層構造を持ち、ドットで区切って設定する。以下のcustome.initは、customeが親view, initが子viewというイメージ
  // 子viewとして設定すると、テンプレートを表示する位置がデフォルトで親の内側になったり、URLが親のURLに続く(custome.initのurlは/custome/initとなる)

/*
  .state('custome.init', {
    url: '/init',
    views: {
      'custome-init': { // viewの名前
        templateUrl: 'templates/tab-init.html',
        controller: 'InitCtrl'
      }
    }
  })
*/
  //アプリ起動時の初期画面
  //タスクボード一覧を表示(暫定的)
  .state('custome.init', {
    // 2015/8/4 トーストを正常に表示させるため暫定的にCache無効 別の解決策が見つかれば削除予定
    cache: false,
    url: '/init',
    views: {
      'custome-init': { // viewの名前
        templateUrl: 'templates/boardsList.html',
        controller: 'BoardsCtrl'
      }
    }
  })

  .state('custome.templates', {
    url: '/init/templates',
    views: {
      'custome-init': { // viewの名前
        templateUrl: 'templates/boardTemplates.html',
        controller: 'BoardsCtrl'
      }
    }
  })

  .state('custome.board', {
    // 2015/8/4 トーストを正常に表示させるため暫定的にCache無効 別の解決策が見つかれば削除予定
    cache: false,
    url: '/init/:boardId',
    views: {
      'custome-init': {
        templateUrl: 'templates/board.html',
        controller: 'BoardsDetailCtrl'
      }
    }
  })

  .state('custome.pallet', {
    url: '/palletEdit',
    views: {
      'custome-init': { // viewの名前
        templateUrl: 'templates/boardPallet.html',
        controller: 'PalletCtrl'
      }
    }
  })

/*
  // initタブ内でboardの詳細を表示するために一時的に追加
  .state('custome.tab-init-board', {
    url: '/init/:boardId',
    views: {
      'custome-init': {
        templateUrl: 'templates/tab-boards-detail.html',
        controller: 'BoardsDetailCtrl'
      }
    }
  })
*/
  //2つ目のタブで使用
  .state('custome.boards', {
    url: '/boards',
    views: {
      'custome-boards': {
        templateUrl: 'templates/boardsList.html',
        controller: 'BoardsCtrl'
      }
    }
  })
  //2つ目のタブで使用
  .state('custome.tab-boards-detail', {
    url: '/init/:boardId',
    views: {
      'custome-boards': {
        templateUrl: 'templates/tab-boards-detail.html',
        controller: 'BoardsDetailCtrl'
      }
    }
  })

  //3つ目のタブで使用
  .state('custome.sample', {
    url: '/sample',
    views: {
      'custome-sample': {
        templateUrl: 'templates/tab-sample.html',
        controller: 'SampleCtrl'
      }
    }
  });
});
