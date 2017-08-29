const express = require('express')
const router = express.Router()
const User = require('../models/User')
const passport = require('passport')
const bodyParser = require('body-parser')
require('../services/passport')
const Poll = require('../models/Poll')

const requireSignin = passport.authenticate('local', {
  failureRedirect: '/error'
})

const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.render('error', { err: 'not signed in' })
}

//Home Page
router.get('/', (req, res) => {
  Poll.find({}).sort({ createdAt: -1 }).limit(100).lean().exec(function(err, docs) {
    if (err) return res.render('error', { err: err });
    User.find({}).sort({ createdAt: -1 }).limit(100).lean().exec(function(err, users) {
      if (req.isAuthenticated()) return res.render('home-protected', { docs: docs, users: users });
      res.render('home', { docs: docs, users: users });
    })

  });
});

//Signup Page
router.get('/signup', (req, res) => {
  res.render('signup')
})

//post request for signup
router.post('/signup', (req, res) => {
  const { username, password } = req.body;
  if (password.length < 6) return res.render('error', { err: 'password must be at least 6 characters. Please try again.' });
  //create new user
  const newUser = new User({ username, password })

  newUser.createUser(newUser, (err, user) => {
    if (err) return res.render('error', { err: err });
    req.login(user, function(err) {
      if (err) return res.render('error', { err: err })
      res.render('create')
    })
  })
})

//signin page
router.get('/signin', (req, res) => {
  res.render('signin')
})

//post request for signin
router.post('/signin', requireSignin, (req, res) => {
  res.render('create')
})

//route handler just for the failure redirect in requireSignin
router.get('/error', (req, res) => {
  res.render('error', { err: 'invalid username or password.' })
})

//Unprotected voting pages
router.get('/poll/:id', (req, res) => {
  Poll.findById(req.params.id).lean().exec(function(err, doc) {
    if (err) return res.render('error', { err: err });
    if (req.isAuthenticated()) return res.render('vote-protected', { doc: doc });
    res.render('vote', { doc: doc })
  })
})

//Protected voting pages - changed to same route as Unprotected, which will check for authentication and render vote-protected if user is authenticated
router.get('/auth/poll/:id', requireAuth, (req, res) => {
  Poll.findById(req.params.id).lean().exec(function(err, doc) {
    if (err) return res.render('error', { err: err });
    res.render('vote-protected', { doc: doc });
  })
})

//Unprotected put request for voting

router.post('/poll/:id', (req, res) => {
  var choice = req.body.options;
  Poll.findById(req.params.id, (err, doc) => {
    if (doc.voters.indexOf(req.ip) !== -1) return res.render('error', { err: 'You have already voted in this poll' });
    Poll.findByIdAndUpdate(req.params.id, { $inc: { [`options.${choice}`]: 1 }, $push: { voters: req.ip } }, { new: true }, function(err, doc) {
      if (err) return res.render('error', { err })
      res.render('vote', { doc })
    })
  })
})

//Protected put request for voting
router.post('/auth/poll/:id', requireAuth, (req, res) => {
  var choice = req.body.options;
  Poll.findById(req.params.id, (err, doc) => {
    if (doc.voters.indexOf(req.user.username) !== -1) return res.render('error-protected', { err: 'You have already voted in this poll' });
    Poll.findByIdAndUpdate(req.params.id, { $inc: { [`options.${choice}`]: 1 }, $push: { voters: req.user.username } }, { new: true }, function(err, doc) {
      if (err) return res.render('error-protected', { err })
      res.render('vote-protected', { doc });
    })
  })
})

//Protected page for adding an option
router.get('/add-option/:id', requireAuth, (req, res) => {
  Poll.findById(req.params.id).lean().exec(function(err, doc) {
    res.render('add-option', { doc: doc })
  })
})

//Protected put request for adding an option
router.post('/add-option/:id', requireAuth, (req, res) => {
  var newOption = req.body.new;
  Poll.findByIdAndUpdate(req.params.id, { [`options.${newOption}`]: 0 }, { new: true }, (err, doc) => {
    if (err) return res.render('error', { err: err });

      res.render('vote-protected', { doc: doc })

  })
})

//Protected list of a users polls
router.get('/polls/:creator', (req, res) => {
  Poll.find({ creator: req.params.creator }).lean().exec(function(err, docs) {
    console.log(docs);
    if (err) return res.render('error', { err: err });
    if (docs.length === 0) {
      docs = 'This user has not created any polls.'

    }
    if (req.isAuthenticated()) return res.render('user-polls-protected', { creator: req.params.creator, docs: docs });
    //res.send({ docs })
    res.render('user-polls', { creator: req.params.creator, docs })
  })
})

//Protected route for my polls
router.get('/my-polls', requireAuth, (req, res) => {
  Poll.find({ creator: req.user.username }).sort({ createdAt: -1 }).exec(function(err, docs) {
    res.render('my-polls', { user: req.user.username, docs: docs })
  })
})

//Protected route for deleting polls
router.get('/delete/:id',/* requireAuth,*/ (req, res) => {
  Poll.findByIdAndRemove(req.params.id, (err) => {
    if (err) return res.render('error', { err: err });
    Poll.find({ creator: req.user.username }).sort({ createdAt: -1 }).exec(function(err, docs) {
      if (err) return res.render('error', { err });
      res.render('my-polls', { user: req.user.username, docs: docs })
    })
  })
})

//Protected route that displays other users
router.get('/users', requireAuth, (req, res) => {
  User.find({}).lean().exec(function(err, docs) {
    if (err) return res.render('error', { err: err });
    res.render('users', { docs: docs})
  })
})

//Protected route where you can create a new poll
router.get('/create', requireAuth, (req, res) => {
  res.render('create')
})

router.post('/create', requireAuth, (req, res) => {
  console.log(req.body);
  var pollOptions = req.body;
  var title = req.body.title;
  var options = []
  Object.keys(pollOptions).forEach(function(key) {
    if (pollOptions[key]) {
      options.unshift(pollOptions[key]);
    }
  })
  console.log(options);
  options.pop();
  var obj = {};
  options.forEach(function(item) {
    obj[item] = 0;
  })
  console.log(obj);
  var newPoll = new Poll({
    title: title,
    creator: req.user.username,
    options: obj,
    voters: []
  })
  newPoll.save(function(err) {
    if(err) return res.render('error', { err: err });
    var host = 'https://joychristian-votingapp.herokuapp.com/poll/';
    //var host = 'localhost:3000/poll/';
    res.render('poll-url', { title: title, url: host + newPoll.id, route: '/poll/' + newPoll.id })
  })
})

//logout route
router.get('/logout', (req, res) => {
  req.logout();
  Poll.find({}).sort({ createdAt: -1 }).lean().exec(function(err, docs) {
    if (err) return res.render('error', { err: err });
    User.find({}).sort({ createdAt: -1 }).lean().exec(function(err, users) {
      if (err) return res.render('error', { err: err });
      res.render('home', { docs: docs, users: users });
    })

  });
});

module.exports = router;
