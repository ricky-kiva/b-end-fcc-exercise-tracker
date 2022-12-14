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
    type: Date
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

      let newExercise = {
        user_id: paramId,
        date: dateNew,
        duration: intDura,
        description: req.body.description
      }

      Exercises.create(newExercise, function(err, data) {
        if (err) console.error(err)
      })
      
      res.json({
        _id: users['_id'],
        username: users['username'],
        date: dateNew.toDateString(),
        duration: intDura,
        description: req.body.description
      });
    })
  
})

// GET all exercise from user
app.get('/api/users/:_id/logs', function(req,res) {
  const arrLog = []
  const arrLogFilter = []
  let sendDateFrom; 
  let sendDateTo;
  let logFrom =  req.query.from;
  let logTo = req.query.to;
  let logLim = req.query.limit;

  Users.findOne({user_id: req.params._id})
    .then(userObj => {
      Exercises.find({user_id: req.params._id})
        .sort({date: 1})
        .exec()
        .then(data => {
          
          for (let i = 0; i < data.length; i++) {
            arrLog.push({
              description: String(data[i]['description']),
              duration: parseInt(data[i]['duration']),
              date: (data[i]['date']).toDateString()
            })
          }
    
          if (!logFrom && !logTo) {
            if (!logLim) {
              logLim = arrLog.length
            }
            for (let i = 0; i < logLim; i++) {
              arrLogFilter.push(arrLog[i]);
            }
          }

          if (logFrom || logTo) {
            if (!logFrom) {
              logFrom = 0;
            } else {
              logFrom = Date.parse(logFrom)
            }
            if (!logTo) {
              let logToday = new Date();
              logTo = logToday.toDateString();
              logTo = Date.parse(logTo);
            } else {
              logTo = Date.parse(logTo)
            }
            
            for (let i = 0; i < arrLog.length; i++) {
              logDate = Date.parse(arrLog[i]['date'])
              if (logDate >= logFrom && logDate <= logTo) {
                arrLogFilter.push(arrLog[i]);
              }
              if (logLim && logLim == (arrLogFilter.length)) {
                break;
              }
            }
          }
          
          if (req.query.from) {
            logFrom = new Date(req.query.from)
            sendDateFrom = logFrom.toDateString()
          }
          if (req.query.to) {
            logTo = new Date(req.query.to)
            sendDateTo = logTo.toDateString()
          }
          
          res.json({
            _id: req.params._id,
            username: userObj['username'],
            from: sendDateFrom,
            to: sendDateTo,
            count: arrLogFilter.length,
            log: arrLogFilter
          })
        })
        .catch(err => {
          console.error(err)
        })
    })
    .catch(err => {
      console.error(err)
    })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
