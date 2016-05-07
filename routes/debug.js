var express = require("express");
var router = express.Router();

router.get("/form", (req, res) => {
    res.send(`
        <form onsubmit="return submitForm()">
        <input type="text" id="field_name" name="username">
        <input type="password" id="field_pass" name="password">
        <input type="submit" id="button_submit" value="Submit">
        <input type="button" id="button_logout" value="Log out" onClick="logout()">
        </form>
        <div style="float:right;text-align:right;width:49%"><h1>Userdata:
        <input type="button" onclick="getUserData()" value="Refresh">
        </h1>
        <div id="userdata">Loading...</div></div>
        <h1>Notifications:</h1>
        <div id="notif" style="width:49%"></div>
        <div style="clear:both"></div>
        <div style="width:49%;float:right">
        <h1>Groups</h1>
        <span id="group_display"></span>
        </div>
        <div style="width:49%">
        <h1>Reports <button onClick="refreshReports()" id="report_button">Refresh</button>
        <select id="reports_statusID"><option value="0" selected>Open (0)</option><option value="1">Closed (1)</option></select>
        </h1>
        <span id="report_display"></span>
        </div>
        <script src="//code.jquery.com/jquery-1.12.0.min.js"></script>
        <script>
        var userdata = {};
        getUserData();
        function submitForm () {
            $("#button_submit").val("Loading...");
            var username = $("#field_name").val();
            var password = $("#field_pass").val();
            $.ajax({
                url: "/auth/login",
                type: "POST",
                data: JSON.stringify({"username": username, "password": password}),
                contentType: "application/json"
            })
            .success(function (data) {
                if (data.err == false) {
                    newNotification("Logged in");
                    getUserData();
                } else {
                    newNotification("Error while logging in: "+data.err_desc, true);
                    userdata = {};
                    getUserData();
                }
            })
            .fail(function (data) {
                newNotification("Connection failed", true);
                userdata = {};
            })
            .always(function () {
                $("#button_submit").val("Submit");
            });
            return false;
        }
        function logout () {
            $("#button_logout").val("Loading...");
            $.ajax({
                url: "/auth/logout",
                type: "POST",
                contentType: "application/json"
            })
            .success(function (data) {
                userdata = {};
                newNotification("Logged out");
            })
            .fail(function (data) {
                newNotification("Connection failed", true);
            })
            .always(function () {
                $("#button_logout").val("Log out");
            });
        }

        function getUserData () {
            $.get("/auth/list")
            .success(function (data) {
                if (data["err"] == true) {
                    newNotification("Error while updating userdata: "+data.err_desc, true);
                    userdata = {};
                } else {
                    userdata = data.userdata;
                }
            })
            .fail(function (data) {
                newNotification("Connection failed", true);
            })
        }

        window.setInterval(
            function () {
                $("#userdata").html(JSON.stringify(userdata));
                $("#group_display").html("");
                for (i in userdata.groups) {
                    $("#group_display").append(
                        "<div style='background-color:"+userdata.groups[i].color+"'>"+userdata.groups[i].alias+"</div>");
                }
            },
            1000);

        function newNotification (text, err) {
            console.log(err);
            var bgColor = "rgba(0, 0, 0, .3)";
            if (err == true) {
                bgColor = "rgba(255, 0, 0, .3)";
            }
            $("#notif").prepend('<div style="background-color: '+bgColor+'">'+text+'</div>');
        }

        function refreshReports (statusID) {
            if (!statusID) statusID = $("#reports_statusID").val();

            $("#report_display").html("");
            $("#report_button").html("Loading...");

            $.get("/reports?status="+statusID, function (data) {
                if (data.err) {
                    return newNotification("Received error: "+data.err_desc, true);
                }

                var data = data.data;

                console.log(data);

                for (i in data) {
                    var flagHTML = "";
                    for (c in data[i].flags) {
                        flagHTML += "<span style='background-color:"+data[i].flags[c].color+"'>"+data[i].flags[c].name+"</span>";
                    }
                    var serviceHTML = "";
                    for (c in data[i].services) {
                        serviceHTML += "<span style='background-color:"+data[i].services[c].color+"'>"+data[i].services[c].name+"</span>";
                    }
                    $("#report_display").append(
                        "<div style='border: 1px solid black'>"+data[i].title+
                        "<br>Flags: "+flagHTML+"<br>Services: "+
                        serviceHTML+"</div>"
                    );
                }

            })
            .fail(function (data) {
                newNotification("Connection failed", true);
            })
            .always(function () {
                $("#report_button").html("Refresh");
            });
        }
        refreshReports();
        </script>
    `); // res.send
}); // router

module.exports = router;
