const express = require("express");
const router = express.Router();
const path = require("path");
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();
const db = require("../data/db");

router.get("/profile", function(req, res)
{
    res.render("user/profile", {
        title: "Profil"
    });
});

router.get("/index", function(req, res)
{
    res.render("user/index", {
        title: "Anasayfa"
    });
});

router.get("/login_render", function(req, res)
{
    //token kontrolü
    res.redirect("/user/login");
});

router.get("/login", function(req, res)
{
    res.render("user/login", {
        title: "Login",
        kutu_baslik: 'Kullanıcı Girişi',
        message: '',
        alert_type: '',
    });
});

router.get("/register_render", function(req, res)
{
    //token kontrolü

    res.redirect("/user/register");
});


router.get("/register", function(req, res)
{
    res.render("user/register", {
        title: "Kullanıcı Kayıt",
        kutu_baslik: 'Kullanıcı Kayıt',
        message: '',
        alert_type: '',
    });
});

router.get("/photo_upload_render", function(req, res)
{
    res.render("user/photo_upload", {
        title: "Photo Upload",
    });
});



router.post("/register", async function(req, res)
{
    //kontrol islemleri


    //her sey ok ise kullanıcı olustur db'de + token olustur

    //foto yukleme ekranına yonlendirme
    res.redirect("/user/photo_upload_render")
});

router.get("/forgot_password_render", function(req, res)
{
    res.render("user/forgot_password_render", {
        title: "Şifremi Unuttum!",
    });
});

router.post("/new_password", async function(req, res)
{
    const {email} = req.body;
    console.log(email);

    // bu email'e random 6 saneli sayı gönderilecek 
    const random_num = Math.floor(Math.random() * 900000) + 100000;

    // db'ye bu sayiyi kaydet
    await db.execute("UPDATE kontrol SET emailCode = ? where idkontrol = ?",[random_num, 1]);


    //bunu bir emaile gönder
    const transporter = nodemailer.createTransport({
        service: 'gmail', // veya kullandığınız başka bir e-posta hizmeti
        auth: {
            user: process.env.email, // Gönderen e-posta adresi
            pass: process.env.email_password // Gönderen e-posta adresinin şifresi
        }
    });

    const mailOptions = {
        from: process.env.email, 
        to: email, // Alıcı e-posta adresi
        subject: 'Şifre Sıfırlama Kodu',
        text: `Şifre sıfırlama kodunuz: ${random_num}`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('E-posta gönderildi');
        
        // Başarılıysa kullanıcıyı başka bir sayfaya yönlendir
        res.render("user/code_check", {
            title: "Şifremi Unuttum!",
        });
    } catch (error) {
        console.error('E-posta gönderim hatası:', error);
        res.status(500).send('E-posta gönderiminde hata oluştu.');
    }

    res.render("user/code_check", {
        title: "Şifremi Unuttum!",
    })
});

router.post("/check_password", async function(req, res){
    const {code} = req.body;
    console.log("code", code);

    const [kontroller] = await db.execute('SELECT * FROM kontrol WHERE idkontrol = ?', [1]);

    if (kontroller.length > 0) {
        const num_ = kontroller[0].emailCode;
        if(code == num_)
        {
            // ok
            res.render("user/update_password", {
                title: "Şifreyi Güncelle!",
            })
        }
        else
        {
            //hata durumu ?
        }
    } else {
        console.log('No record found with idkontrol = 1');
        //hata durumu ?
        //return res.redirect("/user/forgot_password_render"); hata mesajı ile geri dönmeli
    }

});

router.post("/update_new_password", async function(req, res){
    const {password, repassword} = req.body;
    //şifre kontrol ...
});

module.exports = router;