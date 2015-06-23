describe('dbConnectorのテスト', function() {
  // テスト対象をscopeに入れてテストする
  var scope;

  /* 全テストケースの読み込み前にモジュール定義を読み込む
     ここに記載するmodule名は、読み込み先のangular.module()で定義している名前 */
  beforeEach(module('mainApp.dbConnector'));

  // injectでは、読み込み先のFactoryでの定義名を記載する
  describe('DBConnのテスト', function() {
    beforeEach(inject(function(DBConn) {
      scope = DBConn;
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
