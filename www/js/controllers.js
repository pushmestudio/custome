//これは(いったん)、各タブにひもづくコントローラーをまとめた.jsファイル

angular.module('mainApp.controllers', [])

//1つめのタブ(Init)を選択時に使用するコントローラー
.controller('InitCtrl', function($scope){
    $scope.selectBoard = function(){
        $scope.testMessage = "You should implement selectBoard method here via Controller."
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
  $scope.board = Boards.get($stateParams.boardId);
})

//3つめのタブ(Sample)を選択時に使用するコントローラー
//動作確認や、ノウハウ記録用に使用
.controller('SampleCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
})


.controller('InitCtrl3', function($scope){
    $scope.selectBoard = function(){
        $scope.testMessage = "You should implement selectBoard method here via Controller."
    };
});
