/**
 * dimensions for a box
 */

var fmArray = require("lib/base/array.js");

function Point () {
	
	Object.defineProperties(this, {
		x: {
			get: function() {
				return this[0];
			},

			set: function(_value) {
				this[0] = _value;
			},

			configureable: false
		},

		y: {
			get: function() {
				return this[1];
			},

			set: function(_value) {
				this[1] = _value;
			},

			configureable: false
		}
	});

	this.alloc = function() {
		this.push(0, 0);
	};

	this.set = function() {
		if (arguments.length === 1) {
			
		} else {
			
		}
	};

}

function Size () {
	
	Object.defineProperties(this, {
		width: {
			get: function() {
				return this[0];
			},

			set: function(_value) {
				this[0] = _value;
			},

			configureable: false
		},

		height: {
			get: function() {
				return this[1];
			},

			set: function(_value) {
				this[1] = _value;
			},

			configureable: false
		}
	});

	this.alloc = function() {
		this.push(0, 0);
	};

}

module.exports = {
	Point: fmArray.extend(Point),
	Size: fmArray.extend(Size)
};
