const express = require('express');
const fs = require('fs');
const flash = require('connect-flash');
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const colors = require("colors");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override"); 
const session = require('express-session');  
const cookieParser = require('cookie-parser');   
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User=require("./models/User"); 
const {isLoggedIn}=require("./middleware");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const rawData = fs.readFileSync('data.json');
const responses = JSON.parse(rawData);
const bodyParser=require('body-parser'); 
const dotenv = require('dotenv');  
dotenv.config() ;

const PORT= process.env.PORT || 8000;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(bodyParser.json());
  
mongoose.connect(process.env.MONGODB_URL)
.then(()=> console.log("db connected sucessfully".yellow)) 
.catch((err)=> console.log(err));


// app.use('/public', express.static('public'));




const sessionConfig = {

    secret: 'weneedagoodsecret', 
    resave: false,
    saveUninitialized: true,
    cookie : {
      expire : Date.now() + 7*24*60*60*1000
    }

}


const productRoutes = require("./routes/productRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
  

app.engine("ejs", ejsMate); 
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static('public'));

app.use(express.urlencoded({extended:true}))
app.use(express.json());
app.use(methodOverride("_method")); 
app.use(cookieParser('keyboardcat')); 
app.use(session(sessionConfig)); 
app.use(passport.session());
app.use(passport.authenticate('session'));
app.use(flash());
app.use(function (req, res, next) {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser=req.user;
    next(); 
})
app.use("/products", productRoutes);
app.use( reviewRoutes);
app.use( authRoutes);
app.use( cartRoutes);



passport.use(new LocalStrategy(User.authenticate()));

passport.use(new GoogleStrategy({
  clientID:'456174320355-puub5iuanlrgmcjp5c3fgsu1t7b48pp3.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: '/oauth2/redirect/google',
  scope: ['profile']
  },
  function(accessToken, refreshToken, profile, cb) {


  const newUser = new User({ googleId: profile.id , username:profile.displayName , identity:'seller'  });
  newUser.save()
  .then(user => {
    return cb(null, user);
  })
  .catch(err => {
    return cb(err, null);
  });

    
  }
));

app.get('/chat',function(req,res){
	res.render('products/index');
});

app.get('/chat/predict',function(req,res){
	console.log(req.query);
res.render('products/index');
})

app.post('/chat/predict', (req, res) => {
  const {userMessage} = req.body;

  let botResponse = 'I\'m sorry, I don\'t understand your question.'; 

  for (const response of responses) {
    for (const keyword of response.user_input) {
      if (userMessage.toLowerCase()===keyword) {  
        botResponse = response.bot_response;
        break;
      }
    }
  }
  const chatMessage = {
    user: userMessage,
    bot: botResponse,
  };
  res.json({ botResponse });
});

app.get("/",(req,res)=>{
  res.render("products/homePage");
})

app.get("/userProfile",(req,res)=>{
  res.render("products/profileTemp");
})

app.get("/loginViaGoogle",(req,res)=>{
  res.render("products/googleIdentity")
})

app.post("/loginViaGoogle",async (req,res)=>{
  const {identityInput,googleid}=req.body;
  await User.updateOne(
    {googleId:googleid},
    {$set: { identity: identityInput }}
  )
  const updatedUser=await User.find({googleId:googleid});
  console.log(updatedUser);


  res.redirect("/")
})

app.post('/:IDD/create-checkout-session',isLoggedIn, async (req, res) => {
  const {IDD}=req.params;
  const session = await stripe.checkout.sessions.create({
    line_items: [
      { 
        price_data: {
          currency: 'usd', 
          product_data: {
            name: 'T-shirt', 
          },
          unit_amount: 1000, 
        }, 
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.BASE_URL}/success`,
    cancel_url: `${process.env.BASE_URL}/products/${IDD}/cart`,
  });

  res.redirect(303, session.url); 
});


app.get('/oauth2/redirect/google', 
  passport.authenticate('google', { 
    failureRedirect: '/login',
    failureFlash: true,
    successFlash:true 
  }),
  function(req, res) {
    req.flash('success', `Welcome ${req.user.username}`); 
    res.redirect('/loginViaGoogle');
});

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(user, cb) {
  cb(null, user);
});


app.listen(PORT, () => 
    console.log("Server listening at port".blue ,`${process.env.BASE_URL}`.red)
)




