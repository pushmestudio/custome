/**
 * @file mainApp.directivesというモジュールの定義。
 * カスタムディレクティブを定義している
 * @copyright (c) 2015 PushMe Studio
 */
angular.module('mainApp.directives', [])

/**
 * @module partDeleteToaster
 * @description undo()を含んだトーストを表示するためのdirective
 */
.directive('partDeleteToaster', [function() {
  return {
    template: 'Deleted.<a class="undo" ng-click="undo()">UNDO</a>'
  };
}])

/**
 * @module draggablePart
 * @description drag可能な要素につける属性を定義したdirective
 */
.directive('draggablePart', function($ionicGesture){
  return {
    restrict: 'A',
    scope: false,
    link: function(scope, elem){
      // おまじない。これをしないとAndroid4.4系でdragイベントが正しく動作しない
      elem.bind('touchstart', function(event){
        event.preventDefault();
      });

      // ドラッグ中はCSSをtransformによって変化させることにより、移動しているように見せる
      $ionicGesture.on('drag', function(event){
        var deltaX = event.gesture.deltaX;
        var deltaY = event.gesture.deltaY;

        // transform3D
        elem.css('transform', 'translate3D(' + String(scope.deployedPart.position.x + deltaX) + 'px, '
                                             + String(scope.deployedPart.position.y + deltaY) + 'px, 1px)');
        elem.css('-webkit-transform', 'translate3D(' + String(scope.deployedPart.position.x + deltaX) + 'px, '
                                                    + String(scope.deployedPart.position.y + deltaY) + 'px, 1px)');
      }, elem);

      // ドラッグを離したら、離した位置にパーツを移動させる
      $ionicGesture.on('release', function(event){
        scope.deployedPart.position.x = scope.deployedPart.position.x + event.gesture.deltaX;
        scope.deployedPart.position.y = scope.deployedPart.position.y + event.gesture.deltaY;
      }, elem);
    }
  };
});
