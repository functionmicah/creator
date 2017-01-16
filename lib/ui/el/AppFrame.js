"require el.js";

function AppFrame () {this.define(

	{ appScope: null },

	function init (_node, _name) {
		return this.sup("init", [_node||"iframe", _name]);
	},

	function run () {
		return (function(_app) {
			var path = Path.create([_app.scope.$URL.PATH.directory, "index.html?id="+_app.id]);

			return new Promise(function(_resolve, _reject) {
				var evt = string.dash(["frame", _app.id, "ready"]);

				_app.window.doc().addEventListener(evt, function(_e) {
					if (_e.detail.id !== _app.id) debugger;
					
					_app.scope.run(_e.detail.evaluate, _app).then(function(_appScope) {
						_app.appScope = _appScope;

						_app.classes("RUNNING");
						_app.fire("running", _appScope);
						_resolve(_app);
					});
				}, false);

				_app.attr("src", path);	
			});
		}(this));
	}
)}

define(
	El.extend(AppFrame)
);