"require cache.js";

function ClassNameAdapter (_names, _id) {
	var method;

	_names.id = _id;

	for (method in ClassNameAdapter.prototype) {
		if (!ClassNameAdapter.prototype.hasOwnProperty(method)) continue;
		_names[method] = ClassNameAdapter.prototype[method];
	}

	return _names;
}

ClassNameAdapter.prototype = {
	add: function(_name) {
		var el = cache(this);

		if (el) {
			if (this.has(_name)) return this;

			(function(_names, _args) {
				var args = [];

				_args.forEach(function test (_arg) {
					if (!_arg) return;

					var argNames = _arg.split(/\s+/);

					if (argNames.length > 1) {
						argNames.forEach(test);
					} else if (!_names.has(_arg)) {
						args.push(_arg);
					}
				});

				_names.push.apply(_names, args);

			}(this, array(arguments)));

			el.node().className = this;
		} else {
			debugger;
		}

		return this;
	},

	remove: function(_name) {
		var el = cache(this);

		if (el) {
			array.remove.apply(array, [this].concat(array(arguments)));
			el.node().className = this;
		}

		return this;	 
	},

	clear: function() {
		var el = cache(this);
		if (el) el.node().className = "";
		return ClassNameAdapter([], this.id);
	},

	has: function(_name) {
		return !!~this.indexOf(_name);
	},

	toString: function() {
		return this.join(" ").trim();
	}
};

define(ClassNameAdapter);