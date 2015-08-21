// mainApp.servicesというモジュールを定義する
angular.module('mainApp.services', ['mainApp.dbConnector'])

.factory('Boards', function(DBConn, toaster) {

  // boardのtemplate
  // TODO:混同しないようにより適切な名前へと要変更
  var templates = [{
    id: 0,
    name: 'タスクボード1',
    lastText: '小島ボード1',
    img: 'img/wallpaper/taskboard_port_blue.png'
  }, {
    id: 1,
    name: 'タスクボード2',
    lastText: '小島ボード2',
    img: 'img/wallpaper/taskboard_port_green.png'
  }, {
    id: 2,
    name: 'タスクボード3',
    lastText: '小島ボード3',
    img: 'img/wallpaper/taskboard_virt_blue.png'
  }, {
    id: 3,
    name: 'タスクボード4',
    lastText: '小島ボード4',
    img: 'img/wallpaper/taskboard_virt_orange.png'
  }];

  // 非同期処理のために使う、q.defer()のようにして呼び出す
  var $injector = angular.injector(['ng']);
  q = $injector.get('$q');

  // DBに保存したBoard一覧を格納する
  var myBoards = [];

  // 現在のbordIdを格納するもので、BoardsDetailCtrlとの間でバインドすることを目的としている
  var boardId = '';

  // modalに入力されるボードの名前と説明文を格納する
  var boardNames = {
    boardName : '',
    boardComment : ''
  };

  // var usedWallpaper='';

  // ボード画面を開いたとき、新規か更新かを判断する
  var updateFlag = true;

  // 引数として与えられたallMyBoards(DB内のボード一覧)を、メモリ上のmyBoards[]にコピーする
  var addAllMyBoards = function(allMyBoards){
    allMyBoards.forEach(function(myBoard, i){
      myBoards.push(myBoard);
    });
  };

  // boardの読込時に新規なのか更新なのかを判断し、以降これを見て状態を判断する
  var setUpdateFlag = function(boardId){
    if(boardId) { // undefinedもnullも空文字も一括判定(http://qiita.com/phi/items/723aa59851b0716a87e3)
      updateFlag = true;
    } else {
      updateFlag = false;
    }
  }

  /**
   * DBの保存処理を呼ぶ前に、保存が押されたボードが、新規なのか更新（1回目)なのか更新（2回目以降）なのかを判断する
   * @param {Array} parts board上のparts
   * @param {String} wallPaper 壁紙のパス
   * @param {String} boardId boardの識別番号
   */
  var openModal = function(parts, wallpaper, boardId){
    var deferred = q.defer();
    // 更新の場合
    if(updateFlag) {
      // 更新でかつmodalがremoveされている場合は、2回目以降の更新と判断
      saveBoard(parts, wallpaper, boardId).then(function(boardId){
        deferred.resolve(boardId);
      });
    // 新規の場合
    } else {
      deferred.resolve(null);
    }
    return deferred.promise;
  };

  /**
   * DBに保存処理を依頼し、新規の場合は保存したboardをメモリ上にも追加しておく
   * @param {Array} parts board上のparts
   * @param {String} wallPaper 壁紙のパス
   * @param {String} boardId boardの識別番号
   */
  var saveBoard = function(parts, wallpaper, boardId){
    var deferred = q.defer();
    DBConn.save(parts, wallpaper, boardId, boardNames).then(function(newBoard) {
      // 新規の場合
      if(newBoard) {
        // save時、新規の場合は新規Objectが返ってくるためメモリ上のmyBoards[]に加える
        myBoards.push(newBoard);
        // 以降保存を押したときは更新処理になるためflagを更新
        updateFlag = true;
        deferred.resolve(newBoard.boardId);
      } else {
        deferred.resolve(boardId);
      }
    });
    return deferred.promise;
  };

  var updateMyBoardValuesOnMemory = function(boardId, wallpaper){
    for (var i = 0; i < myBoards.length; i++) {
      if (myBoards[i].boardId === boardId) {
        myBoards[i].boardContent.wallpaper = wallpaper;
        return;
      }
    }
    return;
  }

  /**
   * 現在表示しているボードのwallpaperをセットするメソッド
   *
   */
  /* 2015/8/17(tomita) 壁紙処理はWallpaperサービスに移行したので不要
  var setUsedWallpaper = function(boardContent, boardId){
    for (var i = 0; i < templates.length; i++){
      if (parseInt(boardId) === templates[i].id){
        usedWallpaper = templates[i].img;
        return null;
      }
    }
    usedWallpaper = boardContent.wallpaper;
    return null;
  };
  */

  return {
    boardNames: boardNames,
    getMyBoards: function() {
      return myBoards;
    },
    getAllTemplates: function() {
      return templates;
    },
    addAllMyBoards: function(allMyBoards) {
      addAllMyBoards(allMyBoards);
    },
    setUpdateFlag: function(boardId){
      setUpdateFlag(boardId);
    },
    remove: function(board) {
      templates.splice(templates.indexOf(board), 1);
    },
    getTemplate: function(boardId) {
      for (var i = 0; i < templates.length; i++) {
        if (templates[i].id === parseInt(boardId)) {
          return templates[i];
        }
      }
      return null;
    },
    openModal: function(parts, wallPaper, boardId){
      return openModal(parts, wallPaper, boardId);
    },
    saveBoard: function(parts, wallPaper, boardId) {
      return saveBoard(parts, wallPaper, boardId);
    },
    // メモリ上に保存されているボード(myBoards)のデータ(ひとまず壁紙のみ)を更新する
    updateMyBoardValuesOnMemory: function(boardId, wallpaper){
      updateMyBoardValuesOnMemory(boardId, wallpaper);
    }/* 2015/8/17(tomita) 壁紙処理はWallpaperサービスに移行したので不要
    getBoardWallpaper: function(boardId){
      return getUsedWallpaper(boardId);
    },
    setUsedWallpaper: function(boardContent, boardId){
      setUsedWallpaper(boardContent, boardId);
    },
    getUsedWallpaper: function(){
      return usedWallpaper;
    }*/
  };
})

