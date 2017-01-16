"require lib/File.js";
"require lib/Folder.js";
"require lib/FileDetail/controller.js";
"require ../TreeDetail/controller.js";
"require ../el/nodes/ul.js";

function FileBrowser () { this.define(

	function build (_path) {
		var browser = this;

		return this.scope.dir(_path).then(function(_files) {
			var path, data;

			path = Path.create(_path);
			data = {
				path: path.names,
				items: _files
			};

			browser.title = path.file;
			browser.tags.render();

			return browser.sup("build", [data]);
		});
	},

	(function() {
		var typeMap = {
			items: FolderDetail,
			details: FileDetail
		};

		function typeForNode (_node, _name, _default) {
			if (typeMap[_name]) return typeMap[_name];
			return _default;
		}

		return typeForNode;
	}())

	
)}

function FolderDetail () { this.define(

	function itemForData (_data, _index, _collection) {
		var file, item, type;

		file = Path.create(_data);
		type = file.extention ? File : Folder;
		item = this.budWithType(type);

		item.data = file;

		return item.init(this.node().children[_index] || this.model);
	}
)}

define(
	ul.extend(FolderDetail),
	TreeDetail.extend(FileBrowser)
);