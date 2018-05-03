Accounts.registerLoginHandler(function (options) {
    if ( options && (typeof options.token === "string") ) {
        check(options, {
            token:      String,
            secret:     Match.OneOf(null, String)
        });

        var result  =   OAuth.retrieveCredential(options.token, options.secret);
        if ( !result ) {
            return {
                type:   "link",
                error:  new Meteor.Error( Accounts.LoginCancelledError.numericError, "No matching link attempt found" )
            };
        }
        if ( result instanceof Error ) {
            throw result;
        } else {
            return Accounts.LinkUserFromExternalService( result.serviceName, result.serviceData, result.options );
        }
    } else {
        return undefined;
    }
});

Accounts.LinkUserFromExternalService    =   function (serviceName, serviceData, options) {
    options     =   _.clone(options || {});
    if ( !Meteor.userId() ) {
        return new Meteor.Error("You must be logged in to use LinkUserFromExternalService");
    }
    if ( (serviceName === "password") || (serviceName === "resume") ) {
        throw new Meteor.Error("Can't use LinkUserFromExternalService with internal service: " + serviceName);
    }
    if ( !_.has(serviceData, 'id') ) {
        throw new Meteor.Error("'id' missing from service data for: " + serviceName);
    }

    var user    =   Meteor.user();
    if ( !user ) {
        return new Meteor.Error('User not found for LinkUserFromExternalService');
    }
    var checkExistingSelector   =   {};
        checkExistingSelector['services.' + serviceName + '.id']    =   serviceData.id;
    var existingUsers           =   Meteor.users.find(checkExistingSelector).fetch();
    if ( existingUsers ) {
        existingUsers.forEach(function(existingUser) {
            if ( existingUser._id !== Meteor.userId() ) {
                throw new Meteor.Error("301", 'This social account is already in use by other user.');
            }
        });
    }
    if ( user.services && user.services[serviceName] && (user.services[serviceName].id !== serviceData.id) ) {
        return new Meteor.Error("302", 'User can link only one account to service: ' + serviceName);
    } else {
        var setAttrs    =   {};
        _.each(serviceData, function(value, key) {
            setAttrs["services." + serviceName + "." + key] =   value;
        });

        Meteor.users.update(user._id, {$set: setAttrs});
        return {
            type:   serviceName,
            userId: user._id
        };
    }
};

Accounts.unlinkService  =   function (userId, serviceName, cb) {
    check(userId, Match.OneOf(String, Mongo.ObjectID));
    if ( typeof serviceName !== 'string' ) {
        throw new Meteor.Error('Service name must be string');
    } else {
        serviceName =   serviceName.trim().toLowerCase();
    }
    var user    =   Meteor.users.findOne({_id: userId});
    if ( (serviceName === 'resume') || (serviceName === 'password') ) {
        throw new Meteor.Error("Internal services can't be unlinked: " + serviceName);
    }
    if ( user.services[serviceName] ) {
        var newServices =   _.omit(user.services, serviceName);
        Meteor.users.update({_id: user._id}, {$set: {services: newServices}}, function (result) {
            if ( cb && (typeof cb === 'function') ) { cb(result); }
        });
    } else {
        throw new Meteor.Error(500, "Service isn't supported");
    }
};
