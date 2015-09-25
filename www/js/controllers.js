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
      template: '選択したボードを削除しますか？(この操作は取り消せません)', // String (optional). The html template to place in the popup body.
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

    Boards.saveBoard($scope.currentBoard.boardContent.parts, $scope.currentBoard.boardContent.wallpaper, $scope.currentBoard.boardId, $scope.boardNames).then(function(boardId){
      $timeout(function(){
        toaster.pop('success', '', 'Saved!');
      });
    });
  };
})


//Board上に操作を加えるコントローラー
//(as of 4/25では，バックグラウンドに壁紙指定のみ)
.controller('BoardsDetailCtrl', function($scope, $stateParams, $ionicModal, $timeout, toaster, Boards, DBConn, Parts, Wallpapers) {
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
    /* 2015/8/17(tomita) 壁紙処理はWallpaperサービスに移行したので不要
    Boards.setUsedWallpaper(boardData.boardContent, $stateParams.boardId);//現在表示するためのwallPaperをセット
    $scope.usedPaper_nowBoard = Boards.getUsedWallpaper();//board.htmlでwallPaperを描画させるための変数usedPaper_nowBoardにwallPaperのパスを代入
    */
  });

  // binding
  $scope.template = Boards.getTemplate($stateParams.boardId);
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

