/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [1.0, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "Search for sofa"], "isController": false}, {"data": [1.0, 500, 1500, "Search for chair"], "isController": false}, {"data": [1.0, 500, 1500, "Search for cozy"], "isController": false}, {"data": [1.0, 500, 1500, "Remove Product 67f7b07344155f01e3cc5a89 from Cart"], "isController": false}, {"data": [1.0, 500, 1500, "View Order Details"], "isController": false}, {"data": [1.0, 500, 1500, "Search for clock"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product 67f7b07344155f01e3cc5a8a to Cart"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product 67f7b07344155f01e3cc5a88 to Cart"], "isController": false}, {"data": [1.0, 500, 1500, "Search for stylish"], "isController": false}, {"data": [1.0, 500, 1500, "Remove Product 67f7b07344155f01e3cc5a8a from Cart"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product 67f7b07344155f01e3cc5a89 to Cart"], "isController": false}, {"data": [1.0, 500, 1500, "Add Product 67f7b07344155f01e3cc5a8b to Cart"], "isController": false}, {"data": [1.0, 500, 1500, "Update Product ${updateProductId} Quantity"], "isController": false}, {"data": [1.0, 500, 1500, "Search for modern"], "isController": false}, {"data": [1.0, 500, 1500, "Checkout Cart"], "isController": false}, {"data": [1.0, 500, 1500, "Search for elegant"], "isController": false}, {"data": [1.0, 500, 1500, "View Cart"], "isController": false}, {"data": [1.0, 500, 1500, "Remove Product 67f7b07344155f01e3cc5a88 from Cart"], "isController": false}, {"data": [1.0, 500, 1500, "Search for artistic"], "isController": false}, {"data": [1.0, 500, 1500, "Search for table"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 90, 0, 0.0, 28.855555555555558, 2, 64, 31.5, 60.0, 62.0, 64.0, 15.687641624542444, 5.487951019696705, 2.9543696618441695], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Search for sofa", 1, 0, 0.0, 3.0, 3, 3, 3.0, 3.0, 3.0, 3.0, 333.3333333333333, 107.09635416666667, 46.875], "isController": false}, {"data": ["Search for chair", 2, 0, 0.0, 17.5, 2, 33, 17.5, 33.0, 33.0, 33.0, 1.2106537530266344, 0.3889698093220339, 0.17143046307506055], "isController": false}, {"data": ["Search for cozy", 1, 0, 0.0, 2.0, 2, 2, 2.0, 2.0, 2.0, 2.0, 500.0, 160.64453125, 70.3125], "isController": false}, {"data": ["Remove Product 67f7b07344155f01e3cc5a89 from Cart", 1, 0, 0.0, 5.0, 5, 5, 5.0, 5.0, 5.0, 5.0, 200.0, 74.4140625, 40.4296875], "isController": false}, {"data": ["View Order Details", 10, 0, 0.0, 55.800000000000004, 49, 64, 53.5, 64.0, 64.0, 64.0, 8.136696501220506, 3.8458604556550036, 1.2554668429617575], "isController": false}, {"data": ["Search for clock", 1, 0, 0.0, 2.0, 2, 2, 2.0, 2.0, 2.0, 2.0, 500.0, 200.68359375, 70.80078125], "isController": false}, {"data": ["Add Product 67f7b07344155f01e3cc5a8a to Cart", 5, 0, 0.0, 44.0, 6, 62, 45.0, 62.0, 62.0, 62.0, 4.280821917808219, 1.4121695740582192, 1.0242200877568495], "isController": false}, {"data": ["Add Product 67f7b07344155f01e3cc5a88 to Cart", 5, 0, 0.0, 42.2, 4, 62, 54.0, 62.0, 62.0, 62.0, 5.045408678102927, 1.6643936049445005, 1.2071534434914228], "isController": false}, {"data": ["Search for stylish", 1, 0, 0.0, 2.0, 2, 2, 2.0, 2.0, 2.0, 2.0, 500.0, 160.64453125, 71.77734375], "isController": false}, {"data": ["Remove Product 67f7b07344155f01e3cc5a8a from Cart", 5, 0, 0.0, 32.0, 4, 58, 45.0, 58.0, 58.0, 58.0, 4.230118443316413, 1.3062143083756346, 0.8551118337563453], "isController": false}, {"data": ["Add Product 67f7b07344155f01e3cc5a89 to Cart", 5, 0, 0.0, 32.0, 4, 62, 44.0, 62.0, 62.0, 62.0, 2.536783358701167, 0.9438617770167427, 0.606945237189244], "isController": false}, {"data": ["Add Product 67f7b07344155f01e3cc5a8b to Cart", 5, 0, 0.0, 14.4, 4, 54, 5.0, 54.0, 54.0, 54.0, 4.219409282700422, 1.5707410337552743, 1.009526635021097], "isController": false}, {"data": ["Update Product ${updateProductId} Quantity", 10, 0, 0.0, 32.8, 4, 60, 48.0, 59.8, 60.0, 60.0, 8.787346221441126, 3.130492091388401, 2.093859841827768], "isController": false}, {"data": ["Search for modern", 1, 0, 0.0, 3.0, 3, 3, 3.0, 3.0, 3.0, 3.0, 333.3333333333333, 107.09635416666667, 47.526041666666664], "isController": false}, {"data": ["Checkout Cart", 10, 0, 0.0, 3.1000000000000005, 3, 4, 3.0, 3.9000000000000004, 4.0, 4.0, 8.460236886632826, 2.2224645727580374, 1.5119368654822336], "isController": false}, {"data": ["Search for elegant", 1, 0, 0.0, 4.0, 4, 4, 4.0, 4.0, 4.0, 4.0, 250.0, 88.134765625, 35.888671875], "isController": false}, {"data": ["View Cart", 20, 0, 0.0, 34.29999999999999, 2, 60, 48.0, 60.0, 60.0, 60.0, 6.430868167202572, 2.2416976487138265, 0.9671422829581994], "isController": false}, {"data": ["Remove Product 67f7b07344155f01e3cc5a88 from Cart", 4, 0, 0.0, 27.5, 4, 48, 29.0, 48.0, 48.0, 48.0, 4.11522633744856, 1.259886188271605, 0.8318865740740741], "isController": false}, {"data": ["Search for artistic", 1, 0, 0.0, 3.0, 3, 3, 3.0, 3.0, 3.0, 3.0, 333.3333333333333, 133.7890625, 48.177083333333336], "isController": false}, {"data": ["Search for table", 1, 0, 0.0, 2.0, 2, 2, 2.0, 2.0, 2.0, 2.0, 500.0, 176.26953125, 70.80078125], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 90, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
