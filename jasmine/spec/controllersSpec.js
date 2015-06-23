describe('controllersのテスト', function() {
  var scope;
  beforeEach(module('mainApp.controllers'));

  describe('BoardsDetailCtrlのテスト', function() {
    var ctrl;

    // injectに際し、必要なserviceもinjectする点や$rootScope.$newといったcontroller特有の書き方に注意
    beforeEach(inject(function($controller, $rootScope, Boards, DBConn) {
      scope = $rootScope.$new();

      // 各controller名称及び引数に合わせる
      $controller('BoardsDetailCtrl', {$scope: scope, $stateParams: {boardId: 0}, Boards, DBConn});
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
