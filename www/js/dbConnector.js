/**
 * @file mainApp.dbConnectorというモジュールの定義。
 * DB関連のCRUD処理などを提供する。
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore} IndexedDBのAPI
 * @see {@link https://github.com/webcss/angular-indexeddb/blob/master/src/indexeddb.js} 実装に際して参考にしたライブラリ
 * @copyright (c) 2015 PushMe Studio
 */
angular.module('mainApp.dbConnector', ['mainApp.services'])
  /**
   * @module dbConnector.DBConn
   * @description DB接続に関連する内容全てを定義
   * @requires d
   */
  .factory('DBConn', function(d) {
    var module = this;

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
     * @function connect
     * @description DBへの接続を行う。
     * 接続に成功したら、変数dbにオブジェクトを格納して使いまわす。
     * @todo returnの説明が、実質的に何も説明していないので更新を検討 at 12/23 小島
     * @return {Promise} 同期処理を行うためのオブジェクト
     */
    module.connect =  function() {
      d.log('connect is called');
      var deferred = module.q.defer();

      /* CustoMeDBという名称のDBを開く、なければ作成する
         module.versionのバージョンがローカルより新しい場合
         request.onupgradeneededで定義した処理が呼ばれる */
      var request = indexedDB.open('CustoMeDB', module.version);

      request.onupgradeneeded = module.init;
      request.onsuccess = function(event) {
        module.db = event.target.result;
        d.log('connect is finished');
        deferred.resolve();
      };
      request.onerror = function(event) {
        deferred.reject('open error:' + event.message);
      };
      return deferred.promise;
    }

    /**
     * @function init
     * @description 初回接続時やバージョンアップ時に呼び出され、DBの初期化を行う。
     * DB初期化処理内では、DB、オブジェクトストア、インデックスの作成を行う。
     * データ構造を変更した場合には、必ずここも更新すること。
     * @param {Object} event データベースのオープン要求に対する結果のイベント
     */
    module.init = function(event) {
      d.log('init is called.');
      module.db = event.target.result;
      if(module.db.objectStoreNames.contains(module.storeName)) {
        module.db.deleteObjectStore(module.storeName);
      }

      // オブジェクトストアを作成、Keypathは所謂Primary Key
      var store = module.db.createObjectStore(module.storeName, {keyPath: 'boardId'});

      // データの構造を変更したら、必ずこのIndexも更新すること
      // KeyPathの値はIndexを作成せずとも参照可能なので、Indexを作成はKeyPath以外の値で何かを参照したいときのみ
      store.createIndex('boardId', 'boardId', {unique: true});

      module.createSample(store);
    }

    /**
     * @function createSample
     * @description サンプルデータを作成する、初期化時に呼ばれる想定
     * @param store サンプルデータ作成先
     */
    module.createSample = function(store) {
      d.log('createSample is called.');
      if(!store) return;

      var samples = [
        {'boardId': '1430626357000',
         'boardContent': {
          'boardName': 'SampleBoard',
          'boardComment': 'this is a sample',
          'parts': [
            {
              'partId': '0',
              'class': 'sticky-note note-yellow note-normal',
              'type': 'fusen',
              'text': 'Tap "Wand" icon to put parts.',
              'position': {
                'x': 50,
                'y': 50
              }
            },
            {
              'partId': '3',
              'class': 'sticky-note note-blue note-normal',
              'type': 'fusen',
              'text': 'If you like this app, please support us by tapping the Ads.',
              'position': {
                'x': 200,
                'y': 350
              }
            }
          ],
          'wallpaper': 'img/wallpaper/taskboard_virt_blue.png'
          }
        }
      ];

      // サンプルデータを一件ずつ追加する
      samples.forEach(function(entry, i) {
        store.add(entry);
      });
      d.log('finish to create samples.');
    }

    /**
     * @function saveBoardContent
     * @description DBへデータを保存する。boardIdはoptional、未指定の場合は新規作成と見做す。
     * 指定がある場合は、boardIdが同じもののboardContentを上書きするイメージ。
     * @todo returnの説明が、実質的に何も説明していないので更新を検討 at 12/23 小島
     * @param {String} boardContent JSON形式、中にpartsやwallpaperなどを持つ
     * @param [String] boardId 各ボードのPrimary Keyになるunix timestamp
     * @return {Promise} 同期処理を行うためのオブジェクト
     */
    module.saveBoardContent = function(parts, wallpaper, boardId, boardNames) {
      d.log('saveBoardContent is called');
      var updateFlag = true; // 更新か新規作成かを判断するためのフラグ

      if(typeof boardId === 'undefined' || boardId === null) {
        updateFlag = false; // 判定結果として、要新規作成
        console.log("this is null??");
      }

      // boardIdに対応するものがDBに保存されてるかを確認する
      // TODO:boardIdを引数に読み出す処理が出来た際は当該メソッドに置き換える
      if(updateFlag) {
        // DBへの問い合わせ処理を開始するための事前準備
        var trans = module.db.transaction(module.storeName, 'readonly');
        var store = trans.objectStore(module.storeName);
        var deferred = module.q.defer();

        // 名前が一致するデータを取得する
        var range = IDBKeyRange.only(boardId);

        /* onsuccess内でupdateやaddを呼ぶことにより、
           openCursorの処理を同期してからupdateなどができる */
        store.openCursor(range).onsuccess = function(event) {
          var cursor = event.target.result; // 取得結果を得る
          if(cursor) {
            d.log('boardIdと一致するデータあり');
          } else {
            updateFlag = false;
            d.log('boardIdと一致するデータが無いため新規作成');
          }
          d.log('updateFlag:' + updateFlag);
          // updateFlagの内容に応じ、更新あるいは新規作成をする
          if(updateFlag) { // 更新処理
            module.updateBoard(boardId, parts, wallpaper, boardNames).then(function() {
              deferred.resolve();
            });
          } else { // 新規作成
            module.addNewBoard(parts, wallpaper, boardNames).then(function(newBoard) {
              deferred.resolve(newBoard);
            });
          }
        }
      } else {
        // DBを確認するまでもなく新規登録の場合
        module.addNewBoard(parts, wallpaper).then(function(newBoard) {
          deferred.resolve(newBoard);
        });
      }
      return deferred.promise;
    }

    /**
     * @function updateBoard
     * @description オブジェクトストアに登録されている項目を更新する。
     * @todo returnの説明が、実質的に何も説明していないので更新を検討 at 12/23 小島
     * @param {String} boardId アップデート対象のボードのID
     * @param {String} boardContent 更新内容
     * @return {Promise} 同期処理を行うためのオブジェクト
     */
    module.updateBoard = function(boardId, parts, wallpaper, boardNames) {
      d.log('updateBoard is called');

      var trans = module.db.transaction(module.storeName, 'readwrite');
      var store = trans.objectStore(module.storeName);
      var deferred = module.q.defer();

      /*
      (冨田)rangeを使用することで特定の(あるいは特定の範囲の)データのみを絞り込みでき、openCursorは指定された範囲内のデータを全件取得します。
      そのため、下記のコードだと、
        1. オブジェクトストア内で指定されたboardIdをもつレコードを絞り込む
        2. 1で絞り込んだ結果をを全件取得
      となり、若干冗長だと感じたため、直接getする方法にしています。
      var range = IDBKeyRange.only(boardId);
      var index = store.index('boardId');
      index.openCursor(range).onsuccess = function(event) {
      */
      // 名前が一致するデータを取得する
      store.get(boardId).onsuccess = function(event) {
        var data = event.target.result;
        if(data) { // 該当結果がある場合
          data.boardContent.parts = parts;
          data.boardContent.wallpaper = wallpaper;

          // モーダルを使用した更新を実施しない場合、boardNamesは未定義となる
          if(typeof boardNames !== 'undefined' && boardNames.boardName != '' && boardNames.boardComment != ''){
            data.boardContent.boardName = boardNames.boardName;
            data.boardContent.boardComment = boardNames.boardComment;
          }

          var request = store.put(data); // ストアへ更新をかける
          request.onsuccess = function(event) {
            deferred.resolve();
            d.log('更新完了!');
          }
          request.onerror = function(event) {
            deferred.reject('更新途中で失敗!' + event.message);
          }
        } else { // 該当結果がない場合
          d.log('update対象が見つかりません');
        }
      };
      store.get(boardId).onerror = function(event) {
        deferred.reject('request is rejected');
        d.log('update error:' + event.message);
      }
      return deferred.promise;
    }

    /**
     * @function updateBoardNames
     * @description ボード一覧からの呼び出しにより、オブジェクトストアに登録されているボードの名前とコメントを更新する
     * @todo returnの説明が、実質的に何も説明していないので更新を検討 at 12/23 小島
     * @param {String} boardId アップデート対象のボードのID
     * @param {String} boardNames 更新内容
     * @return {Promise} 同期処理を行うためのオブジェクト
     */
    module.updateBoardNames = function(boardId, boardNames) {
      d.log('updateBoardNames is called');
      var trans = module.db.transaction(module.storeName, 'readwrite');
      var store = trans.objectStore(module.storeName);
      var deferred = module.q.defer();

      // 名前が一致するデータを取得する
      store.get(boardId).onsuccess = function(event) {
        var data = event.target.result;
        if(data) { // 該当結果がある場合

          // モーダルを使用した更新を実施しない場合、boardNamesは未定義となる
          if(typeof boardNames !== 'undefined' && boardNames.boardName != ''){
            data.boardContent.boardName = boardNames.boardName;
            data.boardContent.boardComment = boardNames.boardComment;
          }

          var request = store.put(data); // ストアへ更新をかける
          request.onsuccess = function(event) {
            deferred.resolve();
            d.log('更新完了!');
          }
          request.onerror = function(event) {
            deferred.reject('更新途中で失敗!' + event.message);
          }
        } else { // 該当結果がない場合
          d.log('update対象が見つかりません');
        }
      };
      store.get(boardId).onerror = function(event) {
        deferred.reject('request is rejected');
        d.log('update error:' + event.message);
      }
      return deferred.promise;
    }

    /**
     * @function addNewBoard
     * @description 新しくボードを追加する。ボードのidはunixtimeを用いる。
     * @todo returnの説明が、実質的に何も説明していないので更新を検討 at 12/23 小島
     * @param {String} boardContent JSON形式のボードの中身
     * @return {Promise} 同期処理を行うためのオブジェクト
     */
    module.addNewBoard = function(parts, wallpaper, boardNames) {
      d.log('addNewBoard is called');
      var time = '' + Date.now() + ''; // JavascriptのDateでunixtimeを取得し、文字列化
      var newBoard = {boardId: time, boardContent: {boardName: boardNames.boardName, boardComment: boardNames.boardComment,
                      parts: parts, wallpaper: wallpaper}};
      d.log('addNewBoard ID is ' +time);

      var trans = module.db.transaction(module.storeName, 'readwrite');
      var store = trans.objectStore(module.storeName);
      var deferred = module.q.defer();

      var request = store.add(newBoard); // idとcontentから構成したオブジェクトを追加
      request.onsuccess = function(event) {
        deferred.resolve(newBoard);
      };
      request.onerror = function(event) {
        deferred.reject('add request is failed!');
        d.log('addNewBoard失敗: '+ event.message);
      };
      return deferred.promise;
    }

    /**
     * @function loadBoardContent
     * @description オブジェクトストアに登録されている項目を取得する。
     * @todo returnの説明が、実質的に何も説明していないので更新を検討 at 12/23 小島
     * @param {String} boardId boardContentを取得したいボードのID
     * @return {Promise} 同期処理を行うためのオブジェクト
     */
    module.loadBoardContent = function(boardId) {
      d.log("loadBoardContent is called");
      // var boardContents = []; // (冨田)配列として返すことも可能(ユニークな値なので不要だと思うが)
      var trans = module.db.transaction(module.storeName, "readonly");
      var store = trans.objectStore(module.storeName);

      var deferred = module.q.defer();

      // boardIDが一致するデータを取得する
      store.get(boardId).onsuccess = function(event){
        var data = event.target.result;
        if(data){
          deferred.resolve(data);
        } else { // 該当結果がない場合
          d.log('load対象が見つかりません');
          // resolveに空のデータ構造を渡す。⇒結果としてParts.redeployが呼び出されても特に何も行われない。
          deferred.resolve({boardId: '', boardContent: {boardName: '', boardComment: '', parts: [], wallpaper: ''}})
        }
      };

      store.get(boardId).onerror = function(event){
        deferred.reject('request is rejected');
        d.log('load error:' + event.message);
      };
      return deferred.promise;
    }

    /**
     * @function deleteBoard
     * @description オブジェクトストアに登録されているボードを削除する。
     * @todo returnの説明が、実質的に何も説明していないので更新を検討 at 12/23 小島
     * @param {String} boardId 削除したいボードのID
     * @return {Promise} 同期処理を行うためのオブジェクト
     */
    module.deleteBoard = function(boardId) {
      d.log("deleteBoard is called");
      var trans = module.db.transaction(module.storeName, "readwrite");
      var store = trans.objectStore(module.storeName);

      var deferred = module.q.defer();

      // boardIDが一致するデータを削除する
      store.delete(boardId).onsuccess = function(event){
        var data = event.target.result;
       　d.log("delete board");
        deferred.resolve()
      };

      store.delete(boardId).onerror = function(event){
        deferred.reject('request is rejected');
        d.log('delete error:' + event.message);
      };
      return deferred.promise;
    }

    /**
     * @function getAllMyBoards
     * @description オブジェクトストアに登録されているすべてのボードを取得する。
     * @todo returnの説明が、実質的に何も説明していないので更新を検討 at 12/23 小島
     * @return {Promise} 同期処理を行うためのオブジェクト
     */
    module.getAllMyBoards = function() {
      d.log('getAllMyBoards is called');

      var trans = module.db.transaction(module.storeName, 'readonly');
      var store = trans.objectStore(module.storeName);
      var deferred = module.q.defer();

      var myBoards = [];

      store.openCursor().onsuccess = function(event) {
        var data = event.target.result;

        // data.continue()によって、DBからとってきた結果リストのカーソルの位置を
        // 一件ずつ先に進めているイメージ、全部取得が終わるとdata=nullとなりelseへ
        if(data) { // 取得中の場合
          myBoards.push(data.value);
          data.continue();
        } else { // 取得が終わった場合
          d.log('取得が終了しました');
          deferred.resolve(myBoards);
        }
      };
      store.openCursor().onerror = function(event) {
        d.log('取得に失敗しました');
        deferred.reject();
      }
      return deferred.promise;
    }

    /**
     * @function reset
     * @description データベースに作成したオブジェクトストアの中身をクリアする
     */
    module.reset = function() {
      d.log('reset is called');
      var trans = module.db.transaction(module.storeName, 'readwrite');
      var store = trans.objectStore(module.storeName);

      var request = store.clear(); // storeの中身をすべて消す
      request.onsuccess = function(event) {
        d.log(module.storeName + ' is cleaned');
      }
    }

    // DBConnとして呼び出し可能(≒public)とするメソッドを下記に定義
    return {
      connect: function(){
        return module.connect();
      }
      , save: function(parts, wallpaper, boardId, boardNames) {
        return module.saveBoardContent(parts, wallpaper, boardId, boardNames);
      }
      , updateBoardNames: function(boardId, boardNames){
        return module.updateBoardNames(boardId, boardNames);
      }
      , load: function(boardId) {
        return module.loadBoardContent(boardId);
      }
      , delete: function(boardId){
        return module.deleteBoard(boardId);
      }
      , reset: function() {
        module.reset();
      }
      , getAll: function() {
        return module.getAllMyBoards();
      }
    };
  }
);
