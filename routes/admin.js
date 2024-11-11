const express = require("express");
const router = express.Router();
const path = require("path");
const dotenv = require('dotenv');
dotenv.config();
const db = require("../data/db");
const kontroller = require('../kontroller');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { title } = require("process");

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
                return res.redirect("/admin/logout");
            }
        })
    }
}


router.get("/users", async function(req, res)
{
    cookie_control(req, res);

    try{
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const id = decoded.id;

        const [kullanicilar,] = await db.execute('SELECT * FROM kullanıcılar');

        res.render('admin/users', {
            title: 'Kullanıcılar',
            kullanicilar: kullanicilar,
            message: '',
            alert_type: ''
        });
    }
    catch(err)
    {
        console.log(err);
    }
});

router.get('/users/delete/:id', async function(req, res){
    try{
        const idkullanıcılar = req.params.id;
        const [kullanici,] = await db.execute("SELECT * FROM kullanıcılar WHERE idkullanıcılar = ?", [idkullanıcılar]);
        if(kullanici.length === 0)
        {
            return res.redirect('/admin/users');
        }

        await db.execute("DELETE FROM kullanıcılar WHERE idkullanıcılar = ?", [idkullanıcılar]);

        res.redirect('/admin/users');
    }
    catch(err)
    {
        console.log(err);
    }
});

router.get('/users/update/:id', async function(req, res){
    try{
        const idkullanıcılar = req.params.id;
        const [kullanici,] = await db.execute("SELECT * FROM kullanıcılar WHERE idkullanıcılar = ?", [idkullanıcılar]);
        if(kullanici.length === 0)
        {
            return res.redirect('/admin/users');
        }

        res.redirect(`/admin/user_update/${idkullanıcılar}`);
    }
    catch(err)
    {
        console.log(err);
    }
});

router.get('/user_update/:id', async function(req, res){
    try{
        const idkullanıcılar = req.params.id;
        const[kullanici,] = await db.execute("SELECT * FROM kullanıcılar WHERE idkullanıcılar = ?", [idkullanıcılar]);
        if(kullanici.length === 0)
        {
            return res.redirect('/admin/users');
        }

        const tarih = new Date(kullanici[0].dogumTarihi).toISOString().split('T')[0];

        res.render('admin/user_update', {
            title: "Kullanıcı Düzenleme",
            idkullanıcılar: kullanici[0].idkullanıcılar,
            KullanıcıAdı: kullanici[0].KullanıcıAdı,
            sifre: kullanici[0].sifre,
            email: kullanici[0].email,
            cinsiyet: kullanici[0].cinsiyet,
            konum: kullanici[0].konum,
            isim: kullanici[0].isim,
            soyisim: kullanici[0].soyisim,
            dogumTarihi: tarih,
            telefon: kullanici[0].telefon,
            photoPath: kullanici[0].photoPath,
            message: '',
            alert_type: ''
        });
    }
    catch(err)
    {
        console.log(err);
    }
});

