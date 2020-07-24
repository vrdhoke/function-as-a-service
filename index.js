var aws = require("aws-sdk");
var ses = new aws.SES();
const { v4: uuidv4 } = require("uuid");
const region = "us-east-1";
const documentClient = new aws.DynamoDB.DocumentClient({ region: region });

exports.handler = function (event, context, callback) {
  var snsmessage = event.Records[0].Sns.Message;
  var jsonmsg = JSON.parse(snsmessage);
  const senderemail = jsonmsg.email;

  const offsettime = 15 * 60;
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
    Source: "bookstore@prod.vaibhavdhoke.me",
    Destination: {ToAddresses: [senderemail]},
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

  var queryparams = {
    TableName: "csye6225",
    Key: {
      id: senderemail
    },
  };

  documentClient.get(queryparams, function (err, data) {
    if (err) {
        console.log("Error while reading the data from DynamoDB table");
        console.log(err);
    } else {
      if (data.Item) {
        if (data.Item.TimeToLive > currentTime) {
          console.log("email already sent");
        } else {
          ses.sendEmail(emailParams, function (err, data) {
            callback(null, { err: err, data: data });
            if (err) {
              console.log(err);
              console.log("Error while sending the email through SES");
            } else {
              console.log(data);
              console.log("Email sent successfully to "+senderemail);
              documentClient.put(DBParams, function (err, data) {
                if (err) {
                    console.log(err);
                    console.log("Error while storing the token in dynamoDB table");
                }
                else {
                    console.log(data);
                    console.log("Token Successfully stored in dynamoDB table");
                }
              });
            }
          });
        }
      } else {
        ses.sendEmail(emailParams, function (err, data) {
          callback(null, { err: err, data: data });
          if (err) {
            console.log(err);
            console.log("Error while sending the email through SES");
          } else {
            console.log(data);
            console.log("Email sent successfully to "+senderemail);
            documentClient.put(DBParams, function (err, data) {
              if (err) {
                  console.log(err);
                  console.log("Error while storing the token in dynamoDB table");
                }
              else {
                  console.log(data);
                  console.log("Token Successfully stored in dynamoDB table");
                }
            });
          }
        });
      }
    }
  });
};
