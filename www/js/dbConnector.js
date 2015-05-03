/**
 * @fileOverview mailApp.dbServicesというモジュールの定義。
 * 	DB関連のCRUD処理などを提供する。
 * @refs IndexedDBのAPI https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore
 * @copyright PushMe Studio 2015
 */
angular.module('mainApp.dbConnector', [])
.factory('DBConn', function() {
		var module = this;

		// このモジュールのログ出力を調整する、if(debugMode)のように使う
		module.debugMode = true;

		// このモジュールを通じて使いまわすデータベースのオブジェクト
		module.db = null; 

		// バージョン情報、データベースの初期化の必要性の有無の判断に使う
		module.version = 1;

		// 非同期処理のために使う、q.defer()のようにして呼び出す
		var $injector = angular.injector(['ng']);
		module.q = $injector.get('$q');

		/**
		 * DBへの接続を行う。
		 * 接続に成功したら、変数dbにオブジェクトを格納して使いまわす。
		 * @return {Promise} このメソッドの成否
		 */
		module.connect =  function() {
			var deferred = module.q.defer();

			/*
			 CustoMeDBという名称のDBを開く、なければ作成する
			 module.versionのバージョンがローカルより新しい場合
			 request.onupgradeneededで定義した処理が呼ばれる
			*/
			var request = indexedDB.open('CustoMeDB', module.version);

			if(debugMode) console.debug('this is debug message.'+request);

			request.onupgradeneeded = module.init;
			request.onerror = function(e) {
 		   	deferred.reject('open error');
			};
			request.onsuccess = function(e) {
				db = e.target.result;
				deferred.resolve();
			};
			return deferred.promise;
 		}

		/**
		 * 初回接続時やバージョンアップ時に呼び出され、DBの初期化を行う。
		 * DB初期化処理内では、DB、オブジェクトストア、インデックスの作成を行う。
		 * データ構造を変更した場合には、必ずここも更新すること。
		 * @param {Object} e データベースのオープン要求に対する結果のイベント
		 */
		module.init = function(e) {
			db = e.target.result;
			if(db.objectStoreNames.contains('boards')) {
				db.deleteObjectStore('boards');
			}

			if(debugMode) console.debug('init is called.');

			// オブジェクトストアを作成、Keypathは所謂Primary Key
			var store = db.createObjectStore('boards', {keyPath: 'boardId'});
	
			// データの構造を変更したら、必ずこのIndexも更新すること
			store.createIndex('boardContent', 'boardContent', {unique: false});
			
			module.createSample(store);
		}

		/**
		 * サンプルデータを作成する。
		 * @param store サンプルデータ作成先
		 */
		module.createSample = function(store) {
			if(!store) return;

			var samples = [
				{boardId: '1430626351', boardContent: '{parts:[{"partId":"001"}]}' }
				, {boardId: '1430626354', boardContent: '{parts:[{"partId":"003"}]}' }
			];

			// サンプルデータを一件ずつ追加する
			for(sample of samples) {
				store.add(sample);
			}
		}

		// DBConnとして呼び出し可能(≒public)とするメソッドを下記に定義
		return {
			connect: function(){
				module.connect();
			}		 
		};
	}
);
