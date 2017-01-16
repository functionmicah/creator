"require ../el/el.js";
"require ../../helpers.js"

function Loader () {

	function toBeeds () { return ":"; }
	function toBars () { return "-"; }

	this.define(

		{
			scale: 1,
			total: 0,
			complete: 0,
		},

		function ready (_loader) {
			this.total = 0;
			this.complete = 0;

			this.window.watch("loader-q", function(_e) {
				_loader.total += _e.data || 1;
			});

			this.window.watch("loader-progress", function(_e) {
				_loader.progress();
			});
		},

		function progress (_ratio) {
			var ratio, beeds, bars;

			if (_ratio == null) this.complete < this.total && (this.complete += 1);

			ratio = _ratio || this.complete/this.total;
			beeds = array(Math.floor(ratio*10) * this.scale);
			bars = array(Math.ceil((1-ratio)*10) * this.scale);

			this.loaded.text(" "+beeds.map(toBeeds).join(""));
			this.remaining.text(bars.map(toBars).join(""));

			return this;
		}
	)
}

define(
	El.extend(Loader)
);