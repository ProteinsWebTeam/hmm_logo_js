/**
 * Created by gsalazar on 05/01/2016.
 */
"use strict";

var CanvasButton;

CanvasButton = function(options) {
    options = options || {};
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.w = options.w || 10;
    this.h = options.h || 10;
    this.color = options.color || "#000000";
    this.hover_color = options.hover_color || "#882222";

    this.STATE_NORMAL = 0;
    this.STATE_CLICKED = 1;
    this.STATE_MOUSE_OVER = 2

    var state = this.STATE_NORMAL;

    this.getState = function(){
        return state;
    };
    this.draw = function(context){
        context.fillStyle = ((state==this.STATE_NORMAL)?this.color:this.hover_color);
        context.fillRect(this.x, this.y, this.w, this.h);
    };

    this.mousemove = function(mouse){
        switch (state){
            case this.STATE_NORMAL:
                if (mouse.x>this.x && mouse.x<this.x+this.w && mouse.y>this.y && mouse.y<this.y+this.h)
                    state = this.STATE_MOUSE_OVER;
                break;
            case this.STATE_MOUSE_OVER:
                if (mouse.x<this.x || mouse.x>this.x+this.w || mouse.y<this.y || mouse.y>this.y+this.h)
                    state = this.STATE_NORMAL;
                break;
        }
    }
    this.click = function(mouse){
        if (state==this.STATE_MOUSE_OVER){
            this.onClick(mouse);
        }
    }
    this.onClick = function(mouse) {};
    this.onActionPerformed = function() {
        state = this.STATE_NORMAL;
    };
    this.onMouseOver = function(){
    }
    this.onMouseOut = function(){
        state = this.STATE_NORMAL;
    }
};

if (typeof module != "undefined")
    module.exports = CanvasButton