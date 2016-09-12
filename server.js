var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var bodyParser = require('body-parser')
var url = 'mongodb://ravi:ravi123@ds021356.mlab.com:21356/ravitest';
var db
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json 
app.use(bodyParser.json())

function sendError(resp, code, msg) {
	var oa = {
		'error' : msg
	};
	resp.writeHead(code, {
		'Content-Type' : 'application/json'
	});
	resp.end(JSON.stringify(oa));
}

function sendResponse(resp, code, msg) {
	var oa = {
		'msg' : msg
	};
	resp.writeHead(code, {
		'Content-Type' : 'application/json'
	});
	resp.end(JSON.stringify(oa));
}

function getRestaurants(req,res,id){
	  var cursor =db.collection('restaurants').find({ "restaurant_id": id }).toArray(function(err, results) {
	  //console.log(results);
	  res.send(results)
	  //db.close();
	});
   
}

function insertRestaurant(req,res){
	  
	db.collection('restaurants').insertOne(req.body, (err, result) => {
	    if (err) return console.log(err)

	    console.log('saved to database')
	    sendResponse(res,'200','Record saved successfully')
	 //db.close();
    })

}

	MongoClient.connect(url, function(err, database) {
	 // assert.equal(null, err);
	  db=database
	  console.log('connected to DB')
	  //insertDocument(db, function() {
	   //   db.close();
	 // });
	});


function getDBConnection(){

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

app.get('/restaurants/:id', function(req, res) {
  
	  var id = req.params.id;
	  console.log(id);
	  getRestaurants(req,res,id)
	
})


app.post('/restaurant', (req, res) => {
  
	if (!req.is('json')) {
		res.jsonp(400, {
			error : 'Bad request'
		});
		return;
		}
	
	insertRestaurant(req,res);	

})
app.listen(3000, function() {
  console.log('listening on 3000')
})