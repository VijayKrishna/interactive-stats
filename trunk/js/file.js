if (window.File && window.FileReader && window.FileList && window.Blob) {
//  alert('Great success! All the File APIs are supported.');
} else {
  alert('The File APIs are not fully supported in this browser.');
}
var numberOfBars = 40; // Rough value can be n-1 or n

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.
    var file = evt.dataTransfer.files[0];
    if(file.name.split(".")[1].toUpperCase() != "CSV") {
        alert("Invalid CSV File");
        e.target.parentNode.reset();
        return;
    } else {
        handleCSV(evt, file);
    }
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

function handleCSV(evt, f) {
    var reader = new FileReader();
        // files is a FileList of File objects. List some properties.
    reader.onload = function(f) {
        var content = f.target.result;
        var rows = f.target.result.split(/[\r\n|\n]+/);
        var dataSet = [];
        for(var i = 2; i < rows.length; i++){
               var row = rows[i].split(',');
               if(i===3){
                    if(evt.target.output_zone.indexOf("one") !== -1){
                        document.getElementById("sample_one").value = row[1];
                    } else {
                        document.getElementById("sample_two").value = row[1];
                    }
               }
               if(hasNumbers(row[0])){
                    if(hasNumbers(row[1])){
                        var rowData = new Object();
                        rowData.startDate = row[0].substring(0, 10);
                        rowData.endDate = row[0].substring(13, row[0].length);
                        rowData.value = row[1];
                        rowData.size = 1;
                        dataSet.push(rowData);
                    }
               }
        }
        dataSet = refineData(dataSet);
        render(evt, dataSet);
    }
    reader.readAsText(f);
}
    
function refineData(dataSet){
    var refine = [];
    var counter = 0;
    var mergeSize = Math.floor(dataSet.length/numberOfBars);
    var rowData = new Object();
    rowData.startDate = dataSet[0].startDate;
    rowData.value = 0;
    rowData.size = 1;
    for(var i = 0; i < dataSet.length; i++){
        rowData.value = rowData.value + parseInt(dataSet[i].value);
        rowData.size = rowData.size+1;
        if(counter==mergeSize){
            rowData.endDate = dataSet[i].endDate;
            refine.push(rowData);
            rowData = new Object()
            rowData.startDate = dataSet[i+1].startDate;
            rowData.value = 0;
            rowData.size = 1;
            counter = 0;
        }
        counter++;
    }
    return refine;
}

function hasNumbers(t){
    return /\d/.test(t);
}

// width of g, which svg will have to have offset from translation
var width = 640;
var height = 120;

