/**
 * Converts constructor functions into Object Type Pointers 
 */
var type = (function(){

	var rootType;

	function init (_construct) {
		var supertype, constructPropConfig;

		supertype = (this === window) ? rootType : this;
		constructPropConfig = {constructor: { value: _construct }};

		_construct.define = function(){ return define(this, arguments) };
		_construct.define({ create, extend });

		_construct.apply(_construct.prototype = Object.create(supertype, constructPropConfig));

		return _construct;
	}

	function create () {
		var instance = Object.create(this.prototype);

		if (typeof instance.alloc === "function") instance.alloc.apply(instance, arguments);

		return instance;
	}

	function extend () {
		return type.apply(this.prototype, arguments);
	}

	function define (_scope, _package) {
		[].forEach.call(_package, function(_arg) {
			var member;
			if (typeof _arg === "function" && _arg.name) {
				_scope[_arg.name] = _arg;
			} else if (0 in _arg) {
				define(_scope, _arg);
			} else {
				for (member in _arg) {
					if (!_arg.hasOwnProperty(member)) continue;
					_scope[member] = _arg[member];
				}
			}
		});

		return _scope;
	}

	function type (_construct) {
		var ctx = this;

		if (arguments.length === 1) return init.call(ctx, _construct);

		return [].map.call(arguments, function(_c) {
			return init.call(ctx, _c);
		});
	}

	type.of = function(_instance) {
		return _instance.constructor;
	};

	function Type () {

		function findOwner (_name, _obj) {
			var pointer, proto;

			pointer = _obj[_name];
			proto = _obj;

			if (pointer) {
				while (!proto.hasOwnProperty(_name)) {
					proto = Object.getPrototypeOf(proto);
				}
			}

			return proto[_name] === pointer ? proto : null;
		}

		this.define = function() {
			return define(this, arguments);
		};

		this.define.record = function PropertyDescriptor (_value, _enum, _write, _config) {
			this.value = _value;
			this.enumerable = _enum || false;
			this.writable = _write || false;
			this.configurable = _config || false;
		};

		this.sup = function(_fn, _args) {
			var owner, proto, method;

			owner = findOwner(_fn, this);
			proto = Object.getPrototypeOf(owner.constructor.prototype);
			method = proto[_fn];

			if (method) return _args != null && (typeof method === "function") ? method.apply(this, _args) : method;
		};

		this.proto = function(_fn, _args) {
			var owner, proto;

			owner = findOwner(_fn, this);

			if (owner !== this) {
				proto = Object.getPrototypeOf(owner);
				return _args != null && (typeof proto[_fn] === "function") ? proto[_fn].apply(this, _args) : proto[_fn];
			}
		};

		this.typeOwns = function(_name) {
			return this.constructor.prototype.hasOwnProperty(_name);
		};

		this.instantiate = function() { return create.apply({prototype: this}, arguments); };

		this.clone = function(_args) {
			var m, shell;

			shell = this.constructor.create.apply(this.constructor, _args);

			for (m in this) {
				if (!this.hasOwnProperty(m)) continue;
				shell[m] = this[m];
			}
		};

		this.toString = function() {
			return "[type "+this.constructor.name+"]";
		};
	}

	rootType = type.call(Object.prototype, Type).prototype;

	return type;
}());

