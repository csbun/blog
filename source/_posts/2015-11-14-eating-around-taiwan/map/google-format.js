var fs = require('fs');

var data = require('./google.json').features
    .map(f => {
        return {
            t: f.properties.Title,
            p: {
                lng: f.geometry.coordinates[0] + 0.010605499999996937,
                lat: f.geometry.coordinates[1] + 0.0033986000000005845
            }
        };
    });


fs.writeFile('./gm.json', JSON.stringify(data, null, 2));

