"require Creator:lib/ui/el/el.js";

function Slideshow () {

	this.manifest = null;
	this.loopId = null;

	function flipBuffers (_el) {
		var current = _el.slide.find(".OPEN")[0];
		return current === _el.slide.front ? _el.slide.back : _el.slide.front;
	}

	this.init = function(_node, _name) {
		this.manifest = Slideshow.Manifest.create();
		
		this.manifest.root = Path.create([this.scope.$URL.APP, "models"])
		return this.sup("init", [_node || "ul", _name]);
	};
	
	this.play = function(_manifest) {
		var open = this.slide.find(".OPEN")[0];
		if (_manifest) this.manifest = Slideshow.Manifest.create(_manifest);
		if (this.loopId) this.pause();

		if (open === this.slide.projector) {
			this.slide.projector.node().play();
		} else {
			(function(_show) {
				_show.loopId = setInterval(function() { _show.next(); }, _show.manifest.speed);
			}(this));

			this.next();
		}

		this.body.classes("PLAYING");

		return this;
	};

	this.next = function() {
		var next = flipBuffers(this);
		next.attr("src", this.manifest.next());
	};

	this.previous = function() {
		var prev = flipBuffers(this);
		prev.attr("src", this.manifest.previous());
	};

	this.pause = function() {
		var open = this.slide.find(".OPEN")[0];

		if (open === this.slide.projector) {
			this.slide.projector.node().pause();
		} else {
			clearInterval(this.loopId);
			this.loopId = null;	
		}
		
		this.body.classes().remove("PLAYING");

		return this;
	};

}

Slideshow.Manifest = type(function Manifest () {

	this.root = "apps/ooh/models/";
	this.speed = 20*1000;
	
	this.alloc = function(_manifest) {
		var key;

		for (key in _manifest) {
			if (!_manifest.hasOwnProperty(key)) continue;
			this[key] = _manifest[key];
		}
	};

	this.current = function() {
		return [this.root, this.model, this.files[this.files.index]].join("/");
	};

	this.next = function() {
		this.files.index = (this.files.index == null || this.files.index === this.files.length-1) ? 0 : this.files.index+1;
		return this.current();
	};

	this.previous = function() {
		this.files.index = (this.files.index == null || this.files.index === 0) ? this.files.length-1 : this.files.index-1;
		return this.current();
	};

	this.setModel = function(_model, _files) {
		this.model = _model;
		this.files = _files;
		this.files.index = 0;

		return this;
	};

});

function Controls () {this.define(
	function ready () {
		this.watch("click", this.onClick);
	},

	function onClick (_e) {
		eval(_e.sender.attr("href"), this.body);
		console.log(_e.sender.attr("href"));
		return false;
	}
)}

function Slide (argument) {
	// body...
}

Slideshow.Slide = Slide;

function Buffer () {
	
	this.ready = function(_el) {
		_el.watch("load", function() {
			var current = this.slide.find(".OPEN")[0],
				orientation = this.orientation(),
				delta = 0;

			if (current) {
				current.classes().remove("OPEN");
				current.attr("style", "transform: translate(0, 0)");
			}

			this.classes().remove("landscape", "portrait", "square").add("OPEN", orientation);

			switch (orientation) {
				case "landscape":
					delta = (this.width - this.body.width);
					this.attr("style", "transform: translate("+(-delta)+"px, 0)");
					break;

				case "portrait":
					delta = (this.height - this.body.height);
					this.attr("style", "transform: translate(0, "+(-delta)+"px)");
					break;
			}
		});
		return _el;
	};

	this.orientation = function() {
		if (this.width > this.height) {
			return "landscape";
		} else if (this.width === this.height) {
			return "square";
		}

		return "portrait";
	};

}

function ModelList () {

	this.directory = "models";
	
	this.ready = function(_el) {
		_el.watchEvents();
		_el.template.remove();

		return dir([_el.scope.$URL.APP, _el.directory].join("/")).then(function(_models) {
			_el.build(_models);
			return _el;
		});
	};

	this.watchEvents = function() {
		(function(el) {
			el.watch("click", function(_e) {
				var item = _e.sender,
					folder = Path.create([el.scope.$URL.APP, el.directory, item.data]);

				dir(folder).then(function(_files) {
					el.slideshow.manifest.setModel(item.data, _files);
					el.slideshow.slide.projector.classes().remove("OPEN");
					el.slideshow.slide.projector.node().pause();
					el.slideshow.play();

					el.find(".SELECTED").forEach(function(_item) {
						_item.classes().remove("SELECTED");
					});

					item.classes("SELECTED");
				});
			});
		}(this));
	};

	this.build = function(_list) {
		(function(el) {
			_list.forEach(function(_data) {
				var item = el.template.instantiate();

				item.data = _data;

				item.init(el.template.toTemplate(true)).then(function(_item) {
					el.add(_item);
				});
			});
		}(this));
	};
}

function VideoList () {
	
	this.directory = "videos";

	this.watchEvents = function() {
		(function(el) {
			el.watch("click", function(_e) {
				var item = _e.sender,
					file = Path.create([el.scope.$URL.APP, el.directory, item.data]),
					show = el.slideshow,
					projector = show.slide.projector;

				show.pause()
				show.slide.find(".buffer.OPEN").forEach(function(_buffer) {
					_buffer.classes().remove("OPEN");
				});

				projector.classes("OPEN");

				if (projector.attr("src") === file) {
					projector.node().play();
				} else {
					projector.attr("src", file);	
				}

				el.find(".SELECTED").forEach(function(_item) {
					_item.classes().remove("SELECTED");
				});

				item.classes("SELECTED");
				el.body.classes("PLAYING");
			});
		}(this));
	};

}

define(
	El.extend(Slideshow, Slide, Buffer, ModelList, Controls),
	ModelList.extend(VideoList)
);