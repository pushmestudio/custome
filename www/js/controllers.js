//これは(いったん)、各タブにひもづくコントローラーをまとめた.jsファイル
// mainApp.controllersというモジュールを定義する
angular.module('mainApp.controllers', ['mainApp.services'])

//Boardの一覧を表示したり，一覧から削除するコントローラー
.controller('BoardsCtrl', function($scope, $ionicPopup, $ionicModal, Boards, DBConn) {
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

  // modalの定義
  $ionicModal.fromTemplateUrl('templates/ads-modal.html', {
    scope: $scope,
    animataion: 'slide-in-up'
  }).then(function(modal){
    $scope.modal = modal;
  });

  // 広告の表示、ポップアップで表示確認後、モーダルにて表示する
  $scope.popAd = function() {
    $ionicPopup.confirm({
      title: '広告表示確認', // String. The title of the popup.
      cssClass: '', // String, The custom CSS class name
      subTitle: '', // String (optional). The sub-title of the popup.
      template: 'PushMeロボが広告を持ってきたようです。<br>表示しますか？<br>(広告のクリックを通じて開発者を支援することができます)', // String (optional). The html template to place in the popup body.
      templateUrl: '', // String (optional). The URL of an html template to place in the popup   body.
      cancelText: '', // String (default: 'Cancel'). The text of the Cancel button.
      cancelType: '', // String (default: 'button-default'). The type of the Cancel button.
      okText: '', // String (default: 'OK'). The text of the OK button.
      okType: '', // String (default: 'button-positive'). The type of the OK button.
    }).then(function(res) { // ポップアップ上でOkならtrue、Cancelならfalseが返る
      console.log(res);
      if(res) { // Okなら表示する
        $scope.modal.show();
      }
    });
  }
})

//Board上に操作を加えるコントローラー
//(as of 4/25では，バックグラウンドに壁紙指定のみ)
.controller('BoardsDetailCtrl', function($scope, $stateParams, $ionicModal, Boards, DBConn, Parts) {
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
    Boards.openModal($scope.modal, Parts.getAllDeployed(), Boards.getUsedWallpaper(), $stateParams.boardId);
  };

  // modalの除去(インスタンスそのものをDOMから消すらしい)
  $scope.removeModal = function(){
    $scope.modal.hide();
    $scope.modal.remove();
    // modalを除去したら、除去されたかどうかの判定のために値をnullにしておく
    $scope.modal = null;
  };

  // modalが除去されたら（保存する準備ができたら)保存処理を呼ぶ
  // 壁紙を読み込む処理ができていないため、暫定的にハードコードした壁紙を読み込む
  // TODO:壁紙読み込み処理の実装 @5/24
  $scope.$on('modal.removed', function(){ // とりあえず別枠だけど、↓の$scope.save()を直接呼んでもいい
    $scope.modal = null;
    // sava時、$stateParams.boardIdを上書きするかどうか確認する。update⇒そのまま、addNew⇒上書き
    // Boards.getUsedWallpaper()でwallPaperのパス取得
    Boards.saveBoard(Parts.getAllDeployed(), Boards.getUsedWallpaper(), $stateParams.boardId).then(function(boardId){
      $stateParams.boardId = boardId;
    });
  });

  // 保存処理
  $scope.save = function(){
    Boards.saveBoard(Parts.getAllDeployed(), Boards.getUsedWallpaper(), $stateParams.boardId);
  };
    //'img/taskboard_virt_blue.png'
    //boardData.boardContent

  $scope.deployedParts_angular = Parts.getAllDeployed();//配置するパーツをすべて取得
  $scope.click = function($event){
    Parts.setCoord($event);//配置先の座標取得
    Parts.deploy();//パーツをボードに配置
  }
  $scope.remove = function(part) {
    // deployedPartsにあるpartを削除する
    // 文法的には、splice(削除する要素番号, 削除する数)で、削除する数を0にすると削除されない
    $scope.deployedParts_angular.splice(part, 1);
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
