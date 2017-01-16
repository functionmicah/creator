(function() {

	function evaluate (_source) {
		return eval(_source);
	}

	window.document.addEventListener("DOMContentLoaded", function() {
		var ready, data;

		data = JSON.parse("{"+location.search
			.slice(1)
			.split("&")
			.map(function(_pair) {
				var parts = _pair.split("=");
				return ["\"", parts[0], "\": \"", parts[1], "\""].join("");
			})+"}");

		ready = new CustomEvent("frame-"+data.id+"-ready", { bubbles: false, detail: {
			evaluate: evaluate,
			window: window,
			id: data.id
		}});

		parent.document.dispatchEvent(ready);

		console.log("frame", data.id, "loaded");
	});
}());