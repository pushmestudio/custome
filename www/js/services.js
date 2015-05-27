// mainApp.servicesというモジュールを定義する
angular.module('mainApp.services', [])

.factory('Boards', function() {

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

  // DBに保存したBoard一覧を格納する
  var myBoards = [];

  // 引数として与えられたallMyBoards(DB内のボード一覧)を、メモリ上のmyBoards[]にコピーする
  var addAllMyBoards = function(allMyBoards){
    myBoards = allMyBoards;
  };

  // 引数として与えられたnewBoard(新規保存のボード)を、メモリ上のmyBoards[]に加える
  var addNewBoard = function(newBoard){
    if(newBoard) {
      myBoards.push(newBoard);
    }
  };

  return {
    all: function() {
      return boards;
    },
    getMyBoards: function() {
      return myBoards;
    },
    addAllMyBoards: function(allMyBoards) {
      addAllMyBoards(allMyBoards);
    },
    addNewBoard: function(newBoard) {
      addNewBoard(newBoard);
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
