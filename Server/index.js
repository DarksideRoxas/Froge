const express = require('express');
const ejs = require ('ejs');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const {BlogPost, User} = require('./models.js')
const bcrypt = require('bcrypt');

// Navigation

const clientPath = path.join(__dirname,'../client/');
const staticPath = path.join(clientPath,'/static/');
const viewsPath = path.join(clientPath,'/views/');

// Basic server

const app = express();
app.use(express.static(staticPath));
app.use(express.urlencoded({extended: true}));
app.use(session({
 name: 'Frogs',
 secret: 'eachcathad7kittens',
 saveUninitialized: false,
 resave: false,
 cookie: {
 maxAge: 1000*60*60*24*3,
 }
}));

mongoose.connect('mongodb://localhost:27017/frogs', {useNewUrlParser: true});


app.listen(2000);

// Setting views

app.set('view engine','ejs');
app.set('views',viewsPath);

app.use((req, res, next)=>{
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

app.post('/welcome', (req, res) => {
 req.session.username=req.body.nombre;
 res.send('SUCCESS');
});

// AUTHENTICATION ROUTES

app.get('/register', (req, res) => {
 res.render('register', {data: req.session});
});

app.get('/login', (req, res) => {
 res.render('login', {data: req.session});
});

app.post('/register', async (req, res)=>{
 try {
 let rawpass = req.body.password;
 var hashedpass = await bcrypt.hash(rawpass, 10);
 var user = new User(req.body);
 user.password = hashedpass;
 await user.save();
 res.redirect('/login');
 }
 catch(e) {
 console.log(e);
 res.send("Unable to register!");
 }
})

app.post('/login', (req, res)=>{
 User.findOne({username: req.body.username}, async (error, result)=>{
 if(error) {
 console.log(error);
 res.send("!");
 }
 else if(!result) res.send("User not found.");
 else {
 try {
 let match = await bcrypt.compare(req.body.password, result.password);
 if(match) {
 req.session.username = result.username;
 req.session.authenticated = true;
 req.session.isFrogmaster = result.isFrogmaster;
 res.redirect('/blog/');
 }
 else res.send('Incorrect password');
 }
 catch(e) {
 console.log(e);
 res.send('Error');
 }

 }
 })
 
})


// BLOG ROUTES

const authenticated = function(req, res, next) {
 if(req.session.authenticated) next();
 else res.redirect('/login');
}

const frogmaster = function(req, res, next) {
 if(req.session.isFrogmaster) next();
 else res.send('BEGONE, FOOLISH MORTAL.');
}

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

app.get('/blog/write/', authenticated, frogmaster, (req, res)=>{
 res.render('writing', {data: req.session, draft: {}});
});

app.post('/blog/writepost', authenticated, frogmaster, async (req, res)=>{
 console.log(req.body);
 try {
 let newPost = new BlogPost(req.body);
 newPost.author = req.session.username;
 await newPost.save();
 res.redirect('/blog/');
 }
 catch(e) {
 res.redirect('/blog/write/');
 }
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
 console.log(result)
 let parsedText = result.body.replace(/\r\n|\r|\n/g,"<br />");
 result.parsedText = parsedText;
 res.render('entry',{data: req.session, entry: result});
 }
 })
});

// COMMENTING

app.post('/blog/:id/comment', authenticated, (req, res)=>{
 BlogPost.findById(req.params.id, (error, result)=>{
 if(error) {
 console.log(error);
 res.send('Error');
 }
 else if(!result) {
 res.redirect('/blog/');
 }
 else {
 result.comments.push({author: req.session.username, text: req.body.comment});
 result.save();
 res.redirect(path.join('/blog/', req.params.id+'/'));
 }
 });
});

app.post('/blog/:id/deletecomment/:comment', frogmaster, async (req, res)=>{
 BlogPost.findById(req.params.id, (error, result)=>{
 if(error) {
 console.log(error);
 res.redirect('/');
 }
 else if(!result) {
 res.send('Did you just delete comment on a non-existant post?');
 }
 else {
 result.comments.id(req.params.comment).remove();
 result.save();
 res.redirect('/blog/'+req.params.id+'/');
 }
 });
});


app.get('/blog/:id/edit', frogmaster, (req,res) => {
 BlogPost.findById(req.params.id, (error, result)=>{
 if(error) res.redirect('/blog/');
 else if(!result) res.redirect('/blog/');
 else res.render('writing', {data: req.session, draft: result} );
 });
});

app.post('/blog/:id/edit', frogmaster, (req, res)=>{
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

app.get('/blog/:id/delete', frogmaster, (req, res)=>{
 BlogPost.deleteOne({_id: req.params.id}, (error, result)=>{
 if(error) {
 console.log(error);
 }
 res.redirect('/blog/');
 });
});