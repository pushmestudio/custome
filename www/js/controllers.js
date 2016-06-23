/**
 * @file mainApp.controllersというモジュールの定義。
 * ビューとモデルをつなぐ各種コントローラを定義している
 * @copyright (c) 2015 PushMe Studio
 */
angular.module('mainApp.controllers', ['mainApp.services', 'mainApp.directives', 'toaster', 'ngAnimate', 'angular-intro'])

/**
 * @module BoardsCtrl
 * @description Boardの一覧を表示したり，一覧から削除するコントローラー
 * @requires $scope
 * @requires $timeout
 * @requires $ionicPopup
 * @requires $ionicListDelegate
 * @requires $interval
 * @requires $cordovaKeyboard
 * @requires toaster
 * @requires Boards
 * @requires DBConn
 * @requires Wallpapers
 * @requires d
 */
.controller('BoardsCtrl', function($scope, $timeout, $ionicPopup, $ionicListDelegate, $interval, $cordovaKeyboard, toaster, Boards, DBConn, Wallpapers, d) {

  //オートセーブを行っている場合、オートセーブを停止する。
  $scope.autoSavePromise = Boards.autoSavePromise;
  if($scope.autoSavePromise){
    Boards.autoSavePromise = $interval.cancel($scope.autoSavePromise);
  }
  // $timeout.cancel(xxxxxxx);の形で，ボード一覧遷移時に，新規ボード作成時に15秒後にオートセーブする機能をoffにする
  // 下記のままでも良いが，冗長なのでサービス化する？
  $scope.autoSavePromise_at_1st = Boards.autoSavePromise_at_1st;
  if($scope.autoSavePromise_at_1st){
    Boards.autoSavePromise_at_1st = $timeout.cancel($scope.autoSavePromise_at_1st);
  }

  /**
   * @function init
   * @description 使用する前に接続処理を行う
   * ここでDBから全Boardsを持ってくる処理を書く
   * 接続が終わったら取得、取得が終わったら変数に反映
   * @todo ControllerからDBへ接続処理をするのは望ましくないのでリファクタリングを検討する
   */
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

  $scope.CompletedEvent = function (scope) {
    console.log("Completed Event called");
  };

  $scope.ExitEvent = function (scope) {
    console.log("Exit Event called");
    $scope.saveState();
    $scope.restoreState();
  };

  $scope.ChangeEvent = function (targetElement, scope) {
    console.log("Change Event called");
    console.log(targetElement);  //The target element
    console.log(this);  //The IntroJS object
  };

  $scope.BeforeChangeEvent = function (targetElement, scope) {
    console.log("Before Change Event called");
    console.log(targetElement);
  };

  $scope.AfterChangeEvent = function (targetElement, scope) {
    console.log("After Change Event called");
    console.log(targetElement);
  };

  $scope.IntroOptions = {
    steps:[
    {
      element: document.querySelector('#step1'),
      intro: "This is the first tooltip.",
      position: 'bottom'
    },
    {
      //element: document.querySelectorAll('#step2')[0],
      intro: "<strong>You</strong> can also <em>include</em> HTML",
      position: 'bottom'
    },
      {
        element: '#step3',
        intro: 'More features, more fun.',
        position: 'left'
      },
      {
        element: '#step4',
        intro: "Another step.",
        position: 'bottom'
      },
      {
        element: '#step5',
        intro: 'Get it, use it.'
      }
    ],
    showStepNumbers: false,
    exitOnOverlayClick: true,
    exitOnEsc:true,
    nextLabel: '<strong>NEXT!</strong>',
    prevLabel: '<span style="color:green">Previous</span>',
    skipLabel: 'Exit',
    doneLabel: 'Thanks'
  };
  $scope.saveState = function () {
    d.log('save');
    localStorage.userService = angular.toJson({isDone1stTutorial:true, isDone2ndTutorial:false});
    d.log($scope.intro);
    var some = angular.toJson($scope.intro);
  },

  // sessionstorageではなくlocalstorageを使うこと
  $scope.restoreState = function () {
    var value = angular.fromJson(localStorage.userService);
    return value;
  };

  $scope.intro = $scope.restoreState();
  $scope.ShouldAutoStart = $scope.intro && $scope.intro['isDone1stTutorial'] ? false : true;


  /**
   * @function selectWallpaper
   * @description 詳細画面移行時に現在の壁紙を上書き
   * @param {String} selectedWallpaperPath 選択された壁紙のパス情報
   */
  $scope.selectWallpaper = function(selectedWallpaperPath){
    Wallpapers.setCurrentWallpaper(selectedWallpaperPath);
  }

  /**
   * @function remove
   * @description 作成済のマイボードを削除する
   * @param boardIndex 削除するマイボードの配列内でのIndex
   * @todo ControllerからDBへ接続処理をするのは望ましくないのでリファクタリングを検討する
   */
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
          // ボードの削除後、スワイプで表示させたオプションメニューを閉じる
          $ionicListDelegate.closeOptionButtons();
          $timeout(function(){
            toaster.pop('success', '', 'Deleted!');
          });
        });
      }
    });
  }


  // ポップアップ画面の入力欄とバインド
  $scope.boardNames = Boards.boardNames;
  $scope.currentBoard;

  /**
   * @function openBoardInfoPopup
   * @description ボード一覧上にてボードの名前とコメントを変更ためのポップアップを開く
   * BoardsDetailCtrlとほぼ同様の実装方法
   * @param {int} board 削除するマイボードの配列内でのIndex
   * @todo checkSaveOrUpdateとの共通化(必要に応じて、ポップアップの関数化？)
   */
  $scope.openBoardInfoPopup = function(board) { // openmodal to openBoardInfoPopup
    // 選択中のボードを保持する
    $scope.currentBoard = board;

    // 引数のボードの名前とコメントをModalに反映した状態で表示する
    $scope.boardNames.boardName = board.boardContent.boardName;
    $scope.boardNames.boardComment = board.boardContent.boardComment;

    // 編集前のボード名を格納し，保存時に，ボード名が空文字("")になっていたら，編集前のボード名を使用する仕様とする (下記のsave()内で利用)
    $scope.boardNames.boardNameBeforeChange = board.boardContent.boardName;
    //$scope.boardNames.boardCommentBeforeChange = board.boardContent.boardComment; //ボードコメントはブランクでも良いため，コメントアウト

    /**
     * @function showEditPopup
     * @description 編集用のポップアップを表示する
     * オートフォーカスをつけた上でキーボード表示を呼び出しているので、ポップアップ表示と同時にキーボードが開く
     * @todo 関数内関数になっているので外出し化 BoardsDetailCtrlでも同じものを持ってしまっているので統一したい
     */
    $scope.showEditPopup = function() {

      var editPopup = $ionicPopup.show({
        template: '<div class="list">' +
          '<label class="item item-input"><input type="text" placeholder="Board name" ng-model="boardNames.boardName" autofocus></label>' +
          '<label class="item item-input"><textarea placeholder="Comment" ng-model="boardNames.boardComment"></textarea></label></div>',
        title: 'Input board info',
        scope: $scope,
        buttons: [
          { text: 'Cancel' },
          {
            text: '<b>Save</b>',
            type: 'button-positive',
            onTap: function(e) {
              return 'Name: ' + $scope.boardNames.boardName + ' Comment: ' + $scope.boardNames.boardComment;
            }
          }
        ]
      });
      if(window.cordova) { // Cordova読み込み時のみ呼び出し(ブラウザでのTestabilityを考慮)
        $cordovaKeyboard.show(); // キーボードを表示する
      }

      editPopup.then(function(res) {
        if(window.cordova) { // Cordova読み込み時のみ呼び出し(ブラウザでのTestabilityを考慮)
          $cordovaKeyboard.close(); // 表示中のキーボードを閉じる
        }
        d.log('Tapped!', res);
        // cancelが押された場合はresがundefになる
        if(res !== undefined) {
          $scope.save();
        }
      });
    };

    $scope.showEditPopup();
  };

  /**
   * @function save
   * @description ボードの名前及びコメント保存時の処理
   */
  $scope.save = function(){
    d.log("This is save() in BoardsCtrl");
    // 変更結果をボード一覧上に反映
    $scope.currentBoard.boardContent.boardName = $scope.boardNames.boardName;
    $scope.currentBoard.boardContent.boardComment = $scope.boardNames.boardComment;

    // 上記のpopupで"$scope.boardNames.boardNameBeforeChange"を用意
    // もし編集後，ボード名が空文字("")になっている場合は，変更前のボード名を利用する
    if ($scope.currentBoard.boardContent.boardName === ""){
      $scope.currentBoard.boardContent.boardName = $scope.boardNames.boardNameBeforeChange;
    }

    // if ($scope.currentBoard.boardContent.boardComment === ""){ //ボードコメントはブランクでも良いため，コメントアウト
    //   $scope.currentBoard.boardContent.boardComment = $scope.boardNames.boardCommentBeforeChange;
    // }

    Boards.updateBoardNames($scope.currentBoard.boardId, $scope.currentBoard.boardContent).then(function(){
      $timeout(function(){
        toaster.pop('success', '', 'Saved!');
      });
    });
  };
})

