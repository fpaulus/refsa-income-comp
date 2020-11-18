'use strict';

// Set up the results div in the initial pageload
let resultMsg = "Fill in the values above to see your results.";
let resultDisplay = document.getElementById("showResults");
resultDisplay.innerHTML = resultMsg;

// Define state names to map from code to name
let stateNames = {
  "JHR": "Johor", 
  "KDH": "Kedah",
  "KLN": "Kelantan",
  "MLC": "Malacca",
  "NSB": "Negeri Sembilan",
  "PHG": "Pahang",
  "PNG": "Penang",
  "PRK": "Perak",
  "PRL": "Perlis",
  "SBH": "Sabah",
  "SRK": "Sarawak",
  "SLG": "Selangor",
  "TRG": "Terengganu",
  "WKL": "WP Kuala Lumpur",
  "WLB": "WP Labuan",
  "WPT": "WP Putrajaya"
};

// Define state codes as an array, primarily to loop through when calculating relative income
let stateCodes = [
  "JHR", 
  "KDH",
  "KLN",
  "MLK",
  "NSB",
  "PHG",
  "PNG",
  "PRK",
  "PRL",
  "SBH",
  "SRK",
  "SLG",
  "TRG",
  "WKL",
  "WLB",
  "WPT"
];

// Define a map, to be filled when computing the relative income to each state
let stateRelIncLivingWage = new Map();

// Set up the SVG area for the map
const width = 1000;
const height = 619;

const svg = d3.select("div.container").append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("width", "100%")
    .style("height", "auto")
    .attr("viewBox", "0 0 " + width + " " + height).style("background","#c9e8fd");


// Set up the Div for the map tooltip
var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

// Define projections and path for the map
var projection = d3.geoAlbers()
    .center([110, 3])
    .rotate(-145, 32, 7)
    .parallels([0, 10])
    .scale(2500)
    .translate([width / 2, height / 2])

var path = d3.geoPath()
.projection(projection);

// Define color scale for the map display. 10 categories, mapped onto percentages (plotting percentages on the map)
var colorScale = d3.scaleThreshold()
    .domain([0, 20, 40, 60, 80, 100, 125, 150, 200, 300])
    .range(d3.schemeRdYlGn[10]);

// Define URL's for data (map and CSV state living wage data)
const myMapUrl = "https://raw.githubusercontent.com/fpaulus/refsa-income-comp/main/MY_States.geojson";
const myLivingWageUrl = "https://raw.githubusercontent.com/fpaulus/refsa-income-comp/main/living_wage.csv";

// Define variable to store the living wages; defining here so other functions can access it outside the Promise block.
let myLivingWageMap;

const myLivingWageData = d3.csv(myLivingWageUrl, ({stateId, single, couple, couplekids}) => ({
  stateId: stateId, 
  single: +single, 
  couple: +couple,
  couplekids: +couplekids
}))
  .then (function(data) {
      console.log("CSV load: ");
      console.log(data);
      return data;
  })
  .catch((e) => {
      console.log(e);
  });

const myLivingWageDataMap = myLivingWageData.then(function(data) {
  let dataMap = d3.map(data, d => d.stateId);
  console.log("Turn into map: ");
  console.log(dataMap);
  return dataMap;
})
.catch((e) => {
  console.log(e);
});

