var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;
var Converter = function(source, events) {
	var self = this;
	// Object ID to instance cache
	// TODO track suites and tests separately
	var objects = {};
	// Function that prints the title
	var titleFn = function() {
		var title = this.title || '';
		if(this.parent) {
			title = this.parent.fullTitle() + ' ' + title;
		}
		return title;
	};
	var updateTotal = function() {
		self.total++;
	};

	this.total = 0;

	events = events || [ 'start', 'suite', 'suite end', 'test', 'pass', 'pending', 'fail', 'test end', 'end' ];
	events.forEach(function (name) {
		source.on(name, function(data) {
			if(data && (data.id !== undefined)) {
				if(!objects[data.id]) {
					objects[data.id] = _.extend({}, self.defaults[name]);
				}
				_.extend(objects[data.id] || {}, data);

				var ref = objects[data.id];
				var error;
				var args = [name, ref];

				ref.fullTitle = ref.fullTitle || titleFn;
				ref.fn = ref.fn || '';

				if(data.parent) {
					ref.parent = objects[data.parent];
				}

				if(data.err) {
					error = new Error(data.err.message);
					error.stack = data.err.stack;
					args.push(error);
				}

				self.emit.apply(self, args);
			}
		});
	});

	source.on('test', updateTotal);
	source.on('pending', updateTotal);
//	source.on('suite', function(suite) {
//		self.suite = objects[data.id];
//	});
}

Converter.prototype = new EventEmitter();
Converter.prototype.defaults = {
	"suite" : {
		title : '',
		root : false,
		pending : false
	},
	"test" : {
		async : false,
		pending : false,
		type : 'test'
	},
	"pass" : {
		duration : 0,
		state : 'passed',
		speed : 'fast'
	},
	"fail" : {
		duration : 0,
		state : 'failed',
		speed : 'fast'
	},
	"pending" : {
		sync : true,
		pending : true,
		type : 'test'
	}
};

module.exports = Converter;