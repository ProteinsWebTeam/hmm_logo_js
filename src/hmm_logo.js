/*jslint browser:true */
/*global G_vmlCanvasManager, EasyScroller */
/** @license
 * HMM logo
 * https://github.com/Janelia-Farm-Xfam/hmm_logo_js
 * Copyright 2013, Jody Clements.
 * Licensed under the MIT License.
 * https://github.com/Janelia-Farm-Xfam/hmm_logo_js/blob/master/LICENSE.txt
 */
if (typeof module != "undefined")
  var canvasSupport = require("./components/canvas_support.js"),
      HMMLogo = require("./components/hmm_logo_canvas"),
      ActiveSitesAdder = require("./ActiveSites/ActiveSitesAdder.js");

(function ($) {
  "use strict";

  $.fn.hmm_logo = function (options) {
    var logo = null,
      logo_graphic = $('<div class="logo_graphic">');
    var self = this;
    if (canvasSupport()) {
      options = options || {};

      // add some internal divs for scrolling etc.
      $(this).append(
        $('<div class="logo_container">').append(logo_graphic).append('<div class="logo_divider">')
      );

      options.data = $(this).data('logo');

      if (options.data === null) {
        return;
      }

      options.dom_element = logo_graphic;
      options.called_on = this;

      var zoom = options.zoom || 0.4,
        form = $('<form class="logo_form"><fieldset><label for="position">Column number</label>' +
          '<input type="text" name="position" class="logo_position" />' +
          '<button class="button logo_change">Go</button></fieldset>' +
          '</form>'),
        controls = $('<div class="logo_controls">'),
        settings = $('<div class="logo_settings">');

      settings.append('<span class="close">x</span>');

      logo = new HMMLogo(options);
      logo.render_x_axis_label();
      logo.render_y_axis_label();
      logo.render(options);

      if (logo.zoom_enabled) {
        controls.append('<button class="logo_zoomout button">-</button>' +
          '<button class="logo_zoomin button">+</button>');
      }

      /* we don't want to toggle if the max height_obs is greater than max theoretical
       * as letters will fall off the top.
       */
      if (logo.scale_height_enabled && (logo.data.max_height_obs < logo.data.max_height_theory)) {
        var obs_checked = '',
          theory_checked = '',
          theory_help = '',
          obs_help = '';

        if (logo.data.max_height_obs === logo.data.max_height) {
          obs_checked = 'checked';
        } else {
          theory_checked = 'checked';
        }

        if (options.help) {
          obs_help = '<a class="help" href="/help#scale_obs" title="Set the y-axis maximum to the maximum observed height.">' +
            '<span aria-hidden="true" data-icon="?"></span><span class="reader-text">help</span></a>';
          theory_help = '<a class="help" href="/help#scale_theory" title="Set the y-axis maximum to the theoretical maximum height">' +
            '<span aria-hidden="true" data-icon="?"></span><span class="reader-text">help</span></a>';
        }

        var scale_controls = '<fieldset><legend>Scale</legend>' +
          '<label><input type="radio" name="scale" class="logo_scale" value="obs" ' + obs_checked +
          '/>Maximum Observed ' + obs_help +
          '</label></br>' +
          '<label><input type="radio" name="scale" class="logo_scale" value="theory" ' + theory_checked +
          '/>Maximum Theoretical ' + theory_help +
          '</label>' +
          '</fieldset>';

        settings.append(scale_controls);
      }

      if (logo.data.height_calc !== 'score' && logo.data.alphabet === 'aa' && logo.data.probs_arr) {

        var def_color = null,
          con_color = null,
          def_help = '',
          con_help = '';

        if (logo.colorscheme === 'default') {
          def_color = 'checked';
        } else {
          con_color = 'checked';
        };

        if (options.help) {
          def_help = '<a class="help" href="/help#colors_default" title="Each letter receives its own color.">' +
            '<span aria-hidden="true" data-icon="?"></span><span class="reader-text">help</span></a>';
          con_help = '<a class="help" href="/help#colors_consensus" title="Letters are colored as in Clustalx and Jalview, with colors depending on composition of the column.">' +
            '<span aria-hidden="true" data-icon="?"></span><span class="reader-text">help</span></a>';
        }

        var color_controls = '<fieldset><legend>Color Scheme</legend>' +
          '<label><input type="radio" name="color" class="logo_color" value="default" ' + def_color +
          '/>Default ' + def_help +
          '</label></br>' +
          '<label><input type="radio" name="color" class="logo_color" value="consensus" ' + con_color +
          '/>Consensus Colors ' + con_help +
          '</label>' +
          '</fieldset>';
        settings.append(color_controls);
      }

      if (logo.data.ali_map) {
        var mod_checked = null,
            ali_checked = null,
            mod_help = '',
            ali_help = '',
            familiy_accession = '';

        if (logo.display_ali_map === 0) {
          mod_checked = 'checked';
        } else {
          ali_checked = 'checked';
        }

        if (options.help) {
          mod_help = '<a class="help" href="/help#coords_model" title="The coordinates along the top of the plot show the model position.">' +
            '<span aria-hidden="true" data-icon="?"></span><span class="reader-text">help</span></a>';
          ali_help = '<a class="help" href="/help#coords_ali" title="The coordinates along the top of the plot show the column in the alignment associated with the model">' +
            '<span aria-hidden="true" data-icon="?"></span><span class="reader-text">help</span></a>';
        }

        var ali_controls = '<fieldset><legend>Coordinates</legend>' +
          '<label><input type="radio" name="coords" class="logo_ali_map" value="model" ' + mod_checked +
          '/>Model ' + mod_help +
          '</label></br>' +
          '<label><input type="radio" name="coords" class="logo_ali_map" value="alignment" ' + ali_checked +
          '/>Alignment ' + ali_help +
          '</label>' +
          '</fieldset>';
        settings.append(ali_controls);

      }

      if (settings.children().length > 0) {
        controls.append('<button class="logo_settings_switch button">Settings</button>');
        controls.append(settings);
      }

      form.append(controls);
      $(this).append(form);


      $(this).find('.logo_settings_switch, .logo_settings .close').bind('click', function (e) {
        e.preventDefault();
        $('.logo_settings').toggle();
      });

      $(this).find('.logo_reset').bind('click', function (e) {
        e.preventDefault();
        var hmm_logo = logo;
        hmm_logo.change_zoom({'target': hmm_logo.default_zoom});
      });

      $(this).find('.logo_change').bind('click', function (e) {
        e.preventDefault();
      });

      $(this).find('.logo_zoomin').bind('click', function (e) {
        e.preventDefault();
        var hmm_logo = logo;
        hmm_logo.change_zoom({'distance': 0.1, 'direction': '+'});
      });

      $(this).find('.logo_zoomout').bind('click', function (e) {
        e.preventDefault();
        var hmm_logo = logo;
        hmm_logo.change_zoom({'distance': 0.1, 'direction': '-'});
      });

      $(this).find('.logo_scale').bind('change', function (e) {
        var hmm_logo = logo;
        hmm_logo.toggle_scale(this.value);
      });

      $(this).find('.logo_color').bind('change', function (e) {
        var hmm_logo = logo;
        hmm_logo.toggle_colorscheme(this.value);
      });

      $(this).find('.logo_ali_map').bind('change', function (e) {
        var hmm_logo = logo;
        hmm_logo.toggle_ali_map(this.value);
      });

      $(this).find('.logo_position').bind('change', function () {
        var hmm_logo = logo;
        if (!this.value.match(/^\d+$/m)) {
          return;
        }
        hmm_logo.scrollToColumn(this.value, 1);
      });

      logo_graphic.bind('dblclick', function (e) {
        // need to get coordinates of mouse click
        var hmm_logo = logo,
          offset = $(this).offset(),
          x = parseInt((e.pageX - offset.left), 10),

          // get mouse position in the window
          window_position = e.pageX - $(this).parent().offset().left,

          // get column number
          col = hmm_logo.columnFromCoordinates(x),

          // choose new zoom level and zoom in.
          current = hmm_logo.zoom;

        if (current < 1) {
          hmm_logo.change_zoom({'target': 1, offset: window_position, column: col});
        } else {
          hmm_logo.change_zoom({'target': 0.3, offset: window_position, column: col});
        }

        return;
      });

      if (options.column_info) {
        logo_graphic.bind('click', function (e) {
          var hmm_logo = logo,
            info_tab = $('<table class="logo_col_info"></table>'),
            header = '<tr>',
            tbody  = '',
            offset = $(this).offset(),
            x = parseInt((e.pageX - offset.left), 10),

            // get mouse position in the window
            window_position = e.pageX - $(this).parent().offset().left,

            // get column number
            col = hmm_logo.columnFromCoordinates(x),
            // clone the column data before reversal or the column gets messed
            // up in the logo when zoom levels change. Also stops flip-flopping
            // of the order from ascending to descending.
            col_data = [],
            info_cols = 0,
            i = 0,
            j = 0,
            height_header = 'Probability';

          if (logo.data.height_calc && logo.data.height_calc === 'score') {
            height_header = 'Score';
            col_data = logo.data.height_arr[col - 1].slice(0).reverse();
          } else {
            col_data = logo.data.probs_arr[col - 1].slice(0).reverse();
          }

          info_cols = Math.ceil(col_data.length / 5);
          //add the headers for each column.
          for (i = 0; i < info_cols; i++) {
            // using the i < info_cols - 1 check to make sure the last column doesn't
            // get marked with the odd class so we don't get a border on the edge of the table.
            if (info_cols > 1 && i < (info_cols - 1)) {
              header += '<th>Residue</th><th class="odd">' + height_header + '</th>';
            } else {
              header += '<th>Residue</th><th>' + height_header + '</th>';
            }
          }


          header += '</tr>';
          info_tab.append($(header));

          // add the data for each column
          for (i = 0; i < 5; i++) {
            tbody += '<tr>';
            j = i;
            while (col_data[j]) {
              var values = col_data[j].split(':', 2),
                color = '';
              if (logo.colorscheme === 'default') {
                color = logo.alphabet + '_' + values[0];
              }
              // using the j < 15 check to make sure the last column doesn't get marked
              // with the odd class so we don't get a border on the edge of the table.
              if (info_cols > 1  &&  j < 15) {
                tbody += '<td class="' + color + '"><div></div>' + values[0] + '</td><td class="odd">' + values[1] + '</td>';
              } else {
                tbody += '<td class="' + color + '"><div></div>' + values[0] + '</td><td>' + values[1] + '</td>';
              }

              j += 5;
            }
            tbody += '</tr>';
          }

          info_tab.append($(tbody));

          $(options.column_info).empty()
            .append($('<p> Column:' + col  + '</p><div><p>Occupancy: ' + logo.data.delete_probs[col - 1] + '</p><p>Insert Probability: ' + logo.data.insert_probs[col - 1] + '</p><p>Insert Length: ' + logo.data.insert_lengths[col - 1] + '</p></div>'))
            .append(info_tab).show();
        });
      }

      $(document).bind(this.attr('id') + ".scrolledTo", function (e, left, top, zoom) {
        var hmm_logo = logo;
        hmm_logo.render({target: left});
      });

      $(document).keydown(function (e) {
        if (!e.ctrlKey) {
          if (e.which === 61 || e.which === 107) {
            zoom += 0.1;
            logo.change_zoom({'distance': 0.1, 'direction': '+'});
          }
          if (e.which === 109 || e.which === 0) {
            zoom = zoom - 0.1;
            logo.change_zoom({'distance': 0.1, 'direction': '-'});
          }
        }
      });

      // ACTIVE SITES PANEL
      if (logo.active_sites_sources!=null && typeof logo.active_sites_sources == "object") {
        var active_sites = '<fieldset><legend>ActiveSites</legend>' +
            '<label>Source: <select name="member_db" class="logo_ali_map">';
        for (var key in logo.active_sites_sources) {
          active_sites += '<option value="'+key+'">'+key+'</option> ';
        }
        active_sites += '</select></label> ' + // + mod_help +
            '</br>' +
            '<label>Accession number: ' +
            '   <input type="text" name="familiy_accession" class="logo_ali_map" value="PF00199"/>' +
            '</label><br/>' +
            '<button id="active_sites">Get Active Sites</button>' +
            '</fieldset>';

        settings.append(active_sites);
      }

      $(this).find('#active_sites').bind('click', function (e) {
        e.preventDefault();
        var hmm_logo = logo;
        var source = $("select[name=member_db]").val(),
            url = hmm_logo.active_sites_sources[source],
            acc= $("input[name=familiy_accession]").val();
        if (""!=acc.trim()) {
          url = url.replace("[ACCESSION]", acc);
          $.getJSON(url,function(data){
            hmm_logo.active_sites_adder = new ActiveSitesAdder(data,hmm_logo);
            hmm_logo.active_sites_adder.process();
            hmm_logo.show_active_sites = true;

            hmm_logo.rendered = [];
            hmm_logo.scrollme.reflow();
            hmm_logo.scrollToColumn(hmm_logo.current_column()+1);
            hmm_logo.scrollToColumn(hmm_logo.current_column()-1);
          });
        }
      });

    } else {
      $('#logo').replaceWith($('#no_canvas').html());
    }

    return logo;
  };
})(jQuery);
