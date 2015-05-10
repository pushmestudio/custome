// mainApp.servicesというモジュールを定義する
angular.module('mainApp.services', [])

.factory('Boards', function() {

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

  return {
    all: function() {
      return boards;
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
    id: 0,
    title: 'yellow',
    type: 'fusen',
    img: 'img/part_fusen_yellow.png',
    counter: 0
  }, {
    id: 1,
    title: 'blue',
    type: 'fusen',
    img: 'img/part_fusen_blue.png',
    counter: 0
  }];

  var deployedParts=[];

  return {
    all: function() {
      return parts;
    },
    deploy: function(part) {
      part.counter++;
      var deployedPart = {
        partId : part.id,
        partImg : part.img,
        partType : part.type,
        message : "This is.."
      };
      deployedParts.push(deployedPart);
      return deployedParts;
    },
    getAllDeployed: function(){
      return deployedParts;
    }
  };
});
