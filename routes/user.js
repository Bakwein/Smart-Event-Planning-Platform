const express = require("express");
const router = express.Router();
const path = require("path");
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();
const db = require("../data/db");
const kontroller = require('../kontroller');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


function cookie_control(req, res)
{
    if(req.cookies.token)
    {
        const token = req.cookies.token;
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
            if(err){
                return res.redirect('/');
            }
        })
    }
    else
    {
        return res.redirect('/');
    }
}

function you_have_cookie(req, res)
{
    if(req.cookies.token)
    {
        const token = req.cookies.token;
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
            if(!err){
                if(decoded.role === 'user')
                {
                    return res.redirect("/user/home_render");
                }
                else if(decoded.role === 'admin')
                {
                    return res.redirect("/admin/home_render");
                }
                else
                {
                    return res.redirect("/user/logout");
                }
            }
            else
            {
                return res.redirect("/user/logout");
            }
        })
    }
}

router.get("/ilgi_list", async function(req, res)
{
    cookie_control(req, res);

    try{
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const id = decoded.id;

        const [res_first,] = await db.execute("SELECT * FROM kullanıcılar where idkullanıcılar = ?", [id]);
        if(res_first.length === 0)
            {
                res.redirect("/user/logout");
            }
        const name_ = res_first[0].KullanıcıAdı;
        const kullaniciid = res_first[0].idkullanıcılar;
        const [ilgiler,] = await db.execute(
            `SELECT i.ilgiAlani, i.idilgiAlanlari
             FROM ilgialanlari i
             LEFT JOIN kullanici_ilgileri ki ON i.idilgiAlanlari = ki.idilgiR AND ki.idkullaniciR = ?
             WHERE ki.idilgiR IS NOT NULL;`,
            [kullaniciid]
        );
        //const [tumilgiler,] = await db.execute("SELECT * FROM ilgialanlari");
        const [nonilgiler,] = await db.execute(
            `SELECT i.ilgiAlani, i.idilgiAlanlari
             FROM ilgialanlari i
             LEFT JOIN kullanici_ilgileri ki ON i.idilgiAlanlari = ki.idilgiR AND ki.idkullaniciR = ?
             WHERE ki.idilgiR IS NULL;`,
            [kullaniciid]
        );
        
        res.render('user/ilgi_list', {
            title: "İlgiler",
            idkullanıcılar: kullaniciid,
            ilgiler: ilgiler,
            nonilgiler: nonilgiler,
            message: '',
            alert_type: ''
        });
    }
    catch(err)
    {
        console.log(err);
    }
});

router.get('/ilgi_list/delete/:idilgiAlanlari', async function(req, res) {
    try{
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const id = decoded.id;
        const idilgiAlanlari = req.params.idilgiAlanlari;
        const [iliskiler,] = await db.execute("SELECT * FROM kullanici_ilgileri WHERE idilgiR = ? AND idkullaniciR = ?", [idilgiAlanlari, id]);
        if(iliskiler.length === 0)
        {
            return res.redirect('/user/ilgi_list');
        }

        await db.execute("DELETE FROM kullanici_ilgileri WHERE idilgiR = ? AND idkullaniciR = ?", [idilgiAlanlari, id]);

        res.redirect('/user/ilgi_list');
    }
    catch(err)
    {
        console.log(err);
    }
});

router.get('/ilgi_list/add/:idilgiAlanlari', async function(req, res) {
    try{
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const id = decoded.id;
        const idilgiAlanlari = req.params.idilgiAlanlari;
        const [iliskiler,] = await db.execute("SELECT * FROM kullanici_ilgileri WHERE idilgiR = ? AND idkullaniciR = ?", [idilgiAlanlari, id]);
        if(iliskiler.length !== 0)
        {
            return res.redirect('/user/ilgi_list');
        }

        await db.execute("INSERT INTO kullanici_ilgileri(idilgiR, idkullaniciR) VALUES(?,?)", [idilgiAlanlari, id]);

        res.redirect('/user/ilgi_list');
    }
    catch(err)
    {
        console.log(err);
    }
});

