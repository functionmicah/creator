"require ../helpers.js";
"require delegate.js";
"require cache.js";

var TAG_PATTERN, htmlParser, astralDom;

function captureReferences (_el, _detail) {
	if (_detail && _detail.attrs.length) {
		return captureReferences
			.attrs(_detail.attrs, _el)
			.then(captureReferences.nodes);
	}

	return captureReferences.nodes(_el);
}

captureReferences.nodes = function(_el) {
	return new Promise(function(_resolve, _reject) {
		var nodes, q;

		node = _el.node();
		(q = []).dq = function(_promise) {
			var i = q.indexOf(_promise);
			if (~i) q.splice(i, 1);
			if (!q.length) _resolve(_el);
		};

		El.walkDown(node, function(_child) {
			var parentEl, promise;

			/* Capture Tags */
			if (_child.nodeType === document.TEXT_NODE) {
				if (TAG_PATTERN.test(_child.textContent) || _child.template) {
					if (!_el.hasOwnProperty("tags")) _el.tags = [];
					_el.tags.push.apply(_el.tags, captureReferences.tag(_child));
				}
			}
			/* Capture Els */
			else if (_child.nodeType === document.ELEMENT_NODE) {
				if (cache(_child)) {
					cache.definePointer(_el, _child);
					/* do not walk down El node. */
					return false;
				} else if (_child.hasAttribute("el")) {
					parentEl = El.getClosestScope(_child);

					if (parentEl === _el) {
						promise = _el.delegate("injectModel", [_el, _child]).then(function() {
							return El.createWithNode(_child, _el).then(function(_instance) {
								cache.definePointer(_el, _instance);
								q.dq(promise);
							}, _reject);
						});
					}

					if (promise) q.push(promise);
					/* do not walk down El node. */
					return false;
				}
			}
		});

		if (_el.hasOwnProperty("tags")) {
			_el.tags.forEach(function(_tag) {
				var collection = _el.tags[_tag.label] || [];

				if (_tag.label in _el.tags) {
					if (collection.push) {
						collection.push(_tag);
					}
					else {
						if (collection.nodeType === document.TEXT_NODE) {
							collection = [collection];
						}

						Object.defineProperty(_el.tags, _tag.label, {
							set: function(_value) {
								collection.forEach(function(_text) {
									_el.delegate("el_renderTag", [_el, _tag, _value, _text]);
								});
							},

							get: function() {
								return collection;
							},

						});
					}
				}
				else {
					Object.defineProperty(_el.tags, _tag.label, {
						set: function(_value) {
							_el.delegate("el_renderTag", [_el, _tag, _value, _tag]);
						},

						get: function() {
							return _tag;
						},

					});
				}
			});
		}

		if (!q.length) _resolve(_el);
	});
};

captureReferences.attrs = function(_attributes, _el) {
	return new Promise(function(_resolve, _reject) {
		var node, q;
		
		node = _el.node();
		(q = []).dq = function(_promise) {
			var i = q.indexOf(_promise);
			if (~i) q.splice(i, 1);
			if (!q.length) _resolve(_el);
		};

		_attributes.forEach(function(_name) {
			var value, promise;

			value = node.getAttribute(_name);
			promise = _el.delegate("resolveAttribute", [_el, _name, value]);

			if (promise instanceof Promise) {
				q.push(promise);
				promise.then(function() { q.dq(promise); });
			}
		});

		if (!q.length) _resolve(_el);
	});
};

captureReferences.tag = function(_text) {
	var tags, words, string;

	tags = _text.textContent.match(TAG_PATTERN);
	words = _text.textContent.split(TAG_PATTERN).filter(function(_word) { return !!_word; });
	string = WINDOW.document.createDocumentFragment();

	words.forEach(function(_word, _i) {
		string.appendChild(WINDOW.document.createTextNode(_word));

		if (tags[_i]) {
			string.appendChild(tags[_i] = WINDOW.document.createTextNode(tags[_i]));

			tags[_i].template = tags[_i].textContent;
			tags[_i].label = tags[_i].textContent.slice(2, -2);
		}
		
	});

	if (words.length) {
		_text.parentNode.replaceChild(string, _text);
	}
	else if (tags.length) {
		if (tags.length > 1) {
			tags.forEach(function(_tag, _i) {
				var word = _text.slice(2,-2);

				string.appendChild(tags[_i] = WINDOW.document.createTextNode(word));

				tags[_i].template = tags[_i].textContent;
				tags[_i].label = word;
			});

			_text.parentNode.replaceChild(string, _text);
		}
		else {
			tags[0] = _text;
			_text.template = _text.textContent;
			_text.label = _text.textContent.slice(2, -2);
		}
	}

	return tags;
};

