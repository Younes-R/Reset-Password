const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');


const sendEmail = require('./utils/sendEmail');

const {generateToken, isValidToken} = require ("./utils/tokenHandler");

const session = require('express-session');
//const flash = require('connect-flash');




const flash = require("connect-flash");

const cookieParser = require('cookie-parser');

const { requireAuth, checkuser } = require('./middleware/authMiddleware');

const app = express();

//reset 

app.use(session({
    secret: 'your secret key',
    resave: false,
    saveUninitialized: true,
}));

app.use(flash());


const dbURI = 'mongodb+srv://Younes:w37UUKvKUHniWsaN@cluster0.4k2zdr1.mongodb.net/first-try';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(res => app.listen(5000))
    .catch(err => console.log(err));

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    
    res.locals.path = req.path;
    next(); 
});

const User = require('./models/User');

app.get('/forgot-pass', (req, res) => {
    res.render('resethandlebars');
})





// middleware fucntion to associate connect-flash on response
app.use((req,res,next)=>{
    res.locals.message = req.flash();
    next()
    })
    // password reset post route
app.post("/password-reset", async (req,res)=>{
    const {email} = req.body;
    try{
let user = await User.findOne({email});
if(user){
    const resetToken =  await generateToken(user._id);
    const link= `${req.protocol}://${req.get('host')}/password-reset-link?token=${resetToken}&id=${user._id}`;
    
// html for email
const html = `<b> Hi ${user.name}, </b>
<p> You requested to reset your password. </p>
<p> Please, click the link below to reset your password. </p>
<a href = "${link}"> Reset Password </a>
`
console.log(link);
const payload = {
    email,
    subject:"Password reset request",
    html
}
sendEmail(payload);
req.flash("success", "Check your email for the password reset link")
    res.redirect("/login")
}else{
    req.flash("error","We could not find any user, please check your email address again")
res.redirect("/forgot-pass")
}
    }catch(er){
        console.log(er);
        req.flash("error","Something went wrong, please try again later!")
        res.redirect("/forgot-pass")
    }
})



//password reset form route
app.get("/password-reset-link",  async (req,res)=>{
if(req.query && req.query.token && req.query.id){
    //check token and id are valid
const{token,id} = req.query;
try{
    const isValid = await isValidToken({token,id});
    if(isValid){
res.render("newPasswordForm",{
    token,
    id,
})
    }else{
res.json({message:"Invalid token or link is expired"})
    }
}catch(er){
    console.log(er)
res.json({message:"something went wrong, please try again latter"})
}
}else{
    res.redirect("/login")
}
})




//accept new password and save it to database
app.post("/newPassword",  async(req,res)=>{
    
    if(req.query.token && req.query.id){
const {token, id}= req.query;
let isValid;
try{
    isValid = await isValidToken({token,id});
}catch(er){
    console.log(er)
}
if(isValid){
const {password, repeatPassword}=req.body;
if(password.length<6){
    
   return  res.render("newPasswordForm",{
    token,
    id,
    errorMessage:"Password need to have minimum 6 characters"
   })
}
if (password!== repeatPassword){
   return  res.render("newPasswordForm",{
    token,
    id,
    errorMessage:" Password is not match."
   })
}
if(password == repeatPassword && password.length>6){
try{
    let hashedPassword = await bcrypt.hash(repeatPassword,10);
    let update_success = await Users.updateOne({_id:id},{password:hashedPassword});
    if(update_success){
        req.flash("success", "password is changed successfully.")
res.redirect("/login");
    }
}catch(er){
    console.log(er)
}
}
} else{
    res.json({message:"Invalid token or link is expired"})  
}
} else{
    res.json({message:"Something went wrong! try again latter"})  
}
    })
