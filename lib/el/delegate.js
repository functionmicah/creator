/**
 * delegate.js
 */
"require el.js";
"require cache.js";
"require captureReferences.js";

define({

	ElDelegate : new (function() { define.call(this,

		{
			injection: null
		},

		function el_shouldInitNode (_node) {
			var replacment;

			if (this.isNodeTypeEnforced) {
				replacment = WINDOW.document.createElement(this.nodeName);

				if (_node.attributes)
					array.forEach(_node.attributes, function(_attr) {
						replacment.setAttribute(_attr.name, _attr.value);
					});

				El.walkSiblings(_node.firstChild, function(_sibling) {
					replacment.appendChild(_sibling);
				});
				
				if (_node.parentNode) _node.parentNode.replaceChild(replacment, _node);
			}

			return replacment || _node;
		},

		function el_renderOperations (_el, _node, _operations, _time) {
			_operations.forEach(function(_op) {
				var method, input;

				method = _op[0];
				input = _op[1];

				if (method === "callback") {
					input.call(_el, _node, _time);
				}
				else {
					if (typeof _node[method] === "function") {
						_node[method].apply(_node, input);
					}
					else {
						_node[method] = input;
					}
				}
			});
		},

		function el_resolveAttribute (_el, _name, _value) {
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
		function el_injectModel (_el, _target) {
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
		},

		new (function() {
			var def = this;

			function createCaptureNodeMessage (_prefix) {
				return function(_el, _child) {
					/* Capture Tags */
					if (_child.nodeType === document.TEXT_NODE) {
						return _el.delegate("el_"+(_prefix ? _prefix+"C" : "c")+"aptureTextNode", [_el, _child]);
					}
					/* Capture Els */
					else if (_child.nodeType === document.ELEMENT_NODE) {
						return _el.delegate("el_"+(_prefix ? _prefix+"C" : "c")+"aptureElementNode", [_el, _child]);
					}	
				};
			}

			[null, "should", "will", "did"].forEach(function(_prefix) {
				def[(_prefix ? _prefix+"C" : "c") + "aptureNode"] = createCaptureNodeMessage(_prefix);
			});
		}),

		function el_shouldCaptureTextNode (_el, _child) {
			return Boolean(TAG_PATTERN.test(_child.textContent) || _child.template);
		},

		function el_captureTextNode (_el, _child) {
			if (!_el.hasOwnProperty("tags")) _el.tags = [];
			_el.tags.push.apply(_el.tags, captureReferences.tag(_child));
		},

		function el_shouldCaptureElementNode (_el, _child) {
			return Boolean(cache(_child) || _child.hasAttribute("el"));
		},

		function el_captureElementNode (_el, _child) {
			var parentEl = El.getClosestScope(_child);

			if (parentEl === _el) {
				return _el.delegate("el_injectModel", [_el, _child]).then(function() {
					return El.createWithNode(_child, _el);
				});
			}

			/* do not walk down El node. */
			return false;
			}
		},

		function el_didCaptureElementNode (_el, _child) {
			cache.definePointer(_el, _child);
		}

	)})

})