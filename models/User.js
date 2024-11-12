const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')
 // database schema for new and existing users
const UserSchema = new mongoose.Schema({
    name: {
        type:String,
        required: true,
        unique: true
    },
    email: {
        type:String,
        required: true,
        unique:true
    },
    password:{
        type:String,
    }
})

//Added a mongoose middleware (pre save) to hash the password before saving

UserSchema.pre('save', async function(next){
    if (!this.isModified('password') || !this.password)
        return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

module.exports = mongoose.model('User',UserSchema);

