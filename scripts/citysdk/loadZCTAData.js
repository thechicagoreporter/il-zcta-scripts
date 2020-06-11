import dotenv from 'dotenv';
import fs from 'fs';
import census from 'citysdk';

dotenv.config();
const censusVintage = 2018;
const STATS_KEY = process.env.STATS_KEY || 'c9d9e4ce88d39af69b78c23ff761a520cea2eb63';
const censusSourcePath = ['acs', 'acs5', 'profile'];

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

const censusVariables = Array.from(censusVariableMap.keys())
  .map(d => [d + "E", d + "M", d + "PE", d + "PM"])
  .flat();

function writeJSONData(filename, data) {
  const wD = JSON.stringify(data, null, 2);
  return new Promise((resolve, reject) => {
    fs.writeFile(`./data/${filename}.json`, wD, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
}

function censusPromise(args) {
  return new Promise(function(resolve, reject) {
    census(args, function(err, json) {
      if (!err) {
        resolve(json);
      } else {
        reject(err);
      }
    });
  });
}

function getRawZCTAData() {
  return censusPromise({
    vintage: censusVintage,
    geoHierarchy: {
      "zip-code-tabulation-area": "*"
    },
    values: ["NAME", ...censusVariables],
    sourcePath: censusSourcePath,
    statsKey: STATS_KEY
  })
}

async function processData() {
  const rawZCTAData = await getRawZCTAData();
  await writeJSONData('rawZCTAData', rawZCTAData);
  console.log("Data written to rawZCTAData.json");
}

processData();