Promise.all([
    
  // Load map data and state living wage data. Convert CSV data to numbers in one go. 
  d3.json(myMapUrl),
])        
    .then(function(files) {
        
        var myStates = files[0];
        
        console.log("my_states: ");
        console.dir(myStates);

        // Reverse the order of the coordinates to comply with D3 convention (counter-clockwise, opposite to geoJson RFC)
        var reverseMyStates = myStates.features.map(function (feature) {
            return turf.rewind(feature,{reverse:true});
        });

        // Check that the results are as expected
        console.log("fixed_my_states output:");
        console.dir(reverseMyStates);

        // Check what's in myLivingWageDataMap
        console.log("Inside JSON promise, what's in myLivingWageDataMap: ");
        console.dir(myLivingWageDataMap);
        let test = myLivingWageDataMap.then(function(data) {
          console.log("Inside the CSV promise: " + data.get("JHR").couplekids);
          return data.get("JHR").couplekids;
        })
        .catch((e) => {
          console.log(e);
        });
        console.log("myLivingWageDataMap.get('JHR').couplekids = " + test);

        // Set the projection
        projection.fitSize([width,height],{"type": "FeatureCollection","features":reverseMyStates});

        svg.selectAll("path")
            .data(reverseMyStates)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("stroke", "#666")
            .attr("stroke-width", "0.75")
            // set the color of each state
            .attr("fill", function (d) {
                d.total = 2500 || 0;
                return colorScale(d.total);
            })
            
            .on("mouseover", function(d) {		
                d3.select(this).transition()		
                    .duration(200)		
                    .attr("opacity", .75);
        
                div.transition()
                .duration(50)
                .style("opacity", 1)
            
                div.html(d.properties.name + ": " + d.total + "%")
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 15) + "px");
            })
    
            .on('mouseout', function (d, i) {
                d3.select(this).transition()
                    .duration('50')
                    .attr('opacity', '1');
            });

        console.log("SVG object: ");
        console.log(svg);

        myLivingWageDataMap.then(function(data) {
          console.log("Coloring SVG for the first time.");
          console.log(data);

          svg.selectAll("path")
          .attr("fill", function (d) {
            d.total = data.get(d["id"]).single || 0;
            return colorScale(d.total);
          })
        })
        .catch((e) => {
          console.log(e);
        })
    })
    .catch((e) => {
        console.log(e);
    })

function compareIncome(income, state, hHType) { 

    let strSalaryComp;
    let fltSalaryComp = 3.14;
    let fltStateLivingWage = 3.14;
    let fltIncome = parseFloat(income);

    myLivingWageDataMap.then(function(data) {
        fltStateLivingWage = data.get(state)[hHType];

        console.log("income: " + income + ", state: " + state + ", living wage: " + fltStateLivingWage + "."); 

        fltSalaryComp = Math.floor((fltIncome / fltStateLivingWage)*100);

        console.log("fltSalaryComp: " + fltSalaryComp);

        if (fltSalaryComp < 100) {
            console.log("Percentage: " + fltSalaryComp);
            strSalaryComp = "below";
        }
        else if (fltSalaryComp == 100) {
            console.log("Percentage: " + fltSalaryComp);;
            strSalaryComp = "exactly";
        }
        else if (fltSalaryComp*100 > 100) {
            console.log("Percentage: " + fltSalaryComp);
            strSalaryComp = "above";
        }
        else {
            console.log("Something went wrong; couldn't compare income relative to living wage.");
        }

        let prettyIncome = new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR'}).format(income);

        resultDisplay.innerHTML = `You are earning <i>${prettyIncome}</i> as a \
        <i>${hHType}</i>, which is <b>${strSalaryComp}</b> \
        the living wage in <i>${stateNames[state]}</i>.`;

        console.log("Checking SVG in the .then() promise in the compareIncome() function: ");
        console.log(svg);
    
        // Compute provided income with the comparable living wage in each state
        for(var i = 0; i < stateCodes.length; i++) {
          let fltRelIncLivingWage = Math.floor((fltIncome / data.get(stateCodes[i])[hHType])*100);
          console.log("Income relative to " + stateCodes[i] + ": " + fltRelIncLivingWage);
          stateRelIncLivingWage.set(stateCodes[i], {relInc: fltRelIncLivingWage});
        }

        console.log("Finished computing relative income for all states: ");
        console.log(stateRelIncLivingWage);
        console.log(stateRelIncLivingWage.get(state).relInc);

        svg.selectAll("path")
          .attr("fill", function (d) {
            d.total = stateRelIncLivingWage.get(d["id"]).relInc || 0;
            return colorScale(d.total);
        })

        return strSalaryComp;            
    })
    .catch((e) => {
        console.log(e);
    });

}    

function formResults() {
      
  // Read information from the form
  let income = document.getElementById("inputIncome").value;
  let stateCode = document.getElementById("inputState").value;
  let householdType = document.getElementById("inputHHType").value;

  compareIncome(income, stateCode, householdType);
}


