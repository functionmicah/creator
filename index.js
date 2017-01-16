"require lib/helpers.js";
"require lib/ui/el/el.js";
"require lib/ui/el/document.js";
"require lib/ui/el/nodes/ul.js";

setName("Creator");

this.init = function () {
	Window.create(null, this, document).init(document.documentElement, "window").then(function(_win) {
		
		define({ window: _win });

		_win.body.files.build("lib/ui");
		
		_win.watch("click", function(_e) {
			log(_e.sender.name || _e.sender.id);
			console.log(_e.sender);

			// this.body.tree.build(_e.sender);
		});
	});
};