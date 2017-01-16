/**
 * List.js
 */
"require ../el/nodes/canvas.js";
"require ../el/nodes/ul.js";

function List () { this.define(

	/* Implement the ul tag prototype for canvas view's DOM behavior. */
	Ul.Delegate,

	{},

	function build () {
		return Ul.prototype.build.apply(this, arguments).then(function(_list) {
			return _list.sup("build", []);
		});
	},

	function ul_itemForIndex (_index, _data) {
		var list = this;
		
		return Ul.Delegate.ul_itemForIndex.apply(this, arguments).then(function(_item) {
			var value, w, h;

			log(list.name, _data[_index], _item);

			value = _data[_index];
			// w = _item.graphics().measureText(value).width;
			h = parseInt(list.style().fontSize);
			_item.graphics(list.props.width, h);

			return _item;
		});
	}
)}

define(Canvas.extend(List));