"require ../el/el.js";
"require ../el/nodes/ul.js";

function Terminal () { this.define(
	function ready (_term) {
		this.window.doc().addEventListener("terminal-log", function(_e) {
			_term.log.push({ input: _e.detail.join(" ") }).then(function(_item) {
				_item.node().scrollIntoView();
			});
		});
	}
)}

function TerminalInput () { this.define(
	function ready () {
		this.watchEvents()
	},

	function watchEvents () {
		this.watch("keydown", function(_e) {
			var data;

			if (_e.keyCode === 13) {
				data = {
					input: this.text(),
					output: null,
					error: null,
				};
				
				this.log.push(data).then(function(_item) {
					try { data.output = string(eval(data.input, this.window.scope)); }
					catch (e) { data.error = e; }

					_item.define(data);
					_item.tags.render();

					_item.classes(_item.error && "ERROR", _item.output && "OUTPUT");
					_item.node().scrollIntoView();
				});

				this.text("");
			};
		});
		
	},

	function text (_val) {
		var node = this.node();
		if (_val != null) node.value = _val;
		return node.value;
	}
)}

define(El.extend(Terminal, TerminalInput));