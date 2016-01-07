"use strict";

var CanvasButton = require("../components/canvas_button.js");

var ActiveSitesPanel;


ActiveSitesPanel = function(options) {
    var self = this;
    this.margin_to_features = options.margin_to_features || 0;
    this.padding_between_tracks = options.padding_between_tracks || 0;
    this.feature_height = options.feature_height || 10;
    this.hmm_logo = options.hmm_logo || null;
    this.data = options.data || null;

    this.canvas = null;
    this.context =null;
    this.components =[];

    this.offsetY=0;

    var top = 1 + this.margin_to_features+this.padding_between_tracks+this.feature_height/ 2,
        w = this.feature_height* 2,
        h = this.feature_height*6;

    var up_button   = new CanvasButton({x:3, y: top+2,     w: w-6, h: w-6}),
        down_button = new CanvasButton({x:3, y: top+h-w+2, w: w-6, h: w-6});

    this.components.push(up_button);
    this.components.push(down_button);

    up_button.draw = function(context){
        draw_polygone(context,[
            [this.x+this.w/2, this.y],
            [this.x, this.y+this.h],
            [this.x+this.w, this.y+this.h]],
            (this.getState()==this.STATE_NORMAL)?"rgba(255,100,10, 0.3)":"rgba(255,100,10, 1)"
        );
    };
    down_button.draw = function(context){
        draw_polygone(context,[
                [this.x+this.w/2, this.y+this.h],
                [this.x, this.y],
                [this.x+this.w, this.y]],
            (this.getState()==this.STATE_NORMAL)?"rgba(255,100,10, 0.3)":"rgba(255,100,10, 1)"
        );
    };

    up_button.onClick = function(mouse){
        self.offsetY = (self.offsetY<=1)?0:self.offsetY-2;
        self.hmm_logo.refresh();
    };
    down_button.onClick = function(mouse){
        self.offsetY = (self.offsetY>=h-this.feature_height)?h-this.feature_height:self.offsetY+2;
        self.hmm_logo.refresh();
    };
    this.getMouse = function (e) {
        var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;

        // Compute the total offset
        if (element.offsetParent !== undefined) {
            do {
                offsetX += element.offsetLeft;
                offsetY += element.offsetTop;
            } while ((element = element.offsetParent));
        }

        // Add padding and border style widths to offset
        // Also add the offsets in case there's a position:fixed bar
        offsetX += getAmountFromStyle(this.canvas, "paddingLeft") + getAmountFromStyle(this.canvas, "borderLeft") + getAmountFromStyle(this.canvas, "left");
        offsetY += getAmountFromStyle(this.canvas, "paddingTop") + getAmountFromStyle(this.canvas, "borderTop") + getAmountFromStyle(this.canvas, "top");

        mx = e.pageX - offsetX;
        my = e.pageY - offsetY;

        // We return a simple javascript object (a hash) with x and y defined
        return {x: mx, y: my};

    };
    this.initialize_2nd_axis = function(second_axis){
        second_axis = this.hmm_logo.render_2nd_y_axis_label();
        second_axis.addEventListener('mousemove', function(e) {
            var mouse = self.getMouse(e),
                refresh = false;

            for (var i=0;i<self.components.length;i++) {
                var previous = self.components[i].getState();
                self.components[i].mousemove(mouse);
                if (previous != self.components[i].getState())
                    refresh=true;
            }
            if(refresh)
                self._paint_2nd_axis();
        });
        second_axis.addEventListener('click', function(e) {
            var mouse = self.getMouse(e);
            for (var i=0;i<self.components.length;i++)
                self.components[i].click(mouse);
        });
        return second_axis;
    };
    this.paint = function (context_num, start, end) {
        var second_axis = document.getElementById("second_y_axis");
        if (second_axis==null)
            second_axis = this.initialize_2nd_axis();

        this.canvas = second_axis;

        this._paint_2nd_axis(second_axis.getContext('2d'));

        this._paint_background(this.hmm_logo.contexts[context_num]);
        for (var i = start,x=0; i <= end; i++) {
            this._paint_column(context_num,i,x);
            x += this.hmm_logo.zoomed_column;
        }
    };

    this._paint_2nd_axis = function(context){
        context = context || self.context;
        self.context = context;
        context.clearRect(0, top, w, h);
       // var offset = (mode_button.mode==self.MODE_MULTIPLE)?0:w;

        draw_box(context, 0, top, w, h,
            "rgba(100,100,100, 0.2)","rgba(100,100,100, 0.0)"
        );
        for (var i=0;i<self.components.length;i++)
            self.components[i].draw(context);
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
                    self.offsetY + this.margin_to_features + track * (this.padding_between_tracks + this.feature_height),
                    this.hmm_logo.zoomed_column -2,
                    this.feature_height, color,"#AAA0AF");
            } else if (wtd.type == "LINE") {
                draw_line(this.hmm_logo.contexts[context_num],
                    x,
                    self.offsetY + this.margin_to_features + this.padding_between_tracks * track + (track + 0.5) * this.feature_height,
                    x + this.hmm_logo.zoomed_column,
                    self.offsetY + this.margin_to_features + this.padding_between_tracks * track + (track + 0.5) * this.feature_height,
                    "#AAA0AF");
            }
            if (this.multiple_tracks)
                track++;
        }
    };
    this._paint_background = function(context){
        draw_box(context, 0, top, context.canvas.width, h,
            "rgba(100,100,100, 0.2)","rgba(100,100,100, 0.0)"
        );
    };
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
    function draw_circle(context,x,y,radius,color) {
        context.fillStyle = color;
        context.strokeStyle = color;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI*2, true);
        context.fill();
    }
};

function getAmountFromStyle(element,attribute){
    var value = parseInt(element.style[attribute]);
    return (isNaN(value))?0:value;
}

if (typeof module != "undefined")
    module.exports = ActiveSitesPanel;
