/**
 * Created by Aleksandr Parovoi
 * Date: April 25, 2018
 */

Accounts.oauth.registerService('linkedin');
Accounts.oauth.registerService('facebook');

Accounts.addAutopublishFields({
    forLoggedInUser: ['services.linkedin', 'services.facebook'],
    forOtherUsers: [
        'services.linkedin.id',
        'services.linkedin.firstName',
        'services.linkedin.lastName',

        'services.facebook.id',
        'services.facebook.username',
        'services.facebook.gender'
    ]
});