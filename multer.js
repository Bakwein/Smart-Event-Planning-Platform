const path = require("path");

const multer = require('multer');
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, path.join(__dirname, 'public', 'images')); // dosyanın nereye kaydedileceği
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // dosya adı benzersiz
    }
});

const upload = multer({storage: storage});

module.exports = upload;