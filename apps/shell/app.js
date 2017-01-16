
/** 
 * App: Shell
 */
var f = f || {};

f.shell = new (function() {
	var template, SELECTOR;

	function boot() {
		var apps;

		apps = (localStorage.getItem("com.fm.apps.list") || "").split('|');
		
		f.shell.log("Booting shell...");
		f.shell.load();

		if (apps[0]) {
			f.shell.log(" - booting", apps.join(', '));
			apps.forEach(function(_app) {
				f.shell.install(_app);
			});
		}
	}

	template = "<ul fm-id=\"log\" class=\"log\"></ul><div class=\"input\"><button fm-id=\"run-script\">Run</button><div fm-id=\"source\"></div></div>";
	SELECTOR = {
		SHELL: null,
		LOG: "[fm-id=log]",
		SOURCE: "[fm-id=source]",
		RUN: "[fm-id=run-script]"
	};

	this.blacklist = [];

	/** initialize shell UI */
	this.init = function(_id, _class) {
		var doc, logNode, sourceNode, runNode;

		function runSource (_e) {
			var code, output;

			code = typeof _e === "string" ? _e : sourceNode.textContent;

			try {
				output = "<p class=\"input\">"+code+"</p><p class=\"response\">"+f.eval(code)+"</p>";
			} catch (e) {
				output = "<pre style=\"color: red;\">"+e.stack+"\n\n"+code+"</pre>";
			}

			f.shell.print(output);
		}

		doc = document.createElement("div");

		doc.id = SELECTOR.SHELL = _id || "fm-Shell";
		doc.className = "com-fm-app-shell" + (" "+_class || "");
		doc.innerHTML = template;

		logNode = doc.querySelector(SELECTOR.LOG);
		sourceNode = doc.querySelector(SELECTOR.SOURCE);
		runNode = doc.querySelector(SELECTOR.RUN);

		runNode.addEventListener("click", runSource, false);

		setTimeout(function () {
			f.source.init(sourceNode, "fm-Source", runSource);
			boot();
		}, 0);

		return {
			shell: doc,
			log: logNode,
			source: sourceNode,
			run: runNode
		};
	};

	this.save = function (_obj) {
		var m, blacklist, store;

		blacklist = ['eval', 'source', 'shell', '$URL'].concat(this.blacklist);
		store = {};

		for (m in f) {
			if (!f.hasOwnProperty(m)) continue;
			if (~blacklist.indexOf(m)) continue;
			if (typeof f[m] === 'function') {
				store[m] = '(' + f[m].toString() + ')';
			} else {
				store[m] = f[m];
			}
		}

		localStorage.setItem('com.fm.app.scope', JSON.stringify(store));
	};

	this.load = function () {
		var m, store, blacklist;

		store = JSON.parse(localStorage.getItem('com.fm.app.scope'));

		if (store != null) {
			for (m in store) {
				if (!store.hasOwnProperty(m)) continue;
				if (typeof store[m] === 'string' && store[m].indexOf('function') === 1) {
					f[m] = f.eval(store[m]);
				} else {
					f[m] = store[m];
				}
			}
		}
	};

	this.print = function (_string) {
		var shell, log, recordNode;

		shell = document.getElementById(SELECTOR.SHELL);
		log = shell.querySelector(SELECTOR.LOG);
		recordNode = document.createElement('li');

		recordNode.innerHTML = _string;

		requestAnimationFrame(function() {
			log.appendChild(recordNode);
			recordNode.scrollIntoView();	
		});

		return recordNode;
	};

	this.log = function() {
		var message = "";

		if (arguments.length === 1) {
			message = arguments[0];
		} else {
			message = [].map.call(arguments, function(_arg) {
				return _arg;
			}).join(" / ");
		}

		return this.print(message);
	};

	// ajax script files and eval
	this.install = function (_name) {
		var shell, request, apps;

		shell = this;
		request = f.require("/Creator/apps/"+_name+"/app.js");
		apps = localStorage.getItem("com.fm.apps.list");

		shell.log("Installing "+_name+"...");

		request.then(function () {
			if (apps) {
				apps = apps.split('|');
				if (!~apps.indexOf(_name)) apps.push(_name);
			} else {
				apps = [_name];
			}

			localStorage.setItem("com.fm.apps.list", apps.join('|'));
		});

		return request;
	};

});