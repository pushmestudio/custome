//これは(いったん)、各タブにひもづくコントローラーをまとめた.jsファイル
// mainApp.controllersというモジュールを定義する
angular.module('mainApp.controllers', ['mainApp.services', 'toaster', 'ngAnimate'])

// undo()を含んだトーストを表示するためのdirective
.directive('partDeleteToaster', [function() {
  return {
    template: 'Part Deleted.<a class="undo" ng-click="undo()">UNDO</a>'
  };
}])

// drag可能な要素につける属性を定義したdirective
.directive('draggablePart', function($ionicGesture, d){
  return {
    restrict: 'A',
    scope: false,
    link: function(scope, elem, attrs){
      // おまじない。これをしないとAndroid4.4系でdragイベントが正しく動作しない
      elem.bind("touchstart", function(event){
        event.preventDefault();
      });

      $ionicGesture.on('drag', function(event){
        deltaX = event.gesture.deltaX;
        deltaY = event.gesture.deltaY;

        // transform3D
        elem.css('transform', 'translate3D(' + String(scope.deployedPart.position.x + deltaX) + 'px, '
                                             + String(scope.deployedPart.position.y + deltaY) + 'px, 1px)');
        elem.css('-webkit-transform', 'translate3D(' + String(scope.deployedPart.position.x + deltaX) + 'px, '
                                                    + String(scope.deployedPart.position.y + deltaY) + 'px, 1px)');
      }, elem);

      $ionicGesture.on('release', function(event){
        scope.deployedPart.position.x = scope.deployedPart.position.x + event.gesture.deltaX;
        scope.deployedPart.position.y = scope.deployedPart.position.y + event.gesture.deltaY;
      }, elem);
    }
  }
})

//Boardの一覧を表示したり，一覧から削除するコントローラー
.controller('BoardsCtrl', function($scope, $timeout, $ionicPopup, $ionicModal, toaster, Boards, DBConn, Wallpapers) {

  // 使用する前に接続処理を行う
  // ここでDBから全Boardsを持ってくる処理を書く
  // 接続が終わったら取得、取得が終わったら変数に反映
  $scope.init = function(){
    DBConn.connect().then(function() {
      DBConn.getAll().then(function(data) {
        $timeout(function(){
          Boards.addAllMyBoards(data);
        });
      });
    });
  }

  $scope.myBoards = Boards.getMyBoards();
  // テンプレート一覧を読み込む
  $scope.templates = Boards.getAllTemplates();
  $scope.listCanSwipe = true; // リストに対してスワイプ操作を可能にする
  // 詳細画面移行時に現在の壁紙を上書き
  $scope.selectWallpaper = function(selectedWallpaperPath){
    Wallpapers.setCurrentWallpaper(selectedWallpaperPath);
  }

  $scope.remove = function(boardIndex) {
    $ionicPopup.confirm({
      template: 'Are you sure to delete this board?<br>(This action cannnot be undone.)', // String (optional). The html template to place in the popup body.
      okType: 'button-assertive'
    }).then(function(res) { // ポップアップ上でOkならtrue、Cancelならfalseが返る
      if(res) { // ポップアップでOkなら削除する
        DBConn.delete($scope.myBoards[boardIndex].boardId).then(function(){
          // myBoardsにあるboardを削除し、削除したパーツを一時保存用配列に退避
          // 文法的には、splice(削除する要素番号, 削除する数)で、削除する数を0にすると削除されない
          $scope.myBoards.splice(boardIndex, 1);
          $timeout(function(){
            toaster.pop('success', '', 'Deleted!');
          });
        });
      }
    });
  }

  // modalの定義, BoardsDetailCtrlと同じものを使用
  $ionicModal.fromTemplateUrl('templates/boardname-modal.html', {
    id: '1',
    scope: $scope,
    animataion: 'slide-in-up'
  }).then(function(modal){
    $scope.saveModal = modal;
  });

  // モーダル画面の入力欄とバインド
  $scope.boardNames = Boards.boardNames;
  $scope.currentBoard;

  // BoardsDetailCtrlとほぼ同様の実装方法
  $scope.openModal = function(board){
    // 選択中のボードを保持する
    $scope.currentBoard = board;

    // 引数のボードの名前とコメントをModalに反映した状態で表示する
    $scope.boardNames.boardName = board.boardContent.boardName;
    $scope.boardNames.boardComment = board.boardContent.boardComment;

    $scope.saveModal.show();
  };

  // ボードの名前及びコメント保存時の処理
  $scope.save = function(){
    // 保存後再度編集画面を開かれたときに表示できなくなってしまうので、remove, null代入はしない
    $scope.saveModal.hide();

    // 変更結果をボード一覧上に反映
    $scope.currentBoard.boardContent.boardName = $scope.boardNames.boardName;
    $scope.currentBoard.boardContent.boardComment = $scope.boardNames.boardComment;

    Boards.updateBoardNames($scope.currentBoard.boardId, $scope.boardNames).then(function(){
      $timeout(function(){
        toaster.pop('success', '', 'Saved!');
      });
    });
  };
})


