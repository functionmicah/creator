/**
 * Element type for UL tag defining the basic API for lists.
 */
"require ../../helpers.js";
"require ../el.js";

var UlDelegate;

function Ul () {
	
	Ul.define({ Delegate: UlDelegate });

	this.define(
	
	UlDelegate,

	function build (_data) {
		var ul = this;

		if (_data || ul.data) {
			return new Promise(function(_resolve, _reject) {
				var data, q;

				data = _data || ul.data;
				(q = new Array(data.length)).dq = function() {
					q.pop();
					if (!q.length) _resolve(ul);
				};

				data.forEach(function(_value, _i, _data) {
					ul.delegate("ul_itemForIndex", [_i, _data]).then(function(_item) {
						_item.tags.data = _value;

						if (ul.has(_item))
							q.dq()
						else
							ul.add(_item).then(q.dq);
					});
				});
			});
		}

		return Promise.resolve(ul);
	}
)}


UlDelegate = new (function() { define.call(this,
	
	function ul_createItemNode () {
		return this.model().firstElementChild.cloneNode(true);
	},

	function ul_nodeForIndex (_index) {
		return this.node().children[_index] || this.ul_createItemNode();
	},

	function ul_typeForIndex (_index, _node) {
		// debugger;
		var detail = El.nodeDetails(_node);
		return detail.type || this.scope[detail.typeName||string.capitalize(_node.nodeName.toLowerCase())] || El;
	},

	function ul_itemForIndex (_index, _data) {
		var node, type, item;

		node = this.ul_nodeForIndex(_index);

		if (node.id) return Promise.resolve(El.getClosestScope(node));

		type = this.ul_typeForIndex(_index, node);
		
		return this.instantiateWithType(type).init(null, node);
	}
)});

define(El.extend(Ul));