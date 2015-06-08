// mainApp.servicesというモジュールを定義する
angular.module('mainApp.services', ['mainApp.dbConnector'])

.factory('Boards', function(DBConn) {

  // boardのtemplate
  // TODO:混同しないようにより適切な名前へと要変更
  var boards = [{
    id: 0,
    name: 'タスクボード1',
    lastText: '小島ボード1',
    img: 'img/taskboard_port_blue.png'
  }, {
    id: 1,
    name: 'タスクボード2',
    lastText: '小島ボード2',
    img: 'img/taskboard_port_green.png'
  }, {
    id: 2,
    name: 'タスクボード3',
    lastText: '小島ボード3',
    img: 'img/taskboard_virt_blue.png'
  }, {
    id: 3,
    name: 'タスクボード4',
    lastText: '小島ボード4',
    img: 'img/taskboard_virt_orange.png'
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

  // ボード画面を開いたとき、新規か更新かを判断する
  var updateFlag = true;

  // 引数として与えられたallMyBoards(DB内のボード一覧)を、メモリ上のmyBoards[]にコピーする
  var addAllMyBoards = function(allMyBoards){
    myBoards = allMyBoards;
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
   * @param {Object} modal controllerで作成したmodal
   * @param {Array} parts board上のparts
   * @param {String} wallPaper 壁紙のパス
   * @param {String} boardId boardの識別番号 
   */
  var openModal = function(modal, parts, wallPaper, boardId){
    console.log(boardId);
    // 更新の場合
    if(updateFlag) {
      // modalがremoveされていない場合
      if(modal) {
        modal.remove();
      } else {
        // 更新でかつmodalがremoveされている場合は、2回目以降の更新と判断
        saveBoard(parts, wallPaper, boardId);
      }
    } else {
      // 新規の場合、モーダルを表示する
      modal.show();
    }
  };

  /**
   * DBに保存処理を依頼し、新規の場合は保存したboardをメモリ上にも追加しておく
   * @param {Object} modal controllerで作成したmodal
   * @param {Array} parts board上のparts
   * @param {String} wallPaper 壁紙のパス
   * @param {String} boardId boardの識別番号 
   */
  var saveBoard = function(parts, wallPaper, boardId){
    var deferred = q.defer();
    DBConn.save(parts, wallPaper, boardId, boardNames).then(function(newBoard) {
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

  return {
    boardNames: boardNames,
    all: function() {
      return boards;
    },
    getMyBoards: function(){
      return myBoards;
    },
    addAllMyBoards: function(allMyBoards) {
      addAllMyBoards(allMyBoards);
    },
    setUpdateFlag: function(boardId){
      setUpdateFlag(boardId);
    },
    remove: function(board) {
      boards.splice(boards.indexOf(board), 1);
    },
    get: function(boardId) {
      for (var i = 0; i < boards.length; i++) {
        if (boards[i].id === parseInt(boardId)) {
          return boards[i];
        }
      }
      return null;
    },
    openModal: function(modal, parts, wallPaper, boardId){
      openModal(modal, parts, wallPaper, boardId);
    },
    saveBoard: function(parts, wallPaper, boardId) {
      return saveBoard(parts, wallPaper, boardId);
    }
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

  return {
    all: function() {
      return parts;
    },
    select: function(partid) {
      for (part of parts) {
        if (partid === part.id){
          part.flag='true';
        }else{
          part.flag='false';
        }
      }
      return null;
    },
    deploy: function() {
      for (part of parts) {
        if(part.flag==='true'){
          part.counter++;//同じタイプのパーツの配置数//後で消すかも
          var deployedPart = {
            partId : part.id,
            image : part.img,
            type : part.type,
            position : {
              x : partX-50,
              y : partY-100,
            }
          };
          deployedParts.push(deployedPart);//将来，複数のパーツをいっきに配置する際に利用。
          return deployedParts;
        }
      }
      return null;
    },
    //配置されるパーツ(flag=true)をすべて取得
    getAllDeployed: function(){
      return deployedParts;
    },
    //任意の位置をクリックで指定
    setCoord: function($event){
      partX = $event.x;
      partY = $event.y;
      return null;
    },

    //DBから読み込んだデータを引数とする
    //ボードに再配置するパーツをまとめるメソッド
    reDeploy: function(boardContent){
      //var reDeployedParts=[];
      for(part of boardContent.parts){
        //console.debug(part);
        /*var reDeployedPart = {
          partId : part.id,
          image : part.image,
          type : part.type,
          position : {
            x : part.position.x-50,
            y : part.position.y-100,
          }
        };*/
        parts[part.partId].counter++;
        deployedParts.push(part);
      }
      return deployedParts;
    }
  };
});
