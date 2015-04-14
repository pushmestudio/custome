//これは(いったん)、各タブにひもづくコントローラーをまとめた.jsファイル
// mainApp.controllersというモジュールを定義する
angular.module('mainApp.controllers', [])

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

//2つめのタブ(Boards)を選択時に使用するコントローラー
.controller('BoardsCtrl', function($scope, Boards) {
  $scope.boards = Boards.all();
  $scope.remove = function(board) {
    Boards.remove(board);
  }
})

//2つめのタブ(Boards)を選択し、いずれかのBoardを選択した時に使用するコントローラー
.controller('BoardsDetailCtrl', function($scope, $stateParams, Boards) {
  // このコントローラーはapp.js内で/board/:boardIdに関連付けられているため、この/board/0にアクセスしたとき
  // stateParams = { boardId : 0}となる
  $scope.board = Boards.get($stateParams.boardId);
})

//3つめのタブ(Sample)を選択時に使用するコントローラー
//動作確認や、ノウハウ記録用に使用
.controller('SampleCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
})

// これなに？
/*
.controller('InitCtrl3', function($scope){
    $scope.selectBoard = function(){
        $scope.testMessage = "You should implement selectBoard method here via Controller."
    };
});
*/
