import dotenv from 'dotenv';
import fs from 'fs';
import census from 'citysdk';
import yargs from 'yargs';

const argv = yargs.options({
  l: { type: 'string', default: 'zip-code-tabulation-area', alias: 'level'},
  o: { type: 'string', default: 'output', alias: 'output'},
  r: { type: 'string', default: '500k', alias: 'resolution'}
}).argv;

// console.log(argv);

dotenv.config();
const censusGeoResolution = argv.resolution;
const censusVintage = 2018;
const STATS_KEY = process.env.STATS_KEY || '';
const censusSourcePath = ['acs', 'acs5', 'profile'];

function writeJSONData(filename, data) {
  const wD = JSON.stringify(data, null, 2);
  return new Promise((resolve, reject) => {
    fs.writeFile(`./scripts/citysdk/${filename}.json`, wD, (err) => {
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
  const vars = {
    vintage: censusVintage,
    values: ["NAME"],
    geoHierarchy: {},
    sourcePath: censusSourcePath,
    geoResolution: censusGeoResolution,
    statsKey: STATS_KEY
  }

  vars.geoHierarchy[`${argv.level}`] = '*';

  return censusPromise(vars);
}

async function processData() {
  const rawZCTAGeo = await getRawZCTAGeo();
  await writeJSONData(argv.output, rawZCTAGeo);
  console.log(`Data written to ${argv.output}.json`);
}

processData();
