/**
 * Created by Aleksandr Parovoi
 * Date: April 25, 2018
 */

Template.configureLoginServiceDialogForLinkedIn.siteUrl =   function () {
    return Meteor.absoluteUrl();
};
Template.configureLoginServiceDialogForLinkedIn.fields  =   function () {
    return [
        {property: 'clientId', label: 'API Key'},
        {property: 'secret', label: 'Secret Key'}
    ];
};