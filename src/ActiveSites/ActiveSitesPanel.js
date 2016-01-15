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

    var top = 1 + this.margin_to_features+this.padding_between_tracks+this.feature_height/ 2,
        w = this.feature_height* 2,
        h = this.feature_height*6;

    this.offsetY=0;
    this.top_limit=0;
    this.bottom_limit=h-2*this.feature_height;

    this.addedEvents=false;

    var up_button   = new CanvasButton({x:3, y: top+2,     w: w-6, h: w-6}),
        down_button = new CanvasButton({x:3, y: top+h-w+2, w: w-6, h: w-6});

    this.components.push(up_button);
    this.components.push(down_button);

    // create an empty <span>
    var dragImgEl = document.createElement('span');
    dragImgEl.setAttribute('style',
        'position: absolute; display: block; top: 0; left: 0; width: 0; height: 0;' );
    document.body.appendChild(dragImgEl);

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

    up_button.onClick = function(){
        self.offsetY = (self.offsetY<=self.bottom_limit)?self.bottom_limit:self.offsetY-1;
        self.hmm_logo.refresh();
    };
    down_button.onClick = function(){
        self.offsetY = (self.offsetY>=self.top_limit)?self.top_limit:self.offsetY+1;
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
        return second_axis;
    };
    this.addEvents = function(second_axis,logo_canvas){
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
//            for (var i=0;i<self.components.length;i++)
//                self.components[i].click(mouse);
        });
        second_axis.addEventListener('mousedown', function(e) {
            var mouse = self.getMouse(e);
            self.timer = setInterval( function(){
                for (var i=0;i<self.components.length;i++)
                    self.components[i].click(mouse);

            }, 20 );

        });
        second_axis.addEventListener('mouseup', function(e) {
            var mouse = self.getMouse(e);
            clearInterval(self.timer);
            for (var i=0;i<self.components.length;i++)
                self.components[i].click(mouse);
        });
        var y_axis = document.getElementsByClassName("logo_yaxis")[0],
            prevY=null;

        y_axis.addEventListener('dragstart', function(e) {
            //e.dataTransfer.setDragImage(null,0,0);

            e.dataTransfer.setDragImage(dragImgEl, 0, 0);
            var mouse = self.getMouse(e);
            if (top< mouse.y && mouse.y<top+h-self.feature_height) {
                prevY=mouse.y;
            }
        });

        y_axis.addEventListener('drag', function(e) {
            var mouse = self.getMouse(e);
            if (top< mouse.y && mouse.y<top+h-self.feature_height) {
                if (prevY!=null) {
                    var deltaY = mouse.y - prevY;
                    if (self.offsetY + deltaY>= self.top_limit){
                        self.offsetY = self.top_limit;
                    }else if (self.offsetY + deltaY<= self.bottom_limit) {
                        self.offsetY = self.bottom_limit;
                    }else
                        self.offsetY = self.offsetY + deltaY;

                    self.hmm_logo.refresh();
                }
                prevY=mouse.y;
            }
        });
        y_axis.addEventListener('dragstart', function(e) {
            prevY=null;
        });

        logo_canvas.addEventListener("mousemove",function(evt){
            var mouse = self.getMouse(evt),
                box = this.getBoundingClientRect(),
                offset = box.left + window.pageXOffset - document.documentElement.clientLeft,
                x = parseInt((evt.pageX - offset), 10),
                col = self.hmm_logo.columnFromCoordinates(x),
                track=self.get_track_from_y(mouse.y),
                refresh=false,
                clear=false;
            if (top< mouse.y && mouse.y<top+h){
                if (typeof self.active_sites_in_canvas[col] != "undefined" && typeof self.active_sites_in_canvas[col][track] != "undefined") {
                    var site = self.active_sites_in_canvas[col][track];
                    if (site.controller.over==-1) {
                        for (var i in self.active_sites_in_canvas)
                            for (var j in self.active_sites_in_canvas[i])
                                self.active_sites_in_canvas[i][j].controller.over=-1;
                        refresh=true;
                        site.controller.over=col;
                    }
                } else
                    clear = true;
            }else
                clear = true;
            if (clear)
                for (var i in self.active_sites_in_canvas)
                    for (var j in self.active_sites_in_canvas[i]) {
                        if (self.active_sites_in_canvas[i][j].controller.over!=-1)
                            refresh=true;
                        self.active_sites_in_canvas[i][j].controller.over = -1;
                    }
            if(refresh)
                self.hmm_logo.refresh();
        });
        logo_canvas.addEventListener("click",function(evt){
            for (var i in self.active_sites_in_canvas)
                for (var j in self.active_sites_in_canvas[i]) {
                    var controller = self.active_sites_in_canvas[i][j].controller;
                    if (controller.over != -1) {
                        var site_e = document.getElementById("active_site_info");
                        if (site_e!=null) site_e.innerHTML =
                            "<h2>Active Site Pattern</h2>" +
                            "<ul>" +
                            "   <li><b>Name:</b>"   + controller.name   + "</li>" +
                            "   <li><b>Source:</b>" + controller.source + "</li>" +
                            "   <li><b>Sites:</b>" + controller.getSitesHTML(controller.over) + "</li>" +
                            "   <li><b>Reported Proteins:</b>" + controller.getProteinsHTML(controller.over) + "</li>" +
                            "</ul>";
                    }
                }

        });
        this.bottom_limit = h - (Object.keys(self.data).length+0.5) * (this.feature_height +this.padding_between_tracks)
        this.addedEvents=true;
    };
    this.get_track_from_y = function(y){
        return Math.floor((y - self.offsetY - this.margin_to_features)/(this.padding_between_tracks + this.feature_height));
    };
    this.active_sites_in_canvas={};
    this.paint = function (context_num, start, end) {
        var second_axis = document.getElementById("second_y_axis");
        if (second_axis==null)
            second_axis = this.initialize_2nd_axis();
        this.canvas = second_axis;

        this._paint_2nd_axis(second_axis.getContext('2d'));

        this._paint_background(this.hmm_logo.contexts[context_num]);
        this.active_sites_in_canvas={};
        for (var i = start,x=0; i <= end; i++) {
            this._paint_column(context_num,i,x);
            x += this.hmm_logo.zoomed_column;
        }

        this.hmm_logo.paint_y_axis_label();

        if (!this.addedEvents)
            this.addEvents(second_axis,document.getElementsByClassName("logo_graphic")[0]);

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
        var track =0;
        for (var j=0; j<this.data.length;j++) {
            track++;
            var wtd = this.data[j].controller.whatShouldBeDraw(i);
            if (wtd == null)
                continue;
            var color = this.hmm_logo.aa_colors[wtd.base],
                y1 = self.offsetY + this.margin_to_features + track * (this.padding_between_tracks + this.feature_height);

            if (top<y1 && y1<top+h-this.feature_height) {
                if (wtd.type == "BLOCK") {
                    if (typeof this.active_sites_in_canvas[i] == "undefined")
                        this.active_sites_in_canvas[i]={};
                    this.active_sites_in_canvas[i][track]=this.data[j];
                    draw_box(this.hmm_logo.contexts[context_num],
                        x + 1,
                        self.offsetY + this.margin_to_features + track * (this.padding_between_tracks + this.feature_height),
                        this.hmm_logo.zoomed_column - 2,
                        this.feature_height, color,
                        (this.data[j].controller.over==i)?"#000":"#AAA0AF");
                } else if (wtd.type == "LINE") {
                    draw_line(this.hmm_logo.contexts[context_num],
                        x,
                        self.offsetY + this.margin_to_features + this.padding_between_tracks * track + (track + 0.5) * this.feature_height,
                        x + this.hmm_logo.zoomed_column,
                        self.offsetY + this.margin_to_features + this.padding_between_tracks * track + (track + 0.5) * this.feature_height,
                        "#AAA0AF");
                }
            }
        }
    };
    this._paint_background = function(context){
        draw_box(context, 0, top-1, context.canvas.width, h,
            "rgba(100,100,100, 0.2)","rgba(100,100,100, 0.0)"
        );
    };
    this.paintLabels = function(context){
        draw_box(context, 0, top, context.canvas.width, h,
            "rgba(100,100,100, 0.2)","rgba(100,100,100, 0.0)"
        );
        context.fillStyle = "#666666";
        context.strokeStyle = "#666666";
        context.textAlign = "right";
        var track =0;
        for (var j=0; j<this.data.length;j++) {
            track++;
            var y1 = self.offsetY + this.margin_to_features + track * (this.padding_between_tracks + this.feature_height);
            if (top<y1 && y1<top+h-this.feature_height) {
                var y2 =self.offsetY + this.margin_to_features + this.padding_between_tracks * track + (track + 0.5) * this.feature_height;
                var fs = 12 - 4*Math.abs(1-(y2-top)/(h/2));
                context.font = "bold "+fs+"px Arial";
                context.fillText(
                    this.data[j].name,
                    53,
                    y2
                );
            }
        }
        context.font = "bold 10px Arial";
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
