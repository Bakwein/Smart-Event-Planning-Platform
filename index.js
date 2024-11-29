const express = require("express");

const app = express();
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const path = require("path");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const loginRoutes = require("./routes/login");

const db = require("./data/db");
const jwt = require('jsonwebtoken');

app.use("/libs", express.static(path.join(__dirname,"node_modules")));
app.use("/static", express.static(path.join(__dirname,"public")));

app.use(async (req, res, next) => {
    const skipRoutes = [
        '/user/ilgi_list',
        '/user/profile',
        '/user/index',
        '/user/home',
        '/user/create_etkinlik',
        '/user/etkinlikler',
        '/user/etkinlik',
        '/user/send-message',
        '/user/katilimci',
        '/user/update_render',
        '/user/notifications',
        '/user/logout',
        '/static',
        '/'
    ]; // bu yeni bir şey eklendiğinde güncellenmeli yoksa bildirim kısmı arıza olur
    
    if (!skipRoutes.some(route => req.path.includes(route))) {
        console.log("Atlanıyor:", req.path);
        return next();
    }

    const token = req.cookies.token;

    const skipRoutes2 = [ 
        '/user/login',
        '/user/register',
        '/user/photo_upload_render',
        '/user/forgot_password_render',
        '/user/new_password_render',
        '/user/check_password',
        '/user/update_new_password',
        '/admin'
    ]
    
    if (!token) {
        if(skipRoutes2.some(route => req.path.includes(route))){
            return next();
        }
        console.log("token yok");
        console.log(req.path);
        return res.redirect("/user/login");
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Admin rolü kontrolü
        if (decoded.role === "admin") {
            res.locals.unreadNotifications = 0;
            return next(); // Admin için next çağrısı
        }

        const id = decoded.id;

        // Kullanıcı kontrolü
        const [user] = await db.execute(
            "SELECT * FROM kullanıcılar WHERE idkullanıcılar = ?",
            [id]
        );

        if (user.length === 0) {
            return res.redirect("/user/logout");
        }

        const kullanici_id = user[0].idkullanıcılar;
        const [rows] = await db.execute(
            "SELECT COUNT(*) AS unreadNotifications FROM bildirim WHERE idkullaniciR = ? AND okunduMu = 0",
            [kullanici_id]
        );

        res.locals.unreadNotifications = rows[0].unreadNotifications || 0;
    } catch (error) {
        console.error("JWT doğrulama hatası:", error);
        return res.redirect("/user/login");
    }
    //console.log(res.locals.unreadNotifications);
    next();
});

const moment = require('moment');
app.locals.moment = moment;

//routes
app.use(loginRoutes);
app.use("/admin", adminRoutes);
app.use("/user", userRoutes);


//upload
const upload = require("./multer");

app.post("/upload_photo", upload.single('photo'), async function(req, res){
    try{
        //path id kontrol
        if(!req.file || !req.body.id){
            res.redirect("/");
            return;
        }
        let photoPath = req.file.path;
        photoPath = "/static" + photoPath.split('public')[1];
        const id = req.body.id;
        console.log(photoPath, id, "***");

        //db update
        await db.execute("UPDATE kullanıcılar SET photoPath = ? WHERE idkullanıcılar = ?", [photoPath, id]);

        res.redirect("/");

    }
    catch(err){
        console.log(err);
    }
});

app.post("/upload_photo2", upload.single('photo'), async function(req, res){
    try{
        //path id kontrol
        if(!req.file || !req.body.id){
            res.redirect("/");
            return;
        }
        let photoPath = req.file.path;
        photoPath = "/static" + photoPath.split('public')[1];
        const id = req.body.id;

        //db update
        await db.execute("UPDATE kullanıcılar SET photoPath = ? WHERE idkullanıcılar = ?", [photoPath, id]);

        res.redirect("/user/profile_update");

    }
    catch(err){
        console.log(err);
    }
});

app.post("/notifications/read", async (req, res) => {
    const token = req.cookies.token;
    if(!token){
        return res.redirect("/user/login");
    }
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const id = decoded.id;
    const [user, ] = await db.execute("SELECT * FROM kullanıcılar WHERE idkullanıcılar = ?", [id]);
    if(user.length == 0){
        return res.redirect("/user/logout");
    }
    const kullanici_id = user[0].idkullanıcılar;
    await db.execute("UPDATE bildirim SET okunduMu = 1 WHERE idkullaniciR = ?", [kullanici_id]);
    res.json({ success: true });
});

const bodyParser = require('body-parser');
const openrouteservice = require('openrouteservice-js');

//just upload the storage and return path
/*
app.post("/upload_photo3", upload.single('photo'), async function(req, res){
    try{
        console.log(req.body);

        let photoPath = req.file.path;
        photoPath = "/static" + photoPath.split('public')[1];
        console.log(photoPath);
        //res.send(photoPath);

        const [kategoriler, ] = await db.execute("select * from ilgialanlari");

        return res.render("/user/create_etkinlik", {
            title: "Etkinlik Oluştur",
            message: '',
            alert_type: '',
            kategoriler: kategoriler
        });
    }
    catch(err){
        console.log(err);
    }
});*/

//db
require("./createtables")


app.listen(3000, function()
{
    console.log("listening on port 3000");
})
