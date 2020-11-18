'use strict';

// Set up the results div in the initial pageload
let resultMsg = "Fill in the values above to see your results.";
let resultDisplay = document.getElementById("showResults");
resultDisplay.innerHTML = resultMsg;

// Define state names and incomes - to be replaced by reading in the CSV file
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

let stateLivingWagesSingle = {
  "JHR": "2000", 
  "KDH": "1000",
  "KLN": "800",
  "MLC": "2200",
  "NSB": "2500",
  "PHG": "1100",
  "PNG": "2400",
  "PRK": "1600",
  "PRL": "1200",
  "SBH": "600",
  "SRK": "800",
  "SLG": "2800",
  "TRG": "1200",
  "WKL": "3000",
  "WLB": "1800",
  "WPT": "3000"
};

let stateLivingWagesCouple = {
  "JHR": "3000", 
  "KDH": "1500",
  "KLN": "1200",
  "MLC": "3300",
  "NSB": "3750",
  "PHG": "1650",
  "PNG": "3600",
  "PRK": "1600",
  "PRK": "1800",
  "SBH": "900",
  "SRK": "1200",
  "SLG": "4200",
  "TRG": "1800",
  "WKL": "4500",
  "WLB": "2700",
  "WPT": "4500"
};

let stateLivingWagesCoupleChildren = {
  "JHR": "4000", 
  "KDH": "2000",
  "KLN": "1600",
  "MLC": "4400",
  "NSB": "5000",
  "PHG": "2200",
  "PNG": "4800",
  "PRK": "3200",
  "PRK": "2400",
  "SBH": "1200",
  "SRK": "1600",
  "SLG": "5600",
  "TRG": "2400",
  "WKL": "6000",
  "WLB": "3600",
  "WPT": "6000"
};

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
    .domain([0,500,750,1000,1500,2000,2500,3000,4000,5000,6000])
    .range(d3.schemeRdYlGn[10]);

// Define URL's for data (map and CSV state living wage data)
const myMapUrl = "https://raw.githubusercontent.com/fpaulus/refsa-income-comp/main/MY_States.geojson";
const myLivingWageUrl = "https://raw.githubusercontent.com/fpaulus/refsa-income-comp/main/living_wage.csv";

// Define variable to store the living wages; defining here so other functions can access it outside the Promise block.
let myLivingWageMap;

Promise.all([
    
  // Load map data and state living wage data. Convert CSV data to numbers in one go. 
  d3.json(myMapUrl),
  d3.csv(myLivingWageUrl, ({stateId, single, couple, couplekids}) => ({
        stateId: stateId, 
        single: +single, 
        couple: +couple,
        couplekids: +couplekids
    })),
])        
    .then(function(files) {
        
        var myStates = files[0];
        var myLivingWage = files[1];
        
        console.log("my_states: ");
        console.dir(myStates);
        
        console.log("my_living_wage: ");
        console.log(myLivingWage.columns)
        console.dir(myLivingWage);
        
        // Create a Map to allow for easy querying of the object
        myLivingWageMap = d3.map(myLivingWage, d => d.stateId);

        console.log("myLivingWageSingleMap.keys():");
        console.dir(myLivingWageMap.keys());
        console.dir(myLivingWageMap);
        console.dir(myLivingWageMap.get("JHR").single);


        // Reverse the order of the coordinates to comply with D3 convention (counter-clockwise, opposite to geoJson RFC)
        var reverseMyStates = myStates.features.map(function (feature) {
            return turf.rewind(feature,{reverse:true});
        });

        // Check that the results are as expected
        console.log("fixed_my_states output:");
        console.dir(reverseMyStates);

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
                d.total = myLivingWageMap.get(d["id"]).couplekids || 0;
                return colorScale(d.total);
            })
            .on("mouseover", function(d) {		
                d3.select(this).transition()		
                    .duration(200)		
                    .attr("opacity", .75);
        
                div.transition()
                .duration(50)
                .style("opacity", 1)
            
                div.html(d.properties.name + ": " + d.total)
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 15) + "px");
            })
    
            .on('mouseout', function (d, i) {
                d3.select(this).transition()
                    .duration('50')
                    .attr('opacity', '1');
            });

        function compareIncome(income, state) {

          console.log(myLivingWageMap.get[state].single)
          
          let strSalaryComp;
          let fltSalaryComp;
          let fltStateLivingWage = parseFloat(myLivingWageMap.get[state].single);
        
          let fltIncome = parseFloat(income);
        
          console.log("income: " + income + ", state: " + state + ", living wage: " + fltStateLivingWage + "."); 
        
          fltSalaryComp = fltIncome / fltStateLivingWage;
        
          if (fltSalaryComp < 1) {
            console.log("Percentage: " + (fltSalaryComp * 100));
            strSalaryComp = "below";
          }
          else if (fltSalaryComp = 1) {
            console.log("Percentage: " + (fltSalaryComp * 100));;
            strSalaryComp = "exactly";
          }
          else {
            console.log("Percentage: " + (fltSalaryComp * 100));
            strSalaryComp = "above";
          }
        
          return strSalaryComp;
        
        }

    })
    .catch((e) => {
        console.log(e);
    })

function formResults() {
      
  // Read information from the form
  let income = document.getElementById("inputIncome").value;
  let stateCode = document.getElementById("inputState").value;
  let householdType = document.getElementById("inputHHType").value;

  // Initialise and fill results variables
  let state = stateNames[stateCode];
  let incomeComp;
  let household;

  switch (householdType) {

    case "1":
      incomeComp = compareIncome(income, stateCode);
      household = "single"
      break;
    case "2":
      incomeComp = compareIncome(income, stateCode);
      household = "couple"  
      break;
    case "3":
      incomeComp = compareIncome(income, stateCode);
      household = "couple with two children"
      break;
  }

  let prettyIncome = new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR'}).format(income);

  resultDisplay.innerHTML = `You are earning <i>${prettyIncome}</i> as a \
  <i>${household}</i>, which is <b>${incomeComp}</b> \
  the living wage in <i>${state}</i>.`;

}


