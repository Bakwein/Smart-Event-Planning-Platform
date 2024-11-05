const express = require("express");

const app = express();
const dotenv = require('dotenv');
dotenv.config();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));

const path = require("path");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const loginRoutes = require("./routes/login");

app.use("/libs", express.static(path.join(__dirname,"node_modules")));
app.use("/static", express.static(path.join(__dirname,"public")));

app.use("/admin", adminRoutes);
app.use("/user", userRoutes);
app.use(loginRoutes);

require("./createtables")


app.listen(3000, function()
{
    console.log("listening on port 3000");
})