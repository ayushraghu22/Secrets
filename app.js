require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.set("view engine" ,"ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1:27017/userDB", ()=>{
    console.log("Connected with database");
});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});    // adding the encrypt package as a plugin.
                                    // addding encryptedFields so that it don't encrypt the entire database.


const User = mongoose.model("User", userSchema);


app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/register", (req, res)=>{
    res.render("register");
});


app.post("/register", (req, res)=>{
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
        newUser.save((err)=>{
            if(!err) res.render("secrets"); 
            else console.log(err);
        })
    });
});

app.post("/login", (req, res)=>{
    User.findOne(
        {email: req.body.username}, 
        (err, foundUser)=>{
            if(!err){
                if(foundUser){
                    bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
                        if(result)
                            res.render("secrets");
                        else 
                            res.send(err);
                    });
                }
                else 
                    res.send("Please enter correct username or password");
            }
            else 
                res.send(err);
    });
});


app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
})

