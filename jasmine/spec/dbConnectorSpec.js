describe('dbConnectorのテスト', function() {
  // テスト対象をscopeに入れてテストする
  var scope;

  /* 全テストケースの読み込み前にモジュール定義を読み込む
     ここに記載するmodule名は、読み込み先のangular.module()で定義している名前 */
  beforeEach(module('mainApp.dbConnector'));

  // injectでは、読み込み先のFactoryでの定義名を記載する
  beforeEach(inject(function(DBConn) {  
    scope = DBConn;
  }));
  
  /* connectを読んでから1秒待って、終了とする
     doneは非同期処理が終わり次の処理に移って良い、とする場合に書く
     そのため、非同期処理以外のときは書かない */
  beforeEach(function(done) {
    scope.connect();
    setTimeout(function() {
      done();
    }, 1000);
  });
  
  // ''内の記載項目はテスト群の名前や説明
  describe('実行されるテストケース群(test suiteという))', function() {
    var data;
    // このテストケース群の中の各テストケースの前に実行される
    beforeEach(function(done) {
      scope.load('1430626351000')
      .then(function(loaded){
        data = loaded;
        done();
      });
    });
    
    it('boardId:1430626351000でロードしたboardのpartsの1番目のpartIdで"001"が返る', function() {
      expect(data.boardContent.parts[0].partId).toEqual('001');
    });
    
    // 先頭に'x'をつければ実行しないようにできる
    xit("このテストケースは実行されない", function() {
      console.debug('実行されていませんよね？:)');
    });
  });
  
  // 各テストケースだけでなく、テストケース群にも'x'をつけれる
  xdescribe('実行されないテストケース群', function() {
    it('実行されないテストケース群の中のテストケースは実行されない', function() {
      console.debug('これも勿論実行されていませんよね？')
      expect().not.toBeDefined();
    })
    
    /*
    下記は過去にcontrollers上で実施済みのテスト、既にテストは済んでいるが必要なら↑のテストケースに加える

    // 保存テスト用 //TODO:テスト終了後削除
    var bCont = '{parts:[{"partId":"8887"}]}';
    var bId = '1430626351000';
    DBConn.save(bCont, bId);

    // 読込テスト用 //TODO: テスト終了後削除
    var bId = '1430626357000';
    DBConn.load(bId).then(function(boardData){
      console.debug(boardData);
      // board.htmlで使用できるようにバインドする
      $scope.boardData = boardData;
    });
    
    */

  });
  
});