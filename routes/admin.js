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
const moment = require('moment');

const upload = require("../multer");

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

router.get("/create_etkinlik", async function(req, res){
    cookie_control(req, res);

    const [kategoriler, ] = await db.execute("select * from ilgialanlari");

    res.render("admin/create_etkinlik", {
        title: "Etkinlik Oluştur",
        message: '',
        alert_type: '',
        kategoriler: kategoriler
    });
});

router.post("/create_etkinlik", upload.single('etkinlikFoto'), async function(req, res){
    cookie_control(req, res);
    try{
        //console.log(req.body);
        const [kategoriler, ] = await db.execute("select * from ilgialanlari");
        const {etkinlikFoto, etkinlikAdi, tarih, saat, etkinlikSuresi, kategori, aciklama, enlem, boylam} = req.body;

        const etkinlikFotoPath = req.file ? "/static" + req.file.path.split('public')[1] : "/static/images/event.png";

        //kontroller
        if(etkinlikAdi.length > 255 || etkinlikAdi.length <= 0)
        {
            return res.render("admin/create_etkinlik", {
                title: "Etkinlik Oluştur",
                message: 'Etkinlik adı 255 karakterden fazla, 0 ve 0\'dan az olamaz',
                alert_type: 'alert-danger',
                kategoriler: kategoriler
            });
        }
        else if(aciklama.length > 10000 || aciklama.length <= 0)
        {
            return res.render("admin/create_etkinlik", {
                title: "Etkinlik Oluştur",
                message: 'Açıklama 10000 karakterden fazla, 0 ve 0\'dan az olamaz',
                alert_type: 'alert-danger',
                kategoriler: kategoriler
            });
        }
        else if(!kontroller.isValidDate(tarih))
        {
            return res.render("admin/create_etkinlik", {
                title: "Etkinlik Oluştur",
                message: 'Tarih hatalı',
                alert_type: 'alert-danger',
                kategoriler: kategoriler
            });
        }
        else if(!kontroller.isValidTime(saat))
        {
            return res.render("admin/create_etkinlik", {
                title: "Etkinlik Oluştur",
                message: 'Saat hatalı',
                alert_type: 'alert-danger',
                kategoriler: kategoriler
            });
        }
        else if(etkinlikSuresi <= 0)
        {
            return res.render("admin/create_etkinlik", {
                title: "Etkinlik Oluştur",
                message: 'Etkinlik süresi 0 ve 0\'dan az olamaz',
                alert_type: 'alert-danger',
                kategoriler: kategoriler
            });
        }
        else if(kategori === "0")
        {
            return res.render("admin/create_etkinlik", {
                title: "Etkinlik Oluştur",
                message: 'Kategori seçilmelidir',
                alert_type: 'alert-danger',
                kategoriler: kategoriler
            });
        }

        await db.execute("INSERT INTO etkinlikler (etkinlikAdi, aciklama, tarih, saat, etkinlikSuresi, konum, kategori, durum, photoPath, olusturanidkullaniciR) VALUES (?, ?, ?, ?, ?, POINT(?, ?), ?, ?, ?, ?)", [etkinlikAdi, aciklama, tarih, saat, etkinlikSuresi, enlem, boylam, kategori, 0, etkinlikFotoPath, 0]);

        

        res.render("admin/create_etkinlik", {
            title: "Etkinlik Oluştur",
            message: 'Etkinlik başarıyla oluşturuldu',
            alert_type: 'alert-success',
            kategoriler: kategoriler
        });


    }
    catch(err)
    {
        console.log(err);
    }
   
});


router.get("/etkinlik", async function(req, res)
{
    cookie_control(req, res);

    try{
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const id = decoded.id;

        const [onayGereken,] = await db.execute('SELECT * FROM etkinlikler WHERE durum = 0');
        const [etkinlikler,] = await db.execute('SELECT * FROM etkinlikler WHERE durum = 1');
        const [kategori,] = await db.execute('SELECT * FROM ilgialanlari');

        res.render('admin/etkinlik', {
            title: 'Etkinlikler',
            onayGereken: onayGereken,
            etkinlikler: etkinlikler,
            kategori: kategori,
            message: '',
            alert_type: '',
            message2: '',
            alert_type2: ''
        });
    }
    catch(err)
    {
        console.log(err);
    }
});

