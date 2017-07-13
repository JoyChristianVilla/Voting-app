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
  Poll.find({}).sort({ createdAt: -1 }).exec(function(err, docs) {
    if (err) return res.render('error', { err: err });
    res.render('home', { docs: docs });
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
      res.redirect('/create')
    })
  })
})

//signin page
router.get('/signin', (req, res) => {
  res.render('signin')
})

//post request for signin
router.post('/signin', requireSignin, (req, res) => {
  res.redirect('/create')
})

//route handler just for the failure redirect in requireSignin
router.get('/error', (req, res) => {
  res.render('error', { err: 'invalid email or password.' })
})

//Unprotected voting pages
router.get('/:creator/:title', (req, res) => {
  Poll.findOne({ creator: req.params.creator, title: req.params.title }).exec(function(err, doc) {
    if (err) return res.render('error', { err: err });
    res.render('vote', { title: doc.title, options: doc.options })
  })
})

//Protected voting pages
router.get('/auth/:creator/:title', requireAuth, (req, res) => {
  Poll.findOne({ creator: req.params.creator, title: req.params.title }).exec(function(err, doc) {
    if (err) return res.render('error', { err: err });
    res.render('vote-protected', { title: doc.title, options: doc.options, creator: doc.creator });
  })
})

//Unprotected put request for voting
router.put('/:creator/:title', (req, res) => {
  Poll.findOneAndUpdate({ creator: req.params.creator, title: req.params.title}, (err, doc) => {
    if (err) return res.render('error', { err: err });
    for (i in doc.options) {
      if (i === req.body.options) {
        doc.options[i]++
      }
    }
    doc.save(function(err) {
      if (err) return res.render('error', { err: err });
      res.redirect('/' + req.params.creator + '/' + req.params.title);
    })
  })
})

//Protected put request for voting
router.put('/auth/:creator/:title', requireAuth, (req, res) => {
  Poll.findOneAndUpdate({ creator: req.params.creator, title: req.params.title}, (err, doc) => {
    if (err) return res.render('error', { err: err });
    if (doc.voters.indexOf(req.user.username) !== -1) return res.render('error', { err: 'You have already voted in this poll.' })
    for (i in doc.options) {
      if (i === req.body.options) {
        doc.options[i]++
      }
    }
    doc.voters.push(req.user.username);
    doc.save(function(err) {
      if (err) return res.render('error', { err: err });
      res.redirect('/' + req.params.creator + '/' + req.params.title);
    })
  })
})

//Protected page for adding an option
router.get('/add-option/:creator/:title', requireAuth, (req, res) => {
  Poll.findOne({ creator: req.params.creator, title: req.params.title }).exec(function(err, doc) {
    res.render('add-option', { title: doc.title, options: doc.options, creator: doc.creator })
  })
})

//Protected put request for adding an option
router.put('/add-option/:creator/:title', requireAuth, (req, res) => {
  var newOption = req.body.new;
  Poll.findOneAndUpdate({ creator: req.params.creator, title: req.params.title}, (err, doc) => {
    if (err) return res.render('error', { err: err });
    doc.options.newOption = 0;
    doc.save(function(err) {
      if (err) return res.render('error', { err: err });
      res.redirect('/' + req.params.creator + '/' + req.params.title)
    })
  })
})

//Unprotected list of a users polls
router.get('/:creator', (req, res) => {
  Poll.find({ creator: req.params.creator }).sort({ createdAt: -1 }).exec(function(err, docs) {
    if (err) return res.render('error', { err: err });
    res.render('user-polls', { creator: req.params.creator, docs: docs })
  })
})

//Protected route for my polls
router.get('/my-polls', requireAuth, (req, res) => {
  Poll.find({ creator: req.user.username }).sort({ createdAt: -1 }).exec(function(err, docs) {
    res.render('my-polls', { user: req.user.username, docs: docs })
  })
})

//Protected route for deleting polls
router.delete('/delete/:creator/:title', requireAuth, (req, res) => {
  Poll.findOneAndRemove({ creator: req.params.creator, title: req.params.title }, (err) => {
    if (err) return res.render('error', { err: err });
    res.redirect('/my-polls');
  })
})

//Protected route that displays other users
router.get('/users', requireAuth, (req, res) => {
  User.find({}).exec(function(err, docs) {
    if (err) return res.render('error', { err: err });
    res.render('users', { docs: docs})
  })
})

//Protected route where you can create a new poll
router.get('/create', requireAuth, (req, res) => {
  res.render('create')
})

router.post('/create', requireAuth, (req, res) => {
  var pollOptions = req.body;
  var title = req.body.title;
  delete pollOptions.title;
  var obj = {};
  for (i in pollOptions) {
    obj.pollOptions[i] = 0;
  }
  var newPoll = new Poll({
    title: title,
    creator: req.user.username,
    options: obj,
    voters: []
  })
  newPoll.save(function(err) {
    if(err) return res.render('error', { err: err });
    var host;
    if (port === 3000) {
      host = 'localhost:3000/';
    } else {
      host = 'https://joychristian-votingapp.herokuapp.com/';
    }
    res.render('poll-url', { title: title, url: host + req.user.username + '/' + title })
  })
})

//logout route
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/')
})

module.exports = router;
