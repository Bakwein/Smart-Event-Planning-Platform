const express = require("express");
const router = express.Router();
const path = require("path");
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
                return res.redirect("/admin/logout");
            }
        })
    }
}

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