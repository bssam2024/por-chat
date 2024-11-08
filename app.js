require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port =process.env.PORT|| 3000;
app.set('view engine', 'ejs');
app.set('views','views');
app.use(express.static(path.join(__dirname, 'statics')));
// إعداد الاتصال بقاعدة البيانات
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT, // تعديل هنا
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  
});
//عرض السوكيت

io.on('connection', (socket) => {
    console.log('a user connected');
  
    // Query the database and emit the data to the client
    socket.on('insert',(data) => {
        console.log(data); 
        db.query('INSERT INTO video (nam,myid,frid_id) VALUES (?,?,?)',[data.nam,data.myid,data.idfrend], (err) => {
            if (err) {
                return res.send('Error registering user: ' + err);
            }
            db.query('SELECT  *FROM  video ', (err, resus) => {
                if (err) throw err;
                io.emit('data', resus);
        
        
            });
         
        
            
        });
      
    });
   socket.on('callNotification', (deta) => {
        console.log(`Calling ${data.to} from ${data.from}`);
        // إرسال إشعار للمستخدم المستقبل
        socket.to(data.to).emit('urls',deta);
    });
    /*
    socket.on('reqorst', myid => {
        console.log(myid); 
        socket.broadcast.to(myid.fid).emit('getpeerid');
    });
    socket.on('sendpeerid',data1 => {
        console.log(data1.peerid); 
        socket.broadcast.to(data1.fid).emit('reccadd', data1.peerid);
    });
    */
    /*socket.on('inchat', sison=> {
        console.log(sison);
        // يجب التأكد من أن الجلسة (session) أو الغرفة (room) قد تم إنشاؤها
        socket.broadcast.to(sison.myid).emit('getpeerid',sison);
    });
    */

     socket.on('reqorst', myid => {
        console.log('Requested peer ID for: ', myid.myid);
        // إرسال حدث 'getpeerid' إلى جميع المستخدمين
        socket.broadcast.emit('getpeerid');
    });
    
  socket.on('sendpeerid', data1 => {
        console.log('Received peer ID: ', data1.peerid);
        // إرسال معرف الند إلى كافة المستخدمين
        socket.broadcast.emit('reccadd', data1.peerid);
    });
    db.query('SELECT  *FROM  video ', (err, resu) => {
        if (err) throw err;
        io.emit('data', resu);


    });
  
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });
// محاولة الاتصال بقاعدة البيانات
db.connect(err => {
    if (err) {
        console.error('erorr', err);
        return;
    }
    console.log('sussusfully');
});

// إعداد الجلسات
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true,
}));

app.use(bodyParser.urlencoded({ extended: true }));

// صفحة التسجيل
app.get('/register', (req, res,next) => {
    res.send(`
        <form action="/register" method="POST">
            <input type="text" name="username" placeholder="Username" required>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit">Register</button>
        </form>
    `);
});
app.get('/', (req, res,next) => {
    res.render('index');
});
app.get('/call', (req, res,next) => {
    res.render('call');
});

// معالجة التسجيل
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.query('INSERT INTO usr1 (emil,pass1) VALUES (?,?)', [username, hashedPassword], (err) => {
        if (err) {
            return res.send('Error registering user: ' + err);
        }
        res.redirect('/login');
    });
});

//حفط بينات التصال 
app.post('/chat', (req, res) => {
    const { nam, myid ,frid_id} = req.body;
 

    db.query('INSERT INTO video (nam,myid,frid_id) VALUES (?,?,?)', [ nam,myid,frid_id], (err) => {
        if (err) {
            return res.send('Error registering user: ' + err);
        }
        
});

    
});

// صفحة تسجيل الدخول
app.get('/login',(req, res,next) => {
    res.render('login');
});

// معالجة تسجيل الدخول
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  //const hashedPassword = bcrypt.hashSync(password, 10);

    db.query('SELECT * FROM usr1 WHERE emil =? ', [username], (err, results) => {
        if (err) return res.send('Error: ' + err);
        if (results.length > 0 && bcrypt.compareSync(password, results[0].pass1)) {
            req.session.userId = results[0].id;
            req.session.userEMIL = results[0].emil;
            res.redirect('/hom');
        } else {
            res.send('Invalid username or password');
        }
    });
});

// الصفحة الرئيسية
app.get('/hom', (req, res,next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    db.query('SELECT id,emil FROM usr1 ', (err, results) => {
        if (err) return res.send('Error: ' + err);
    res.render('hom',{
      results,
      idusr:req.session.userId
    });
});
  
});

//صفحه الشات
app.get('/chat/:id', (req,res) => {
    let my_id=req.session.userId;
 let id=req.params.id;


 db.query('SELECT  *FROM  video where (myid=? and frid_id=? )or (myid=? and frid_id=? )',[ my_id, id,id,my_id], (err, resu) => {
    if (err) return res.send('Error: ' + err);
res.render('chat',{
  resu,
  namemy:req.session.userEMIL,
  my_id:my_id,
  id:id

});
});
 /*   res.render('chat',{
   namemy:req.session.userEMIL,
      my_id:req.session.userId,
      id:id
    });
*/
  
});

// بدء الخادم
server.listen(port, () => {
    console.log(`Server running at http://108.181.197.184:${port}`);
});
