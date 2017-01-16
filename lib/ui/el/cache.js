/**
 * Shared cache object-id relationships.
 */
var nodes = {};

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
	return _id ? nodes[_id.id || _id] : _id;
};

cache.set = function(_id, _set) {
	return _set ? nodes[_id.id || _id] = _set : _set;
};

cache.has = function(_id) {
	return !!~Object.keys(nodes).indexOf(_id.id || _id);
};

cache.del = function(_id) {
	return delete nodes[_id.id || _id];
};

define(cache);