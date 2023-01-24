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
    password: String
});

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});    // adding the encrypt package as a plugin.
                                    // addding encryptedFields so that it don't encrypt the entire database.


userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res)=>{
    res.render("home");
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

