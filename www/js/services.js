/**
 * @file mainApp.servicesというモジュールの定義。
 * DBアクセス系を除いた各種サービスを定義している
 * @copyright (c) 2015 PushMe Studio
 */
angular.module('mainApp.services', ['mainApp.dbConnector', 'ngCordova'])

/**
 * @module Boards
 * @description ボード、テンプレートの内容の定義も含む
 * @requires DBConn
 */
.factory('Boards', function(DBConn) {

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
    lastText: 'ToDo. Horizontal.',
    img: 'img/wallpaper/taskboard_port_blue.png'
  }, {
    id: 3,
    name: 'Template4',
    lastText: 'Weekly Calender',
    img: 'img/wallpaper/template_calender_weekly.png'
  }, {
    id: 4,
    name: 'Template5',
    lastText: 'Blank Template',
    img: 'img/wallpaper/template_blank.png'
  }];

  // 非同期処理のために使う、q.defer()のようにして呼び出す
  var $injector = angular.injector(['ng']);
  var q = $injector.get('$q');

  // DBに保存したBoard一覧を格納する
  var myBoards = [];

  // modalに入力されるボードの名前と説明文を格納する
  var boardNames = {
    boardName : '',
    boardComment : ''
  };

  // ボード画面を開いたとき、新規か更新かを判断する
  var updateFlag = true;

  // オートセーブ機能のpromiseを格納する
  var autoSavePromise = null;
  var autoSavePromise_at_1st = null;

  /**
   * @function addAllMyBoards
   * @description 引数として与えられたallMyBoards(DB内のボード一覧)を、メモリ上のmyBoards[]にコピーする
   * @param {Array} allMyBoards ボードオブジェクトの配列
   */
  var addAllMyBoards = function(allMyBoards) {
    allMyBoards.forEach(function(myBoard) {
      myBoards.push(myBoard);
    });
  };

  /**
   * @function setUpdateFlag
   * @description boardの読込時に新規なのか更新なのかを判断し、以降これを見て状態を判断する
   * @param {String} boardId 判定対象とするボードのID
   */
  var setUpdateFlag = function(boardId) {
    if(boardId) { // undefinedもnullも空文字も一括判定(http://qiita.com/phi/items/723aa59851b0716a87e3)
      updateFlag = true;
    } else {
      updateFlag = false;
    }
  };

  /**
   * @function checkSaveOrUpdate
   * @description DBの保存処理を呼ぶ前に、保存が押されたボードが、新規なのか更新（1回目)なのか更新（2回目以降）なのかを判断する
   * @param {Array} parts board上のparts
   * @param {String} wallPaper 壁紙のパス
   * @param {String} boardId boardの識別番号
   * @return {Promise} boardId 更新の場合は更新したボードのボードID、新規の場合はnull
   */
  var checkSaveOrUpdate = function(parts, wallpaper, boardId){
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
   * @return {Promise} boardId 保存されたボードのボードID
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
   * @param {String} boardId 更新対象のボードのID
   * @param {Object} boardNames 新しいボードの名前と説明を格納したオブジェクト
   * @return {Promise} 同期処理用のオブジェクト
   */
  var updateBoardNames = function(boardId, boardNames){
    var deferred = q.defer();
    DBConn.updateBoardNames(boardId, boardNames).then(function(newBoard) {
      deferred.resolve(newBoard);
    });
    return deferred.promise;
  };

  /**
   * @function updateWallpaperOnMemory
   * @description ボードの壁紙のパスを更新する
   * @param {String} boardId 更新対象のボードのID
   * @param {String} wallpaper 新しいボードの壁紙のパス
   */
  var updateWallpaperOnMemory = function(boardId, wallpaper){
    for (var i = 0; i < myBoards.length; i++) {
      if (myBoards[i].boardId === boardId) {
        myBoards[i].boardContent.wallpaper = wallpaper;
        break;
      }
    }
  };

  return {
    boardNames: boardNames,
    autoSavePromise: autoSavePromise,
    autoSavePromise_at_1st: autoSavePromise_at_1st,
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
     * @param {String} boardId テンプレートのボードID
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
     * @param {String} boardId ボード名を配列から探すためのキーとなるボードID
     * @return {String} ボード名
     */
    getBoardName: function(boardId){
      for (var i = 0; i < myBoards.length; i++) {
        if (myBoards[i].boardId === boardId) {
          return myBoards[i].boardContent.boardName;
        }
      }
      return 'New board';
    },
    checkSaveOrUpdate: function(parts, wallPaper, boardId){
      return checkSaveOrUpdate(parts, wallPaper, boardId);
    },
    saveBoard: function(parts, wallPaper, boardId, boardNames) {
      return saveBoard(parts, wallPaper, boardId, boardNames);
    },
    updateBoardNames: function(boardId, boardNames){
      return updateBoardNames(boardId, boardNames);
    },
    // メモリ上に保存されているボード(myBoards)のデータ(ひとまず壁紙のみ)を更新する
    updateWallpaperOnMemory: function(boardId, wallpaper){
      updateWallpaperOnMemory(boardId, wallpaper);
    }
  };
})