router.get("/etkinlik/update/:id", async function(req, res){
    cookie_control(req, res);
    const etkinlikID = req.params.id;

    const [etkinlik,] = await db.execute('SELECT * FROM etkinlikler WHERE idetkinlikler = ?', [etkinlikID]);

    const [onayGereken,] = await db.execute('SELECT * FROM etkinlikler WHERE durum = 0');
    const [etkinlikler,] = await db.execute('SELECT * FROM etkinlikler WHERE durum = 1');
    const [kategoriler,] = await db.execute('SELECT * FROM ilgialanlari');

    if(etkinlik.length != 1)
    {
        return res.render("admin/etkinlik", {
            title: 'Etkinlikler',
            onayGereken: onayGereken,
            etkinlikler: etkinlikler,
            kategori: kategori,
            message: '',
            alert_type: 'alert-danger',
            message2: '',
            alert_type2: ''
        });
    }

    const tarih = moment(etkinlik[0].tarih).format('YYYY-MM-DD');

    res.render("admin/update_etkinlik", {
        title: "Etkinlik Düzenle",
        message: '',
        alert_type: '',
        message2: '',
        alert_type2: '',
        photoPath: etkinlik[0].photoPath,
        etkinlikAdi : etkinlik[0].etkinlikAdi,
        tarih: tarih,
        saat: etkinlik[0].saat,
        sure: etkinlik[0].etkinlikSuresi,
        kategorisefa: etkinlik[0].kategori,
        aciklama: etkinlik[0].aciklama,
        konum: etkinlik[0].konum,
        kategoriler: kategoriler
    });
});



router.post("/etkinlik/update/:id", upload.single('etkinlikFoto'), async function(req, res){
    cookie_control(req, res);
    try{
        //console.log(req.body);
        const etkinlikID = req.params.id;
        const [kategoriler, ] = await db.execute("select * from ilgialanlari");
        const [onayGereken,] = await db.execute('SELECT * FROM etkinlikler WHERE durum = 0');
        const [etkinlikler,] = await db.execute('SELECT * FROM etkinlikler WHERE durum = 1');
        const {etkinlikFoto, etkinlikAdi, tarih, saat, etkinlikSuresi, kategori, aciklama, enlem, boylam} = req.body;

        const etkinlikFotoPath = req.file ? "/static" + req.file.path.split('public')[1] : "/static/images/event.png";

        //kontroller
        if(etkinlikAdi.length > 255 || etkinlikAdi.length <= 0)
        {
            return res.render("admin/etkinlik", {
                title: 'Etkinlikler',
                onayGereken: onayGereken,
                etkinlikler: etkinlikler,
                kategori: kategori,
                message: 'Etkinlik adı 255 karakterden fazla, 0 ve 0\'dan az olamaz',
                alert_type: 'alert-danger',
                message2: 'Etkinlik adı 255 karakterden fazla, 0 ve 0\'dan az olamaz',
                alert_type2: 'alert-danger'

            });
        }
        else if(aciklama.length > 10000 || aciklama.length <= 0)
        {
            return res.render("admin/etkinlik", {
                title: 'Etkinlikler',
                onayGereken: onayGereken,
                etkinlikler: etkinlikler,
                kategori: kategori,
                message: 'Açıklama 10000 karakterden fazla, 0 ve 0\'dan az olamaz',
                alert_type: 'alert-danger',
                message2: '',
                alert_type2: 'alert-danger'
            });
        }
        else if(!kontroller.isValidDate(tarih))
        {
            return res.render("admin/etkinlik", {
                title: 'Etkinlikler',
                onayGereken: onayGereken,
                etkinlikler: etkinlikler,
                kategori: kategori,
                message: 'Tarih hatalı',
                alert_type: 'alert-danger',
                message2: '',
                alert_type2: 'alert-danger'
            });
        }
        else if(!kontroller.isValidTime(saat))
        {
            return res.render("admin/etkinlik", {
                title: 'Etkinlikler',
                onayGereken: onayGereken,
                etkinlikler: etkinlikler,
                kategori: kategori,
                message: 'Saat hatalı',
                alert_type: 'alert-danger',
                message2: '',
                alert_type2: 'alert-danger'
            });
        }
        else if(etkinlikSuresi <= 0)
        {
            return res.render("admin/etkinlik", {
                title: 'Etkinlikler',
                onayGereken: onayGereken,
                etkinlikler: etkinlikler,
                kategori: kategori,
                message: 'Etkinlik süresi 0 ve 0\'dan az olamaz',
                alert_type: 'alert-danger',
                message2: '',
                alert_type2: 'alert-danger'
            });
        }
        else if(kategori === "0")
        {
            return res.render("admin/etkinlik", {
                title: 'Etkinlikler',
                onayGereken: onayGereken,
                etkinlikler: etkinlikler,
                kategori: kategori,
                message: 'Kategori seçilmelidir',
                alert_type: 'alert-danger',
                message2: '',
                alert_type2: 'alert-danger'
            });
        }



        console.log(etkinlikFotoPath);

        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const id = decoded.id;

        await db.execute("UPDATE etkinlikler SET etkinlikAdi = ?, aciklama = ?, tarih = ?, saat = ?, etkinlikSuresi = ?, konum = POINT(?, ?), kategori = ?, photoPath = ? WHERE idetkinlikler = ?", [etkinlikAdi, aciklama, tarih, saat, etkinlikSuresi, enlem, boylam, kategori, etkinlikFotoPath, etkinlikID]);

        const [kategoriler2, ] = await db.execute("select * from ilgialanlari");
        const [onayGereken2,] = await db.execute('SELECT * FROM etkinlikler WHERE durum = 0');
        const [etkinlikler2,] = await db.execute('SELECT * FROM etkinlikler WHERE durum = 1');

        res.render("admin/etkinlik", {
            title: 'Etkinlikler',
            onayGereken: onayGereken2,
            etkinlikler: etkinlikler2,
            kategori: kategoriler2,
            message: 'Etkinlik başarıyla düzenlendi',
            alert_type: 'alert-success',
            message2: '',
            alert_type2: 'alert-success'
        });


    }
    catch(err)
    {
        console.log(err);
    }
   
});

