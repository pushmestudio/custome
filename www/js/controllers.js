//これは(いったん)、各タブにひもづくコントローラーをまとめた.jsファイル
// mainApp.controllersというモジュールを定義する
angular.module('mainApp.controllers', ['mainApp.services', 'toaster', 'ngAnimate'])

//Boardの一覧を表示したり，一覧から削除するコントローラー
.controller('BoardsCtrl', function($scope, Boards, DBConn) {
  // 使用する前に接続処理を行う
  // ここでDBから全Boardsを持ってくる処理を書く
  // 接続が終わったら取得、取得が終わったら変数に反映
  // このloadの部分もいずれBoardsサービスに移行したい
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
.controller('BoardsDetailCtrl', function($scope, $stateParams, $ionicModal, toaster, Boards, DBConn, Parts) {
  // このコントローラーはapp.js内で/board/:boardIdに関連付けられているため、この/board/0にアクセスしたとき
  // stateParams = { boardId : 0}となる
  // パーツの読込

  DBConn.load($stateParams.boardId).then(function(boardData){
    // board.htmlで使用できるようにバインドする
    $scope.boardData = boardData;
    // boardIdがなければ、updateFlagをfalseに
    Boards.setUpdateFlag(boardData.boardId);
    Parts.reDeploy(boardData.boardContent);
    Boards.setUsedWallpaper(boardData.boardContent, $stateParams.boardId);//現在表示するためのwallPaperをセット
    $scope.usedPaper_nowBoard = Boards.getUsedWallpaper();//board.htmlでwallPaperを描画させるための変数usedPaper_nowBoardにwallPaperのパスを代入
  });

  // binding
  $scope.board = Boards.get($stateParams.boardId);
  $scope.boardNames = Boards.boardNames;

  // modalの定義
  $ionicModal.fromTemplateUrl('templates/boardname-modal.html', {
    scope: $scope,
    animataion: 'slide-in-up'
  }).then(function(modal){
    $scope.modal = modal;
  });

  // 保存処理の前段階を実施する関数
  $scope.openModal = function(){
    // modalのformをclear
    $scope.boardNames.boardName = '';
    $scope.boardNames.boardComment = '';
    Boards.openModal(Parts.getAllDeployed(), Boards.getUsedWallpaper(), $stateParams.boardId).then(function(result){
      if(result){
        toaster.pop('success', '', 'Saved!');
        $scope.$apply();
      } else {
        $scope.modal.show();
      }
    });
  };

  // 新規作成時の保存処理
  $scope.save = function(){
    $scope.modal.hide();
    $scope.modal.remove();
    $scope.modal = null;

    Boards.saveBoard(Parts.getAllDeployed(), Boards.getUsedWallpaper(), $stateParams.boardId).then(function(boardId){
      $stateParams.boardId = boardId;
      toaster.pop('success', '', 'Saved!');
    });
  };

  $scope.deployedParts_angular = Parts.getAllDeployed();//配置するパーツをすべて取得
  $scope.click = function($event){
    Parts.setCoord($event);//配置先の座標取得
    Parts.deploy();//パーツをボードに配置
  }
  $scope.remove = function(part) {
    // deployedPartsにあるpartを削除する
    // 文法的には、splice(削除する要素番号, 削除する数)で、削除する数を0にすると削除されない
    $scope.deployedParts_angular.splice(part, 1);
    toaster.pop('warning', "", "Parts Deleted");
  }
  // $eventに記録された位置情報を配置済のパーツに反映
  $scope.move = function(part, $event) {

    // 付箋のサイズ100の中央
    var centerImgX = (100/2);

    // 付箋のサイズ100の中央のはずだが, 挙動として200で扱われている模様
    // TODO Yのサイズが200として扱われている？と考えられる理由の調査
    // もしかすると、img=として指定したサイズそのものより、実際の画像のサイズが影響している？
    var centerImgY = (200/2);

    part.position.x = ($event.gesture.center.pageX - centerImgX);
    part.position.y = ($event.gesture.center.pageY -centerImgY);
  }
})

// Pallet操作用のコントローラー
// --> Pallet上のパーツ操作のために使うため，PartsCtrlから名前変更
//
.controller('PalletCtrl', function($scope, Parts){
  $scope.parts = Parts.all();//パレット上にあるパーツをすべて取得
  $scope.select = function(part){
    Parts.select(part);//パレットからボードに配置するパーツを選択
  }
})

//3つめのタブ(Sample)を選択時に使用するコントローラー
//動作確認や、ノウハウ記録用に使用
.controller('SampleCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
})
