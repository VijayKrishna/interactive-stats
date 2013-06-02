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
    var w = Math.ceil(width/data.length);
    var h = 80;
        
    var xScale = d3.scale.linear()
        .domain([0, data.length])
        .range([0, width]);

    var yScale = d3.scale.linear()
        .domain([0, d3.max(data, function(d) { return d.value; })])
        .rangeRound([0, h]);
        
    var bars = d3.select(evt.target.chart)
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
        .attr("x", function(d, i) { return xScale(i) + .5; })
        .attr("y", function(d) { return h - yScale(d.value); })
        .attr("width", w)
        .attr("height", function(d) { return yScale(d.value)});
;
}
// Setup the dnd listeners.
var dropZone1 = document.getElementById('drop_zone_one');
dropZone1.addEventListener('dragover', handleDragOver, false);
dropZone1.addEventListener('drop', handleFileSelect, false);
dropZone1.output_zone = 'list_one';
dropZone1.chart = '#chart_one';

var dropZone2 = document.getElementById('drop_zone_two');
dropZone2.addEventListener('dragover', handleDragOver, false);
dropZone2.addEventListener('drop', handleFileSelect, false);
dropZone2.output_zone = 'list_two';
dropZone2.chart = '#chart_two';