router.post('/user_update/:id', async function(req, res)
{
    try{
        const {idkullanıcılar,KullanıcıAdı, sifre, email, cinsiyet, konum, isim, soyisim, dogumTarihi, telefon} = req.body;

        //kullanıcı kontrol ev photopath alma
        const [user_control,] = await db.execute("select * from kullanıcılar where idkullanıcılar = ?", [idkullanıcılar]);
        if(user_control === 0)
        {
            return res.redirect("/user/logout");
        }

        const photoPath = user_control[0].photoPath;

        if(KullanıcıAdı.length > 50 || KullanıcıAdı.length <= 0)
            {
                return res.render('admin/user_update', {
                    title: "Profil Güncelleme",
                    idkullanıcılar: idkullanıcılar,
                    KullanıcıAdı: KullanıcıAdı,
                    sifre: sifre,
                    email: email,
                    cinsiyet: cinsiyet,
                    konum: konum,
                    isim: isim,
                    soyisim: soyisim,
                    dogumTarihi: dogumTarihi,
                    telefon: telefon,
                    photoPath: photoPath,
                    message: 'Kullanıcı Adı 50 karakterden fazla, 0 ve 0\'dan az olamaz',
                    alert_type: 'alert-danger'
                });
            }
            else if(isim.length > 255 || isim.length <= 0)
            {
                return res.render('admin/user_update', {
                    title: "Profil Güncelleme",
                    idkullanıcılar: idkullanıcılar,
                    KullanıcıAdı: KullanıcıAdı,
                    sifre: sifre,
                    email: email,
                    cinsiyet: cinsiyet,
                    konum: konum,
                    isim: isim,
                    soyisim: soyisim,
                    dogumTarihi: dogumTarihi,
                    telefon: telefon,
                    photoPath: photoPath,
                    message: 'İsim 255 karakterden fazla, 0 ve 0\'dan az olamaz',
                    alert_type: 'alert-danger'
                });
            }
            else if(kontroller.harfDisindaKarakterVarMi(isim))
            {
                return res.render('admin/user_update', {
                    title: "Profil Güncelleme",
                    idkullanıcılar: idkullanıcılar,
                    KullanıcıAdı: KullanıcıAdı,
                    sifre: sifre,
                    email: email,
                    cinsiyet: cinsiyet,
                    konum: konum,
                    isim: isim,
                    soyisim: soyisim,
                    dogumTarihi: dogumTarihi,
                    telefon: telefon,
                    photoPath: photoPath,
                    message: 'İsimde harf dışında karakter var',
                    alert_type: 'alert-danger'
                });
            }
            else if(soyisim.length > 255 || soyisim.length <= 0)
            {
                return res.render('admin/user_update', {
                    title: "Profil Güncelleme",
                    idkullanıcılar: idkullanıcılar,
                    KullanıcıAdı: KullanıcıAdı,
                    sifre: sifre,
                    email: email,
                    cinsiyet: cinsiyet,
                    konum: konum,
                    isim: isim,
                    soyisim: soyisim,
                    dogumTarihi: dogumTarihi,
                    telefon: telefon,
                    photoPath: photoPath,
                    message: 'Soyisim 255 karakterden fazla, 0 ve 0\'dan az olamaz',
                    alert_type: 'alert-danger'
                });
            }
            else if(kontroller.harfDisindaKarakterVarMi(soyisim))
            {
                return res.render('admin/user_update', {
                    title: "Profil Güncelleme",
                    idkullanıcılar: idkullanıcılar,
                    KullanıcıAdı: KullanıcıAdı,
                    sifre: sifre,
                    email: email,
                    cinsiyet: cinsiyet,
                    konum: konum,
                    isim: isim,
                    soyisim: soyisim,
                    dogumTarihi: dogumTarihi,
                    telefon: telefon,
                    photoPath: photoPath,
                    message: 'Soyisimde harf dışında karakter var',
                    alert_type: 'alert-danger'
                });
            }
            else if(!kontroller.isValidDate(dogumTarihi))
            {
                return res.render('admin/user_update', {
                    title: "Profil Güncelleme",
                    idkullanıcılar: idkullanıcılar,
                    KullanıcıAdı: KullanıcıAdı,
                    sifre: sifre,
                    email: email,
                    cinsiyet: cinsiyet,
                    konum: konum,
                    isim: isim,
                    soyisim: soyisim,
                    dogumTarihi: dogumTarihi,
                    telefon: telefon,
                    photoPath: photoPath,
                    message: 'Doğum tarihi hatalı',
                    alert_type: 'alert-danger'
                });
            }
            else if(new Date(dogumTarihi) > new Date())
            {
                return res.render('admin/user_update', {
                    title: "Profil Güncelleme",
                    idkullanıcılar: idkullanıcılar,
                    KullanıcıAdı: KullanıcıAdı,
                    sifre: sifre,
                    email: email,
                    cinsiyet: cinsiyet,
                    konum: konum,
                    isim: isim,
                    soyisim: soyisim,
                    dogumTarihi: dogumTarihi,
                    telefon: telefon,
                    photoPath: photoPath,
                    message: 'Doğum tarihi bugünden büyük olamaz',
                    alert_type: 'alert-danger'
                });
            }
            else if(cinsiyet !== '1' && cinsiyet !== '2' && cinsiyet !== '0')
            {
                return res.render('admin/user_update', {
                    title: "Profil Güncelleme",
                    idkullanıcılar: idkullanıcılar,
                    KullanıcıAdı: KullanıcıAdı,
                    sifre: sifre,
                    email: email,
                    cinsiyet: cinsiyet,
                    konum: konum,
                    isim: isim,
                    soyisim: soyisim,
                    dogumTarihi: dogumTarihi,
                    telefon: telefon,
                    photoPath: photoPath,
                    message: 'Cinsiyet erkek, kadın veya belirtilmemiş olmalıdır',
                    alert_type: 'alert-danger'
                });
            }
            else if(email.length > 255 || email.length <= 0)
            {
                return res.render('admin/user_update', {
                    title: "Profil Güncelleme",
                    idkullanıcılar: idkullanıcılar,
                    KullanıcıAdı: KullanıcıAdı,
                    sifre: sifre,
                    email: email,
                    cinsiyet: cinsiyet,
                    konum: konum,
                    isim: isim,
                    soyisim: soyisim,
                    dogumTarihi: dogumTarihi,
                    telefon: telefon,
                    photoPath: photoPath,
                    message: 'Email 255 karakterden fazla, 0 ve 0\'dan az olamaz',
                    alert_type: 'alert-danger'
                });
            }
            else if(!kontroller.emailGecerliMi(email))
            {
                return res.render('admin/user_update', {
                    title: "Profil Güncelleme",
                    idkullanıcılar: idkullanıcılar,
                    KullanıcıAdı: KullanıcıAdı,
                    sifre: sifre,
                    email: email,
                    cinsiyet: cinsiyet,
                    konum: konum,
                    isim: isim,
                    soyisim: soyisim,
                    dogumTarihi: dogumTarihi,
                    telefon: telefon,
                    photoPath: photoPath,
                    message: 'Email geçerli değil',
                    alert_type: 'alert-danger'
                });
            }
            else if(telefon.length !== 10)
            {
                return res.render('admin/user_update', {
                    title: "Profil Güncelleme",
                    idkullanıcılar: idkullanıcılar,
                    KullanıcıAdı: KullanıcıAdı,
                    sifre: sifre,
                    email: email,
                    cinsiyet: cinsiyet,
                    konum: konum,
                    isim: isim,
                    soyisim: soyisim,
                    dogumTarihi: dogumTarihi,
                    telefon: telefon,
                    photoPath: photoPath,
                    message: 'Telefon numarası 10 karakter fazla ya da az olamaz',
                    alert_type: 'alert-danger'
                });
            }
            else if(kontroller.sayiDisindaKarakterVarMi(telefon))
            {
                return res.render('admin/user_update', {
                    title: "Profil Güncelleme",
                    idkullanıcılar: idkullanıcılar,
                    KullanıcıAdı: KullanıcıAdı,
                    sifre: sifre,
                    email: email,
                    cinsiyet: cinsiyet,
                    konum: konum,
                    isim: isim,
                    soyisim: soyisim,
                    dogumTarihi: dogumTarihi,
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
                    return res.render('admin/user_update', {
                        title: "Profil Güncelleme",
                        idkullanıcılar: idkullanıcılar,
                        KullanıcıAdı: KullanıcıAdı,
                        sifre: sifre,
                        email: email,
                        cinsiyet: cinsiyet,
                        konum: konum,
                        isim: isim,
                        soyisim: soyisim,
                        dogumTarihi: dogumTarihi,
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
                    return res.render('admin/user_update', {
                        title: "Profil Güncelleme",
                        idkullanıcılar: idkullanıcılar,
                        KullanıcıAdı: KullanıcıAdı,
                        sifre: sifre,
                        email: email,
                        cinsiyet: cinsiyet,
                        konum: konum,
                        isim: isim,
                        soyisim: soyisim,
                        dogumTarihi: dogumTarihi,
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
                    return res.render('admin/user_update', {
                        title: "Profil Güncelleme",
                        idkullanıcılar: idkullanıcılar,
                        KullanıcıAdı: KullanıcıAdı,
                        sifre: sifre,
                        email: email,
                        cinsiyet: cinsiyet,
                        konum: konum,
                        isim: isim,
                        soyisim: soyisim,
                        dogumTarihi: dogumTarihi,
                        telefon: telefon,
                        photoPath: photoPath,
                        message: 'Bu telefon zaten kullanımda',
                        alert_type: 'alert-danger'
                    });
                }
            }
    
            if(!kontroller.sifreGecerliMi(sifre))
            {
                return res.render('admin/user_update', {
                    title: "Profil Güncelleme",
                    idkullanıcılar: idkullanıcılar,
                    KullanıcıAdı: KullanıcıAdı,
                    sifre: sifre,
                    email: email,
                    cinsiyet: cinsiyet,
                    konum: konum,
                    isim: isim,
                    soyisim: soyisim,
                    dogumTarihi: dogumTarihi,
                    telefon: telefon,
                    photoPath: photoPath,
                    message: 'Şifre en az bir harf ve bir sayı, bir özel karakter içermelidir ve uzunluğu en az 8 karakter olmalıdır. Ayrıca şifrede boşluk da olmamalıdır.',
                    alert_type: 'alert-danger'
                });
            }
    
            const hashedPassword = await bcrypt.hash(sifre, 10);
    
            await db.execute('UPDATE kullanıcılar SET KullanıcıAdı = ?, sifre = ?, email = ?, cinsiyet = ?, konum = ?, isim = ?, soyisim = ?, dogumTarihi = ?, telefon = ?, photoPath = ? WHERE idkullanıcılar = ?', [KullanıcıAdı, hashedPassword, email, cinsiyet, "konum", isim, soyisim, dogumTarihi, telefon, photoPath, idkullanıcılar]);
            
    
            return res.render('admin/user_update', {
                title: "Profil Güncelleme",
                idkullanıcılar: idkullanıcılar,
                KullanıcıAdı: KullanıcıAdı,
                sifre: sifre,
                email: email,
                cinsiyet: cinsiyet,
                konum: konum,
                isim: isim,
                soyisim: soyisim,
                dogumTarihi: dogumTarihi,
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

router.use("/admin/profile", function(req, res)
{
    cookie_control(req, res);
    //res.send("profil");
    res.render("admin/profile", {
        title: "Profile"
    });
});

router.get("/login_render", function(req, res)
{
    you_have_cookie(req, res);
    //token kontrolü
    res.redirect("/admin/login");
});

router.get("/login", function(req, res)
{
    you_have_cookie(req, res);
    res.render("admin/login", {
        title: "Login",
        kutu_baslik: 'Admin Girişi',
        message: '',
        alert_type: '',
    });
});

router.post("/login", async function(req, res)
{
   you_have_cookie(req, res);
   try{
        const {name, password} = req.body;
        //console.log(name);

        if(name.length > 50 || name.length <= 0)
        {
            res.render("admin/login", {
                title: "Login",
                kutu_baslik: 'Admin Girişi',
                message: 'Kullanıcı adı 1-50 karakter arasında olmalıdır.',
                alert_type: 'danger',
            });
        }

        const [result, ] = await db.execute('SELECT * FROM admin WHERE kullaniciAdi = ?', [name]);

        if(result.length === 0)
        {
            res.render("admin/login", {
                title: "Login",
                kutu_baslik: 'Admin Girişi',
                message: 'Kullanıcı bulunamadı.',
                alert_type: 'danger',
            });
        }
        else
        {
            const hashed_input = result[0].sifre;
            //password === hashed_input
            if(await bcrypt.compare(password, hashed_input))
            {
                const admin_id = result[0].idadmin;
                const token = jwt.sign({id: admin_id, role: 'admin'}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});

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

                res.redirect('/admin/home_render');
            }
            else
            {
                res.render("admin/login", {
                    title: "Login",
                    kutu_baslik: 'Admin Girişi',
                    message: 'Şifre hatalı.',
                    alert_type: 'danger',
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
        return res.render("admin/login", {
            title: "Login",
            kutu_baslik: 'Admin Girişi',
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
        return res.render("admin/login", {
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
    res.redirect('/admin/home');
});

router.get("/home", async function(req, res){
    cookie_control(req, res);
    //console.log("gridi");
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const id = decoded.id;

    //
    res.render('admin/home', {
        title: "Anasayfa",
    })
});

router.get("/logout", function(req, res)
{
    res.clearCookie('token');
    res.redirect("/");
});

module.exports = router;