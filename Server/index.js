const express = require('express');
const ejs = require ('ejs');
const path = require('path');

// Navigation

const clientPath = path.join(__dirname,'../client/')
const staticPath = path.join(clientPath,'/static/');
const viewsPath = path.join(clientPath,'/views/')

// Basic server

const app = express();
app.use(express.static(staticPath));
app.listen(2000);

// Setting views

app.set('view engine','ejs');
app.set('views',viewsPath);


// Visitor counter

var x = 0;

const counter = function(req, res, next) {
    x++;
    console.log(x);
    next();
}


// Routes

app.get('/', function(req, res) {
    res.render('index');
});

app.get('/Frogs', counter, function(req, res) {
    res.render('Frogs',{count: x});
});
