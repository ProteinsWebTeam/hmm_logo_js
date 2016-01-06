if (typeof module != "undefined")
    var Letter = require("./letter.js"),
        canvasSupport   = require("./canvas_support.js"),
        ConsensusColors = require("./consensus_colors.js");


var feature_height = 10,
    margin_to_features = 10,
    padding_between_tracks=4;

function HMMLogo(options) {
    options = options || {};

    this.column_width = options.column_width || 34;
    this.height = options.height || 300;
    this.data = options.data || null;
    this.debug = options.debug || null;
    this.scale_height_enabled = options.height_toggle || null;
    if (options.zoom_buttons && options.zoom_buttons === 'disabled') {
        this.zoom_enabled = null;
    } else {
        this.zoom_enabled = true;
    }


    this.colorscheme = options.colorscheme || 'default';

    // never show the alignment coordinates by default as that would get
    // really confusing.
    this.display_ali_map = 0;

    this.alphabet = options.data.alphabet || 'dna';
    this.dom_element = options.dom_element || $('body');
    this.called_on = options.called_on || null;
    this.start = options.start || 1;
    this.end = options.end || this.data.height_arr.length;
    this.zoom = parseFloat(options.zoom) || 0.4;
    this.default_zoom = this.zoom;

    this.active_sites_sources = options.active_sites_sources || null;
    this.show_active_sites = false;
    this.multiple_tracks=false;
    this.active_sites_adder = null;

    // turn off the insert rows if the hmm used the observed or weighted processing flags.
    if (this.data.processing && /^observed|weighted/.test(this.data.processing)) {
        this.show_inserts = 0;
        this.info_content_height = 286;
    } else {
        this.show_inserts = 1;
        this.info_content_height = 256;
    }


    if (options.scaled_max) {
        this.data.max_height = options.data.max_height_obs || this.data.max_height || 2;
    } else {
        this.data.max_height = options.data.max_height_theory || this.data.max_height || 2;
    }


    this.dna_colors = {
        'A': '#cbf751',
        'C': '#5ec0cc',
        'G': '#ffdf59',
        'T': '#b51f16',
        'U': '#b51f16'
    };

    this.aa_colors = {
        'A': '#FF9966',
        'C': '#009999',
        'D': '#FF0000',
        'E': '#CC0033',
        'F': '#00FF00',
        'G': '#f2f20c',
        'H': '#660033',
        'I': '#CC9933',
        'K': '#663300',
        'L': '#FF9933',
        'M': '#CC99CC',
        'N': '#336666',
        'P': '#0099FF',
        'Q': '#6666CC',
        'R': '#990000',
        'S': '#0000FF',
        'T': '#00FFFF',
        'V': '#FFCC33',
        'W': '#66CC66',
        'Y': '#006600'
    };

    // set the color library to use.
    this.colors = this.dna_colors;

    if (this.alphabet === 'aa') {
        this.colors = this.aa_colors;
    }

    this.canvas_width = 5000;

    var letter = null,
        probs_arr = null,
        loptions = null,
        cc = null;

    if (this.alphabet === 'aa') {
        probs_arr = this.data.probs_arr;
        if (probs_arr) {
            cc = new ConsensusColors();
            this.cmap = cc.color_map(probs_arr);
        }
    }

    //build the letter canvases
    this.letters = {};

    for (letter in this.colors) {
        if (this.colors.hasOwnProperty(letter)) {
            loptions = {color: this.colors[letter]};
            this.letters[letter] = new Letter(letter, loptions);
        }
    }

    // this needs to be set to null here so that we can initialise it after
    // the render function has fired and the width determined.
    this.scrollme = null;

    this.previous_target = 0;
    // keeps track of which canvas elements have been drawn and which ones haven't.
    this.rendered = [];
    this.previous_zoom = 0;

    function draw_small_insert(context, x, y, col_width, in_odds, in_length, del_odds, show_inserts) {
        var fill = "#ffffff";
        if (show_inserts) {
            if (in_odds > 0.1) {
                fill = '#d7301f';
            } else if (in_odds > 0.05) {
                fill = '#fc8d59';
            } else if (in_odds > 0.03) {
                fill = '#fdcc8a';
            }
            context.fillStyle = fill;
            context.fillRect(x, y + 15, col_width, 10);

            fill = "#ffffff";
            // draw insert length
            if (in_length > 9) {
                fill = '#d7301f';
            } else if (in_length > 7) {
                fill = '#fc8d59';
            } else if (in_length > 4) {
                fill = '#fdcc8a';
            }
            context.fillStyle = fill;
            context.fillRect(x, y + 30, col_width, 10);
        } else {
            y  = y + 30;
        }

        fill = "#ffffff";
        // draw delete odds
        if (del_odds < 0.75) {
            fill = '#2171b5';
        } else if (del_odds < 0.85) {
            fill = '#6baed6';
        } else if (del_odds < 0.95) {
            fill = '#bdd7e7';
        }
        context.fillStyle = fill;
        context.fillRect(x, y, col_width, 10);
    }

    function draw_border(context, y, width) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.lineWidth = 1;
        context.strokeStyle = "#999999";
        context.stroke();
    }

    function draw_ticks(context, x, y, height, color) {
        color = color || '#999999';
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x, y + height);
        context.lineWidth = 1;
        context.strokeStyle = color;
        context.stroke();
    }

    function draw_rect_with_text(context, x, y, text, fontsize, col_width, fill, textfill) {
        context.font = fontsize + "px Arial";
        context.fillStyle = fill;
        context.fillRect(x, y - 10, col_width, 14);
        context.textAlign = "center";
        context.fillStyle = textfill;
        context.fillText(text, x + (col_width / 2), y);
    }

    function draw_insert_odds(context, x, height, col_width, text, fontsize) {
        var y        = height - 20,
            fill     = '#ffffff',
            textfill = '#555555';

        if (text > 0.1) {
            fill     = '#d7301f';
            textfill = '#ffffff';
        } else if (text > 0.05) {
            fill = '#fc8d59';
        } else if (text > 0.03) {
            fill = '#fdcc8a';
        }

        draw_rect_with_text(context, x, y, text, fontsize, col_width, fill, textfill);

        //draw vertical line to indicate where the insert would occur
        if (text > 0.03) {
            draw_ticks(context, x + col_width, height - 30, -30 - height, fill);
        }
    }

    function draw_insert_length(context, x, y, col_width, text, fontsize) {
        var fill = '#ffffff',
            textfill = '#555555';

        if (text > 9) {
            fill     = '#d7301f';
            textfill = '#ffffff';
        } else if (text > 7) {
            fill = '#fc8d59';
        } else if (text > 4) {
            fill = '#fdcc8a';
        }
        draw_rect_with_text(context, x, y, text, fontsize, col_width, fill, textfill);
    }

    function draw_delete_odds(context, x, height, col_width, text, fontsize, show_inserts) {
        var y        = height - 4,
            fill     = '#ffffff',
            textfill = '#555555';

        if (show_inserts) {
            y = height - 35;
        }

        if (text < 0.75) {
            fill     = '#2171b5';
            textfill = '#ffffff';
        } else if (text < 0.85) {
            fill = '#6baed6';
        } else if (text < 0.95) {
            fill = '#bdd7e7';
        }

        draw_rect_with_text(context, x, y, text, fontsize, col_width, fill, textfill);
    }


    function draw_column_number(context, x, y, col_width, col_num, fontsize, right) {
        context.font = fontsize + "px Arial";
        context.textAlign = right ? "right" : "center";
        context.fillStyle = "#666666";
        context.fillText(col_num, x + (col_width / 2), y);
    }


    function attach_canvas(DOMid, height, width, id, canv_width) {
        var canvas = $(DOMid).find('#canv_' + id);

        if (!canvas.length) {
            $(DOMid).append('<canvas class="canvas_logo" id="canv_' + id + '"  height="' + height + '" width="' + width + '" style="left:' + canv_width * id + 'px"></canvas>');
            canvas = $(DOMid).find('#canv_' + id);
        }

        $(canvas).attr('width', width).attr('height', height);

        if (!canvasSupport()) {
            canvas[0] = G_vmlCanvasManager.initElement(canvas[0]);
        }

        return canvas[0];
    }

    // the main render function that draws the logo based on the provided options.
    this.render = function (options) {
        if (!this.data) {
            return;
        }
        options    = options || {};
        var zoom   = options.zoom || this.zoom,
            target = options.target || 1,
            scaled = options.scaled || null,
            parent_width = $(this.dom_element).parent().width(),
            max_canvas_width = 1,
            end = null,
            start = null,
            i = 0;

        if (target === this.previous_target) {
            return;
        }

        this.previous_target = target;


        if (options.start) {
            this.start = options.start;
        }
        if (options.end) {
            this.end = options.end;
        }

        if (zoom <= 0.1) {
            zoom = 0.1;
        } else if (zoom >= 1) {
            zoom = 1;
        }

        this.zoom = zoom;

        end = this.end || this.data.height_arr.length;
        start = this.start || 1;
        end     = (end > this.data.height_arr.length) ? this.data.height_arr.length : end;
        end     = (end < start) ? start : end;

        start     = (start > end) ? end : start;
        start     = (start > 1) ? start : 1;

        this.y = this.height - 20;
        // Check to see if the logo will fit on the screen at full zoom.
        this.max_width = this.column_width * ((end - start) + 1);
        // If it fits then zoom out and disable zooming.
        if (parent_width > this.max_width) {
            zoom = 1;
            this.zoom_enabled = false;
        }
        this.zoom = zoom;

        this.zoomed_column = this.column_width * zoom;
        this.total_width = this.zoomed_column * ((end - start) + 1);

        // If zoom is not maxed and we still aren't filling the window
        // then ramp up the zoom level until it fits, then disable zooming.
        // Then we get a decent logo with out needing to zoom in or out.
        if (zoom < 1) {
            while (this.total_width < parent_width) {
                this.zoom += 0.1;
                this.zoomed_column = this.column_width * this.zoom;
                this.total_width = this.zoomed_column * ((end - start) + 1);
                this.zoom_enabled = false;
                if (zoom >= 1) {
                    break;
                }
            }
        }

        if (target > this.total_width) {
            target = this.total_width;
        }
        $(this.dom_element).attr({'width': this.total_width + 'px'}).css({width: this.total_width + 'px'});

        var canvas_count = Math.ceil(this.total_width / this.canvas_width);
        this.columns_per_canvas = Math.ceil(this.canvas_width / this.zoomed_column);


        if (this.previous_zoom !== this.zoom) {
            $(this.dom_element).find('canvas').remove();
            this.previous_zoom = this.zoom;
            this.rendered = [];
        }

        this.canvases = [];
        this.contexts = [];


        for (i = 0; i < canvas_count; i++) {

            var split_start = (this.columns_per_canvas * i) + start,
                split_end   = split_start + this.columns_per_canvas - 1;
            if (split_end > end) {
                split_end = end;
            }

            var adjusted_width = ((split_end - split_start) + 1) * this.zoomed_column;

            if (adjusted_width > max_canvas_width) {
                max_canvas_width = adjusted_width;
            }

            var canv_start = max_canvas_width * i,
                canv_end = canv_start + adjusted_width;

            if (target < canv_end + (canv_end / 2) && target > canv_start - (canv_start / 2)) {
                // Check that we aren't redrawing the canvas and if not, then attach it and draw.
                if (this.rendered[i] !== 1) {

                    this.canvases[i] = attach_canvas(this.dom_element, this.height, adjusted_width, i, max_canvas_width);
                    this.contexts[i] = this.canvases[i].getContext('2d');
                    this.contexts[i].setTransform(1, 0, 0, 1, 0, 0);
                    this.contexts[i].clearRect(0, 0, adjusted_width, this.height);
                    this.contexts[i].fillStyle = "#ffffff";
                    this.contexts[i].fillRect(0, 0, canv_end, this.height);


                    if (this.zoomed_column > 12) {
                        var fontsize = parseInt(10 * zoom, 10);
                        fontsize = (fontsize > 10) ? 10 : fontsize;
                        if (this.debug) {
                            this.render_with_rects(split_start, split_end, i, 1);
                        }
                        this.render_with_text(split_start, split_end, i, fontsize);
                    } else {
                        this.render_with_rects(split_start, split_end, i);
                    }
                    if (this.show_active_sites && this.active_sites_adder!=null) {
                        this.active_sites_adder.setDrawingOptions({
                            margin_to_features: margin_to_features,
                            padding_between_tracks: padding_between_tracks,
                            feature_height: feature_height
                        });
                        this.active_sites_adder.panel.paint(i, split_start, split_end);
                    }
                    this.rendered[i] = 1;

                }
            }

        }

        // check if the scroller object has been initialised and if not then do so.
        // we do this here as opposed to at object creation, because we need to
        // make sure the logo has been rendered and the width is correct, otherwise
        // we get a weird initial state where the canvas will bounce back to the
        // beginning the first time it is scrolled, because it thinks it has a
        // width of 0.
        if (!this.scrollme) {
            if (canvasSupport()) {
                this.scrollme = new EasyScroller($(this.dom_element)[0], {
                    scrollingX: 1,
                    scrollingY: 0,
                    eventTarget: this.called_on
                });
            }
        }

        if (target !== 1 && canvasSupport()) {
            this.scrollme.reflow();
        }
        return;
    };

    this.render_x_axis_label = function () {
        var label = "Model Position";
        if (this.display_ali_map) {
            label = "Alignment Column";
        }
        $(this.called_on).find('.logo_xaxis').remove();
        $(this.called_on).prepend('<div class="logo_xaxis" class="centered" style="margin-left:40px"><p class="xaxis_text" style="width:10em;margin:1em auto">' + label + '</p></div>');
    };

    this.render_y_axis_label = function () {
        //attach a canvas for the y-axis
        $(this.dom_element).parent().before('<canvas class="logo_yaxis" height="300" width="55"></canvas>');
        var canvas = $(this.called_on).find('.logo_yaxis'),
            top_pix_height = 0,
            bottom_pix_height = 0,
            top_height = Math.abs(this.data.max_height),
            bottom_height = (isNaN(this.data.min_height_obs)) ? 0 : parseInt(this.data.min_height_obs, 10),
            context = null,
            axis_label = "Information Content (bits)";
        if (!canvasSupport()) {
            canvas[0] = G_vmlCanvasManager.initElement(canvas[0]);
        }

        context = canvas[0].getContext('2d');
        //draw min/max tick marks
        context.beginPath();
        context.moveTo(55, 1);
        context.lineTo(40, 1);

        context.moveTo(55, this.info_content_height);
        context.lineTo(40, this.info_content_height);


        context.moveTo(55, (this.info_content_height / 2));
        context.lineTo(40, (this.info_content_height / 2));
        context.lineWidth = 1;
        context.strokeStyle = "#666666";
        context.stroke();

        //draw the label text
        context.fillStyle = "#666666";
        context.textAlign = "right";
        context.font = "bold 10px Arial";

        // draw the max label
        context.textBaseline = "top";
        context.fillText(parseFloat(this.data.max_height).toFixed(1), 38, 0);
        context.textBaseline = "middle";

        // draw the midpoint labels
        context.fillText(parseFloat(this.data.max_height / 2).toFixed(1), 38, (this.info_content_height / 2));
        // draw the min label
        context.fillText('0', 38, this.info_content_height);

        // draw the axis label
        if (this.data.height_calc === 'score') {
            axis_label = "Score (bits)";
        }

        context.save();
        context.translate(5, this.height / 2 - 20);
        context.rotate(-Math.PI / 2);
        context.textAlign = "center";
        context.font = "normal 12px Arial";
        context.fillText(axis_label, 1, 0);
        context.restore();

        // draw the insert row labels
        context.fillText('occupancy', 55, this.info_content_height + 7);
        if (this.show_inserts) {
            context.fillText('ins. prob.', 50, 280);
            context.fillText('ins. len.', 46, 296);
        }
    };

    this.render_2nd_y_axis_label = function () {
        //attach a canvas for the y-axis
        $(this.dom_element).parent().after('<canvas id ="second_y_axis" class="second_yaxis" height="302" width="55"></canvas>');
        var canvas = $(this.called_on).find('.second_yaxis'),
            top_pix_height = 0,
            bottom_pix_height = 0,
            top_height = Math.abs(this.data.max_height),
            bottom_height = (isNaN(this.data.min_height_obs)) ? 0 : parseInt(this.data.min_height_obs, 10),
            context = null,
            axis_label = "Information Content (bits)";
        if (!canvasSupport()) {
            canvas[0] = G_vmlCanvasManager.initElement(canvas[0]);
        }

        return canvas[0];
    };

    this.render_with_text = function (start, end, context_num, fontsize) {
        var x = 0,
            column_num = start,
            column_label = null,
            i = 0,
            top_height = Math.abs(this.data.max_height),
            bottom_height = (isNaN(this.data.min_height_obs)) ? 0 : parseInt(this.data.min_height_obs, 10),
            total_height = top_height + Math.abs(bottom_height),
            top_percentage    = Math.round((Math.abs(this.data.max_height) * 100) / total_height),
        //convert % to pixels
            top_pix_height = Math.round((this.info_content_height * top_percentage) / 100),
            bottom_pix_height = this.info_content_height - top_pix_height,
        // this is used to transform the 256px high letters into the correct size
        // when displaying negative values, so that they fit above the 0 line.
            top_pix_conversion = top_pix_height / this.info_content_height,
            bottom_pix_conversion = bottom_pix_height / this.info_content_height;

        // add 3 extra columns so that numbers don't get clipped at the end of a canvas
        // that ends before a large column. DF0000830 was suffering at zoom level 0.6,
        // column 2215. This adds a little extra overhead, but is the easiest fix for now.
        if (end + 3 <= this.end) {
            end += 3;
        }

        for (i = start; i <= end; i++) {
            if (this.data.mmline && this.data.mmline[i - 1] === 1) {
                this.contexts[context_num].fillStyle = '#cccccc';
                this.contexts[context_num].fillRect(x, 10, this.zoomed_column, this.height - 40);
            } else {
                var column = this.data.height_arr[i - 1],
                    col_positions = [];
                if (column) {
                    var previous_height = 0,
                        letters = column.length,
                        previous_neg_height = top_pix_height,
                        j = 0,
                        color = null;

                    for (j = 0; j < letters; j++) {
                        var letter = column[j],
                            values = letter.split(':', 2),
                            x_pos = x + (this.zoomed_column / 2),
                            letter_height = null;

                        // we don't render anything with a value between 0 and 0.01. These
                        // letters would be too small to be meaningful on any scale, so we
                        // just squash them out.
                        if (values[1] > 0.01) {
                            letter_height = parseFloat(values[1]) / this.data.max_height;
                            var y_pos = (this.info_content_height - 2) - previous_height,
                                glyph_height = (this.info_content_height - 2) * letter_height;

                            // The positioning in IE is off, so we need to modify the y_pos when
                            // canvas is not supported and we are using VML instead.
                            if (!canvasSupport()) {
                                y_pos = y_pos + (glyph_height * (letter_height / 2));
                            }

                            col_positions[j] = [glyph_height, this.zoomed_column, x_pos, y_pos];
                            previous_height = previous_height + glyph_height;
                        }
                    }

                    // render the letters in reverse order so that the larger letters on the top
                    // don't clobber the smaller letters below them.
                    for (j = letters; j >= 0; j--) {
                        if (col_positions[j] && this.letters[column[j][0]]) {
                            if (this.colorscheme === 'consensus') {
                                color = this.cmap[i - 1][column[j][0]] || "#7a7a7a";
                            } else {
                                color = null;
                            }
                            this.letters[column[j][0]].draw(this.contexts[context_num], col_positions[j][0], col_positions[j][1], col_positions[j][2], col_positions[j][3], color);
                        }
                    }
                }
            }


            // if ali_coordinates exist and toggle is set then display the
            // alignment coordinates and not the model coordinates.
            if (this.display_ali_map) {
                column_label = this.data.ali_map[i - 1];
            } else {
                column_label = column_num;
            }

            if (this.zoom < 0.7) {
                if (i % 5 === 0) {
                    this.draw_column_divider({
                        context_num : context_num,
                        x : x,
                        fontsize: 10,
                        column_num: column_label,
                        ralign: true
                    });
                }
            } else {
                this.draw_column_divider({
                    context_num : context_num,
                    x : x,
                    fontsize: fontsize,
                    column_num: column_label
                });
            }

            draw_delete_odds(this.contexts[context_num], x, this.height, this.zoomed_column, this.data.delete_probs[i - 1], fontsize, this.show_inserts);
            //draw insert length ticks
            draw_ticks(this.contexts[context_num], x, this.height - 15, 5);
            if (this.show_inserts) {
                draw_insert_odds(this.contexts[context_num], x, this.height, this.zoomed_column, this.data.insert_probs[i - 1], fontsize);
                draw_insert_length(this.contexts[context_num], x, this.height - 5, this.zoomed_column, this.data.insert_lengths[i - 1], fontsize);

                // draw delete probability ticks
                draw_ticks(this.contexts[context_num], x, this.height - 45, 5);
                // draw insert probability ticks
                draw_ticks(this.contexts[context_num], x, this.height - 30, 5);
            }


            x += this.zoomed_column;
            column_num++;

        }

        // draw other dividers
        if (this.show_inserts) {
            draw_border(this.contexts[context_num], this.height - 30, this.total_width);
            draw_border(this.contexts[context_num], this.height - 45, this.total_width);
        }
        draw_border(this.contexts[context_num], this.height - 15, this.total_width);
        draw_border(this.contexts[context_num], 0, this.total_width);
    };

    this.draw_column_divider = function (opts) {
        var div_x = opts.ralign ? opts.x + this.zoomed_column : opts.x,
            num_x = opts.ralign ? opts.x + 2 : opts.x;
        // draw column dividers
        draw_ticks(this.contexts[opts.context_num], div_x, this.height - 30, -30 - this.height, '#dddddd');
        // draw top ticks
        draw_ticks(this.contexts[opts.context_num], div_x, 0, 5);
        // draw column numbers
        draw_column_number(this.contexts[opts.context_num], num_x, 10, this.zoomed_column, opts.column_num, opts.fontsize, opts.ralign);
    };

    this.render_with_rects = function (start, end, context_num, borders) {
        var x = 0,
            column_num = start,
            column_label = null,
            i = 0,
            top_height = Math.abs(this.data.max_height),
            bottom_height = Math.abs(this.data.min_height_obs),
            total_height = top_height + bottom_height,
            top_percentage    = Math.round((Math.abs(this.data.max_height) * 100) / total_height),
        //convert % to pixels
            top_pix_height = Math.round((this.info_content_height * top_percentage) / 100),
            bottom_pix_height = this.info_content_height - top_pix_height,
            mod = 10;

        for (i = start; i <= end; i++) {
            if (this.data.mmline && this.data.mmline[i - 1] === 1) {
                this.contexts[context_num].fillStyle = '#cccccc';
                this.contexts[context_num].fillRect(x, 10, this.zoomed_column, this.height - 40);
            } else {
                var column = this.data.height_arr[i - 1],
                    previous_height = 0,
                    previous_neg_height = top_pix_height,
                    letters = column.length,
                    j = 0;
                for (j = 0; j < letters; j++) {
                    var letter = column[j],
                        values = letter.split(':', 2);
                    if (values[1] > 0.01) {
                        var letter_height = parseFloat(values[1]) / this.data.max_height,
                            x_pos = x,
                            glyph_height = (this.info_content_height - 2) * letter_height,
                            y_pos = (this.info_content_height - 2) - previous_height - glyph_height,
                            color = null;

                        if(this.colorscheme === 'consensus') {
                            color = this.cmap[i - 1][values[0]] || "#7a7a7a";
                        } else {
                            color = this.colors[values[0]];
                        }

                        if (borders) {
                            this.contexts[context_num].strokeStyle = color;
                            this.contexts[context_num].strokeRect(x_pos, y_pos, this.zoomed_column, glyph_height);
                        } else {
                            this.contexts[context_num].fillStyle = color;
                            this.contexts[context_num].fillRect(x_pos, y_pos, this.zoomed_column, glyph_height);
                        }

                        previous_height = previous_height + glyph_height;
                    }
                }
            }


            if (this.zoom < 0.2) {
                mod = 20;
            } else if (this.zoom < 0.3) {
                mod = 10;
            }

            if (i % mod === 0) {
                // draw column dividers
                draw_ticks(this.contexts[context_num], x + this.zoomed_column, this.height - 30, parseFloat(this.height), '#dddddd');
                // draw top ticks
                draw_ticks(this.contexts[context_num], x + this.zoomed_column, 0, 5);

                // if ali_coordinates exist and toggle is set then display the
                // alignment coordinates and not the model coordinates.
                if (this.display_ali_map) {
                    column_label = this.data.ali_map[i - 1];
                } else {
                    column_label = column_num;
                }
                // draw column numbers
                draw_column_number(this.contexts[context_num], x - 2,  10, this.zoomed_column, column_label, 10, true);
            }


            // draw insert probabilities/lengths
            draw_small_insert(
                this.contexts[context_num],
                x,
                this.height - 42,
                this.zoomed_column,
                this.data.insert_probs[i - 1],
                this.data.insert_lengths[i - 1],
                this.data.delete_probs[i - 1],
                this.show_inserts
            );

            // draw other dividers
            if (this.show_inserts) {
                draw_border(this.contexts[context_num], this.height - 45, this.total_width);
            } else {
                draw_border(this.contexts[context_num], this.height - 15, this.total_width);
            }

            draw_border(this.contexts[context_num], 0, this.total_width);

            x += this.zoomed_column;
            column_num++;
        }

    };

    this.toggle_colorscheme = function (scheme) {
        // work out the current column we are on so we can return there
        var col_total = this.current_column();

        if (scheme) {
            if (scheme === 'default') {
                this.colorscheme = 'default';
            } else {
                this.colorscheme = 'consensus';
            }
        } else {
            if (this.colorscheme === 'default') {
                this.colorscheme = 'consensus';
            } else {
                this.colorscheme = 'default';
            }
        }

        // reset the rendered counter so that each section will re-render
        // with the new heights
        this.rendered = [];

        // re-flow and re-render the content
        this.scrollme.reflow();
        //scroll off by one to force a render of the canvas.
        this.scrollToColumn(col_total + 1);
        //scroll back to the location we started at.
        this.scrollToColumn(col_total);
    };

    this.toggle_scale = function (scale) {
        // work out the current column we are on so we can return there
        var col_total = this.current_column();

        if (scale) {
            if (scale === 'obs') {
                this.data.max_height = this.data.max_height_obs;
            } else {
                this.data.max_height = this.data.max_height_theory;
            }
        } else {
            // toggle the max height
            if (this.data.max_height === this.data.max_height_obs) {
                this.data.max_height = this.data.max_height_theory;
            } else {
                this.data.max_height = this.data.max_height_obs;
            }
        }
        // reset the rendered counter so that each section will re-render
        // with the new heights
        this.rendered = [];
        //update the y-axis
        $(this.called_on).find('.logo_yaxis').remove();
        this.render_y_axis_label();

        // re-flow and re-render the content
        this.scrollme.reflow();
        //scroll off by one to force a render of the canvas.
        this.scrollToColumn(col_total + 1);
        //scroll back to the location we started at.
        this.scrollToColumn(col_total);
    };

    this.toggle_ali_map = function (coords) {
        // work out the current column we are on so we can return there
        var col_total = this.current_column();

        if (coords) {
            if (coords === 'model') {
                this.display_ali_map = 0;
            } else {
                this.display_ali_map = 1;
            }
        } else {
            // toggle the max height
            if (this.display_ali_map === 1) {
                this.display_ali_map = 0;
            } else {
                this.display_ali_map = 1;
            }
        }
        this.render_x_axis_label();

        // reset the rendered counter so that each section will re-render
        // with the new heights
        this.rendered = [];

        // re-flow and re-render the content
        this.scrollme.reflow();
        //scroll off by one to force a render of the canvas.
        this.scrollToColumn(col_total + 1);
        //scroll back to the location we started at.
        this.scrollToColumn(col_total);
    };

    this.current_column = function () {
        var before_left = this.scrollme.scroller.getValues().left,
            col_width = (this.column_width * this.zoom),
            col_count = before_left / col_width,
            half_visible_columns = ($(this.called_on).find('.logo_container').width() / col_width) / 2,
            col_total = Math.ceil(col_count + half_visible_columns);
        return col_total;
    };

    this.change_zoom = function (options) {
        var zoom_level = 0.3,
            expected_width = null;
        if (options.target) {
            zoom_level = options.target;
        } else if (options.distance) {
            zoom_level = (parseFloat(this.zoom) - parseFloat(options.distance)).toFixed(1);
            if (options.direction === '+') {
                zoom_level = (parseFloat(this.zoom) + parseFloat(options.distance)).toFixed(1);
            }
        }

        if (zoom_level > 1) {
            zoom_level = 1;
        } else if (zoom_level < 0.1) {
            zoom_level = 0.1;
        }

        // see if we need to zoom or not
        expected_width = ($(this.called_on).find('.logo_graphic').width() * zoom_level) / this.zoom;
        if (expected_width > $(this.called_on).find('.logo_container').width()) {
            // if a center is not specified, then use the current center of the view
            if (!options.column) {
                //work out my current position
                var col_total = this.current_column();

                this.zoom = zoom_level;
                this.render({zoom: this.zoom});
                this.scrollme.reflow();

                //scroll to previous position
                this.scrollToColumn(col_total);
            } else { // center around the mouse click position.
                this.zoom = zoom_level;
                this.render({zoom: this.zoom});
                this.scrollme.reflow();

                var coords = this.coordinatesFromColumn(options.column);
                this.scrollme.scroller.scrollTo(coords - options.offset);
            }
        }
        return this.zoom;
    };

    this.columnFromCoordinates = function (x) {
        var column = Math.ceil(x / (this.column_width * this.zoom));
        return column;
    };

    this.coordinatesFromColumn = function (col) {
        var new_column = col - 1,
            x = (new_column  * (this.column_width * this.zoom)) + ((this.column_width * this.zoom) / 2);
        return x;
    };

    this.scrollToColumn = function (num, animate) {
        var half_view = ($(this.called_on).find('.logo_container').width() / 2),
            new_left = this.coordinatesFromColumn(num);
        this.scrollme.scroller.scrollTo(new_left - half_view, 0, animate);
    };
    this.refresh = function(){
        this.rendered = [];
        this.scrollme.reflow();
        this.scrollToColumn(this.current_column()+1);
        this.scrollToColumn(this.current_column()-1);
    };

}

if (typeof module != "undefined")
    module.exports = HMMLogo;