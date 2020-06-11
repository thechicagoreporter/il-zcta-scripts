import dotenv from 'dotenv';
import rawZCTAGeo from '../../data/rawZCTAGeo.json';
import rawZCTAData from '../../data/rawZCTAData.json';
import IllinoisCountyLookup from '../../resources/IllinoisCountyZipLookup.json';
import fs from 'fs';
import d3 from 'd3-array';

dotenv.config();

// Labels match IPDH ZIP code covid data https://observablehq.com/d/6d34c49f2195c8ab
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

function writeJSONData(filename, data) {
  const wD = JSON.stringify(data, null, 2);
  return new Promise((resolve, reject) => {
    fs.writeFile(`./data/${filename}.json`, wD, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
}

async function processData() {
  const IllinoisZCTARawGeo = rawZCTAGeo.features.filter(
    d =>
      d.properties.ZCTA5CE10.startsWith("60") ||
      d.properties.ZCTA5CE10.startsWith("61") ||
      d.properties.ZCTA5CE10.startsWith("62")
  );

  const IllinoisZCTARawData = rawZCTAData
    .filter(
      d =>
        d["zip-code-tabulation-area"].startsWith("60") ||
        d["zip-code-tabulation-area"].startsWith("61") ||
        d["zip-code-tabulation-area"].startsWith("62")
    )
    .map(row => {
      // Here we reconstitute our census vars
      const groupable = Object.keys(row)
        .map(k => {
          const varName = k.slice(0, 9);
          const varType = k.slice(9);
          const group = censusVariableMap.get(varName);
          return {
            varName,
            varType,
            group,
            value: row[k]
          };
        })
        .filter(g => g.group);

      // This is all very clunky
      const rolledup = Object.fromEntries(
        d3
          // First, roll up on group, label, and type to get a gnarly sequence of
          // what are effectively nested tuples
          .rollups(
            groupable,
            v => Array.from(v.values()).pop().value,
            d => d.group.group,
            d => d.group.label,
            d => d.varType
          )
          // Now iterate over the tuples to turn back into an object structure
          .map(r => {
            // Loop over groups
            const group = Object.fromEntries(
              // Build objects
              r[1].map(demo => {
                // In addition to building objects, we also transform % values back into
                // normal form (a decimal number from 0-1).
                const values = Object.fromEntries(
                  demo[1].map(measure =>
                    measure[0].startsWith("P")
                      ? [measure[0], measure[1] / 100]
                      : measure
                  )
                );
                return [demo[0], values];
              })
            );
            return [r[0], group];
          })
      );

      return {
        zip: row["zip-code-tabulation-area"],
        ...rolledup
      };
    });

  // const IllinoisZIPs = IllinoisZCTARawGeo.map(d => ({
  //   postal_code: d.properties.ZCTA5CE10
  // }));

  const IllinoisZCTAGeo = IllinoisZCTARawGeo.map(d => {
    const geocode = IllinoisCountyLookup.results.find(
      c => c.query.postal_code === d.properties.ZCTA5CE10
    );

    const demographics = IllinoisZCTARawData.find(
      z => z.zip === d.properties.ZCTA5CE10
    );

    d.properties.city = geocode.response.results[0].address_components.city;
    d.properties.county = geocode.response.results[0].address_components.county.replace(
      " County",
      ""
    );

    d.properties.census_demographics = demographics;

    return d;
  });

  if (IllinoisZCTAGeo) {
    await writeJSONData('IllinoisZCTAGeo', IllinoisZCTAGeo);
    console.log("Data written to IllinoisZCTAGeo.json");
  }

}

processData();