function Path () {

	Path.TYPE_LOCAL = 1;
	Path.TYPE_ROOT = 2;
	Path.TYPE_BACKTRACE = 3;

	this.define(
	{
		type: null,
		names: null,
		directory: null,
		file: null,
		extention: null,
		appName: null,
		length: 0
	},

	function alloc (_path) {
		var backsteps, dirParts, dirNames, dirTruncated;

		if (!(_path && _path.length)) return;

		if (typeof _path !== "string") {
			_path = _path.join("/");
		}
		
		(function(p) {
			_path.split(/\s*:\s*/).forEach(function(_part, _i, _parts) {
				if (_parts.length === 1 || _i === 1) {
					p.names = _part.split("/");
				} else {
					p.appName = _part;
				}
			});
		}(this));

		backsteps = [];
		this.file = this.names.slice(-1)[0];

		if (~this.file.indexOf(".")) this.extention = this.file.slice(this.file.lastIndexOf(".")+1);

		/* filter out empty paths, store back references */
		this.names = this.names.filter(function(_dir, _i, _n) {
			if (_dir === "..") backsteps.push(_dir);
			return _i ? (_i < _n.length-1 ? _dir : true) : true;
		});

		this.length = this.names.length;
		this.directory = this.names.slice(0, -1).join("/");

		if (backsteps.length) {

			dirParts = this.directory.split(/(?:\/?\.\.\/?)+/);
			if (dirParts[0]) {
				dirNames = dirParts[0].split("/");
				
				if (backsteps.length > dirNames.length) debugger;

				dirParts = dirParts.filter(function(_part) {
					return _part;
				});
				
				dirTruncated = dirNames.slice(0, -backsteps.length).concat(dirParts.slice(1));
				this.directory = dirTruncated.join("/");
				(this.names = this.directory.split("/")).push(this.file);
			}
		}

		switch (this.names[0]) {
			case "":
				this.type = Path.TYPE_ROOT;
				break;

			case ".":
				this.type = Path.TYPE_LOCAL;
				break;

			case "..":
				this.type = Path.TYPE_BACKTRACE;
		}
	},

	function indexOf (_member) {
		return this.names.indexOf(_member);
	},

	function split (_sep) {
		return this.toString().split(_sep);
	},

	function has (_member) {
		return !!~this.indexOf(_member);
	},

	function join (_sep) {
		return this.names.join(_sep);
	},

	function toString () {
		return this.names ? this.names.join("/") : "";
	}
)}

function Scope() { this.define({

	URL : null },

	function alloc (_url) {
		if (_url) Object.defineProperty(this, "URL", new this.define.record(Path.create(_url)));
	},

	function eval (_source) {
		return SourcePackage.create(null, _source).parse(this);
	}
)}

