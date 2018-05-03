Accounts.oauth.linkAccountAfterPopupClosed  =   function(credentialToken, callback) {
    var credentialSecret    =   OAuth._retrieveCredentialSecret(credentialToken);
    Accounts.callLoginMethod({
        methodArguments: [{
            token:  credentialToken,
            secret: credentialSecret
        }],
        userCallback: callback || function (err) {
            if ( err && (err instanceof Meteor.Error) && (err.error === Accounts.LoginCancelledError.numericError) ) {
                callback(new Accounts.LoginCancelledError(err.details));
            } else {
                callback(err);
            }
        }
    });
};

Accounts.oauth.linkCredentialRequestCompleteHandler =   function(callback) {
    return function (credentialTokenOrError) {
        if ( credentialTokenOrError && (credentialTokenOrError instanceof Error) ) {
            callback(credentialTokenOrError);
        } else {
            Accounts.oauth.linkAccountAfterPopupClosed(credentialTokenOrError, callback);
        }
    };
};