router.get("/profile", async function(req, res)
{
    //control
    cookie_control(req, res);

    try{
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const id = decoded.id;
        const [results,] = await db.execute("SELECT * FROM kullanıcılar where idkullanıcılar = ?", [id]); 

        if(results.length === 0)
        {
            res.redirect("/user/logout");
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
    cookie_control(req, res);
    res.redirect('/user/profile_update');
});

router.post('/profile_update', async function(req, res)
{
    cookie_control(req, res);
    try{
        const {idkullanıcılar,KullanıcıAdı, sifre, email, cinsiyet, konum, isim, soyisim, dogumTarihi, telefon, photoPath} = req.body;
        //console.log(req.body);
        const tarih = new Date(dogumTarihi).toISOString().split('T')[0];
        //console.log(tarih);
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
            if(users[0].idkullanıcılar != idkullanıcılar)
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
                    message: 'Bu kullanıcı adı zaten kullanımda',
                    alert_type: 'alert-danger'
                });
            }
            
        }
        //console.log(idkullanıcılar);
        const [users2] = await db.execute('SELECT * FROM kullanıcılar WHERE email = ?', [email]);
        if(users2.length > 0){
            console.log(users2[0].idkullanıcılar, "***");
            if(users2[0].idkullanıcılar != idkullanıcılar)
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
                    message: 'Bu email zaten kullanımda',
                    alert_type: 'alert-danger'
                });
            }
        }

        const [users3] = await db.execute('SELECT * FROM kullanıcılar WHERE telefon = ?', [telefon]);
        if(users3.length > 0){
            if(users3[0].idkullanıcılar != idkullanıcılar)
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
                    message: 'Bu telefon zaten kullanımda',
                    alert_type: 'alert-danger'
                });
            }
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
                message: 'Şifre en az bir harf ve bir sayı, bir özel karakter içermelidir ve uzunluğu en az 8 karakter olmalıdır. Ayrıca şifrede boşluk da olmamalıdır.',
                alert_type: 'alert-danger'
            });
        }

        const hashedPassword = await bcrypt.hash(sifre, 10);

        await db.execute('UPDATE kullanıcılar SET KullanıcıAdı = ?, sifre = ?, email = ?, cinsiyet = ?, konum = ?, isim = ?, soyisim = ?, dogumTarihi = ?, telefon = ?, photoPath = ? WHERE idkullanıcılar = ?', [KullanıcıAdı, hashedPassword, email, cinsiyet, "konum", isim, soyisim, dogumTarihi, telefon, photoPath, idkullanıcılar]);
        

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
    cookie_control(req, res);

    try{
        
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const id = decoded.id;

        const [res_first,] = await db.execute("select * from kullanıcılar where idkullanıcılar = ?", [id]);
        if(res_first.length === 0)
        {
            res.redirect("/user/logout");
        }
        const name_ = res_first[0].KullanıcıAdı;
        
        const [results,] = await db.execute("SELECT * FROM kullanıcılar WHERE KullanıcıAdı = ?", [name_]);
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
    cookie_control(req, res);
    res.render("user/index", {
        title: "Anasayfa"
    });
});

router.get("/login_render", function(req, res)
{
    you_have_cookie(req, res);
    //token kontrolü
    res.redirect("/user/login");
});

router.get("/login", function(req, res)
{
    you_have_cookie(req, res);
    res.render("user/login", {
        title: "Login",
        kutu_baslik: 'Kullanıcı Girişi',
        message: '',
        alert_type: '',
    });
});

router.post("/login", async function(req, res){
    you_have_cookie(req, res);
    try{
        const {name, password} = req.body;
        

        if(name.length > 50 || name.length <= 0)
        {
            return res.render("user/login", {
                title: "Login",
                kutu_baslik: 'Kullanıcı Girişi',
                message: 'Kullanıcı Bulunamadı',
                alert_type: 'alert-danger',
            });
        }
    
        const [result,] = await db.execute("select * from kullanıcılar where KullanıcıAdı = ?", [name]);

        if(result.length === 0)
        {
            return res.render("user/login", {
                title: "Login",
                kutu_baslik: 'Kullanıcı Girişi',
                message: 'Kullanıcı Bulunamadı',
                alert_type: 'alert-danger',
            });
        }
        else
        {
            const hashedInput = result[0].sifre;

            if(await bcrypt.compare(password, hashedInput))
            {
                const kullanici_id = result[0].idkullanıcılar;
                const token = jwt.sign({id: kullanici_id, role: "user"}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})

                //cookie
                /* 
                if(process.env.isHttps == 'true'){
                    res.cookie('token', token, {httpOnly: true, secure: true});
                }
                else{
                    res.cookie('token', token, {httpOnly: true});
                }
                */
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.isHttps === 'true'
                });

                return res.redirect('/user/home_render')
                
            }
            else
            {
                return res.render("user/login", {
                    title: "Login",
                    kutu_baslik: 'Kullanıcı Girişi',
                    message: 'Şifre Yanlış!',
                    alert_type: 'alert-danger',
                });
            }
        }



    }
    catch(err)
    {
        console.log(err);
    }
});

