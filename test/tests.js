global.jQuery  = global.$ = require("jquery");

var chai        = require('chai'),
    ActiveSitesAdder   = require("../src/ActiveSitesAdder.js");

chai.should();

describe('the alignment class using cigars', function() {
    it('should calculate the sequence coordinate from an alignment', function () {
        var x = new ActiveSitesAdder({
            sequence:   "MDGKPAVSWEEDYEQRVNPELMTELLHNAIPVLKAVQWKVTSVTEGGCESVLPLTKASTNQHGTHQAALISLSADYTGGLALTTLLRGVPLAGIHRCNDEDSASLWLAAMDVKYRNPSTGHLTATCDIPANIARTVQQRYFNGKRVLVTLPVVFTSNGELVAEAEMRYFAQPSIQLKPTKSNPRISPIFKQKLKASARMIAGLRASSESKNIRVDQSHERQAAGPHGELLANRLNGVLPQLKDMVLARTRHIDETLRSVENIEQVVILGVGLDMRPFRMNEELGRPTFFELDLPEMLEERDRVISEMKPDANVNRHSMSADFKVDKISQLLLQNPEFDPKRPTAVVFEGCSMYFTREENQQILSDIASLLQHPDSLVWCDLVRENVVEGTVPSPDIKKFTDGMEELGERFIFGSNSPTDFFLTCDLPQTKSTTVGEFLGSDDPVLATYQFAVGSK",
            alignment:  "........................el---MTELLHNAIPVLKAVQWK....VTSV..T.E....G..GCESV.LP.L.T.K..aS.T.NQ.H...GTHqaalislsadYT.GGLALTT.LL.RG..VPL.AG.IH.RCNDEDS.....A........SL..W..L.A.A.M.DVKYRNPSTGH...LTATCDIP................-ANIART.VQQRYF.N.GK.RVLVTL..P..VV.FTS..N.G.EL.........VAEAEMRYFA--qp.........................................",
            seq_start: 20
        });
        var aln = x.alignment.replace(/[a-z.-]/g,""),
            aln2 = "";

        for (var i= x.seq_start;i< x.sequence.length;i++) {
            var col = x.getColumnFromResidue(i);
            if (col!=-1)
                aln2 += x.sequence[i-1];
        }
        aln.should.equal(aln2);
    });
});