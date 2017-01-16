/**
 *
 */

define(
	function colorFromImageData (_imageData) {
		return {
			r: pxl.data[0],
			g: pxl.data[1],
			b: pxl.data[2],
			a: pxl.data[3]/255,
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
);