.controller('WallpaperCtrl', function($scope, $ionicModal, Wallpapers, Camera) {
  $scope.wallpaperParams = Wallpapers.getWallpaperParams();
  $scope.newBoardId = 0;

    // modalの定義
  $ionicModal.fromTemplateUrl('templates/wallpaperList.html', {
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
    console.log($scope.wallpaperParams.currentWallpaperPath);
    Wallpapers.setCurrentWallpaper(selectedWallpaperPath);
    if($scope.modal.isShown()){
      $scope.modal.hide();
    }
    console.log($scope.wallpaperParams.currentWallpaperPath);
  };

  $scope.showWallpaperList = function(){
    Camera.getPicture().then(function(imageURI) {
      /*if (imageURI.substring(0,21)=="content://com.android") {
        console.log("++++++++++++++++++++++++++++++++++");
        photo_split=imageURI.split("%3A");
        imageURI="content://media/external/images/media/"+photo_split[1]+".png";
        console.log("---------------------------------------");
      }*/
      //$compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|content):/);
      //$scope.wallpaperParams.wallpaperPaths.push("data:/image/jpeg;base64" + imageURI);
      //$scope.wallpaperParams.wallpaperPaths.push(imageURI);
      $scope.wallpaperParams.wallpaperPaths.push(imageURI);
      console.log($scope.wallpaperParams.wallpaperPaths);
      console.log($scope.wallpaperParams.currentWallpaperPath);
    });
    $scope.modal.show();
  };

  $scope.addImage2WallpaperList = function(){
    $scope.ksTest = "ksTest";
    //Camera.getPicture();
  }

  $scope.getLocalImage = function(){
    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady(){
      console.log(cordova.file);
    }

    Camera.getPicture().then(function(imageURI) {
      //sourceTypeの指定で，取得するタイプを決める ==> base64 or FILE URI
      var base64 = imageURI; //base64でimageURIを取得する場合
      var uri = imageURI; //FILE_URIでimageURIを取得する場合


      $scope.saveLocalImage2PersistentDir(base64);
    });
  }

  $scope.saveLocalImage2PersistentDir = function(base64){
    //console.log(uri);
    //PERSISTENT領域にデータを保存するために，DirectoryEntryオブジェクトを取得
    //ここから
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, succeededGetFileSystemObj, fail2);
    //window.resolveLocalFileSystemURL(cordova.file.applicationDirectory + "www/img/wallpaper", succeededGetFileSystemObj, fail2);
    var persistentDir;

    function succeededGetFileSystemObj(fileSystem){
      console.log("success get FileSystem");
      var directoryEntry = fileSystem.root; //DirectoryEntryオブジェクトを取得
    //ここまで
      persistentDir=directoryEntry;

// ファイル名を指定して，フォトライブラリから読み込んだデータをbase64でPERSISTENTディレクトリに保存
      // ファイル名をDate()を使ってユニークなものに変更
      var changed_base64 = "data:/image/jpeg;base64," + base64;
      var d = new Date();
      var n = d.getTime(); //milliSecond
      var newFileName = n + ".png";

      //PeRSISTENTディレクトリに，上記で作成したファイル名を使用して，base64を保存
      persistentDir.getFile(newFileName, {create: true}, gotFileEntry_W, fail5);
      function gotFileEntry_W(fEntry){
        fEntry.createWriter(gotFileWriter, fail6);
      }
      function gotFileWriter(writer){
        writer.onwrite = function(evt){
        }
        writer.write(changed_base64);
      }
      function fail5(error){
        alert('エラー fail5: ' + error.code);
      }
      function fail6(error){
        alert('エラー fail6: ' + error.code);
      }
//ここまで

      //changed_base64.copyTo(persistentDir, newFileName, copyToSuccess2, fail4);

      function copyToSuccess2(){
        console.log(copy成功);
      }

      //resolveLocalFileSystemURL(cordova.file.applicationDirectory + "www/img/wallpaper/taskboard_port_green.png", copyToPersistent, fail3);

      //var directoryReader = directoryEntry.createReader();
      //directoryReader.readEntries(putFileName, fail);
    }

    function copyToPersistent(fileEntry){
      fileEntry.copyTo(persistentDir, fileEntry.name, copyToSuccess, fail4);
    }

    function copyToSuccess(fileEntry){
      console.log("ファイル「" + fileEntry.name + "」をコピーしました。");
    }
    function fail3(error){
      alert('resolveLocalFileSystemURL()でエラーが発生しました。エラーコード: ' + error.code);
    }
    function fail4(error){
      alert('ファイルのコピー中にエラーが発生しました。エラーコード: ' + error.code);
    }

    function fail2(error){
      alert('requestFileSystemでエラーが発生しました。エラーコード: ' + error.code);
    }
  }



  $scope.loadLocalImageFromPersistentDir = function(){
    Wallpapers.loadLoalImage();
  }

  $scope.localImage = "";

  $scope.getPhoto = function() {
    //$compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|content):/);
    //Camera.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
    //Camera.sourceType = Camera.PictureSourceType.SAVEDPHOTOALBUM;
    //var pictureSource=navigator.camera.PictureSourceType;
    ////content://com.android.providers.media.documents/document/image%3A352

    //DataSourceTypeの指定次第で，FILE_URI or DATA_URL(base64)がimageURIに返ってくる
    Camera.getPicture().then(function(imageURI) {
      //console.log(imageURI);DATA_URLの場合，膨大なのでコメントアウト推奨
      console.log("navigator.camera.getPictureでデータ取得完了");
      //console.log(fileSystem.root.toURL());



      /*** 下記は，FILE_URIで取得した際に，パス名を変更する時に使用。※ただしネイティブから現時点で読めていない **/
/*      console.log("imageURIのパス変更中...");
      if (imageURI.substring(0,21)=="content://com.android") {
        photo_split=imageURI.split("%3A");
        fixedImageURI="content://media/external/images/media/"+photo_split[1]+".png";
        console.log(fixedImageURI);
      }
      console.log("完了");
      var test = "file://storage/emulated/0/Pictures/Screenshots/Screenshot_2015-08-08-07-19-53.png";
      $scope.smallImage = document.getElementById('smallImage');
      //$scope.smallImage.src = "./img/ionic.png";
      //$scope.smallImage.src = "data:/image/jpeg;base64," + fixedImageURI;
      $scope.smallImage.src = "/storage/emulated/0/Pictures/Screenshots/Screenshot_2015-08-08-07-19-53.png";
*/
/*
      //取得したデータを，任意の名前で保存するための準備
      //imageURIのFileSystemオブジェクトを取得
      window.resolveLocalFileSystemURL(test, resolve_success, file_error);
      //window.resolveLocalFileSystemURL(imageURI, resolve_success, file_error);
        //FYI: resolveLocalFileSystemURI はdeprecateしてるので，~~~URLを使用
      function resolve_success(entry){
        var d = new Date();
        var n = d.getTime(); //milliSecond
        var newFileName = n + ".png";
        var myFolderApp = "org.PushMe Studio";
        console.log("This occurred during rename ");

        window.requestFileSystem (LocalFileSystem.PERSISTENT, 0,    function(fileSys) {
          console.log("This occurred during copyTo FileSystem");
            fileSys.root.getDirectory(myFolderApp,
              {create : true, exclusive: false},
              function (directory) {
                entry.copyTo (directory, newFileName, move_success, file_error2);
              },
              file_error3);
        },
        file_error4);
      }

      function move_success (entry) {
        $scope.smallImage = document.getElementById('smallImage');
        //$scope.smallImage.src = "./img/ionic.png";
        $scope.smallImage.src = entry.toNativeURL();
      }

      function file_error(error){
        alert('File System Error :' + error.code);
      }

      function file_error2(error2){
        alert('File System Error 2 :' + error2.code);
      }
      function file_error3(error3){
        alert('File System Error 3 :' + error3.code);
      }
      function file_error4(error4){
        alert('File System Error 4 :' + error4.code);
      }
*/

      //console.log(imageURI);

      /** 未使用箇所 ここから **/
      //なぜパス名を変える必要があるのか？Cordovaがセキュリティ上，Androidから直接データ読込をしない仕組みだから？
      /*
      if (imageURI.substring(0,21)=="content://com.android") {
        console.log("++++++++++++++++++++++++++++++++++");
        photo_split=imageURI.split("%3A");
        imageURI="content://media/external/images/media/"+photo_split[1]+".jpg";
        console.log("---------------------------------------");
      }
      */
      /** 未使用箇所 ここまで **/

      //console.log(imageURI);//取得したデータをコンソールに表示

      //$scope.lastPhoto = imageURI;
/*** Webの参考プログラムのテストのために，下記を退避 ***/
      /*
      $scope.smallImage = document.getElementById('smallImage');
      //$scope.smallImage.src = "./img/ionic.png";
      $scope.smallImage.src = "data:/image/jpeg;base64," + imageURI;
      wallpaperURI="data:/image/jpeg;base64," + imageURI;
      Camera.add2WallpaperList(wallpaperURI);//背景画像として選択できるリストに追加するメソッド
      */
/*** ここまでを退避 ***/
    }, function(err) {
      console.err(err);
    }, {
      //quality: 75,
      //targetWidth: 320,
      //targetHeight: 320

      //quality: 75,
      //destinationType: destinationType.FILE_URI,
      //sourceType: pictureSource.SAVEDPHOTOALBUM
      //targetWidth: 320,
      //targetHeight: 320
      //saveToPhotoAlbum: false

      /*
      quality : 75,
      destinationType : Camera.DestinationType.DATA_URL,
      sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
      allowEdit : true,
      encodingType: Camera.EncodingType.JPEG,
      targetWidth: 100,
      targetHeight: 100
      */
    });

    $scope.testImage = document.getElementById('testImage')
    /*
    { quality : 75,
  destinationType : Camera.DestinationType.DATA_URL,
  sourceType : Camera.PictureSourceType.CAMERA,
  allowEdit : true,
  encodingType: Camera.EncodingType.JPEG,
  targetWidth: 100,
  targetHeight: 100 }
    */
};
})

//3つめのタブ(Sample)を選択時に使用するコントローラー
//動作確認や、ノウハウ記録用に使用
.controller('SampleCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
})
