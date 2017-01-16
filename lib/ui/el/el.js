"require ../../helpers.js";
"require cache.js";
"require ClassNameAdapter.js";

/**
 * Element wrapper
 * @class
 */
function El () {

	var renderQueue, astralDom, extentions,
		TAG_PATTERN;

	/**
	 * @static private
	 */
	function rebuildScopeChain (_el, _parent) {
		var instance = _parent.budWithType(type.of(_el), _el.id),
			currentParent = _el.parent(),
			key;

		cache(_el.id, instance);

		if (currentParent && currentParent.hasOwnProperty(_el.name) && currentParent[_el.name] === _el) {
			delete currentParent[_el.name];
		}

		for (key in _el) {
			if (!_el.hasOwnProperty(key)) continue;
			instance[key] = _el[key];
		}

		_el.find(".el").forEach(function(_child) {
			if (!instance.isPrototypeOf(_child) && El.getClosestScope(_child.node().parentNode) === instance)
				rebuildScopeChain(_child, instance);
		});

		captureRefs(instance);
		if (instance.hasOwnProperty("tags")) instance.tags.render();

		return instance;
	}

	/**
	 * @private
	 */
	function defineElementProperty (_id, _name) {
		var el = cache(_id);

		// if (this.name === "detail" && el.hasOwnProperty("name") && el.name === "template") debugger;

		if ((_name || el.hasOwnProperty("name")) && !this.hasOwnProperty(_name || el.name)) {
			Object.defineProperty(this, _name || el.name, {
				get: function () { return cache(_id); },
				configurable: true
			});
		}

		return el;
	}

	function captureRefs (_el) {
		var node = _el.node();

		if (!_el.hasOwnProperty("tags")) _el.tags = (function(_id) {

			this.el = _id;

			this.push = function(_tag) {
				if (!~this.indexOf(_tag)) return array.push(this, _tag);
			};

			/**
			 * Render El scope tags with scope properties.
			 */
			this.render = function() {
				(function(_tags, _el) {
					requestAnimationFrame(function(_time) {
						_tags.forEach(function(_text) {
							var template = _text.template || (_text.template = _text.textContent);

							_text.textContent = template.replace(TAG_PATTERN, function(_tag) {
								var name = _tag.slice(2, -2),
									member = (function() {
										var o = _el;
										name.split('.').forEach(function(_key) { o = o[_key]; });
										return o;
									}());
								if (typeof member === "function") return member.call(_el);
								return member != null ? member : _tag;
							});
						});
					});
				}(this, cache(this.el)));

				return this;
			};

			return this;

		}.call([], _el.id));

		return new Promise(function(_resolve, _reject) {
			var q;

			q = []

			function dQ (_promise) {
				var i = q.indexOf(_promise);

				if (~i) q.splice(i, 1);
				if (!q.length) _resolve(_el);
			}

			El.walkDown(node, function(_child) {
				var parentEl, promise;

				/* Capture Tags */
				if (_child.nodeType === document.TEXT_NODE) {
					if (TAG_PATTERN.test(_child.textContent) || _child.template) _el.tags.push(_child);
				}
				/* Capture Els */
				else if (_child.nodeType === document.ELEMENT_NODE) {
					if (cache(_child)) {
						defineElementProperty.call(_el, _child.id);
						// do not walk down El node.
						return false;
					} else if (_child.hasAttribute("el")) {
						parentEl = El.getClosestScope(_child);

						if (parentEl === _el) promise = _el.budWithNode(_child).then(function(_instance) {
							defineElementProperty.call(_el, _child.id);
							dQ(promise);
						}, _reject);

						if (promise) q.push(promise);
						// do not walk down El node.
						return false;
					}
				}
			});

			if (!q.length) _resolve(_el);
		});
	}

	function captureMV (_el) {
		var node = _el.node();
		
		// if (_el.view) debugger;
		if (_el.view && _el.window) {
			_el.window.promise.then(function(_win) {
				if (!_win.head[_el.constructor.name]) {
					_win.head.add("link", _el.constructor.name)
						.then(function(_link) {
							var path = _el.view;
							defineElementProperty.call(_el, _link.id, "view");
							return _link.attr({
								rel: "stylesheet",
								type: "text/css",
								href: path
							});
						});
				}
			});
		}

		if (_el.model && !node.childNodes.length) {
			return new Promise(function(_resolve, _reject) {
				if (_el.model.nodeType === document.DOCUMENT_FRAGMENT_NODE) {
					_el.requestRender({ appendChild: [_el.model.cloneNode(true)] }).then(function() { _resolve(_el); });
				} else {
					ajax(_el.model)
						.then(function(_markup) {
							var doc, frag, parser;

							doc = _el.window.doc();
							frag = doc.createDocumentFragment();
							parser = doc.createElement("div");

							parser.innerHTML = _markup;
							array.forEach(parser.childNodes, frag.appendChild.bind(frag));

							_el.model = frag;

							_el.requestRender({ appendChild: [frag.cloneNode(true)] }).then(function() { _resolve(_el); });
						})
						.catch(_reject);
				}
			});
		} else if (!_el.hasOwnProperty("model") && node.childNodes.length) {
			_el.model = _el.window.doc().createDocumentFragment();

			array.forEach(node.childNodes, function(_child) {
				if (_child.nodeType === document.TEXT_NODE && !(/^\s+$/).test(_child.textContent)) return;
				_el.model.appendChild(_child.cloneNode(true));
			});
		}

		return Promise.resolve(_el);
	}

	El.getClosestScope = function(_node) {
		return this.walkUp(_node, function(_parent) {
			if (!_parent.hasAttribute("el")) return _parent.id && cache(_parent);
		});
	};

	El.walkUp = function(_node, _each) {
		var parent = _node,
			match;

		while (parent) {
			if (~[document.DOCUMENT_FRAGMENT_NODE, document.DOCUMENT_NODE].indexOf(parent.nodeType)) break;
			if (typeof _each === "function") match = _each(parent);
			if (match) break;
			parent = parent.parentNode;
		}

		return match;
	};

	El.walkDown = function(_node, _each) {
		var match;

		if (!_node) return;

		return El.walkSiblings(_node.firstChild, function step(_sibling) {

			if (typeof _each === "function") match = _each(_sibling);

			if (_sibling.nodeType === document.ELEMENT_NODE && match !== false) {
				El.walkSiblings(_sibling.firstChild, step);
			}

			return match;
		});
	};

	El.walkSiblings = function(_node, _each) {
		var sibling = _node,
			match;

		while (sibling) {
			if (typeof _each === "function") match = _each(sibling);
			if (match) break;
			sibling = sibling.nextSibling;
		}

		return match;
	};

	El.TAG_PATTERN = TAG_PATTERN = /\{\{.+?\}\}/;

	/* @todo create Queue and ReferencePair Types */
	renderQueue = {
		el: [],
		behaviors: [],

		at: function(_index) {
			return {
				el: this.el[_index], 
				behaviors: this.behaviors[_index]
			};
		},

		has: function(_member) {
			return !!~this.indexOf(_member);
		},

		indexOf: function(_member) {
			var el, behaviors;

			el = this.el.indexOf(_member);
			behaviors = this.behaviors.indexOf(_member);

			if (~el) {
				return el;
			}

			if (~behaviors) {
				return behaviors;
			}

			return -1;
		},

		push: function(_el, _behaviors) {
			this.el.push(_el);
			this.behaviors.push(_behaviors);
			return this;
		},

		length: function() {
			return this.el.length;
		},

		forEach: function(_cb) {
			var q = this;

			this.el.forEach(function(_el, _index) {
				_cb.call(q, q.at(_index), _index);
			});

			return this;
		},
	};

	extentions = {
		appendTo: function(_node) {
			return _node.appendChild(this);
		}
	};

	this.id = null;
	this.name = null;
	this.model = null;
	this.data = null;
	this.view = null;
	this.tags = null;
	this.isReady = false;
	this.promise = null;

	Object.defineProperties(this, {

		elements: {
			get: function() {
				var els = [];

				array.forEach(this.node().children, function(_child) {
					if (_child.id) els.push(cache(_child.id));
				});

				return els;
			}
		},

		elementNodes: {
			get: function() {
				return array(this.node().childNodes);
			},

		}
	});

	this.alloc = function(_id, _scope, _document) {
		var props = {
			id: { value: _id || createID("el-yzzz"), enumerable: true },
			promise: { value: null, writable: true }
		};

		if (_scope) props.scope = { value: _scope }

		Object.defineProperties(this, props);

		cache(this.id, this);

		if (_document) this.doc = function() { return _document; };
		if (!astralDom) astralDom = this.doc().createDocumentFragment();
	};
	
	this.init = function(_node, _name) {
		var node,
			lineage = this.lineage().name.map(string.dash).join(" ");

		if (_name) {
			if (typeof _name !== "string") throw TypeError("Invalid type for '_name' argument. Should be string, found "+typeOf(_name));
			this.name = _name;
		}

		if (_node.nodeType === this.doc().ELEMENT_NODE) {
			node = _node;
		} else if (_node.nodeType === document.DOCUMENT_FRAGMENT_NODE) {
			node = _node.firstElementChild.cloneNode(true);
		} else {
			node = this.doc().createElement(_node || "div");
		}

		if (node.hasAttribute("el")) {
			if (!_name) this.name = node.getAttribute("el").split(/\s*:\s*/)[0];
			node.removeAttribute("el");
		}

		if (node && !node.id) node.id = this.id;

		if (!node.parentNode) {
			astralDom.appendChild(node);
		}

		if (this.hasOwnProperty("name") && !~lineage.indexOf(string.dash(this.name))) {
			this.classes(string.dash(this.name), lineage);
		} else {
			this.classes(lineage);
		}

		return this.promise = captureMV(this)
			.then(captureRefs)
			.then(function(_el) {
				var output;

				Object.defineProperty(_el, "isReady", { value: true });

				_el.classes().add("READY");

				if (_el.tags) _el.tags.render();

				output = _el.ready(_el);
				
				_el.fire("ready");

				return output || _el;
			});
	};

	this.ready = function(_el) { return _el; };

	this.lineage = function() {
		var lineage, proto;

		lineage = {
			name: [],
			type: []
		};

		proto = this.constructor.prototype;

		while (proto) {
			lineage.name.push(proto.constructor.name);
			lineage.type.push(proto.constructor);

			if (proto.constructor === El) break;

			proto = Object.getPrototypeOf(proto);
		}

		return lineage;
	};

	this.budWithType = function(_type) {
		var args, instance, lineage, key;

		if (!_type) throw Error("budWithType() failed. No type provided.");

		args = array.slice(arguments, 1);
		instance = Object.create(this);
		lineage = _type.prototype.lineage();

		lineage.type.reverse();

		lineage.type.forEach(function(_type) {
			var proto = _type.prototype,
				keyDescriptor;

			if (proto.hasOwnProperty("constructor")) {
				Object.defineProperty(instance, "constructor", {
					value: proto.constructor
				});
			}

			for (key in proto) {
				if (!proto.hasOwnProperty(key)) continue;
				keyDescriptor = Object.getOwnPropertyDescriptor(proto,key);

				if (!keyDescriptor.writable) {
					Object.defineProperty(instance, key, keyDescriptor);
					continue;
				}

				instance[key] = proto[key];
			}

			instance = Object.create(instance);
		});

		if (typeof instance.alloc === "function") instance.alloc.apply(instance, args);

		return instance;
	};

	(function() {

		function instantiate (_el, _node, _name, _args) {
			var type = _el.delegate("typeForNode", _node, _name, _args[0]);

			return _el.budWithType.apply(_el, [type || _args[0] || El].concat(_args.slice(1)));
		}

		this.budWithNode = function(_node) {
			var def, name, type, instance;

			def = _node.getAttribute("el").split(/\s*:\s*/);
			name = def[0];

			if (~name.indexOf("/")) {
				type = name;
				name = name.split("/").slice(-1)[0].toLowerCase();
			} else {
				type = def[1];	
			}

			_node.removeAttribute("el");

			if (type && ~type.indexOf("/")) {
				return (function(_el, _path) {

					function request (_resources) {
						return new Promise(function(_resolve, _reject) {
							var ext, q, total, responses;

							q = [];
							responses = {
								html: null,
								css: null,
								js: null
							};

							function dQ (_path) {
								q.splice(q.indexOf(_path), 1);
								if (!q.length) _resolve(responses);
							}

							for (ext in _resources) (function(_ext) {
								if (!_resources.hasOwnProperty(_ext)) return;
								q.push(_ext);

								if (_ext === "js") {
									_el.scope.require(_resources.js).then(
										function(_module) {
											responses.js = _module;
											dQ(_ext);
										},
										function(_error) {
											dQ(_ext);
										}
									);
								} else {
									ajax.get(_resources[_ext]).then(
										function(_response) {
											responses[_ext] = _response;
											dQ(_ext);
										},
										function(_error) {
											dQ(_ext);
										}
									);
								}
							}(ext));

							total = q.length;
						});
					}

					return new Promise(function(_resolve, _reject) {
						var path, file, i, ext, dir, resources;

						path = Path.create(_path);
						file = path.file;
						ext = file.split(".")[1];
						dir = path.directory;
						resources = {
							html: dir+file+".html",
							css:  dir+file+".css",
							js:  dir+file+".js"
						};

						if (~[".html", ".js", ".css"].indexOf(ext)) {
							debugger;
							request(resources).then(function(_responses) {
								// do...
							});
						} else if (!ext) {
							resources = {
								html: require.resolvePath([dir, file, "model.html"], _el.scope),
								js:  require.resolvePath([dir, file, "controller.js"], _el.scope),
								css:  require.resolvePath([dir, file, "view.css"], _el.scope)
							};

							request(resources).then(function(_responses) {
								var ext, initalize, instance, q, total;

								q = Object.keys(_responses);
								total = q.length;

								q.dq = function(_ext) {
									var i = this.indexOf(_ext);

									if (~i) this.splice(i, 1);
									if (!this.length) _resolve(instance);
								};

								for (ext in _responses) {
									if (!_responses.hasOwnProperty(ext)) continue;
									
									switch (ext) {
										case "html":
											_node.innerHTML = _responses.html;
											q.dq("html");
											break;

										case "css":
											if (_el.window && _el.window.head && _responses.css) {
												_el.window.head.add("style").then(function(_style) {
													_style.text(_responses.css).then(function() {
														q.dq("css");
													});
												});
											} else {
												q.dq("css");
											}
											break;

										case "js":
											if (_responses.js) {
												initalize = instantiate(_el, _node, name, [_responses.js[file], null, _responses.js]).init(_node, name);
											} else {
												initalize = instantiate(_el, _node, name, [El, null, _responses.js]).init(_node, name);
											}

											initalize.then(function(_instance) {
												instance = _instance;
												q.dq("js");
											}, _reject);
											break;
									}
								}
							});
						} else {
							_reject("Failed to load resource at path "+_path+". Unexpected file type ["+ext+"].");
						}
					});
				}(this, type));
			}

			if (type && !this.scope[type]) {
				throw ReferenceError(type+" in "+this.scope.$URL.PATH+" is undefined.");
			}

			return instantiate(this, _node, name, [type ? this.scope[type] : El, _node.id]).init(_node, name);
		};
	}).call(this);

	Object.defineProperty(this, "doc", {
		writable: true
	});

	this.doc = function() { return document; };

	this.node = function() {
		return this.doc().getElementById(this.id) || astralDom.getElementById(this.id);
	};
	/**
	 * Central rendering mechanism for DOM changes, batched and piped through requestAnimationFrame for all El instances.
	 * @arg {Object} _domBehaviors - An object with methods to call and properties to set on a DOM node.
	 * @returns Promise - Promise object for the requestAnimationFrame.
	 */
	this.requestRender = function(_domBehaviors) {
		var record;

		if (!renderQueue.length()) {
			this.requestRender.promise = new Promise(function(_resolve, _reject) {
				requestAnimationFrame(function(_time) {
					renderQueue.forEach(function(_record) {
						var method, node, args;

						node = _record.el.node();

						if (typeof _record.behaviors === "function") {
							_record.behaviors.call(el, node);
						}

						for (method in _record.behaviors) {
							if (!_record.behaviors.hasOwnProperty(method)) continue;

							if (typeof node[method] === 'function') {
								args = _record.behaviors[method].slice(0);
								args.some(function(_a, _i) {
									var target = cache(_a);
									
									if (target instanceof El) {
										args[_i] = target.node();
										return true;
									}
								});

								node[method].apply(node, args);	
							} else if (node[method] == null && extentions[method]) {
								extentions[method].apply(node, _record.behaviors[method]);
							} else {
								node[method] = _record.behaviors[method];
							}
						}
					});

					_resolve(renderQueue);

					/* clear queue */
					renderQueue.el = [];
					renderQueue.behaviors = [];
				});
			});
		}

		record = renderQueue.at(renderQueue.indexOf(this));

		if (record.behaviors) {
			Object.keys(_domBehaviors).forEach(function(_name) {
				if (typeof _domBehaviors[_name] === "string") {
					record.behaviors[_name] = _domBehaviors[_name];
					delete _domBehaviors[_name];
				}
			});
		}

		if (Object.keys(_domBehaviors).length) {
			renderQueue.push(this, _domBehaviors);	
		}

		return this.requestRender.promise;
	};

	this.attr = function(_keys, _value) {
		var key;

		if (typeof _keys === "string") {
			if (_value === null) {
				this.requestRender({removeAttribute: [_keys]});
			} else if (_value) {
				this.requestRender({setAttribute: [_keys, _value]});
			}
		} else {
			if (0 in _keys) {
				return (function(el) {
					return _keys.map(function(_key) { return el.attr(_key); });
				}(this));
			} else {
				for (key in _keys) {
					if (!_keys.hasOwnProperty(key)) continue;
					this.attr(key, _keys[key]);
				}
			}
		}

		return this.node().getAttribute(_keys);
	};

	this.classes = (function() {
		return function() {
			var node = this.node(),
				names = ClassNameAdapter(node.className.trim().split(/\s+/), this.id);

			if (arguments.length) names.add.apply(names, arguments);
				
			return names;
		};
	}());

	this.text = function(_value) {
		if (_value != null) return this.requestRender({textContent: _value});
		return this.node().textContent;
	};

	this.html = function(_markup) {
		if (_markup != null) {
			return (function(_el) {
				return _el.requestRender({innerHTML: _markup}).then(function() {
					return captureRefs(_el);
				});
			}(this));
		}

		return this.node().innerHTML;
	};

	this.write = function(_markup) {
		return (function(_el) {
			return _el.budWithType(El).init("div").then(function(_html) {
				return _html.html(_markup).then(function() {
					var children = array(_html.node().childNodes);

					return new Promise(function(_resolve, _reject) {
						var count = children.length;

						function dQ() {
							count -=1;

							if (!count) {
								_resolve(children);
								captureRefs(_el);
								_html.del();
							}
						}

						children.forEach(function(_node) {
							if (cache(_node)) {
								_el.add(_node).then(dQ, _reject);
							} else {
								_el.requestRender({ appendChild:[_node] }).then(dQ, _reject);	
							}
						});
					});
				});
			});
		}(this));
	};

	this.parent = function() {
		return El.getClosestScope(this.node().parentNode);
	};

	this.find = function(_selector) {
		return array(this.node().querySelectorAll(_selector)).map(cache.get).filter(function(_el) {
			return (!_el.hasOwnProperty("name") || _el.name !== "template");
		});
	};

	this.install = function(_path) {
		var path = Path.create([_path, "controller.js"]);
		return (function(el) {
			el.window.head.add("link").then(function(_link) {
				_link.attr({
					rel: "stylesheet",
					type: "text/css",
					href: [_path, "view.css"].join("/")
				});
			});
			return el.scope.require(path)
				.then(function(_scope) {
					var name = path.directory.split("/").slice(-1)[0].toLowerCase();

					return el.budWithType(_scope[name], null, _scope).init(null, name)
						.then(function(_app) {

							return el.add(_app)
						});
				});
		}(this));
	};

	this.add = function(_el, _name_node, _name) {
		var id, node, child, initalize;

		if (_el instanceof El) {
			id = _el.id;
			if (!_el.node()) initalize = [_name_node, _name];
		} else if (_el.prototype instanceof El) {
			id = this.budWithType(_el).id;
			initalize = [_name_node, _name];
		} else if (cache(_el)) {
			id = _el.id || _el;
		} else {
			id = this.budWithType(El).id;
			initalize = [_el, _name_node];
			if (_el.nodeType === document.ELEMENT_NODE) node = _el;
		}

		child = cache(id);

		if (child) {
			if (!this.isPrototypeOf(child)) {
				child = rebuildScopeChain(child, this);
			}

			return (function(_el) {
				function render () {
					return _el.requestRender({appendChild: [node || id]}).then(function() {
						return defineElementProperty.call(_el, id);
					});
				}

				if (initalize) {
					return child.init.apply(child, initalize).then(render);
				}
				
				if (child.hasOwnProperty("tags")) child.tags.render();

				return render();
			}(this));
		}

		return Promise.reject("No El instance found for id "+id);
	};

	this.addTo = function(_el) {
		var scope, el;
		if (_el.nodeType === document.ELEMENT_NODE) {
			scope = El.getClosestScope(_el);
			return rebuildScopeChain(this, scope).requestRender({ appendTo: [_el] });
		} else if (_el instanceof El) {
			el = _el;
		} else {
			el = cache(_el);
		}

		return el.add(this);
	};

	this.remove = function() {
		astralDom.appendChild(this.node());

		return this;
	};

	this.del = function() {
		var node = this.node();
		node.parentNode.removeChild(node);
		return cache.del(this);
	};

	this.delegate = function(_method, _fn) {
		var args = [].map.call(arguments, function(_a) {return _a}).slice(1);

		if (typeof this[_method] === "function") return this[_method].apply(this, args);
		if (typeof _fn === 'function') this[_method] = _fn;
	};

	this.setPointer = function(_obj, _name) {
		defineElementProperty.call(_obj, this.id, _name);
		return this;
	};

	this.watch = function(_eventName, _handler, _capture) {
		var el, node;

		el = this;
		node = this.node();

		if (node) {
			node.addEventListener(_eventName, this.watch.handler , _capture || false);

			if (!node.watching) node.watching = {};
			if (!node.watching[_eventName]) node.watching[_eventName] = [];

			node.watching[_eventName].push(_handler);
		}

		return this;
	};

	this.watch.handler = function(_event) {
		var el, should, will, did, handlers, event, pvtDefault;

		el = cache(_event.currentTarget);
		should = join("should", string.capitalize(_event.type));
		will = join("will", string.capitalize(_event.type));
		did = join("did", string.capitalize(_event.type));
		handlers = _event.currentTarget.watching[_event.type];
		event = {
			name: _event.type,
			sender: cache(_event.target) || El.getClosestScope(_event.target),
			reciver: el,
			node: _event.target,
			keyCode: _event.keyCode,
			data: _event.detail
		};

		if (el.delegate(should, _event) !== false) {
			el.delegate(will, _event);
			pvtDefault = handlers.some(function(_h) { return _h.call(el, event) === false; });
			el.delegate(did, _event);

			if (pvtDefault) {
				_event.preventDefault();
				_event.stopImmediatePropagation();
			}
		}
	};

	this.fire = function(_event, _detail) {
		var node = this.node(),
			event = new CustomEvent(_event, { bubbles: true, detail: _detail });

		node.dispatchEvent(event);

		return event;
	};

	this.load = function(_path) {
		return (function(_el) {
			return ajax.get(_path).then(function(_markup) {
				_el.write(_markup);
			});
		}(this));
	};

	this.toHTML = function() {
		return this.node().outerHTML;
	};

	this.toTemplate = (function() {
		function walk (_node, _deep, _firstNode) {
			var clone = markup(_node, _firstNode), siblings;

			siblings = [];

			if (_deep) {
				El.walkSiblings(_node.firstChild, function(_sibling) {
					var el;

					if (_sibling.nodeType === document.TEXT_NODE) {
						clone.appendChild(document.createTextNode(_sibling.template || _sibling.textContent));
					} else if (el = cache(_sibling)) {
						clone.appendChild(el.toTemplate(_deep, _firstNode));
					} else {
						clone.appendChild(walk(_sibling, _deep));
					}
				});
			}

			// clone.splice(1, 0, siblings.join(""));

			return clone; /*.join("");*/
		}

		function markup (_node, _firstNode) {
			var el, name, type, attr, clone;

			el = cache(_node);
			clone = _node.cloneNode();
			// clone.textContent = "-!-";

			if (el) {
				clone.removeAttribute("id");
				clone.removeAttribute("class");

				name = _firstNode && el.name === "template" ? "" : el.name;
				type = el.constructor !== El ? (el.constructor.__require_path__ || el.constructor.name) : "";
				attr = [];

				if (name) attr.push(name);
				if (type) {
					if (!name) attr.push(name);
					attr.push(type);
				}

				if (attr.length) clone.setAttribute("el", attr.join(":"));
			}

			return clone; /*.outerHTML.split("-!-");*/
		}

		return function(_deep, _firstNode) {
			return walk(this.node(), _deep, _firstNode == null);
		};
	}());

}

define(
	{
		ElDelegate: {
			/* @todo pipe in node name type maping */
			typeForNode: function(_node, _name, _defaultType) {
				return _defaultType || El;
			}
		}
	},

	Scope.extend(El)
);