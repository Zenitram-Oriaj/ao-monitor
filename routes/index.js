/**
 * Created by Jairo Martinez on 8/6/15.
 */

//var express = require('express');
var router = require('express').Router();

// Default Route
////////////////////////////////////////////////////

router.post('/upload', function(req,res){
	console.log(req.body);
	res.status(200).json({result: 'ok'});
});

router.get('/check', function (req, res) {
	console.log(req.body);
	res.status(200).json({});
});

router.get('/', function (req, res) {
	res.render('index');
});

module.exports = router;