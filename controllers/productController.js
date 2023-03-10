const Product = require("../models/product");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const cloudinary = require('cloudinary');
const WhereClause = require("../utils/whereClause");
const product = require("../models/product");

exports.addProduct = BigPromise(async (req, res, next) => {
    // images
    if(req.body.price > 99999){
        return next(new CustomError("Product price should be less than 99999"))
    }
    let imageArray = []
    if (!req.files) {
        return next(new CustomError("images are required", 401))
    }

    if (req.files) {
        for (let index = 0; index < req.files.photos.length; index++) {
            let result = await cloudinary.v2.uploader.upload(req.files.photos[index].
                tempFilePath, {
                    folder:"products",
            })

            imageArray.push({
                id: result.public_id,
                secure_url: result.secure_url,
            })

        }
    }

    req.body.photos = imageArray
    req.body.user= req.user.id

    const product = await Product.create(req.body);

    res.status(200).json({
        success:true,
        product,
    });


});

exports.getAllProduct = BigPromise( async(req,res,next)=>{
    const resultperPage = 6
    const totalcountProduct =await Product.countDocuments();


    const productsObj= new WhereClause(Product.find({}),req.query).search().filter();
    
    let products = await productsObj.base.clone();
    const filteredProductNumber = product.length

    // products.limit().skip()

    productsObj.pager(resultperPage)
    products = await productsObj.base

    res.status(200).json({
        success:true,
        products,
        filteredProductNumber,
        totalcountProduct        
    })
})

exports.getOneProduct = BigPromise( async(req,res,next)=>{
    const product = await Product.findById(req.params.id);

    if(!product){
        return next(new CustomError('No product found with this id',401))
    }

    res.status(200).json({
        success:true,
        product
    })
})

exports.addReview = BigPromise( async(req,res,next)=>{
    const {rating,comment,productId} = req.body;

    const review = {
        user : req.user._id,
        name : req.user.name,
        rating : Number(rating),
        comment,
    }

    const product = await Product.findById(productId);

    const AlreadyReview = product.reviews.find(
        (rev)=> rev.user.toString() === req.user._id.toString()
    )

    if (AlreadyReview) {
        product.reviews.forEach((review) => {
            if(review.user.toString() === req.user._id.toString()){
                review.comment = comment
                review.rating = rating
            }
        })
    }else{
        product.reviews.push(review);
        product.numberOfReviews = product.reviews.length
    }

    // adjust ratings

    product.ratings = product.reviews.reduce((acc,item) => item.rating + acc, 0)/
    product.reviews.length

    // save

    await product.save({validateBeforeSave:false})

    res.status(200).json({
        success:true,
    })


})

exports.deleteReview = BigPromise( async(req,res,next)=>{
    const { productId } = req.body;
    
    const product = await Product.findById(productId);

    product.reviews = product.reviews.filter(
        (rev) => rev.user.toString() !== req.user._id.toString()
    )

    product.numberOfReviews = product.reviews.length

    // adjust ratings

    product.ratings =  product.reviews.length===0? 0:
        product.reviews.reduce((acc,item) => item.rating + acc, 0)/
        product.reviews.length

    // update the product
    console.log(product.ratings);
    await product.save({validateBeforeSave:false})

    // await Product.findByIdAndUpdate(productId,{
    //     reviews,
    //     ratings,
    //     numberOfReviews
    // },{
    //     new:true,
    //     runValidators:true,
    //     useFindAndModify:true,
    // })

    res.status(200).json({
        success:true,
    })


})

exports.getOnlyReviewsForOneProduct = BigPromise( async(req,res,next) =>{
    
    const {productId} = req.body;
    const product = await Product.findById(productId);
   
    if(!product){
        return next(new CustomError('No product listed for this ',401));
    }

    res.status(200).json({
        success:true,
        reviews: product.reviews,
        ratings: product.ratings,
    })
})



//admin only controllers
exports.adminGetAllProduct = BigPromise( async(req,res,next) =>{
    const products = await Product.find()

    
    
    res.status(200).json({
        success:true,
        products,
    })
})

exports.adminUpdateOneProduct = BigPromise( async(req,res,next)=>{
    let product = await Product.findById(req.params.id);

    if(!product){
        return next(new CustomError('No product found with this id',401));
    }

    let imageArray=[];

    if(req.files){

        //destroy the exitsting image
        for (let index = 0; index < product.photos.length; index++) {
            const res = await cloudinary.v2.uploader.destroy(product.photos[index].id);
            
        }

        //upload and save the images

        for (let index = 0; index < req.files.photos.length; index++) {
            let result = await cloudinary.v2.uploader.upload(
                req.files.photos[index].tempFilePath,
                {
                    folder:"products", // folder name should be for longer run in deployment -> .env 
                }
            );
            imageArray.push({
                id: result.public_id,
                secure_url:result.secure_url,
            });
            
        }
        
        req.body.photos= imageArray;
    }


    product = await Product.findByIdAndUpdate(req.params.id, req.body,{
        new:true,
        runValidators: true,
        useFindAndModify:false
    } );

    res.status(200).json({
        success:true,
        product,
    })
})

exports.adminDeleteOneProduct = BigPromise( async(req,res,next)=>{
    const product = await Product.findById(req.params.id);

    if(!product){
        return next(new CustomError('No product found with this id',401));
    }

    //destroy the exitsting image
    for (let index = 0; index < product.photos.length; index++) {
        await cloudinary.v2.uploader.destroy(product.photos[index].id);
        
    }

    await product.remove();

    res.status(200).json({
        success:true,
        message: "Product was delete !"
    });
})

