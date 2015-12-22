"use strict";

var ActiveSitesAdder;

var isNumeric = function( n ) {
    return !isNaN(parseFloat(n)) && isFinite(n);
};
ActiveSitesAdder = function(options) {

    // All this coordinates start in 1
    options = options || {};
    this.sequence = options.sequence || "";
    this.seq_start = options.seq_start || 1;
    this.model_start = options.model_start || 0;
    this.alignment_start = options.ali_start || 0;
    this.sequence_end = options.sequence_end || 0;
    this.model_end = options.model_end || 0;
    this.alignment_end = options.ali_end || 0;
    this.alignment = options.alignment || "";
    this.residues = options.residues || [];
};


ActiveSitesAdder.prototype.getColumnFromResidue =function(residue){
    if (residue<this.seq_start)
        return-1;

    var i =this.seq_start,
        col=0;


    for (var k=this.alignment_start;k<this.alignment_end;k++) {
        var c = this.alignment[k-1];
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
    for (var i=0; i<this.residues.length;i++) {
        if (this.residues[i].column == column) {
            this.residues[i].type = "BLOCK";
            return this.residues[i];
        }
    }
    if (this.residues[0].column<column && column<this.residues[this.residues.length-1].column) {
        this.residues[0].type = "LINE";
        return this.residues[0];
    }
    return null;
};
ActiveSitesAdder.prototype.sortResidues = function(columns){
    this.residues = this.residues.sort(function(a, b) {
        if (typeof a.column == "undefined") return -1;
        if (typeof b.column == "undefined") return 1;
        return a.column - b.column;
    });
};

if (typeof module != "undefined")
    module.exports = ActiveSitesAdder