window.addEventListener("load", addListeners)

// Data for the CSV
let CSVdata = [];   // Raw Data
let fData = [];     // Final Data

// Player and course lists
let playerList = [];        // List of unique players
let courseList = [];        // List of unique courses
let playerCourseList = [];  // List of courses that the player has been on

let player = "";
let course = "";

// The chart to be displayed
var chart;

// Slider information
var old_bottomEnd;
var old_topEnd;

// What button has been clicked
var playerClicked = "Par";
var courseClicked = "All";

// Add listeners to the primary buttons
function addListeners() {
    var e1 = document.getElementById("upload");
    if(e1){
        e1.addEventListener('change', upload, false);
    }

    var e2 = document.getElementById("playerListBtns");
    if(e2) {
        e2.addEventListener('click', gatherPlayerData, false);
    }

    var e3 = document.getElementById("courseListBtns");
    if(e3) {
        e3.addEventListener('click', gatherCourseData, false);
    }

}

function resetVariables() {
    CSVdata = [];   // Raw Data
    fData = [];     // Final Data

    // Player and course lists
    playerList = [];        // List of unique players
    courseList = [];        // List of unique courses
    playerCourseList = [];  // List of courses that the player has been on

    player = "";
    course = "";

    // The chart to be displayed
    chart;

    // What button has been clicked
    playerClicked = "Par";
    courseClicked = "All";
}

// Handle's the CSV file upload and conversion
function upload(e) {
    resetVariables();

    console.log("Uploading .CSV File");
    var csvFile = e.target.files[0];

    var reader = new FileReader();
    reader.readAsText(csvFile);
    reader.onload = function (event) {

        const text = event.target.result;
        CSVdata = csvToArray(text);
        //document.write(JSON.stringify(data));

        for(row in CSVdata) {
            fData[parseInt(row)] = {"Holes": []};
            for(col in CSVdata[row]) {
                var info = CSVdata[row][col];
                
                if(col.substring(0, 4) == "Hole") {
                    fData[row].Holes.push(info);
                } else {
                    fData[row][col] = info;
                }
            }
        }

    }

}

function getUniqueInfo() {
    getUniquePlayers();
    getUniqueCourses();
}

// Goes through the fData CSV and finds all unique values
function getUniquePlayers() {
    console.log("Getting Unique Players");
    
    // Finds all of the unique data points and updates the list
    for(var i = 0; i < fData.length; i++) {
        if(!playerList.includes(fData[i].PlayerName) && fData[i].PlayerName != "") {
            if(fData[i].PlayerName == "Par" || fData[i].PlayerName == "") {
                continue;
            }
            playerList.push(fData[i].PlayerName);
        }
    }

    // Turns the list into a grid of buttons for the user
    generateBtns("playerListBtns", playerList, false);

}

// Goes through the fData CSV and finds all unique values
function getUniqueCourses() {
    console.log("Getting Unique Courses");
    
    // Goes through the list and gets the unique course value names
    for(var i = 0; i < fData.length; i++) {
        if(!courseList.includes(fData[i].CourseName) && fData[i].CourseName != "") {
            if(fData[i].CourseName == undefined) {
                // Ignores useless information
                continue;
            }
            courseList.push(fData[i].CourseName);
        }
    }

    // Turns the list into a grid of buttons for the user
    generateBtns("courseListBtns", courseList, true);
}

// Slightly cleaner way of creating the button grids
function generateBtns(id, list, addAll) {
    var child = document.getElementById(id);
    for(var i = child.children.length - 1; i >= 0; i--) {
        child.children[i].remove();
    }

    var startIndex = 0;
    var btnGrid = document.getElementById(id);
    if(addAll) {
        var parent = document.createElement("a");
        parent.innerHTML = "All";
        parent.id = 0;
        btnGrid.appendChild(parent);
        startIndex++;
    }
    for(var i = startIndex; i <= list.length - (startIndex == 0 ? 1 : 0); i++) {
        var parent = document.createElement("a");
        parent.innerHTML = list[i-startIndex];
        parent.id = list[i-startIndex];
        btnGrid.appendChild(parent);
    }
}

