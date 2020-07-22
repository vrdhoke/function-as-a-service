var aws = require("aws-sdk");
var ses = new aws.SES();
const { v4: uuidv4 } = require("uuid");
const documentClient = new aws.DynamoDB.DocumentClient({ region: "us-east-1" });

exports.handler = function (event, context, callback) {
  var message = event.Records[0].Sns.Message;
  var json = JSON.parse(message);
  const email = json.email;

  const offsettime = 2 * 60;
  const presentTime = Math.round(Date.now() / 1000);
  const expirationTime = presentTime + offsettime;
  const currentTime = Math.round(Date.now() / 1000);

  const DBParams = {
    TableName: "csye6225",
    Item: {
      email: email,
      token: uuidv4(),
      TimeToLive: expirationTime,
    },
  };

  const emailParams = {
    Source: "book@prod.vaibhavdhoke.me",
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Body: {
        Text: {
          Data:
            "Password Reset Link:http://prod.vaibhavdhoke.me/reset?email="+email+"&token="+DBParams.Item.token},
      },
      Subject: { Data: "Password Reset" },
    },
  };

  var params = {
    TableName: "csye6225",
    Key: {
      email: email,
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
