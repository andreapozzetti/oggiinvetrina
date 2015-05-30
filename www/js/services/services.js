
var apiUrl = "http://shopincomo.comune.como.it/oggiinvetrina/api/";

angular.module('starter.services', [])
.factory('sync', function($document, $window, $rootScope, $http, $log, $q, gettextCatalog) {
  return {

    syncronize: function(timestamp, syncronizeCase){

      var syncAll = [];
      var deferredSyncAll = $q.defer();

      switch (syncronizeCase) {
        // no db in device
        case 0:

          var offers = this.getRemoteOffers(timestamp);
          syncAll.push(offers);
          var categories = this.getRemoteCategories(timestamp);
          syncAll.push(categories);
          var brands = this.getRemoteBrands(timestamp);
          syncAll.push(brands);
          var shops = this.getRemoteShops(timestamp);
          syncAll.push(shops);
        break;

        //update db device
        case 1:

          var removeoffers = this.removeOffers();
          syncAll.push(removeoffers);

          var deleteexpireoffers = this.deleteExpireOffers();
          syncAll.push(deleteexpireoffers);
        break;

        //remove expired offers
        case 2:

          var deleteexpireoffers = this.deleteExpireOffers();
          syncAll.push(deleteexpireoffers);
        break;
      }


      $q.all(syncAll).then( function() {
        deferredSyncAll.resolve(true);
      });

      return deferredSyncAll.promise;

    },

    lastUpdate: function(){

      var syncro = this;

      var deferredLastUpdate = $q.defer();

      return $http.get(apiUrl+'lastupdate.php').then(function(response) {

        var lastRemoteUpdate = response.data.last_update;

        var query = "SELECT MAX( last_update ) AS last FROM offer";

          db.transaction(function(tx) {

            var lastUpdate = {};

            tx.executeSql( query ,[], function( tx, result ) {
  
              var len = result.rows.length, i;

              if(!result.rows.item(0).last){
                console.log("no db");
                syncro.syncronize(0,0).then(function(response){
                  deferredLastUpdate.resolve(response);
                });
              }
              else{
                var lastDBupdate = result.rows.item(0).last;
                if(lastDBupdate < lastRemoteUpdate){
                  console.log("to update");
                  syncro.syncronize(lastDBupdate,1).then(function(response){
                    deferredLastUpdate.resolve(response);
                  });
                }
                else{
                  console.log("database already updated");
                  syncro.syncronize(lastDBupdate,2).then(function(response){
                    deferredLastUpdate.resolve(response);
                  });
                }
              }
            }, function(err){
                  console.log(err);
            });

          });

        return deferredLastUpdate.promise;

      },function(error){
          if(error.status == 502){
            var serverError = gettextCatalog.getString("Server offline. Please try again in few minutes");
            navigator.notification.alert(serverError);
          }
          else if(error.status === 0){
            var connectionError = gettextCatalog.getString("Your internet connection could be slow or absent. Check your internet connection and try again");
            navigator.notification.alert(connectionError);
          }
          else{
            var genericError = gettextCatalog.getString("A error occours. Please close Oggi in vetrina and try again");
            navigator.notification.alert(genericError);
          }
      });

      

    },

    getRemoteOffers: function(timestamp) {

      var promises = [];
      var deferredAllOffers = $q.defer();
      var combinedItems = [];

      var urlOffers;
      if(timestamp){
        urlOffers = apiUrl+'offers.php?timestamp='+timestamp+'';
      }
      else{
        urlOffers = apiUrl+'offers.php';
      }
      
      return $http.get(urlOffers).then(function(response) {

        db.transaction(function(tx) {

          angular.forEach(response.data, function(data,key){

            var deferredOffer = $q.defer();

            //remove previous brands
            tx.executeSql( 'DELETE FROM offer_to_brand WHERE idOffer = ?', [data.id], function( tx, results ) {
            });
			
            //insert offers
            tx.executeSql( 'INSERT OR REPLACE INTO offer ( id, name, description, price, offer_price, discount, url_photo_1, url_photo_2, idShop, expire, last_update ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )',
              [data.id, data.name, data.description, data.price, data.offer_price, data.discount, data.url_photo_1, data.url_photo_2, data.id_shop, data.expire, data.last_update], function(err, res){
				        if(!err){
                  combinedItems = combinedItems.concat(res);
                  deferredOffer.resolve();
                }
            });

            if(data.category){
                  tx.executeSql( 'INSERT OR REPLACE INTO offer_to_category ( idOffer, idCategory ) VALUES ( ?, ? )', [ data.id, data.category ], function(err, res){
              });
            }

            if(data.brands){
              angular.forEach(data.brands, function(brand,key){
                  tx.executeSql( 'INSERT OR REPLACE INTO offer_to_brand ( idOffer, idBrand ) VALUES ( ?, ? )', [ data.id, brand ], function(err, res){
                  });
              });
            }
         
            promises.push(deferredOffer.promise);
          
          });

        });

          $q.all(promises).then( function() {
            deferredAllOffers.resolve(combinedItems);
          });

          return deferredAllOffers.promise;
      },function(error){
          if(error.status == 502){
            var serverError = gettextCatalog.getString("Server offline. Please try again in few minutes");
            navigator.notification.alert(serverError);
          }
          else if(error.status === 0){
            var connectionError = gettextCatalog.getString("Your internet connection could be slow or absent. Check your internet connection and try again");
            navigator.notification.alert(connectionError);
          }
          else{
            var genericError = gettextCatalog.getString("A error occours. Please close Oggi in vetrina and try again");
            navigator.notification.alert(genericError);
          }
      });

    },

    getRemoteCategories: function(syncAll) {

      var promises = [];
      var deferredAllCategories = $q.defer();
      
      return $http.get('categories.json').then(function(response) {

        db.transaction(function(tx) {

        angular.forEach(response.data, function(data,key){

          var deferredCategory = $q.defer();

          //insert categories
          tx.executeSql( 'INSERT OR REPLACE INTO category ( id, name) VALUES ( ?, ?)',
            [data.idCategory, data.name], function(err, res){
              if(!err){
                deferredCategory.resolve();
              }
          });

          promises.push(deferredCategory.promise);
        
        });

      });

        $q.all(promises).then( function() {
          deferredAllCategories.resolve();
        });
                
        return deferredAllCategories.promise;
        
      });

    },

    getRemoteBrands: function(timestamp) {

      var promises = [];
      var deferredAllBrands = $q.defer();

      var urlBrands;
      if(timestamp){
        urlBrands = apiUrl+'brands.php?timestamp='+timestamp+'';
      }
      else{
        urlBrands = apiUrl+'brands.php';
      }
      
      return $http.get(urlBrands).then(function(response) {

        db.transaction(function(tx) {

        angular.forEach(response.data, function(data,key){

          var deferredBrand = $q.defer();

          //insert brands
          tx.executeSql( 'INSERT OR REPLACE INTO brand ( id, name ) VALUES ( ?, ? )',
            [data.id, data.name], function(err, res){
              if(!err){
                deferredBrand.resolve();
              }
          });

          promises.push(deferredBrand.promise);
        
        });
      });

        $q.all(promises).then( function() {
          deferredAllBrands.resolve();
        });
                
        return deferredAllBrands.promise;
        
      },function(error){
          if(error.status == 502){
            var serverError = gettextCatalog.getString("Server offline. Please try again in few minutes");
            navigator.notification.alert(serverError);
          }
          else if(error.status === 0){
            var connectionError = gettextCatalog.getString("Your internet connection could be slow or absent. Check your internet connection and try again");
            navigator.notification.alert(connectionError);
          }
          else{
            var genericError = gettextCatalog.getString("A error occours. Please close Oggi in vetrina and try again");
            navigator.notification.alert(genericError);
          }
      });

    },

    getRemoteShops: function(timestamp) {

      var promises = [];
      var deferredAllShops = $q.defer();

      var urlShops;
      if(timestamp){
        urlShops = apiUrl+'shops.php?timestamp='+timestamp+'';
      }
      else{
        urlShops = apiUrl+'shops.php';
      }
      
      return $http.get(urlShops).then(function(response) {

        db.transaction(function(tx) {

        angular.forEach(response.data, function(data,key){

          var deferredShop = $q.defer();

          //insert brands
          tx.executeSql( 'INSERT OR REPLACE INTO shop ( id, name, address, latitude, longitude) VALUES ( ?, ?, ?, ?, ?)',
            [data.id, data.name, data.address, data.latitude, data.longitude], function(err, res){
              if(!err){
                deferredShop.resolve();
              }
          });

          promises.push(deferredShop.promise);
        
        });
      });

        $q.all(promises).then( function() {
          deferredAllShops.resolve();
        });
                
        return deferredAllShops.promise;
        
      },function(error){
          if(error.status == 502){
            var serverError = gettextCatalog.getString("Server offline. Please try again in few minutes");
            navigator.notification.alert(serverError);
          }
          else if(error.status === 0){
            var connectionError = gettextCatalog.getString("Your internet connection could be slow or absent. Check your internet connection and try again");
            navigator.notification.alert(connectionError);
          }
          else{
            var genericError = gettextCatalog.getString("A error occours. Please close Oggi in vetrina and try again");
            navigator.notification.alert(genericError);
          }
      });

    },

    removeOffers: function() {

      var deferredCheckOffers = $q.defer();
      var syncro = this;

      var urlremoveoffers = apiUrl+'checkoffers.php';
      
      return $http.get(urlremoveoffers).then(function(response) {

        var remoteoffers = response.data;
        var localoffers = [];

        db.transaction(function(tx) {

            //current parkings
            tx.executeSql( 'SELECT id FROM offer', [], function(tx, results){

                var len = results.rows.length, i;
                
                for(i=0;i<len;i++){
                  var row = results.rows.item(i);
                  localoffers.push(row.id);
                }
            
                for(var o=0;o<localoffers.length;o++){
                  var check = syncro.arrayContains(remoteoffers, localoffers[o]);
                  if(check != true){
                    tx.executeSql( 'DELETE FROM offer WHERE id = ?', [ localoffers[o] ] );
                  }  
                }

                deferredCheckOffers.resolve();

            });
        });    
          return deferredCheckOffers.promise;
      },function(error){
          if(error.status == 502){
            var serverError = gettextCatalog.getString("Server offline. Please try again in few minutes");
            navigator.notification.alert(serverError);
          }
          else if(error.status === 0){
            var connectionError = gettextCatalog.getString("Your internet connection could be slow or absent. Check your internet connection and try again");
            navigator.notification.alert(connectionError);
          }
          else{
            var genericError = gettextCatalog.getString("A error occours. Please close Oggi in vetrina and try again");
            navigator.notification.alert(genericError);
          }
      });

    },

    arrayContains: function(array, value) {
      return array.indexOf(value) > -1;
    },
	
    deleteExpireOffers: function() {
		      
      var currentDate = new Date();
      var currentDay = currentDate.getDate()+1;
      var currentMonth = currentDate.getMonth()+1;
      var currentYear = currentDate.getFullYear();
      var now = new Date(""+currentMonth+"/"+currentDay+"/"+currentYear+"");
      var nowMilliseconds = now.getTime();

      var promises = [];
      var deferredAllDelete = $q.defer();

      db.transaction(function(tx) {
  			
  			var query_select = "SELECT id, name, expire FROM offer";
  			var params = [];
  			
  			tx.executeSql( query_select, params, function( tx, results ) {
  				
  				var len = results.rows.length, i;
  				
  				for(i=0;i<len;i++){
  					
  					var row = results.rows.item(i);
  					
  					var deferredDelete = $q.defer();
  					
  					if(row.expire < nowMilliseconds){
  						console.log("remove offer");
  						var query_delete = "DELETE FROM offer WHERE id = ?";
  						var params_delete = [row.id];
  						tx.executeSql( query_delete, params_delete, function( tx, results ) {
  							deferredDelete.resolve();
  						});
  						promises.push(deferredDelete.promise);
  					}
  				};
  			});	
  		});
			
      $q.all(promises).then( function() {
        deferredAllDelete.resolve();
      });
                
        return deferredAllDelete.promise;

    },

    getCategories: function(){

      var deferredAllCategories = $q.defer();
      var categories = [];

      var query_select = "SELECT id, name ";
      var query_from = "FROM category ";
      var query_where = "";
      var params = [];
      
      var query = query_select + query_from + query_where;

        db.transaction(function(tx) {

          var category = {};

          tx.executeSql( query, params, function( tx, results ) {
              
              var len = results.rows.length, i;

              for (i = 0; i < len; i++){
              
                var row = results.rows.item(i);
                
                  category = {
                    id : row.offer_id,
                    name : row.offer_name
                  };

                  categories.push(category);

              }

              deferredAllCategories.resolve(categories);

          }, function(err){
              console.log(err);
          });

        });
        
        return deferredAllCategories.promise;

    },

    getOffers: function(options) {

      var deferredAllOffers = $q.defer();
      var offers = [];

      var query_select = "SELECT o.id AS offer_id, o.name AS offer_name, o.url_photo_1, o.price, o.offer_price, o.discount, o.expire, s.name AS shop_name, b.id AS brand_id, b.name AS brand_name ";
      var query_from = "FROM offer o ";
      var query_join = "LEFT JOIN shop s ON o.idShop = s.id ";
          query_join += "LEFT JOIN offer_to_brand otb ON o.id = otb.idOffer ";
          query_join += "LEFT JOIN brand b ON otb.idBrand = b.id ";
      var query_where = "";
      var params = [];
      
      if(options){
        if(options.idCategory){
          query_join += "JOIN offer_to_category otc ON o.id = otc.idOffer ";
          query_where += "WHERE otc.idCategory = ? ";
          params.push(options.idCategory);
        }
      }

      var query = query_select + query_from + query_join + query_where;

        db.transaction(function(tx) {

          var offer = {};

          tx.executeSql( query, params, function( tx, results ) {
              
              var len = results.rows.length, i;

              for (i = 0; i < len; i++){
              
                var row = results.rows.item(i);
                var price = null;
                var offerPrice = null;
                var discount = null;
                
                if ( !offer[ row.offer_id ] ) {

                  navigator.notification.alert(row.expire);
				  
				  var daytoshow = row.expire-86400;
				  
				  navigator.notification.alert(daytoshow);
				  
                  var d = new Date(daytoshow);
				  
				  navigator.notification.alert(d);
				  
                  var day = d.getDate();
                  var month = d.getMonth()+1;
                  var year = d.getFullYear();
                  var date = day+"/"+month+"/"+year;

                  if(row.price && row.offer_price){
                    if(row.price != "undefined" && row.offer_price != "undefined"){
                      price = row.price;
                      offerPrice = row.offer_price;
                      discount = Math.ceil(((parseInt(row.price)-parseInt(row.offer_price))/row.price)*100);
                    }
                  }

                  if(row.discount){
                    if(row.discount != "undefined"){
                      discount = row.discount;
                    }
                  }

                  offer[ row.offer_id ] = {
                    id : row.offer_id,
                    name : row.offer_name,
                    photo_1 : row.url_photo_1,
                    price : price,
                    offerPrice : offerPrice,
                    discount : discount,
                    brands: [],
                    shop : row.shop_name,
                    expire : row.expire,
                    dateExpire : date
                  };

                }

                if ( row.brand_id ) {
                  offer[ row.offer_id ].brands[ row.brand_id ] = {
                    brand: row.brand_name
                  };

                }
              }

              Object.keys( offer ).forEach(function( key ) {

                  var brands = [];

                  Object.keys( offer[ key ].brands ).forEach(function( c ) {
                    brands.push( offer[ key ].brands[ c ] );
                  });

                  offer[ key ].brands = brands;

                  offers.push( offer[ key ] );

                });

              deferredAllOffers.resolve(offers);

          }, function(err){
              console.log(err);
          });

        });
        
        return deferredAllOffers.promise;

    },

    getOffer: function(idOffer) {

      var deferredOffer = $q.defer();
      var offers = [];

      var query_select = "SELECT o.id AS offer_id, o.name AS offer_name, o.description, o.url_photo_1, o.url_photo_2, o.price, o.offer_price, o.discount, o.expire, s.id AS shop_id, s.name AS shop_name, s.address, s.latitude, s.longitude, c.id AS category_id, c.name AS category_name, b.id AS brand_id, b.name AS brand_name ";
      var query_from = "FROM offer o ";
      var query_join = "LEFT JOIN shop s ON o.idShop = s.id ";
          query_join += "LEFT JOIN offer_to_category otc ON o.id = otc.idOffer ";
          query_join += "LEFT JOIN category c ON otc.idCategory = c.id ";
          query_join += "LEFT JOIN offer_to_brand otb ON o.id = otb.idOffer ";
          query_join += "LEFT JOIN brand b ON otb.idBrand = b.id ";
      var query_where = "WHERE o.id = ?";

      var query = query_select + query_from + query_join + query_where;
     
       db.transaction(function(tx) {

          var offer = {};

          tx.executeSql( query ,[idOffer], function( tx, result ) {

              var len = result.rows.length, i;
              
              for (i = 0; i < len; i++){

                var row = result.rows.item(i);
                

                if ( !offer[ row.offer_id ] ) {

                  var photos = [];
                  var price;
                  var offerPrice;
                  var discount;

                  var daytoshow = row.expire-86400
                  var d = new Date(daytoshow);
                  var day = d.getDate();
                  var month = d.getMonth()+1;
                  var year = d.getFullYear();
                  var date = day+"/"+month+"/"+year;

                  photos.push({"url": row.url_photo_1});

                  if(row.url_photo_2){
                    if(row.url_photo_2 != "undefined"){
                      photos.push({"url": row.url_photo_2});
                    }
                  }

                  if(row.price && row.offer_price){
                    if(row.price != "undefined" && row.offer_price != "undefined"){
                      price = row.price;
                      offerPrice = row.offer_price;
                      discount = Math.ceil(((parseInt(row.price)-parseInt(row.offer_price))/row.price)*100);  
                    }
                  }

                  if(row.discount){
                    if(row.discount != "undefined"){
                      discount = row.discount;
                    }
                  }

                  offer[ row.offer_id ] = {
                    id : row.offer_id,
                    name : row.offer_name,
                    description : row.description,
                    photos : photos,
                    price : price,
                    offerPrice : offerPrice,
                    discount: discount,
                    categories: [],
                    brands: [],
                    shop : row.shop_name,
                    shop_address : row.address,
                    shop_latitude : row.latitude,
                    shop_longitude : row.longitude,
                    expire : date
                  };

                }

                if ( row.category_id ) {

                  offer[ row.offer_id ].categories[ row.category_id ] = {
                    category: row.category_name
                  };

                }

                if ( row.brand_id ) {
                  offer[ row.offer_id ].brands[ row.brand_id ] = {
                    brand: row.brand_name
                  };

                }

              }

              Object.keys( offer ).forEach(function( key ) {

                var categories = [];

                  Object.keys( offer[ key ].categories ).forEach(function( c ) {
                    categories.push( offer[ key ].categories[ c ] );
                  });

                  offer[ key ].categories = categories;

                  var brands = [];

                  Object.keys( offer[ key ].brands ).forEach(function( c ) {
                    brands.push( offer[ key ].brands[ c ] );
                  });

                  offer[ key ].brands = brands;

                  offers.push( offer[ key ] );

                });
              
                deferredOffer.resolve(offers);

          }, function(err){
            console.log(err);
          });

        });
        
        return deferredOffer.promise;

    },
    
    getCategories: function() {

      var deferredAllCategories = $q.defer();
      var categories = [];

      var query = "SELECT id, name FROM category";
      
        db.transaction(function(tx) {
          tx.executeSql( query,[], function( tx, results ) {
              
              var len = results.rows.length, i;
              
              for (i = 0; i < len; i++){
              
                categories.push({
                              id : results.rows.item(i).id,
                              name : results.rows.item(i).name
                });
                
              }

              deferredAllCategories.resolve(categories);

          }, function(err){
            console.log(err);
          });

        });
        
        return deferredAllCategories.promise;

    }
    

  };
});