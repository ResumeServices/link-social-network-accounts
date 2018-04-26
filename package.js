Package.describe({
    summary:        'Meteor social networks link system',
    version:        '0.0.3',
    git:            'https://github.com/ResumeServices/link-social-network-accounts.git',
    name:           'alparandr:link-social-network-accounts',
    documentation:  'README.md'
});

Package.onUse(function (api) {
    api.versionsFrom('METEOR@1.2.1');

    api.imply(['accounts-base'], ['client', 'server']);
    api.use(['accounts-google', 'oauth2', 'oauth', 'check', 'underscore', 'service-configuration'], ['client', 'server']);
    api.use('http', ['server']);

    api.addFiles('link-social-network-accounts-client.js', 'client');
    api.addFiles('link-social-network-accounts-server.js', 'server');
    api.addFiles([
        'services/google.js',
        'services/facebook.js',
        'services/linkedin.js'
    ], 'client');
    api.use(['templating', 'random'], 'client');

    // --- facebook
    api.export('Facebook');
    api.addFiles(
        [
            'extras/facebook/facebook_configure.html',
            'extras/facebook/facebook_configure.js'
        ],
        'client');
    api.addFiles('extras/facebook/facebook_server.js', 'server');
    api.addFiles('extras/facebook/facebook_client.js', 'client');
    // --- ./ facebook

    // --- LinkedIn
    api.export('LinkedIn');
    api.addFiles(
        [
            'extras/linkedin/linkedin_configure.html',
            'extras/linkedin/linkedin_configure.js'
        ],
        'client');
    api.addFiles('extras/linkedin/linkedin_server.js', 'server');
    api.addFiles('extras/linkedin/linkedin_client.js', 'client');
    // --- ./ LinkedIn

    api.addFiles('extras/server.js', 'server');
});