'use strict';

angular.module('app')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/signin', {
        templateUrl: 'pages/signin/signin.html',
        controller: 'Signin',
        title: 'Sign in'
      });
  })
  .controller('Signin', function ($scope, $routeParams, $api, $location, $window) {
    // Redirect user to homepage if already logged in.
    // Need to wait to see if current_person is explicitly set to false.
    $scope.teams = [];
    $scope.$watch('current_person', function(current_person) {
      if (current_person) {
        $api.person_teams(current_person.id).then(function(teams) {
          $scope.teams = teams;
        });
      }
      if ($location.path() === '/signin' && current_person !== false) {
        $location.url("/").replace();
      }
    });

    // probably doesn't belong here... this is how navbar's "Sign Out" is wired
    $scope.signout = $api.signout;

    // these are global... used both on signin page and also in navbar dropdown
    $scope.providers = [
      { id: 'github', name: 'GitHub', image_url: 'images/favicon-github.png' },
      { id: 'twitter', name: 'Twitter', image_url: 'images/favicon-twitter.png' },
      { id: 'facebook', name: 'Facebook', image_url: 'images/favicon-facebook.png' }
    ];
    $scope.signin_url_for = $api.signin_url_for;

    // passed in with a linked account
    $scope.provider = $routeParams.provider;
    $scope.form_data = {
      email: $routeParams.email,
      account_link_id: $routeParams.account_link_id,
      first_name: $routeParams.first_name,
      last_name: $routeParams.last_name,
      display_name: $routeParams.display_name,
      image_url: $routeParams.image_url,
      terms: false
    };

    // If the email changes in the model (this can happen from autofill or query params),
    // kick off the change right away.
    $scope.$watch('form_data.email', $scope.email_changed);

    // this tracks form state
    //   null == don't show errors yet
    //   'pending' == user typed email and blurred it
    //   'signin' == email checked and exists
    //   'signup' == email checked and available
    $scope.signin_or_signup = null;

    // don't show initial validations until form has been submitted
    $scope.show_validations = false;


    $scope.email_changing = function() {
      $scope.signin_or_signup = null;
    };

    $scope.email_changed = function() {
      if ($scope.email_previous !== $scope.form_data.email) {
        $scope.email_previous = $scope.form_data.email;
        $scope.signin_or_signup = 'pending';
        $api.check_email_address($scope.form_data.email).then(function(response) {
          if (response.email_is_registered) {
            $scope.signin_or_signup = 'signin';
          } else {
            $scope.signin_or_signup = 'signup';
          }
        });
      }
    };

    $scope.follow_trackers_from_route_params = function() {
      if ($routeParams.follow_tracker_ids) {
        var tracker_ids = $routeParams.follow_tracker_ids.split(',');
        for (var i=0; i<tracker_ids.length; i++) {
          $api.tracker_follow(tracker_ids[i]);
        }
      }
    };

    // form submit
    $scope.signin = function() {
      if ($scope.signin_or_signup !== 'pending') {
        $scope.show_validations = true;
        $scope.error = null;
        $api.signin($scope.form_data).then(function(response) {
          if (response.error) {
            $scope.error = response.error;
          } else {
            // Hack: Follow Trackers whose IDs are appended to the redirect URL.
            $scope.follow_trackers_from_route_params();

            $window._gaq.push(['_trackEvent', 'Signin-Form' , 'Successful-Submit']);
          }
        });
      }
    };

    $scope.signup = function() {
      if ($scope.signin_or_signup !== 'pending') {
        $scope.show_validations = true;
        $scope.error = null;
        $api.signup($scope.form_data).then(function(response) {
          if (response.error) {
            $scope.error = response.error;
          } else {
            // Hack: Follow Trackers whose IDs are appended to the redirect URL.
            $scope.follow_trackers_from_route_params();

            $window._gaq.push(['_trackEvent', 'Signup-Form' , 'Successful-Submit']);
          }
        });
      }
    };

    $scope.forgot_password = function() {
      $api.request_password_reset({ email: $scope.form_data.email }).then(function(response) {
        $scope.error = response.message;
      });
    };
  });
