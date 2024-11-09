const express = require("express");

const app = express();
const dotenv = require('dotenv');
dotenv.config();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const path = require("path");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const loginRoutes = require("./routes/login");

const db = require("./data/db");

app.use("/libs", express.static(path.join(__dirname,"node_modules")));
app.use("/static", express.static(path.join(__dirname,"public")));

//routes
app.use("/admin", adminRoutes);
app.use("/user", userRoutes);
app.use(loginRoutes);

//photo update
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, path.join(__dirname, 'public', 'images')); // dosyanın nereye kaydedileceği
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // dosya adı benzersiz
    }
});

const upload = multer({storage: storage});
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

//db
require("./createtables")


app.listen(3000, function()
{
    console.log("listening on port 3000");
})