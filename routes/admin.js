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



module.exports = router;