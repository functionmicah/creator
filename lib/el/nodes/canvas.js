/**
 * canvas.js
 */
"require ../../helpers.js";
"require ../el.js";

var CanvasDelegate;

function Canvas () { this.define(

	CanvasDelegate,
	
	{
		nodeName: "canvas",
		mode: "2d",
		props: null,
		isNodeTypeEnforced: true
	},

	function initialize () {
		var node = this.node();

		this.props = {
			x: 0,
			y: 0,
			width: node.width,
			height: node.height
		};
	},
	/**
	 * Get/Set graphics context and dimentions.
	 */
	function graphics (_w, _h, _mode) {
		var node = this.node();

		if (arguments.length) {
			if (_mode) this.mode = _mode;
			if (_w && _h) {
				node.width = _w; node.height = _h;
				this.props.width = _w; this.props.height = _h;
			}
		}

		return node.getContext(_mode||this.mode);
	},
	/*
	 * Render operations for buffer canvas.
	 */
	function operations () {
		var c, p, style, ops, text;

		c = this;
		p = this.props;
		style = this.style();
		ops = [
			["clearRect", [0,0, p.width, p.height]]
		];

		array.forEach(style, function(_prop) {
			var name = string.camel(_prop);
			c.delegate("canvas_operationsForStyle", [c, ops, name, style]);
		});

		return ops;
	},
	/**
	 * Render operations for hit testing.
	 */
	function hitTest () {
		var p = this.props;
		return {
			fillStyle: "#"+this.id,
			fillRect: [p.x, p.y, p.width, p.height]
		};
	},
	/*
	 * Render operations for the parent buffer when drawing its child.
	 */
	function draw (_lineCalculator) {
		var p, l, isBlock;

		p = this.props;
		isBlock = this.style().display === "block";

		if (_lineCalculator) {
			if (isBlock) _lineCalculator.nextLine();
			l = _lineCalculator.calculate(p.width, p.height, isBlock);
			if (!l) return;
		};

		return ["drawImage", [this.node(), (l||p).x, (l||p).y, p.width, p.height]];
	},

	function build (_operations) {
		var c, q, operations, linesCalculator;

		log("BUILD", this.id, this.name);

		c = this;
		q = [c];
		operations = _operations || c.operations() || [];
		linesCalculator = LinesCalculator.create(this.props.width, this.props.height);

		El.walkDown(c.node(), function(_node) {
			var style;

			switch (_node.nodeType) {
				case document.TEXT_NODE:
					if ((/\S/).test(_node.textContent)) {
						style = WINDOW.getComputedStyle(_node.parentNode);
						c.delegate("canvas_operationsForTextStyle", [c, operations, style, linesCalculator]);
						c.delegate("canvas_operationsForText", [c, operations, _node.textContent, linesCalculator, style]);
					}
					break;

				case document.ELEMENT_NODE:
					style = WINDOW.getComputedStyle(_node);
					if (_node.id) {
						c.delegate("canvas_operationsForBuffer", [c, operations, El.get(_node), linesCalculator]);
						return false;
					}
					break;
			}
		});

		return c.render(operations)
			.then(function(_c) {
				var parent = c.parent();
				c.fire("build", { operations });
				return (parent && ~parent.lineage().name.indexOf("Canvas") && parent.isReady) ? parent.build() : c;
			});
	},

	function clear () {
		return this.render({
			clearRect: [0,0, this.props.width, this.props.height]
		});
	},

	function renderOperations (_canvas, _node, _operations, _time) {
		var ops = _operations.map(function(_op) { return _op[0] });
		function nodeHas(_name) { return _node[_name] != null }

		/* pipe render operations to canvas node */
		if (ops.some(nodeHas)) {
			this.sup("renderOperations", [_canvas, _node, _operations, _time]);
			if (_canvas.isReady) return _canvas.build();
		}
		/* pipe render operations to canvas graphics context */
		else {
			this.sup("renderOperations", [_canvas, _node.getContext(this.mode), _operations, _time]);
			log("FRAME", this.name, _operations);
		}

		this.fire('frame', {
			canvas: _canvas,
			time: _time,
			operations: _operations
		});
	},

	function add () {
		return this.sup("add", arguments).then(function(_canvas) {
			return _canvas.build();
		});
	}
)}

define.call(CanvasDelegate = {},

	function el_renderTag (_canvas, _tag, _value, _node) {
		this.sup("el_renderTag", arguments);
		_canvas.build();
	},

	function canvas_operationsForStyle (_canvas, _ops, _prop, _style) {
		var value = _style[_prop];

		switch (_prop) {
			case "backgroundColor":
				_ops.push(["fillStyle", value]);
				_ops.push(["fillRect", [0,0, this.props.width, this.props.height]]);
				break;
		}
	},

	function canvas_operationsForBuffer (_canvas, _operations, _buffer, _lineCalculator) {
		_operations.push(_buffer.draw(_lineCalculator));
	},

	function canvas_operationsForText (_canvas, _ops, _text, _lineCalculator, _style) {
		var h, isBlock, lines, start;

		h = parseInt(_style.fontSize);
		isBlock = _style.display === "block";

		lines = [["", _lineCalculator.x, _lineCalculator.y+h]];
		start = _lineCalculator.l;

		(_text.match(/\S+(?:\s+?)?/g)||[])
			.some(function(_word) {
				var w, l, point;

				if (!_word) return;

				w = _canvas.graphics().measureText(_word).width;
				point = _lineCalculator.calculate(w, h);
				l = _lineCalculator.l - start;

				if (point) {
					if (!lines[l]) lines[l] = ["", 0, _lineCalculator.y+h];
					lines[l][0] += _word;
				}
				else {
					return true;
				}
			});

		lines.forEach(function(_line) {
			if (_line[0]) _ops.push(["fillText", _line]);
		});
	},

	function canvas_operationsForTextStyle (_canvas, _ops, _style) {
		_ops.push(["font", _style.font]);
		_ops.push(["fillStyle", _style.color]);
	}
);

function LinesCalculator () { this.define(
	{
		x:  0,
		y:  0,
		cw: 0,
		ch: 0,
		l:  0,
		lh: 0
	},

	function alloc (cw, ch) {
		this.define({cw, ch});
	},

	function nextLine (_w, _h) {
		this.l += 1;
		this.x = _w || 0;
		this.y += _h || this.lh;
		this.lh = 0;
	},

	function calculate (_w, _h, _isBlock) {
		var p, x;

		x = this.x;

		if (this.y > this.ch) return false;

		this.x += _w;

		if (this.x >= this.cw) {
			this.nextLine(_w);
			x = 0;
		}
		this.lh = Math.max(this.lh, _h);

		p = {x, y: this.y};

		if (_isBlock) this.nextLine();

		return p;
	}
)}

type(LinesCalculator);

define(El.extend(Canvas));