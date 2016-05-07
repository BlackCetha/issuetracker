// With this function, were checking if the user has all the permissions
// in perms
var permCheck = function (req, res, perms) {
    for (var i = 0; i < perms.length; i++) {
        if (!req.permissions[perms[i]]) {
            return false;
        }
    }
    return true;
}

var noPermission = function (req, res) {
    if (!res.headerSent) {
        res.status(403);
    }

    res.json({
        "err": true,
        "err_desc": "no_permission"
    });
}

module.exports = {
    permCheck,
    noPermission
};
