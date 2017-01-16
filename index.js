/**
 * index.js
 */

"require lib/el/el.js";
"require lib/el/nodes/ul.js";
"require lib/el/nodes/canvas.js";
"require lib/graphics/Stage.js";
"require lib/graphics/List.js";
"require lib/ui/Modal/controller.js";

function run () {
	
	El
	.create(null, FILE)
	.init('doc', WINDOW.document.firstElementChild)
	.then(function(_html) {
		_html.alert.tags.title = "Alert Message";
		_html.alert.content.tags.message = "Hello World";
		_html.el(".files")[0].build([1,2,3]);

		_html.stage.fam.build([
			"Micah",
			"Matty",
			"Mum",
			"Pops"
		]);
		
		_html.stage.message.tags.data = "But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful.";

		log("Running", _html);
		WINDOW.html = _html;
	});
}

define(run);