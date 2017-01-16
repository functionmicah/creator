/**
 * Base UI element to represent a file.
 * Pass this element record arround for files
 */

"require ../../el/el.js";

function File () { this.define(
	
	{ path: null },

	function save () {
		// body...
	}
)}

define(
	El.extend(File)
);