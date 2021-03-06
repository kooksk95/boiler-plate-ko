const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const config = require('./config/key')

const { User } = require('./models/User')
const { auth } = require('./middleware/auth')


app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(cookieParser())

const mongoose = require('mongoose')
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
}).then(() => console.log('Mongo DB connected...'))
  .catch(err => console.log(err))




app.get('/', (req, res) => res.send('Hello World!'))

app.post('/api/users/register', (req, res) => {
  // put registser info in db

    const user = new User(req.body)
    user.save((err, userInfo) =>{
      if(err) return res.json({ registerSuccess: false, err })
      return res.status(200).json({
        registerSuccess: true
      })
    })
})

app.post('/api/users/login', (req, res) => {
  // find requested email in db
  User.findOne({ email: req.body.email }, (err, user) => {
    if(!user){
       return res.json({
         loginSuccess: false,
         message: "No user with such email."
       })
     }
      
  // if there is, check the password
    user.comparePassword(req.body.password, (err, isMatch) => {
      if(!isMatch) return res.json({ loginSuccess: false, message: "wrong password" })

  // if password is correct, generate token
      user.generateToken((err, user) => {
        if(err) res.status(400),send(err);

  // save token at... (cookies, local, session, anywhere safe)
        res.cookie("x_auth", user.token)
        .status(200)
        .json({ loginSuccess: true, userId: user._id })
      })
    })
  })
})

app.get('/api/users/auth', auth, (req, res) => {
  
  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name, 
    role: req.user.role,
    image: req.user.image
  })
})

app.get('/api/users/logout', auth, (req, res) => {

  User.findOneAndUpdate(
    { _id: req.user._id }
    , { token: "" }
    , (err, user) => {
      if(err) return res.json({ success: false, err })
      return res.status(200).send({ success: true })
    }
  )


})


const port = 5000
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))

