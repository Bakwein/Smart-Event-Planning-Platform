const express = require("express");
const router = express.Router();
const path = require("path");
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();
const db = require("../data/db");
const kontroller = require('../kontroller');
const bcrypt = require('bcryptjs');

router.get("/profile", async function(req, res)
{
    try{
        const [results,] = await db.execute("SELECT * FROM kullanıcılar"); 

        if(results.length === 0)
        {
            console.log("VEEEEEEY");
        }
        else
        {
            const tarih = new Date(results[0].dogumTarihi).toISOString().split('T')[0];
            res.render("user/profile", {
                title: "Profil",
                idkullanıcılar: results[0].idkullanıcılar,
                KullanıcıAdı: results[0].KullanıcıAdı,
                sifre: results[0].sifre,
                email: results[0].email,
                cinsiyet: results[0].cinsiyet,
                konum: results[0].konum,
                isim: results[0].isim,
                soyisim: results[0].soyisim,
                dogumTarihi: tarih,
                telefon: results[0].telefon,
                photoPath: results[0].photoPath
            });
        }
    }
    catch(err)
    {
        console.log(err);
    }
    
});

router.get('/profile_update_render', function(req,res) 
{
    res.redirect('/user/profile_update');
});

router.post('/profile_update', async function(req, res)
{
    try{
        const {idkullanıcılar,KullanıcıAdı, sifre, email, cinsiyet, konum, isim, soyisim, dogumTarihi, telefon, photoPath} = req.body;
        console.log(req.body);
        const tarih = new Date(dogumTarihi).toISOString().split('T')[0];
        console.log(tarih);
        if(KullanıcıAdı.length > 50 || KullanıcıAdı.length <= 0)
        {
            return res.render('user/profile_update', {
                title: "Profil Güncelleme",
                idkullanıcılar: idkullanıcılar,
                KullanıcıAdı: KullanıcıAdı,
                sifre: sifre,
                email: email,
                cinsiyet: cinsiyet,
                konum: konum,
                isim: isim,
                soyisim: soyisim,
                dogumTarihi: tarih,
                telefon: telefon,
                photoPath: photoPath,
                message: 'Kullanıcı Adı 50 karakterden fazla, 0 ve 0\'dan az olamaz',
                alert_type: 'alert-danger'
            });
        }
        else if(isim.length > 255 || isim.length <= 0)
        {
            return res.render('user/profile_update', {
                title: "Profil Güncelleme",
                idkullanıcılar: idkullanıcılar,
                KullanıcıAdı: KullanıcıAdı,
                sifre: sifre,
                email: email,
                cinsiyet: cinsiyet,
                konum: konum,
                isim: isim,
                soyisim: soyisim,
                dogumTarihi: tarih,
                telefon: telefon,
                photoPath: photoPath,
                message: 'İsim 255 karakterden fazla, 0 ve 0\'dan az olamaz',
                alert_type: 'alert-danger'
            });
        }
        else if(kontroller.harfDisindaKarakterVarMi(isim))
        {
            return res.render('user/profile_update', {
                title: "Profil Güncelleme",
                idkullanıcılar: idkullanıcılar,
                KullanıcıAdı: KullanıcıAdı,
                sifre: sifre,
                email: email,
                cinsiyet: cinsiyet,
                konum: konum,
                isim: isim,
                soyisim: soyisim,
                dogumTarihi: tarih,
                telefon: telefon,
                photoPath: photoPath,
                message: 'İsimde harf dışında karakter var',
                alert_type: 'alert-danger'
            });
        }
        else if(soyisim.length > 255 || soyisim.length <= 0)
        {
            return res.render('user/profile_update', {
                title: "Profil Güncelleme",
                idkullanıcılar: idkullanıcılar,
                KullanıcıAdı: KullanıcıAdı,
                sifre: sifre,
                email: email,
                cinsiyet: cinsiyet,
                konum: konum,
                isim: isim,
                soyisim: soyisim,
                dogumTarihi: tarih,
                telefon: telefon,
                photoPath: photoPath,
                message: 'Soyisim 255 karakterden fazla, 0 ve 0\'dan az olamaz',
                alert_type: 'alert-danger'
            });
        }
        else if(kontroller.harfDisindaKarakterVarMi(soyisim))
        {
            return res.render('user/profile_update', {
                title: "Profil Güncelleme",
                idkullanıcılar: idkullanıcılar,
                KullanıcıAdı: KullanıcıAdı,
                sifre: sifre,
                email: email,
                cinsiyet: cinsiyet,
                konum: konum,
                isim: isim,
                soyisim: soyisim,
                dogumTarihi: tarih,
                telefon: telefon,
                photoPath: photoPath,
                message: 'Soyisimde harf dışında karakter var',
                alert_type: 'alert-danger'
            });
        }
        else if(!kontroller.isValidDate(dogumTarihi))
        {
            return res.render('user/profile_update', {
                title: "Profil Güncelleme",
                idkullanıcılar: idkullanıcılar,
                KullanıcıAdı: KullanıcıAdı,
                sifre: sifre,
                email: email,
                cinsiyet: cinsiyet,
                konum: konum,
                isim: isim,
                soyisim: soyisim,
                dogumTarihi: tarih,
                telefon: telefon,
                photoPath: photoPath,
                message: 'Doğum tarihi hatalı',
                alert_type: 'alert-danger'
            });
        }
        else if(new Date(dogumTarihi) > new Date())
        {
            return res.render('user/profile_update', {
                title: "Profil Güncelleme",
                idkullanıcılar: idkullanıcılar,
                KullanıcıAdı: KullanıcıAdı,
                sifre: sifre,
                email: email,
                cinsiyet: cinsiyet,
                konum: konum,
                isim: isim,
                soyisim: soyisim,
                dogumTarihi: tarih,
                telefon: telefon,
                photoPath: photoPath,
                message: 'Doğum tarihi bugünden büyük olamaz',
                alert_type: 'alert-danger'
            });
        }
        else if(cinsiyet !== '1' && cinsiyet !== '2' && cinsiyet !== '0')
        {
            return res.render('user/profile_update', {
                title: "Profil Güncelleme",
                idkullanıcılar: idkullanıcılar,
                KullanıcıAdı: KullanıcıAdı,
                sifre: sifre,
                email: email,
                cinsiyet: cinsiyet,
                konum: konum,
                isim: isim,
                soyisim: soyisim,
                dogumTarihi: tarih,
                telefon: telefon,
                photoPath: photoPath,
                message: 'Cinsiyet erkek, kadın veya belirtilmemiş olmalıdır',
                alert_type: 'alert-danger'
            });
        }
        else if(email.length > 255 || email.length <= 0)
        {
            return res.render('user/profile_update', {
                title: "Profil Güncelleme",
                idkullanıcılar: idkullanıcılar,
                KullanıcıAdı: KullanıcıAdı,
                sifre: sifre,
                email: email,
                cinsiyet: cinsiyet,
                konum: konum,
                isim: isim,
                soyisim: soyisim,
                dogumTarihi: tarih,
                telefon: telefon,
                photoPath: photoPath,
                message: 'Email 255 karakterden fazla, 0 ve 0\'dan az olamaz',
                alert_type: 'alert-danger'
            });
        }
        else if(!kontroller.emailGecerliMi(email))
        {
            return res.render('user/profile_update', {
                title: "Profil Güncelleme",
                idkullanıcılar: idkullanıcılar,
                KullanıcıAdı: KullanıcıAdı,
                sifre: sifre,
                email: email,
                cinsiyet: cinsiyet,
                konum: konum,
                isim: isim,
                soyisim: soyisim,
                dogumTarihi: tarih,
                telefon: telefon,
                photoPath: photoPath,
                message: 'Email geçerli değil',
                alert_type: 'alert-danger'
            });
        }
        else if(telefon.length !== 10)
        {
            return res.render('user/profile_update', {
                title: "Profil Güncelleme",
                idkullanıcılar: idkullanıcılar,
                KullanıcıAdı: KullanıcıAdı,
                sifre: sifre,
                email: email,
                cinsiyet: cinsiyet,
                konum: konum,
                isim: isim,
                soyisim: soyisim,
                dogumTarihi: tarih,
                telefon: telefon,
                photoPath: photoPath,
                message: 'Telefon numarası 10 karakter fazla ya da az olamaz',
                alert_type: 'alert-danger'
            });
        }
        else if(kontroller.sayiDisindaKarakterVarMi(telefon))
        {
            return res.render('user/profile_update', {
                title: "Profil Güncelleme",
                idkullanıcılar: idkullanıcılar,
                KullanıcıAdı: KullanıcıAdı,
                sifre: sifre,
                email: email,
                cinsiyet: cinsiyet,
                konum: konum,
                isim: isim,
                soyisim: soyisim,
                dogumTarihi: tarih,
                telefon: telefon,
                photoPath: photoPath,
                message: 'Telefon numarasında sayı dışında karakter var',
                alert_type: 'alert-danger'
            });
        }

        const [users] = await db.execute('SELECT * FROM kullanıcılar WHERE KullanıcıAdı = ?', [KullanıcıAdı]);
        if(users.length > 0){
            return res.render('user/profile_update', {
                title: "Profil Güncelleme",
                idkullanıcılar: idkullanıcılar,
                KullanıcıAdı: KullanıcıAdı,
                sifre: sifre,
                email: email,
                cinsiyet: cinsiyet,
                konum: konum,
                isim: isim,
                soyisim: soyisim,
                dogumTarihi: tarih,
                telefon: telefon,
                photoPath: photoPath,
                message: 'Bu kullanıcı adı zaten kullanımda',
                alert_type: 'alert-danger'
            });
        }

        const [users2] = await db.execute('SELECT * FROM kullanıcılar WHERE email = ?', [email]);
        if(users2.length > 0){
            return res.render('user/profile_update', {
                title: "Profil Güncelleme",
                idkullanıcılar: idkullanıcılar,
                KullanıcıAdı: KullanıcıAdı,
                sifre: sifre,
                email: email,
                cinsiyet: cinsiyet,
                konum: konum,
                isim: isim,
                soyisim: soyisim,
                dogumTarihi: tarih,
                telefon: telefon,
                photoPath: photoPath,
                message: 'Bu email zaten kullanımda',
                alert_type: 'alert-danger'
            });
        }

        const [users3] = await db.execute('SELECT * FROM kullanıcılar WHERE telefon = ?', [telefon]);
        if(users3.length > 0){
            return res.render('user/profile_update', {
                title: "Profil Güncelleme",
                idkullanıcılar: idkullanıcılar,
                KullanıcıAdı: KullanıcıAdı,
                sifre: sifre,
                email: email,
                cinsiyet: cinsiyet,
                konum: konum,
                isim: isim,
                soyisim: soyisim,
                dogumTarihi: tarih,
                telefon: telefon,
                photoPath: photoPath,
                message: 'Bu telefon zaten kullanımda',
                alert_type: 'alert-danger'
            });
        }

        if(!kontroller.sifreGecerliMi(sifre))
        {
            return res.render('user/profile_update', {
                title: "Profil Güncelleme",
                idkullanıcılar: idkullanıcılar,
                KullanıcıAdı: KullanıcıAdı,
                sifre: sifre,
                email: email,
                cinsiyet: cinsiyet,
                konum: konum,
                isim: isim,
                soyisim: soyisim,
                dogumTarihi: tarih,
                telefon: telefon,
                photoPath: photoPath,
                message: 'Şifre en az bir harf ve bir sayı içermelidir ve uzunluğu en az 8 karakter olmalıdır. Ayrıca şifrede boşluk da olmamalıdır.',
                alert_type: 'alert-danger'
            });
        }

        const hashedPassword = await bcrypt.hash(sifre, 10);

        await db.execute('UPDATE kullanıcılar SET KullanıcıAdı = ?, sifre = ?, email = ?, cinsiyet = ?, konum = ?, isim = ?, soyisim = ?, dogumTarihi = ?, telefon = ?, photoPath = ? WHERE idkullanıcılar = ?', [KullanıcıAdı, hashedPassword, email, cinsiyet, "konum", isim, soyisim, dogumTarihi, telefon, "", idkullanıcılar]);
        

        return res.render('user/profile_update', {
            title: "Profil Güncelleme",
            idkullanıcılar: idkullanıcılar,
            KullanıcıAdı: KullanıcıAdı,
            sifre: sifre,
            email: email,
            cinsiyet: cinsiyet,
            konum: konum,
            isim: isim,
            soyisim: soyisim,
            dogumTarihi: tarih,
            telefon: telefon,
            photoPath: photoPath,
            message: 'Bilgiler Güncellendi',
            alert_type: 'alert-danger'
        });
    }
    catch(err)
    {
        console.log(err);
    }
});

