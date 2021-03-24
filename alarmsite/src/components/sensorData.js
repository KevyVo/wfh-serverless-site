import React from 'react';
import Card from 'react-bootstrap/Card';

import Amplify from 'aws-amplify';
import awsconfig from './../aws-exports';
import '@aws-amplify/ui/dist/style.css';

import { PubSub , Auth} from 'aws-amplify';
import { AWSIoTProvider } from '@aws-amplify/pubsub/lib/Providers';
import DynamoDB from 'aws-sdk/clients/dynamodb';

Amplify.configure(awsconfig);

// Apply plugin with configuration
Amplify.addPluggable(new AWSIoTProvider({
    aws_pubsub_region: 'us-west-2', //Your Region
    aws_pubsub_endpoint: 'wss://xxxxxxxxxxxxxxxx-ats.iot.us-west-2.amazonaws.com/mqtt',
   }));

   class Sensors extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
          sensorMsg: '{"null": 0}'
        };
    }

    componentDidMount(){
        //Only use if Auth way is not working var AWS = require("aws-sdk");

        //Get the date
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 01
        var yyyy = today.getFullYear();

        today = yyyy + '-' + mm + '-' + dd;

        var params = { 
          TableName: 'SmartLogs',
          KeyConditionExpression: '#date = :iottopic',
          ExpressionAttributeNames: {
            "#date": "date"
          },
          ExpressionAttributeValues: {
            ":iottopic": { "S" : today}
          },
          ScanIndexForward: false,
          Limit: 1
       };

        Auth.currentCredentials()
        .then(credentials => {
          const db= new DynamoDB({
            region: "us-west-2",
            credentials: Auth.essentialCredentials(credentials)
          });
          db.query(params, function(err, data) {
              if (err) {
              console.log(err);
              return null;
              } else {
      
              for (var i in data['Items']) {
                // read the values from the dynamodb JSON packet
                var timeStamp = data['Items'][i]['Timestamp']['S'];
                var door = data['Items'][i]['Door']['S'];
                var acc = data['Items'][i]['Accuracy']['N'];
                var fing = data['Items'][i]['Finger']['S'];
                var id = data['Items'][i]['userID']['S'];
                //var timeRead = new Date(timeStamp);	
                data = {
                  Accuracy: acc,
                  Door: door,
                  Finger: fing,
                  Timestamp: timeStamp,
                  userID: id
                }
                //Use only for debugging
                //console.log(data);   
                }
                this.setState({ sensorMsg: data });
              }      
          }.bind(this));  
        });
        PubSub.subscribe('Smart_Lock').subscribe({
          next: data => {
            try{
              //Use for debugging
              //console.log(data);
              this.setState({ sensorMsg: data.value });
            }
            catch (error){
              console.log("Error, are you sending the correct data?");
            }
          },
          error: error => console.error(error),
          close: () => console.log('Done'),
        });
      }

    render(){
        const { sensorMsg } = this.state;
        let sensorData = sensorMsg[this.props.name];

        return(
            <div className="Sensor">
                <Card style={{ width: '18rem' }}>
                    <Card.Body>
                        <Card.Title>{this.props.name}</Card.Title>
                        <Card.Text> 
                            { sensorData } { this.props.unit }
                        </Card.Text>
                    </Card.Body>
                </Card>
                <style jsx>{
                `
                .Sensor {
                        box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
                        transition: 0.3s;
                    }
                    
                    .Sensor:hover {
                        box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2);
                    }
                    `
                }
                </style>
            </div>
        )
    }
}

export default Sensors;