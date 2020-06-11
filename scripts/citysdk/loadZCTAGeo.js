import dotenv from 'dotenv';
import fs from 'fs';
import census from 'citysdk';

dotenv.config();
const censusGeoResolution = "500k";
const censusVintage = 2018;
const STATS_KEY = process.env.STATS_KEY || 'c9d9e4ce88d39af69b78c23ff761a520cea2eb63';
const censusSourcePath = ['acs', 'acs5', 'profile'];

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

function getRawZCTAGeo() {
  return censusPromise({
    vintage: censusVintage,
    geoHierarchy: {
      "zip-code-tabulation-area": "*"
    },
    values: ["NAME"],
    sourcePath: censusSourcePath,
    geoResolution: censusGeoResolution,
    statsKey: STATS_KEY
  })
}

async function processData() {
  const rawZCTAGeo = await getRawZCTAGeo();
  await writeJSONData('rawZCTAGeo', rawZCTAGeo);
  console.log("Data written to rawZCTAGeo.json");
}

processData();
