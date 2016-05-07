var express = require("express");
var router = express.Router();
var permissionValidator = require("../permissionValidator");
var permcheck = permissionValidator.permCheck;
var noPermission = permissionValidator.noPermission;

// List 10 reports with pagination (?page=0)
router.get("/", (req, res) => {

    if (!permcheck(req, res, ["report_view"])) {
        return noPermission(req, res);
    }

    // Default offset to 0, if page is a valid number,
    // use it instead
    var offset = 0;
    if (isFinite(req.query.page)) {
        offset = req.query.page*10;
    }

    // Search only for open reports by default
    var statusID = 0;
    if (req.query.status && isFinite(req.query.status)) {
        statusID = req.query.status;
    }

    // This SQL is ugly hacky magic, never touch it
    req.sqlcon.query(`
        SELECT
            r.id,
            r.title,
            r.creator as creatorId,
            r.created,
            r.status,
            u.username as creator,
            u.gravatar_url as creator_avatar,
            (
                SELECT
                	CONCAT(
                        '[',
                        GROUP_CONCAT(
                            '{"id":',
                            f.id,
                            ',"name":"',
                            f.title,
                            '","color":"',
                            f.color,
                            '"}'
                            SEPARATOR ','
                        ),
                        ']'
                    )
                FROM reports_flags rf
                LEFT JOIN flags f
                ON rf.flag_id = f.id
                WHERE rf.report_id = r.id
            ) as flags,
            (
                SELECT
                	CONCAT(
                        '[',
                        GROUP_CONCAT(
                            '{"id":',
                            s.id,
                            ',"name":"',
                            s.title,
                            '","color":"',
                            s.color,
                            '"}'
                            SEPARATOR ','
                        ),
                        ']'
                    )
                FROM reports_services rs
                LEFT JOIN services s
                ON rs.service_id = s.id
                WHERE rs.report_id = r.id
            ) as services
        FROM
            reports r
        LEFT JOIN
            users u
        ON r.creator = u.id
        WHERE r.status = ${statusID}
        LIMIT 10
        OFFSET ${offset}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`Report retrieval query failed: ${err}`);
        }

        // This is part of the hack that allows us to retrieve the flags
        // with the reports in one query
        for (i in results) {
            results[i].flags = JSON.parse(results[i].flags);
            results[i].services = JSON.parse(results[i].services);
        }

        res.json({
            "err": false,
            "err_desc": false,
            "data": results
        });
    });

}); // router



// Get all reports with tag ID
router.get("/tag/:id", (req, res) => {

    if (!permcheck(req, res, ["report_view"])) {
        return noPermission(req, res);
    }

    if (!isFinite(req.params.id)) {
        return res.json({
            "err": true,
            "err_desc": "missing_fields"
        });
    }

    // Search only for open reports by default
    var statusID = 0;
    if (req.query.status && isFinite(req.query.status)) {
        statusID = req.query.status;
    }

    var id = req.params.id;

    // Default offset to 0, if page is a valid number,
    // use it instead
    var offset = 0;
    if (isFinite(req.query.page)) {
        offset = req.query.page*10;
    }

    // This SQL is ugly hacky magic, never touch it
    req.sqlcon.query(`
        SELECT
            r.id,
            r.title,
            r.creator as creatorId,
            r.created,
            r.status,
            u.username as creator,
            u.gravatar_url as creator_avatar,
            (
                SELECT
                	CONCAT(
                        '[',
                        GROUP_CONCAT(
                            '{"id":',
                            f.id,
                            ',"name":"',
                            f.title,
                            '","color":"',
                            f.color,
                            '"}'
                            SEPARATOR ','
                        ),
                        ']'
                    )
                FROM reports_flags rf
                LEFT JOIN flags f
                ON rf.flag_id = f.id
                WHERE rf.report_id = r.id
            ) as flags,
            (
                SELECT
                	CONCAT(
                        '[',
                        GROUP_CONCAT(
                            '{"id":',
                            s.id,
                            ',"name":"',
                            s.title,
                            '","color":"',
                            s.color,
                            '"}'
                            SEPARATOR ','
                        ),
                        ']'
                    )
                FROM reports_services rs
                LEFT JOIN services s
                ON rs.service_id = s.id
                WHERE rs.report_id = r.id
            ) as services
        FROM
            reports r
        LEFT JOIN
            users u
        ON r.creator = u.id
        RIGHT JOIN reports_flags rf
        ON r.id = rf.report_id
        WHERE rf.flag_id = ${id} AND r.status = ${statusID}
        LIMIT 10
        OFFSET ${offset}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`Report retrieval query failed: ${err}`);
        }

        // This is part of the hack that allows us to retrieve the flags
        // with the reports in one query
        for (i in results) {
            results[i].flags = JSON.parse(results[i].flags);
            results[i].services = JSON.parse(results[i].services);
        }

        res.json({
            "err": false,
            "err_desc": false,
            "data": results
        });

    });

}); // router



