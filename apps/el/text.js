var cache = require("apps/el/cache.js");
require("lib/helpers.js");

function Tag () {
	var selector;

	selector = /\{\{.+\}\}/g

	this.name = null;
	this.value = null;

	this.alloc = function(_name) {
		this.name = _name;
	};

	this.init = function(_value) {
		this.value = _value;

		return this;
	};

	this.toString = function() {
		return "{{"+this.name+"}}";
	};
}

function Txt () {
	
	this.id = null;
	this.template = null;

	this.alloc = function(_id) {
		this.id = _id || ;
	};

	this.init = function() {

	};
}

type(Txt.Tag = Tag);

module.exports type(Txt);