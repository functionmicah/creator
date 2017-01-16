window.document.addEventListener("DOMContentLoaded", function() {
	/**
	 * Empty function scope for evaluated scripts.
	 */
	function evaluate () {
		return eval(arguments[0]);
	}

	(function() {
		var f, type;
		/**
		 * Converts constructor functions into Object Type Pointers 
		 */
		type = (function(){

			var rootType;

			function init(_construct) {
				var supertype, constructPropConfig;

				supertype = (~[window, f].indexOf(this)) ? rootType : this;
				constructPropConfig = {constructor: { value: _construct }};

				_construct.create = create;
				_construct.extend = extend;

				_construct.apply(_construct.prototype = Object.create(supertype, constructPropConfig));

				return _construct;
			}

			function create() {
				var instance;

				instance = Object.create(this.prototype);

				if (typeof instance.alloc === "function") instance.alloc.apply(instance, arguments);

				return instance;
			}

			function extend() {
				return type.apply(this.prototype, arguments);
			}

			function type(_construct) {
				var ctx = this;

				if (arguments.length === 1) return init.call(ctx, _construct);

				return [].map.call(arguments, function(_c) {
					return init.call(ctx, _c);
				});
			}

			type.of = function(_instance) {
				return _instance.constructor;
			};

			function Type() {

				function findOwner(_name, _obj) {
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

				this.clone = function(_shell, _args) {
					var m, shell;

					shell = _shell || this.constructor.create.apply(this.constructor, _args);

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

		/**
		 * 
		 */
		function Scope() {

			this.source = null;
			this.name = null;

			this.alloc = function(_obj) {
				var m;

				for (m in _obj) {
					if (!_obj.hasOwnProperty(m)) continue;
					this[m] = _obj[m];
				}
			};

			this.setName = function(_name) {
				this.name = _name;
				Object.defineProperty(this, "app."+_name, { value: this });
			};

			this.define = function define (_package) {
				var scope, member;

				scope = this;

				if (arguments.length === 1) {
					if (_package.hasOwnProperty("name")) {
						this[_package.name] = _package;
					} else if (0 in _package) {
						_package.forEach(function(_member) {
							if (_member.hasOwnProperty("name")) scope[_member.name] = _member;
						});
					} else {
						for (member in _package) {
							if (!_package.hasOwnProperty(member)) continue;
							this[member] = _package[member];
						}
					}
				} else {
					[].forEach.call(arguments, function(_arg) {
						define.call(scope, _arg);
					});
				}
			};
			
			this.defineNode = function(_key, _args) {
				return this[_key] = this.instantiate.apply(this, _args);
			};

			this.execute = function(_source, _asModule) {
				return f.eval(_source || this.source, this, _asModule);
			};

		}

		function Path () {

			Path.TYPE_LOCAL = 1;
			Path.TYPE_ROOT = 2;
			Path.TYPE_BACKTRACE = 3;

			this.type = null;
			this.names = null;
			this.directory = null;
			this.file = null;
			this.extention = null;
			this.appName = null;
			this.length = 0;

			this.alloc = function(_path) {
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

				/* filter out empty paths, store back references */
				this.names = this.names.filter(function(_dir, _i) {
					if (_dir === "..") backsteps.push(_dir);
					return _i ? _dir : true;
				});

				this.length = this.names.length;
				this.directory = this.names.slice(0, -1).join("/");
				this.file = this.names.slice(-1)[0];

				if (~this.file.indexOf(".")) this.extention = this.file.slice(this.file.lastIndexOf("."));

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
						(this.names = dirTruncated).push(this.file);
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
			};

			this.indexOf = function(_member) {
				return this.names.indexOf(_member);
			};

			this.split = function(_sep) {
				return this.toString().split(_sep);
			};

			this.has = function(_member) {
				return !!~this.indexOf(_member);
			};

			this.join = function(_sep) {
				return this.names.join(_sep);
			};

			this.toString = function() {
				return this.names ? this.names.join("/") : "";
			};
		}

		type(Scope, Path);

		f = Scope.create({

			Scope: Scope,
			Path: Path,
			$URL: {
				PATH: "",
				APP: "",
				space_time: ""
			},
			root: null,
			type: type,
			controller: null,

			run: function(_evaluate, _controller) {
				var localPath = Path.create(location.pathname);

				Object.defineProperties(this, {
					__evaluate__: { value: _evaluate || evaluate },
					$URL: {
						value: {
							PATH: Path.create(this.$URL.PATH.file || localPath.file),
							APP: this.$URL.PATH.directory ? Path.create(this.$URL.PATH.directory) : localPath,
							space_time: Path.create("/Creator/space-time.html")
						},
						enumerable: false
					}
				});

				return this.require("index.js").then(function(_module) {
					_module.root = _module;
					_module.controller = _controller;

					if (_module.hasOwnProperty("init") && typeof _module.init === "function") _module.init();
					return _module;
				}, function(_error) {
					document.write(_error);
				});
			},

			log: function() {
				var logEvt = new CustomEvent("terminal-log", { detail: [].map.call(arguments, function(m) {return m}) });
				window.document.dispatchEvent(logEvt);
				console.log.apply(console, arguments);
			},

			eval: function (_source, _scope, _asModule) {
				var source = ["(function(){", "with(this){", _source , "}" ,"return this;}).call(this);"],
					scope = _scope || Object.create(this);

				return this.__evaluate__.call(scope, (_asModule ? source.join("") : source.slice(1,-1).join("")));
			},

			ajax: (function() {

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
					return sendRequest("GET", [_path, "?", toURLData(_data)].join(""));
				};

				ajax.post = function (_path, _data) {
					return sendRequest("POST", _path, toURLData(_data));
				};

				ajax.head = function (_path, _data) {
					return sendRequest("HEAD", _path, _data);
				};

				return ajax;
			}()),
			
			dir: (function() {
				function dir (_path) {
					var path = dir.resolvePath(_path, this);

					return f.ajax("lib/dir.php", _path && {path}).then(function(_data) {
						return JSON.parse(_data);
					});
				}

				dir.resolvePath = function(_path, _scope) {
					var path =  Path.create(_path);

					if (path.type === Path.TYPE_ROOT && path.names[1] === "Creator") {
						path.names.splice(0, 2);
					}

					return path;
				};

				dir.hasFile = function(_path, _file, _scope) {
					return (_scope || f).dir(_path).then(function(_list) {
						return !!~_list.indexOf(_file);
					});
				};

				dir.save = function(_path, _file) {
					var path = dir.resolvePath(_path);

					return f.ajax.post("lib/save.php", {path: path, file: _file});
				};

				return dir;
			}()),

			require: (function() {
				var scopes = {};

				function qLoader (_count) {
					var loaderEvt = new CustomEvent("loader-q", { bubbles: true, detail: _count || 1 });
					window.document.documentElement.dispatchEvent(loaderEvt);
				}

				function progressLoader () {
					var loaderEvt = new CustomEvent("loader-progress");
					window.document.documentElement.dispatchEvent(loaderEvt);
				}
				
				function load (_request) {

					if (scopes[_request.path]) {
						if (scopes[_request.path].promise) {
							return scopes[_request.path].promise.then(function(_request) {
								return _request;
							});
						}

						return Promise.resolve(_request);
					}

					scopes[_request.path] = _request;

					_request.scope.log(" - load "+_request.path, '------------ ');
					qLoader()

					return _request.promise = _request.scope.ajax(_request.path)
						.then(function(_source) {
							// _request.dependancies = (_source.match(/require\((["']).+?\1\)/g) || []).map(function(_s) { return _s.slice(9, -2); });
							_request.dependancies = (_source.match(/(["'])require .+?\1/g)||[]).map(function(_s) { return _s.slice(9, -1); });
							_request.source = _source;

							// console.log("SOURCE "+_request.path, "deps", _request.dependancies);

							if (_request.dependancies.length) {
								return new Promise(function(_resolve, _reject) {
									var q = [];

									q.dq = function(_dep) {
										var i = q.indexOf(_dep);

										if (~i) q.splice(i, 1);
										progressLoader();
										if (!q.length) {
											_resolve(_request);
											progressLoader();
										}
									};

									_request.dependancies.forEach(function(_file) {
										q.push(_file);
										_request.scope.require(_file, _request).then(function(_dependancy) {
											// console.log("-- "+_request.path, "loaded dependancy", _file, _dependancy, q.length);
											_request.scope.define(_dependancy);
											q.dq(_file);;
										}, _reject);
									});
									// console.log("REQUIRE DEPS "+_request.path, ":", q.join(", "))
									qLoader(q.length);
								});
							}

							return _request;
						});
				}

				load.dependancies = function(_source, _path, _scope) {
					// 
				};

				load.dependancies.html = function(_source, _path, _scope) {
					// 
				};

				load.dependancies.css = function(_source, _path, _scope) {
					// 
				};

				load.dependancies.js = function(_source, _path, _scope) {
					// 
				};

				function require (_path, _parent) {
					var request = require.createRequestRecord(_path, this, _parent);

					// console.log("REQUIRE " + _path, "in scope "+this.$URL.PATH);

					return load(request)
						.then(function(_request) {

							if (scopes[_request.path]) {
								if (!scopes[_request.path].promise) return scopes[_request.path];
								return scopes[_request.path] = _request.scope.eval(_request.source, null, true);
							}
						})
						.catch(function(_error) {
							console.error(_error+" in "+request.path);
							return Promise.reject("RequireError: Failed to load "+request.path+".");
						});
				}

				require.createRequestRecord = function(_path, _scope, _parent) {
					var request;

					request = {
						path: require.resolvePath(_path, _parent ? _parent.scope : _scope),
						scope: Object.create(_scope),
						dependancies: null,
						source: null,
						promise: null,
						parent: _parent
					};

					Object.defineProperty(request.scope, "$URL", { value: Object.create(_scope.$URL) });
					request.scope.$URL.PATH = request.path;

					return request;
				};

				require.resolvePath = function(_path, _scope) {
					var path, request, root;

					path = Path.create(_path);

					if (path.appName && _scope["app."+path.appName]) {
						root = _scope["app."+path.appName].$URL.APP;
					} else {
						root = _scope.$URL.APP;
					}

					if (!(path.type === Path.TYPE_ROOT || path.appName) && _scope.$URL.PATH.directory) {
						path = Path.create([_scope.$URL.PATH.directory, path]);
					}

					if (!RegExp("^"+root).test(path)) {
						path = Path.create([root, path]);
					}

					return path;
				};

				return require;
			}()),

			source: new (function() {

				this.init = function init(_doc, _id, _execute) {
					if (_id) _doc.id = _id;

					_doc.className = 'com-fm-app-Source';
					_doc.contentEditable = "true";
					_doc.onkeydown = function (e) {
						if (e.keyCode === 9) {
							e.view.document.execCommand(e.shiftKey ? "outdent" : "indent");
							/** stop propagation and default key behavior */
							return false;
						} else if (e.keyCode === 69 && e.metaKey) {
							(_execute || f.eval)(e.target.textContent);
						}
					};

					_doc.focus();
					document.execCommand('insertParagraph');
				};

			})
		});
	
		return f;

	}()).run(evaluate);
}, false);