var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-2" // Your Region
});

var docClient = new AWS.DynamoDB.DocumentClient();

console.log("Querying all events in this time");

//Get the date
var today = new Date();
var dd = String(today.getDate()).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 01
var yyyy = today.getFullYear();

today = yyyy + '-' + mm + '-' + dd;
console.log(typeof(today));
console.log(today);

var params = {
    TableName : "SmartLogs",
    KeyConditionExpression: "#date = :yyyy",
    ExpressionAttributeNames:{
        "#date": "date"
    },
    ExpressionAttributeValues: {
        ":yyyy": today
    },
    ScanIndexForward: false,
    Limit: 1
};

docClient.query(params, function(err, data) {
    if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
        console.log("Query succeeded.", data);
        data.Items.forEach(function(item) { 
            console.log(" -", item.date + ": " + item.unix);
        });
    }
});

                    


