var express = require("express");
var router = express.Router();
var permissionValidator = require("../permissionValidator");
var permcheck = permissionValidator.permCheck;
var noPermission = permissionValidator.noPermission;

// List services
// There shouldnt be too many of them so we're just
// listing all entries
router.get("/", (req, res) => {

    if (!permcheck(req, res, ["service_view"])) {
        return noPermission(req, res);
    }

    req.sqlcon.query(`
        SELECT
            s.id,
            s.title,
            s.description,
            (
                SELECT
                    COUNT(DISTINCT report_id)
                FROM
                    reports_services rs
                WHERE
                    rs.service_id = s.id
            ) AS used,
            s.color
        FROM
            services s
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error("Query for services failed");
        }

        res.json(results);
    });
});



// GET info for one service
router.get("/:id", (req, res) => {

    if (!permcheck(req, res, ["service_detail"])) {
        return noPermission(req, res);
    }

    if (!isFinite(req.params.id)) {
        return res.json({
            "err": true,
            "err_desc": "invalid_id"
        });
    }

    var requestedId = req.param.id;

    req.sqlcon.query(`
        SELECT
            s.id,
            s.title,
            s.description,
            (
                SELECT
                    COUNT(DISTINCT report_id)
                FROM
                    reports_services rs
                WHERE
                    rs.service_id = s.id
            ) AS used
            FROM
                services s
            WHERE
                s.id = ${requestedId}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(
                `Query for service failed: ${err.message}`);
        }

        res.json(results);
    });
});



// Create a new service with POST
router.post("/", (req, res) => {

    if (!permcheck(req, res, ["service_create"])) {
        return noPermission(req, res);
    }

    // If we are missing one of theese, just shut down
    if (!req.body.title || !req.body.description) {
        return res.json({
            "err": true,
            "err_desc": "missing_field",
            "serviceId": false
        });
    }

    // Escape the values and provide defaults
    var title = req.sqlcon.escape(req.body.title);
    var desc = req.sqlcon.escape(req.body.description);
    var color = req.sqlcon.escape(req.body.color || "#FFFFFF"); // Optional

    req.sqlcon.query(`
        INSERT INTO
            services (
                title,
                description,
                color
            )
        VALUES (
            ${title},
            ${desc},
            ${color}
        )
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(
                `Query for service creation failed: ${err.message}`
            );
        }

        if (results.insertId) {
            res.json({
                "err": false,
                "err_desc": false,
                "serviceId": results.insertId
            });
        }
    });
});



// Edit a service
router.patch("/:id", (req, res) => {

    if (!permcheck(req, res, ["service_edit"])) {
        return noPermission(req, res);
    }

    var id = req.sqlcon.escape(req.params.id);

    // Escape and provide defaults
    var title = req.sqlcon.escape(req.body.title);
    var description = req.sqlcon.escape(req.body.description);
    var color = req.sqlcon.escape(req.body.color);

    var updateSql = "";

    if (title !== 'NULL')
        updateSql += "title = " + title + ",";
    if (description !== 'NULL')
        updateSql += "description = " + description + ",";
    if (color !== 'NULL')
        updateSql += "color = " + color;

    // Remove comma + whitespace from end
    updateSql = updateSql.replace(/,\s*$/, "");

    req.sqlcon.query(`
        UPDATE
            services
        SET
            ${updateSql}
        WHERE
            id = ${id}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(
                `Query for updating service failed: ${err.message}`
            );
        }

        if (results.affectedRows == 1) {
            res.json({
                "err": false
            });
        } else {
            res.json({
                "err": true
            });
        }
    }); // update-query

}); // function



// Delete a service
router.delete("/:id", (req, res) => {

    if (!permcheck(req, res, ["service_delete"])) {
        return noPermission(req, res);
    }

    if (!isFinite(req.params.id)) {
        return res.json({
            "err": true,
            "err_desc": "invalid_id"
        });
    }
    
    var id = req.params.id;

    req.sqlcon.query(`DELETE FROM services WHERE id = ${id}`,
    (err, results, fields) => {
        if (err) {
            throw new Error(`Delete service query failed: ${err}`);
        }

        if (results.affectedRows == 1) {
            res.json({
                "success": true
            });
        } else {
            res.json({
                "success": false
            });
        }
    });
});

module.exports = router;
