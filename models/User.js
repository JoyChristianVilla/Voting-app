const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const userSchema = new Schema({
  username: { type: String, unique: true, lowercase: true },
  password: String
}, { timestamps: true })

//This method gets invoked in the local strategy that gets used in the passport.authenticate method assigned to the requireSignin variable, which is included in the signin post request
userSchema.methods.comparePassword = (password, hash, callback) => {
  bcrypt.compare(password, hash, (err, isMatch) => {
    if (err) return callback(err);
    callback(null, isMatch)
  })
}

//This method gets used in the signup post request
userSchema.methods.createUser = (user, callback) => {
  //Hash the password
  bcrypt.hash(user.password, 10, (err, hash) => {
    //if there is an error, pass it to the callback function
    if (err) return callback(err)
    //Make the password be value be the hash
    user.password = hash;
    //Save the document to the database and then execute the callback function
    user.save(callback)
  })
}

const ModelClass = mongoose.model('user', userSchema)
module.exports = ModelClass
