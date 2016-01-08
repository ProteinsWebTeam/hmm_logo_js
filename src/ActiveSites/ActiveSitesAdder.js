"use strict";

var ActiveSites   = require("./ActiveSites.js"),
    ActiveSitesPanel = require("./ActiveSitesPanel.js");

var ActiveSitesAdder;

ActiveSitesAdder = function(data, hmm_logo) {
    this.data = data;
    this.hmm_logo = hmm_logo;
    this.panel = null;

    this.resetData = function(data) {
        this.data = data;
        this.panel = null;
    };

    this.process = function(){
        for (var i in this.data){ //for each protein
            var x = new ActiveSites(this.data[i]);
            this.data[i].controller=x;
            for (var j=0;j< this.data[i].residues.length;j++) { // for each residue
                var col = x.getColumnFromResidue(this.data[i].residues[j].residue);
                if (col > 0 ) {
                    this.data[i].residues[j].column = col;
                    this.data[i].residues[j].base = x.sequence[this.data[i].residues[j].residue-1];
                }
            }
            x.sortResidues();
        }
    };

    this.setDrawingOptions = function(options){
        options.hmm_logo = this.hmm_logo;
        options.data = this.data;
        if (this.panel==null)
            this.panel = new ActiveSitesPanel(options);
    };

};

if (typeof module != "undefined")
    module.exports = ActiveSitesAdder;