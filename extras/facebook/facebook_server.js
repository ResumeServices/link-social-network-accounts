/**
 * Created by Aleksandr Parovoi
 * Date: April 23, 2018
 */
Facebook = {};

OAuth.registerService('facebook', 2, null, function(query) {
    var response    =   getTokenResponse(query);
    var accessToken =   response.accessToken;
    var whitelisted =   ['id', 'email', 'name', 'first_name', 'last_name', 'link', 'gender', 'locale', 'age_range'];
    var identity    =   getIdentity(accessToken, whitelisted);
    var serviceData =   {
        accessToken:    accessToken,
        expiresAt:      (+new Date) + (1000 * response.expiresIn)
    };
    var fields      =   _.pick(identity, whitelisted);
                        _.extend(serviceData, fields);
    return {
        serviceData:    serviceData,
        options:        {profile: {name: identity.name}}
    };
});

// checks whether a string parses as JSON
var isJSON  =   function (str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
};

// returns an object containing:
// - accessToken
// - expiresIn: lifetime of token in seconds
var getTokenResponse    =   function (query) {
    var config  =   ServiceConfiguration.configurations.findOne({service: 'facebook'});
    if ( !config ) {
        throw new ServiceConfiguration.ConfigError();
    }

    var responseContent;
    try {
        // Request an access token
        responseContent =   HTTP.get(
            "https://graph.facebook.com/v2.12/oauth/access_token", {
                params: {
                    client_id:      config.appId,
                    redirect_uri:   OAuth._redirectUri('facebook', config),
                    client_secret:  OAuth.openSecret(config.secret),
                    code:           query.code
                }
            }).content;
    } catch (err) {
        throw _.extend(new Error("Failed to complete OAuth handshake with Facebook. " + err.message),
            {response: err.response});
    }
    if (!isJSON(responseContent)) {
        throw new Error("Failed to complete OAuth handshake with Facebook. " + responseContent);
    }

    // Success!  Extract the facebook access token and expiration
    // time from the response
    var parsedResponse  =   JSON.parse(responseContent);
    var fbAccessToken   =   parsedResponse.access_token;
    var fbExpires       =   parsedResponse.expires;

    if (!fbAccessToken) {
        throw new Error("Failed to complete OAuth handshake with facebook " +
            "-- can't find access token in HTTP response. " + responseContent);
    }
    return {
        accessToken:    fbAccessToken,
        expiresIn:      fbExpires
    };
};

var getIdentity = function (accessToken, fields) {
    try {
        return HTTP.get("https://graph.facebook.com/v2.12/me", {
            params: {
                access_token: accessToken,
                fields: fields
            }
        }).data;
    } catch (err) {
        throw _.extend(new Error("Failed to fetch identity from Facebook. " + err.message),
            {response: err.response});
    }
};

Meteor.methods({
    "Facebook.__retrieveCredential": function (credentialToken, credentialSecret) {
        var credentials =   OAuth.retrieveCredential(credentialToken, credentialSecret);
        if ( (typeof credentials === "object") && credentials.serviceName && (typeof credentials.serviceData !== "undefined") ) {
            var serviceName =   credentials.serviceName;
            var serviceData =   credentials.serviceData;

            if ( !_.has(serviceData, 'id') ) {
                throw new Meteor.Error("'id' missing from service data for: " + serviceName);
            }

            if ( !_.has(serviceData, 'email') ) {
                throw new Meteor.Error(412, "'email' missing from service data for: " + serviceName);
            }

            var tObj                                    =   {};
                tObj['services.' + serviceName + '.id'] =   serviceData.id;

            var checkExistingSelector                   =   {"$or": []};
                checkExistingSelector["$or"].push(tObj);
                checkExistingSelector["$or"].push({"emails.address": serviceData.email});

            var existingUsers           =   Meteor.users.find(checkExistingSelector).fetch();
            if ( existingUsers ) {
                existingUsers.forEach(function(existingUser) {
                    if ( !Meteor.userId() || (existingUser._id !== Meteor.userId()) ) {
                        throw new Meteor.Error("301", 'This social account is already in use.');
                    }
                });
            }

            return credentials;
        }
        throw new Meteor.Error("302", "Service haven't returned the response.");
    }
});