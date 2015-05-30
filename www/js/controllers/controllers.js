angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

  $scope.order = 'expire';
  $scope.reverse = false;

  $scope.setOrder = function(order,reverse){
    $scope.order = order;
    $scope.reverse = reverse;
  }

  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})

.controller('CategoriesCtrl', function($scope, sync) {
  
  $scope.categories = sync.getCategories().then(function(res){
    $scope.categories = res;
      return $scope.categories;
  });

})

.controller('CategoryOffersCtrl', function($scope, $stateParams, sync) {

  var options = {"idCategory": parseInt($stateParams.id)};

  $scope.offers = sync.getOffers(options).then(function(res){
    $scope.offers = res;
      return $scope.offers;
  });
  
  
})

.controller('OffersCtrl', function($scope, $location, $timeout, $ionicLoading, sync) {

  $ionicLoading.show();

  var options = {"idCategory": 2};

  $scope.setCategory = function(idCategory){
    $scope.selectedCategory = idCategory-1;
    $scope.noOffers = false;
    $ionicLoading.show();
    options = {"idCategory": idCategory};
    $scope.offers = sync.getOffers(options).then(function(res){
      $timeout(function() {
        if(res.length == 0){
          $scope.noOffers = true;
          $scope.noOffersText = "no offers in this category";
          $ionicLoading.hide();
        }
        else{
          $scope.offers = res;
          $scope.noOffers = false;
          $ionicLoading.hide();
        }
      }, 300);
        return $scope.offers;
    });
  };

  sync.lastUpdate().then(function(res){
      $scope.categories = sync.getCategories().then(function(res){
        $scope.selectedCategory = 1;
        $scope.categories = res;
          return $scope.categories;
      });
      $scope.offers = sync.getOffers(options).then(function(res){
      $timeout(function() {
        if(res.length == 0){
          $scope.noOffers = true;
          $scope.noOffersText = "no offers in this category";
          $ionicLoading.hide();
        }
        else{
          $scope.offers = res;
          $scope.noOffers = false;
          $ionicLoading.hide();
        }
      }, 300);
          return $scope.offers;
      });
  });
  
  $scope.goToOffer = function(idOffer){
	  $location.path('app/offers/'+idOffer+'');
  }

})

.controller('offerCtrl', function($scope, $stateParams, $timeout, $ionicSlideBoxDelegate, sync) {

  var idOffer = $stateParams.id;
  $scope.offer = sync.getOffer(idOffer).then(function(res){
    $scope.offer = res[0];
    $ionicSlideBoxDelegate.update();
      return $scope.offer;
  });

});
