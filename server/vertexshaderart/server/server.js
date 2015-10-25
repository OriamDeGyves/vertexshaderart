IMAGE_PATH = process.env.IMAGE_PATH;

if (!IMAGE_PATH) {
  throw "IMAGE_PATH not set";
}

function generateUsername(username) {
  username = username.toLowerCase().trim().replace(" ", "");
  var count = Meteor.users.find({"username": username}).count();
  if (count === 0) {
    return username;
  } else {
    return username + (count + 1).toString();
  }
}

Accounts.onCreateUser(function (options, user) {
    if (options && options.profile) {
        user.profile = options.profile;
    }

    var serviceData = {};
    if (user.services) {
        var service = _.pairs(user.services)[0];

        var serviceName = service[0];
        serviceData = service[1] || {};

        if (serviceName == "facebook") {
            user.emails = [
                {"address": serviceData.email, "verified": true},
            ];
            user.profile = {"first_name": serviceData.first_name, "last_name": serviceData.last_name, "avatar": getFbPicture(serviceData.id)};
        } else if (serviceName == "google") {
            user.emails = [
                {"address": serviceData.email, "verified": true},
            ];
            user.profile = {"first_name": serviceData.given_name, "last_name": serviceData.family_name, "avatar": getGooglePicture(serviceData.id)};
        }
    }

    user.username = generateUsername(user.username || serviceData.username || serviceData.first_name || serviceData.given_name || "unnamed");

    return user;
});

setupAccounts(Meteor.settings.accounts);

function setupAccounts(accounts) {
  if (!accounts) {
    return;
  }

  Object.keys(accounts).forEach(function(name) {
    var account = accounts[name];
    ServiceConfiguration.configurations.upsert(
      { service: name },
      {
        $set: {
          clientId: account.clientId,
          loginStyle: "popup",
          secret: account.secret,
        }
      });
  });
}

WebApp.connectHandlers.use(function(req, res, next) {
console.log(req.headers.host);
  if (req.headers && req.headers.host && req.headers.host.match(/^vertexshaderart.com/) !== null ) {
    res.redirect(301, 'http://www.' + req.headers.host + req.url);
  } else {
    next();
  }
});
