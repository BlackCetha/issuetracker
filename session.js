var crypto = require("crypto");
var Cookies = require("cookies"); // Wierd naming convention, but why not?

function validateLogin (req, res) {

    var cookies = new Cookies(req, res);

    // Define our error handler
    var handleError = (data) => {

        // If a query errored out, just return 500 INTERNAL
        if (data["err"].startsWith("query_")) {
            throw new Error(data["err"]+" error");
        }

        // Send the error message
        res.json({
            "err": true,
            "err_desc": data["err"],
        });
    }

    // Check if the user is already logged in
    if (req.session) {
        return handleError({
            "err": "session_active",
            "err_detail": "already_logged_in"
        });
    }

    var hash = crypto.createHash("sha256");

    var username = req.sqlcon.escape(req.body.username);
    var password = req.body.password; //PW will be hashed, no need to waste time

    if (!username || !password) { // At least one field empty
        return handleError({
            "err": "invalid_login",
            "err_detail": "missing_fields"
        });
    }

    req.sqlcon.query("SELECT * FROM users WHERE username = " + username,
    (err, results, fields) => {

        if (err) {  // Forward query-errors
            return handleError({
                "err": "query_userdata",
                "err_detail": err
            });
        }

        if (!results || !results[0]) {  // No user found
            return handleError({
                "err": "invalid_login",
                "err_detail": "username_mismatch"
            });
        }

        // If the user is banned return that
        // Checking here means we're not exposing the password
        // of a banned user to bruteforce attacks
        if (results[0]["banned"] == 1) {
            return handleError({
                "err": "banned",
                "err_detail": "banned_user"
            });
        }

        var userdata = results[0]; // Existence is validated, make access easier

        // Take the password input and hash it with the user's salt
        hash.update(password + userdata["password_salt"]);
        var hashedPassInput = hash.digest("hex");

        // If the pw-input and the hash in the DB is not the same
        // dont authenticate
        if (hashedPassInput !== userdata["password_hash"])  {
            return handleError({
                "err": "invalid_login",
                "err_detail": "password_mismatch"
            });
        }

        // User is authenticated at this point, collect some information
        // and create the session
        var user_id = userdata["id"];
        var shared_id = crypto.randomBytes(128).toString("base64");
        var browser = req.sqlcon.escape(req.headers["user-agent"]);
        var langs = req.sqlcon.escape(req.headers["accept-language"]);

        // User is authenticated, create the session in the DB
        req.sqlcon.query(`
            INSERT INTO sessions
            (
                user_id,
                shared_id,
                created,
                browser,
                language
            )
            VALUES
            (
                ${userdata["id"]},
                '${shared_id}',
                CURRENT_TIMESTAMP,
                ${browser},
                ${langs}
            )`,
            (err, results, fields) => {
                if (err) {
                    return handleError({
                        "err": "query_session",
                        "err_detail": err
                    });
                }

                // Send the cookie to the client
                // The wierd number is the milliseconds in a day
                cookies.set("sid", shared_id, {
                    "overwrite": true,
                    "expires":
                    new Date(
                        +new Date() + (
                            86400000*req.settings.session_expire_days
                        )
                    )
                });

                res.json({
                    "err": false,
                    "err_detail": false
                });

        }); // session query

    }); // userdata query

} // function



