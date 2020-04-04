const AWS = require("aws-sdk")
const _ = require('lodash')
const bucketName = 'automate-tests-reports';
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
    return final;
}
// (async () => {
//     getTests()
// })();
async function getFinalArray(allKeys) {
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
