const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    birthDate: {
        type: Date,
        required: true
    },
    email: {
        type: String,
        required: [true, 'Please enter an email'],
        unique: true,
        lowercase: true,
        validate: [isEmail, 'Please enter a valid email']
    },
    phoneNumber: {
        type: String,
        required: [true, 'Please enter a phone number'],
        minlength: [10, 'Number length is 10 digits']
    },
    userType: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [6, 'Minimum password length is 6 characters']
    }
});
// fire a function before doc saved to db. This is an example of a moongose hooks
userSchema.pre('save', function(next) {
    console.log('user about to be created & saved', this); // this refer to the local instance of the user before we saved it the db. If we used arrow functions, we would not be allowed to use 'this'
    next();
})
userSchema.pre('save', async function(next) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt)
    next();
})

// fire a function after doc saved to db
userSchema.post('save', function(doc, next){
    console.log('new user was created & saved', doc);
    next();
})

// static method to login user
userSchema.statics.login = async function(email, password){
    const user = await this.findOne({ email });
    if (user) {
        const auth = await bcrypt.compare(password, user.password);
        if (auth) {
            return user;
        }
        throw Error('incorrect password');
    }
    throw Error('incorrect email');
}

const User = mongoose.model('user',userSchema);

module.exports = User;