describe('servicesのテスト', function() {
  var scope;
  beforeEach(module('mainApp.services'));

  describe('Boardsのテスト', function() {
    beforeEach(inject(function(Boards) {
      scope = Boards;
    }));

    it('Boards.all()でテンプレート一覧が取得できる', function() {
      // setup
      var actual = scope.all();
      var expected = [{
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

      // verify
      expect(actual).toEqual(expected);
    });
  });

  // DBに接続する必要のないテストで無駄な接続を発生させないように分離
  describe('Boardsのテスト with DB', function() {
    beforeEach(inject(function(Boards, DBConn) {
      scope = Boards;
      scope.db = DBConn;
    }));

    // TODO scope.db.reset();を読んでちゃんとテスト
    beforeEach(function(done) {
      scope.db.connect().then(function() {
        scope.db.getAll().then(function(data) {
          scope.addAllMyBoards(data);
          done();
        });
      });
    });

    it('getMyBoardsでDBに保存済のボード一覧が取得できる', function() {
      // setup
      var actual = scope.getMyBoards();
      var expected = 1;

      // verify
      expect(actual.length).toEqual(expected);
    });
  });

  describe('Partsのテスト', function() {
    beforeEach(inject(function(Parts) {
      scope = Parts;
    }));

    xit('To Be Added Some Test', function() {
      // setup
      var actual = "";
      var expected = "";

      // verify
      expect(actual).toEqual(expected);
    });
  });
});