function verifyToken(req, res)
{
    const token = req.cookies.token;
    if(!token)
    {
        return res.render("user/login", {
            title: "Login",
            kutu_baslik: 'Kullanıcı Girişi',
            message: 'Token bulunamadı',
            alert_type: 'alert-danger',
        });
    }
    try{
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        return decoded;
    }
    catch(err)
    {
        return res.render("user/login", {
            title: "Login",
            kutu_baslik: 'Kullanıcı Girişi',
            message: 'Token geçersiz',
            alert_type: 'alert-danger',
        });
    }
}

router.get('/home_render', function(req, res)
{
    cookie_control(req, res);
    const user = verifyToken(req, res);
    res.redirect('/user/home');
});

router.get("/home", async function(req, res){
    cookie_control(req, res);
    //console.log("gridi");
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const id = decoded.id;

    //
    res.render('user/home', {
        title: "Anasayfa",
    })
});

router.get("/register_render", function(req, res)
{
    you_have_cookie(req, res);

    res.redirect("/user/register");
});


router.get("/register", function(req, res)
{
    you_have_cookie(req, res);
    res.render("user/register", {
        title: "Kullanıcı Kayıt",
        kutu_baslik: 'Kullanıcı Kayıt',
        message: '',
        alert_type: '',
    });
});

router.get("/photo_upload_render/:id", async function(req, res)
{
    you_have_cookie(req, res);
    const userId = req.params.id;
    console.log(userId);
    try{

        const [results,] = await db.execute("SELECT * FROM kullanıcılar WHERE idkullanıcılar = ?", [userId]);
        /*
        let photoPath = "/static/images/default_pp.png";
        if(results[0].photoPath !== null && results[0].photoPath !== "")
        {
            photoPath = "/static" + results[0].photoPath.split('public')[1];
        }*/
        //console.log(results[0].photoPath, "*****");
        if(results[0].photoPath !== "/static/images/default_pp.png")
        {
            photoPath = "/static" + results[0].photoPath.split('public')[1];
        }
        

        res.render("user/photo_upload", {
            title: "Photo Upload",
            userId: userId,
            photoPath: results[0].photoPath
        });

    }
    catch(err)
    {
        console.log(err);
    }


    
});

