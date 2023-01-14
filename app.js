//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();

app.set("view engine" ,"ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1:27017/userDB", ()=>{
    console.log("Connected with database");
});

const userSchema = {
    email: String,
    password: String
};

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
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save((err)=>{
        if(!err) res.render("secrets"); 
        else console.log(err);
    })
});

app.post("/login", (req, res)=>{
    User.findOne(
        {email: req.body.username}, 
        (err, foundUser)=>{
            if(!err){
                if(foundUser){
                    if(foundUser.password === req.body.password)
                        res.render("secrets");
                    else
                        res.send("Please enter correct username or password");
                }
                else 
                    res.send("Please enter correct username or password");
            }
            else 
                console.log(err);
    })
});



app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
})

