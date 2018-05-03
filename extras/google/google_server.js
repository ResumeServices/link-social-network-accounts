/**
 * Created by Aleksandr Parovoi
 * Created on 03/05/2018
 */

Meteor.methods({
    "Google.__retrieveCredential": function (credentialToken, credentialSecret) {
        var credentials =   OAuth.retrieveCredential(credentialToken, credentialSecret);
        if ( (typeof credentials === "object") && credentials.serviceName && (typeof credentials.serviceData !== "undefined") ) {
            var serviceName =   credentials.serviceName;
            var serviceData =   credentials.serviceData;

            if ( !_.has(serviceData, 'id') ) {
                throw new Meteor.Error(411, "'id' missing from service data for: " + serviceName);
            }

            if ( !_.has(serviceData, 'email') ) {
                throw new Meteor.Error(412, "'email' missing from service data for: " + serviceName);
            }

            var tObj                                    =   {};
                tObj['services.' + serviceName + '.id'] =   serviceData.id;

            var checkExistingSelector                   =   {"$or": []};
                checkExistingSelector["$or"].push(tObj);
                checkExistingSelector["$or"].push({"emails.address": serviceData.email});

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