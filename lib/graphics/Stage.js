/**
 *
 */
"require ../el/el.js";
"require ../el/nodes/canvas.js";

function Stage () { this.define({

	hitBuffer: null },

	function initialize () {
		var stage = this;

		stage.sup("initialize", []);
		stage.watchEvents();

		return stage.definePointer(Canvas.create(), "hitBuffer").init().then(function(_buffer) {
			_buffer.graphics(stage.props.width, stage.props.height);
		});;
	},

	function watchEvents () {
		var stage = this;
		this.watch("click", function(_event) {
			
			stage.hitBuffer.clear();
			stage.hitBuffer.render(stage.hitTest()).then(function(_buffer) {
				var pxl, id;

				pxl = stage.hitBuffer.graphics().getImageData(_event.cursor.senderX, _event.cursor.senderY, 1, 1);

				log("cursor", [_event.cursor.senderX, _event.cursor.senderY], "canvas", El.get(color(pxl.data).hex()));
			});

			El.walkDown(stage.node(), function(_child) {
				var c;

				if (_child.id) {
					c = El.get(_child);
					stage.hitBuffer.render(c.hitTest());
				}
			});
		});
	}
)}

function color (_data) {
	return {
		r: _data[0],
		g: _data[1],
		b: _data[2],
		a: _data[3]/255,
		hex: function() {
			var r,g,b;
			
			r = this.r.toString(16);
			g = this.g.toString(16);
			b = this.b.toString(16);

			return [r,g,b]
				.map(function(_hex) {
					return _hex.length < 2 ? "0"+_hex : _hex;
				})
				.join("");
		}
	}
}

define(Canvas.extend(Stage));