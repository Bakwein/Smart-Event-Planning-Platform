const express = require("express");
const router = express.Router();
const path = require("path");

const db = require("../data/db");

router.use("/profile", function(req, res)
{
    res.render("users/profile", {
        title: "Profil"
    });
});

router.use("/", function(req, res)
{
    res.render("users/index", {
        title: "Anasayfa"
    });
});

module.exports = router;