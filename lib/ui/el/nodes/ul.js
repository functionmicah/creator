"require ../el.js";

function ul () { this.define(

	{ data: null },

	function alloc () {
		this.sup("alloc", arguments);
		this.data = [];
	},

	function ready () {
		this.watchEvents();
	},

	function watchEvents () {
		return (function(_el) {
			_el.watch("click", function(_e) {
				this.select(_e.target);
			});

			return _el;
		}(this));
	},

	function push (_data) {
		this.data.push(_data);
		return (function(list) {
			return list.delegate("itemForData", _data).then(function(_item) {
				return list.add(_item);
			});
		}(this));
	},

	function pop () {
		var item = this.find("li:last-child")[0];

		if (item) {
			this.data.pop();
			item.remove();
		}

		return item;
	},

	function insertAt (_data, _index) {
		this.data.splice(_index, 0, _data);
		return (function(list) {
			return list.delegate("itemForData", _data).then(function(_item) {
				return list.add(_item).then(function() {
					return _item.requestRender(function(_node) {
						_node.parentNode.insertBefore(_node, _node.parentNode.children[_index]);
					});
				});
			});
		}(this));
	},

	function build (_list) {
		if (_list) this.data = _list;

		return (function(_el) {
			return new Promise(function(_resolve, _reject) {
				var q = new Array(_el.data.length);

				q.dq = function() {
					this.pop();

					if (!this.length) _resolve(_el);
				};

				(_el.data || []).forEach(function(_data, _i, _col) {
					_el.delegate("itemForData", _data, _i, _col)
						.then(function(_item) {
							return _el.add(_item);
						})
						.then(function() {
								q.dq();
						});
				});
			});
		}(this));
	},

	function itemForData (_data, _index, _collection) {
		var item, node;

		item = this.instantiate();
		node = this.node().children[_index] || (this.model.children[_index] || this.model.firstElementChild).cloneNode(true);

		if (typeof _data === "object") {
			item.define(_data);
		} else if (_collection) {
			Object.defineProperty(item, "data", {
				get: function() {
					return _collection[_index];
				},
				set: function(_val) {
					_collection[_index] = _val;
					if (this.tags) this.tags.render();
				},
				enumerable: true, configurable: true
			});	
		} else {
			item.data = _data;
		}
		
		return item.init(node);
	},

	function select (_query) {
		var selected;

		(function(_el) {
			_el.find("li").some(function(_item, _i) {
				if (~[_i, _item, _item.id, _item.data, _item.node()].indexOf(_query)) {
					_el.find(".SELECTED").forEach(function(_sel) {
						_sel.classes().remove("SELECTED");
					});
					_item.classes("SELECTED");
					selected = _item;
					return true;
				}
			});	
		}(this));

		return selected;
	}
);}

define(El.extend(ul));