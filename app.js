require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
// passport-local is not imported as it is a dependency for passport-local-mongoose.

// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set("view engine" ,"ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: "This is our secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1:27017/userDB", ()=>{
    console.log("Connected with database");
});

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String
});

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});    // adding the encrypt package as a plugin.
                                    // addding encryptedFields so that it don't encrypt the entire database.


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
    done(null, user.id); 
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"  // Adding this because google has sunsetted the google+, and 
  },                                                                 // this package relied on google+.
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user); 
    });
  }
));

app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })  // this line is enough to take us to google authentication page.
);                                                         // here scope means the authentication will ask for user's profile to google.

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/register", (req, res)=>{
    res.render("register");
});

app.get("/secrets", (req, res)=>{
    if(req.isAuthenticated())
        res.render("secrets");
    else 
        res.redirect("/login");
});

app.get("/submit", (req,res)=>{
    if(req.isAuthenticated())
        res.render("submit");
    else 
        res.redirect("/login");
});

app.post("/submit", (req, res)=>{

});

app.get("/logout", (req, res)=>{
    req.logout((err)=>{
        if(err)
            console.log(err);
        else 
            res.redirect("/");
    });
});

app.post("/register", (req, res)=>{
    User.register({username: req.body.username}, req.body.password, (err, user)=>{
        if(err)
            console.log(err);
        else{
            passport.authenticate("local")(req, res, ()=>{   // authenticate using local strategy.
                res.redirect("/secrets");                    // will generate a cookie.
            });
        }
    });
});

app.post("/login", (req, res)=>{
   const user = new User({
    username: req.body.username,
    password: req.body.password
   });

   req.login(user, (err)=>{
    if(err) 
        console.log(err);
    else{
        passport.authenticate("local")(req, res, ()=>{ 
            res.redirect("/secrets");
        });
    }
   });
});


app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
})

