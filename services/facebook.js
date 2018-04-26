if (Meteor.isClient) {
    Meteor.linkWithFacebook =   function (options, callback) {
        if ( !Meteor.userId() ) {
            throw new Meteor.Error(403, 'Please login to an existing account before link.');
        }
        if (Package['facebook'] || Package['facebook-oauth'] || Package['accounts-facebook']) {
            throw new Meteor.Error(403, 'Please delete accounts-facebook, facebook-oauth and facebook packages');
        }
        if ( !callback && (typeof options === "function") ) {
            callback    =   options;
            options     =   null;
        }
        var credentialRequestCompleteCallback   =   Accounts.oauth.linkCredentialRequestCompleteHandler(callback);
            Facebook.requestCredential(options, credentialRequestCompleteCallback);
    };

    Meteor.loginWithFacebook    =   function(options, callback) {
        if ( Meteor.userId() ) {
            throw new Meteor.Error(401, "You're already logged in.");
        }
        if (Package['facebook'] || Package['facebook-oauth'] || Package['accounts-facebook']) {
            throw new Meteor.Error(403, 'Please delete accounts-facebook, facebook-oauth and facebook packages');
        }
        if ( !callback && (typeof options === "function") ) {
            callback    =   options;
            options     =   null;
        }
        var credentialRequestCompleteCallback   =   Accounts.oauth.credentialRequestCompleteHandler(callback);
            Facebook.requestCredential(options, credentialRequestCompleteCallback);
    }
}


