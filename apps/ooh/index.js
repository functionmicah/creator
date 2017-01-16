"require Creator:lib/ui/el/document.js";
"require lib/elements.js";

setName("ooh");

function OohBody () {
	Object.defineProperties(this, {
		width: {
			get: function() {
				var node = this.node(),
					win = this.doc().defaultView;
				return node.width || node.naturalWidth || parseInt(win.getComputedStyle(node).width);
			},

			set: function(_value) {
				this.requestRender({ width: _value });
			},
			enumerable: true
		},

		height: {
			get: function() {
				var node = this.node(),
					win = this.doc().defaultView;
				return node.height || node.naturalHeight || parseInt(win.getComputedStyle(node).height);
			},

			set: function(_value) {
				this.requestRender({ height: _value });
			},
			enumerable: true
		}
	});
}

this.init = function () {
	Window.create(null, this, document).init(document.documentElement, "window").then(function(_win) {
		define({ window: _win });
	});
};

define(
	{Body: Body.extend(OohBody)}
);