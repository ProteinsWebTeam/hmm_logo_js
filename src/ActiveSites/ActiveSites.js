"use strict";

var ActiveSites;

var isNumeric = function( n ) {
    return !isNaN(parseFloat(n)) && isFinite(n);
};
ActiveSites = function(options) {

    // All this coordinates start in 1
    options = options || {};
    this.name = options.name || "";
    this.sites = options.active_sites || 1;
    this.proteins = options.proteins || 0;
};



ActiveSites.prototype.whatShouldBeDraw = function(column){
    for (var i=0; i<this.sites.length;i++) {
        if (this.sites[i].column == column) {
            this.sites[i].type = "BLOCK";
            return this.sites[i];
        }
    }
    if (this.sites[0].column<column && column<this.sites[this.sites.length-1].column) {
        this.sites[0].type = "LINE";
        return this.sites[0];
    }
    return null;
};
ActiveSites.prototype.sortSites = function(columns){
    this.sites = this.sites.sort(function(a, b) {
        if (typeof a.column == "undefined") return -1;
        if (typeof b.column == "undefined") return 1;
        return a.column - b.column;
    });
};

if (typeof module != "undefined")
    module.exports = ActiveSites