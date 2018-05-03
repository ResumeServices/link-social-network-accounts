if (Meteor.isClient) {
    Meteor.linkWithLinkedIn =   function (options, callback) {
        if ( !Meteor.userId() ) {
            throw new Meteor.Error(403, 'Please login to an existing account before link.');
        }
        if ( !callback && (typeof options === "function") ) {
            callback    =   options;
            options     =   null;
        }
        var credentialRequestCompleteCallback   =   Accounts.oauth.linkCredentialRequestCompleteHandler(callback);
            LinkedIn.requestCredential(options, credentialRequestCompleteCallback);
    };
    Meteor.loginWithLinkedIn    =   function(options, callback) {
        if ( Meteor.userId() ) {
            throw new Meteor.Error(401, "You're already logged in.");
        }
        // support a callback without options
        if ( !callback && (typeof options === "function") ) {
            callback    =   options;
            options     =   null;
        }
        var credentialRequestCompleteCallback   =   Accounts.oauth.credentialRequestCompleteHandler(callback);
            LinkedIn.requestCredential(options, credentialRequestCompleteCallback);
    };

    Meteor.getLinkedInInfo  =   function(options, callback) {
        if ( Meteor.userId() ) {
            throw new Meteor.Error(401, "You're already logged in.");
        }

        if ( !callback && (typeof options === "function") ) {
            callback    =   options;
            options     =   null;
        }

        LinkedIn.requestCredential(options, function (credentialTokenOrError) {
            if ( credentialTokenOrError && (credentialTokenOrError instanceof Error) ) {
                callback(credentialTokenOrError);
            } else {
                var credentialSecret    =   OAuth._retrieveCredentialSecret(credentialTokenOrError);
                Meteor.call("LinkedIn.__retrieveCredential", credentialTokenOrError, credentialSecret, callback);
            }
        });
    }
}
