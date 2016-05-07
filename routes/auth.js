var express = require("express");
var session = require("../session");
var Cookies = require("cookies");
var router = express.Router();
var permcheck = require("../permissionValidator");
var crypto = require("crypto");

router.post("/login", (req, res) => {
    session.login(req, res);
});



router.post("/logout", (req, res) => {
    session.logout(req, res);
});



router.get("/list", (req, res) => {

    // Error out if the user is not logged in
    if (req.session) {
        var display = {
            "err": false,
            "err_desc": false,
            "userdata": req.session,
            "permissions": req.permissions
        };
    } else {
        var display = {
            "err": true,
            "err_desc": "not_logged_in",
            "userdata": false,
            "permissions": false
        };
    }
    res.json(display);
});


router.post("/create", (req, res) => {

    // If the user is logged in, just shut down
    if (req.session) {
        return res.json({
            "err": true,
            "err_desc": "session_active"
        });
    }

    // If we are missing one of theese, just shut down
    if (!req.body.username || !req.body.password) {
        return res.json({
            "err": true,
            "err_desc": "missing_field"
        });
    }

    // Everything looks OK so far, escape the username and
    // look for another user with that name
    var username = req.sqlcon.escape(req.body.username);
    req.sqlcon.query(`SELECT id FROM users WHERE username = ${username}`,
        (err, results, fields) => {
            if (err) {
                throw new Error(`Username check query failed: ${err}`);
            }
            if (results.length > 0) {
                return res.json({
                    "err": true,
                    "err_desc": "username_taken"
                });
            }

            // Username is unique, continue
            var password = req.body.password;
            var email = req.sqlcon.escape(req.body.email || ""); // Optional

            // Generate password hash
            // ****************************************************************
            //          DONT FORGET TO UPDATE IN USERS.JS ASWELL!!!
            // ****************************************************************
            var hash = crypto.createHash("sha256");
            var salt = crypto.randomBytes(128).toString("base64");
            var hashedPassword = hash.update(password + salt).digest("hex");

            password = null; // Remove the cleartext password from memory,
                             // probably placebo

            // Insert into database
            req.sqlcon.query(`
                INSERT INTO
                users (
                    username,
                    password_hash,
                    password_salt,
                    email
                )
                VALUES (
                    ${username},
                    '${hashedPassword}',
                    '${salt}',
                    ${email}
                )
                `,
                (err, results, fields) => {
                    if (err) {
                        throw new Error(`Create user query failed: ${err}`);
                    }

                    if (results.affectedRows == 1) {
                        res.json({
                            "err": false,
                            "err_desc": false
                        });
                    }

            }); // insert query

    }); // username query

}); // router



module.exports = router;
