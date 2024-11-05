const express = require("express");
const router = express.Router();
const path = require("path");

router.use("/admin/profile", function(req, res)
{
    //res.send("profil");
    res.render("admin/profile", {
        title: "Profile"
    });
});

router.get("/login_render", function(req, res)
{
    //token kontrolü
    res.redirect("/admin/login");
});

router.get("/login", function(req, res)
{
    res.render("admin/login", {
        title: "Login",
        kutu_baslik: 'Admin Girişi',
        message: '',
        alert_type: '',
    });
});


module.exports = router;