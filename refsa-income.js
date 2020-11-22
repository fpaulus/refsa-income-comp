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
const height = 500;

const svg = d3.select("#results").append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("width", "100%")
    .style("height", "auto")
    .attr("viewBox", "0 0 " + width + " " + height).style("background","#c9e8fd");

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
    .domain([0, 55, 70, 80, 90, 100, 110, 120, 130, 150])
    .range(d3.schemeRdYlGn[10]);

// Define callout function to properly display tooltip on the map
let callout = (g, value) => {
  if (!value) return g.style("display", "none");

  g
      .style("display", null)
      .style("pointer-events", "none")
      .style("font", "10px sans-serif");

  const path = g.selectAll("path")
    .data([null])
    .join("path")
      .attr("fill", "white")
      .attr("stroke", "black");

  const text = g.selectAll("text")
    .data([null])
    .join("text")
    .call(text => text
      .selectAll("tspan")
      .data((value + "").split(/\n/))
      .join("tspan")
        .attr("x", 0)
        .attr("y", (d, i) => `${i * 1.1}em`)
        .style("font-weight", (_, i) => i ? null : "bold")
        .text(d => d));

  const {x, y, width: w, height: h} = text.node().getBBox();

  text.attr("transform", `translate(${-w / 2},${15 - y})`);
  path.attr("d", `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
}

// Define URL's for data (map and CSV state living wage data)
const myMapUrl = "https://raw.githubusercontent.com/fpaulus/refsa-income-comp/main/MY_States.geojson";
const myLivingWageUrl = "https://raw.githubusercontent.com/fpaulus/refsa-income-comp/main/living_wage.csv";

// Define variable to store the living wages; defining here so other functions can access it outside the Promise block.
let myLivingWageMap;

const myLivingWageData = d3.csv(myLivingWageUrl, ({stateId, singleUrban, singleRural, coupleUrban, coupleRural, coupleKidsUrban, coupleKidsRural}) => ({
  stateId: stateId, 
  singleUrban: +singleUrban,
  singleRural: +singleRural, 
  coupleUrban: +coupleUrban,
  coupleRural: +coupleRural,
  coupleKidsUrban: +coupleKidsUrban,
  coupleKidsRural: +coupleKidsRural
}))
  .then (function(data) {
      return data;
  })
  .catch((e) => {
      console.log(e);
  });

const myLivingWageDataMap = myLivingWageData.then(function(data) {
  let dataMap = d3.map(data, d => d.stateId);
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
        
        // Reverse the order of the coordinates to comply with D3 convention (counter-clockwise, opposite to geoJson RFC)
        var reverseMyStates = myStates.features.map(function (feature) {
            return turf.rewind(feature,{reverse:true});
        });

        // Check what's in myLivingWageDataMap
        let test = myLivingWageDataMap.then(function(data) {
          return data.get("JHR").couplekids;
        })
        .catch((e) => {
          console.log(e);
        });

        // Set the projection
        projection.fitSize([width,height],{"type": "FeatureCollection","features":reverseMyStates});

        svg.selectAll("path")
          .data(reverseMyStates)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("stroke", "#666")
          .attr("stroke-width", "0.75")
          .attr("class", "state")
          // set the color of each state
          .attr("fill", function (d) {
              d.total = 100 || 0;
              return colorScale(d.total);
          })

        const tooltip = svg.append("g");

        svg
          .selectAll(".state")
          .on("touchmove mousemove", function(d) {
            tooltip.call(callout, `\u0394: ${d.total-100}%
      ${d.properties.name}`);
            tooltip.attr("transform", `translate(${d3.mouse(this)})`);
          })
          .on("touchend mouseleave", () => tooltip.call(callout, null));
        
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

        fltSalaryComp = Math.floor((fltIncome / fltStateLivingWage)*100);

        if (fltSalaryComp < 100) {
            strSalaryComp = "below";
        }
        else if (fltSalaryComp == 100) {
            strSalaryComp = "exactly";
        }
        else if (fltSalaryComp*100 > 100) {
            strSalaryComp = "above";
        }
        else {
            console.log("Something went wrong; couldn't compare income relative to living wage.");
        }

        let prettyIncome = new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR'}).format(income);

        resultDisplay.innerHTML = `Your household is earning <i>${prettyIncome}</i>, which is <b>${strSalaryComp}</b> \
        the living wage in <i>${stateNames[state]}</i>.`;
    
        // Compute provided income with the comparable living wage in each state
        for(var i = 0; i < stateCodes.length; i++) {
          let fltRelIncLivingWage = Math.floor((fltIncome / data.get(stateCodes[i])[hHType])*100);
          stateRelIncLivingWage.set(stateCodes[i], {relInc: fltRelIncLivingWage});
        }

        console.log("Finished computing relative income for all states: ");
        console.log(stateRelIncLivingWage);

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
  let urbanRural = document.getElementById("inputAreaType").value;

  let hHType;

  if (urbanRural == "Rural" && (stateCode == "WKL" || stateCode == "WPT")) {
    alert(`No rural areas in ${stateNames[stateCode]}, defaulting to 'urban.'`);
    hHType = householdType + "Urban";
  }
  else {
    hHType = householdType + urbanRural;
  }

  compareIncome(income, stateCode, hHType);
}


