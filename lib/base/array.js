/**
 * Basic array
 */

function fmArray () {}

fmArray.prototype = [];

Object.defineProperty(fmArray, "constructor", {
	value: fmArray,
	writeable: false,
	enumerable: false,
	configureable: false
});

module.exports = type(fmArray);