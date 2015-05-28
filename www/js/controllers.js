//これは(いったん)、各タブにひもづくコントローラーをまとめた.jsファイル
// mainApp.controllersというモジュールを定義する
angular.module('mainApp.controllers', [])

//InitCtrlは削除予定。
// TODO:不要なら早く消すこと @5/24
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
  // 使用する前に接続処理を行う
  // ここでDBから全Boardsを持ってくる処理を書く
  // 接続が終わったら取得、取得が終わったら変数に反映
  DBConn.connect().then(function() {
    DBConn.getAll().then(function(data) {
      Boards.addAllMyBoards(data);
      $scope.myBoards = Boards.getMyBoards();
    });
  });

  // テンプレート一覧を読み込む
  $scope.boards = Boards.all();
  $scope.remove = function(board) {
    Boards.remove(board);
  }
})

//Board上に操作を加えるコントローラー
//(as of 4/25では，バックグラウンドに壁紙指定のみ)
.controller('BoardsDetailCtrl', function($scope, $stateParams, Boards, DBConn, Parts) {
  // このコントローラーはapp.js内で/board/:boardIdに関連付けられているため、この/board/0にアクセスしたとき
  // stateParams = { boardId : 0}となる
  // パーツの読込
  DBConn.load($stateParams.boardId).then(function(boardData){
    // board.htmlで使用できるようにバインドする
    $scope.boardData = boardData;
    Parts.reDeploy(boardData.boardContent);
  });
  $scope.board = Boards.get($stateParams.boardId);

  // 保存処理
  // 壁紙を読み込む処理ができていないため、暫定的にハードコードした壁紙を読み込む
  // TODO:壁紙読み込み処理の実装 @5/24
  $scope.save = function(){
    DBConn.save(Parts.getAllDeployed(), 'img/taskboard_virt_blue.png'
    , $stateParams.boardId).then(function(newBoard) {
      // sava時、$stateParams.boardIdを上書きするかどうか確認する。update⇒そのまま、addNew⇒上書き
      $stateParams.boardId = Boards.getCurrentBoardId($stateParams.boardId, newBoard);
      // save時、新規の場合は新規Objectが返ってくるため、
      // 新規かどうかをその戻り値によって判断し(service.js内)新規なら一覧へ反映する
      Boards.addNewBoard(newBoard);
    });
  }
})

//Parts操作用のコントローラー
.controller('PartsCtrl', function($scope, Parts){
  $scope.parts = Parts.all();//パレット上にあるパーツをすべて取得
  $scope.select = function(part){
    Parts.select(part);//パレットからボードに配置するパーツを選択
  }
  $scope.deployedParts = Parts.getAllDeployed();//配置するパーツをすべて取得
  $scope.click = function($event){
    Parts.setCoord($event);//配置先の座標取得
    Parts.deploy();//パーツをボードに配置
  }
})

//3つめのタブ(Sample)を選択時に使用するコントローラー
//動作確認や、ノウハウ記録用に使用
.controller('SampleCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
})
