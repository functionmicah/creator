/**
 * Adds helper functions globally to the Creator scope
 */

define(
	function createID (_pattern) {
		if (!_pattern) _pattern = "xyz";
		
		return _pattern.replace(/[xyz]/g, function(_match) {
			switch (_match) {
				case "x":
					return Math.floor(Math.random() * 10);

				case "y":
					return (Math.floor(Math.random() * 6) + 10).toString(16);

				case "z":
					return Math.floor(Math.random() * 16).toString(16);
			}
		});
	},

	function join() {
		return [].map.call(arguments, function(m) { return m; }).join("");
	},

	(function() {
		var methods = ["indexOf","map", "forEach", "some", "every", "filter", "slice", "splice", "push", "pop", "shift", "unshift"];

		function array (_collection) {
			var step, a;

			if (!_collection) return new Array;
			
			switch (typeof _collection) {
				case "number":
					step = 0;
					a = new Array(_collection);

					while (step < _collection) {
						a[step] = null;
						step+=1;
					}

					return a;
				case "object":
					if (0 in _collection) {
						return Array.prototype.map.call(_collection, function(a) { return a; });
					}
					
					return Object.keys(_collection).map(function(_key) {
						return _collection[_key];
					});
			}
		}

		methods.forEach(function(_name) {
			array[_name] = function(_o) {
				var a = array(arguments).slice(1);
				return Array.prototype[_name].apply(_o, a);
			};
		});

		array.remove = function(_array) {
			var i,
				args = array(arguments).slice(1)
				member = args[0];

			if (args.length === 1) {
				i = this.indexOf(_array, member);
				if (~i) this.splice(_array, i, 1);
			} else {
				(function(_this) {
					args.forEach(function(_member) {
						_this.remove(_array, _member);
					});
				}(this));
			}

			return _array;
		};

		return array;

	}()),

	function typeOf (_object) {
		return {
			is: typeof _object,
			class: _object.constructor.name,
			toString: function() {
				return ["[", this.is, " ",this.class, "]"].join("");
			}
		}
	},

	(function() {
		function string (_thing) {
			if (typeof _thing === "object" && _thing.toString === Object.prototype.toString) {
				return JSON.stringify(_thing);
			}
			return String(_thing);
		}

		define.call(string,
			function join() {
				return array(arguments).map(function(m) { return m; }).join("");
			},

			function capitalize (_s) {
				return string.join(_s.slice(0, 1).toUpperCase(), _s.slice(1));
			},

			function query (_obj) {
				return "?" + Object.keys(_obj).map(function(_key) {
					return [_key, "=", _obj[_key]].join("");
				}).join("&");
			},

			function camel (_s) {
				return string.explode(_s).map(function(_part, _i) {
					return _i ? string.capitalize(_part) : _part;
				}).join("");
			},

			function dash (_s) {
				return string.explode(_s).join("-").toLowerCase();
			},

			function underscore (_s) {
				return string.explode(_s).join("_").toLowerCase();
			},

			function path (_s) {
				return string.explode(_s).join("/").toLowerCase();
			},

			function explode (_s) {
				var s, sep, explosion;

				s = string(_s);
				sep = {
					comma: /\s*,\s*/,
					colon: /\s*:\s*/,
					path: /\s*\/\s*/,
					dash: /\s*-\s*/,
					underscore: /\s*_\s*/,
					camel: /([a-z])([A-Z])/
				};

				Object.keys(sep).some(function(_key) {
					if (sep[_key].test(s)) {
						explosion = (function() {
							switch (_key) {
								case "camel":
									return s.replace(sep.camel, "$1|$2").split("|");

								default:
									return s.split(sep[_key]);
							}
						}());
						
						return true;
					}
				});

				return explosion || [_s];
			}
		);

		string.query.toObject = function(_query) {
			return JSON.parse("{"+_query.slice(_query.indexOf("?")+1)
				.split("&")
				.map(function(_pair) {
					var parts = _pair.split("=");
					return ["\"", parts[0], "\": \"", parts[1], "\""].join("");
				})+"}");
		};

		return string;
	}()),

	function capitalize (_s) {
		return this.join(_s.slice(0, 1).toUpperCase(), _s.slice(1));
	}
);