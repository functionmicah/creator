"require ../el/el.js";
"require ../el/nodes/ul.js";

function TreeDetail () { this.define(

	{
		title: null,
		model: Path.create([$URL.PATH.directory, "model.html"]),
		view: Path.create([$URL.PATH.directory, "view.css"])
	},

	function build (_manifest) {
		var tree = this;

		Object.keys(_manifest).forEach(function(_member) {
			if (tree[_member]) tree[_member].build(_manifest[_member]);
		});
	}

)}

define(
	El.extend(TreeDetail)
)