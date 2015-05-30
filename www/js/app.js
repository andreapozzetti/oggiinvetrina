
var db = null;

window.ionic.Platform.ready(function() {
    angular.bootstrap(document, ['starter']);
});

angular.module('starter', ['ionic', 'gettext', 'starter.controllers', 'starter.services'])
.run(function($ionicPlatform, $rootScope, gettextCatalog) {
  $ionicPlatform.ready(function() {
 
    /* LANGUAGE */

    if(typeof navigator.globalization !== "undefined") {
      navigator.globalization.getPreferredLanguage(function(lng) {
        var lang = lng.value;
        language = lang.substring(0, 2);
        gettextCatalog.setCurrentLanguage(language);
        gettextCatalog.currentLanguage = language;
      }, null);
    }
    
    /* DATABASE */
	
	db = window.sqlitePlugin.openDatabase({name: "oggiinvetrina.db", location: 1});

    db.transaction(function(tx) {

      //OFFER TABLE
      tx.executeSql('CREATE TABLE IF NOT EXISTS offer (id INTEGER PRIMARY KEY, name TEXT, description TEXT, price REAL, offer_price REAL, discount INTEGER, url_photo_1 TEXT, url_photo_2 TEXT, idShop INTEGER, expire INTEGER, last_update INTEGER)');
      
      //SHOP TABLE
      tx.executeSql('CREATE TABLE IF NOT EXISTS shop (id INTEGER PRIMARY KEY, name TEXT, address TEXT, latitude TEXT, longitude TEXT)');

      //BRAND TABLE 
      tx.executeSql('CREATE TABLE IF NOT EXISTS brand (id INTEGER PRIMARY KEY, name TEXT)');

      //CATEGORY
      tx.executeSql('CREATE TABLE IF NOT EXISTS category (id INTEGER PRIMARY KEY, name TEXT)');

      //OFFER_TO_BRAND TABLE
      tx.executeSql( 'CREATE TABLE IF NOT EXISTS offer_to_brand ( idOffer INTEGER, idBrand INTEGER, PRIMARY KEY( idOffer, idBrand ) )' );

      //OFFER_TO_CATEGORY TABLE
      tx.executeSql( 'CREATE TABLE IF NOT EXISTS offer_to_category ( idOffer INTEGER, idCategory INTEGER, PRIMARY KEY( idOffer, idCategory ) )' );
    });    
  });
})

.constant('$ionicLoadingConfig', {
  content: '<ion-spinner class="spinner-light"></ion-spinner>',
  animation: 'fade-in',
  showBackdrop: true
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/menu.html",
    controller: 'AppCtrl'
  })

  .state('app.search', {
    url: "/search",
    views: {
      'menuContent': {
        templateUrl: "templates/search.html"
      }
    }
  })

  .state('app.browse', {
    url: "/browse",
    views: {
      'menuContent': {
        templateUrl: "templates/browse.html"
      }
    }
  })

  
  .state('app.categories', {
    url: "/categories",
      views: {
      'menuContent': {
        templateUrl: "templates/categories.html",
        controller: 'CategoriesCtrl'
      }
    }
  })

  .state('app.categoryoffers', {
    url: "/offers/category/:id",
      views: {
      'menuContent': {
        templateUrl: "templates/offers.html",
        controller: 'CategoryOffersCtrl'
      }
    }
  })

  .state('app.offers', {
    url: "/offers",
      views: {
      'menuContent': {
        templateUrl: "templates/offers.html",
        controller: 'OffersCtrl'
      }
    }
  })

  .state('app.offer', {
    url: "/offers/:id",
    views: {
      'menuContent': {
        templateUrl: "templates/offer.html",
        controller: 'offerCtrl'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/offers');
});
