/**
 * Created by Aleksandr Parovoi
 * Date: April 25, 2018
 */

LinkedIn    =   {};
OAuth.registerService('linkedin', 2, null, function(query) {
    var response    =   getTokenResponse(query);
    var accessToken =   response.accessToken;
    var identity    =   getIdentity(accessToken);
    var id          =   identity.id;
    if (!id) {
        throw new Error("LinkedIn did not provide an id");
    }
    var serviceData =   {
        id:             id,
        accessToken:    accessToken,
        expiresAt:      (+new Date) + (1000 * response.expiresIn)
    };
    var whiteListed =   ['firstName', 'headline', 'lastName'];

    // include all fields from linkedin
    // https://developer.linkedin.com/documents/authentication
    var fields  =   _.pick(identity, whiteListed);

    // list of extra fields
    // http://developer.linkedin.com/documents/profile-fields
    var extraFields =   'email-address,location:(name),num-connections,picture-url,public-profile-url,skills,languages,three-current-positions,recommendations-received';

    // remove the whitespaces which could break the request
    extraFields     =   extraFields.replace(/\s+/g, '');
    fields          =   getExtraData(accessToken, extraFields, fields);
    _.extend(serviceData, fields);
    return {
        serviceData:    serviceData,
        options:    {
            profile:    fields
        }
    };
});

var getExtraData    =   function(accessToken, extraFields, fields) {
    var url         =   'https://api.linkedin.com/v1/people/~:(' + extraFields + ')';
    var response    =   Meteor.http.get(url, {
                            params: {
                                oauth2_access_token:    accessToken,
                                format:                 'json'
                            }
                        }).data;
    return _.extend(fields, response);
};

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
var getTokenResponse = function (query) {
    var config  =   ServiceConfiguration.configurations.findOne({service: 'linkedin'});
    if (!config) {
        throw new ServiceConfiguration.ConfigError("Service not configured");
    }
    var responseContent;
    try {
        // Request an access token
        responseContent =   Meteor.http.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            {
                params: {
                    grant_type:     'authorization_code',
                    client_id:      config.clientId,
                    client_secret:  OAuth.openSecret(config.secret),
                    code:           query.code,
                    redirect_uri:   OAuth._redirectUri('linkedin', config)
                }
            }).content;
    } catch (err) {
        throw new Error("Failed to complete OAuth handshake with LinkedIn. " + err.message);
    }

    // If 'responseContent' does not parse as JSON, it is an error.
    if ( !isJSON(responseContent) ) {
        throw new Error("Failed to complete OAuth handshake with LinkedIn. " + responseContent);
    }

    // Success! Extract access token and expiration
    var parsedResponse  =   JSON.parse(responseContent);
    var accessToken     =   parsedResponse.access_token;
    var expiresIn       =   parsedResponse.expires_in;

    if ( !accessToken ) {
        throw new Error("Failed to complete OAuth handshake with LinkedIn " +
            "-- can't find access token in HTTP response. " + responseContent);
    }
    return {
        accessToken:    accessToken,
        expiresIn:      expiresIn
    };
};

var getIdentity =   function (accessToken) {
    try {
        return Meteor.http.get(
                    "https://www.linkedin.com/v1/people/~",
                    {
                        params: {
                            oauth2_access_token:    accessToken,
                            format:                 'json'
                        }
                    }
                ).data;
    } catch (err) {
        throw new Error("Failed to fetch identity from LinkedIn. " + err.message);
    }
};

LinkedIn.retrieveCredential     =   function(credentialToken, credentialSecret) {
    return OAuth.retrieveCredential(credentialToken, credentialSecret);
};

Meteor.methods({
    "LinkedIn.__retrieveCredential": function (credentialToken, credentialSecret) {
        var credentials =   OAuth.retrieveCredential(credentialToken, credentialSecret);
        if ( (typeof credentials === "object") && credentials.serviceName && (typeof credentials.serviceData !== "undefined") ) {
            var serviceName =   credentials.serviceName;
            var serviceData =   credentials.serviceData;

            if ( !_.has(serviceData, 'id') ) {
                throw new Meteor.Error(411, "'id' missing from service data for: " + serviceName);
            }

            if ( !_.has(serviceData, 'emailAddress') ) {
                throw new Meteor.Error(412, "'email' missing from service data for: " + serviceName);
            }

            var tObj                                    =   {};
                tObj['services.' + serviceName + '.id'] =   serviceData.id;

            var checkExistingSelector                   =   {"$or": []};
                checkExistingSelector["$or"].push(tObj);
                checkExistingSelector["$or"].push({"emails.address": serviceData.emailAddress});

            var existingUsers                           =   Meteor.users.find(checkExistingSelector).fetch();
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