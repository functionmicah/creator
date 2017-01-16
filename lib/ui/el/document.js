"require el.js";

function Window () {
	
	this.window = null;
	this.win = null;

	this.alloc = function() {
		this.window = this;
		this.sup("alloc", arguments);
	};

	this.init = function(_node, _name) {
		return this.sup("init", [_node || "html", _name]);
	};

}

function Head () {
	this.init = function(_node, _name) {
		return this.sup("init", [_node || this.doc().head, _name]);
	};
}

function Body () {
	this.init = function(_node, _name) {
		return this.sup("init", [_node || this.doc().body, _name]);
	};
}

define(El.extend(Window, Head, Body));