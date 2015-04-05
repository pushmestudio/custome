
// モジュールを登録(mainApp)
// 依存するモジュールを指定(ionic.mainApp.controllers,mainApp.services)
angular.module('mainApp', ['ionic', 'mainApp.controllers', 'mainApp.services'])

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
  // 新しいタブを作ったり、タブそのものを変更する場合は、tabs.htmkをを弄る。
  

  .state('custome', {
    url: "/custome",
    abstract: true,
    templateUrl: "templates/tabs.html"
  })

  // 各タブを選択時に表示するテンプレートやコントローラーなど指定

  .state('custome.init', {
    url: '/init',
    views: {
      'custome-init': {
        templateUrl: 'templates/tab-init.html',
        controller: 'InitCtrl'
      }
    }
  })

  .state('custome.boards', {
      url: '/boards',
      views: {
        'custome-boards': {
          templateUrl: 'templates/tab-boards.html',
          controller: 'BoardsCtrl'
        }
      }
    })
    .state('custome.tab-boards-detail', {
      url: '/boards/:boardId',
      views: {
        'custome-boards': {
          templateUrl: 'templates/tab-boards-detail.html',
          controller: 'BoardsDetailCtrl'
        }
      }
    })

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
