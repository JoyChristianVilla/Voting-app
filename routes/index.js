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
  Poll.find({}).sort({ createdAt: -1 }).lean().exec(function(err, docs) {
    if (err) return res.render('error', { err: err });
    User.find({}).sort({ createdAt: -1 }).lean().exec(function(err, users) {
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
  Poll.findById(req.params.id).exec(function(err, doc) {
    if (err) return res.render('error', { err: err });
    res.render('vote', { doc: doc })
  })
})

//Protected voting pages
router.get('/auth/poll/:id', requireAuth, (req, res) => {
  Poll.findById(req.params.id).exec(function(err, doc) {
    if (err) return res.render('error', { err: err });
    res.render('vote-protected', { doc: doc });
  })
})

//Unprotected put request for voting
router.put('/poll/:id', (req, res) => {
  console.log(req.query.options)
  Poll.findById(req.params.id, (err, doc) => {
    if (err) return res.render('error', { err: err });
    doc.id = doc.id;
    doc.title = doc.title;
    doc.creator = doc.creator;
    doc.options = doc.options;
    doc.voters = doc.voters;
    for (i in doc.options) {
      if (i === req.query.options) {
        doc.options[i]++
      }
    }
    doc.voters.push(req.user.username);
    doc.save(function(err) {
      if (err) return res.render('error', { err: err });
      res.render('vote', { doc: doc });
    })
  })
})

//Protected put request for voting
router.put('/auth/poll/:id', requireAuth, (req, res) => {
  Poll.findById(req.params.id, (err, doc) => {
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
      res.render('vote-protected', { doc: doc });
    })
  })
})

//Protected page for adding an option
router.get('/add-option/:id', requireAuth, (req, res) => {
  Poll.findById(req.params.id).exec(function(err, doc) {
    res.render('add-option', { doc: doc })
  })
})

//Protected put request for adding an option
router.put('/add-option/:id', requireAuth, (req, res) => {
  var newOption = req.query.new;
  Poll.findById(req.params.id, (err, doc) => {
    if (err) return res.render('error', { err: err });
    doc.id = doc.id;
    doc.title = doc.title;
    doc.creator = doc.creator;
    doc.options = doc.options;
    doc.voters = doc.voters;
    doc.options[newOption] = 0;
    doc.save(function(err) {
      if (err) return res.render('error', { err: err });
      res.render('vote-protected', { doc: doc })
    })
  })
})

//Protected list of a users polls
router.get('/polls/:creator', requireAuth, (req, res) => {
  Poll.find({ creator: req.params.creator }).lean().exec(function(err, docs) {
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
router.delete('/delete/:id', requireAuth, (req, res) => {
  Poll.findByIdAndRemove(req.params.id, (err) => {
    if (err) return res.render('error', { err: err });
    Poll.find({ creator: req.user.username }).sort({ createdAt: -1 }).exec(function(err, docs) {
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
    options.push(pollOptions[key])
  })

  options.shift();
  var obj = {};
  options.forEach(function(item) {
    obj[item] = 0;
  })
  var newPoll = new Poll({
    title: title,
    creator: req.user.username,
    options: obj,
    voters: []
  })
  newPoll.save(function(err) {
    if(err) return res.render('error', { err: err });
    var host = 'localhost:3000/poll';
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
