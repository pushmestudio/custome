﻿describe('servicesのテスト', function() {
  var scope;
  beforeEach(module('mainApp.services'));

  describe('Boardsのテスト', function() {
    beforeEach(inject(function(Boards) {
      scope = Boards;
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