router.get('/user_profile/:profileid', async function(req, res)
{
    try{
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const id = decoded.id;
        const profileid = req.params.profileid;
        console.log(profileid);
        const [results,] = await db.execute("SELECT * FROM kullanıcılar where idkullanıcılar = ?", [profileid]); 
        const [puan,] = await db.execute("SELECT * FROM puan WHERE idkullaniciR = ?", [profileid]);

        if(results.length === 0)
        {
            res.redirect("/admin/etkinlik");
        }
        else
        {
            const tarih = moment(results[0].dogumTarihi).format('YYYY-MM-DD');
            res.render("admin/user_profile", {
                title: "Profil",
                idkullanıcılar: results[0].idkullanıcılar,
                KullanıcıAdı: results[0].KullanıcıAdı,
                sifre: results[0].sifre,
                email: results[0].email,
                cinsiyet: results[0].cinsiyet,
                konum: results[0].konum,
                isim: results[0].isim,
                puan: puan[0],
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

router.get('/etkinlik/approve/:id', async function(req, res){
    cookie_control(req, res);
    try{
        const etkinlikID = req.params.id;

        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const id = decoded.id;

        const [onayGereken,] = await db.execute('SELECT * FROM etkinlikler WHERE durum = 0');
        const [etkinlikler,] = await db.execute('SELECT * FROM etkinlikler WHERE durum = 1');
        const [kategori,] = await db.execute('SELECT * FROM ilgialanlari');
        
        const [kontrol,] = await db.execute('SELECT * FROM etkinlikler WHERE durum = 1 AND idetkinlikler = ?', [etkinlikID]);
        if(kontrol.length > 0)
        {
            res.render('admin/etkinlik', {
                title: 'Etkinlikler',
                onayGereken: onayGereken,
                etkinlikler: etkinlikler,
                kategori: kategori,
                message: 'Bu etkinlik zaten onaylı',
                alert_type: 'alert-danger',
                message2: '',
                alert_type2: 'alert-danger'
            });
        }

        await db.execute('UPDATE etkinlikler SET durum = ? WHERE idetkinlikler = ?', [1, etkinlikID]);
        //const [kontrol2,] = await db.execute('SELECT * FROM etkinlikler WHERE durum = 1 AND idetkinlikler = ?', [etkinlikID]);
        //await db.execute('INSERT INTO katilimcilar(idkullaniciR, idetkinlikR) VALUES (?,?)', [kontrol2[0].olusturanidkullaniciR, etkinlikID]);

        const [onayGereken2,] = await db.execute('SELECT * FROM etkinlikler WHERE durum = 0');
        const [etkinlikler2,] = await db.execute('SELECT * FROM etkinlikler WHERE durum = 1');
        const [kategori2,] = await db.execute('SELECT * FROM ilgialanlari');

        res.render('admin/etkinlik', {
            title: 'Etkinlikler',
            onayGereken: onayGereken2,
            etkinlikler: etkinlikler2,
            kategori: kategori2,
            message: '',
            alert_type: '',
            message2: '',
            alert_type2: ''
        });
    }
    catch(err)
    {
        console.log(err);
    }
});

router.get('/etkinlik/delete/:id', async function(req, res){
    cookie_control(req, res);
    try{
        const etkinlikID = req.params.id;

        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const id = decoded.id;

        const [kontrol,] = await db.execute("SELECT * FROM etkinlikler WHERE idetkinlikler = ?", [etkinlikID]);
        if(kontrol.length === 0)
        {
            return res.redirect('/admin/etkinlik');
        }

        await db.execute("DELETE FROM etkinlikler WHERE idetkinlikler = ?", [etkinlikID]);

        res.redirect("/admin/etkinlik")
    }
    catch(err)
    {
        console.log(err);
    }
});

router.get("/katilimci/delete/:id", async function(req, res){
    cookie_control(req, res);
    try{
        const katilimciid = req.params.id;

        const [katilimcilar,] = await db.execute("SELECT * FROM katilimcilar WHERE idkatilimcilar = ?", [katilimciid]);
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const id = decoded.id;

        const [katilimci,] = await db.execute("SELECT katilimcilar.idkatilimcilar, katilimcilar.idetkinlikR, katilimcilar.idkullaniciR, kullanıcılar.KullanıcıAdı FROM katilimcilar INNER JOIN kullanıcılar ON katilimcilar.idkullaniciR = kullanıcılar.idkullanıcılar WHERE katilimcilar.idetkinlikR = ?", [katilimcilar[0].idetkinlikR]);
        const [kategoriler,] = await db.execute("SELECT * FROM ilgialanlari");
        const [kontrol,] = await db.execute("SELECT * FROM etkinlikler WHERE idetkinlikler = ?", [katilimcilar[0].idetkinlikR]);
        const [kurucu,] = await db.execute("SELECT * FROM kullanıcılar WHERE idkullanıcılar = ?", [kontrol[0].olusturanidkullaniciR]);
        const [mesajlar,] = await db.execute("SELECT * FROM mesajlar WHERE idetkinlikR = ? ORDER BY tarih ASC", [katilimcilar[0].idetkinlikR]);

        if(kontrol.length === 0)
        {
            return res.redirect('/admin/etkinlik');
        }
    
        const [kullanicilar,] = await db.execute("SELECT * FROM kullanıcılar");
        const tarih = moment(kontrol[0].tarih).format('YYYY-MM-DD');

        if(katilimcilar.length == 0)
        {
            return res.render('admin/etkinlik_detay', {
                title: 'Etkinlik Sayfasi',
                etkinlik: kontrol[0],
                kategoriler: kategoriler,
                kurucu: kurucu[0],
                tarih: tarih,
                mesajlar: mesajlar,
                kullanıcılar: kullanicilar,
                katilimci: katilimci,
                message: '',
                alert_type: '',
                message2: '',
                alert_type2: '',
                message3: 'Katılımcı bulunamadı.',
                alert_type3: 'alert-danger',
            })
        }

        await db.execute("DELETE FROM katilimcilar WHERE idkatilimcilar = ?", [katilimciid])

        res.redirect(`/admin/etkinlik/${katilimcilar[0].idetkinlikR}#katilimciShow`);

    }
    catch(err){
        console.log(err);
    }
});

router.get('/etkinlik/:id', async function(req, res){
    cookie_control(req, res);
    try{
        const etkinlikID = req.params.id;
    
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const id = decoded.id;

        const [kategoriler,] = await db.execute("SELECT * FROM ilgialanlari");
        const [kontrol,] = await db.execute("SELECT * FROM etkinlikler WHERE idetkinlikler = ?", [etkinlikID]);

        const [kurucu,] = await db.execute("SELECT * FROM kullanıcılar WHERE idkullanıcılar = ?", [kontrol[0].olusturanidkullaniciR]);
        const [mesajlar,] = await db.execute("SELECT * FROM mesajlar WHERE idetkinlikR = ? ORDER BY tarih ASC", [etkinlikID]);
        const [katilimci,] = await db.execute("SELECT katilimcilar.idkatilimcilar, katilimcilar.idkullaniciR, kullanıcılar.KullanıcıAdı FROM katilimcilar INNER JOIN kullanıcılar ON katilimcilar.idkullaniciR = kullanıcılar.idkullanıcılar WHERE katilimcilar.idetkinlikR = ?", [etkinlikID]);

        if(kontrol.length === 0)
        {
            return res.redirect('/admin/etkinlik');
        }

        const [kullanicilar,] = await db.execute("SELECT * FROM kullanıcılar");
        const tarih = moment(kontrol[0].tarih).format('YYYY-MM-DD');
        
        res.render('admin/etkinlik_detay', {
            title: 'Etkinlik Sayfasi',
            etkinlik: kontrol[0],
            kategoriler: kategoriler,
            kurucu: kurucu[0],
            tarih: tarih,
            mesajlar: mesajlar,
            kullanıcılar: kullanicilar,
            katilimci: katilimci,
            message: '',
            alert_type: '',
            message2: '',
            alert_type2: '',
            message3: '',
            alert_type3: ''
        })
    }
    catch(err)
    {
        console.log(err);
    }
});

router.post("/send-message", async function(req, res)
{
    cookie_control(req, res);
    console.log(req.body);

    const {mesaj,eventId} = req.body;
    const [kategoriler,] = await db.execute("SELECT * FROM ilgialanlari");
    const [kontrol,] = await db.execute("SELECT * FROM etkinlikler WHERE idetkinlikler = ?", [eventId]);
    const [kurucu,] = await db.execute("SELECT * FROM kullanıcılar WHERE idkullanıcılar = ?", [kontrol[0].olusturanidkullaniciR]);
    const [mesajlar,] = await db.execute("SELECT * FROM mesajlar WHERE idetkinlikR = ? ORDER BY tarih ASC", [eventId]);
    const [kullanicilar,] = await db.execute("SELECT * FROM kullanıcılar");

    if(mesaj.length == 0)
    {
        return res.render('admin/etkinlik_detay', {
            title: 'Etkinlik Sayfasi',
            etkinlik: kontrol[0],
            kategoriler: kategoriler,
            kurucu: kurucu[0],
            tarih: tarih,
            mesajlar: mesajlar,
            kullanıcılar: kullanicilar, 
            message: '',
            alert_type: '',
            message2: 'Boş mesaj gönderemezsiniz',
            alert_type2: 'alert-danger',
            message3: '',
            alert_type3: ''
        })
    }
    else if(kontrol.length == 0)
    {
        return res.redirect('admin/etkinlik');
    }

    await db.execute("INSERT INTO mesajlar(idgonderen, idetkinlikR, mesaj, tarih) VALUES(?,?,?,?)", [0, eventId, mesaj, moment().format('YYYY-MM-DD HH:mm:ss')]);

    return res.redirect(`/admin/etkinlik/${eventId}#messageShow`);
    
});

router.get("/interests", async function(req, res)
{
    cookie_control(req, res);

    try{
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const id = decoded.id;

        const [ilgiler,] = await db.execute('SELECT * FROM ilgialanlari');
        const [kullanicilar,] = await db.execute('SELECT * FROM kullanıcılar');
        const [iliskiler,] = await db.execute('SELECT ki.idkullanici_ilgileri, k.KullanıcıAdı, ia.ilgiAlani FROM kullanici_ilgileri AS ki JOIN kullanıcılar AS k ON ki.idkullaniciR = k.idkullanıcılar JOIN ilgialanlari AS ia ON ki.idilgiR = ia.idilgiAlanlari');

        res.render('admin/interests', {
            title: 'İlgiler',
            kullanicilar: kullanicilar,
            ilgiler: ilgiler,
            iliskiler: iliskiler,
            message: '',
            alert_type: ''
        });
    }
    catch(err)
    {
        console.log(err);
    }
});

router.get('/interests/interest/delete/:id', async function(req, res){
    cookie_control(req, res);
    try{
        const idilgi = req.params.id;
        const [iliskiler,] = await db.execute("SELECT * FROM ilgialanlari WHERE idilgiAlanlari = ?", [idilgi]);
        if(iliskiler.length === 0)
        {
            return res.redirect('/admin/interests');
        }

        await db.execute("DELETE FROM ilgialanlari WHERE idilgiAlanlari = ?", [idilgi]);

        res.redirect('/admin/interests');
    }
    catch(err)
    {
        console.log(err);
    }
});

router.post('/interests/interest/add', async function(req, res){
    cookie_control(req, res);
    try{
        const ilgiYeni = req.body.ilgiAlaniYeni;

        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const id = decoded.id;

        const [ilgiler,] = await db.execute('SELECT * FROM ilgialanlari');
        const [kullanicilar,] = await db.execute('SELECT * FROM kullanıcılar');
        const [ilgiAd,] = await db.execute('SELECT * FROM ilgialanlari WHERE ilgiAlani = ?', [ilgiYeni]);
        const [iliskiler,] = await db.execute('SELECT ki.idkullanici_ilgileri, k.KullanıcıAdı, ia.ilgiAlani FROM kullanici_ilgileri AS ki JOIN kullanıcılar AS k ON ki.idkullaniciR = k.idkullanıcılar JOIN ilgialanlari AS ia ON ki.idilgiR = ia.idilgiAlanlari');

        if(ilgiYeni.length <= 0 || ilgiYeni.length > 255)
        {
            return res.render('admin/interests', {
                title: 'İlgiler',
                kullanicilar: kullanicilar,
                ilgiler: ilgiler,
                iliskiler: iliskiler,
                message: 'İlgi Alanı 255 karakterden fazla, 0 ve 0\'dan az olamaz',
                alert_type: 'alert-danger'
            });
        }
        else if(ilgiAd.length > 0)
        {
            if(ilgiAd[0].ilgiAlani.trim().toLowerCase() == ilgiYeni.trim().toLowerCase())
            {
                return res.render('admin/interests', {
                    title: 'İlgiler',
                    kullanicilar: kullanicilar,
                    ilgiler: ilgiler,
                    iliskiler: iliskiler,
                    message: 'Bu ilgi alanı zaten var',
                    alert_type: 'alert-danger'
                });
            }
        }

        await db.execute('INSERT INTO ilgialanlari(ilgiAlani) VALUES (?)', [ilgiYeni]);
        const [ilgiler2,] = await db.execute('SELECT * FROM ilgialanlari');
        const [kullanicilar2,] = await db.execute('SELECT * FROM kullanıcılar');

        const [iliskiler2,] = await db.execute('SELECT ki.idkullanici_ilgileri, k.KullanıcıAdı, ia.ilgiAlani FROM kullanici_ilgileri AS ki JOIN kullanıcılar AS k ON ki.idkullaniciR = k.idkullanıcılar JOIN ilgialanlari AS ia ON ki.idilgiR = ia.idilgiAlanlari');
        return res.render('admin/interests', {
            title: 'İlgiler',
            kullanicilar: kullanicilar2,
            ilgiler: ilgiler2,
            iliskiler: iliskiler2,
            message: 'Bilgiler Güncellendi',
            alert_type: 'alert-success'
        });
    }
    catch(err)
    {
        console.log(err);
    }
});

router.post('/interests/connection/add', async function(req, res){
    cookie_control(req, res);
    try{
        const kullaniciID = req.body.selectedKullanici;
        const ilgiID = req.body.selectedIlgi;

        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const id = decoded.id;

        const [kullanicilar,] = await db.execute('SELECT * FROM kullanıcılar');
        const [ilgiler,] = await db.execute('SELECT * FROM ilgialanlari');
        const [iliski,] = await db.execute("SELECT * FROM kullanici_ilgileri WHERE idkullaniciR = ? AND idilgiR = ?", [kullaniciID, ilgiID]);
        const [iliskiler,] = await db.execute('SELECT ki.idkullanici_ilgileri, k.KullanıcıAdı, ia.ilgiAlani FROM kullanici_ilgileri AS ki JOIN kullanıcılar AS k ON ki.idkullaniciR = k.idkullanıcılar JOIN ilgialanlari AS ia ON ki.idilgiR = ia.idilgiAlanlari');

        if(iliski.length > 0)
        {
            if(iliski[0].idkullaniciR == kullaniciID && iliski[0].idilgiR == ilgiID)
            {
                return res.render('admin/interests', {
                    title: 'İlgiler',
                    kullanicilar: kullanicilar,
                    ilgiler: ilgiler,
                    iliskiler: iliskiler,
                    message: 'Bu ilişki zaten var',
                    alert_type: 'alert-danger'
                });
            }
        }

        await db.execute('INSERT INTO kullanici_ilgileri(idkullaniciR, idilgiR) VALUES (?,?)', [kullaniciID, ilgiID]);
        const [ilgiler2,] = await db.execute('SELECT * FROM ilgialanlari');
        const [kullanicilar2,] = await db.execute('SELECT * FROM kullanıcılar');

        const [iliskiler2,] = await db.execute('SELECT ki.idkullanici_ilgileri, k.KullanıcıAdı, ia.ilgiAlani FROM kullanici_ilgileri AS ki JOIN kullanıcılar AS k ON ki.idkullaniciR = k.idkullanıcılar JOIN ilgialanlari AS ia ON ki.idilgiR = ia.idilgiAlanlari');
        return res.render('admin/interests', {
            title: 'İlgiler',
            kullanicilar: kullanicilar2,
            ilgiler: ilgiler2,
            iliskiler: iliskiler2,
            message: 'Bilgiler Güncellendi',
            alert_type: 'alert-success'
        });
    }
    catch(err)
    {
        console.log(err);
    }
});

router.get('/interests/connection/delete/:id', async function(req, res){
    cookie_control(req, res);
    try{
        const idiliski = req.params.id;
        const [iliskiler,] = await db.execute("SELECT * FROM kullanici_ilgileri WHERE idkullanici_ilgileri = ?", [idiliski]);
        if(iliskiler.length === 0)
        {
            return res.redirect('/admin/interests');
        }

        await db.execute("DELETE FROM kullanici_ilgileri WHERE idkullanici_ilgileri = ?", [idiliski]);

        res.redirect('/admin/interests');
    }
    catch(err)
    {
        console.log(err);
    }
});


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
    cookie_control(req, res);
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
    cookie_control(req, res);
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
    cookie_control(req, res);
    try{
        const idkullanıcılar = req.params.id;
        const[kullanici,] = await db.execute("SELECT * FROM kullanıcılar WHERE idkullanıcılar = ?", [idkullanıcılar]);
        if(kullanici.length === 0)
        {
            return res.redirect('/admin/users');
        }

        const tarih = moment(kullanici[0].dogumTarihi).format('YYYY-MM-DD');

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
    cookie_control(req, res);
    try{
        const {idkullanıcılar,KullanıcıAdı, sifre, email, cinsiyet, enlem, boylam, isim, soyisim, dogumTarihi, telefon} = req.body;

        const updatePassword = req.body.updatePassword === 'on';

        //kullanıcı kontrol ev photopath alma
        const [user_control,] = await db.execute("select * from kullanıcılar where idkullanıcılar = ?", [idkullanıcılar]);
        if(user_control === 0)
        {
            return res.redirect("/user/logout");
        }

        const photoPath = user_control[0].photoPath;
        let hashedPassword = user_control[0].sifre;
        const konum = user_control[0].konum;

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
            else if(!enlem || enlem ===  "" || enlem === undefined || boylam === "" || boylam === undefined) 
            {
                    return res.render("user/register", {
                    title: "Kullanıcı Kayıt",
                    kutu_baslik: 'Kullanıcı Kayıt',
                    message: 'Konum bilgisi eksik',
                    alert_type: 'alert-danger',
                    kategoriler: kategoriler
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

            if (updatePassword) {
                const sifre = req.body.sifre;
            
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

            
    
            hashedPassword = await bcrypt.hash(sifre, 10);
        }
    
            await db.execute('UPDATE kullanıcılar SET KullanıcıAdı = ?, sifre = ?, email = ?, cinsiyet = ?, konum = ST_PointFromText(?), isim = ?, soyisim = ?, dogumTarihi = ?, telefon = ?, photoPath = ? WHERE idkullanıcılar = ?', [KullanıcıAdı, hashedPassword, email, cinsiyet, `POINT(${enlem} ${boylam})`, isim, soyisim, dogumTarihi, telefon, photoPath, idkullanıcılar]);
            
    
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
                alert_type: 'alert-success'
            });
    }
    catch(err)
    {
        console.log(err);
    }
});

router.get("/profile", async function(req, res)
{
    try{
        cookie_control(req, res);
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const id = decoded.id;
        
        const [admin,] = await db.execute("SELECT * FROM admin WHERE idadmin = ?", [id]);
        
        if(admin.length == 0)
        {
            res.redirect("/admin/logout");
        }

        res.render("admin/profile", {
            title: "Profile",
            admin: admin[0],
            message: '',
            alert_type: ''
        });
    }
    catch(err)
    {
        console.log(err);
    }
    
});

router.get("/admin_update", async function(req, res){
    try{
        cookie_control(req, res);
        const token = req.cookies.token;
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const id = decoded.id;
        
        const [admin,] = await db.execute("SELECT * FROM admin WHERE idadmin = ?", [id]);
        
        if(admin.length == 0)
        {
            res.redirect("/admin/logout");
        }

        res.render("admin/admin_update", {
            title: "Profile",
            admin: admin[0],
            message: '',
            alert_type: ''
        });
    }
    catch(err)
    {
        console.log(err);
    }
});

router.post('/admin_update', async function(req, res) {
    cookie_control(req, res);
    try {
        const { idadmin, kullaniciAdi } = req.body;

        // Checkbox durumu
        const updatePassword = req.body.updatePassword === 'on'; // Checkbox seçiliyse "on" döner
        console.log(idadmin);
        const [admin_control, ] = await db.execute("select * from admin where idadmin = ?", [idadmin]);
        if (admin_control.length === 0) {
            return res.redirect("/admin/logout");
        }

        let hashedPassword = admin_control[0].sifre; // Varsayılan olarak eski şifreyi kullan
        if (updatePassword) {
            const sifre = req.body.sifre;

            hashedPassword = await bcrypt.hash(sifre, 10);
        }

        await db.execute(
            'UPDATE admin SET kullaniciAdi = ?, sifre = ? WHERE idadmin = ?',
            [kullaniciAdi, hashedPassword, idadmin]
        );

        const [admin, ] = await db.execute("select * from admin where idadmin = ?", [idadmin]);
        return res.render('admin/admin_update', {
            title: "Profil Güncelleme",
            admin: admin[0],
            message: 'Bilgiler Güncellendi',
            alert_type: 'alert-success'
        });
    } catch (err) {
        console.log(err);
    }
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

function toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
  }

router.get("/home", async function(req, res){
    cookie_control(req, res);
    //console.log("gridi");
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const id = decoded.id;

    const [etkinlikler,] = await db.execute("select * from etkinlikler");

    let tum_etkinlikler = [];

    for(let i = 0; i < etkinlikler.length; i++)
    {

        //{}'li şekilde tüm etkinliklere isim kordinat ve id ekle
        let etkinlik = {
            id: etkinlikler[i].idetkinlikler,
            isim: toTitleCase(etkinlikler[i].etkinlikAdi),
            konum: etkinlikler[i].konum,
            tarih: moment(etkinlikler[i].tarih).format('YYYY-MM-DD'),
            saat: etkinlikler[i].saat.split(":")[0] + ":" + etkinlikler[i].saat.split(":")[1],
        }
        tum_etkinlikler.push(etkinlik);
    }

    //
    res.render('admin/home', {
        title: "Anasayfa",
        tum_etkinlikler: tum_etkinlikler,
    })
});

router.get("/logout", function(req, res)
{
    res.clearCookie('token');
    res.redirect("/");
});

module.exports = router;