// Get more detailed info about report :id
router.get("/:id", (req, res) => {

    if (!permcheck(req, res, ["report_detail"])) {
        return noPermission(req, res);
    }

    // If :id is not a number, shut down
    if (!isFinite(req.params.id)) {
        return res.json({
            "err": true,
            "err_desc": "invalid_id",
            "data": false
        });
    }

    var id = req.params.id;

    req.sqlcon.query(`
        SELECT
            r.id,
            r.title,
            r.creator as creatorId,
            r.created,
            r.status,
            u.username as creator,
            u.gravatar_url as creator_avatar
        FROM
            reports r
        LEFT JOIN
            users u
        ON r.creator = u.id
        LEFT JOIN
        	reports_flags rf
        ON rf.report_id = r.id
        LEFT JOIN
        	flags f
        ON rf.flag_id = f.id
        WHERE r.id = ${id}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`Detailed report query failed: ${err}`);
        }

        if(!results) {
            return res.json({
                "err": true,
                "err_detail": "not_found",
                "data": false
            });
        }

        var reportdata = results[0];

        res.json({
            "err": false,
            "err_desc": false,
            "data": reportdata
        });

    }); // query

}); // router



// get answers for one report
router.get("/:id/answers", (req, res) => {

    if (!permcheck(req, res, ["report_detail"])) {
        return noPermission(req, res);
    }

    if (!isFinite(req.params.id)) {
        return res.json({
            "err": true,
            "err_desc": "invalid_id"
        });
    }

    req.sqlcon.query(`
        SELECT
            a.id,
            a.text,
            a.created,
            a.updated,
            u.id as creator,
            u.username,
            u.gravatar_url
        FROM answers a
        LEFT JOIN users u
        ON a.user = u.id
        WHERE a.report = ${req.params.id}
        ORDER BY created ASC
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`Answer retrieval query failed: ${err}`);
        }

        res.json({
            "err": false,
            "err_desc": false,
            "data": results
        });

    }); // query

}); // router



// get flags for one report
router.get("/:id/flags", (req, res) => {

    if (!permcheck(req, res, ["report_detail"])) {
        return noPermission(req, res);
    }

    if (!isFinite(req.params.id)) {
        return res.json({
            "err": true,
            "err_desc": "invalid_id"
        });
    }

    req.sqlcon.query(`
        SELECT
            f.id,
            f.title,
            f.color
        FROM reports_flags rf
        LEFT JOIN flags f
        ON rf.flag_id = f.id
        WHERE rf.report_id = ${req.params.id}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`Report flag retrieval query failed: ${err}`);
        }

        res.json({
            "err": false,
            "err_desc": false,
            "data": results
        });

    }); // query

}); // router



// get services for one report
router.get("/:id/services", (req, res) => {

    if (!permcheck(req, res, ["report_detail"])) {
        return noPermission(req, res);
    }

    if (!isFinite(req.params.id)) {
        return res.json({
            "err": true,
            "err_desc": "invalid_id"
        });
    }

    req.sqlcon.query(`
        SELECT
            s.id,
            s.title,
            s.description,
            s.color
        FROM reports_services rs
        LEFT JOIN services s
        ON rs.service_id = s.id
        WHERE rs.report_id = ${req.params.id}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`Report services retrieval query failed: ${err}`);
        }

        res.json({
            "err": false,
            "err_desc": false,
            "data": results
        });

    }); // query

}); // router