function sessionMiddleware (req, res, next) {

    var Cookies = require("Cookies");
    var cookies = new Cookies(req, res);

    // Collect information to more reliably identify the user
    var shared_id = req.sqlcon.escape(cookies.get("sid"));
    var browser = req.sqlcon.escape(req.headers["user-agent"]);
    var langs = req.sqlcon.escape(req.headers["accept-language"]);

    // If there is no shared_id there is no session active
    if (!shared_id) {
        return next();
    }

    // Query the DB for a session with the collected information
    req.sqlcon.query(`
        SELECT
            s.id as sid,
            u.id as id,
            u.username,
            u.email,
            u.gravatar_url as avatar,
            u.created,
            u.banned
        FROM
            sessions s
        INNER JOIN
            users u
        ON
            s.user_id = u.id
        WHERE
            s.shared_id = ${shared_id} AND
            s.browser = ${browser} AND
            s.language = ${langs} AND
            (
                DATEDIFF(
                    s.lastuse,
                    NOW()
                ) < ${req.settings.session_expire_days}
            )
        LIMIT 1
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`Userdata query in middleware failed: ${err}`);
        }

        // There is no session with that information
        if (!results || !results[0]) {
            return next();
        }

        // Check if the user is banned
        if (results[0]["banned"] == 1) {
            return next();
        }

        // Session is now authenticated, make userdata easier to access
        userdata = results[0];

        // Update the lastuse timestamp in our DB to keep the session active
        req.sqlcon.query(`
            UPDATE
                sessions
            SET
                lastuse = NOW()
            WHERE
                id = ${userdata.sid}
        `,
        (err, results, fields) => {
            if (err) {
                throw new Error(`Session keepalive query failed: ${err}`);
            }

            // If there is no session with that id, error out
            // This is VERY unlikely, but we'll still handle it
            if (results.affectedRows == 0) {
                throw new Error(`Session use called on nonexistant session!`);
            }

            getUserPermissions(userdata.id, req.sqlcon,
                (permissions, groups) => {
                    // Everything went through, return userdata

                    userdata["groups"] = groups;

                    req.session = userdata;
                    req.permissions = permissions;

                    return next();
            });

        }); // update-query

    }); // userdata-query

} // function

// To log out, simply delete the session from the DB; the cookie will not
// be accepted and simply overwritten on next login
function logout (req, res) {

    // If theres no session theres no need to work
    if (!req.session) {
        res.json({
            "success": true
        });
        return;
    }

    // Delete the session from the DB
    req.sqlcon.query(`DELETE FROM sessions WHERE id = ${req.session.sid}`);

    // Delete session cookie
    var cookies = new Cookies(req, res);
    cookies.set("sid");

    // Return success regardless
    res.json({"success": true});

} // function

// Require login for protected routes MIDDLEWARE
function requireAuth (req, res, next) {
    // If there is no session and the user is NOT trying to
    // log in, deny the request
    if (!req.session &&
        !req.path.startsWith("/auth") &&
        !req.path.startsWith("/debug")) {
        return res.sendStatus(401);
    }
    next();
}

// Poll the users groups and permissions from the DB
function getUserPermissions (id, sqlcon, callback) {

    // First time actually making use of asyncronous queries here
    // Both queries call returnData() but it only executes after
    // cont is true, wich is set after the call so it only
    // returns when the latter query is also done
    var cont = false;
    var rawPermissions = {};
    var groups = {};

    sqlcon.query(`
        SELECT
        p.id, p.string, p.description
        FROM
            users u
        INNER JOIN
            users_groups ug
        ON u.id = ug.user_id
        INNER JOIN
            groups_permissions gp
        ON
            ug.group_id = gp.group_id
        INNER JOIN
            permissions p
        ON
            gp.permission_id = p.id
        WHERE
            u.id = ${id}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`Permission retrieval query failed: ${err}`);
        }

        rawPermissions = results;

        returnData();
        cont = true;
    });

    sqlcon.query(`
        SELECT
            g.id, g.name, g.alias, g.color
        FROM
            users_groups ug
        INNER JOIN
            groups g
        ON
            ug.group_id = g.id
        WHERE
            ug.user_id = ${id}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`Group retrieval query failed: ${err}`);
        }

        groups = results;

        returnData();
        cont = true;
    });

    var returnData = () => {
        if (!cont) return;
        var permissions = {};
        // Loop through the array to set the string as key
        for (var i = 0;i < rawPermissions.length; i++) {
            permissions[rawPermissions[i]["string"]] =
                rawPermissions[i];
        }
        return callback(permissions, groups);
    }
}

// Expose our public functions only
module.exports = {
    "login": validateLogin,
    "middleware": sessionMiddleware,
    "logout": logout,
    "requireAuth": requireAuth
};
