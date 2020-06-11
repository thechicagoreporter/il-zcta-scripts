# Illinois ZIP code ACS processing scripts

These scripts automate calls to CitySDK for Zip Code Tabulation Area US Census data in Illinois. These scripts may be modified to fit other cases; they do not currently attempt to provide a general solution.

The final output is a GeoJSON file with attached Census data and additional geographic data from Geocod.io.

The added data, attached to each ZCTA's `properties`, looks something like the snippet below. The `E`, `M`, `P`, and `PM` variables correspond to Census estimates, margin of error, percent, and percent margin of error, respectively. 

```
{
  "ZCTA5CE10": "62040",
  ...
  "city": "Granite City",
  "county": "Madison",
  "census_demographics": {
    "zip": "62040",
    "Race": {
      "Black": {
        "PM": 0.011000000000000001,
        "E": 2498,
        "PE": 0.059000000000000004,
        "M": 468
      },
      "Hispanic": {
        "PE": 0.066,
        "E": 2800,
        "PM": 0.013000000000000001,
        "M": 538
      },
      ...
    },
    "Population": {
      "Total": {
        "M": 588,
        "PM": -8888888.88,
        "PE": 424.47,
        "E": 42447
      }
    }
  }
}
```

# Requirements

* NodeJS
* A [US Census API key](https://api.census.gov/data/key_signup.html)

# Installation

```
npm install
npm install --only=dev
```

Set up a `.env` file. Copy `.env.copy` or simply make a new file. Either way, you'll need to specify your Census API key here:

```
STATS_KEY=<YOUR CENSUS API KEY>
```

# Running

```
npm start
```

Data files are written to the `data` directory.

# Output files

* `data/rawZCTAData.json`: Just the Census variables.
* `data/rawZCTAGeo.json`: Just the ZCTA boundaries (GeoJSON).
* `data/IllinoisZCTAGeo.json`: ZCTA boundaries joined with Census variables (GeoJSON).

# How it works

CitySDK/Census API fails when requesting too many Census variables in requests to return geographic data. These scripts query Census data and Census geodata separately, then combines the results.

As a final step, this data is joined with a dataset generated using the Geocod.io geocoding service to match ZIP codes to towns and counties and given reasonably human readable names.

These scripts are currently designed to get a hardcoded set of Census variables for ZIP code tabulation areas in Illinois, but could be readily modified to cover other cases.

To modify these variables, change the `scripts/citysdk/loadZCTAData.js` script. Near the top, you'll find a variable called `censusVariableMap`:

```
const censusVariableMap = new Map([
  ['DP05_0001', { group: "Population", label: "Total" }],
  ['DP05_0077', { group: "Race", label: "White" }],
  ['DP05_0078', { group: "Race", label: "Black" }],
  ['DP05_0079', { group: "Race", label: "AI/AN**" }],
  ['DP05_0080', { group: "Race", label: "Asian" }],
  ['DP05_0081', { group: "Race", label: "NH/PI*" }],
  ['DP05_0071', { group: "Race", label: "Hispanic" }],
  ['DP05_0057', { group: "Race", label: "Other" }]
]);
```

This Javascript `Map` object contains a Census variable identifier and two pieces of metadata in an object: A grouping variable and a label.