function render(evt, dataSet){



    var data = dataSet;  
    var timeFormat = d3.time.format("%Y-%d-%d").parse;

    var w = Math.ceil(width/data.length);
    var h = 80;
    var xScale = d3.time.scale()
        .domain([new Date(data[0].startDate), d3.time.day.offset(new Date(data[data.length - 1].startDate), 1)])
        .range([0, width]);

    var yScale = d3.scale.linear()
        .domain([d3.min(data, function(d) { return d.value - 50; }),
                        d3.max(data, function(d) { return d.value; })])
        .rangeRound([h, 0]);
    
    var xAxis = d3.svg.axis()
                        .scale(xScale)
                        .ticks(6)
                        .tickPadding(6)
                        .tickSize(0)
                        .orient('bottom');  
    var yAxis = d3.svg.axis()
                        .scale(yScale)
                        .ticks(3)
                        .orient('left');
                        
    var chart = evt.target.chart;
    var svg = null;
    var chart_selection_end_view = null;
    var chart_selection_start_view = null;
    if(evt.target.output_zone.indexOf("one") !== -1){
        d3.select("#x-axis-one").call(xAxis);
        d3.select("#y-axis-one").call(yAxis);
        svg = d3.select("#chart_one");
        chart_selection_end_view = d3.select("#chart_one_selection_end");
        chart_selection_start_view = d3.select("#chart_one_selection_start");

    } else {
        d3.select("#x-axis-two").call(xAxis);
        d3.select("#y-axis-two").call(yAxis);    
        svg = d3.select("#chart_two");
        chart_selection_end_view = d3.select("#chart_two_selection_end");
        chart_selection_start_view = d3.select("#chart_two_selection_start");
    }

    chart_selection_start_view.text(data[0].startDate);
    chart_selection_end_view.text(data[data.length - 1].endDate);

    var bars = d3.select(chart)
        .select("g").selectAll("rect")
        .data(data);
        
    bars.enter().append("rect");

    bars.on("click", function(d, i) {
        var op = prompt("Please enter the value", data[i].value);    
        if(!isNaN(parseInt(op,10))){
            data[i].value = parseInt(op, 10);
            render(evt, data);
        }
        })
        .attr("x", function(d, i) { return xScale(new Date(data[i].startDate)); })
        .attr('y', function(d) { return h  - (h - yScale(d.value)) })
        .attr("width", w)
        .attr("height", function(d) { return h - yScale(d.value); })
        .style("fill","steelblue")
        .style("stroke", "white")
        // removes the class "selected" from the bars if applied due to a prior data set.
        .classed("selected", false) 
        ;
    var selected_dates = new Array();
    var brush = d3.svg.brush().x(xScale)
        .on("brushstart", function() {
            svg.classed("selecting", true);
        })
        .on("brush", function() {
          var s = d3.event.target.extent();
          // console.log(s[0] + " " + s[1]);
          s[0] = xScale(s[0]);
          s[1] = xScale(s[1]);
          // console.log(s[0] + " " + s[1]);
          selected_dates = new Array();
          bars.classed("selected", function(d,i) {
            var temp_x = xScale(new Date(d.startDate));
            if((s[0] - .5) <= temp_x && (temp_x + w) <= s[1]) {
                selected_dates.push(d.startDate);
                selected_dates.push(d.endDate);
            }
            // console.log(temp_x);
            return (s[0] - .5) <= temp_x && (temp_x + w) <= s[1]; });
          if(selected_dates.length == 0) {
            chart_selection_start_view.text(data[0].startDate);
            chart_selection_end_view.text(data[data.length - 1].endDate);
          } else {
            chart_selection_start_view.text(selected_dates[0]);
            chart_selection_end_view.text(selected_dates[selected_dates.length - 1]);
          }
          
          // console.log(selected_dates);
        })
        .on("brushend", function() {
            svg.classed("selecting", !d3.event.target.empty());
        });
    
    //remove any existing brushes before appending a new one.
    var prior_brushes = d3.selectAll("svg#chart_one").selectAll(".brush");
    if(prior_brushes[0].length != 0) {
        prior_brushes.remove();
    }
    
    svg.append("g")
        .attr("id", "brush")
        .attr("class", "brush")
        .attr("transform", "translate(40,25)")
        .call(brush)
        .selectAll("rect")
        .attr("height", h)
        ;
    
    // Remove the hash tag and insert the data into svg
    chart = chart.substring(1, chart.length);
    document.getElementById(chart).content = data;
    

    
}
// Setup the dnd listeners.
var dropZone1 = document.getElementById('drop_zone_one');
dropZone1.addEventListener('dragover', handleDragOver, false);
dropZone1.addEventListener('drop', handleFileSelect, false);
dropZone1.output_zone = 'list_one'; // Sample Input One
dropZone1.chart = '#chart_one'; // svg tag chart one

var dropZone2 = document.getElementById('drop_zone_two');
dropZone2.addEventListener('dragover', handleDragOver, false);
dropZone2.addEventListener('drop', handleFileSelect, false);
dropZone2.output_zone = 'list_two'; // Sample Input Two
dropZone2.chart = '#chart_two'; // svg tag chart two

function run_test(){
    var sampleType = getSelected(document.getElementById('sample-type'));
    var alternativeOption = getSelected(document.getElementById('alternative-options'));
    
    console.log(document.getElementById('chart_one').content);
    console.log(document.getElementById('chart_two').content);
}

function getSelected(selectOptions){
for(var i = 0; i < selectOptions.length;i++){
        if(selectOptions.options[i].selected){
            return selectOptions.options[i].value;
        }
    }
}