// Determines which player button was clicked
//      Also finds all the courses that player has been on
function gatherPlayerData(event) {
    // This just gets which player was clicked
    playerClicked = event.path[0].innerHTML;

    // Reset the list
    playerCourseList = [];

    // For all of the courses played
    courseList.forEach((item) => {
        // Check all of the data to see if the player has been on it
        for(var i = 0; i < fData.length; i++) {
            // If the data matches the player name and course then add the course and break out
            if(fData[i].PlayerName == playerClicked && fData[i]["CourseName"] == item) {
                playerCourseList.push(fData[i].CourseName);
                break;
            }                                     
        }
    });

    // Generate a new list of buttons with just those courses
    generateBtns("courseListBtns", playerCourseList, true);

    generateData();
}

// Determines which course button was selected
function gatherCourseData(event) {
    // This just gets which player was clicked
    courseClicked = event.path[0].innerHTML;

    generateData();
}

// Generate the chart with all of the given information
function generateData(event) {
    // Clear out the old chart
    var element = document.getElementById("container");
    element.remove();

    // Remove all the old graph data
    var svgs = document.getElementsByTagName("svg");
    for(var i = 0; i < svgs.length; i++) {
        svgs[i].remove();
    }

    // Create a new container for the graph
    var div = document.createElement('div');
    div.id = 'container';
    document.body.appendChild(div);

    // See if the current course is in the list
    if(!playerCourseList.includes(courseClicked) && courseClicked != "All") {
        courseClicked = playerCourseList[0];
    }

    // Create a variable to hold our wanted stats
    //  total, score(+/-), holes
    var statData = [];
    
    anychart.onDocumentReady(function() {
        // Gather the appropriate data
        let r = [];
        let index = 0;

        var data;

        if(courseClicked != "All") {
            for(var i = fData.length - 1; i > 0; i--) {
                if(fData[i]["PlayerName"] == playerClicked && fData[i]["CourseName"] == courseClicked) {
                    r.push([fData[i]["Date"], fData[i]["Total"], (fData[i]["Total"] - fData[i]["+/-"])]);
                    statData.push([fData[i]["Total"], fData[i]["+/-"], fData[i]["Holes"], fData[i]["Date"]]);
                    index++;
                }
            }
        } else if(courseClicked == "All") {
            for(var i = fData.length - 1; i > 0; i--) {
                if(fData[i]["PlayerName"] == playerClicked) {
                    r.push([fData[i]["Date"] + " @ " + fData[i]["CourseName"], fData[i]["Total"], (fData[i]["Total"] - fData[i]["+/-"])]);
                    statData.push([fData[i]["Total"], fData[i]["+/-"], fData[i]["Holes"], fData[i]["Date"]]);
                    index++;
                }
            }
        }

        // Set the data
        data = {
            header: ["Date", "Score", "Par"],
            rows: r
        }

        // create the chart
        chart = anychart.column();
        chart.yScale().minimum(18);

        // add the data
        chart.data(data);

        // set the chart title
        chart.title("Scores for " + playerClicked + " at " + courseClicked);
        chart.id("chartID")

        // Zoom in and out
        chart.xScroller(index > 25 ? true : false);
        var xZoom = chart.xZoom();
        xZoom.setToValues(0, index);

        console.log("Top: " + chart.xZoom().b + "\tBottom: " + chart.xZoom.g);

        // draw
        chart.container("container");
        chart.draw();

        
        chart.listen("mouseUp", function() {
            handleSliderUpdate(statData, chart.xZoom().g, chart.xZoom().b);
        });


        statisticalAnalysis(statData);

    });

}

