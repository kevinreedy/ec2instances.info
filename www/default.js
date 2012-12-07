var current_cost_duration = null;
var ec2_price_url = "http://aws.amazon.com/ec2/pricing/pricing-on-demand-instances.json";
//var ec2_price_url = "/pricing-on-demand-instances.json"; // Temporary for testing

// Convert names returned from JSON to API names
function ec2d(word) {
    var d = new Array();
    d["uODI"] = "t1.";
    d["stdODI"] = "m1.";
    d["hiMemODI"] = "m2.";
    d["hiCPUODI"] = "c1.";
    d["secgenstdODI"] = "m3.";
    d["clusterComputeI"] = "cc1."; //TODO Look at cc1 vs cc2
    d["clusterGPUI"] = "cg.";
    d["hiIoODI"] = "hi1.";
    
    d["u"] = "micro";
    d["sm"] = "small";
    d["med"] = "medium";
    d["lg"] = "large";
    d["xl"] = "xlarge";
    d["xxl"] = "2xlarge";
    d["xxxxl"] = "4xlarge";
    d["xxxxxxxxl"] = "8xlarge";

    return d[word] ? d[word] : word;
}

function change_cost(duration) {
  // update menu text
  var first = duration.charAt(0).toUpperCase();
  var text = first + duration.substr(1);
  $("#cost-dropdown .dropdown-toggle .text").text("Cost: "+text);

  // update selected menu option
  $('#cost-dropdown li a').each(function(i, e) {
    e = $(e);
    if (e.attr('duration') == duration) {
      e.parent().addClass('active');
    } else {
      e.parent().removeClass('active');
    }
  });

  var hour_multipliers = {
    "hourly": 1,
    "daily": 24,
    "weekly": (7*24),
    "monthly": (24*30),
    "yearly": (365*24)
  };
  var multiplier = hour_multipliers[duration];
  var per_time;
  $.each($("td.cost"), function(i, elem) {
    elem = $(elem);
    per_time = elem.attr("hour_cost");
    per_time = (per_time * multiplier).toFixed(2);
    elem.text("$" + per_time + " " + duration);
  });

  current_cost_duration = duration;
}

$(function() {
  $(document).ready(function() {
    $('#data').dataTable({
      "bPaginate": false,
      "bInfo": false,
      "aoColumnDefs": [
        {
          "aTargets": ["memory", "computeunits", "storage", "ioperf"],
          "sType": "span-sort"
        }
      ],
      "fnDrawCallback": function() {
        // Whenever the table is drawn, update the costs. This is necessary
        // because the cost duration may have changed while a filter was being
        // used and so some rows will need updating.
        change_cost(current_cost_duration);
      }
    });
    
    $.getJSON(ec2_price_url, function(data) {
        var useast = [];

        $.each(data["config"]["regions"], function(key, region) {
            if(region["region"] == "us-east") {
                $.each(region["instanceTypes"], function(key, type) {
                    $.each(type["sizes"], function(key, size) {
                        $('#data > tbody:last').append("<tr><td colspan=7>&nbsp</td>" + 
                                                       "<td>" + ec2d(type["type"]) + ec2d(size["size"]) + "</td>" + 
                                                       "<td>" + size["valueColumns"][0]["prices"]["USD"] + "</td>" + // TODO Don't assume [0] is linux
                                                       "<td>" + size["valueColumns"][1]["prices"]["USD"] + "</td></tr>");
                    });
                });
            }
        });
    });

  });

  $.extend($.fn.dataTableExt.oStdClasses, {
    "sWrapper": "dataTables_wrapper form-inline"
  });

  change_cost('hourly');
});

$("#cost-dropdown li").bind("click", function(e) {
  change_cost(e.target.getAttribute("duration"));
});

// sorting for colums with more complex data
// http://datatables.net/plug-ins/sorting#hidden_title
jQuery.extend(jQuery.fn.dataTableExt.oSort, {
  "span-sort-pre": function(elem) {
    var matches = elem.match(/sort="(.*?)"/);
    if (matches) {
      return parseInt(matches[1], 10);
    }
    return 0;
  },

  "span-sort-asc": function(a, b) {
    return ((a < b) ? -1 : ((a > b) ? 1 : 0));
  },

  "span-sort-desc": function(a, b) {
    return ((a < b) ? 1 : ((a > b) ? -1 : 0));
  }
});
