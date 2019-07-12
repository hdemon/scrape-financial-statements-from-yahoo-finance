const scrape = require('./scrape.js')
const AWS = require('aws-sdk');
const uuidv1 = require('uuid/v1')

AWS.config.update({
  region: "ap-northeast-1"
})

const dynamodb = new AWS.DynamoDB

exports.handler = (event, context, callback) => {
  scrape.execute().then((result) => {
    const date = new Date();
    const time1 = date.getTime();
    const unixtime_sec = Math.floor(time1 / 1000);

    console.log(`We got ${result} as a result of scraping.`)
    console.log(`Request ID: ${context.awsRequestId}`)

    dynamodb.putItem({
      "TableName": "expenses",
      "Item": {
        "user_id": { "S": uuidv1() },
        "request_id": { "S": context.awsRequestId },
        "scheme_version": { "S": "20181111" },
        "method": { "S": "jaccs_readers_card" },
        "price": { "N": String(result) },
        "created_at": { "S": date.toISOString() },
      }
    }, (error, data) => {
      if (error) {
        console.error("Error:", error);
        callback(null, {
          body: err
        });
      } else {
        console.log("PutItem has been suceeded.")
        callback(null, {
          body: "success"
        });
      }
    });
    console.log("PutItem method has been called.")
  })
};
