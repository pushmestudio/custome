describe('Controllersのテスト', function() {
  var scope;
  beforeEach(module('mainApp.controllers'));

  describe('BoardsDetailCtrl', function() {
    var ctrl;
    
    // injectに際し、必要なserviceもinjectする点や$rootScope.$newといったcontroller特有の書き方に注意
    beforeEach(inject(function($controller, $rootScope, Boards, DBConn) {
      scope = $rootScope.$new();

      // 各controller名称及び引数に合わせる
      $controller('BoardsDetailCtrl', {$scope: scope, $stateParams: {boardId: 0}, Boards, DBConn});
    }));

    it('ボード0のlastTextをcontrollerから取得し、小島ボードが返る', function() {
      expect(scope.board.lastText).toEqual('小島ボード1');
    });
  });
  
   describe('SampleCtrl', function() {
    beforeEach(inject(function($controller, $rootScope) {
      scope = $rootScope.$new();

      // 各controller名称及び引数に合わせる
      $controller('SampleCtrl', {$scope: scope});
    }));

    it("サンプルボード呼び出し時設定されるenableFriendsがtrueで返る", function() {
      expect(scope.settings.enableFriends).toBe(true);
    });
  });
});