// Create a new report
router.post("/", (req, res) => {

    if (!permcheck(req, res, ["report_create"])) {
        return noPermission(req, res);
    }

    if (!req.body.title || !req.body.text) {
        return res.json({
            "err": true,
            "err_desc": "missing_fields",
            "reportId": false
        });
    }

    var title = req.sqlcon.escape(req.body.title);
    var text = req.sqlcon.escape(req.body.text);
    var flags = req.body.flags;
    var services = req.body.services;

    req.sqlcon.query(`
        INSERT INTO
            reports (
                title,
                creator
            )
        VALUES (
            ${title},
            ${req.session.id}
        )
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`Report creation query failed: ${err}`);
        }

        // Insert the text as the first answer
        req.sqlcon.query(`
            INSERT INTO
                answers (
                    user,
                    report,
                    text,
                    created
                )
            VALUES (
                ${req.session.id},
                ${results.insertId},
                ${text},
                CURRENT_TIMESTAMP
            )
        `,
        (err) => { // Omitting the other parameters to access results from above
            if (err) {
                throw new Error(`Report text creation query failed: ${err}`);
            }
        });

        // Insert the flags into the mergetable
        var flagSql = "";
        // flags should be an array of IDs, loop through it,
        // check for sanity and form a insert sql string
        for (i in flags) {
            if (!isFinite(flags[i])) continue; // Skip if NaN

            flagSql += `(${results.insertId}, ${flags[i]}),`;
        }
        flagSql = flagSql.replace(/,\s*$/, ""); // Strip the last comma

        req.sqlcon.query(`
            INSERT INTO
                reports_flags (
                    report_id,
                    flag_id
                ) VALUES
                ${flagSql}
        `,
        (err) => {
            if (err) {
                throw new Error(`Report flags creation query failed: ${err}`);
            }
        });

        // Insert the services into the mergetable
        var servicesSql = "";
        // services should be an array of IDs, loop through it,
        // check for sanity and form a insert sql string
        for (i in services) {
            if (!isFinite(services[i])) continue; // Skip if NaN

            servicesSql += `(${results.insertId}, ${services[i]}),`;
        }
        servicesSql = servicesSql.replace(/,\s*$/, ""); // Strip the last comma

        req.sqlcon.query(`
            INSERT INTO
                reports_services (
                    report_id,
                    service_id
                ) VALUES
                ${servicesSql}
        `,
        (err) => {
            if (err) {
                throw new Error(`Report service creation query failed: ${err}`);
            }
        });

        res.json({
            "err": false,
            "err_desc": false,
            "reportId": results.insertId
        });

    }); // report query

}); // router



// Edit a report
router.patch("/:id", (req, res) => {

    // Shuffling the checks around a bit, because a user
    // may have the right to edit his own reports title too

    // Error out if no ID was given OR both title, flags and services are empty
    if (!isFinite(req.params.id) &&
        (!req.body.title && !req.body.flags && !req.body.services)) {
        return res.json({
            "err": true,
            "err_desc": "missing_fields"
        });
    }

    // Insert the flags into the mergetable
    var flagsSql = "";
    // flags should be an array of IDs, loop through it,
    // check for sanity and form a insert sql string
    for (i in req.body.flags) {
        if (!isFinite(req.body.flags[i])) continue; // Skip if NaN

        flagsSql += `(${req.params.id}, ${req.body.flags[i]}),`;
    }
    flagsSql = flagsSql.replace(/,\s*$/, ""); // Strip the last comma

    // Insert the services into the mergetable
    var servicesSql = "";
    // services should be an array of IDs, loop through it,
    // check for sanity and form a insert sql string
    for (i in req.body.services) {
        if (!isFinite(req.body.services[i])) continue; // Skip if NaN

        servicesSql += `(${req.params.id}, ${req.body.services[i]}),`;
    }
    servicesSql = servicesSql.replace(/,\s*$/, ""); // Strip the last comma

    var id = req.params.id;

    // Were doing the SQL here to see if its the users own report
    req.sqlcon.query(`
        SELECT *
        FROM reports
        WHERE id = ${id}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`Report retrieval in patch, query failed: ${err}`);
        }

        // If the user does not have the global permission to edit everyone's
        // reports, check if it's their own and if they have the right to edit
        if (!permcheck(req, res, ["report_edit"]) &&
            (results[0].creator == req.session.id &&
             !permcheck(req, res, ["report_edit_own"]))) {
            return noPermission(req, res);
        }

        var title = req.sqlcon.escape(req.body.title);

        // Edit the title in our DB
        req.sqlcon.query(`
            UPDATE reports
            SET
                title = ${title}
            WHERE
                id = ${id}
        `,
        (err, results, fields) => {
            if (err) {
                throw new Error(`Report edit query failed: ${err}`);
            }

            res.json({
                "err": false,
                "err_desc": false
            });

        }); // update query

        // Update the flags if any were given
        // First by clearing the mergetable
        if (req.body.flags) {
            req.sqlcon.query(`
                DELETE FROM
                    reports_flags
                WHERE report_id = ${id}
            `,
            (err) => {
                if (err) {
                    throw new Error(
                    `Report edit flag mergetable cleaning query failed: ${err}`
                    );
                }

                // and then adding the new ones
                req.sqlcon.query(`
                    INSERT INTO
                        reports_flags (
                            report_id,
                            flag_id
                        ) VALUES
                        ${flagsSql}
                `,
                (err) => {
                    if (err) {
                        throw new Error(
                            `Report flags creation query failed: ${err}`
                        );
                    }
                });

            }); // delete query

        } //if

        // Update the services if any were given
        // First by clearing the mergetable
        if (req.body.services) {
            req.sqlcon.query(`
                DELETE FROM
                reports_services
                WHERE report_id = ${id}
            `,
            (err) => {
                if (err) {
                    throw new Error(
                        `Rep-Services mergetable cleaning query failed: ${err}`
                    );
                }

                // and then adding the new ones
                req.sqlcon.query(`
                    INSERT INTO
                    reports_services (
                        report_id,
                        service_id
                    ) VALUES
                    ${servicesSql}
                `,
                (err) => {
                    if (err) {
                        throw new Error(
                            `Report services creation query failed: ${err}`
                        );
                    }
                });

            }); // delete query

        } // if

    }); // retrieval query

}); // router



