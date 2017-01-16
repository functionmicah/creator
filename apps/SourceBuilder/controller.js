"require Creator:lib/ui/el/AppFrame.js";

function SourceBuilder () {this.define(

	{ editor: null },

	function ready () {
		this.run();

		this.watch("component-ready", function(_e) {
			console.log(_e.name, _e.data);
			this.editor = _e.data;
		});
	},

	function load (_path) {
		var editor = this.editor;

		return ajax(_path).then(function(_source) {
			editor.doc.setValue(_source);
		});
	},

	function save (_path) {
		return dir.save(_path, this.editor.doc.getValue());
	}
);}

define(
	AppFrame.extend(SourceBuilder)
)