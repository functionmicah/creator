define({

	ElDelegate : new (function() { define.call(this,

		{
			injection: null
		},

		function intitialize () {
			return this;
		},

		function build () {
			return this;
		},

		function renderOperations (_el, _node, _operations, _time) {
			_operations.forEach(function(_op) {
				var method, input;

				method = _op[0];
				input = _op[1];

				if (method === "callback") {
					input.call(_el, _node, _time);
				}
				else {
					if (typeof _node[method] === "function") {
						// if (method === "fillText") debugger;
						_node[method].apply(_node, input);
					}
					else {
						_node[method] = input;
					}
				}
			});
		},

		function resolveAttribute (_el, _name, _value) {
			var path, cssLink;

			switch (_name) {
				case "el-inject":
					_el.injection = {
						name: _value,
						model: WINDOW.document.createDocumentFragment()
					};

					El.walkSiblings(_el.node().firstChild, function(_child) {
						_el.injection.model.appendChild(_child);
					});
					break;

				case "el-model":
					path = Path.create(~_value.indexOf("$") ? _el[_value.slice(1)] : _value);

					if (!path.extention) {
						cssLink = WINDOW.document.createElement("link");
						cssLink.rel = "stylesheet";
						cssLink.type = "text/css";
						cssLink.href = Path.create([path, "view.css"]);

						WINDOW.document.head.appendChild(cssLink);

						path = Path.create([path, "model.html"]);
					}

					return ajax(path).then(function(_markup) {
						return _el.render({ innerHTML: _markup });
					});
					break;
			}
		},
		/**
		 * Delegate rendering of the "el-inject" node attribute.
		 */
		function injectModel (_el, _target) {
			if (_el.hasOwnProperty("injection")) {
				var target, model;
				function injection () { _target.appendChild(model); }

				target = El.nodeDetails(_target);
				model = _el.injection.model;

				if (target.name === _el.injection.name) {
					_el.injection = true;
					return _el.render(injection);
				}
			}

			return Promise.resolve(_el);
		},

		function el_renderTag (_el, _tag, _value, _node) {
			_node.textContent = _value;
		}

	)})

})