router.get('/profile_update', async function(req,res){
    try{
        /*
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const tcno = decoded.tcno;
        */
        const [results,] = await db.execute("SELECT * FROM kullanıcılar WHERE KullanıcıAdı = ?", ['yakisikliboy']);
        const tarih = new Date(results[0].dogumTarihi).toISOString().split('T')[0];
        console.log(tarih);
        res.render('user/profile_update', {
            title: "Profil",
            idkullanıcılar: results[0].idkullanıcılar,
                KullanıcıAdı: results[0].KullanıcıAdı,
                sifre: results[0].sifre,
                email: results[0].email,
                cinsiyet: results[0].cinsiyet,
                konum: results[0].konum,
                isim: results[0].isim,
                soyisim: results[0].soyisim,
                dogumTarihi: tarih,
                telefon: results[0].telefon,
                photoPath: results[0].photoPath,
                message: '',
                alert_type: ''
        });
    }
    catch(err)
    {
        console.log(err);
    }
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
    try{

        //!! buraya konum eklenecek!! + kontrol
        const {nick, isim, soyisim, dogumTarihi, cinsiyet, email, telefon, ilgi_alani, password, repassword } = req.body;

        //console.log(nick, isim, soyisim, dogumTarihi, cinsiyet, email, telefon, ilgi_alani, password, repassword);
        console.log(ilgi_alani);

        //KONTROLLER
        //nick 50'den fazla mı 0 dan az mı
        if(nick.length > 50 || nick.length <= 0)
        {
            return res.render("user/register", {
                title: "Kullanıcı Kayıt",
                kutu_baslik: 'Kullanıcı Kayıt',
                message: 'Kullanıcı Adı 50 karakterden fazla, 0 ve 0\'dan az olamaz',
                alert_type: 'alert-danger',
            });
        }
        //isim
        else if(isim.length > 255 || isim.length <= 0)
        {
            return res.render("user/register", {
                title: "Kullanıcı Kayıt",
                kutu_baslik: 'Kullanıcı Kayıt',
                message: 'İsim 255 karakterden fazla, 0 ve 0\'dan az olamaz',
                alert_type: 'alert-danger',
            });
        }
        else if(kontroller.harfDisindaKarakterVarMi(isim))
        {
            return res.render("user/register", {
                title: "Kullanıcı Kayıt",
                kutu_baslik: 'Kullanıcı Kayıt',
                message: 'İsimde harf dışında karakter var',
                alert_type: 'alert-danger',
            });
        }
        //soyisim
        else if(soyisim.length > 255 || soyisim.length <= 0)
        {
            return res.render("user/register", {
                title: "Kullanıcı Kayıt",
                kutu_baslik: 'Kullanıcı Kayıt',
                message: 'Soyisim 255 karakterden fazla, 0 ve 0\'dan az olamaz',
                alert_type: 'alert-danger',
            });
        }
        else if(kontroller.harfDisindaKarakterVarMi(soyisim))
        {
            return res.render("user/register", {
                title: "Kullanıcı Kayıt",
                kutu_baslik: 'Kullanıcı Kayıt',
                message: 'Soyisimde harf dışında karakter var',
                alert_type: 'alert-danger',
            });
        }
        //dogumTarihi
        else if(!kontroller.isValidDate(dogumTarihi))
        {
            return res.render("user/register", {
                title: "Kullanıcı Kayıt",
                kutu_baslik: 'Kullanıcı Kayıt',
                message: 'Doğum tarihi hatalı',
                alert_type: 'alert-danger',
            });
        }
        //dogumTarihi bugünden büyük olamaz
        else if(new Date(dogumTarihi) > new Date())
        {
            return res.render("user/register", {
                title: "Kullanıcı Kayıt",
                kutu_baslik: 'Kullanıcı Kayıt',
                message: 'Doğum tarihi bugünden büyük olamaz',
                alert_type: 'alert-danger',
            });
        }
        //cinsiyet
        else if(cinsiyet !== '1' && cinsiyet !== '2' && cinsiyet !== "0")
        {
            return res.render('user/register', {
                message: 'Cinsiyet erkek, kadın veya belirtilmemiş olmalıdır',
                kutu_baslik: 'Kullanıcı Kayıt',
                title: 'Kullanıcı Kayıt',
                alert_type: 'alert-danger',
            });
        }
        //email
        else if(email.length > 255 || email.length <= 0)
        {
            return res.render("user/register", {
                title: "Kullanıcı Kayıt",
                kutu_baslik: 'Kullanıcı Kayıt',
                message: 'Email 255 karakterden fazla, 0 ve 0\'dan az olamaz',
                alert_type: 'alert-danger',
            });
        }
        //
        else if(!kontroller.emailGecerliMi(email))
        {
            return res.render("user/register", {
                title: "Kullanıcı Kayıt",
                kutu_baslik: 'Kullanıcı Kayıt',
                message: 'Email geçerli değil',
                alert_type: 'alert-danger',
            });
        }
        //telefon
        else if(telefon.length !== 10)
        {
            return res.render("user/register", {
                title: "Kullanıcı Kayıt",
                kutu_baslik: 'Kullanıcı Kayıt',
                message: 'Telefon numarası 10 karakterden fazla ya da az olamaz',
                alert_type: 'alert-danger',
            });
        }
        else if(kontroller.sayiDisindaKarakterVarMi(telefon))
        {
            return res.render("user/register", {
                title: "Kullanıcı Kayıt",
                kutu_baslik: 'Kullanıcı Kayıt',
                message: 'Telefon numarasında sayı dışında karakter var',
                alert_type: 'alert-danger',
            });
        }
        //ilgi alani
        else if (!ilgi_alani || ilgi_alani.length === 0)
        {
            return res.render("user/register", {
                title: "Kullanıcı Kayıt",
                kutu_baslik: 'Kullanıcı Kayıt',
                message: 'En az bir ilgi alanı seçilmelidir',
                alert_type: 'alert-danger',
            });
        }
        //password

        //user kontrol
        const [users] = await db.execute('SELECT * FROM kullanıcılar WHERE KullanıcıAdı = ?', [nick]);
        if (users.length > 0) {
            return res.render("user/register", {
                title: "Kullanıcı Kayıt",
                kutu_baslik: 'Kullanıcı Kayıt',
                message: 'Bu kullanıcı adı zaten kullanımda',
                alert_type: 'alert-danger',
            });
        }
        else if(password !== repassword)
        {
            return res.render("user/register", {
                title: "Kullanıcı Kayıt",
                kutu_baslik: 'Kullanıcı Kayıt',
                message: 'Şifreler uyuşmuyor',
                alert_type: 'alert-danger',
            });
        }

        // email kontrol
        const [users2] = await db.execute('SELECT * FROM kullanıcılar WHERE email = ?', [email]);
        if (users2.length > 0) {
            return res.render("user/register", {
                title: "Kullanıcı Kayıt",
                kutu_baslik: 'Kullanıcı Kayıt',
                message: 'Bu email zaten kullanımda',
                alert_type: 'alert-danger',
            });
        }

        // telefon
        const [users3] = await db.execute('SELECT * FROM kullanıcılar WHERE telefon = ?', [telefon]);
        if (users3.length > 0) {
            return res.render("user/register", {
                title: "Kullanıcı Kayıt",
                kutu_baslik: 'Kullanıcı Kayıt',
                message: 'Bu telefon zaten kullanımda',
                alert_type: 'alert-danger',
            });
        }

        //sifre kontrol
        if(!kontroller.sifreGecerliMi(password))
        {
            return res.render("user/register", {
                title: "Kullanıcı Kayıt",
                kutu_baslik: 'Kullanıcı Kayıt',
                message: 'Şifre en az bir harf ve bir sayı içermelidir ve uzunluğu en az 8 karakter olmalıdır. Ayrıca şifrede boşluk da olmamalıdır.',
                alert_type: 'alert-danger',
            });
        }

        //hashleme
        const hashedPassword = await bcrypt.hash(password, 10);

        //db'ye ekleme
        await db.execute(`INSERT INTO kullanıcılar (KullanıcıAdı, sifre, email, cinsiyet, konum, isim, soyisim, dogumTarihi, telefon, photoPath) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [nick, hashedPassword, email, cinsiyet, "konum", isim, soyisim, dogumTarihi, telefon, ""]);

        res.redirect("/user/photo_upload_render")







    }
    catch(err)
    {
        console.log("register post error: " + err);
    }
    //kontrol islemleri


    //her sey ok ise kullanıcı olustur db'de + token olustur

    //foto yukleme ekranına yonlendirme
    
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

router.get('/profile_update', async function(req,res){
    try{
        /*
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const tcno = decoded.tcno;
        */
        const [results,] = await db.execute("SELECT * FROM hasta WHERE tcno = ?", [tcno]);
        res.render('user/profile_update', {
            id: results[0].hastaid,
            tcno: results[0].tcno,
            isim: results[0].isim,
            soyisim: results[0].soyisim,
            //dogumTarihi: results[0].dogumTarihi,
            //cinsiyet: cinsiyettemp,
            telefon: results[0].telefon,
            sehir: results[0].sehir,
            ilce: results[0].ilce,
            mahalle: results[0].mahalle,
            message: '',
            alert_type: '',
        });
    }
    catch(err)
    {
        console.log(err);
    }
});

module.exports = router;