
var express = require('express');
var app = express();
var PORT = 3000;
const hosturl = "https://api.bluebox.website/"
const datenow = Date.now()
const cors = require('cors');

// Upload Mechanics
const multer = require("multer");
const path = require("path");
const { UploadFile } = require("./models/upload");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `${file.originalname}-${datenow}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  const MIME_TYPE_MAP = {
    'video/mp4': 'mp4',
    'video/x-msvideo': 'avi',
    'video/x-flv': 'flv',
    'video/quicktime': 'mov',
    'video/x-matroska': 'mkv',
    'video/x-ms-wmv': 'wmv'
 }
  if (MIME_TYPE_MAP[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error("Not in allowed list"), true);
  }
};

const fileupload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// DataBase Connection
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(
  'mongodb://dataAdmin:AdminXx@localhost:28017/api_test_db',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      console.error('FAILED TO CONNECT TO MONGODB');
      console.error(err);
    } else {
      console.log('CONNECTED TO MONGODB');
    }
  }
);

const database = mongoose.connection

database.on('error', (error) => {
  console.log(error)
})

database.once('connected', () => {
  console.log('Database Connected');
})

// Single routing
var router = express.Router();

// Routes
const admin = require('./router/admin');
const movie = require('./router/movie');
const upload = require('./router/upload');
const user = require('./router/user');

const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origins: ['*']
  }
});
var GlobaluserCount = [];
var videotime = '';
var status ='';
var host ='';
var videosrc ='';
var activeroom = [''];

router.get('/', (req, res) => {
  res.send('<h1>Hey Socket.io</h1>');
});

router.post('/upload', fileupload.single('myVideo'), async (req , res) => {
  try {
      const ext = req.file.mimetype.split("/")[1];
      const filename = `${req.file.originalname}-${datenow}.${ext}`
      const newFile = new UploadFile({ name: filename , url : hosturl + 'uploads/'+ filename });
      await newFile.save()
      res.status(200).json({
        message: "File created successfully!!",
      });
  } catch (error) {
    res.status(400).send({ error: error.message })
  }
});

io.on('connection', (socket) => {
    io.emit('message',"User Connected " + ++GlobaluserCount);
    io.emit('videotime',videotime);
    io.emit('totaluser',GlobaluserCount);
    console.log("User Connected " + GlobaluserCount);
    socket.on('disconnect', () => {
        io.emit('message',"User Connected " + --GlobaluserCount);
        io.emit('totaluser',GlobaluserCount);
        console.log("User Connected " + GlobaluserCount);
});
socket.on('videotime', (data) => {
  videotime = data
  console.log(data);  
});
socket.on('host', (data) => {
    host = data
    console.log(data);  
});
socket.on('videosrc', (data) => {
  videosrc = data
  console.log(data);  
});
socket.on('status', (data) => {
    status = data
    console.log(data);  
});
  socket.on('event', (data) => {
    console.log('data masuk', data);
});
socket.on('message', function(data) {
    io.emit('message', 'Get you right back...')
    console.log(data);
});
});

setInterval(() => {
    io.emit("videotime", videotime);
    io.emit("status", status);
    io.emit("host", host);
    io.emit("videosrc", videosrc);
}, 500);

app.use(cors());
app.use((req,res,next)=>{
    res.header('Access-Control-Allow-Headers, *, Access-Control-Allow-Origin', 'Origin, X-Requested-with, Content_Type,Accept,Authorization','http://localhost:5173');
    if(req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods','PUT,POST,PATCH,DELETE,GET');
        return res.status(200).json({});
    }
    next();
});

app.use(router);
app.use('/user', user)
app.use('/admin', admin)
app.use('/movie/', movie)
app.use("/uploads", express.static(__dirname + "/uploads"))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

http.listen(PORT, 'localhost', () => {
  console.log('listening on *:' + PORT);
});