import React, { useState } from 'react';
import './App.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col'

import ToggleSwitch from './components/ToggleSwitch'
import Sensors from './components/sensorData';

import { AmplifyAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';

import Amplify, { PubSub , Auth} from 'aws-amplify';
import { AWSIoTProvider } from '@aws-amplify/pubsub';
import awsconfig from './aws-exports';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import '@aws-amplify/ui/dist/style.css';

Amplify.configure(awsconfig);

Amplify.addPluggable(new AWSIoTProvider({
  aws_pubsub_region: 'us-west-2', //Your Region
  aws_pubsub_endpoint: 'wss://xxxxxxxxxxxxxxxx-ats.iot.us-west-2.amazonaws.com/mqtt',
 }));

const AuthStateApp = () => {
  const [authState, setAuthState] = React.useState();
  const [user, setUser] = React.useState();

  let [Override, setOverride] = useState(null);

  React.useEffect((Override) => {
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
            var door = data['Items'][i]['Door']['S'];
            var id = data['Items'][i]['userID']['S'];
            //var timeRead = new Date(timeStamp);	
            data = {
              Door: door,
              userID: id
            }
            //Use only for debugging
            //console.log("This", data);   
            }
            if ((data.userID === "Override Trigger") && (data.Door === "Unlocked")){
              //Used for debugging
              //console.log("This is overide", Override);
              setOverride(true);
            }
            //Used as negation reference
            //setOverride(Override => !Override);
          }      
      });   
    });
      return onAuthUIStateChange((nextAuthState, authData) => {
          setAuthState(nextAuthState);
          setUser(authData)
      });
  }, []);
  
  const onOverrideChange = (checked) => {
    setOverride(checked);
  }

  PubSub.publish('Override', { msg: Override });
  console.log(Override);

//Use this for dynamically able to load {user.username}
return authState === AuthState.SignedIn && user ? (
    <div className="App">
        <ToggleSwitch id="Override" checked={ Override } onChange={ onOverrideChange } />
      <label htmlFor="Override">Door Override</label>
      <div className="display-name">Hello, Kevin</div>
        <AmplifySignOut />
      <Container className="p-4">
        <Row className="p-3 justify-content-md-center">
          <Col md="auto"> <Sensors name="userID" unit=""/> </Col>
          <Col md="auto"> <Sensors name="Timestamp" unit=""/> </Col>
          <Col md="auto"> <Sensors name="Door" unit=""/> </Col>
          <Col md="auto"> <Sensors name="Accuracy" unit=""/> </Col>
          <Col md="auto"> <Sensors name="Finger" unit=""/> </Col>
        </Row>
      </Container>
    </div>
  ) : (
    <AmplifyAuthenticator />
);
}

export default AuthStateApp;