.factory('Parts', function() {

  var parts = [{
    id: '0',//パーツの種類を表すユニークな名前(ID)。同じ付箋でも色が違うとか。(黄色)
    title: 'yellow',//パレット上に表示用
    type: 'fusen',  //パレット上に表示用
    img: 'img/part_fusen_yellow.png',
    counter: 0, //パレット上に表示用
    flag : 'false'  //フラグのOn/Offで，これからボードに配置するパーツかを判定
  }, {
    id: '1',//付箋(青)
    title: 'blue',
    type: 'fusen',
    img: 'img/part_fusen_blue.png',
    counter: 0,
    flag : 'false'
  }];

  var flag='false';
  var partX;
  var partY;
  var deployedParts=[];

  /***
   * パレット上で選択したパーツのフラグを立てるメソッド
   * 画面にパーツをデプロイする際に使うフラグ用
   */
  var selectPartsOnPallet = function(partid){
    for (count in parts) { // for...ofから置き換え, for...ofなら(part in parts)でOK
      var part = parts[count];
      if (partid === part.id){
        part.flag='true';
      }else{
        part.flag='false';
      }
    }
  }

  /***
   * パレット上のパーツを選択した後に，画面をクリックした時に呼び出されるメソッド
   * deployedPartsにパーツを追加(push)することで，画面に反映させる
   */
  var deployPartByClick = function(){
    for (count in parts) { // for...ofから置き換え, for...ofなら(part in parts)でOK
      var part = parts[count];
      if(part.flag==='true'){
        part.counter++;//同じタイプのパーツの配置数//後で消すかも
        var deployedPart = {
          'partId' : part.id,
          'image' : part.img,
          'type' : part.type,
          'position' : {
            x : partX-50,
            y : partY-100,
          }
        };
        part.flag='false';//パーツを1回デプロイすると，クリックしてもデプロイできなくする
        deployedParts.push(deployedPart);
      }
    }
  }

  /***
   * 配置済のパーツおよび配置されるべきパーツを全て取得するメソッド
   *
   */
  var getAllDeployedParts = function(){
    return deployedParts;
  }

  /***
   * DBからロードしたパーツをdeployedPartsに代入する前に初期化するメソッド
   * deployedParts=[];ではダメだが，pop()を使えばうまくいった(よくわかっていない)
   */
  var initPartsOnBoard = function(){
    while (deployedParts.length > 0){
      deployedParts.pop();
    }
    return deployedParts;
  }

  /***
   * DBからロードしたパーツをdeployedPartsに代入するメソッド
   *
   */
  var reDeployUsingDBdata = function(boardContent){
    deployedParts = initPartsOnBoard(); //deployedPartsの初期化
    //パレット上に登録してあるパーツのカウンターを0に初期化
    for(var i = 0; i < parts.length;i++){
      parts[i].counter=0;
    }
    for(count in boardContent.parts){ // for...ofから置き換え, for...ofなら(part in parts)でOK
      var part = boardContent.parts[count];
      parts[part.partId].counter++;
      deployedParts.push(part);
    }
  }

  return {
    all: function() {
      return parts;
    },
    select: function(partid) {
      selectPartsOnPallet(partid);
    },
    deploy: function() {
      deployPartByClick();
    },
    getAllDeployed: function(){
      return getAllDeployedParts();
    },
    setCoord: function($event){
      partX = $event.x;
      partY = $event.y;
    },
    reDeploy: function(boardContent){
      reDeployUsingDBdata(boardContent);
    },
    init: function(){
      initPartsOnBoard();
    }
  };
})

  // Wallpapersサービスを定義
