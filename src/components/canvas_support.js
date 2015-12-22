// checking for canvas support and caching result
var canv_support = null;

function canvasSupport() {
    if (!canv_support) {
        var elem = document.createElement('canvas');
        canv_support = !!(elem.getContext && elem.getContext('2d'));
    }
    return canv_support;
}

if (typeof module != "undefined")
    module.exports = canvasSupport;