router.post("/register", async function(req, res)
{
    you_have_cookie(req, res);
    try{

        //!! buraya konum eklenecek!! + kontrol
        const {nick, isim, soyisim, dogumTarihi, cinsiyet, email, telefon, ilgi_alani, password, repassword } = req.body;

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
                message: 'Şifre en az bir harf, bir sayı ve bir karakter içermelidir ve uzunluğu en az 8 karakter olmalıdır. Ayrıca şifrede boşluk da olmamalıdır.',
                alert_type: 'alert-danger',
            });
        }

        //hashleme
        const hashedPassword = await bcrypt.hash(password, 10);

        //kullanici db'ye ekleme
        await db.execute(`INSERT INTO kullanıcılar (KullanıcıAdı, sifre, email, cinsiyet, konum, isim, soyisim, dogumTarihi, telefon, photoPath) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [nick, hashedPassword, email, cinsiyet, "konum", isim, soyisim, dogumTarihi, telefon, "/static/images/default_pp.png"]);

        const [users_varmi] = await db.execute('SELECT * FROM kullanıcılar WHERE KullanıcıAdı = ?', [nick]);


        //iliski ekleme
        if(ilgi_alani.length > 0)
        {
            for(let i = 0; i < ilgi_alani.length; i++)
            {
                //ilgi alani id bulma
                const [ilgi_id] = await db.execute(`SELECT idilgiAlanlari FROM ilgialanlari WHERE ilgiAlani = ?`, [ilgi_alani[i]]);

                //kullanici id alma
                const [users] = await db.execute(`SELECT idkullanıcılar FROM kullanıcılar WHERE KullanıcıAdı = ?`, [nick]);


                //iliski ekleme
                await db.execute(`INSERT INTO kullanici_ilgileri (idkullaniciR, idilgiR) VALUES (?, ?)`, [users[0].idkullanıcılar, ilgi_id[0].idilgiAlanlari]);
                //console.log(users[0].idkullanıcılar);
                res.redirect(`/user/photo_upload_render/${users_varmi[0].idkullanıcılar}`);

            }
        }
    }
    catch(err)
    {
        console.log("register post error: " + err);
    }  
    
});

router.get("/forgot_password_render", function(req, res)
{
    you_have_cookie(req, res);
    res.render("user/forgot_password_render", {
        title: "Şifremi Unuttum!",
        message: '',
        alert_type: '',
    });
});

router.post("/new_password", async function(req, res)
{
    you_have_cookie(req, res);
    const {email} = req.body;
    console.log(email);

    //email db'de kayıtlı mı
    const [users] = await db.execute('SELECT * FROM kullanıcılar WHERE email = ?', [email]);
    if(users.length === 0)
    {
        return res.render("user/forgot_password_render", {
            title: "Şifremi Unuttum!",
            message: 'Bu email ile kayıtlı bir kullanıcı bulunamadı',
            alert_type: 'alert-danger',
        });
    }


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
        return res.render("user/code_check", {
            title: "Şifremi Unuttum!",
            message: '',
            alert_type: '',
            email: email
        });
    } catch (error) {
        console.error('E-posta gönderim hatası:', error);
        return res.render("user/forgot_password_render", {
            title: "Şifremi Unuttum!",
            message: 'E-posta gönderim hatası',
            alert_type: 'alert-danger',
        });
    }
});

router.post("/check_password", async function(req, res){
    you_have_cookie(req, res);
    const {email, code} = req.body;
    console.log("code", code, email);

    const [kontroller] = await db.execute('SELECT * FROM kontrol WHERE idkontrol = ?', [1]);

    if (kontroller.length > 0) {
        const num_ = kontroller[0].emailCode;
        if(code == num_)
        {
            // ok
            res.render("user/check_password", {
                title: "Şifreyi Güncelle!",
                message: '',
                alert_type: '',
                email: email
            })
        }
        else
        {
            // hata
            res.render("user/code_check", {
                title: "Şifremi Unuttum!",
                message: 'Kod hatalı',
                alert_type: 'alert-danger',
                email: email
            });
        }
    } else {
        console.log('No record found with idkontrol = 1');
        //hata durumu ?
        res.render("user/code_check", {
            title: "Şifremi Unuttum!",
            message: 'db hatası!',
            alert_type: 'alert-danger',
            email: email
        });
    }

});

router.post("/update_new_password", async function(req, res){
    you_have_cookie(req, res);
    const {email, password, repassword} = req.body;
    console.log("2:", email);

    if(password !== repassword)
    {
        return res.render("user/check_password", {
            title: "Şifreyi Güncelle!",
            message: 'Şifreler uyuşmuyor',
            alert_type: 'alert-danger',
            email: email
        });
    }
    else if(!kontroller.sifreGecerliMi(password))
    {
        return res.render("user/check_password", {
            title: "Şifreyi Güncelle!",
            message: 'Şifre en az bir harf, bir sayı ve bir karakter içermelidir ve uzunluğu en az 8 karakter olmalıdır. Ayrıca şifrede boşluk da olmamalıdır.',
            alert_type: 'alert-danger',
            email: email
        });
    }

    const [users,] = await db.execute("select * from kullanıcılar where email = ?", [email]);
    if(users.length === 0)
    {
        return res.render("user/check_password", {
            title: "Şifreyi Güncelle!",
            message: 'Bu email ile kayıtlı bir kullanıcı bulunamadı',
            alert_type: 'alert-danger',
            email: email
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    //update password
    await db.execute('UPDATE kullanıcılar SET sifre = ? WHERE email = ?', [hashedPassword, email]);

    res.render("user/check_password", {
        title: "Şifreyi Güncelle!",
        message: 'Şifre başarıyla güncellendi',
        alert_type: 'alert-success',
        email: email
    });
});

router.get("/logout", function(req, res)
{
    res.clearCookie('token');
    res.redirect("/");
});

module.exports = router;