
this.doc = new (function() {

	this.init = function() {
		shell.blacklist.push('doc');
		shell.log("<span class=\"com-fm-app-install-complete\">Doc editor install complete!</span>");
		return this;
	};

	this.create = function(_fileName) {
		var id, win, complete, doc;

		id = Math.floor(Math.random() * Date.now()).toString(16).slice(5);
		win = open($URL.CREATOR + "apps/doc/index.html", id);
		complete = [];

		doc = {
			fileName: _fileName,
			window: win,
			
			setText: function(_text) { win.document.body.textContent = _text; },
			setHTML: function(_html) { win.document.body.innerHTML = _html; },

			toText: function() { return win.document.body.textContent; },
			toHTML: function() { return win.document.body.innerHTML; },
			
			toString: function() { return this.toHTML(); },
			then: function(_complete) { complete.push(_complete); return doc; }
		};
		
		win.addEventListener("load", function() {
			source.init(win.document.body, "fm-Source");

			win.document.title = "Creator | "+_fileName;
			win.document.body.id = id;
			win.document.body.focus();
			win.document.execCommand("insertParagraph");
			win.document.execCommand("insertText", null, "/**\n * Welcome!\n */\n\n");

			win.document.body.addEventListener('keydown', function(_e) {
				if (_e.keyCode === 83 && _e.ctrlKey) {
					f.doc.save(doc);
					win.alert(_fileName+' Saved!');
					return false;
				}
			}, false);

			if (complete.length) complete.forEach(function(_c) {_c.call(doc);})

		}, false);

		return doc;
	};

	this.save = function(_doc) {
		localStorage.setItem("com.fm.apps.doc."+_doc.fileName, _doc.toHTML());

		return this;
	};

	this.load = this.open = function(_fileName) {
		var doc, data;
		
		data = localStorage.getItem("com.fm.apps.doc."+_fileName);
		doc = this.create(_fileName).then(function() {
			if (data) this.setHTML(data);
		});

		return doc;
	};

});

doc.init();