/**
 * Element wrapper
 */

require("apps/el/builder.js");

function Window () {
	
	this.window = null;
	this.win = null;

	this.alloc = function() {
		this.window = this;
		this.sup("alloc", arguments);
	};

	this.init = function(_node, _name) {
		return this.sup("init", ["iframe" || _node, _name]);
	};

	this.load = function(_url) {
		return this.attr("src", _url || "/space-time.html");
	};

	/*this.win = function() { this.node().contentWindow };
	this.doc = function() { this.node().contentDocument || this.win().document; };*/
}

function Body () {

	this.alloc = function() {
		this.sup("alloc", arguments);
	};

	this.init = function(_name) {
		return this.sup("init", [this.doc().body, _name]);
	};
}

function Button () {
	
	this.init = function(_node, _name) {
		var node = _node.nodeType === document.ELEMENT_NODE && _node;

		return this.sup("init", [node || "button", node ? _name : _node]).then(function(_btn) {
			_btn.watch("click", function(_e) {
				shell.log("button", this.id, this.alert.parent().name, "data", this.data);
			});
		});
	};

}

function List () {

	this.data = null;
	this.template = null;

	this.alloc = function(_id, _data) {
		if (_data) this.data = _data;
		this.sup("alloc", [_id]);
	};

	this.init = function(_node, _name) {
		var node = _node.nodeType === document.ELEMENT_NODE && _node,
			template;

		return this.sup("init", [node || "ul", node ? _name : _node]).then(function(_list) {
			console.log("init List", _list);

			if (_list.template) {
				_list.template.remove();
			} else if (template = _list.node().children[0]) {
				_list.template = template.outerHTML;
				template.parentNode.removeChild(template);
			}

			_list.build();
		});
	};

	this.build = function(_data) {
		if (_data) this.data = _data;

		if (this.data && this.data.length) {
			return (function(_list) {
				return new Promise(function(_resolve, _reject) {
					var q = new Array(_list.data.length);

					function dQ () {
						q.pop();

						if (!q.length) {
							_resolve(_list.data);
						}
					}

					_list.data.forEach(function(_value, _i) {
						var item = _list.delegate("itemForData", _value, _i);

						if (typeof item === "string") {
							_list.write(item).then(dQ, _reject);
						} else if (item instanceof El) {
							_list.add(item).then(dQ, _reject);
						} else {
							item.then(function(_item) {
								console.log("add item", _item.node());
								return _list.add(_item).then(dQ, _reject);
							}, _reject);
						}

						// console.log("Item", item);
					});
				});
			}(this));
		}
	};

	this.toTemplate = function() {
		var clone = this.sup("toTemplate", []);

		if (this.template) clone.innerHTML = this.delegate("templateForItem");

		return clone;
	};

	this.templateForItem = function(_value, _index) {
		if (typeof this.template === "string") {
			return this.template;
		} else if (this.template instanceof El) {
			return this.template.toTemplate(true);
		}

		return "";
	};

	this.itemForData = function(_value, _index) {
		// var template = this.delegate("templateForItem", _value, _index);
		var item, key;

		item = this.template.instantiate();

		for (key in _value) {
			if (!_value.hasOwnProperty(key)) continue;
			item[key] = _value[key];
		}

		console.log("itemForData", item);

		return item.init(this.template.toTemplate(true));

		/*if (template) {
			return template.replace(El.TAG_PATTERN, function(_match) {
				var name = _match.slice(2, -2);

				return _value[name];
			});
		}*/
	};
}

function ul () {

	this.data = null;
	
	this.ready = function() {
		this.watchEvents();
	};

	this.watchEvents = function() {
		return (function(_el) {
			_el.watch("click", function(_e) {
				this.select(_e.target);
				/*var item = El.getClosestScope(_e.target);

				_el.find(".SELECTED").forEach(function(_item) {
					_item.classes().remove("SELECTED");
				});

				item.classes("SELECTED");*/
			});

			return _el;
		}(this));
	};

	this.build = function(_list) {
		if (_list) this.data = _list;

		return (function(_el) {
			return new Promise(function(_resolve, _reject) {
				var q = new Array(_el.data.length);

				q.dq = function() {
					this.pop();

					if (!this.length) _resolve(_el);
				};

				(_el.data || []).forEach(function(_data) {
					var item = _el.template.instantiate();

					item.data = _data;

					item.init(_el.template.toTemplate(true))
						.then(function(_item) {
							return _el.add(_item);
						})
						.then(function(_item) {
							q.dq();
						});
				});
			});
		}(this));
	};

	this.select = function(_query) {
		(function(_el) {
			_el.find("li").forEach(function(_item, _i) {
				if (~[_i, _item, _item.id, _item.data, _item.node()].indexOf(_query)) {
					_el.find(".SELECTED").forEach(function(_sel) {
						_sel.classes().remove("SELECTED");
					});
					_item.classes("SELECTED");
				}
			});	
		}(this));
		
	};
}

function video () {
	
	this.ready
	
}

