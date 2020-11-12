'use strict';

let resultMsg = "Fill in the values above to see your results.";
let resultDisplay = document.getElementById("showResults");
resultDisplay.innerHTML = resultMsg;

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

function compareIncome(income, state, compArray) {

  let salaryComp;
  let stateLivingWage = parseFloat(compArray[state]);

  let intIncome = parseFloat(income);

  alert ("income: " + intIncome + ", state: " + state + ", living wage: " + stateLivingWage + ", array: " + compArray[state]); 

  if (intIncome > stateLivingWage) {
    alert ("Diff: " + (intIncome - stateLivingWage));
    salaryComp = "above";
  }
  else if (intIncome < stateLivingWage) {
    alert ("Diff: " + (intIncome - stateLivingWage));
    salaryComp = "below";
  }
  else {
    alert ("Diff: " + (intIncome - stateLivingWage));
    salaryComp = "exactly";
  }

  return salaryComp;

}

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
      incomeComp = compareIncome(income, stateCode, stateLivingWagesSingle);
      household = "single"
      break;
    case "2":
      incomeComp = compareIncome(income, stateCode, stateLivingWagesCouple);
      household = "couple"  
      break;
    case "3":
      incomeComp = compareIncome(income, stateCode, stateLivingWagesCoupleChildren);
      household = "couple with two children"
      break;
  }

  let prettyIncome = new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR'}).format(income);

  resultDisplay.innerHTML = `You are earning <i>${prettyIncome}</i> as a \
  <i>${household}</i>, which is <b>${incomeComp}</b> \
  the living wage in <i>${state}</i>.`;

}


