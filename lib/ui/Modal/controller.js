"require ../../el/el.js";
"require ../../helpers.js";

function Modal () { this.define(

	{
		URL: Path.create(FILE.URL.directory)
	},

	function initialize () {
		this.watch("click", function(_event) {
			if (~[this.controls.okay, this.controls.cancel].indexOf(_event.sender)) {
				this.content.tags.message = ["clicked", _event.sender.name].join(" ");
			}
		});
	}
)}

define(El.extend(Modal));