//Board上に操作を加えるコントローラー
//(as of 4/25では，バックグラウンドに壁紙指定のみ)
.controller('BoardsDetailCtrl', function($scope, $stateParams, $ionicModal, $ionicActionSheet, $timeout, toaster, Boards, DBConn, Parts, Wallpapers) {
  // このコントローラーはapp.js内で/board/:boardIdに関連付けられているため、この/board/0にアクセスしたとき
  // stateParams = { boardId : 0}となる
  // パーツの読込
  DBConn.load($stateParams.boardId).then(function(boardData){
    // board.htmlで使用できるようにバインドする
    $scope.boardData = boardData;
    // boardIdがなければ、updateFlagをfalseに
    Boards.setUpdateFlag(boardData.boardId);
    $timeout(function(){
      Parts.reDeploy(boardData.boardContent);
    });
  });

  // binding
  $scope.template = Boards.getTemplate($stateParams.boardId);
  $scope.boardName = Boards.getBoardName($stateParams.boardId);
  $scope.boardNames = Boards.boardNames;
  // $scope.wallpaper = Wallpapers.getCurrentWallpaper();
  $scope.wallpaperParams = Wallpapers.getWallpaperParams();
  $scope.selectedPart = Parts.selectedPart;

  // modalの定義
  $ionicModal.fromTemplateUrl('templates/boardname-modal.html', {
    id: '1',
    scope: $scope,
    animataion: 'slide-in-up'
  }).then(function(modal){
    $scope.saveModal = modal;
  });

  $ionicModal.fromTemplateUrl('templates/textedit-modal.html', {
    id: '2',
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.editModal = modal;
  });

  // 保存処理の前段階を実施する関数
  $scope.openModal = function(){
    // modalのformをclear
    $scope.boardNames.boardName = '';
    $scope.boardNames.boardComment = '';
    Boards.openModal(Parts.getAllDeployed(), Wallpapers.getCurrentWallpaper(), $stateParams.boardId).then(function(boardId){
      if(boardId){
        // boardsList.htmlで表示されるthumbnail画像を変更する
        Boards.updateMyBoardValuesOnMemory(boardId, Wallpapers.getCurrentWallpaper());
        $timeout(function(){
          toaster.pop('success', '', 'Saved!');
        });
      } else {
        $scope.saveModal.show();
      }
    });
  };
  $scope.openEditModal = function(index) {
    Parts.selectPart(index);
    $scope.editModal.show();
  }

  // 新規作成時の保存処理
  $scope.save = function(){
    $scope.saveModal.hide();
    $scope.saveModal.remove();
    $scope.saveModal = null;

    Boards.saveBoard(Parts.getAllDeployed(), Wallpapers.getCurrentWallpaper(), $stateParams.boardId, $scope.boardNames).then(function(boardId){
      $stateParams.boardId = boardId;
      $scope.boardName = Boards.getBoardName($stateParams.boardId);
      $timeout(function(){
        toaster.pop('success', '', 'Saved!');
      });
    });
  };
  $scope.closeEditModal = function() {
    $scope.editModal.hide();
    Parts.updatePart();
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

  $scope.undo = function() {
    // トーストを削除
    toaster.clear('*');
    var undoPart = $scope.tmpReservedParts.pop();
    $scope.deployedParts_angular.push(undoPart);
  }

  $scope.openMenu = function(partIndex) {
    var hideSheet = $ionicActionSheet.show({
      buttons: [
        { text: '<i class="icon ion-edit balanced"></i>Edit' } // index=0
      //  , { text: '<i class="icon ion-clipboard energized"></i>Copy' } // index=1 今は使わない
      ],
      destructiveText: '<i class="icon ion-trash-a assertive"></i>Delete',
      cancelText: '<i class="icon ion-close-round"></i>Cancel',
      buttonClicked: function(menuIndex) {
        if (menuIndex == 0) {
          $scope.openEditModal(partIndex);
        }
        return true;
      }, destructiveButtonClicked: function() {
        $scope.remove(partIndex);
        return true;
      }
    });
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

// 広告表示用のコントローラ
.controller('AdsCtrl', function($scope, $ionicModal, $ionicPopup) {
  const FREQ_POP_AD = 0.3; // 広告の表示量、1で常に表示、0で常に非表示
  $scope.hidden = true;

  $scope.init = function(){
    // 広告が読み込めていれば、nens_adsplace...がDOMに追加される。nendの広告表示jsの仕様に依存している点に注意。
    if(document.getElementById('nend_adspace_' + nend_params.site + '_' + nend_params.spot)) {
      $scope.flagAd = Math.random() <= FREQ_POP_AD;
    } else {
      $scope.flagAd = false;
    }
  }

  // modalの定義、このmodal内に広告を表示する
  $ionicModal.fromTemplateUrl('templates/ads-modal.html', {
    scope: $scope,
    animataion: 'slide-in-up'
  }).then(function(modal){
    $scope.modal = modal;
  });

  $scope.showAlterAd = false;
  $scope.showUpAd = function() {
    /*
     * 広告表示するモーダル内の要素
     * 'adspace'はモーダル内にあるため、モーダルを読み込むまでは存在しない
     * 不必要な処理を減らすため、読み込み後(adspaceがnullじゃなくなったとき)のみ広告取得の処理をする
     */
    var adspace = document.getElementById('adspace');
    if(adspace) {
      // 広告が読み込めていれば、nens_adsplace...がDOMに追加される。nendの広告表示jsの仕様に依存している点に注意。
      if(document.getElementById('nend_adspace_' + nend_params.site + '_' + nend_params.spot)) {
        var nend = document.getElementById('nend'); // index.html内で事前に読み込んだ広告を取得
        adspace.replaceChild(nend, adspace.firstChild); // 広告モーダル内に設置
        // index.html内で広告が表示されるのを防ぐために付してあるhiddenクラスを排除する
        $scope.showAlterAd = false;
        adspace.firstChild.className = '';
      } else {
        // 広告が取得できない(ネットワークの問題やブラウザで見てる場合)ときはPushMe!の広告を表示する
        $scope.showAlterAd = true;
        // index.html内で広告が表示されるのを防ぐために付してあるhiddenクラスを排除する
        adspace.firstChild.className = '';
      }
    } else {
      // 広告が取得できない(ネットワークの問題やブラウザで見てる場合)ときはPushMe!の広告を表示する
      $scope.showAlterAd = true;
    }
  };

  // 広告表示終了
  $scope.closeAd = function() {
    $scope.modal.hide();
    $scope.modal.remove();
  }

  // 広告の表示、ポップアップで表示確認後、モーダルにて表示する
  $scope.popAd = function() {
    $ionicPopup.confirm({
      title: '[We need your help!]', // String. The title of the popup.
      template: 'Our Robo bring an ad. <br>Can I show you it once?<br>(You can help us through tapping an ad!)', // String (optional). The html template to place in the popup body.
    }).then(function(res) { // ポップアップ上でOkならtrue、Cancelならfalseが返る
      if(res) { // Okなら広告を表示する
        $scope.flagAd = false; // 一度アイコンボタンを押したら、はい・いいえにかかわらず以降は表示しないようにする
        $scope.modal.show();
        $scope.showUpAd();
      } else {
        $scope.flagAd = false; // 一度アイコンボタンを押したら、はい・いいえにかかわらず以降は表示しないようにする
      }
    });
  };
})

.controller('WallpaperCtrl', function($scope, $ionicModal, Wallpapers, Camera, d) {
  $scope.wallpaperParams = Wallpapers.getWallpaperParams();
  $scope.newBoardId = 0;

    // modalの定義
  $ionicModal.fromTemplateUrl('templates/wallpaperList-modal.html', {
    scope: $scope,
    animataion: 'slide-in-up'
  }).then(function(modal){
    $scope.modal = modal;
  });

  $scope.init = function(){
    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady(){
      Wallpapers.loadWallpapers().then(function(){
      })
    }
  };

  $scope.selectWallpaper = function(selectedWallpaperPath){
    d.log($scope.wallpaperParams.currentWallpaperPath);
    Wallpapers.setCurrentWallpaper(selectedWallpaperPath);
    if($scope.modal.isShown()){
      $scope.modal.hide();
    }
    d.log($scope.wallpaperParams.currentWallpaperPath);
  };

  $scope.showWallpaperList = function(){
    $scope.modal.show();
  };

  //ローカルから画像を選択し，壁紙に適用 (base64バージョン)
  $scope.selectLocalImageAsBase64 = function(){
    Camera.getPicture(navigator.camera.DestinationType.DATA_URL).then(function(gotBase64) {
      //d.log(gotBase64);
      var addMeta2base64 = "data:/image/jpeg;base64,"+gotBase64;
      Wallpapers.setCurrentWallpaper(addMeta2base64);
      if($scope.modal.isShown()){
        $scope.modal.hide();
      }
    });
  }

  //ローカルから画像を選択し，壁紙に適用 (ファイルパスバージョン)
  //アルファリリースでは未使用
  $scope.selectLocalImageAsFILEURI = function(){
    Camera.getPicture(navigator.camera.DestinationType.FILE_URI).then(function(fileuri) {
      //d.log(fileuri);
      Wallpapers.setCurrentWallpaper(fileuri);
    });
  }
})

//3つめのタブ(Sample)を選択時に使用するコントローラー
//動作確認や、ノウハウ記録用に使用
.controller('SampleCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
})
