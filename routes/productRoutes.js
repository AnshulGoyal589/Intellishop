const express = require("express");
const router =  express.Router();
const Product = require("../models/Product");
const {isLoggedIn}=require("../middleware");
const mongoose = require("mongoose");
require('dotenv').config();  
const axios = require('axios');
const Review = require("../models/Review");
const app = express();
app.use(express.urlencoded({ extended: true }));


function checkForNullCharacters(obj) {
    for (let key in obj) {
        if (obj[key]==="") {
          return false; 
        }
    }
    return true; 
  }
  let i=1;

router.get("/", async (req,res)=>{   
    
    const products=await Product.find({});    
    res.render("products/homeTemp",{products});
})
router.post("/specific", async (req,res)=>{   
    
    const {input}=req.body;
    const products=await Product.find({ name: { $regex: input, $options: 'i' } });

    let productss = await Product.find({
        frequencyOfPurchase: { $gte: i }
      });

      let productsss = await Product.find({
        frequencyOfPurchase: { $gte: i+1 }
      });

   if(productsss.length>=5){
    i++;
    productss = await Product.find({
        frequencyOfPurchase: { $gte: i }
      });
   }
    res.render("products/homeTemp",{products,productss});
})
router.post("/searchPrice", async (req,res)=>{   
     
    const {input}=req.body;
    const products = await Product.find({ price: { $lte: input } });
    let productss = await Product.find({
        frequencyOfPurchase: { $gte: i }
      });

      let productsss = await Product.find({
        frequencyOfPurchase: { $gte: i+1 }
      });

   if(productsss.length>=5){
    i++;
    productss = await Product.find({
        frequencyOfPurchase: { $gte: i }
      });
   }

    res.render("products/homeTemp",{products,productss});
})
router.get("/specificCategory/men", async (req,res)=>{   
    
    // const {input}=req.body;
    const products = await Product.find({ gender: { $in: ['Men', 'Anyone'] }});
    let productss = await Product.find({
        frequencyOfPurchase: { $gte: i }
      });

      let productsss = await Product.find({
        frequencyOfPurchase: { $gte: i+1 }
      });

   if(productsss.length>=5){
    i++;
    productss = await Product.find({
        frequencyOfPurchase: { $gte: i }
      });
   }

    res.render("products/homeTemp",{products,productss});
})
router.get("/specificCategory/women", async (req,res)=>{   
    
    // const {input}=req.body;
    const products = await Product.find({ gender: { $in: ['Women', 'Anyone'] }});
    let productss = await Product.find({
        frequencyOfPurchase: { $gte: i }
      });

      let productsss = await Product.find({
        frequencyOfPurchase: { $gte: i+1 }
      });

   if(productsss.length>=5){
    i++;
    productss = await Product.find({
        frequencyOfPurchase: { $gte: i }
      });
   }
    res.render("products/homeTemp",{products,productss});
})
router.get("/sort/:basis", async (req,res)=>{   
    const {basis}=req.params;
    console.log(basis);
    const products = await Product.find().sort(basis);
    let productss = await Product.find({
        frequencyOfPurchase: { $gte: i }
      });

      let productsss = await Product.find({
        frequencyOfPurchase: { $gte: i+1 }
      });

   if(productsss.length>=5){
    i++;
    productss = await Product.find({
        frequencyOfPurchase: { $gte: i }
      });
   }
    // const products=await Product.find({name:input});
    res.render("products/homeTemp",{products,productss});
})
router.get("/new", async (req,res)=>{  
  const response = await axios.get(`${process.env.BASE_URL}/product/api`); 
  const product = response.data; 
  console.log(response);
  res.redirect("/products/go");
}) 
router.post("/new", async (req, res) => {
  try {
    const { name, price, img, desc } = req.body;

    // Basic input validation
    if (!name || !price || !img || !desc) {
      return res.status(400).send("Missing required fields");
    }

    // Assuming Product is a Mongoose model
    await Product.insertMany({ name, price, img, desc });

    res.redirect("/products");
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/addProd", isLoggedIn , (req,res)=>{           
    res.render("products/addTemp"); 
})
router.delete("/:productId",isLoggedIn ,async (req,res)=>{
    const {productId}=req.params; 
    await Product.findByIdAndDelete( productId ); 
    const products=await Product.find({});
    req.flash('success','Item deleted from the cart successfully!');
    res.redirect("/products");
})
// router.get("/:productId", async(req,res)=>{ 
//     const {productId} = req.params; 
//     console.log("IIIDDDIDIDI::::",productId);
//     const product = await Product.findById(productId).populate("review");
    
//     res.render("products/show", {product})
// })

router.get("/go", async (req, res) => {
  const productId=req.query.id;
  try {
    if (productId.endsWith(".jpg")) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
    const product = await Product.findById(productId).populate("review");
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.render("products/show", { product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.get("/:productId/edit",isLoggedIn, async (req,res)=>{ 
    const {productId}=req.params;
    const product = await Product.findById( productId );
    res.render("products/update",{product});
})
router.patch("/:productId", async (req,res)=>{
    const {productId}=req.params;
    const product=req.body;
    await Product.findByIdAndUpdate(productId,product);
    req.flash("success",`Details of ${product.name} have been updated suucessfully!!`);
    res.redirect(`/products/${productId}`);
})

module.exports = router