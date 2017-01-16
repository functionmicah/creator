"require ../el.js";

function input () {
	Object.defineProperty(this, "value", {
		get: function() {
			return this.node().value;
		},

		set: function(_val) {
			this.requestRender({ value: _val });
		},
		enumerable: true
	});
}

define(El.extend(input));