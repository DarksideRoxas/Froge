const express = require('express');
const ejs = require ('ejs');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const { Cookie } = require('express-session');
const mongoose = require('mongoose');
const {BlogPost} = require('./models.js')

// Navigation

const clientPath = path.join(__dirname,'../client/')
const staticPath = path.join(clientPath,'/static/');
const viewsPath = path.join(clientPath,'/views/')

// Basic server

const app = express();
app.use(express.static(staticPath));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
        name: 'Frogs',
        secret: 'eachcathad7kittens',
        saveUninitialized: false,
        resave: false,
        cookie: {
            maxAge: 1000*60*60*24*3,
        }
}));

mongoose.connect('mongodb://localhost:27017/Frogs', {useNewUrlParser: true});
app.listen(2000);

// Setting views

app.set('view engine','ejs');
app.set('views',viewsPath);

app.use((req, res, next) => {
    console.log(req.originalUrl);
    next();
})

// Routes

app.get('/', function(req, res) {
    console.log(req.session)
    res.render('index', {data: req.session});
});

app.get('/famous', function(req, res) {
    res.render('famous', {data: req.session});
});

app.get('/blog/', async (req, res)=>{
    var posts = await BlogPost.find({}, (error, result) => {
        if(error) {
            console.log(error);
            res.sendStatus(500);
        }
        console.log(result);
        res.render('blog', {data: req.session, postset: result});
    });

});

app.get('/blog/write/', (req, res)=>{
    res.render('writing', {data: req.session, draft: {}});
});

app.get('/blog/:id/', (req,res) => {
    var searchID = req.params.id;
    BlogPost.findById(searchID, (error, result)=>{
        if(error) {
            console.log(error);
            res.redirect('/blog/');
        }
        else if(!result) {
            res.status(404);
        }
        else {
            res.render('entry',{data: req.session, entry: result});
        }
    })
});

app.post('/blog/writepost', async (req, res)=>{
    console.log(req.body);
    try {
        let newPost = new BlogPost(req.body);
        await newPost.save();
        res.redirect('/blog/');
    }
    catch(e) {
        res.redirect('/blog/write/');
    }
});

app.post('/welcome', (req, res) => {
    req.session.username=req.body.nombre;
    res.send('SUCCESS');
});

app.get('/blog/:id/edit', (req,res)=>{
    BlogPost.findById(req.params.id, (error, result)=>{
        if(error) res.redirect('/blog/');
        else if(!result) res.redirect('/blog/');
        else res.render('writing', {data: req.session, draft: result} );
    });
});

app.post('/blog/:id/edit', (req, res)=>{
    BlogPost.findById(req.params.id, (error, result)=>{
        if(error) {
            console.log(error);
            res.status(500);
        }
        else if (result) {
            result.title = req.body.title;
            result.body = req.body.body;
            result.save();
            res.redirect(path.join('/blog/', req.params.id));
        }
        else res.redirect('/blog/');
    });
});

app.get('/blog/:id/delete', (req, res)=>{
    BlogPost.deleteOne({_id: req.params.id}, (error, result)=>{
        if(error) {
            console.log(error);
        }
        res.redirect('/blog/');
    });
});