/**
 * captureReferences.js
 */

var TAG_PATTERN;

function captureReferences (_el, _detail) {
	if (_detail && _detail.attrs.length) {
		return captureReferences
			.attrs(_detail.attrs, _el)
			.then(captureReferences.nodes);
	}

	return captureReferences.nodes(_el);
}

TAG_PATTERN = /\{\{.+?\}\}/;

define(captureReferences, { TAG_PATTERN });

captureReferences.nodes = function(_el) {
	var node, q;

	node = _el.node();
	q = [];

	El.walkDown(node, function(_child) {
		var promise;

		if (_el.delegate("el_shouldCaptureNode", [_el, _child]) === false) return;
		
		_el.delegate("el_willCaptureNode", [_el, _child]);
		promise = _el.delegate("el_captureNode", [_el, _child]);

		if (promise) {
			q.push(promise);
			promise.then(function() {
				_el.delegate("el_didCaptureNode", [_el, _child]);
			});
		}
		else {
			_el.delegate("el_didCaptureNode", [_el, _child]);
		}

		/* do not walk down node captures with a promise */
		return promise && false;
	});

	if (_el.hasOwnProperty("tags")) {
		_el.tags.forEach(function(_tag) {
			var collection = _el.tags[_tag.label] || [];

			if (_tag.label in _el.tags) {
				if (collection.push) {
					collection.push(_tag);
				}
				else {
					if (collection.nodeType === document.TEXT_NODE) {
						collection = [collection];
					}

					Object.defineProperty(_el.tags, _tag.label, {
						set: function(_value) {
							collection.forEach(function(_text) {
								_el.delegate("el_renderTag", [_el, _tag, _value, _text]);
							});
						},

						get: function() {
							return collection;
						},

					});
				}
			}
			else {
				Object.defineProperty(_el.tags, _tag.label, {
					set: function(_value) {
						_el.delegate("el_renderTag", [_el, _tag, _value, _tag]);
					},

					get: function() {
						return _tag;
					},

				});
			}
		});
	}

	// if (!q.length) _resolve(_el);

	return Promise.all(q);
};

captureReferences.attrs = function(_attributes, _el) {
	return new Promise(function(_resolve, _reject) {
		var node, q;
		
		node = _el.node();
		(q = []).dq = function(_promise) {
			var i = q.indexOf(_promise);
			if (~i) q.splice(i, 1);
			if (!q.length) _resolve(_el);
		};

		_attributes.forEach(function(_name) {
			var value, promise;

			value = node.getAttribute(_name);
			promise = _el.delegate("el_resolveAttribute", [_el, _name, value]);

			if (promise instanceof Promise) {
				q.push(promise);
				promise.then(function() { q.dq(promise); });
			}
		});

		if (!q.length) _resolve(_el);
	});
};

captureReferences.tag = function(_text) {
	var tags, words, string;

	tags = _text.textContent.match(TAG_PATTERN);
	words = _text.textContent.split(TAG_PATTERN).filter(function(_word) { return !!_word; });
	string = WINDOW.document.createDocumentFragment();

	words.forEach(function(_word, _i) {
		string.appendChild(WINDOW.document.createTextNode(_word));

		if (tags[_i]) {
			string.appendChild(tags[_i] = WINDOW.document.createTextNode(tags[_i]));

			tags[_i].template = tags[_i].textContent;
			tags[_i].label = tags[_i].textContent.slice(2, -2);
		}
		
	});

	if (words.length) {
		_text.parentNode.replaceChild(string, _text);
	}
	else if (tags.length) {
		if (tags.length > 1) {
			tags.forEach(function(_tag, _i) {
				var word = _text.slice(2,-2);

				string.appendChild(tags[_i] = WINDOW.document.createTextNode(word));

				tags[_i].template = tags[_i].textContent;
				tags[_i].label = word;
			});

			_text.parentNode.replaceChild(string, _text);
		}
		else {
			tags[0] = _text;
			_text.template = _text.textContent;
			_text.label = _text.textContent.slice(2, -2);
		}
	}

	return tags;
};