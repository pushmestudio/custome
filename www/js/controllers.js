//これは(いったん)、各タブにひもづくコントローラーをまとめた.jsファイル
// mainApp.controllersというモジュールを定義する
angular.module('mainApp.controllers', ['mainApp.services', 'toaster', 'ngAnimate'])

// undo()を含んだトーストを表示するためのdirective
.directive('partDeleteToaster', [function() {
  return {
    template: 'Part Deleted.<a class="undo" ng-click="undo()">UNDO</a>'
  };
}])

//Boardの一覧を表示したり，一覧から削除するコントローラー
.controller('BoardsCtrl', function($scope, $ionicPopup, $ionicModal, toaster, Boards, DBConn) {
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
  $scope.listCanSwipe = true; // リストに対してスワイプ操作を可能にする

  $scope.remove = function(boardIndex) {
    $ionicPopup.confirm({
      template: '選択したボードを削除しますか？(この操作は取り消せません)', // String (optional). The html template to place in the popup body.
      okType: 'button-assertive'
    }).then(function(res) { // ポップアップ上でOkならtrue、Cancelならfalseが返る
      if(res) { // ポップアップでOkなら削除する
        DBConn.delete($scope.myBoards[boardIndex].boardId).then(function(){
          // myBoardsにあるboardを削除し、削除したパーツを一時保存用配列に退避
          // 文法的には、splice(削除する要素番号, 削除する数)で、削除する数を0にすると削除されない
          $scope.myBoards.splice(boardIndex, 1);
          toaster.pop('success', '', 'Deleted!');
        });
      }
    });
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
.controller('BoardsDetailCtrl', function($scope, $stateParams, $ionicModal, $timeout, toaster, Boards, DBConn, Parts) {
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
  $scope.tmpReservedParts = []; // 削除したパーツを一時保存しUNDOできるようにする

  $scope.click = function($event){
    Parts.setCoord($event);//配置先の座標取得
    Parts.deploy();//パーツをボードに配置
  }
  $scope.remove = function(partIndex) {
    // deployedPartsにあるpartを削除し、削除したパーツを一時保存用配列に退避
    // 文法的には、splice(削除する要素番号, 削除する数)で、削除する数を0にすると削除されない
    $scope.tmpReservedParts = $scope.deployedParts_angular.splice(partIndex, 1);

    // ng-showをtoast-containerに付与することで対応も可能だが、
    //　現在のバージョンだと複数のtoast-containerがあった場合"type"の指定が無視されてしまう。
    // トーストを表示
    toaster.pop({
      type: 'warning',
      title: '',
      body: 'part-delete-toaster',
      bodyOutputType: 'localDirective'
    });
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

  $scope.undo = function() {
    // トーストを削除
    toaster.clear('*');
    var undoPart = $scope.tmpReservedParts.pop();
    $scope.deployedParts_angular.push(undoPart);
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
