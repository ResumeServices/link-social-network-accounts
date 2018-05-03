if ( Meteor.isClient ) {
    Meteor.linkWithGoogle   =   function (options, callback) {
        if ( !Meteor.userId() ) {
            throw new Meteor.Error(403, 'Please login to an existing account before link.');
        }
        if ( !Package['accounts-google'] || !Package['google'] ) {
            throw new Meteor.Error(402, 'Please include accounts-google and google package')
        }

        if ( !callback && (typeof options === "function") ) {
            callback    =   options;
            options     =   null;
        }

        var credentialRequestCompleteCallback   =   Accounts.oauth.linkCredentialRequestCompleteHandler(callback);
        Package['google'].Google.requestCredential(options, credentialRequestCompleteCallback);
    };

    Meteor.getGooglePlusInfo    =   function(options, callback) {
        if ( Meteor.userId() ) {
            throw new Meteor.Error(401, "You're already logged in.");
        }

        if ( !Package['accounts-google'] || !Package['google'] ) {
            throw new Meteor.Error(402, 'Please include accounts-google and google package')
        }

        if ( !callback && (typeof options === "function") ) {
            callback    =   options;
            options     =   null;
        }

        Package['google'].Google.requestCredential(options, function (credentialTokenOrError) {
            if ( credentialTokenOrError && (credentialTokenOrError instanceof Error) ) {
                callback(credentialTokenOrError);
            } else {
                var credentialSecret    =   OAuth._retrieveCredentialSecret(credentialTokenOrError);
                Meteor.call("Google.__retrieveCredential", credentialTokenOrError, credentialSecret, callback);
            }
        });
    }
}
