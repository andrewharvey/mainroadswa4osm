#!/usr/bin/node

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const CKAN = require('ckan');
const status = require('node-status')
var request = require('request');

const env = {
    'CACHE': 'cache'
};

// turn on cookies
var request = request.defaults({jar: true})

mkdirp.sync(env.CACHE);

console.log('Logging in...');
request({
    url: 'https://maps.slip.wa.gov.au/datadownloads/SLIP_Public_Services/Transport/BarrierMRWA_528/BarrierMRWA_528.csv.zip'
}, (err, res) => {
    var match = res.body.match(/action="\/as\/(\w+)\/resume\/as\/authorization\.ping"/);
    if (match.length == 2) {
        request({
            method: 'POST',
            url: 'https://sso.slip.wa.gov.au/as/' + match[1] + '/resume/as/authorization.ping',
            form: {
                'pf.username': process.env.SLIP_USERNAME,
                'pf.pass': process.env_SLIP_PASSWORD,
                'pf.ok': 'clicked',
                'pf.cancel': ''
            },
            headers: {
                'Referer': 'https://sso.slip.wa.gov.au/'
            }
        }, (err, authRes) => {
            if (authRes.statusCode == 302) {
                loggedIn();
            } else {
                console.err('Error loggin in');
            }
        });
    } else {
        console.err('Error loggin in');
    }
});

function loggedIn() {
    console.log('Logged In')
    var downloads = status.addItem('downloads');
    status.start();
    var client = new CKAN.Client('https://catalogue.data.wa.gov.au');
    client.action('organization_show', { id: 'main-roads-western-australia', include_datasets: true }, function (err, result) {
        if (err) {
            console.error("Error retrieving organization: ", err);
            return;
        }
        if (result && result.success && result.result && result.result.packages) {
            //console.log(result.result.package_count);
            result.result.packages.map((dataset) => {
                //console.log(dataset.name);
                client.action('package_show', { id: dataset.id }, function (err, result) {
                    if (err) {
                        console.error("Error retrieving dataset: ", err);
                        return;
                    }
                    if (result && result.success && result.result && result.result.resources) {
                        var resources = result.result.resources;
                        resources.filter((resource) => {
                            return resource.format == 'ZIP' && resource.name == 'Shapefile';
                        }).map((resource) => {
                            downloads.inc();
                            var outputPath = path.format({
                                dir: env.CACHE,
                                name: dataset.name,
                                ext: path.extname(resource.url)
                            });
                            var stream = request(resource.url).pipe(fs.createWriteStream(outputPath));
                            stream.on('finish', () => {
                                downloads.dec();
                                if (downloads.val == 0) {
                                    status.stop();
                                }
                            });
                        });
                        //console.log(result.result.resources);
                    }
                });
            });
        }
    });
} 