.factory('Wallpapers', function() {

  // 非同期処理のために使う、q.defer()のようにして呼び出す
  var $injector = angular.injector(['ng']);
  q = $injector.get('$q');

  var wallpaperParams = {
    wallpaperPaths: [],
    currentWallpaperPath: ''
  };

  var toArray = function(list){
    return Array.prototype.slice.call(list || [], 0);
  }

  var listResults = function(entries){
    entries.forEach(function(entry, i){
      // 最終的にディレクトリ内のファイル一覧を表示する場所がここ
      wallpaperParams.wallpaperPaths.push("img/wallpaper/" + entry.name);
    });
  }

  var loadWallpapers = function(){
    var deferred = q.defer();

    // resolveLocalFileSystemURL()は、DirectoryEntryもしくはFileEntryを、ローカルのURL(第1引数)を指定して取得する(第2引数)
    // ここでは、cordova.file.applicationDirectory = "file:///android_asset/" (つまり"custome/platforms/android/assets/")である
    window.resolveLocalFileSystemURL(cordova.file.applicationDirectory + "www/img/wallpaper", gotDIR, fail);

    function gotDIR(dirEntry){
      var dirReader = dirEntry.createReader();
      var entries = [];

      var readEntries = function(){
        // dirReader.readEntriesの第1引数がsuccessCallbackであり、この引数resultsにはFileEntry(もしくはDirectoryEntry)が格納されている
        dirReader.readEntries(function(results){
          if(!results.length){
            // Array.prototype.sort()は、引数が省略された場合、要素の文字列比較に基づいて辞書順にソートされる
            listResults(entries.sort());
            deferred.resolve();
          } else {
            entries = entries.concat(toArray(results));
            // resultsがなくなるまで繰り返し
            readEntries();
          }
        }, fail);
      };
      readEntries();
    }

    function fail(event){
      console.log(event.target.error.code);
      deferred.reject();
    }
    return deferred.promise;
  }

  var setCurrentWallpaper = function(selectedWallpaperPath){
    wallpaperParams.currentWallpaperPath = selectedWallpaperPath;
  }

  return {
    loadWallpapers: function(){
      return loadWallpapers();
    },
    getWallpaperParams: function(){
      return wallpaperParams;
    },
    setCurrentWallpaper: function(selectedWallpaperPath){
      setCurrentWallpaper(selectedWallpaperPath);
    },
    getCurrentWallpaper: function(){
      return wallpaperParams.currentWallpaperPath;
    }
  };
})

