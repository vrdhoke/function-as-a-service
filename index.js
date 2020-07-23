var aws = require("aws-sdk");
var ses = new aws.SES();
const { v4: uuidv4 } = require("uuid");
const region = "us-east-1";
const documentClient = new aws.DynamoDB.DocumentClient({ region: region });

exports.handler = function (event, context, callback) {
  var snsmessage = event.Records[0].Sns.Message;
  var json = JSON.parse(snsmessage);
  const senderemail = json.email;

  const offsettime = 2 * 60;
  const presentTime = Math.round(Date.now() / 1000);
  const expirationTime = presentTime + offsettime;
  const currentTime = Math.round(Date.now() / 1000);

  const DBParams = {
    TableName: "csye6225",
    Item: {
      id: senderemail,
      token: uuidv4(),
      TimeToLive: expirationTime,
    },
  };

  const emailParams = {
    Source: "book@prod.vaibhavdhoke.me",
    Destination: {
      ToAddresses: [senderemail],
    },
    Message: {
        Body: {
            Html: {
              Data:
                "\n Dear User, A request has been received to reset the password. Please click on the below link to reset the password. The link will expire in 15 minutes \n" +
                "http://prod.vaibhavdhoke.me/reset?email=" +senderemail+"&token="+DBParams.Item.token}
          },
          Subject: { Data: "User Account: Password Reset" },
    },
  };

  var params = {
    TableName: "csye6225",
    Key: {
      id: senderemail,
    },
  };

  documentClient.get(params, function (err, data) {
    if (err) {
      console.error(
        "Unable to read item. Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      if (data.Item) {
        if (data.Item.TimeToLive > currentTime) {
          console.log("email already sent");
        } else {
          ses.sendEmail(emailParams, function (err, data) {
            callback(null, { err: err, data: data });
            if (err) {
              console.log(err);
            } else {
              console.log(data);
              console.log("email sent successfully");
              documentClient.put(DBParams, function (err, data) {
                if (err) console.log(err);
                else console.log(data);
              });
            }
          });
        }
      } else {
        ses.sendEmail(emailParams, function (err, data) {
          callback(null, { err: err, data: data });
          if (err) {
            console.log(err);
          } else {
            console.log(data);
            console.log("email sent successfully");
            documentClient.put(DBParams, function (err, data) {
              if (err) console.log(err);
              else console.log(data);
            });
          }
        });
      }
    }
  });
};
