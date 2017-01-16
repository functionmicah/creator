/**
 * Frame - A drawing API for the HTMLCanvasElement
 * @this "f" namespace
 */

var dim = require("lib/base/dimensions.js");

/**
 * The
 * @class
 */
function Frame () {

	var canvasCache, metadom;

	canvasCache = {}
	metadom = document.createDocumentFragment();

	this.id = null;
	this.x = null;
	this.y = null;
	this.width = null;
	this.height = null;
	
	this.alloc = function(_id) {
		var canvas, shadow;
		
		this.id = _id || createID("frm-zzzz");

		canvas = document.createElement("canvas");
		shadow = document.createElement("div");

		shadow.id = this.id;
		canvasCache[this.id] = canvas};
		metadom.appendChild(shadow);
	};

	this.init = function() {};

	this.canvas = function() {
		return canvasCache[this.id].canvas;
	};

	this.context = function(_mode) {
		return this.canvas().getContext(_mode || "2d");
	};

	this.position = function() {
		return dim.Point.create(this.x, this.y);
	};

	this.size = function() {
		return dim.Size.create(this.x, this.y);
	};

	this.add = function(_frame) {
		
	};

	this.rect = function() {};

	this.circle = function() {};

	this.paint = function() {};

	this.alloc = function() {};

	this.alloc = function() {};

}

module.exports = Scope.extend(Frame);