function statisticalAnalysis(sdata) {
    var textLocation = document.getElementById("statsLoc");
    textLocation.style.display = "block";

    var pElem;
    if(textLocation.childElementCount == 0) {
        pElem = document.createElement("p");
        textLocation.appendChild(pElem);
    } else {
        pElem = textLocation.children[0];
    }

    var throwsPerHole = 0;
    var averageThrowsPerHole = 0;
    var holesPlayed = 0;
    var squaredThrows = 0;
    var standardDeviationPerHole = 0;

    var handiAVG = 0;

    // Create a list of all the holes played
    var holesFormatted = [];
    for(var i = 0; i < sdata.length; i++) {
        var iter = sdata[i][2];
        for(var j = 0; j < iter.length; j++) { 
            if(iter[j] == '') {
                holesFormatted.push([...iter].splice(0, j));
                //console.log("J: " + j + " -> " + holesFormatted[holesFormatted.length-1]);
                break;
            }
        
        }
        // Gather data for the handicap
        if(sdata.length >= 5 && i > (sdata.length - 5)) {
            handiAVG += parseInt(sdata[i][1]);
        }
    }

    // Handicap calculations
    if(sdata.length < 5) {
        handiAVG = "Not enough rounds"
    } else {
        handiAVG = round((handiAVG / 5) * 0.9, 2);
    }
    //console.table(holesFormatted);

    // Do the math on the holes to get stats from it
    for(var i = 0; i < holesFormatted.length; i++) {
        for(var j = 0; j < holesFormatted[i].length; j++) {
            throwsPerHole += parseInt(holesFormatted[i][j]);
            holesPlayed++;
            squaredThrows += parseInt(holesFormatted[i][j]) * parseInt(holesFormatted[i][j]);
        }
    }

    // Calculate the Average Throws
    averageThrowsPerHole = throwsPerHole / holesPlayed;
    averageThrowsPerHole = round(averageThrowsPerHole, 2);
    // Caclulate the Standard Deviation
    standardDeviationPerHole = ((holesPlayed * squaredThrows) - (throwsPerHole * throwsPerHole)) / (holesPlayed * (holesPlayed - 1));
    standardDeviationPerHole = round(Math.sqrt(standardDeviationPerHole), 4);
   
    // Add all of the stats to the stats block on the page
    pElem.innerHTML = "<span>" + (sdata[0][3]).split(" ")[0] + " - " + (sdata[sdata.length - 1][3]).split(" ")[0] + "</span>"; // Change so it shows the date range
    pElem.innerHTML += "Average Throws Per Hole: " + averageThrowsPerHole;
    pElem.innerHTML += "<br>Standard Deviation: " + standardDeviationPerHole;
    pElem.innerHTML += "<br>Handicap: " + handiAVG;
}

function round(num, decimals) {
    return Math.round((num + Number.EPSILON) * (Math.pow(10, decimals))) / (Math.pow(10, decimals));
}

function handleSliderUpdate(_data, bottom, top) {
    if(bottom != old_bottomEnd || top != old_topEnd) {
        // Update old stats
        old_bottomEnd = bottom;
        old_topEnd = top;

        var size = _data.length - 0;

        var new_bottom_pos = round(size * bottom, 0);
        var new_top_pos = round(size * top, 0) - 1;

        // Trim the data to the new positions
        new_data = _data.slice(new_bottom_pos, new_top_pos);

        statisticalAnalysis(new_data);
    }
}


function csvToArray(str, delimiter = ",") {
    // slice from start of text to the first \n index
    // use split to create an array from string by delimiter
    const headers = str.slice(0, str.indexOf("\n")).split(delimiter);

    // slice from \n index + 1 to the end of the text
    // use split to create an array of each csv value row
    const rows = str.slice(str.indexOf("\n") + 1).split("\n");

    // Map the rows
    // split values from each row into an array
    // use headers.reduce to create an object
    // object properties derived from headers:values
    // the object passed as an element of the array
    const arr = rows.map(function (row) {
        const values = row.split(delimiter);
        const el = headers.reduce(function (object, header, index) {
            object[header] = values[index];
            return object;
        }, {});
        return el;
    });

    // return the array
    return arr;
}