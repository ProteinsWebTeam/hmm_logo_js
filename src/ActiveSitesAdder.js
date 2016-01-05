var ActiveSites   = require("../src/ActiveSites.js");


var ActiveSitesAdder;

ActiveSitesAdder = function(data, hmm_logo) {
    this.data = data;
    this.hmm_logo = hmm_logo;

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
        this.margin_to_features = options.margin_to_features || 0;
        this.padding_between_tracks = options.padding_between_tracks || 0;
        this.feature_height = options.feature_height || 10;
    };

    this.paint = function (context_num, start, end) {
        var second_axis = document.getElementById("second_y_axis");
        if (second_axis==null)
            second_axis = this.hmm_logo.render_2nd_y_axis_label();

        this._paint_2nd_axis(second_axis.getContext('2d'));

        this._paint_background(this.hmm_logo.contexts[context_num]);
        for (var i = start,x=0; i <= end; i++) {
            this._paint_column(context_num,i,x);
            x += this.hmm_logo.zoomed_column;
        }
    };

    this._paint_2nd_axis = function(context){
        var top = 1 + this.margin_to_features+this.padding_between_tracks+this.feature_height/ 2,
            w = this.feature_height* 2,
            h = this.feature_height*6;
        context.clearRect(0, top, w, h);

        draw_box(context, 0, top, w, h,
            "rgba(100,100,100, 0.2)","rgba(100,100,100, 0.0)"
        );

        draw_polygone(context,[
            [w/2,top+2],
            [2,top+w],
            [w-2,top+w]],"rgba(255,10,10, 0.3)"
        );
        draw_polygone(context,[
            [w/2,top+h-2],
            [2,top+h-w],
            [w-2,top+h-w]],"rgba(255,10,10, 0.3)"
        );
    };
    this._paint_column = function(context_num,i,x) {
        var track =1;
        for (var j in this.data){
            var wtd = this.data[j].controller.whatShouldBeDraw(i);
            if (wtd == null)
                continue;
            var color = this.hmm_logo.aa_colors[wtd.base];
            if (wtd.type == "BLOCK") {
                draw_box(   this.hmm_logo.contexts[context_num],
                    x + 1,
                    this.margin_to_features + track * (this.padding_between_tracks + this.feature_height),
                    this.hmm_logo.zoomed_column -2,
                    this.feature_height, color,"#AAA0AF");
            } else if (wtd.type == "LINE") {
                draw_line(this.hmm_logo.contexts[context_num],
                    x,
                    this.margin_to_features + this.padding_between_tracks * track + (track + 0.5) * this.feature_height,
                    x + this.hmm_logo.zoomed_column,
                    this.margin_to_features + this.padding_between_tracks * track + (track + 0.5) * this.feature_height,
                    "#AAA0AF");
            }
            if (this.multiple_tracks)
                track++;
        }
    };
    this._paint_background = function(context){
        draw_box(context,
            0,
            this.margin_to_features+this.padding_between_tracks+this.feature_height/2,
            context.canvas.width,
            this.feature_height*6,
            "rgba(100,100,100, 0.2)","rgba(100,100,100, 0.0)");
    }
    function draw_box(context, x, y, width, height, color,border) {
        color = color || "rgba(100,100,100, 0.2)";
        border = border || "rgba(100,100,100, 0.8)";
        context.fillStyle = color;
        context.strokeStyle = border;
        context.fillRect(x, y, width, height);
        context.strokeRect(x, y, width, height);
    }
    function draw_line(context, x1, y1, x2, y2, color) {
        color = color || "rgba(100,100,100, 0.8)";
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.lineWidth = 1;
        context.strokeStyle = color;
        context.stroke();
    }
    function draw_polygone(context,points,color) {
        context.fillStyle = color;
        context.strokeStyle = color;
        context.beginPath();
        context.moveTo(points[0][0],points[0][1]);
        for (var i=1;i<points.length;i++)
            context.lineTo(points[i][0],points[i][1]);
        context.fill();

    }
};

if (typeof module != "undefined")
    module.exports = ActiveSitesAdder;