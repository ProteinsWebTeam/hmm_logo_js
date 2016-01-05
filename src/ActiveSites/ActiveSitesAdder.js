"use strict";

var ActiveSites   = require("./ActiveSites.js"),
    ActiveSitesPanel = require("./ActiveSitesPanel.js");

var ActiveSitesAdder;

ActiveSitesAdder = function(data, hmm_logo) {
    var self = this;
    this.data = data;
    this.hmm_logo = hmm_logo;
    this.panel = null;


    this.process = function(){
        for (var i in data){ //for each protein
            var x = new ActiveSites(data[i]);
            data[i].controller=x;
            for (var j=0;j< data[i].residues.length;j++) { // for each residue
                var col = x.getColumnFromResidue(data[i].residues[j].residue);
                if (col > 0 ) {
                    data[i].residues[j].column = col;
                    data[i].residues[j].base = x.sequence[data[i].residues[j].residue-1];
                }
            }
            x.sortResidues();
        }
    };

    this.setDrawingOptions = function(options){
        options.hmm_logo = this.hmm_logo;
        if (this.panel==null)
            this.panel = new ActiveSitesPanel(options);
    };

};

if (typeof module != "undefined")
    module.exports = ActiveSitesAdder;