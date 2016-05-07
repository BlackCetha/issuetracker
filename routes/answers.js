var express = require("express");
var router = express.Router();
var permissionValidator = require("../permissionValidator");
var permcheck = permissionValidator.permCheck;
var noPermission = permissionValidator.noPermission;

router.get("/", (req, res) => {
    res.json({
        "err": true,
        "err_desc": "missing_param"
    });
});



// get info for one answer
router.get("/:id", (req, res) => {

    // this checks for the permission to view details about reports for
    // simplicity and because the same permission is used to allow access
    // to all answers of a report
    if (!permcheck(req, res, ["report_detail"])) {
        return noPermission(req, res);
    }

    if (!isFinite(req.params.id) && !req.body.text) {
        return res.json({
            "err": true,
            "err_desc": "missing_fields"
        });
    }

    var id = req.params.id;

    req.sqlcon.query(`
        SELECT
            a.id,
            a.user as creator,
            a.report,
            a.text,
            a.created,
            a.updated,
            u.username,
            u.gravatar_url
        FROM answers a
        LEFT JOIN users u
        ON u.id = a.user
        WHERE a.id = ${id}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`Answer detail query failed: ${err}`);
        }

        res.json({
            "err": false,
            "err_desc": false,
            "data": results[0]
        });

    });

}); // router



// add answer to report :id
router.post("/:id", (req, res) => {

    if (!permcheck(req, res, ["answer_create"])) {
        return noPermission(req, res);
    }

    if (!isFinite(req.params.id) && !req.body.text) {
        return res.json({
            "err": true,
            "err_desc": "missing_fields"
        });
    }

    var id = req.params.id;
    var text = req.sqlcon.escape(req.body.text);

    req.sqlcon.query(`
        INSERT INTO answers (
            report,
            user,
            text,
            created
        )
        VALUES (
            ${id},
            ${req.session.id},
            ${text},
            CURRENT_TIMESTAMP
        )
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`Answer create query failed: ${err}`);
        }

        res.json({
            "err": false,
            "err_desc": false
        });

    }); // query

}); // router



// edit answer with :id
router.patch("/:id", (req, res) => {

    if (!isFinite(req.params.id) && !req.body.text) {
        return res.json({
            "err": true,
            "err_desc": "missing_fields"
        });
    }

    var id = req.params.id;
    var text = req.sqlcon.escape(req.body.text);

    req.sqlcon.query(`
        SELECT user
        FROM answers
        WHERE id = ${id}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`Answers creator query failed: ${err}`);
        }

        if (!permcheck(req, res, ["answer_edit"]) &&
            (results[0].user == req.session.id &&
             !permcheck(req, res, ["answer_edit_own"]))) {
            return noPermission(req, res);
        }

        req.sqlcon.query(`
            UPDATE answers
            SET text = ${text}
            WHERE id = ${id}
        `,
        (err, results) => {
            if (err) {
                throw new Error(`Answer edit query failed: ${err}`);
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
            } // if

        }); // update query

    }); // permcheck query

}); // router



// delete answer with :id
router.delete("/:id", (req, res) => {

    if (!isFinite(req.params.id)) {
        return res.json({
            "err": true,
            "err_desc": "missing_fields"
        });
    }

    var id = req.params.id;

    req.sqlcon.query(`
        SELECT user
        FROM answers
        WHERE id = ${id}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`Answer deletion user retrieval failed: ${err}`);
        }

        if (!permcheck(req, res, ["answer_delete"]) &&
            (results[0].user == req.session.id &&
             !permcheck(req, res, ["answer_delete_own"]))) {
            return noPermission(req, res);
        }

        req.sqlcon.query(`
            DELETE FROM answers
            WHERE id = ${id}
        `,
        (err) => {
            if (err) {
                throw new Error(`Answer deletion query failed: ${err}`);
            }

            res.json({
                "err": false,
                "err_desc": false
            });

        });

    }); // creator query

}); // router

module.exports = router;
