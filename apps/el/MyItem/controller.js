function MyItem () {

	this.profile = null;
	this.usrName = null;
	this.bio = null;
	
	this.init = function(_node, _name) {
		return this.sup("init", [_node || "li", _name]).then(function(_item) {
			console.log("profile image", _item.profile);
			if (_item.pic) _item.profile.attr("src", _item.pic);
			return _item
		});
	};

}

this.MyItem = MyItem;

module.exports = El.extend(MyItem);