router.delete("/:id", (req, res) => {

    if (!isFinite(req.params.id)) {
        return res.json({
            "err": true,
            "err_detail": "invalid_id"
        });
    }

    var id = req.sqlcon.escape(req.params.id);

    req.sqlcon.query(`
        SELECT
            creator
        FROM reports
        WHERE id = ${id}
    `,
    (err, results, fields) => {
        if (err) {
            throw new Error(`Creator retrieval query failed: ${err}`);
        }

        // If the user does not have the global permission to delete everyone's
        // reports, check if it's their own and if they have the right to delete
        if (!permcheck(req, res, ["report_delete"]) &&
            (results[0].creator == req.session.id &&
             !permcheck(req, res, ["report_delete_own"]))) {
            return noPermission(req, res);
        }

        // deletion permitted, execute
        req.sqlcon.query(`
            DELETE FROM reports
            WHERE id = ${id}
        `,
        (err) => {
            if (err) {
                throw new Error(``)
            }

            res.json({
                "err": false,
                "err_desc": false
            });

        }); // deletion query

        // clear up the mergetables
        // flags
        req.sqlcon.query(`
            DELETE FROM reports_flags
            WHERE report_id = ${id}
        `,
        (err) => {
            if (err) {
                throw new Error(`Rep-Flags mergetable cleanup failed: ${err}`);
            }
        });

        // services
        req.sqlcon.query(`
            DELETE FROM reports_services
            WHERE report_id = ${id}
        `,
        (err) => {
            if (err) {
                throw new Error(
                    `Rep-Services mergetable cleanup failed: ${err}`
                );
            }
        });

        // answers
        req.sqlcon.query(`
            DELETE FROM answers
            WHERE report = ${id}
        `,
        (err) => {
            if (err) {
                throw new Error(
                    `Rep-Answers mergetable cleanup failed: ${err}`
                );
            }
        });

    }); // retrieval query

});

module.exports = router;
