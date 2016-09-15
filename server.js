var express = require('express');
var async = require('async');
var app = express();
var MongoClient = require('mongodb').MongoClient;
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
	//	console.log(results);
		//res.send(results)
		resultsResp = results;
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
		var profile = JSON.parse(body);
		if (result.statusCode !== 200) {

			console.log('Http Status Code:' + result.statusCode);
		}
		else {
			product_desc = profile.product_composite_response.items[0].general_description;
			callback();
		}
	});

}

function insertProduct(req, res) {

	db.collection('product').insertOne(req.body, (err, result) => {
		if (err) return console.log(err)

		sendResponse(res, '200', 'Record saved successfully')
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

var updateProductByID = function(req,res,id, callback) {
     
   	for (i = 0; i < req.body.length; i++) {
	
		var product_id = req.body[i].product_id;
		var priceArray=req.body[i].price;

	}

      db.collection('products').updateOne(
      { "product_id" : product_id },
      { $set: { "price": priceArray } },
      function(err, results) {
        sendResponse(res, '200', 'Record saved successfully')
        callback();
   });
};


MongoClient.connect(url, function(err, database) {
	db = database
	console.log('connected to DB')

});


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

		getProducts(req, res, id, callback);
	})

	parallelFunctions.push(function(callback) {
		getProductDesc(id, callback);

	})

	async.parallel(
		parallelFunctions,
		function() {
			res.send(formatresponse(resultsResp, product_desc));
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

		updateProductByID(req,res,id, function() {

 		 });
	

})


app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
	//var addr = server.address();
	//console.log("Chat server listening at", addr.address + ":" + addr.port);
});
