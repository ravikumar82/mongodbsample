var express = require('express');
var async = require('async');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var bodyParser = require('body-parser')
var request = require("request");
var url = 'mongodb://ravi:ravi123@ds021356.mlab.com:21356/ravitest';
var db
var product_desc;
var resultsResp;

app.use(bodyParser.urlencoded({
	extended: false
}))

// parse application/json 
app.use(bodyParser.json())

function sendError(resp, code, msg) {
	var oa = {
		'error': msg
	};
	resp.writeHead(code, {
		'Content-Type': 'application/json'
	});
	resp.end(JSON.stringify(oa));
}

function sendResponse(resp, code, msg) {
	var oa = {
		'msg': msg
	};
	resp.writeHead(code, {
		'Content-Type': 'application/json'
	});
	resp.end(JSON.stringify(oa));
}

function getProducts(req, res, id, callback) {
	var cursor = db.collection('products').find({
		"product_id": id
	}).toArray(function(err, results) {
		console.log(results);
		//res.send(results)
		resultsResp = results;
		//db.close();
		callback();
	});

}

function getProductDesc(id, callback) {


	var customurl = 'https://api.target.com/products/v3/' + id + '?fields=descriptions&id_type=TCIN&key=43cJWpLjH8Z8oR18KdrZDBKAgLLQKJjz'
	request({
		uri: customurl,
		method: "GET",
		timeout: 10000
	}, function(error, result, body) {
		// console.log(body);
		var profile = JSON.parse(body);
		//	console.log('Response from target : ' + JSON.stringify(profile));
		if (result.statusCode !== 200) {

			console.log('Http Status Code:' + result.statusCode);
		}
		else {
			product_desc = profile.product_composite_response.items[0].general_description;
			// console.log(product_desc);
			callback();
		}
	});

}

function insertProduct(req, res) {

	db.collection('product').insertOne(req.body, (err, result) => {
		if (err) return console.log(err)

		console.log('saved to database')
		sendResponse(res, '200', 'Record saved successfully')
			//db.close();
	})

}

function updateProductByID(req, res,id) {

    var product_id = req.body[0].product_id;

    var setString = "East 31st Street";

    console.log(product_id);

	db.collection('product').updateOne({ 'product_id' : product_id},{ $set: { 'general_description': setString } },
	 (err, result) => {
		if (err) return console.log(err)

		sendResponse(res, '200', 'Record saved successfully')
			//db.close();
	})

}


function formatresponse(resultsResp, product_desc) {

	for (l = 0; l < resultsResp.length; l++) {

		//	resultsResp[l]._id='';
		//	var key = resultsResp[l]._id;
		//	delete resultsResp[key];
		resultsResp[l].general_description = product_desc;

	}
	return resultsResp;

}

/*var updateRestaurants = function(db, callback) {
   db.collection('restaurants').updateOne(
      { "restaurant_id" : "41704622" },
      { $set: { "address.street": "East 32st Street" } },
      function(err, results) {
        console.log(results);
        callback();
   });
};*/
MongoClient.connect(url, function(err, database) {
	// assert.equal(null, err);
	db = database
	console.log('connected to DB')
		//insertDocument(db, function() {
		//   db.close();
		// });

 		//updateRestaurants(db, function() {
 		//	console.log('inserted into database');
      	//	db.close();
 		 //});

});


function getDBConnection() {

	console.log('connected to DB')
	return db;
}



app.get('/', function(req, res) {
	var cursor = db.collection('restaurants').find().toArray(function(err, results) {
		console.log(results);

		res.send(results)
	})
})

app.get('/products', function(req, res) {
	var cursor = db.collection('products').find().toArray(function(err, results) {
		console.log(results);

		res.send(results)
	})
})


app.get('/products/:id', function(req, res) {

	var id = req.params.id;
	console.log(id);

	var parallelFunctions = [];
	parallelFunctions.push(function(callback) {
		//	console.log('inside async push -1')
		getProducts(req, res, id, callback);


	})

	parallelFunctions.push(function(callback) {
		//	console.log('inside async push -2')
		getProductDesc(id, callback);

	})




	//	console.log('calling async parallel');
	async.parallel(
		parallelFunctions,
		function() {
			//	console.log('response block');

			res.send(formatresponse(resultsResp, product_desc));
			//	console.log('response block ---2 ');
		});


})

app.post('/product', (req, res) => {

	if (!req.is('json')) {
		res.jsonp(400, {
			error: 'Bad request'
		});
		return;
	}

	insertProduct(req, res);

})

app.put('/product/:id', (req, res) => {



	if (!req.is('json')) {
		res.jsonp(400, {
			error: 'Bad request'
		});
		return;
	}
	var id = req.params.id;
	console.log(id);

	updateProductByID(req, res, id);

})


app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
	//var addr = server.address();
	//console.log("Chat server listening at", addr.address + ":" + addr.port);
});
