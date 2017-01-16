"require ../helpers.js";
/**
 * Shared cache object-id relationships.
 */
var nodes = {};

function resolveId (_id) {
	var id = _id.id != null ? _id.id : _id;
	return array.last(id.split("-"));
}

function cache (_id, _set) {
	if (_set) cache.set(_id, _set);
	return cache.get(_id);
}

Object.defineProperties(cache, {
	ids: {
		get: function() {
			return Object.keys(nodes);
		}
	},

	els: {
		get: function() {
			return this.ids().map(this);
		}
	}
});

cache.get = function(_id) {
	var id = resolveId(_id);

	// console.log("cache.get", id, nodes);

	return id && nodes[id];
};

cache.set = function(_id, _set) {
	var id = resolveId(_id);
	return _set ? nodes[id] = _set : _set;
};

cache.has = function(_id) {
	return !!~Object.keys(nodes).indexOf(resolveId(_id));
};

cache.del = function(_id) {
	return delete nodes[resolveId(_id)];
};

cache.definePointer = function(_obj, _ref, _name) {
	var name = _name ? string.camel(string.dash(_name).toLowerCase()) : _ref.name;

	if ((_name || _ref.hasOwnProperty("name")) && !_obj.hasOwnProperty(name || _ref.name)) {
		Object.defineProperty(_obj, name, new cache.definePointer.descriptor(_ref.id));
	}

	return _ref;
}

cache.definePointer.descriptor = function(_id) {
	this.get = function () { return cache(_id); };
	this.configurable = true;
};

define(cache);