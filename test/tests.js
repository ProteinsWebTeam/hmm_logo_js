
var chai        = require('chai'),
    ActiveSitesAdder   = require("../src/ActiveSitesAdder.js"),
    canvasSupport   = require("../src/components/canvas_support.js"),
    ConsensusColors   = require("../src/components/consensus_colors.js"),
    Letter   = require("../src/components/letter.js"),
    HMMLogo = require("../src/components/hmm_logo_canvas.js"),
    jsdom    = require( 'jsdom'),
    $ = null;

chai.should();

// requires your main app (specified in index.js)
var window = jsdom.jsdom();

describe('the alignment class using cigars', function() {
    it('should calculate the sequence coordinate from an alignment', function () {
        var x = new ActiveSitesAdder({
            sequence:   "MDGKPAVSWEEDYEQRVNPELMTELLHNAIPVLKAVQWKVTSVTEGGCESVLPLTKASTNQHGTHQAALISLSADYTGGLALTTLLRGVPLAGIHRCNDEDSASLWLAAMDVKYRNPSTGHLTATCDIPANIARTVQQRYFNGKRVLVTLPVVFTSNGELVAEAEMRYFAQPSIQLKPTKSNPRISPIFKQKLKASARMIAGLRASSESKNIRVDQSHERQAAGPHGELLANRLNGVLPQLKDMVLARTRHIDETLRSVENIEQVVILGVGLDMRPFRMNEELGRPTFFELDLPEMLEERDRVISEMKPDANVNRHSMSADFKVDKISQLLLQNPEFDPKRPTAVVFEGCSMYFTREENQQILSDIASLLQHPDSLVWCDLVRENVVEGTVPSPDIKKFTDGMEELGERFIFGSNSPTDFFLTCDLPQTKSTTVGEFLGSDDPVLATYQFAVGSK",
            alignment:  "........................el---MTELLHNAIPVLKAVQWK....VTSV..T.E....G..GCESV.LP.L.T.K..aS.T.NQ.H...GTHqaalislsadYT.GGLALTT.LL.RG..VPL.AG.IH.RCNDEDS.....A........SL..W..L.A.A.M.DVKYRNPSTGH...LTATCDIP................-ANIART.VQQRYF.N.GK.RVLVTL..P..VV.FTS..N.G.EL.........VAEAEMRYFA--qp.........................................",
            seq_start: 20,
            ali_start: 22,
            ali_end: 170
        });
        var aln = x.alignment.replace(/[a-z.-]/g,""),
            aln2 = "";

        for (var i= x.seq_start;i< x.sequence.length;i++) {
            var col = x.getColumnFromResidue(i);
            if (col!=-1)
                aln2 += x.sequence[i-2];//the -2 might be related with the difference between the ali_start and the seq_start
        }
        aln.should.include(aln2);
    });
});

describe('the refactoring of the hmm-logo in several files', function() {
    before(function () {
        jsdom.env(
            "<html><body></body></html>",
            function (err, window) {
                global.window = window;
                global.document = window.document;
                $ = global.jQuery= global.$ = require('jquery');
            }
        );
//        $ = require('jquery')(window);
    })
    it('should be able to check if there is support for canvas', function(){
        canvasSupport().should.be.equal(false);// jscdom doesn't support  canvas
    });

    it('should be able to use the consensus colors', function(){
        var cc = new ConsensusColors(),
            probs_arr=[
                ["W:0.004","C:0.011","Y:0.015","F:0.016","H:0.017","M:0.019","P:0.020","I:0.031","D:0.032","G:0.034","N:0.036","Q:0.037","L:0.042","R:0.043","V:0.044","E:0.049","K:0.055","S:0.074","A:0.083","T:0.338"],
                ["W:0.005","C:0.008","Y:0.018","F:0.018","P:0.020","M:0.021","H:0.025","G:0.031","I:0.033","V:0.046","D:0.048","Q:0.057","R:0.060","N:0.067","A:0.072","L:0.074","E:0.076","K:0.078","S:0.079","T:0.162"]
            ];
        var cmap = cc.color_map(probs_arr);
        var color = cmap[0]["W"];
        color.should.be.equal("#7a7a7a")

    });

    it('should be able to create an instance  use Letter',function(){
        var letter = new Letter("W");
        letter.width.should.be.equal(130);
        //the use of the draw method requires canvas and it is not enable in jsdom
    });

    it('should be able to create an instance  hmm_logo_canvas',function(){

        var logo = new HMMLogo({
            data:{
                alphabet:null,
                height_arr:2
            }
        });
        logo.should.not.be.equal(null);
        Object.keys(logo.colors).length.should.be.above(0);
    });
});