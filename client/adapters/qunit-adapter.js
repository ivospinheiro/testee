(function (QUnit) {
	var testId = 0;
	var suiteId = 0;
	var parentSuite = null;
	var socket = io.connect();
	var time = function() {
		return new Date().getTime();
	}
	var add = function(type, fn) {
		var old = QUnit[type];
		QUnit[type] = function() {
			console.log(type, parentSuite, suiteId, testId);
			fn.apply(this, arguments);
			return old.apply(QUnit, arguments);
		}
	};

	add('begin', function() {
		var title = document.getElementsByTagName('title')[0] || document.getElementsByTagName('h1')[0];

		socket.emit('start', {
			environment : navigator.userAgent,
			runner : 'QUnit',
			time : time()
		});

		socket.emit('suite', {
			title : title ? title.innerHTML : '',
			root : true,
			pending : false,
			id : (++suiteId)
		});

		parentSuite = suiteId;
	});

	add('moduleStart', function(data) {
		socket.emit('suite', {
			title : data.name,
			root : false,
			pending : false,
			parent : parentSuite,
			id : (++suiteId)
		});
		parentSuite = suiteId;
	});

	add('moduleDone', function(data) {
		socket.emit('suite end', {
			failed : data.failed,
			total : data.total,
			id : suiteId
		});
		(--parentSuite);
	});

	add('testStart', function(data) {
		socket.emit('suite', {
			title : data.name,
			root : false,
			pending : false,
			parent : parentSuite,
			id : (++suiteId)
		});
		parentSuite = suiteId;
	});

	add('testDone', function(data) {
		socket.emit('suite end', {
			"id" : suiteId
		});
		(--parentSuite);
	});

	add('log', function(data) {
		socket.emit('test', {
			id : (++testId),
			title : data.message,
			parent : parentSuite
		});

		if(data.result) {
			socket.emit('pass', {
				duration : 0,
				state : 'passed',
				speed : 'fast',
				id : testId
			});
		} else {
			socket.emit('fail', {
				title : data.message,
				error : 'Expected ' + data.expected + ' but was ' + data.actual
			});
		}
		socket.emit('test end', {
			id : testId
		});
	});

	add('done', function(data) {
		socket.emit('end', {

		});
	});
})(QUnit);