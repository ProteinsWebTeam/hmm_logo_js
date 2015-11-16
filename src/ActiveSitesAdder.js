"use strict";

var ActiveSitesAdder;

var isNumeric = function( n ) {
    return !isNaN(parseFloat(n)) && isFinite(n);
};
ActiveSitesAdder = function(options) {

    options = options || {};
    this.cigar = options.cigar || "";
    this.sequence = options.sequence || "";
    this.sequence_start = options.seq_start || 1;
    //this.model_start = options.model_start || 0;
    //this.alignment_start = options.alignment_start || 0;
    //this.sequence_end = options.sequence_end || 0;
    //this.model_end = options.model_end || 0;
    //this.alignment_end = options.alignment_end || 0;
    this.alignment="";
    this.number_shuffled_hits=options.number_shuffled_hits || 0;
    this.columns = [];
};

ActiveSitesAdder.prototype.getColumnFromResidue = function(residue) {
    this.cigar = this.cigar.toUpperCase();
    var value= 1,
        value_str="",
        seq_index=this.sequence_start- 1,
        aln_index = 0,// -(this.model_start-1),
        found=false,
        column=0;

    if (residue <= seq_index)
        return 0;

    var alignment ="";
    for (var i=0;i<this.cigar.length;i++){
        var char = this.cigar[i];
        if (!isNumeric(char)) {
            value = value_str==""?1:parseInt(value_str);
            value_str = "";
            var segment ="";
            switch(char){
                case "I":
                    segment = ".".repeat(value)
                    aln_index += value;
//                    seq_index += value;
                    break;
                case "M":
                    segment = this.sequence.substr(seq_index,value);
                    seq_index += value;
                    aln_index += value;
                    break;
                case "D":
                    segment = "-".repeat(value);
                    aln_index += value;
                    break;
                case "N": case "S": case "H": case "P": case "=": case "X":
                    console.log("command non supported yet:", char);
                    break;
                default:
                    console.log("other command:", char);
            }
            alignment += segment;
            if (residue <= seq_index && !found){
                column = aln_index - (seq_index-(residue-1));
                found =true;
            }
        } else
            value_str = value_str + char;
    }
    this.alignment = alignment;
    if (!found)
        return -1;
    return column+1 -this.number_shuffled_hits;
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