function SourcePackage () {

	SourcePackage.define(
		function cache (_path) { return evaluate.module.get(_path); }
	);

	function evaluate (_source) {
		return eval(_source);
	}

	evaluate.module = new (function() {

		var store = {};
		
		this.cache = function(_obj) {
			var m;

			for (m in _obj) {
				if (!_obj.hasOwnProperty(m)) continue;
				store[m] = _obj[m];
			}
		};

		this.get = function(_path) {
			return store[_path];
		};

		this.require = function(_path, _scope) {
			var scope;

			switch (typeof store[_path]) {
				case "function":
					return store[_path] = store[_path].call(_scope.instantiate(Path.create(_path)));

				case "object":
					return store[_path];
			}

			return {};
		};

	});

	this.define(
	{
		path : null,
		source : null,
		dependancies : null
	},

	function alloc (_path, _source) {
		var dependancies, source;
		
		dependancies = [];
		source = _source.replace(/(["'])require (.+?)\1[;\n]*/g, function() {
			var path = Path.create([_path.directory, arguments[2]]);
			// debugger;
			dependancies.push(path);
			return ""; 
		});

		this.path = _path;
		this.dependancies = dependancies;
		this.source = ["(function(){var FILE=this;with(this){", source ,"}return this}.call(Object.create(this)))"].join("");
	},

	function parse (_scope) {
		var scope, pack;

		scope = _scope ? _scope.instantiate(this.path) : Scope.create(this.path);
		pack = evaluate(this.toString());

		return pack.call(scope);
	},

	function toString (_isDeep) {
		var dependancies, script;

		dependancies = this.dependancies.map(function(_path) {
			return ["evaluate.module.require(\"",_path, "\", this)"].join("");
		});

		script = {
			dependancies: dependancies.length ? ["this.define(",dependancies,");"].join("") : "",
			files: !_isDeep ? (function(){
				var files = [];
				
				(function getDeepDependancies () {
					this.forEach(function(_path, _i, _deps) {
						var pack = _deps[_path];

						if (pack && !~files.indexOf(_path)) {
							files.push(["\"", _path, "\":", pack.toString(true)].join(""));
						}

						if (pack && pack.dependancies.length) getDeepDependancies.call(pack.dependancies);
					});
				}).call(this);

				if (files.length) {
					return ["evaluate.module.cache({",files,"}),"].join("");
				}

				return "";
			}.call(this.dependancies)) : ""
		}

		return ["(", script.files, "function(){", script.dependancies, "return ", this.source,"})"].join("");
	}

)}

function AppScope () { this.define({

	URL : Path.create([location.pathname, "index.js"]),
	WINDOW : window },

	function alloc (_url, _window) {
		this.sup("alloc", [_url]);
		
		if (_window) Object.defineProperty(this, "WINDOW", { value: _window });
	},

	function init (_path) {
		return this.require(_path || this.URL).then(function(_scope) {
			_scope.WINDOW[_scope.WINDOW.document.title] = _scope;
			_scope.run();
		});
	},

	function run () {
		// body...
	},

	function log () {
		return console && console.log.apply(console, arguments);
	},

	function alert (_msg) {
		return Promise.resolve(this.WINDOW.alert(_msg));
	},

	function confirm () {
		return Promise.resolve(this.WINDOW.confirm.apply(this.WINDOW, arguments));
	},

	function prompt () {
		return Promise.resolve(this.WINDOW.prompt.apply(this.WINDOW, arguments));
	},

	(function() {

		function ajax (_path, _data) {
			return ajax.get(_path, _data);
		}

		function toURLData (_obj) {
			var pairs = Object.keys(_obj||{}).map(function(_key) {
				return [_key, escape(_obj[_key])].join("=");
			});

			return pairs.length ? pairs.join("&") : "";
		}

		function sendRequest (_type, _path, _data) {
			var xhr = new XMLHttpRequest();
			
			xhr.open(_type, _path, true);

			if (_type === "POST") {
				xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			}

			return new Promise(function (_resolve, _reject) {
				xhr.onload = function (_e) {
					if (xhr.responseText && xhr.status === 200) {
						_resolve(xhr.responseText);
					} else {
						_reject("AjaxError: Failed to load ("+xhr.status+") \""+_path+"\".");
					}

					xhr = xhr.onload = null;
				};
				xhr.send(_data);
			});
		}

		ajax.get = function (_path, _data) {
			return sendRequest("GET", [_path, _data ? "?"+toURLData(_data) : ""].join(""));
		};

		ajax.get.script = function(_path, _cache) {
			var path, cache;

			path = Path.create(_path);
			cache = _cache || {};

			if (cache[path]) return cache[path] instanceof Promise ? cache[path] : Promise.resolve(cache[path]);
			if (SourcePackage.cache(path)) return Promise.resolve(SourcePackage.cache(path));

			return cache[path] = ajax.get(path).then(function(_source) {
				var pack = SourcePackage.create(path, _source);

				if (pack.dependancies.length) {
					return new Promise(function(_resolve, _reject) {
						var q = pack.dependancies.slice();

						q.dq = function(_record) {
							var i = this.indexOf(_record);
							if (~i) this.splice(i, 1);
							if (!this.length) _resolve(pack);
						};

						pack.dependancies.forEach(function(_file, _i) {
							ajax.get.script(_file, cache).then(function(_package) {
								if (_package instanceof SourcePackage) pack.dependancies[_file] = _package;
								q.dq(_file);
							});
						})
					});
				}

				return pack;
			})

			.then(function(_package) {
				if (cache[path] !== _package) cache[path] = _package;
				return _package;
			});
		};

		ajax.get.script.resolvePath = function(_path, _dir) {
			var path, directory;

			path = Path.create(_path);
			directory = Path.create(_dir);

			if (path.type === Path.TYPE_ROOT) {
				path = Path.create([directory.names.slice(2), path]);
			}

			return path;
		};

		ajax.post = function (_path, _data) {
			return sendRequest("POST", _path, toURLData(_data));
		};

		ajax.head = function (_path, _data) {
			return sendRequest("HEAD", _path, _data);
		};

		return ajax;
	}()),

	(function() {

		function dir (_path) {
			// body...
		}

		return dir;
	}()),

	function require (_path) {
		var scope = this;

		return this.ajax.get.script(_path, this.URL.directory).then(function(_source) {
			if (_source instanceof SourcePackage) return _source.parse(scope);
			return _source;
		});
	}
)}

type(Scope, Path, SourcePackage);

Scope.extend(AppScope);

AppScope.create().init();