var startTime = Date.now();

console.log(ISOtime() + " Starting up...");
console.log(ISOtime() + " Loading dependencies...");

var express = require("express");
var mysql = require("mysql");
var fs = require("fs");
var path = require("path");
var helmet = require("helmet");
var bodyparser = require("body-parser");
var session = require("./session");

console.log(ISOtime() + " Successfully loaded dependencies");

// Parse settings
// Define defaults
var defaultSettings = {
    "port": 8000,
    "session_expire_days": 3,
    "db_host": "127.0.0.1",
    "db_user": "root",
    "db_password": "",
    "db_database": "issuetracker"
};
// Load user settings
var userSettings = require("./settings.json");
// Merge them into the settings object
var settings = Object.assign({}, defaultSettings, userSettings);

var app = express();
app.use(helmet());
app.use(bodyparser.json());

var sqlcon = mysql.createConnection({
    host: settings.db_host,
    user: settings.db_user,
    password: settings.db_password,
    database: settings.db_database,
    multipleStatements: false
});
sqlcon.connect((err) => {
    if (err) {
        console.error(ISOtime() + " Database connection failed: " + err.message);
    } else {
        console.log(ISOtime() + " Database connected");
    }
});

app.use((req, res, next) => {
    // Publish the DB connection and settings object
    req.sqlcon = sqlcon;
    req.settings = settings;
    next();
});

app.use(session.middleware); // Load user data if session exists

app.use(session.requireAuth); // Require auth for protected routes

console.log(ISOtime() + " Loading routes...");
var moduleList = fs.readdirSync("./routes");
for (var i = 0; i < moduleList.length; i++) {
    if (!moduleList[i].endsWith(".js")) continue; // Skip directories
    var route = path.basename(moduleList[i],".js");
    try {
        app.use("/" + route, require("./routes/" + moduleList[i]));
        console.log(ISOtime() +
        " Loaded route \"" + route + "\"");
    } catch (e) {
        console.log("\n\n" + ISOtime() +
        " Error while loading route \"" + route + "\"");
        console.trace(e);
        logError(`Load of Module "${moduleList[i]}": <${e.message}>`);
    }
}

// Identify as teapot
app.all("/", (req, res) => {
    res.sendStatus(418);
});

// If an error occurs, send 500 INTERNAL SERVER ERROR
// and log it
app.use(function(err, req, res, next) {
    console.log(err);
    console.error(ISOtime() + " Error while request to " + req.path + ":",
                    err.message);
    if (!res.headersSent) {
        res.sendStatus(500);
    }
    // Syntax for automated processing '/path': <error message>
    logError(`Request to '${req.path}': <${err.message}>`);
    if (!err)
        next();
});

// 404 handler, just sends 404 NOT FOUND if the router stack is done
app.use(function(req, res, next) {
    res.sendStatus(404);
});

app.listen(settings.port, () => {
    var duration = Date.now() - startTime;
    console.log(ISOtime() + " Started API-Server on port " + settings.port +
    ", took " + duration + "ms");
});

function ISOtime () {
    var d = new Date();
    return d.toLocaleTimeString() + "." + d.getMilliseconds();
}

function logError (text) {
    var format = `${ISOtime()} ${text}`;
    fs.writeFileSync("error.log", format);
}