/**
 * Element node scope pototype
 * @class 
 * @extends Scope
 */
function El () { 
	/* define satatic members */
	El.define(

		{
			Delegate: ElDelegate
		},

		function get (_id) {
			return cache(_id);
		},

		new (function() {
			var scopes = {};

			this.nodePosition = function(_node) {
				var p = {
					x: _node.offsetLeft,
					y: _node.offsetTop
				};

				El.walkUp(_node.parentNode, function(_ancestor) {
					p.x += _ancestor.offsetLeft;
					p.y += _ancestor.offsetTop;
				});

				return p;
			};

			this.nodeDetails = function(_node) {
				var detail = {
					attrs: [],
					name: null,
					path: null,
					typeName: null,
					assets: null
				};

				Object.defineProperty(detail, "type", {
					get: El.nodeDetails.type,
					enumerable: true
				});

				array.forEach(_node.attributes, function(_attr) {
					var el;

					if (_attr.name === "el") {
						el = _attr.value.split(/\s*:\s*/);
						detail.name = el[0];
						detail.typeName = el[1];

						if (~detail.name.indexOf("/")) {
							detail.path = Path.create(detail.name);
							detail.typeName = El.nodeDetails.typeName(detail.path);
							detail.name = string.uncapitalize(detail.typeName);
						}
						else if (!detail.typeName) {
							detail.typeName = string.capitalize(string.camel(_node.nodeName.toLowerCase()));
						}
						else if (~detail.typeName.indexOf("/")) {
							detail.path = Path.create(detail.typeName);
							detail.typeName = El.nodeDetails.typeName(detail.path);
						}
					} else {
						detail.attrs.push(_attr.name);
					}
				});

				return detail;
			};

			this.nodeDetails.type = function(_detail) {
				var detail, type;

				detail = _detail||this;

				if (!detail.path) return FILE[detail.typeName];
				return (SourcePackage.cache(detail.path)||FILE)[detail.typeName];
			};

			this.nodeDetails.typeName = function(_path) {
				if (_path.extention) return _path.directory.slice(_path.directory.lastIndexOf("/")+1);
				return _path.file;
			};

			this.loadNodeType = function(_node, _parentEl) {
				var typeRecord = this.nodeDetails(_node);

				if (!typeRecord.path) return Promise.resolve(typeRecord);
				if (_parentEl) typeRecord.path = Path.create([_parentEl.scope.URL.directory, typeRecord.path]);

				return new Promise(function(_resolve, _reject) {
					var path, directory, assets, q;

					path = typeRecord.path;
					directory = path.extention ? path.directory : path.toString();
					assets = {
						"controller.js": null,
						"model.html": null,
						"view.css": null
					};

					if (path.extention) assets[path.file] = path;

					(q = Object.keys(assets)).dq = function(_file) {
						var i = q.indexOf(_file);
						if (~i) q.splice(i, 1);
						if (!q.length) _resolve(typeRecord);
					};

					typeRecord.assets = assets;

					q.forEach(function(_file) {
						var asset, cssLink;

						function setScope (_scope) {
							if (!scopes[asset]) scopes[asset] = _scope;
							assets[_file] = _scope;
							q.dq(_file);
						}

						asset = assets[_file] || Path.create([directory, _file]);

						switch (_file) {
							case "controller.js":
								scopes[asset] ?
									setScope(scopes[asset]) :
									(_parentEl && _parentEl.scope || FILE).require(asset).then(setScope, _reject);
								break;

							case "view.css":
								cssLink = WINDOW.document.createElement("link");
								cssLink.rel = "stylesheet";
								cssLink.type = "text/css";
								cssLink.href = asset;

								WINDOW.document.head.appendChild(cssLink);
								q.dq(_file);
								break;

							default:
								ajax(asset).then(function(_source) {
									if (_file === "model.html") _node.innerHTML = _source;
									assets[_file] = _source;
									q.dq(_file);
								}, _reject);
						}
					});
				});
			};
		}),

		function createWithNode (_node, _parent, _scope) {
			return this.loadNodeType(_node, _parent).then(function(_detail) {
				var scope, NodeType;

				scope = _scope || (_detail.assets||{})["controller.js"] || (_parent && _parent.scope);
				NodeType = _detail.type || scope[_detail.typeName] || FILE[_detail.typeName];

				if (_parent) {
					/*if (!NodeType) {
						return _parent.instantiate(null, scope !== _parent.scope && scope).init(_detail.name, _node);
					}*/
					return _parent.instantiateWithType(NodeType||El, null, scope !== _parent.scope && scope).init(_detail.name, _node);
				}

				if (!NodeType) return Promise.reject("No type for node \""+_node.getAttribute("el")+"\".");

				return NodeType.create(null, _scope || _detail.assets["controller.js"]).init(_detail.name, _node);
			});
		},

		function getClosestScope (_node) {
			return this.walkUp(_node, function(_parent) {
				return _parent.id && cache(_parent);
			});
		},

		function walkUp (_node, _each) {
			var parent = _node,
				match;

			while (parent) {
				if (~[document.DOCUMENT_FRAGMENT_NODE, document.DOCUMENT_NODE].indexOf(parent.nodeType)) break;
				if (typeof _each === "function") match = _each(parent);
				if (match) break;
				parent = parent.parentNode;
			}

			return match;
		},

		function walkDown (_node, _each) {
			var match;

			if (!_node) return;

			return El.walkSiblings(_node.firstChild, function step(_sibling) {

				if (typeof _each === "function") match = _each(_sibling);

				if (_sibling.nodeType === document.ELEMENT_NODE && match !== false) {
					El.walkSiblings(_sibling.firstChild, step);
				}

				return match;
			});
		},

		function walkSiblings (_node, _each) {
			var sibling, match, next;

			sibling = _node;

			while (sibling) {
				next = sibling.nextSibling;
				if (typeof _each === "function") match = _each(sibling);
				if (match) break;

				sibling = next;
			}

			return match;
		}
	);

	/* define prototype members */
	this.define
	(
	/* Adapt to delegate duck type */
	ElDelegate,

	{
		id: null,
		name: null,
		nodeName: "div",
		template: null,
		injection: null,
		data: null,
		ready: null,
		scope: null,
		tags: null,
		isNodeTypeEnforced: false,
		isReady: false
	},

	(function() {

		function alloc (_id, _scope) {
			Object.defineProperties(this, new alloc.properties(_id, _scope));
			cache(this.id, this);
		}

		alloc.properties = function (_id, _scope) {
			/* value, enumerable, writable, configurable */
			this.id = new define.record(_id || createId("zzzzzz"));
			this.ready = new define.record(null, false, true);

			if (_scope) this.scope = new define.record(_scope);
		};

		return alloc;
	}()),

	function instantiateWithType (_type) {
		var args, instance, lineage, key;

		if (!_type) throw Error("instantiateWithType() failed. No type provided.");

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
	},

	function init (_name, _node) {
		var node, detail, name, model, lineage;
		
		lineage = this.lineage().name.map(string.dash);

		if (_node) {
			if (_node.nodeType = document.ELEMENT_NODE) {
				node = this.delegate("shouldInitNode", [_node]);
			}
			else if (typeof _node === "string") {
				node = WINDOW.document.createElement(_node);
			}	
		}
		else if (!(node = this.node())) {
			node = WINDOW.document.createElement(this.nodeName || this.constructor.name);
		}

		if (!node) return Promise.reject("Unable to initialize element without a node.");
		if (!node.id) node.id = "el-"+this.id;
		
		detail = El.nodeDetails(node);
		name = _name || detail.name;

		if (name) this.name = string.camel(string.dash(name).toLowerCase());

		if (this.hasOwnProperty("name")) lineage.unshift(this.name);

		this.template = node.outerHTML;
		// model.id = "model-"+this.id;

		if (!node.parentNode) astralDom.appendChild(node);
		// astralDom.appendChild(model);

		return this.ready = captureReferences(this, detail)
			.then(function(_el) {
				_el.node().removeAttribute("el");

				return _el.classes(lineage)
					.then(function() {
						return _el.delegate("initialize", []);
					})
					.then(function() {
						return _el.delegate("build", []);
					})
					.then(function() {
						_el.isReady = true;
						return _el.classes("READY");
					});
			});
	},

	function shouldInitNode (_node) {
		var replacment;

		if (this.isNodeTypeEnforced) {
			replacment = WINDOW.document.createElement(this.nodeName);

			if (_node.attributes)
				array.forEach(_node.attributes, function(_attr) {
					replacment.setAttribute(_attr.name, _attr.value);
				});

			El.walkSiblings(_node.firstChild, function(_sibling) {
				replacment.appendChild(_sibling);
			});
			
			if (_node.parentNode) _node.parentNode.replaceChild(replacment, _node);
		}

		return replacment || _node;
	},

	function definePointer (_el, _name) {
		cache.definePointer(this, _el, _name);
		return _el;
	},

	function node (_selector) {
		var node = WINDOW.document.getElementById("el-"+this.id) || astralDom.getElementById("el-"+this.id);

		return node && (_selector ? node.querySelectorAll(_selector) : node);
	},

	function el (_selector) {
		return array
			.filter(this.node(_selector), function(_node) {
				return !!_node.id;
			})
			.map(function(_node) {
				return cache(_node);
			});
	},

	function model () {
		htmlParser.innerHTML = this.template;
		return htmlParser.firstElementChild;
	},

	function parent () {
		return El.getClosestScope(this.node().parentNode);
	},

	function has (_el) {
		return !!this.node().querySelector("#el-"+(_el.id || _el));
	},

	function els () {
		var record = {};

		El.walkDown(this.node(), function(_child) {
			var el;

			if (_child.id) {
				el = cache(_child);

				cache.definePointer(record, el);
				Object.defineProperty(record, el.name, {enumerable: true});
				/* dont walk down el */
				return false;
			}
		});

		return record;
	},

	function text (_value) {
		return this.render({ textContent: _value });
	},

	(function() {
		var RR, registry;

		RR = new (function RenderRegistry () {
			this.promise = null;

			this.create = function() {
				return Object.create(this);
			};

			this.Q = function(_each) {
				var r, ids;

				r = this;
				ids = Object.keys(this);
				registry = RR.create();

				ids.forEach(function(_id) {
					_each && _each(_id, r[_id]);
				});
			};

			this.add = function(_el, _opName, _opArgs) {
				if (!this[_el.id]) this[_el.id] = [];

				this[_el.id].push([_opName, _opArgs])

				// if (!this[_el.id][_opName]) this[_el.id][_opName] = [];

				// this[_el.id][_opName].push(_opArgs);

				return this.promise;
			};
		});

		registry = RR.create();

		function render (_operations) {
			render.register(this, _operations);

			if (!registry.promise) {
				Object.defineProperty(registry, "promise", new define.record(render.requestFrame()));
			}

			return registry.promise;
		}

		render.register = function(_el, _operations) {
			function add (_op) {
				if (typeof _op === "object") {
					registry.add(_el, _op[0], _op[1]);
				}
				else {
					registry.add(_el, _op, _operations[_op]);
				}
			}

			if (!_operations) return;

			if (typeof _operations === "function") {
				registry.add(_el, "callback", _operations);
			}
			else {
				if (0 in _operations) {
					_operations.forEach(add);
				}
				else {
					Object.keys(_operations).forEach(add);	
				}
				
			}
		};

		render.requestFrame = function() {
			return new Promise(function(_resolve, _reject) {
				requestAnimationFrame(function(_time) {
					var q = [];

					function dq () {
						q.pop();
						if (!q.length) _resolve(_time);
					}

					registry.Q(function(_id, _operations) {
						var el, node, promise;

						el = cache(_id);
						node = el.node();
						promise = el.delegate("renderOperations", [el, node, _operations, _time]);

						if (promise) {
							promise.then(dq);
							q.push("");
						}
					});

					if (!q.length) _resolve(_time);
				});
			});
		};

		return render;
	}()),

	(function() {

		function lineage () {
			var record, proto;

			record = new lineage.record;
			proto = this.constructor.prototype;

			while (proto) {
				record.name.push(proto.constructor.name);
				record.type.push(proto.constructor);

				if (proto.constructor === El) break;

				proto = Object.getPrototypeOf(proto);
			}

			return record;
		}

		lineage.record = function() {
			this.name = [];
			this.type = [];
		};

		return lineage;
	}()),

	function delegate (_message, _args) {
		if (typeof _message === "string" && typeof _args === "function") this[_message] = _args;
		if (typeof _message === "function") this[_message.name] = _message;
		if (typeof this[_message] === "function") return this[_message].apply(this, _args);
	},

	function add (_child, _name) {
		var node, childEl;

		if (_child instanceof El) {
			childEl = _child;
			node = _child.node();
		}
		else {
			if (typeof _child === "string") {
				if (~_child.indexOf("<")) {
					htmlParser.innerHTML = _child;
					node = htmlParser.firstElementChild;
				}
				else {
					node = WINDOW.document.createElement(_child);
				}
			}
			else if (_child.nodeType === document.ELEMENT_NODE) {
				node = _child;
			}

			if (node.id) childEl = cache(node.id);

			if (!childEl) {
				return (function(el) {
					return El.createWithNode(node, el).then(function(_instance) {
						return el.add(_instance);
					});
				}(this));
			}
		}

		if (childEl && !this.isPrototypeOf(childEl)) {
			childEl = this
				.instantiateWithType(childEl.constructor, childEl.id, childEl.scope)
				.define(childEl)
				.init(_name);
		}

		cache.definePointer(this, childEl);

		return this.render({ appendChild: [node] }).then(function(_time) {
			return childEl;
		});
	},

	function style (_props) {
		if (!_props) return WINDOW.getComputedStyle(this.node());
		return this.render({ setAttribute: ["style", Object.keys(_props).map(function(_prop) {
			return string.dash(_prop)+": "+_props[_prop];
		}).join(";")] });
	},

	function classes () {
		var delimiter, names, el;

		delimiter = /\s+|,/;
		names = this.node().className.split(delimiter).filter(array.FILTER.FALSY);
		el = this;

		if (arguments.length) {
			return this
				.render({
					className: names
						.concat(
							array(arguments)
								.join(" ")
								.split(delimiter)
								
						)
						.filter(array.FILTER.DUPLICATES)
						.join(" ")
				})
				.then(function() {
					return el;
				});
		}

		return names;
	},

	(function() {

		function watch (_eventName, _handler, _capture) {
			var el, node;

			el = this;
			node = this.node();

			if (node) {
				node.addEventListener(_eventName, watch.handler, _capture||false);

				if (!node.watching) node.watching = {};
				if (!node.watching[_eventName]) node.watching[_eventName] = [];

				node.watching[_eventName].push(_handler);
			}

			return this;
		};

		watch.handler = function(_event) {
			var el, should, will, did, handlers, sender, target, targetPosition, event, pvtDefault;

			el = cache(_event.currentTarget);
			should = string.join("should", string.capitalize(_event.type));
			will = string.join("will", string.capitalize(_event.type));
			did = string.join("did", string.capitalize(_event.type));
			handlers = _event.currentTarget.watching[_event.type];
			sender = cache(_event.target) || El.getClosestScope(_event.target);
			target = sender.node();
			targetPosition = El.nodePosition(target);

			event = {
				name: _event.type,
				target: target,
				sender: sender,
				reciver: el,
				node: _event.target,
				keyCode: _event.keyCode,
				data: _event.detail,
				cursor: {
					x: _event.clientX,
					y: _event.clientY,
					senderX: _event.clientX - targetPosition.x,
					senderY: _event.clientY - targetPosition.y
				}
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

		return watch;
	}()),

	function fire (_event, _detail) {
		var node = this.node(),
			event = new CustomEvent(_event, { bubbles: true, detail: _detail });

		node.dispatchEvent(event);

		return event;
	}
)}

/* Local file variables */
TAG_PATTERN = /\{\{.+?\}\}/;
astralDom = WINDOW.document.createDocumentFragment();
htmlParser = WINDOW.document.createElement("div");

/* define members to prototype constructor. */
Scope.extend(El);

/* define member to scope. */
define(El);

console.log(astralDom);