"require Creator:lib/ui/el/document.js";
"require Creator:lib/ui/el/el.js";

setName("CodeMirror");

function CodeMirrorEl () {this.define(
	function ready () {
		var editor = CodeMirror.fromTextArea(this.node(), {
			lineNumbers: true,
			matchBrackets: true,
			continueComments: "Enter",
			extraKeys: {"Cmnd-/": "toggleComment"}
		});

		controller.fire("component-ready", editor);
	}
);}

this.init = function () {
	Window.create(null, this, document).init(document.documentElement, "window").then(function(_win) {
		define({ window: _win });
	});
};

define(
	El.extend(CodeMirrorEl)
);