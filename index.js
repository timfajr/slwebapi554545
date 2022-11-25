var express = require('express')
var app = express()
var PORT = 3000
var HOST = '0.0.0.0'
const hosturl = "https://api.bluebox.website/"
const datenow = Date.now()
const cors = require('cors')
const bodyParser = require("body-parser");

'     ______       __                        '
'    / ____/___   / /_ ____  _      __ ____  '
'   / / __ / _ \ / __// __ \| | /| / // __ \ '
'  / /_/ //  __// /_ / /_/ /| |/ |/ // / / / '
'  \____/ \___/ \__/ \____/ |__/|__//_/ /_/  '
'                                            '

// JWT

const JWT_SECRET = "810e447e4d33bb42a4378b0fbe0d77d2c75e0523b45731cf45d1ec1c4d435f4c"
const refreshTokenSecret = "920e447e4d33bb42a4378b0fbe0d77d3c75e0523b45731cf45d1ec1c4d435f4c"
const JWT_EXPIRATION_TIME = "1800s"
const jwt = require('jsonwebtoken')

// Upload Mechanics
const multer = require("multer")
const path = require("path")
const { UploadFile } = require("./models/upload")

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `${file.originalname}-${datenow}.${ext}`)
  },
})

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
const mongoose = require('mongoose')

mongoose.connect(
  'mongodb://dataAdmin:AdminXx@bluebox.website:27017/api_test_db',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      console.error('FAILED TO CONNECT TO MONGODB');
      console.error(err)
    } else {
      console.log('CONNECTED TO MONGODB');
    }
  }
)

const database = mongoose.connection

database.on('error', (error) => {
  console.log(error)
})

database.once('connected', () => {
  console.log('Database Connected')
})

// Single routing
var router = express.Router()

// Routes
const admin = require('./router/admin')
const movie = require('./router/movie')
const upload = require('./router/upload')
const user = require('./router/user')

const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origins: ['*']
  }
})

const Roomdata = []

var GlobaluserCount = []
var Room = []

router.get('/', (req, res) => {
  res.send('<h1>Bluebox API Beta V.1 🚀</h1>' + '<p> Developed By Getown Resident </p>' + signature);
})

router.post('/upload', fileupload.single('myVideo'), async (req , res) => {
  try {
      const ext = req.file.mimetype.split("/")[1];
      const filename = `${req.file.originalname}-${datenow}.${ext}`
      const newFile = new UploadFile({ name: filename , url : hosturl + 'uploads/'+ filename });
      await newFile.save()
      res.status(200).json({
        message: "File created successfully!!",
      })

  } catch (error) {
    res.status(400).send({ error: error.message })
  }
})

io.use(async (socket, next) => {
  try {
      const token = socket.handshake.headers.access_token;
      const payload = await jwt.verify(token, JWT_SECRET);
      socket.deviceid = payload.device.deviceid;
      socket.ownerid = payload.device.ownerid;
      next();
  } catch (err) {
      next(err)
  }
})

