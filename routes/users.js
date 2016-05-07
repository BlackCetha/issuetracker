var express = require("express");
var router = express.Router();
var permissionValidator = require("../permissionValidator");
var permcheck = permissionValidator.permCheck;
var noPermission = permissionValidator.noPermission;

// /users is a teapot, we're not going to publish usernames like this
router.get("/", (req, res) => {
    res.sendStatus(418);
});



// get info for a specific user
router.get("/:id", (req, res) => {

    if (!isFinite(req.params.id)) {
        return res.json({
            "err": true,
            "err_desc": "invalid_id"
        });
    }

    if (!permcheck(req, res, ["user_detail"])) {
        return noPermission(req, res);
    }

    var id = req.params.id;

    req.sqlcon.query(`
        SELECT
            id,
            username,
            gravatar_url,
            created,
            banned,
            (
                SELECT COUNT(*)
                FROM reports
                WHERE creator = ${id}
            ) as reports_created,
            (
                SELECT COUNT(*)
                FROM users_groups
                WHERE user_id = ${id}
            ) as groups_count
        FROM users
        WHERE id = ${id}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`User info retrieval query failed: ${err}`);
        }

        res.json({
            "err": false,
            "err_desc": false,
            "data": results[0]
        });

    }); // query

}); // router



// get reports by user :id
router.get("/:id/reports", (req, res) => {

    if (!isFinite(req.params.id)) {
        return res.json({
            "err": true,
            "err_desc": "invalid_id"
        });
    }

    if (!permcheck(req, res, ["user_reports"])) {
        return noPermission(req, res);
    }

    var id = req.params.id;

    req.sqlcon.query(`
        SELECT
            id,
            title,
            created,
            status
        FROM reports
        WHERE creator = ${id}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`User report retrieval query failed: ${err}`);
        }

        res.json({
            "err": false,
            "err_desc": false,
            "data": results
        });

    }); // query

}); // router



// get groups by user :id
router.get("/:id/groups", (req, res) => {

    if (!isFinite(req.params.id)) {
        return res.json({
            "err": true,
            "err_desc": "invalid_id"
        });
    }

    if (!permcheck(req, res, ["user_groups"])) {
        return noPermission(req, res);
    }

    var id = req.params.id;

    req.sqlcon.query(`
        SELECT
            g.id,
            g.name,
            g.alias,
            g.color
        FROM users_groups ug
        LEFT JOIN groups g
        ON g.id = ug.group_id
        WHERE ug.user_id = ${id}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`User report retrieval query failed: ${err}`);
        }

        res.json({
            "err": false,
            "err_desc": false,
            "data": results
        });

    }); // query

}); // router



// add user :id to a group
router.post("/:id/addgroup", (req, res) => {

    if (!isFinite(req.params.id)) {
        return res.json({
            "err": true,
            "err_desc": "invalid_id"
        });
    }

    if (!isFinite(req.body.group)) {
        return res.json({
            "err": true,
            "err_desc": "missing_fields"
        });
    }

    var user = req.params.id;
    var group = req.body.group;

    // if the user lacks the general permission OR the group permission, check
    // if he has the absolute permission, if not dont let him through
    if (!permcheck(req, res, ["user_add_group", "user_add_group_ID_"+group]) &&
        !permcheck(req, res, ["user_add_group_master"])) {
        return noPermission(req, res);
    }

    req.sqlcon.query(`
        INSERT INTO
        users_groups (
            user_id,
            group_id
        ) VALUES (
            ${user},
            ${group}
        )
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`User group join query failed: ${err}`);
        }

        res.json({
            "err": false,
            "err_desc": false
        });

    }); // query

}); // router



// remove user :id from a group
router.post("/:id/rmgroup", (req, res) => {

    if (!isFinite(req.params.id)) {
        return res.json({
            "err": true,
            "err_desc": "invalid_id"
        });
    }

    if (!isFinite(req.body.group)) {
        return res.json({
            "err": true,
            "err_desc": "missing_fields"
        });
    }

    var user = req.params.id;
    var group = req.body.group;

    // if the user lacks the general permission OR the group permission, check
    // if he has the absolute permission, if not dont let him through
    if (!permcheck(req, res, ["user_rm_group", "user_rm_group_ID_"+group]) &&
        !permcheck(req, res, ["user_rm_group_master"])) {
        return noPermission(req, res);
    }

    req.sqlcon.query(`
        DELETE FROM users_groups
        WHERE
            user_id = ${user}
            AND
            group_id = ${group}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`User group removal query failed: ${err}`);
        }

        res.json({
            "err": false,
            "err_desc": false
        });

    }); // query

}); // router



// edit profile of user :id
router.patch("/:id", (req, res) => {

    // If the user does not have the general permission to edit profiles,
    // check if its their own profile and they have permission to edit it
    if (!permcheck(req, res, ["user_edit"]) && (
        req.params.id !== req.session.id &&
        !permcheck(req, res, ["user_edit_own"])
    )) {
        return noPermission(req, res);
    }

    if (!isFinite(req.params.id)) {
        return res.json({
            "err": true,
            "err_desc": "invalid_id"
        });
    }

    if (!req.body.email) {
        return res.json({
            "err": true,
            "err_desc": "missing_fields"
        });
    }

    var email = req.sqlcon.escape(req.body.email);

    req.sqlcon.query(`
        UPDATE users
        SET email = ${email}
        WHERE id = ${req.params.id}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`User edit query failed: ${err}`);
        }

        if (results.affectedRows !== 1) {
            res.json({
                "err": true,
                "err_desc": "invalid_id"
            });
        } else {
            res.json({
                "err": false,
                "err_desc": false
            });
        }

    }); // query

}); // router



// set a new password for user :id
router.patch("/:id/newpass", (req, res) => {

    // If the user does not have the general permission to edit passwords,
    // check if its their own and they have permission to edit it
    if (!permcheck(req, res, ["user_password"]) &&
        req.params.id !== req.session.id) {
            return noPermission(req, res);
    }
    if (req.params.id !== req.session.id &&
        !permcheck(req, res, ["user_password_own"])) {
            return noPermission(req, res);
    }

    if (!isFinite(req.params.id)) {
        return res.json({
            "err": true,
            "err_desc": "invalid_id"
        });
    }

    var id = req.params.id;

    if (!req.body.password) {
        return res.json({
            "err": true,
            "err_desc": "missing_fields"
        });
    }

    var password = req.body.password;
    var crypto = require("crypto");
    var hash = crypto.createHash("sha256");
    var salt = crypto.randomBytes(128).toString("base64");
    var hashedPassword = hash.update(password + salt).digest("hex");
    password = null;

    req.sqlcon.query(`
        UPDATE users
        SET
            password_hash = '${hashedPassword}',
            password_salt = '${salt}'
        WHERE id = ${id}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`Password change query failed: ${err}`);
        }

        if (results.affectedRows !== 1) {
            res.json({
                "err": true,
                "err_desc": "invalid_id"
            });
        } else {
            res.json({
                "err": false,
                "err_desc": false
            });

            // Log out because of password change
            req.sqlcon.query(`
                DELETE FROM sessions
                WHERE user_id = ${id}
            `);
        }

    }); // query

}); // router

module.exports = router;
