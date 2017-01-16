/**
 * style.js
 * The element type for <style> nodes
 */
"require ../el.js";

function Style () { this.define({

	rules: null },

	function alloc () {
		this.sup("alloc", arguments);
		this.rules = Style.Sheet.create();
	}
)}

El.extend(Style);

Style.define(

	type(function Sheet () { this.define(

		function rule (_selector, _props) {
			if (_props) {
				this[_selector] = style.sheet.rule.create(_props);
			}
			
			return this[_selector];
		},

		function toString () {
			var s = this;

			return Object.keys(this).map(function(_selector) {
				return _selector+s[_selector];
			}).join("\n");
		}

	)})

);

Style.Sheet.define(
	type(function Rule () {
		
		function toString () {
			// body...
		}
	})
);

define(Style);