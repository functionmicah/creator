"require Creator:lib/ui/el/el.js";
"require Creator:lib/ui/el/nodes/ul.js";
"require Creator:lib/ui/el/nodes/input.js";

function ElDetail () { this.define(

	// {},
	/**
	 * Builds the list of properties defnied on an 'El'.
	 */
	function build (_el) {
		var detail = this;
		
		return new Promise(function(_resolve, _reject) {
			var props, q;

			props = Object.keys(_el);
			q = new Array(props.length);

			q.dq = function() {
				q.pop();

				if (!q.length) _resolve(detail);
			};

			props.forEach(function(_key) {
				var property;

				property = detail.properties.template.toTemplate(true);

				detail.properties.add(property, _key).then(function (_prop) {
					_prop.edit.value = _el[_key];
					console.log(_prop.edit);
					q.dq();
				});
			});
		});
	}

);}

define(El.extend(ElDetail));