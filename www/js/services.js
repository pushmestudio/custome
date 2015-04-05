angular.module('mainApp.services', [])

.factory('Boards', function() {
 
  var boards = [{
    id: 0,
    name: 'タスクボード1',
    lastText: '基本的なボード',
    img: 'http://image.itmedia.co.jp/ait/articles/1112/01/r2005.gif'
  }, {
    id: 1,
    name: 'タスクボード2',
    lastText: 'カレンダー的なボード',
    img: 'http://a413.phobos.apple.com/us/r1000/064/Purple/v4/ac/d5/0c/acd50c87-a6b6-83df-5ffc-7c56e5738a96/mzl.xbrjlmtk.png'
  }, {
    id: 2,
    name: 'タスクボード3',
    lastText: 'その他',
    img: 'https://lh3.ggpht.com/ZWR6MBaSTMeGclP_KF2sBQNoKAUBgbWWbKWbUne4b_SCjYN_3emJWnhTyzgdKoLUzw=w300'
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
});
