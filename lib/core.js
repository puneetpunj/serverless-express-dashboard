const AWS = require("aws-sdk")
const _ = require('lodash')
const bucketName = 'punj-bucket';
AWS.config.update({
    region: "ap-southeast-2"
});
const s3 = new AWS.S3({
    apiVersion: '2006-03-01'
});

const getTests = async () => {
    const allKeys = await allBucketKeys(bucketName, 'reports/json')
    console.log(allKeys)
    const final = await getFinalArray(allKeys);
    // console.log(final)
    return final;
}
// (async () => {
//     getTests()
// })();
async function getFinalArray(allKeys) {
    return Promise.all(allKeys.map(key => {
        return getFileFromS3(bucketName, "", key).then(jsonFile => {
            const parsedJSON = JSON.parse(jsonFile.Body.toString('utf8'));
            // console.log(parsedJSON)
            // const initiative = JSON.stringify(parsedJSON.results[0].suites);

            return {
                // "id": j + 1,
                // "date": moment(new Date(parsedJSON.start)).tz('Australia/Melbourne').format("DD/MM/YYYY hh:mm:ss a"),
                "date": parsedJSON.stats.start,
                "s3File": key ? key.split('/')[2] : undefined,
                "totalTests": parsedJSON.stats.tests,
                "passedTests": parsedJSON.stats.passes,
                "failedTests": parsedJSON.stats.failures,
                "pendingTests": parsedJSON.stats.pending,
                "duration": parsedJSON.stats.duration,
                // "initiative": typeof (parsedJSON.results[0].suites) != 'undefined' ? parsedJSON.results[0].suites[0].title : 'Not Found',
                // "initiative": 'abc',
                "status": parsedJSON.stats.failures > 0 ? 'Failed' : 'Passed'
            };
        })
        // console.log(JSON.parse(jsonFile.Body.toString('utf8')).stats.start);

    })).then(items => _.sortBy(items, 'date').reverse());
}
async function getFileFromS3(bucketName, folderName, fileName) {

    try {
        if (fileName) {
            const params = {
                Bucket: bucketName,
                Key: fileName
            };
            console.log(params);
            return await s3.getObject(params).promise();
        } else {
            const params = {
                Bucket: bucketName,
                Prefix: folderName
            };
            return await s3.listObjectsV2(params).promise();
        }
    } catch (e) {
        throw e
    }
}

const getTestResultHtml = async (testId) => {
    return getFileFromS3(bucketName, '', testId);
}
async function allBucketKeys(bucket, folderName) {
    const params = {
        Bucket: bucket,
        Prefix: folderName
    };
    let keys = [];
    try {


        for (; ;) {
            var data = await s3.listObjects(params).promise();
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
module.exports = {
    getTests,
    getTestResultHtml
};
