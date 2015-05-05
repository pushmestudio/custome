//これは(いったん)、各タブにひもづくコントローラーをまとめた.jsファイル
// mainApp.controllersというモジュールを定義する
angular.module('mainApp.controllers', [])

//InitCtrlは削除予定。

/*
//1つめのタブ(Init)を選択時に使用するコントローラーを定義する(.controllerはmainApp.controllersというモジュールの短縮表記)
// コントローラの実態は、AngularJSのスコープオブジェクト($scope)を引数として使用する、JavaScriptのオブジェクト
.controller('InitCtrl', function($scope, $ionicModal){
  // modalの定義
  $ionicModal.fromTemplateUrl('templates/selectboard-modal.html', {
    scope: $scope,
    animataion: 'slide-in-up'
  }).then(function(modal){
    $scope.modal = modal;
  });

  $scope.selectBoard = function(){
    $scope.modal.show();
  };

  $scope.closeModal = function(){
    $scope.modal.hide();
  };
})

*/
//Boardの一覧を表示したり，一覧から削除するコントローラー
.controller('BoardsCtrl', function($scope, Boards, DBConn) {
  DBConn.connect(); // 使用する前に接続処理を行う
  $scope.boards = Boards.all();
  $scope.remove = function(board) {
    Boards.remove(board);
  }
})

//Board上に操作を加えるコントローラー
//(as of 4/25では，バックグラウンドに壁紙指定のみ)
.controller('BoardsDetailCtrl', function($scope, $stateParams, Boards, DBConn) {
  // このコントローラーはapp.js内で/board/:boardIdに関連付けられているため、この/board/0にアクセスしたとき
  // stateParams = { boardId : 0}となる
  $scope.board = Boards.get($stateParams.boardId);

  // テスト用 //TODO:テスト終了後削除
  var bCont = '{parts:[{"partId":"8888"}]}';
  var bId = '1430626351000';
  DBConn.save(bCont, bId);
})

//3つめのタブ(Sample)を選択時に使用するコントローラー
//動作確認や、ノウハウ記録用に使用
.controller('SampleCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
})
