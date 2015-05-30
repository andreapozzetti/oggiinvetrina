angular.module("gettext")
.run(['gettextCatalog', function (gettextCatalog) {
    gettextCatalog.setStrings('it', {
        "Order": "Ordina",
    	"Order by price (lowest first)":"Ordina per prezzo (più economici)",
    	"Order by price (highest first)":"Ordina per prezzo (più cari)",
    	"Order by discount":"Ordina per sconto",
        "Order by expire date": "In scadenza",
        "Offers": "Offerte",
        "Search brand or product": "Cerca brand o prodotto",
        "no offers in this category": "non ci sono offerte in questa categoria",
        "Offer": "Offerta",
        "Health & Beauty": "Salute e Bellezza",
        "Shopping": "Shopping",
        "Leisure time": "Tempo libero",
        "Until": "Scandenza",
        "Discount": "Sconto",
        "Server offline. Please try again in few minutes": "Server non raggiungibile. Prova nei prossimi minuti",
        "Your internet connection could be slow or absent. Check your internet connection and try again": "La tua connessione internet potrebbe essere lenta o assente. Controlla la connessione e riprova",
        "A error occours. Please close Oggi in vetrina and try again": "Scusa, si è verificato un errore. Prova a chiudere e riaprire Oggi in vetrina"

    });

}]);