/**
 * @module BoardsDetailCtrl
 * @description Board上に操作を加えるコントローラー
 * (as of 4/25では，バックグラウンドに壁紙指定のみ)
 * このコントローラーはapp.js内で/board/:boardIdに関連付けられているため、この/board/0にアクセスしたとき
 * <code>stateParams = { boardId : 0}</code>となる
 * @requires $scope
 * @requires $stateParams
 * @requires $ionicActionSheet
 * @requires $interval
 * @requires $timeout
 * @requires $cordovaKeyboard
 * @requires toaster
 * @requires Boards
 * @requires DBConn
 * @requires Parts
 * @requires Wallpapers
 * @requires d
 */
.controller('BoardsDetailCtrl', function($scope, $stateParams, $ionicActionSheet, $interval, $timeout, $ionicPopup, $cordovaKeyboard, toaster, Boards, DBConn, Parts, Wallpapers, d) {
  // パーツの読込
  DBConn.load($stateParams.boardId).then(function(boardData){
    // board.htmlで使用できるようにバインドする
    $scope.boardData = boardData;
    // boardIdがなければ、updateFlagをfalseに
    Boards.setUpdateFlag(boardData.boardId);
    // 既存ボードの更新を行う際に、オートセーブを開始する
    if(Boards.getUpdateFlag()){
      Boards.autoSavePromise = $interval(function(){$scope.checkSaveOrUpdate();},30000);
    }else{
      // 新規ボード作成時に，ボード名，コメントを初期化
      // ボード一覧で，ボード名やコメントを変更後に，新規ボード作成した際の影響をなくすため
      $scope.boardNames.boardName = '';
      $scope.boardNames.boardComment = '';
        // 新規ボード作成時の初めてのボードは，15秒後に一度保存する。ポップアップなし。
        // 2回目は15秒後，3回め以降は30秒後にオートセーブされる
        // ※将来的には，パーツ操作をトリガーにセーブするなど仕様変更が必要かも。
      Boards.autoSavePromise_at_1st = $timeout(function(){$scope.save();
      },15000);
        // 3回目以降は30秒ごとにオートセーブ開始。
      Boards.autoSavePromise = $interval(function(){$scope.checkSaveOrUpdate();},30000);
    }
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

  /**
   * @function checkSaveOrUpdate
   * @description 保存処理の前段階を実施する関数
   * @todo openBoardInfoPopupとの共通化(必要に応じて、ポップアップの関数化？)
   */
  $scope.checkSaveOrUpdate = function(){
    // modalのformをclear
    $scope.boardNames.boardName = '';
    $scope.boardNames.boardComment = '';
    Boards.checkSaveOrUpdate(Parts.getAllDeployed(), Wallpapers.getCurrentWallpaper(), $stateParams.boardId).then(function(boardId){
      if(boardId){
        // boardsList.htmlで表示されるthumbnail画像を変更する
        Boards.updateWallpaperOnMemory(boardId, Wallpapers.getCurrentWallpaper());
        $timeout(function(){
          toaster.pop('success', '', 'Saved!');
        });
      } else {

        /**
         * @function showEditPopup
         * @description 編集用のポップアップを表示する
         * オートフォーカスをつけた上でキーボード表示を呼び出しているので、ポップアップ表示と同時にキーボードが開く
         * @todo 関数内関数になっているので外出し化 BoardsCtrlでも同じものを持ってしまっているので統一したい
         */
        $scope.showEditPopup = function() {

          var editPopup = $ionicPopup.show({
            template: '<div class="list">' +
              '<label class="item item-input"><input type="text" placeholder="Board name" ng-model="boardNames.boardName" autofocus></label>' +
              '<label class="item item-input"><textarea placeholder="Comment" ng-model="boardNames.boardComment"></textarea></label></div>',
            title: 'Input board info',
            scope: $scope,
            buttons: [
              { text: 'Cancel' },
              {
                text: '<b>Save</b>',
                type: 'button-positive',
                onTap: function(e) {
                  return 'Name: ' + $scope.boardNames.boardName + ' Comment: ' + $scope.boardNames.boardComment;
                }
              }
            ]
          });
          if(window.cordova) { // Cordova読み込み時のみ呼び出し(ブラウザでのTestabilityを考慮)
            $cordovaKeyboard.show(); // キーボードを表示する
          }

          editPopup.then(function(res) {
            if(window.cordova) { // Cordova読み込み時のみ呼び出し(ブラウザでのTestabilityを考慮)
              $cordovaKeyboard.close(); // 表示されているキーボードを閉じる
            }
            d.log('Tapped!', res);
            // cancelが押された場合はresがundefになる
            if(res !== undefined) {
              $scope.save();
            }
          });
        };
        $scope.showEditPopup();
      }
    });
  };

  /**
   * @function openEditNotePopup
   * @description 付箋パーツのテキストを編集するためのポップアップを開く
   * @param {int} index 編集対象の付箋パーツのIndex
   * @todo (必要に応じて、ポップアップの関数化？)
   */
  $scope.openEditNotePopup = function(index) {
    Parts.selectPart(index); // selectedPartに、indexに該当するパーツを引き当てる

    /**
     * @function showEditPopup
     * @description 編集用のポップアップを表示する
     * オートフォーカスをつけた上でキーボード表示を呼び出しているので、ポップアップ表示と同時にキーボードが開く
     * @todo 関数内関数になっているので外出し化
     */
    $scope.showEditPopup = function() {

      var editPopup = $ionicPopup.show({
        template: '<textarea rows="4" ng-model="selectedPart.text" autofocus></textarea>',
        title: 'Edit note',
        scope: $scope,
        buttons: [
          { text: 'Cancel' },
          {
            text: '<b>Save</b>',
            type: 'button-positive',
            onTap: function(e) {
              return $scope.selectedPart.text;
            }
          }
        ]
      });
      if(window.cordova) { // Cordova読み込み時のみ呼び出し(ブラウザでのTestabilityを考慮)
        $cordovaKeyboard.show(); // キーボードを表示する
      }

      editPopup.then(function(res) {
        if(window.cordova) { // Cordova読み込み時のみ呼び出し(ブラウザでのTestabilityを考慮)
          $cordovaKeyboard.close(); // 表示しているキーボードを閉じる
        }
        d.log('Tapped!', res);
        // cancelが押された場合はresがundefになる
        if(res !== undefined) {
          Parts.updatePart();
        }
      });
    };
    $scope.showEditPopup();
  }

  /**
   * @function save
   * @description 新規作成時の保存処理
   * ボード名が空の場合は日付を入れる
   */
  $scope.save = function(){
    // ボード名が未入力の場合に，デフォルト値を入れる
    // デフォルトのボード名 (as of) :  "board: YYYY/MM/DD"
    if ($scope.boardNames.boardName === ""){
      var currentTime = new Date();
      var sampleBoardNameAt1stSave = "board: " + currentTime.getFullYear()+"/"+(currentTime.getMonth()+1)+"/"+currentTime.getDate();
      $scope.boardNames.boardName = sampleBoardNameAt1stSave;
    }

    Boards.saveBoard(Parts.getAllDeployed(), Wallpapers.getCurrentWallpaper(), $stateParams.boardId, $scope.boardNames).then(function(boardId){
      $stateParams.boardId = boardId;
      $scope.boardName = Boards.getBoardName($stateParams.boardId);
      $timeout(function(){
        toaster.pop('success', '', 'Saved!');
      });
    });
  };

  $scope.deployedParts_angular = Parts.getAllDeployed();//配置するパーツをすべて取得
  $scope.tmpReservedParts = []; // 削除したパーツを一時保存しUNDOできるようにする

  /**
   * @function click
   * @description ボードにパーツを配置する
   * @todo 名前がわかりにくいかも、関数名の変更を検討すること at 12/22 小島
   * @param {Object} $event 配置のためにクリックされた時点のイベント情報、配置先の座標などを含む
   */
  $scope.click = function($event){
    Parts.setCoord($event);//配置先の座標取得
    Parts.deploy();//パーツをボードに配置
  }

  /**
   * @function remove
   * @description 配置済のパーツを削除する
   * 一時保存用の配列に退避させ、トースト表示からUNDOができる
   * @param {int} partIndex 削除対象としてクリックされたパーツのIndex
   */
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

  /**
   * @function undo
   * @description 削除したパーツを復活させる
   * 処理としては、一時保存用の配列から取り出し再配置している
   * @see remove
   */
  $scope.undo = function() {
    // トーストを削除
    toaster.clear('*');
    var undoPart = $scope.tmpReservedParts.pop();
    $scope.deployedParts_angular.push(undoPart);
  }

  /**
   * @function openMenu
   * @description パーツの削除や編集などの処理が可能なメニューを開く
   * パーツタイプが'saveTime'なら時間保存メニューを表示、そうでないなら編集ボタンを表示する
   * @param {int} partIndex メニューを開く対象として選択されたパーツのIndex
   * @TODO if文の分岐がかなり冗長なのでリファクタリング必要か
   */
  $scope.openMenu = function(partIndex) {
    d.log("partIndex : " + partIndex);
    // 時間保存パーツの場合は，時間保存用メニュー(時間保存/Delete/Cancel)を出す
    // 通常のパーツの場合は，メニュー(Edit/Delete/Cancel)を出す
    if ($scope.deployedParts_angular[partIndex].type === 'saveTime'){
      var hideSheet = $ionicActionSheet.show({
        buttons: [
          { text: '<i class="icon ion-clock royal"></i>Create Time Stamp' } // index=0 時間保存用の文言、elseとの変化点1
        ],
        destructiveText: '<i class="icon ion-trash-a assertive"></i>Delete',
        cancelText: '<i class="icon ion-close-round"></i>Cancel',
        buttonClicked: function(menuIndex) {
          if (menuIndex == 0) {
            // 時間保存用のメニュー、elseとの変化点2, 時間保存パーツのx, y位置を送る
            Parts.deployTimeStampPart($scope.deployedParts_angular[partIndex].position.x, $scope.deployedParts_angular[partIndex].position.y);
          }
          return true;
        }, destructiveButtonClicked: function() {
          $scope.remove(partIndex);
          return true;
        }
      });
    }else{
      var hideSheet = $ionicActionSheet.show({
        buttons: [
          { text: '<i class="icon ion-edit balanced"></i>Edit' } // index=0
        //  , { text: '<i class="icon ion-clipboard energized"></i>Copy' } // index=1 今は使わない
        ],
        destructiveText: '<i class="icon ion-trash-a assertive"></i>Delete',
        cancelText: '<i class="icon ion-close-round"></i>Cancel',
        buttonClicked: function(menuIndex) {
          if (menuIndex == 0) {
            $scope.openEditNotePopup(partIndex);
          }
          return true;
        }, destructiveButtonClicked: function() {
          $scope.remove(partIndex);
          return true;
        }
      });
    }
  }
})

/**
 * @module PalletCtrl
 * @description Pallet操作用のコントローラー
 * Pallet上のパーツ操作のために使うため，PartsCtrlから名前変更
 * @requires $scope
 * @requires $ionicModal
 * @requires Parts
 */
.controller('PalletCtrl', function($scope, $ionicModal, Parts){
  $scope.parts = Parts.all();//パレット上にあるパーツをすべて取得

  // modalの定義　使用する付箋の選択を行うためのmodalを設定
  $ionicModal.fromTemplateUrl('templates/stickyNoteList-modal.html', {
    scope: $scope,
    animataion: 'slide-in-up'
  }).then(function(modal){
    $scope.modal = modal; // $scope.modalという名前のmodalだとわかりにくいかも at 12/23 小島
  });

  /**
   * @function showStickyNoteList
   * @description 付箋一覧のモーダルを開く
   */
  $scope.showStickyNoteList = function(){
    $scope.stickyParts = Parts.getStickyParts();//事前に用意してある全てのPartsの中からStickyを抽出
    $scope.modal.show();
  };

  /**
   * @function select
   * @description パレットからボードに配置するパーツを選択する
   * @param {String} tgtId 選択した付箋を示すID
   */
  $scope.select = function(tgtId){
    Parts.select(tgtId);//パレットからボードに配置するパーツを選択
    if($scope.modal.isShown()){
      $scope.modal.hide();
    }
  };
  /**
   * @function selectSaveTimeParts
   * @description パレットからボードに配置する時間保存パーツを選択する
   * @todo 後にselect()と統合したい
   */
  $scope.selectSaveTimeParts = function(){
    Parts.setOnFlag();
  }
})

/**
 * @module AdsCtrl
 * @description 広告表示用のコントローラ
 * @requires $scope
 * @requires $ionicPralform
 * @requires $ionicPopup
 * @requires AdMobManager
 * @requires d
 */
.controller('AdsCtrl', function($scope, $ionicPlatform, $ionicPopup, AdMobManager, d) {
  // AdMobManagerのフラグに関するデータをバインド
  $scope.flagData = AdMobManager.flagData;

  /**
   * @function init
   * @description ionicの準備ができたら、広告表示の初期化処理を呼び出す
   */
  $scope.init = function(){
    $ionicPlatform.ready(function(){
      AdMobManager.initAdMob();
    });
  }

  /**
   * @function showUpInterstitialAd
   * @description インタースティシャル広告を画面全体に表示させる
   * 何らかのエラーでInterstitial広告が表示できない場合は、代替広告表示用のフラグをtrueにする
   * @todo 現在、代替広告表示用のフラグがONになっても特段の処理はされていない模様
   */
  $scope.showUpInterstitialAd = function(){
    try{
      d.log('Show Interstitial Ad');
      // Interstitial広告を呼び出す
      AdMobManager.showInterstitialAd();
    } catch(e){
      d.log(e);
      $scope.showAlterAd = true;
    }
  };

  /**
   * @function popAd
   * @description 広告の表示についてポップアップで表示してもよいか確認後、モーダルにて表示する
   */
  $scope.popAd = function() {
    $ionicPopup.confirm({
      title: '[Ad Display Confirmation]', // String. The title of the popup.
      template: 'Our Robo bring an ad. <br>Can I show you it once?<br>(You can help us through tapping an ad!)', // String (optional). The html template to place in the popup body.
    }).then(function(res) { // ポップアップ上でOkならtrue、Cancelならfalseが返る
      if(res) { // Okなら広告を表示する
        AdMobManager.flagData.iconFlag = false; // 一度アイコンボタンを押したら、はい・いいえにかかわらず以降は表示しないようにする
        $scope.showUpInterstitialAd();
      } else {
        AdMobManager.flagData.iconFlag = false; // 一度アイコンボタンを押したら、はい・いいえにかかわらず以降は表示しないようにする
      }
    });
  };
})

/**
 * @module WallpaperCtrl
 * @description 壁紙管理用のコントローラ
 * @requires $scope
 * @requires $ionicModal
 * @requires Wallpapers
 * @requires d
 */
.controller('WallpaperCtrl', function($scope, $ionicModal, Wallpapers, d) {
  $scope.wallpaperParams = Wallpapers.getWallpaperParams();
  $scope.newBoardId = 0;

    // modalの定義
  $ionicModal.fromTemplateUrl('templates/wallpaperList-modal.html', {
    scope: $scope,
    animataion: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });

  /**
   * @function init
   * @description 初期化処理として、Cordovaプラグイン読み込み後、事前に用意した壁紙の一覧を読み込む
   */
  $scope.init = function() {
    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() { // loadWallpapersがcordovaのプラグインを使用するため、devicereadyを待つ
      Wallpapers.loadWallpapers().then(function() {});
    }
  };

  /**
   * @function selectWallpaper
   * @description 選択された壁紙のパス情報を元に壁紙をセットする
   * @param {String} selectWallpaperPath 壁紙のパス情報
   */
  $scope.selectWallpaper = function(selectedWallpaperPath) {
    d.log('変更前：' + $scope.wallpaperParams.currentWallpaperPath);
    Wallpapers.setCurrentWallpaper(selectedWallpaperPath);
    if($scope.modal.isShown()){
      $scope.modal.hide();
    }
    d.log('変更後：' + $scope.wallpaperParams.currentWallpaperPath);
  };

  /**
   * @function showWallpaperList
   * @description 壁紙一覧のモーダルを表示する
   */
  $scope.showWallpaperList = function(){
    $scope.modal.show();
  };

  /**
   * @function selectWallpaperLocal
   * @description ローカルから画像を選択し，壁紙に適用 (ファイルパスバージョン)
   */
  $scope.selectWallpaperLocal = function() {
    if(!window.cordova) { // 実機等のデバイスでない場合は使用できないので呼びださせないので関数呼び出しを抑制
      d.log('Can not use "selectWallpaperLocal" function via browser');
      return;
    }
    Wallpapers.pickAndCopyImage().then(function(imagePath) {
      Wallpapers.setCurrentWallpaper(imagePath);
      if($scope.modal.isShown()){
        $scope.modal.hide();
      }
    });
  };
})
