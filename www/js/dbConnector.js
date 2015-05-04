/**
 * @fileOverview mainApp.dbConnectorというモジュールの定義。
 * DB関連のCRUD処理などを提供する。
 * @refs IndexedDBのAPI https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore
 * @refs 実装に際して参考にしたライブラリhttps://github.com/webcss/angular-indexeddb/blob/master/src/indexeddb.js
 * @copyright PushMe Studio 2015
 */
angular.module('mainApp.dbConnector', [])
  .factory('DBConn', function() {
    var module = this;

    // このモジュールのログ出力を調整する、module.debug('出力内容')のように使う
    module.debugMode = true;

    // このモジュールを通じて使いまわすデータベースのオブジェクト
    module.db = null;

    // バージョン情報、データベースの初期化の必要性の有無の判断に使う
    module.version = 1;

    // 非同期処理のために使う、q.defer()のようにして呼び出す
    var $injector = angular.injector(['ng']);
    module.q = $injector.get('$q');

    // DBのオブジェクトストアの名前
    module.storeName = 'boards';

    /**
     * DBへの接続を行う。
     * 接続に成功したら、変数dbにオブジェクトを格納して使いまわす。
     * @return {Promise} 同期処理を行うためのオブジェクト
     */
    module.connect =  function() {
      module.debug('connect is called');
      var deferred = module.q.defer();

      /* CustoMeDBという名称のDBを開く、なければ作成する
         module.versionのバージョンがローカルより新しい場合
         request.onupgradeneededで定義した処理が呼ばれる */
      var request = indexedDB.open('CustoMeDB', module.version);

      request.onupgradeneeded = module.init;
      request.onsuccess = function(event) {
        module.db = event.target.result;
        deferred.resolve();
      };
      request.onerror = function(event) {
        deferred.reject('open error:' + event.message);
      };
      return deferred.promise;
    }

    /**
     * 初回接続時やバージョンアップ時に呼び出され、DBの初期化を行う。
     * DB初期化処理内では、DB、オブジェクトストア、インデックスの作成を行う。
     * データ構造を変更した場合には、必ずここも更新すること。
     * @param {Object} event データベースのオープン要求に対する結果のイベント
     */
    module.init = function(event) {
      module.debug('init is called.');
      module.db = event.target.result;
      if(module.db.objectStoreNames.contains(module.storeName)) {
        module.db.deleteObjectStore(module.storeName);
      }

      // オブジェクトストアを作成、Keypathは所謂Primary Key
      // TODO:主キーを単なる数字にした場合にはkeyPathと同じ場所で、
      // autoIncrement: trueの指定ができるがどうするか、要検討
      var store = module.db.createObjectStore(module.storeName, {keyPath: 'boardId'});

      // データの構造を変更したら、必ずこのIndexも更新すること
      store.createIndex('boardId', 'boardId', {unique: true});

      module.createSample(store);
    }

    /**
     * サンプルデータを作成する。
     * @param store サンプルデータ作成先
     */
    module.createSample = function(store) {
      if(!store) return;

      var samples = [
        {boardId: '1430626351000', boardContent: '{parts:[{"partId":"001"}]}'}
        , {boardId: '1430626354000', boardContent: '{parts:[{"partId":"002", "title":"no2"}, {"partId":"003"}]}'}
      ];

      // サンプルデータを一件ずつ追加する
      for(sample of samples) {
        store.add(sample);
        module.debug(sample + 'is added');
      }
    }

    /**
     * DBへデータを保存する。boardIdはoptional、未指定の場合は新規作成と見做す。
     * 指定がある場合は、boardIdが同じもののboardContentを上書きするイメージ。
     * @param {String} boardContent JSON形式、中にpartsやwallpaperなどを持つ
     * @param [String] boardId 各ボードのPrimary Keyになるunix timestamp
     * @return {Promise} 同期処理を行うためのオブジェクト
     */
    module.saveBoardContent = function(boardContent, boardId) {
      module.debug('saveBoardContent is called');
      var updateFlag = true; // 更新か新規作成かを判断するためのフラグ

      if(typeof boardId === 'undefined' || boardId === null) {
        updateFlag = false; // 判定結果として、要新規作成
      }

      // boardIdに対応するものがDBに保存されてるかを確認する
      // TODO:boardIdを引数に読み出す処理が出来た際は当該メソッドに置き換える
      if(updateFlag) {
        // DBへの問い合わせ処理を開始するための事前準備
        var trans = module.db.transaction(module.storeName, 'readonly');
        var store = trans.objectStore(module.storeName);

        // 名前が一致するデータを取得する
        var range = IDBKeyRange.only(boardId);

        /* onsuccess内でupdateやaddを呼ぶことにより、
           openCursorの処理を同期してからupdateなどができる */
        store.openCursor(range).onsuccess = function(event) {
          var cursor = event.target.result; // 取得結果を得る
          if(cursor) {
            module.debug('boardIdと一致するデータあり');
          } else {
            updateFlag = false;
            module.debug('boardIdと一致するデータが無いため新規作成');
          }
          module.debug('updateFlag:' + updateFlag);
          // updateFlagの内容に応じ、更新あるいは新規作成をする
          if(updateFlag) { // 更新処理
            module.updateBoard(boardId, boardContent);
          } else { // 新規作成
            module.addNewBoard(boardContent);
          }
        }
      } else {
        module.addNewBoard(boardContent); // DBを確認するまでもなく新規登録の場合
      }
    }

    /**
     * オブジェクトストアに登録されている項目を更新する。
     * @param {String} boardId アップデート対象のボードのID
     * @param {String} boardContent 更新内容
     * @return {Promise} 同期処理を行うためのオブジェクト
     */
    module.updateBoard = function(boardId, boardContent) {
      module.debug('updateBoard is called');
      var updateBoard = {boardId: boardId, boardContent: boardContent};

      var trans = module.db.transaction(module.storeName, 'readwrite');
      var store = trans.objectStore(module.storeName);
      var deferred = module.q.defer();

      // 名前が一致するデータを取得する
      var range = IDBKeyRange.only(boardId);
      var index = store.index('boardId');
      index.openCursor(range).onsuccess = function(event) {
        var cursor = event.target.result;
        if(cursor) { // 該当結果がある場合
          var request = store.put(updateBoard); // ストアへ更新をかける
          request.onsuccess = function(event) {
            deferred.resolve();
            module.debug('更新完了!');
          }
          request.onerror = function(event) {
            deferred.reject('更新途中で失敗!' + event.message);
          }

        } else { // 該当結果がない場合
          module.debug('update対象が見つかりません');
        }
      };
      index.openCursor(range).onerror = function(event) {
        deferred.reject('request is rejected');
        module.debug('update error:' + event.message);
      }

    }

    /**
     * 新しくボードを追加する。ボードのidはunixtimeを用いる。
     * @param {String} boardContent JSON形式のボードの中身
     * @return {Promise} 同期処理を行うためのオブジェクト
     */
    module.addNewBoard = function(boardContent) {
      module.debug('addNewBoard is called');
      var time = '' +Date.now() +''; // JavascriptのDateでunixtimeを取得し、文字列化
      var newBoard = {boardId: time, boardContent: boardContent};

      var trans = module.db.transaction(module.storeName, 'readwrite');
      var store = trans.objectStore(module.storeName);
      var deferred = module.q.defer();

      var request = store.add(newBoard); // idとcontentから構成したオブジェクトを追加
      request.onsuccess = function(event) {
        deferred.resolve();
      };
      request.onerror = function(event) {
        deferred.reject('add request is failed!');
        module.debug('addNewBoard失敗: '+ event.message);
      };
      return deferred.promise;
    }

    /**
     * データベースに作成したオブジェクトストアを削除する
     * onupgradeneeded = module.deleteStoreのように指定して使う
     * IDBの仕様上、onup...のコールバック内でしかdeleteできないので注意
     */
    module.reset = function() {
      module.debug('reset is called');
      var trans = module.db.transaction(module.storeName, 'readwrite');
      var store = trans.objectStore(module.storeName);

      var request = store.clear(); // storeの中身をすべて消す
      request.onsuccess = function(event) {
        module.debug(module.storeName + ' is cleaned');
      }
    }

    /**
     * debugMode ON時にログを出力させる
     * @param {String} ログとして出力させたい内容
     */
     // TODO:暫定版なので、今後の仕様/使用については要検討
    module.debug = function(output) {
      if(module.debugMode) {
        console.debug('[d] ' + output);
      }
    }

    // DBConnとして呼び出し可能(≒public)とするメソッドを下記に定義
    return {
      connect: function(){
        module.connect();
      }
      , save: function(boardContent, boardId) {
        module.saveBoardContent(boardContent, boardId);
      }
      , reset: function() {
        module.reset();
      }
    };
  }
);
