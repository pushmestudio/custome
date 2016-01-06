/**
 * @file mainApp.servicesというモジュールの定義。
 * DBアクセス系を除いた各種サービスを定義している
 * @copyright (c) 2015 PushMe Studio
 */
angular.module('mainApp.services', ['mainApp.dbConnector', 'ngCordova'])

/**
 * @module services.Boards
 * @description ボード、テンプレートの内容の定義も含む
 * @requires DBConn
 * @requires toaster
 */
.factory('Boards', function(DBConn, toaster) {

  // boardのtemplate
  var templates = [{
    id: 0,
    name: 'Template1',
    lastText: 'ToDo',
    img: 'img/wallpaper/taskboard_virt_blue.png'
  }, {
    id: 1,
    name: 'Template2',
    lastText: 'ToDo',
    img: 'img/wallpaper/template_todo_orange.png'
  }, {
    id: 2,
    name: 'Template3',
    lastText: 'ToDo. Horizontal direction.',
    img: 'img/wallpaper/taskboard_port_blue.png'
  }, {
    id: 3,
    name: 'Template4',
    lastText: 'Weekly Calender',
    img: 'img/wallpaper/template_calender_weekly.png'
  }];

  // 非同期処理のために使う、q.defer()のようにして呼び出す
  var $injector = angular.injector(['ng']);
  var q = $injector.get('$q');

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

  var extWallpaper='';

  // ボード画面を開いたとき、新規か更新かを判断する
  var updateFlag = true;

  // オートセーブ機能のpromiseを格納する
  var autoSavePromise = null;

  /**
   * @function addAllMyBoards
   * @description 引数として与えられたallMyBoards(DB内のボード一覧)を、メモリ上のmyBoards[]にコピーする
   * @param allMyBoards ボードオブジェクトの配列
   */
  var addAllMyBoards = function(allMyBoards){
    allMyBoards.forEach(function(myBoard, i){
      myBoards.push(myBoard);
    });
  };

  /**
   * @function setUpdateFlag
   * @description boardの読込時に新規なのか更新なのかを判断し、以降これを見て状態を判断する
   * @param boardId 判定対象とするボードのID
   */
  var setUpdateFlag = function(boardId){
    if(boardId) { // undefinedもnullも空文字も一括判定(http://qiita.com/phi/items/723aa59851b0716a87e3)
      updateFlag = true;
    } else {
      updateFlag = false;
    }
  }

  /**
   * @function openModal
   * @description DBの保存処理を呼ぶ前に、保存が押されたボードが、新規なのか更新（1回目)なのか更新（2回目以降）なのかを判断する
   * @todo 関数名が実態と合っていないので更新を検討する at 12/23
   * @param {Array} parts board上のparts
   * @param {String} wallPaper 壁紙のパス
   * @param {String} boardId boardの識別番号
   * @return {Promise|null} 更新の場合は更新したボードのボードID、新規の場合はnull
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
   * @function saveBoard
   * @description DBに保存処理を依頼し、新規の場合は保存したboardをメモリ上にも追加しておく
   * @param {Array} parts board上のparts
   * @param {String} wallPaper 壁紙のパス
   * @param {String} boardId boardの識別番号
   * @param {Object} boardNames boardの名前とコメント
   * @return {Promise} 保存されたボードのボードID
   */
  var saveBoard = function(parts, wallpaper, boardId, boardNames){
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

  /**
   * @function updateBoardNames
   * @description ボード名を更新する
   * @param boardId 更新対象のボードのID
   * @param boardNames 新しいボードの名前
   * @return {Promise}
   */
  var updateBoardNames = function(boardId, boardNames){
    var deferred = q.defer();
    DBConn.updateBoardNames(boardId, boardNames).then(function(newBoard) {
      deferred.resolve();
    });
    return deferred.promise;
  }

  /**
   * @function updateMyBoardValuesOnMemory
   * @description ボードの壁紙のパスを更新する
   * @todo 関数名が実態と少しずれているようなので変更を検討する at 12/23 小島
   * @param boardId 更新対象のボードのID
   * @param wallpaper 新しいボードの壁紙のパス
   */
  var updateMyBoardValuesOnMemory = function(boardId, wallpaper){
    for (var i = 0; i < myBoards.length; i++) {
      if (myBoards[i].boardId === boardId) {
        myBoards[i].boardContent.wallpaper = wallpaper;
        break;
      }
    }
  }

  return {
    boardNames: boardNames,
    autoSavePromise: autoSavePromise,
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
    getUpdateFlag: function(){
      return updateFlag;
    },
    remove: function(board) {
      templates.splice(templates.indexOf(board), 1);
    },
    /**
     * @function getTemplate
     * @description テンプレートを返す、指定したIDのテンプレートがなければnullを返す
     * @todo 他の関数と同じような記載箇所にすることを検討する at 12/23 小島
     * @param boardId テンプレートのボードID
     * @return {Object|null} 該当するテンプレートがあればテンプレートのオブジェクト
     */
    getTemplate: function(boardId) {
      for (var i = 0; i < templates.length; i++) {
        if (templates[i].id === parseInt(boardId)) {
          return templates[i];
        }
      }
      return null;
    },
    /**
     * @function getBoardName
     * @description ボード名を返す、指定したIDのボードがなければ固定の値をボード名として返す
     * @todo 他の関数と同じような記載箇所にすることを検討する at 12/23 小島
     * @param boardId ボード名を配列から探すためのキーとなるボードID
     * @return ボード名
     */
    getBoardName: function(boardId){
      for (var i = 0; i < myBoards.length; i++) {
        if (myBoards[i].boardId === boardId) {
          return myBoards[i].boardContent.boardName;
        }
      }
      return 'New Board';
    },
    openModal: function(parts, wallPaper, boardId){
      return openModal(parts, wallPaper, boardId);
    },
    saveBoard: function(parts, wallPaper, boardId, boardNames) {
      return saveBoard(parts, wallPaper, boardId, boardNames);
    },
    updateBoardNames: function(boardId, boardNames){
      return updateBoardNames(boardId, boardNames);
    },
    // メモリ上に保存されているボード(myBoards)のデータ(ひとまず壁紙のみ)を更新する
    updateMyBoardValuesOnMemory: function(boardId, wallpaper){
      updateMyBoardValuesOnMemory(boardId, wallpaper);
    }
  };
})

/**
 * @module services.Parts
 * @description ボードに配置するパーツ
 */
.factory('Parts', function() {

  // パーツの大きさ
  var partsSize = [{
      id: '0', // small
      class: 'sticky-note note-yellow note-small',
      flag: true // フラグで選択されているか判定
    },{
      id: '1', // normal
      class: 'sticky-note note-yellow note-normal',
      flag: false
    },{
      id: '2', // wide
      class: 'sticky-note note-yellow note-wide',
      flag: false
    }];

  // パーツの色
  var partsColor = [{
      id: 'a', // yellow
      class: 'center note-sample note-yellow',
      flag: true // フラグで選択されているか判定
    },{
      id: 'b', // blue
      class: 'center note-sample note-blue',
      flag: false
    }];

  var parts = [{
    id: '0',
    id2: 'a1',//パーツの種類を表すユニークな名前(ID)。同じ付箋でも色が違うとか。(黄色)
    title: 'note-yellow-normal',//パレット上に表示用
    type: 'fusen',  //パレット上に表示用
    class: 'sticky-note note-yellow note-normal',
    text: '',
    size: {
      width: 100,
      height: 100
    },
    flag : 'false'  //フラグのOn/Offで，これからボードに配置するパーツかを判定
  }, {
    id: '1',//付箋(青)
    id2: 'b1',
    title: 'note-blue-normal',
    type: 'fusen',
    class: 'sticky-note note-blue note-normal',
    text: '',
    size: {
      width: 100,
      height: 100
    },
    flag : 'false'
  }, {
    id: '2',//横長付箋(黄)
    id2: 'a2',
    title: 'note-yellow-wide',
    type: 'fusen',
    class: 'sticky-note note-yellow note-wide',
    text: '',
    size: {
      width: 100,
      height: 50
    },
    flag : 'false'
  }, {
    id: '3',//横長付箋(青)
    id2: 'b2',
    title: 'note-blue-wide',
    type: 'fusen',
    class: 'sticky-note note-blue note-wide',
    text: '',
    size: {
      width: 100,
      height: 50
    },
    flag : 'false'
  }, {
    id: '4',//小付箋(黄)
    id2: 'a0',
    title: 'note-yellow-small',
    type: 'fusen',
    class: 'sticky-note note-yellow note-small',
    text: '',
    size: {
      width: 75,
      height: 75
    },
    flag : 'false'
  }, {
    id: '5',//小付箋(青)
    id2: 'b0',
    title: 'note-blue-small',
    type: 'fusen',
    class: 'sticky-note note-blue note-small',
    text: '',
    size: {
      width: 75,
      height: 75
    },
    flag : 'false'
  }, {
    id: '6',// 時間管理パーツ (小島くん作成後に入れ替える)
    //id2: 'xxxx',
    title: 'saveTime-part',
    type: 'saveTime',
    class: 'sticky-note note-blue note-wide',
    text: 'Press to record currentTime.',
    size: {
      width: 75,
      height: 75
    },
    flag: 'false'
  }
];

  var flag='false';
  var partX;
  var partY;
  var text;
  var deployedParts=[];

  /**
   * @function selectPartsOnPallet
   * @description パレット上で選択したパーツのフラグを立てるメソッド
   * 画面にパーツをデプロイする際に使うフラグ用
   */
  var selectPartsOnPallet = function(){
    var tgtId;
    for (var key in partsColor){
      if (partsColor[key].flag){
        tgtId = partsColor[key].id;
        break;
      }
    }
    for (var key in partsSize){
      if (partsSize[key].flag){
        tgtId = tgtId + partsSize[key].id;
        break;
      }
    }
    for (var count in parts) { // for...ofから置き換え, for...ofなら(part in parts)でOK
      var part = parts[count];
      if (tgtId === part.id2){
        part.flag='true';
      }else{
        part.flag='false';
      }
    }
  }

  /**
   * @function deployPartByClick
   * @description パレット上のパーツを選択した後に，画面をクリックした時に呼び出されるメソッド
   * deployedPartsにパーツを追加(push)することで，画面に反映させる
   */
  var deployPartByClick = function(){
    for (var count in parts) { // for...ofから置き換え, for...ofなら(part in parts)でOK
      var part = parts[count];

      /*** ここから時間管理パーツ配置のための修正 ***/
      // ここで時間管理パーツを判定するフラグを使って場合分けする。
      // 通常パーツ or 時間管理パーツを判定し，deployedPartにpushする属性を変更する
      // DBにスキーマと異なるので，不整合が起きないように調整する必要あり
      /*** ここまで ***/

      if(part.flag==='true'){
        part.counter++;//同じタイプのパーツの配置数//後で消すかも
        var deployedPart = {
          'partId' : part.id,
          'class' : part.class,
          'text' : part.text,
          'type' : part.type,
          'position' : {
            'x' : partX - (part.size.width/2),
            'y' : partY - (part.size.height/2) - 45
          }
        };
        part.flag='false';//パーツを1回デプロイすると，クリックしてもデプロイできなくする
        deployedParts.push(deployedPart);
      }
    }
  }

  /**
   * @function getAllDeployedParts
   * @description 配置済のパーツおよび配置されるべきパーツを全て取得するメソッド
   * @return {Array} deployedParts 配置済のパーツ一覧
   */
  var getAllDeployedParts = function(){
    return deployedParts;
  }

  /**
   * @function
   * @description DBからロードしたパーツをdeployedPartsに代入する前に初期化するメソッド
   * deployedParts=[];ではダメだが，pop()を使えばうまくいった(よくわかっていない)
   * @todo →空配列の代入(<code>deployedParts=[];</code>)でいけるはずだが、、、。pop()するより効率が良いので変更を検討 at 12/23 小島
   * @return {Array} deployedParts 空のパーツ一覧配列
   */
  var initPartsOnBoard = function(){
    while (deployedParts.length > 0){
      deployedParts.pop();
    }
    return deployedParts;
  }

  /**
   * @function reDeployUsingDBdata
   * @description DBからロードしたパーツをdeployedPartsに代入するメソッド
   * @param boardContent 更新対象のボード
   */
  var reDeployUsingDBdata = function(boardContent){
    deployedParts = initPartsOnBoard(); //deployedPartsの初期化
    //パレット上に登録してあるパーツのカウンターを0に初期化
    //console.log("配置済パーツ数: " + boardContent.parts.length);
    for(var i = 0; i < parts.length;i++){
      parts[i].counter=0;
    }
    for(var count in boardContent.parts){ // for...ofから置き換え, for...ofなら(part in parts)でOK
      var part = boardContent.parts[count];
      //parts[part.partId].counter++;
      deployedParts.push(part);
    }
  }

  var selectedPart = {
    index: -1,
    partId: -1,
    image:"",
    text: "",
    type:"",
    position:{
      x: -1,
      y: -1
    }
  }

  /**
   * @function selectPart
   * @description 配置済パーツの中から選択されたパーツについて、処理に使いやすいように別オブジェクトにコピーする
   * @param index 選択されたパーツのIndex
   */
  var selectPart = function(index){
    selectedPart.index = index;
    selectedPart.partId = deployedParts[selectedPart.index].partId;
    selectedPart.image = deployedParts[selectedPart.index].image;
    selectedPart.text = deployedParts[selectedPart.index].text;
    selectedPart.type = deployedParts[selectedPart.index].type;
    selectedPart.position = deployedParts[selectedPart.index].position;
  }

  /**
   * @function updatePart
   * @description 選択されていたパーツの更新後の結果を、配置済のパーツへと反映する
   */
  var updatePart = function(){
    deployedParts[selectedPart.index].partId = selectedPart.partId;
    deployedParts[selectedPart.index].image = selectedPart.image;
    deployedParts[selectedPart.index].text = selectedPart.text;
    deployedParts[selectedPart.index].type = selectedPart.type;
    deployedParts[selectedPart.index].position = selectedPart.position;
  }

  /**
   * @function setPartState
   * @description 選択された付箋サイズと色に応じて変数partsSize、partsColorのステータスを変更するメソッド
   * @todo variableが何を指しているか伝わりにくいので更新を検討 at 12/23 小島
   * @param variable 選択された付箋サイズ(?)
   * @param selectedType 選択された色(?)
   */
  var setPartState = function(variable, selectedType){
    for(var key in variable){
      if(selectedType === variable[key].id){
        variable[key].flag = true;
      }else{
        variable[key].flag = false;
      }
    }
  }

  /**
   * @function deployTimeStampAsFusen
   * @description ボード上の時間保存パーツをタップした時に，"現在時間を埋め込んだ付箋"を配置する
   */
  var deployTimeStampAsFusen = function(){
    var date = new Date();
    var currentTime = date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    var deployedPart = {
      'partId' : 't1',
      'class' : 'sticky-note note-yellow note-wide',
      'type' : 'fusen',
      'text' : currentTime,
      'position' : {
        'x' : 150,//とりあえず固定値
        'y' : 200
      },
    };
    deployedParts.push(deployedPart);
  };


  return {
    getSize :function() {
      return partsSize;
    },
    getColor :function() {
      return partsColor;
    },
    all: function() {
      return parts;
    },
    select: function() {
      selectPartsOnPallet();
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
    selectedPart: selectedPart,
    selectPart: selectPart,
    updatePart: updatePart,
    reDeploy: function(boardContent){
      reDeployUsingDBdata(boardContent);
    },
    setPart: function(variable, selectedType){
      setPartState(variable, selectedType);
    },
    init: function(){
      initPartsOnBoard();
    },
    setOnFlag: function(){
      parts[6].flag = 'true';//saveTimeパーツのフラグをOnにする
    },
    deployTimeStampPart: function(){
      deployTimeStampAsFusen();
    }
  };
})

/**
 * @module services.Wallpapers
 * @description 壁紙
 * @requires $cordovaFile
 * @requires $cordovaImagePicker
 * @requires d
 */
.factory('Wallpapers', function($cordovaFile, $cordovaImagePicker, d) {

  // 非同期処理のために使う、q.defer()のようにして呼び出す
  var $injector = angular.injector(['ng']);
  var q = $injector.get('$q');

  var wallpaperParams = {
    wallpaperPaths: [],
    currentWallpaperPath: ''
  };

  /**
   * @function toArray
   * @description 引数の配列が空でなければ引数を、そうでなければ空の配列の0番目を返す(?)
   * @todo 小島のJS力だと何をしているか一瞬では理解できなかったので優しくコメントで教えて下さい♥ at 12/23 小島
   * @param list slice対象の配列(?)
   */
  var toArray = function(list) {
    return Array.prototype.slice.call(list || [], 0);
  }

  /**
   * @function listResults
   * @description 壁紙のファイルをパス名と組み合わせた形で配列に格納する
   * @param entries 事前に用意した壁紙のファイル名の配列
   */
  var listResults = function(entries) {
    entries.forEach(function(entry, i) {
      // 最終的にディレクトリ内のファイル一覧を表示する場所がここ
      wallpaperParams.wallpaperPaths.push("img/wallpaper/" + entry.name);
    });
  }

  /**
   * @function loadWallpapers
   * @description 予め壁紙として用意したファイルを再帰的に取得
   * 取得が完了したら、listResultsを経由して、ファイルへのパス名として配列に格納する
   * @return {Promise}
   * @see listResults
   */
  var loadWallpapers = function() {
    var deferred = q.defer();

    // resolveLocalFileSystemURL()は、DirectoryEntryもしくはFileEntryを、ローカルのURL(第1引数)を指定して取得する(第2引数)
    // ここでは、cordova.file.applicationDirectory = "file:///android_asset/" (つまり"custome/platforms/android/assets/")である
    window.resolveLocalFileSystemURL(cordova.file.applicationDirectory + "www/img/wallpaper", gotDIR, fail);

    function gotDIR(dirEntry) {
      var dirReader = dirEntry.createReader();
      var entries = [];

      var readEntries = function() {
        // dirReader.readEntriesの第1引数がsuccessCallbackであり、この引数resultsにはFileEntry(もしくはDirectoryEntry)が格納されている
        dirReader.readEntries(function(results) {
          if(!results.length) {
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

    function fail(event) {
      console.log(event.target.error.code);
      deferred.reject();
    }
    return deferred.promise;
  }

  /**
   * @function setCurrentWallpaper
   * @description 指定されたパス情報を元に現在の壁紙のパス情報を更新する
   * @param selectedWallpaperPath 新しい壁紙のパス情報
   */
  var setCurrentWallpaper = function(selectedWallpaperPath) {
    wallpaperParams.currentWallpaperPath = selectedWallpaperPath;
  }

  /**
   * @function
   * @description ローカル画像を選択し、アプリ内フォルダにコピーします
   * コピー後は、コピー先のファイルパスを返します
   * @see http://ngcordova.com/docs/plugins/imagePicker/
   * @see http://ngcordova.com/docs/plugins/file/
   * @return {Promise} resolve後は、アプリ内フォルダのイメージパスを返す
   */
  var pickAndCopyImage = function() {
    var deferred = q.defer();
    // imagePickerで使用するオプション定義
    var options = {
       maximumImagesCount: 1, // 同時に選択できるイメージの数
       // width: 800,
       // height: 800,
       quality: 80
    };
    var appImagePath; // 戻り値に使う、アプリ内フォルダのイメージへのパス

    $cordovaImagePicker.getPictures(options).then(function (results) {
      // ImagePickerでは複数の写真を選ぶことが可能なので、選んだ回数だけループが回る
      // 1つも選ばない場合は、1回も回らない
      for (var i = 0; i < results.length; i++) {
        var filepath = results[i];
        d.log('Image URI: ' + filepath); // コピー元のイメージへのパス
        var sp = filepath.lastIndexOf("/") + 1; // フォルダとファイルの境目

        // copyFile(コピー元フォルダ、コピーファイル名、コピー先フォルダ、コピーファイル名)
        // dataDirectoryはアプリ内フォルダ
        $cordovaFile.copyFile(filepath.substring(0, sp), filepath.substring(sp)
          , cordova.file.dataDirectory, filepath.substring(sp)).then(function (success) {
            appImagePath = cordova.file.dataDirectory + filepath.substring(sp);
            deferred.resolve(appImagePath);
          }, function (error) {
            d.log('fail to copy image');
            deferred.reject(error);
          });
      }
    }, function(error) {
        d.log('fail to pick a image');
        deferred.reject(error);
    });

    return deferred.promise;
  }

  return {
    loadWallpapers: function() {
      return loadWallpapers();
    },
    getWallpaperParams: function() {
      return wallpaperParams;
    },
    setCurrentWallpaper: function(selectedWallpaperPath) {
      setCurrentWallpaper(selectedWallpaperPath);
    },
    getCurrentWallpaper: function() {
      return wallpaperParams.currentWallpaperPath;
    },
    pickAndCopyImage: function() {
      return pickAndCopyImage();
    }
  };
})

/**
 * @module services.d
 * @description ログ出力モジュール DEBUG_MODE ON時にログを出力させる、値の設定はapp.jsにて
 * ログ出力呼び出し時の簡便さを優先するため、モジュール名はdebugの'd'
 * @requires $rootScope
 */
.factory('d', function($rootScope) {
  const DEBUG_MODE = $rootScope.debugMode;

  /**
   * @function log
   * @description DEBUG_MODEがtrueならd.log()で出力、falseなら出力なし
   * @see http://flabo.io/code/20140926/01-angularjs-application-7-tips/
   * @see http://d.hatena.ne.jp/hokaccha/20111216/1324026093
   */
  var printDebug;
  (function() {
    if(DEBUG_MODE) {
      printDebug = console.debug.bind(console); // console.debugの処理をバインド
    } else {
      printDebug = function(){}; // debugMode = falseのときは何も出力しない
    }
  })();

  return {
    log: printDebug
  };
})
