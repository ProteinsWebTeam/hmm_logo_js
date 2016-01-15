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
    this.source = options.source || 0;
    this.over=-1;
};



//ActiveSites.prototype.isOver = function(){
//    if (!this.over){
//
//    }
//    this.over=true;
//}
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
ActiveSites.prototype.getSitesHTML = function(column){
    var html = "<ul>";
    for (var i=0; i<this.sites.length; i++){
        var site = this.sites[i],
            css = (column==site.column)?"current_site":"";

        html += "<li class='"+css+"'><i>Column "+site.column+":</i>"+site.base+"</li>";
    }
    return html+"</ul>";
};

ActiveSites.prototype.getProteinsHTML = function(column){
    var html = "<ul>";
    for (var i=0; i<this.proteins.length; i++){
        var p =this.proteins[i];
        html += "<li><a target='_blank' href='http://www.uniprot.org/uniprot/"+p+"'>"+p+"</a></li>";
    }
    return html+"</ul>";
};
if (typeof module != "undefined")
    module.exports = ActiveSites