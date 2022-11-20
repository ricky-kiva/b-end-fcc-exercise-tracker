const express = require('express')
const app = express()
const cors = require('cors')
let bodyParser = require('body-parser');
const mongoose = require('mongoose')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// making User schema
let UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});

// making Exercise schema
let ExerciseSchema = new mongoose.Schema({
  user_id: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: String
  }
})

// making model from schema
let Users = mongoose.model('Users', UserSchema)
let Exercises = mongoose.model('Exercises', ExerciseSchema)

// POST to create new user
app.post('/api/users', function(req,res) {
  let newUser = new Users({
    username: req.body.username
  })
  newUser.save(function(err, data) {
    if (err) return console.error(err);
  })
  res.json(newUser)
})

// GET to show all user
app.get('/api/users', function(req,res) {
  Users.find({})
    .then(data => {
      res.json(data)
    })
    .catch(err => {
      console.error(err)
    })
})

//POST to make new exercise
app.post('/api/users/:_id/exercises', function(req,res) {
  let paramId = req.params._id
  let dateNew = new Date(req.body.date)

  if (dateNew == "Invalid Date") {
    dateNew = new Date();
  }
  
  let intDura = parseInt(req.body.duration)

  Users.findOne({_id: paramId})
    .then(users => {
      let dateString = dateNew.toDateString();

      let newExercise = {
        user_id: paramId,
        date: dateString,
        duration: intDura,
        description: req.body.description
      }

      Exercises.create(newExercise, function(err, data) {
        if (err) console.error(err)
      })
      
      res.json({
        _id: users['_id'],
        username: users['username'],
        date: dateString,
        duration: intDura,
        description: req.body.description
      });
    })
  
})

// GET all exercise from user
app.get('/api/users/:_id/logs', function(req,res) {
  const arrLog = []
  Exercises.find({user_id: req.params._id})
    .then(data => {
      for (let i = 0; i < data.length; i++) {
        arrLog.push({
          description: data[i]['description'],
          duration: data[i]['duration'],
          date: data[i]['date']
        })
      }
      res.json({
        log: arrLog
      })
    })
    .catch(err => {
      console.error(err)
    })
})

// GET try to find name and sort by ids
/*app.get('/username/:name', function(req,res) {
  let name = req.params.name
  Users.find({username: name})
    .sort({_id: 1})
    .exec()
    .then(data => {
      res.json(data)
    })
    .catch(err => {
      console.error(err)
    })
})*/


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
