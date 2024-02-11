const express=require("express");
const router=express.Router();
const mongoose=require("mongoose");
const User=require("../models/User");
const passport = require('passport');
const flash = require('connect-flash');
const twilio = require('twilio');
var GoogleStrategy = require('passport-google-oidc');

const accountSid = process.env.TWILIO_ACCOUNT_SID;  
const authToken = process.env.TWILIO_AUTH_TOKEN;    
const client = new twilio(accountSid, authToken);

router.get("/register",(req,res)=>{

    res.render("auth/register");
    
})

router.post("/register", async (req,res)=>{

    const {userName,emailId,password,phoneNumber,identity}=req.body;
    const user= new User({username:userName,email:emailId,totalCost:0,totalItems:0,phoneNumber:phoneNumber,identity:identity});
    const userCheck=await User.find({username:userName});
    if(userCheck.length){
      req.flash("error","This User already exists, plz try different ID!!")
      res.redirect("/register");
    }else{
      const newUser= await User.register(user,password);
      req.flash("success","You have registered successfully!!");
      res.redirect("/login");
    }
    
})

function sendWelcomeSMS(userPhoneNumber) {
  client.messages
    .create({
      body: 'Good Afternoon Sir. Welcome to our e-commerce website! Hope you would love it!!!',
      from: '+14705398635',
      // to: "+91"+userPhoneNumber.toString()
      to: "+918168079094"
    })
    .then(message => console.log('Welcome SMS sent:', message.sid))
    .catch(error => console.error('Error sending SMS:', error));
}

router.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true,
    successFlash:true  
  }), (req, res) => {
    req.flash('success', `Welcome ${req.user.username}`); 
    const userPhoneNumber = '8168079094'; // Replace with the user's actual phone number
    sendWelcomeSMS(userPhoneNumber);
    res.redirect('/products'); 
  });

router.get('/logout', function(req, res, next) {
    req.logOut(function(err) {
      if (err) {
         return next(err); 
      }
      req.flash("success","Logout Successful!!");
      res.redirect('/login'); 
    });
  });

router.get("/login",(req,res)=>{

    res.render("auth/login");
    
})

module.exports=router