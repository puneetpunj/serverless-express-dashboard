const AWS = require("aws-sdk")
const _ = require('lodash')
const bucketName = 'automate-tests-reports';
AWS.config.update({ region: "ap-southeast-2" });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const getReports = async () => {
    const allKeys = await allBucketKeys(bucketName, 'reports/json')
    console.log(allKeys)
    return await fetchAllReportsDetails(allKeys);
}

const fetchAllReportsDetails = async (allKeys) => {
    return Promise.all(allKeys.map(key => {
        return getFileFromS3(bucketName, "", key).then(jsonFile => {
            const parsedJSON = JSON.parse(jsonFile.Body.toString('utf8'));
            return {
                "date": parsedJSON.stats.start,
                "s3File": key ? key.split('/')[2] : undefined,
                "totalTests": parsedJSON.stats.tests,
                "passedTests": parsedJSON.stats.passes,
                "failedTests": parsedJSON.stats.failures,
                "pendingTests": parsedJSON.stats.pending,
                "duration": parsedJSON.stats.duration,
                "status": parsedJSON.stats.failures > 0 ? 'Failed' : 'Passed'
            };
        })
    })).then(items => _.sortBy(items, 'date').reverse());
}

const getFileFromS3 = async (Bucket, Prefix, Key) => {
    try {
        if (Key) {
            const params = { Bucket, Key };
            return await s3.getObject(params).promise();
        } else {
            const params = { Bucket, Prefix };
            return await s3.listObjectsV2(params).promise();
        }
    } catch (e) {
        throw e
    }
}

const getTestResultHtml = async (reportID) => getFileFromS3(bucketName, '', reportID);

async function allBucketKeys(Bucket, Prefix) {
    const params = { Bucket, Prefix };
    let keys = [];
    try {
        for (; ;) {
            const data = await s3.listObjects(params).promise();
            data.Contents.forEach((elem) => {
                keys = keys.concat(elem.Key);
            });
            if (!data.IsTruncated) {
                break;
            }
            params.Marker = data.NextMarker;
        }
        return keys;
    }
    catch (e) {
        console.error(bucket + ' not accessible')
        return []
    }
}
module.exports = { getReports, getTestResultHtml };