io.on('connection', (socket) => {

    // Parameter
    var deviceid = socket.deviceid
    var ownerid = socket.ownerid

    if ( !Room.includes(deviceid)){
      Room.push(deviceid)
    }

    // Loop Array Check & Stash Data
    Object.values(Room).forEach( val => {
      const value = Roomdata.some(elem => elem.roomid === val )
      if( value )
      {
        for (var i = 0; i < Roomdata.length; ++i) {
          if (Roomdata[i]['roomid'] === val) {
             Roomdata[i]['usercount'] = ++Roomdata[i]['usercount'];
          }
      }}
      else {
        Roomdata.push({
          "roomid" : deviceid,
          "ownerid" : ownerid,
          "host" : '',
          "status": '',
          "ytstatus": '',
          "videosrc" : '',
          "videotime": '',
          "ytsrc": '',
          "yttime": '',
          "page": '',
          "usercount" : 1 } 
          )
      }
    })

    socket.join(deviceid);
    ++GlobaluserCount
    io.to(deviceid).emit("user" , parseInt(99999*Math.random()) + "Is Connected");
    console.log("User Connected " + GlobaluserCount);
    console.log(Room)
    console.log(Roomdata)
    
    // Disconnected Event
    socket.on('disconnect', () => {
        --GlobaluserCount
        io.emit('totaluser',GlobaluserCount);
        console.log("User Connected " + GlobaluserCount);

        // Loop Array Check & Stash Data
        Object.values(Room).forEach( val => {
          const value = Roomdata.some(elem => elem.roomid === val )
          if( value )
          {
            for (var i = 0; i < Roomdata.length; ++i) {
              if (Roomdata[i]['roomid'] === val) {
                Roomdata[i]['usercount'] = --Roomdata[i]['usercount'];
              }
          }}
        })
    })
    
      // Video Time Event
      socket.on('videotime', (data) => {
        Object.values(Room).forEach( val => {

          // Parse Object
          const obj = data;
          const roomid = obj.roomid
          const videotime = obj.videotime
          console.log(videotime)
          const value = Roomdata.some(elem => elem.roomid === roomid )
          if( value )
          {
            for (var i = 0; i < Roomdata.length; ++i) {
              if (Roomdata[i]['roomid'] === roomid) {
                Roomdata[i]['videotime'] = videotime;
              }
          }}
        })
      })

      // Host Change Event
      socket.on('host', (data) => {
        Object.values(Room).forEach( val => {

          // Parse Object
          const obj = data;
          const roomid = obj.roomid
          const host = obj.host
          console.log(roomid)
          console.log(host)

          const value = Roomdata.some(elem => elem.roomid === roomid )
          if( value )
          {
            for (var i = 0; i < Roomdata.length; ++i) {
              if (Roomdata[i]['roomid'] === roomid) {
                Roomdata[i]['host'] = host;
              }
          }}
        })
      })
  
     // Videosrc Change Event
     socket.on('videosrc', (data) => {
      Object.values(Room).forEach( val => {

        // Parse Object
        const obj = data;
        const roomid = obj.roomid
        const videosrc = obj.videosrc
        const value = Roomdata.some(elem => elem.roomid === roomid )
        if( value )
        {
          for (var i = 0; i < Roomdata.length; ++i) {
            if (Roomdata[i]['roomid'] === roomid) {
              Roomdata[i]['videosrc'] = videosrc;
            }
        }}
      })
    })

     // YTsrc Change Event
     socket.on('ytsrc', (data) => {
      Object.values(Room).forEach( val => {

        // Parse Object
        const obj = data;
        const roomid = obj.roomid
        const ytsrc = obj.ytsrc

        const value = Roomdata.some(elem => elem.roomid === roomid )
        if( value )
        {
          for (var i = 0; i < Roomdata.length; ++i) {
            if (Roomdata[i]['roomid'] === roomid) {
              Roomdata[i]['ytsrc'] = ytsrc;
            }
        }}
      })
    })

     // YTtime Change Event
     socket.on('yttime', (data) => {
      Object.values(Room).forEach( val => {

        // Parse Object
        const obj = data;
        const roomid = obj.roomid
        const yttime = obj.yttime

        const value = Roomdata.some(elem => elem.roomid === roomid )
        if( value )
        {
          for (var i = 0; i < Roomdata.length; ++i) {
            if (Roomdata[i]['roomid'] === roomid) {
              Roomdata[i]['yttime'] = yttime;
            }
        }}
      })
    })

     // Video Status Change Event
     socket.on('status', (data) => {
      Object.values(Room).forEach( val => {

        // Parse Object
        const obj = data;
        const roomid = obj.roomid
        const status = obj.status

        const value = Roomdata.some(elem => elem.roomid === roomid )
        if( value )
        {
          for (var i = 0; i < Roomdata.length; ++i) {
            if (Roomdata[i]['roomid'] === roomid) {
              Roomdata[i]['status'] = status;
            }
        }}
      })
    })

        // YTStatus Change Event
        socket.on('ytstatus', (data) => {
        Object.values(Room).forEach( val => {
  
          // Parse Object
          const obj = data;
          const roomid = obj.roomid
          const ytstatus = obj.ytstatus
  
          const value = Roomdata.some(elem => elem.roomid === roomid )
          if( value )
          {
            for (var i = 0; i < Roomdata.length; ++i) {
              if (Roomdata[i]['roomid'] === roomid) {
                Roomdata[i]['ytstatus'] = ytstatus;
              }
          }}
        })
      })

      // Page Change Event
      socket.on('page', (data) => {
        Object.values(Room).forEach( val => {
          console.log(data)
          // Parse Object
          const obj = data;
          const roomid = obj.roomid
          const page = obj.page
  
          const value = Roomdata.some(elem => elem.roomid === roomid )
          if( value )
          {
            for (var i = 0; i < Roomdata.length; ++i) {
              if (Roomdata[i]['roomid'] === roomid) {
                Roomdata[i]['page'] = page;
              }
          }}
        })
      })

  })

  // Transmit Controll Interval Stored Data
  setInterval(() => {
    Object.values(Room).forEach( val => {
      const value = Roomdata.some(elem => elem.roomid === val )
      if( value )
      {
        for (var i = 0; i < Roomdata.length; ++i) {
          if (Roomdata[i]['roomid'] === val) {
            io.to(val).emit("host", Roomdata[i].host);
            io.to(val).emit("status", Roomdata[i].status);
            io.to(val).emit("ytstatus", Roomdata[i].ytstatus);
            io.to(val).emit("videosrc", Roomdata[i].videosrc);
            io.to(val).emit("videotime", Roomdata[i].videotime);
            io.to(val).emit("ytsrc", Roomdata[i].ytsrc);
            io.to(val).emit("yttime", Roomdata[i].yttime);
            io.to(val).emit("page", Roomdata[i].page);
            io.to(val).emit("usercount", Roomdata[i].usercount);
          }
      }}
    })
  }, 1000)
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next()
})

app.use(router)
app.use('/user', user)
app.use('/admin', admin)
app.use('/movie/', movie)
app.use("/uploads", express.static(__dirname + "/uploads"))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

http.listen(PORT, HOST, () => {
  console.log('listening on *:' + PORT)
})
