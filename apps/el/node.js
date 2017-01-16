var cache = require("apps/el/cache.js");
require("lib/helpers.js");

function Node () {
	
	this.id = null;
	this.node = null;

	this.alloc = function(_id) {
		Object.defineProperty(this, "id", { value: _id || createID("el-xyxy"), enumerable: true });
	};

	this.init = function(_node) {
		this.node = _node;
		cache(_node.id, this);

		return this;
	};
}

module.exports Scope.extend(Node);