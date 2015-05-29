describe('servicesのテスト', function() {
  var scope;
  beforeEach(module('mainApp.services'));

  describe('getのテスト', function() {
    beforeEach(inject(function(Boards) {
      scope = Boards;
    }));

    it('boardId:0のname"タスクボード1"が返る', function() {
      // setup
      var actual = scope.get(0).name;
      var expected = 'タスクボード1';

      // verify
      expect(actual).toEqual(expected);
    });
  });
});
