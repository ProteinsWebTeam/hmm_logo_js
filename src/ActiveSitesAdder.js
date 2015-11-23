"use strict";

var ActiveSitesAdder;

var isNumeric = function( n ) {
    return !isNaN(parseFloat(n)) && isFinite(n);
};
ActiveSitesAdder = function(options) {

    options = options || {};
    this.cigar = options.cigar || "";
    this.sequence = options.sequence || "";
    this.seq_start = options.seq_start || 1;
    this.model_start = options.model_start || 0;
    this.alignment_start = options.alignment_start || 0;
    //this.sequence_end = options.sequence_end || 0;
    //this.model_end = options.model_end || 0;
    //this.alignment_end = options.alignment_end || 0;
    this.alignment=options.alignment || "";
    this.columns = [];
};


ActiveSitesAdder.prototype.getColumnFromResidue =function(residue){
    var i =this.seq_start - 1,
        col=0;

    for (var k=0;k<this.alignment.length;k++) {
        var c = this.alignment[k];
        if (c == ".")
            continue;
        else if (c == "-")
            col++;
        else if (c == c.toUpperCase()) {
            col++;
            i++;
        } else {
            i++;
            if (i==residue)
                return -1
        }
        if (i==residue)
            return col
    }
    return -1

};


ActiveSitesAdder.prototype.whatShouldBeDraw = function(column){
    if (this.columns.length<1)
        return null;
    for (var i=0; i<this.columns.length;i++) {
        if (this.columns[i].col == column) {
            this.columns[i].type = "BLOCK";
            return this.columns[i];
        }
    }
    if (this.columns[0].col<column && column<this.columns[this.columns.length-1].col) {
        this.columns[0].type = "LINE";
        return this.columns[0];
    }
    return null;
}
ActiveSitesAdder.prototype.setColumns = function(columns){
    this.columns = columns.sort(function(a, b) { return a.col - b.col; });
}
if (typeof module != "undefined")
    module.exports = ActiveSitesAdder