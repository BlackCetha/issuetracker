var express = require("express");
var router = express.Router();
var permissionValidator = require("../permissionValidator");
var permcheck = permissionValidator.permCheck;
var noPermission = permissionValidator.noPermission;

// List all groups
router.get("/", (req, res) => {

    // Groups are always public, no need to check for permissions

    req.sqlcon.query(`
        SELECT *
        FROM groups
    `,
    (err, results) => {
        if (err) {
            throw new Error(`Group retrieval query failed: ${err}`);
        }

        res.json({
            "err": false,
            "err_desc": false,
            "data": results
        });

    }); // query

}); // router



// get detailed info for group ID
router.get("/:id", (req, res) => {

    // Groups are always public, no need to check for permissions

    if (!isFinite(req.params.id)) {
        return res.json({
            "err": true,
            "err_desc": "invalid_id",
            "data": false
        });
    }

    var id = req.params.id;

    req.sqlcon.query(`
        SELECT *
        FROM groups
        WHERE id = ${id}
    `,
    (err, results) => {
        if (err) {
            throw new Error(`Group detail retrieval query failed: ${err}`);
        }

        res.json({
            "err": false,
            "err_desc": false,
            "data": results[0]
        });

    }); // query

}); // router



// create group
router.post("/", (req, res) => {

    if (!permcheck(req, res, ["group_create"])) {
        return noPermission(req, res);
    }

    // If theese are not given, error out
    if (!req.body.name || !req.body.alias) {
        return res.json({
            "err": true,
            "err_desc": "missing_fields",
            "groupId": false
        });
    }

    // If there is a color given, validate that it is valid HEX form
    if (req.body.color &&
        !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(req.body.color)) {
        req.body.color = "#333333";
    }

    var name = req.sqlcon.escape(req.body.name);
    var alias = req.sqlcon.escape(req.body.alias);
    var color = req.sqlcon.escape(req.body.color || "#000000");

    req.sqlcon.query(`
        INSERT INTO groups (
            name,
            alias,
            color
        ) VALUES (
            ${name},
            ${alias},
            ${color}
        )
    `,
    (err, results) => {
        if (err) {
            throw new Error(`Group creation query failed: ${err}`);
        }

        res.json({
            "err": false,
            "err_desc": false,
            "groupId": results.insertId
        })

    }); // query

}); // router



// edit a group
router.patch("/:id", (req, res) => {

    if (!permcheck(req, res, ["group_edit"])) {
        return noPermission(req, res);
    }

    // Nothing to change given or invalid id
    if (!req.body.name && !req.body.alias && !req.body.color ||
            !isFinite(req.params.id)) {
        return res.json({
            "err": true,
            "err_desc": "missing_fields"
        });
    }

    var sql = "UPDATE groups SET ";

    if (req.body.name) {
        var name = req.sqlcon.escape(req.body.name);

        sql += `name = ${name},`;
    }
    if (req.body.alias) {
        var alias = req.sqlcon.escape(req.body.alias);

        sql += `alias = ${alias},`;
    }
    // If there is a color given and it is valid
    if (req.body.color &&
        /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(req.body.color)) {

        var color = req.body.color;

        sql += `color = '${req.body.color}'`;
    }

    sql = sql.replace(/,\s*$/, ""); // Strip the last comma

    sql += ` WHERE id = ${req.params.id}`;

    req.sqlcon.query(sql, (err, results) => {
        if (err) {
            throw new Error(`Group edit query failed: ${err}`);
        }

        if (results.affectedRows === 1) {
            res.json({
                "err": false,
                "err_desc": false
            });
        } else {
            res.json({
                "err": true,
                "err_desc": "invalid_id"
            });
        }

    }); // query

}); // router



// Delete a group
router.delete("/:id", (req, res) => {

    if (!permcheck(req, res, ["group_delete"])) {
        return noPermission(req, res);
    }

    if (!isFinite(req.params.id)) {
        return res.json({
            "err": true,
            "err_desc": "invalid_id"
        });
    }

    var id = req.params.id;

    req.sqlcon.query(`
        DELETE FROM groups
        WHERE id = ${id}
    `,
    (err, results) => {
        if (err) {
            throw new Error(`Group deletion query failed: ${err}`);
        }

        res.json({
            "err": false,
            "err_desc": false
        });

    });

}); // router

module.exports = router;
