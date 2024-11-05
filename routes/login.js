const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../data/db');

router.get("/", function(req, res){
    //token varsa .... returnli renderlar olacak
    console.log("yo1");
    res.redirect("/user/login_render");
})


module.exports = router;