/**
 * @module Parts
 * @description ボードに配置するパーツ
 * @requires d
 */
.factory('Parts', function(d) {

  // 選択できる付箋
  var parts = [{
    // 黄色の普通の付箋
    id: '0',//パーツの種類を表すユニークな名前(ID)。同じ付箋でも色が違うとか。
    title: 'note-yellow-normal',//パレット上に表示用
    type: 'sticky',  //パレット上に表示用
    class: 'sticky-note note-yellow note-normal',
    text: '',
    sample: 'sticky-note note-yellow sample-normal', // モーダル表示用付箋サンプル
    size: {
      width: 100,
      height: 100
    },
    flag : 'false'  //フラグのOn/Offで，これからボードに配置するパーツかを判定
  }, {
    // 黄色の横長の付箋
    id: '1',
    title: 'note-yellow-wide',
    type: 'sticky',
    class: 'sticky-note note-yellow note-wide',
    text: '',
    sample: 'sticky-note note-yellow sample-wide',
    size: {
      width: 100,
      height: 50
    },
    flag : 'false'
  }, {
    // 黄色の小付箋
    id: '2',
    title: 'note-yellow-small',
    type: 'sticky',
    class: 'sticky-note note-yellow note-small',
    text: '',
    sample: 'sticky-note note-yellow sample-small',
    size: {
      width: 75,
      height: 75
    },
    flag : 'false'
  }, {
    // 青色の普通の付箋
    id: '3',
    title: 'note-blue-normal',
    type: 'sticky',
    class: 'sticky-note note-blue note-normal',
    text: '',
    sample: 'sticky-note note-blue sample-normal',
    size: {
      width: 100,
      height: 100
    },
    flag : 'false'
  }, {
    // 青色の横長の付箋
    id: '4',
    title: 'note-blue-wide',
    type: 'sticky',
    text: '',
    class: 'sticky-note note-blue note-wide',
    sample: 'sticky-note note-blue sample-wide',
    size: {
      width: 100,
      height: 50
    },
    flag : 'false'
  }, {
    // 青色の小付箋
    id: '5',
    title: 'note-blue-small',
    type: 'sticky',
    text: '',
    class: 'sticky-note note-blue note-small',
    sample: 'sticky-note note-blue sample-small',
    size: {
      width: 75,
      height: 75
    },
    flag : 'false'
  }, {
    // 緑色の普通の付箋
    id: '6',
    title: 'note-green-normal',
    type: 'sticky',
    class: 'sticky-note note-green note-normal',
    text: '',
    sample: 'sticky-note note-green sample-normal',
    size: {
      width: 100,
      height: 100
    },
    flag : 'false'
  }, {
    // 緑色の横長の付箋
    id: '7',
    title: 'note-green-wide',
    type: 'sticky',
    class: 'sticky-note note-green note-wide',
    text: '',
    sample: 'sticky-note note-green sample-wide',
    size: {
      width: 100,
      height: 50
    },
    flag : 'false'
  }, {
    // 緑色の小付箋
    id: '8',
    title: 'note-green-small',
    type: 'sticky',
    class: 'sticky-note note-green note-small',
    text: '',
    sample: 'sticky-note note-green sample-small',
    size: {
      width: 75,
      height: 75
    },
    flag : 'false'
  }, {
    // ピンク色の普通の付箋
    id: '9',
    title: 'note-pink-normal',
    type: 'sticky',
    class: 'sticky-note note-pink note-normal',
    text: '',
    sample: 'sticky-note note-pink sample-normal',
    size: {
      width: 100,
      height: 100
    },
    flag : 'false'
  }, {
    // ピンク色の横長の付箋
    id: '10',
    title: 'note-pink-wide',
    type: 'sticky',
    class: 'sticky-note note-pink note-wide',
    text: '',
    sample: 'sticky-note note-pink sample-wide',
    size: {
      width: 100,
      height: 50
    },
    flag : 'false'
  }, {
    // ピンク色の小付箋
    id: '11',
    title: 'note-pink-small',
    type: 'sticky',
    class: 'sticky-note note-pink note-small',
    text: '',
    sample: 'sticky-note note-pink sample-small',
    size: {
      width: 75,
      height: 75
    },
    flag : 'false'
  }, {
    // 紫色の普通の付箋
    id: '12',
    title: 'note-purple-normal',
    type: 'sticky',
    class: 'sticky-note note-purple note-normal',
    text: '',
    sample: 'sticky-note note-purple sample-normal',
    size: {
      width: 100,
      height: 100
    },
    flag : 'false'
  }, {
    // 紫色の横長の付箋
    id: '13',
    title: 'note-purple-wide',
    type: 'sticky',
    class: 'sticky-note note-purple note-wide',
    text: '',
    sample: 'sticky-note note-purple sample-wide',
    size: {
      width: 100,
      height: 50
    },
    flag : 'false'
  }, {
    // 紫色の小付箋
    id: '14',
    title: 'note-purple-small',
    type: 'sticky',
    class: 'sticky-note note-purple note-small',
    text: '',
    sample: 'sticky-note note-purple sample-small',
    size: {
      width: 75,
      height: 75
    },
    flag : 'false'
  }, {
    // 白色の普通の付箋
    id: '15',
    title: 'note-white-normal',
    type: 'sticky',
    class: 'sticky-note note-white note-normal',
    text: '',
    sample: 'sticky-note note-white sample-normal',
    size: {
      width: 100,
      height: 100
    },
    flag : 'false'
  }, {
    // 白色の横長の付箋
    id: '16',
    title: 'note-white-wide',
    type: 'sticky',
    class: 'sticky-note note-white note-wide',
    text: '',
    sample: 'sticky-note note-white sample-wide',
    size: {
      width: 100,
      height: 50
    },
    flag : 'false'
  }, {
    // 白色の小付箋
    id: '17',
    title: 'note-white-small',
    type: 'sticky',
    class: 'sticky-note note-white note-small',
    text: '',
    sample: 'sticky-note note-white sample-small',
    size: {
      width: 75,
      height: 75
    },
    flag : 'false'
  }, {
    id: '18', // TODO このサービスのreturnの中でparts[18]と指定してflagに変更を加えている関数有り、変更時要注意
    title: 'saveTime-part',
    type: 'saveTime', // TODO 便利ボタン的なタイプ名にしたい
    class: 'sticky-note note-purple item item-icon ion-clock', // TODO 付箋と同じクラスを使うのか？見た目は検討の余地あり
    text: '', // TODO 表示する文言はこれでいくか？検討の余地あり
    size: {
      width: 75,
      height: 75
    },
    flag: 'false'
  }];

  // サービス内で使い回している、各パーツの位置やテキストを一時的に格納している変数
  var partX;
  var partY;

  // 配置済のパーツを管理するために使用している配列
  var deployedParts=[];

  /**
   * @function selectPartsOnPallet
   * @description パレット上で選択したパーツのフラグを立てるメソッド
   * 画面にパーツをデプロイする際に使うフラグ用
   * @param {String} tgtId 選択した付箋を示すID
   */
  var selectPartsOnPallet = function(tgtId){
    for (var count in parts) { // for...ofから置き換え, for...ofなら(part in parts)でOK
      var part = parts[count];
      if (tgtId === part.id){
        part.flag='true';
      }else{
        part.flag='false';
      }
    }
  };

  /**
   * @function deployPartByClick
   * @description パレット上のパーツを選択した後に，画面をクリックした時に呼び出されるメソッド
   * deployedPartsにパーツを追加(push)することで，画面に反映させる
   */
  var deployPartByClick = function(){
    for (var count in parts) { // for...ofから置き換え, for...ofなら(part in parts)でOK
      var part = parts[count];

      if(part.flag==='true'){
        // part.counter++; //同じタイプのパーツの配置数 未使用に付きコメントアウト 時期を見て削除 at 16/3/9 小島
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
  };

  /**
   * @function getAllDeployedParts
   * @description 配置済のパーツおよび配置されるべきパーツを全て取得するメソッド
   * @return {Array} deployedParts 配置済のパーツ一覧
   */
  var getAllDeployedParts = function(){
    return deployedParts;
  };

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
  };

  /**
   * @function reDeployUsingDBdata
   * @description DBからロードしたパーツをdeployedPartsに代入するメソッド
   * @param {Object} boardContent 更新対象のボード
   */
  var reDeployUsingDBdata = function(boardContent){
    deployedParts = initPartsOnBoard(); //deployedPartsの初期化
    //パレット上に登録してあるパーツのカウンターを0に初期化
    //d.log("配置済パーツ数: " + boardContent.parts.length);
    for(var i = 0; i < parts.length;i++){
      parts[i].counter=0;
    }
    for(var count in boardContent.parts){ // for...ofから置き換え, for...ofなら(part in parts)でOK
      var part = boardContent.parts[count];
      //parts[part.partId].counter++;
      deployedParts.push(part);
    }
  };

  var selectedPart = {
    index: -1,
    partId: -1,
    image: '',
    text: '',
    type: '',
    position:{
      x: -1,
      y: -1
    }
  };

  /**
   * @function selectPart
   * @description 配置済パーツの中から選択されたパーツについて、処理に使いやすいように別オブジェクトにコピーする
   * @param {int} index 選択されたパーツのIndex
   */
  var selectPart = function(index) {
    selectedPart.index = index;
    selectedPart.partId = deployedParts[selectedPart.index].partId;
    selectedPart.image = deployedParts[selectedPart.index].image;
    selectedPart.text = deployedParts[selectedPart.index].text;
    selectedPart.type = deployedParts[selectedPart.index].type;
    selectedPart.position = deployedParts[selectedPart.index].position;
  };

  /**
   * @function updatePart
   * @description 選択されていたパーツの更新後の結果を、配置済のパーツへと反映する
   */
  var updatePart = function() {
    deployedParts[selectedPart.index].partId = selectedPart.partId;
    deployedParts[selectedPart.index].image = selectedPart.image;
    deployedParts[selectedPart.index].text = selectedPart.text;
    deployedParts[selectedPart.index].type = selectedPart.type;
    deployedParts[selectedPart.index].position = selectedPart.position;
  };

  /**
   * @function setPartState
   * @description 選択された付箋サイズと色に応じて変数partsSize、partsColorのステータスを変更するメソッド
   * @todo variableが何を指しているか伝わりにくいので更新を検討 at 12/23 小島
   * @param {Array} variable パーツの配列
   * @param {String} selectedType 選択されたパーツのID
   */
  var setPartState = function(variable, selectedType) {
    for (var key in variable) {
      if (selectedType === variable[key].id) {
        variable[key].flag = true;
      } else {
        variable[key].flag = false;
      }
    }
  };

  /**
   * @function deployTimeStampAsSticky
   * @description ボード上の時間保存パーツをタップした時に，"現在時間を埋め込んだ付箋"を配置する
   * @param {double} x タップされた時間保存パーツのx(横)位置, NaNが来たら固定値に置き換え
   * @param {double} y タップされた時間保存パーツのy(縦)位置, NaNが来たら固定値に置き換え
   */
  var deployTimeStampAsSticky = function(x, y) {
    var date = new Date();
    var currentTime = date.toTimeString().substring(0, 8); // "21:54:26 GMT+0900"の出力の0番目(含)から8番目(除)まで

    // 配置位置をランダムにずらす 時間保存パーツと位置が被ってしまわないように固定値で生成位置をずらしている
    const POSITION_RANGE = 80; // ランダムに配置される位置(px)の可変幅(縦横ともに)
    const POSITION_AVOID = 20; // ランダムに配置される際に、配置しないように避ける幅

    // ありえないはずだが、万が一x, yにNaN(Not a Number)が来たら、100, 100の位置を代替的に使う
    x = isNaN(x) ? (POSITION_RANGE + POSITION_AVOID) : x;
    y = isNaN(y) ? (POSITION_RANGE + POSITION_AVOID) : y;

    // POSITION_RANGE+POSITION_AVOID=時間保存パーツから離れて生成される際の最大の距離幅
    // 既存の時間保存パーツの位置 ± ランダム計算した位置
    var xRandom = x + ((POSITION_RANGE * Math.random() + POSITION_AVOID) * getRandomSign());
    var yRandom = y + ((POSITION_RANGE * Math.random() + POSITION_AVOID) * getRandomSign());
    d.log('Random position is: \(x, y\)=\(' + xRandom + ',' + yRandom + '\)');

    var deployedPart = {
      'partId' : 't1',
      'class' : 'sticky-note note-white center',
      'type' : 'sticky',
      'text' : currentTime,
      'position' : {
        'x' : xRandom,
        'y' : yRandom
      },
    };
    deployedParts.push(deployedPart);
  };

  /**
   * @private
   * @function getRandomSign
   * @description ランダムに1 or -1を返す、内部関数として、公開せずに使用する想定
   * @return {int} 1 or -1
   */
  var getRandomSign = function() {
    if (Math.random() - 0.5 >= 0) {
      return 1;
    } else {
      return -1;
    }
  };

  /**
   * @function getStickyParts
   * @description 事前に用意してある全パーツの中から，Stickyを抽出する
   * @return {Array} extractedStickyParts 抽出したSticky配列
   */
  var getStickyParts = function() {
    var extractedStickyParts=[];
    for (var partNo in parts){
      if (parts[partNo].type === 'sticky') {
        extractedStickyParts.push(parts[partNo]);
      }
    }
    return extractedStickyParts;
  };

  return {
    all: function() {
      return parts;
    },
    select: function(tgtId) {
      selectPartsOnPallet(tgtId);
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
    setPartState: setPartState,
    reDeploy: function(boardContent){
      reDeployUsingDBdata(boardContent);
    },
    init: function(){
      initPartsOnBoard();
    },
    setOnFlag: function(){
      // saveTimeパーツのフラグをOnにする TODO 明らかにバグになりそうなので要注意 at 16/3/9 小島
      parts[18].flag = 'true';
    },
    deployTimeStampPart: function(x, y){
      deployTimeStampAsSticky(x, y);
    },
    getStickyParts: function(){
      return getStickyParts();
    }
  };
})

/**
 * @module Wallpapers
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
   * @description 引数の配列が空でなければ引数の先頭要素から最後までを、空の場合は空の配列を返す
   * @param {Array} list FileEntryの配列
   * @return {Array} 引数の先頭要素から最後までを格納してある配列、もしくは空の配列
   */
  var toArray = function(list) {
    return Array.prototype.slice.call(list || [], 0);
  };

  /**
   * @function listResults
   * @description 壁紙のファイルをパス名と組み合わせた形で配列に格納する
   * @param {Array} entries 事前に用意した壁紙のファイル名の配列
   */
  var listResults = function(entries) {
    entries.forEach(function(entry) {
      // 最終的にディレクトリ内のファイル一覧を表示する場所がここ
      wallpaperParams.wallpaperPaths.push('img/wallpaper/' + entry.name);
    });
  };

  /**
   * @function loadWallpapers
   * @description 予め壁紙として用意したファイルを再帰的に取得
   * 取得が完了したら、listResultsを経由して、ファイルへのパス名として配列に格納する
   * @return {Promise} 同期処理用のオブジェクト
   * @see listResults
   */
  var loadWallpapers = function() {
    var deferred = q.defer();

    // resolveLocalFileSystemURL()は、DirectoryEntryもしくはFileEntryを、ローカルのURL(第1引数)を指定して取得する(第2引数)
    // ここでは、cordova.file.applicationDirectory = "file:///android_asset/" (つまり"custome/platforms/android/assets/")である
    // 失敗した場合、failが呼ばれる
    window.resolveLocalFileSystemURL(cordova.file.applicationDirectory + 'www/img/wallpaper', gotDIR, fail);

    function gotDIR(dirEntry) {
      var dirReader = dirEntry.createReader();
      var entries = [];

      var readEntries = function() {
        // dirReader.readEntriesの第1引数がsuccessCallbackであり、この引数resultsにはFileEntry(もしくはDirectoryEntry)が格納されている
        // 失敗した場合、failが呼ばれる
        dirReader.readEntries(function(results) {
          if(!results.length) {
            // Array.prototype.sort()は、引数が省略された場合、要素の文字列比較に基づいて辞書順にソートされる
            listResults(entries.sort());
            deferred.resolve();
          } else {
            entries = entries.concat(toArray(results));
            // dirReader.readEntriesは一度でディレクトリ内にある全てのEntryを読み込むとは限らないため、resultsがなくなるまで繰り返し呼び出す。
            // また、readEntriesを繰り返し呼び出す場合、一度読み込まれたEntryは再び読み込まれず、前に呼び出したEntryの続きから読み込む。
            readEntries();
          }
        }, fail);
      };
      readEntries();
    }

    function fail(event) {
      d.log(event.target.error.code);
      deferred.reject();
    }
    return deferred.promise;
  };

  /**
   * @function setCurrentWallpaper
   * @description 指定されたパス情報を元に現在の壁紙のパス情報を更新する
   * @param {String} selectedWallpaperPath 新しい壁紙のパス情報
   */
  var setCurrentWallpaper = function(selectedWallpaperPath) {
    wallpaperParams.currentWallpaperPath = selectedWallpaperPath;
  };

  /**
   * @function
   * @description ローカル画像を選択し、アプリ内フォルダにコピーします
   * コピー後は、コピー先のファイルパスを返します
   * @see http://ngcordova.com/docs/plugins/imagePicker/
   * @see http://ngcordova.com/docs/plugins/file/
   * @return {Promise} appImagePath resolve後は、アプリ内フォルダのイメージパスを返す
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
        var sp = filepath.lastIndexOf('/') + 1; // フォルダとファイルの境目の位置, Separatorの略

        // copyFile(コピー元フォルダ、コピーファイル名、コピー先フォルダ、コピーファイル名)
        // dataDirectoryはアプリ内フォルダ
        $cordovaFile.copyFile(filepath.substring(0, sp), filepath.substring(sp)
          , cordova.file.dataDirectory, filepath.substring(sp)).then(function() {
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
  };

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
 * @module d
 * @description ログ出力モジュール DEBUG_MODE ON時にログを出力させる、値の設定はapp.jsにて
 * ログ出力呼び出し時の簡便さを優先するため、モジュール名はdebuggerの'd'
 * @requires $rootScope
 */
.factory('d', function($rootScope) {
  /* eslint-disable no-console */
  /**
   * @const {boolean} DEBUG_MODE デバッグ中ならONにして、ログ出力機能を有効にする
   */
  const DEBUG_MODE = $rootScope.debugMode;

  /**
   * @function log
   * @description DEBUG_MODEがtrueならd.log()で出力、falseなら出力なし
   * @see http://flabo.io/code/20140926/01-angularjs-application-7-tips/
   * @see http://d.hatena.ne.jp/hokaccha/20111216/1324026093
   */
  var printLog;

  /**
   * @function debug
   * @description DEBUG_MODEがtrueならd.debug()でデバッグログ出力、falseなら出力なし
   */
  var printDebug;

  /**
   * @function trace
   * @description DEBUG_MODEがtrueならd.trace()で呼び出し元などを辿って出力、falseなら出力なし
   */
  var printTrace;

  (function() {
    if(DEBUG_MODE) {
      printLog = console.log.bind(console); // console.logの処理をバインド
      printDebug = console.debug.bind(console); // console.debugの処理をバインド
      printTrace = console.trace.bind(console); // console.traceの処理をバインド
    } else {
      printLog = function(){}; // debugMode = falseのときは何も出力しない
      printDebug = function(){};
      printTrace = function(){};
    }
  })();

  return {
    log: printLog,
    debug: printDebug,
    trace: printTrace
  };
})

/**
 * @module AdMobManager
 * @description AdMob広告関連の変数を用意する
 * @requires $rootScope
 * @requires $timeout
 * @requires d
 */
.factory('AdMobManager', function($rootScope, $timeout, d){
  /**
   * @const {double} FREQ_POP_AD 広告の表示量、1で常に表示、0で常に非表示
   */
  const FREQ_POP_AD = 0.3;

  /**
  * @const {boolean} DEBUG_MODE デバッグ中ならONにして、テスト用広告にする
   */
  const DEBUG_MODE = $rootScope.debugMode;

  // 広告呼び出し用のID
  var admobid = {
    // banner: '', バナー広告を使用する場合に必要
    interstitial: 'ca-app-pub-2622960706202758/6313111825'
  };

  var flagData = {
    iconFlag: false,
    alterFlag: false
  };

  /**
   * @function initAdMob
   * @description 広告関連の処理を初期化する関数
   * 現在は、端末がAndroidの場合のみ初期化処理が進められる
   * デバッグモードtrueの場合、テスト広告の準備をする
   */
  var initAdMob = function(){
    // Androidの場合
    if(ionic.Platform.isAndroid()){
      if(typeof window.AdMob == 'undefined'){
        d.log('AdMob plugin is not ready');
      } else {
        /*
        // バナー広告を準備
        AdMob.createBanner({
          adId: admobid.banner,
          isTesting: true,
          overlap: false,
          position: AdMob.AS_POSITION.BOTTOM_CENTER,
          bgColor: 'black',
          autoShow: true
        });
        */

        // 広告の読込が完了（成功したときのコールバック）
        document.addEventListener('onAdLoaded', function() {
          if(Math.random() <= FREQ_POP_AD){
            d.log('Interstitial ad is ready');
            $timeout(function(){
              flagData.iconFlag = true;
            });
          }
        });

        // インタースティシャル広告を準備
        window.AdMob.prepareInterstitial({
          adId: admobid.interstitial,
          // デバック⇒true, 本番⇒false
          isTesting: DEBUG_MODE,
          autoShow: false
        });
      }
    }
  };

  /**
   * @function showInterstitialAd
   * @description インターステイシャル広告を表示する
   */
  var showInterstitialAd = function(){
    window.AdMob.showInterstitial();
  };

  return {
    AdMob: window.AdMob,
    flagData: flagData,
    initAdMob: function(){
      initAdMob();
    },
    showInterstitialAd: function(){
      showInterstitialAd();
    }
  };
});