function CSS () {

	this.rules = null;
	
	this.init = function(_name) {
		this.rules = CSS.Rule.Collection.create();

		return this.sup("init", ["style", _name]);
	};

	this.define = function() {
		this.rules.add.apply(this.rules, arguments);
		this.requestRender({ textContent: this.rules });

		return this;
	};

	this.toJSON = function() {
		return JSON.stringify(this.rules);
	};

	this.toString = function() {
		return this.rules.toString();
	};

}

CSS.Rule = function CSSRule () {

	this.alloc = function(_properties) {
		var prop;

		for (prop in _properties) {
			if (!_properties.hasOwnProperty(prop)) continue;
			this[prop] = _properties[prop];
		}
	};
	
	this.toString = function() {
		var prop, string;

		string = [];

		for (prop in this) {
			if (!this.hasOwnProperty(prop)) continue;
			string.push("\t", prop, ": ", this[prop], ";\n");
		}

		return string.join("");
	};

};

CSS.Rule.Collection = function CSSRuleCollection () {

	this.add = function(_selector_rules, _rule) {
		var rule;

		if (_rule) {
			this[_selector_rules] = CSS.Rule.create(_rule);
		} else {
			for (rule in _selector_rules) {
				if (!_selector_rules.hasOwnProperty(rule)) continue;
				this.add(rule, _selector_rules[rule]);
			}
		}

		return this;
	};

	this.toString = function() {
		var selector, string;

		string = [];

		for (selector in this) {
			if (!this.hasOwnProperty(selector)) continue;
			string.push(selector, " {\n", this[selector], "}\n\n");
		}

		return string.join("");	
	};

};

El.extend(Window, Body, CSS, ul);
type(CSS.Rule, CSS.Rule.Collection);

this.Button = El.extend(Button);
this.List = El.extend(List);
this.ul = ul;


(function(_scope) {

	Window.create().init()

		.then(function(_win) {
			return _win.requestRender({ appendTo: [document.body] }).then(function() {
				var node = _win.node();

				node.setAttribute("style", CSS.Rule.create({
					"position" : "absolute",
					"width" : "100%",
					"height" : "100%",
					"border" : "none",
					"top" : "0px",
					"left" : "0px",
				}));

				// node.width = "100%";
				// node.height = "100%";

				return new Promise(function(_resolve, _reject) {
					console.log("window", node.contentWindow);

					_win.node = function() { return this.doc().documentElement; };
					_win.win = function() { return node.contentWindow; };
					_win.doc = function() { return node.contentDocument || this.win().document };
						
					node.addEventListener("load", function() {
						_resolve(_win);
					}, false);

					node.src = "space-time.html"
				});
			});
		})

		.then(function(_win) {

			_win.add(_win.doc().head, "head").then(function(_head) {
				console.log(_head, _head.doc());
				_head.add(CSS).then(function(_style) {
					_style.define({
						".box1, .box2": {
							"min-height": "100px",
							"overflow": "hidden"
						},

						".box1": {
							"background-color": "red",
						},

						".box2": {
							"color": "white",
							"background-color": "blue",
						},

						".box2 .cancel": { display: "none" },

						".green": {
							color: "green"
						}
					});
				});
			});

			_win.add(Body, "body").then(function(_body) {

				_body.write("<div el=\"ooh:apps/ooh\"></div>");

				/*_body.add("div", "box1").then(function(_box) {
					_box.title = "Welcome";
					_box.message = "This is a red box.";

					_box.data = 1;
					
					ajax.get("apps/el/builder.html").then(function (_doc) {
						_box.write(_doc).then(function() {
							_box.alert.setPointer(f);

							alert.users.build([
								{
									pic: "http://ariadermspa.com/wp-content/uploads/2015/09/Kybella-Injections-Aria-DermSpa-Madison-CT-300x300.jpg",
									usrName: "Micah",
									bio: "Write your bio here..."
								},
								{
									pic: null,
									usrName: "Matthew",
									bio: "Write your bio here..."
								},
								{
									pic: null,
									usrName: "Daniel",
									bio: "Write your bio here..."
								},
								{
									pic: "https://scontent-lga3-1.xx.fbcdn.net/v/t1.0-9/14212613_1082245978527790_5940982756649906875_n.jpg?oh=f3c0c35ee2f59ee8ccc3aa5568f95d22&oe=58B97A92",
									usrName: "Mike",
									bio: "Write your bio here..."
								}
							]);

							_body.add("button").then(function(_button) {
								var toggle = 1, box = 1;
								_button.text("Move");
								_button.watch("click", function() {
									alert.addTo(_body["box"+(box+=toggle)]);
									toggle*=-1;
								});
							});
						}, function(_error) {
							console.error(_error);
						});
					});
				});

				_body.add("div", "box2").then(function(_box) {
					_box.title = "Oh Snap!!";
					_box.message = "This is a blue box.";
					_box.data = 2;
				});*/
			});
		});
	
	shell.log("<span class=\"com-fm-app-install-complete\">El installed :)</span>");
}(this));