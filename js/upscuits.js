window.myApp = window.myApp || {};
myApp.dashboard = (function($) {
    var _template = "", _loaded = 0, _intervalId = 0, _start = Date.now(), _refresh = ((typeof (__refresh) == "number") ? __refresh : 300), $_container = {}, 
    $_lastUpdate = {}, $_servertitle = {}, showarr = [], tmpdate, datestr = "", error = false;

    function init() {
        _start = Date.now();
        _template = $('#server-template').html();
        $_container = $('#server-container').html('');
        $_mainstatus = $('#maintitle').html('<i class="glyphicon glyphicon-fire"></i> 加载中...');
        $_mainstatusSyle = $("#mianstdiv").css("background", 'linear-gradient(#f0ffb6, #98a8a0);');
        $_servertitle = $('#server-title').html('');
        $_lastUpdate = $('#last-update');
        showarr = [];
        getServerinfo();
        $_servertitle.append("<th style=\"width:21%\"></th>");
        $_servertitle.append("<th style=\"width:9%\">近30日</th>");
        for (var d = 6; d >= 0; d--) {
            tmpdate = new Date(Date.parse(new Date().toString()) - 86400000 * d);
            datestr = (tmpdate.getMonth() + 1) + "-" + tmpdate.getDate();
            $_servertitle.append("<th style=\"width:10%\">" + datestr + "</th>");
        }
        error = false;
        for (var i in __apiKeys) {
            getUptime(__apiKeys[i], i);
        }
        _intervalId = setInterval(countdown, 1000);
    }

    function changeServerInfo(content) {
        $_serverinfo = $('#serverinfo').html('');
        $_serverinfo.append(content);
    }

    function getServerinfo() {
        var strHtml = "";
        $.ajax({
            type: "get",
            url: "https://www.666so.cn/status.html",
            dataType: "jsonp",
            jsonp: "callback",
            jsonpCallback: "serverinfo",
            success: function(data) {
                strHtml += "<h4>随机存取存储器: " + data.ram + "</h4>";
                switch (data.phpfpm) {
                    case "ok":
                        strHtml += "<h4>进程管理器: <span class=\"label label-success\"><i class=\"glyphicon glyphicon-ok\"></i> 正常</span></h4>";
                        changeStatus("normal");
                        break;
                    case "error (restarting)":
                        strHtml += "<h4>进程管理器: <span class=\"label label-danger\"><i class=\"glyphicon glyphicon-remove\"></i> 错误</span></h4>";
                        changeStatus("error");
                        break;
                    default:
                        strHtml += "<h4>进程管理器: <span class=\"label label-primary\"><i class=\"glyphicon glyphicon-warning-sign\"></i> 无法读取</span></h4>";
                        changeStatus("error");
                }
                switch (data.mysql) {
                    case "ok":
                        strHtml += "<h4>数据库: <span class=\"label label-success\"><i class=\"glyphicon glyphicon-ok\"></i> 正常</span></h4>";
                        changeStatus("normal");
                        break;
                    case "error (restarting)":
                        strHtml += "<h4>数据库: <span class=\"label label-success\"><i class=\"glyphicon glyphicon-remove\"></i> 错误</span></h4>";
                        changeStatus("error");
                        break;
                    default:
                        strHtml += "<h4>数据库: <span class=\"label label-primary\"><i class=\"glyphicon glyphicon-warning-sign\"></i> 无法读取</span></h4>";
                        changeStatus("error");
                }
                strHtml += "<hr><h4><span class=\"label label-info\">" + data.last_update + "</span></h5>";
                changeServerInfo(strHtml);
            },
            error: function() {
                changeServerInfo("<h1><i class=\"glyphicon glyphicon-ok\"></i> 正常</h1>");
            }
        });
    }

    function changeStatus(status) {
        switch (status) {
            case "error":
                $_mainstatus.html('<i class="glyphicon glyphicon-ok-circle"></i> 不太好');
                $_mainstatusSyle.css("background", 'linear-gradient(red, #ffb6b6);');
                break;
            case "normal":
                $_mainstatus.html('<i class="glyphicon glyphicon-ok-circle"></i> 正常');
                $_mainstatusSyle.css("background", "");
                break;
            default:
                $_mainstatus.html('<i class="glyphicon glyphicon-ok-circle"></i> Hello!');
                $_mainstatusSyle.css("background", 'linear-gradient(#f0ffb6, #98a8a0);');
                break;
        }
    }

    function getUptime(apikey, ids) {
        var url = "https://api.uptimerobot.com/v2/getMonitors";
        $.ajax({
            type: "post",
            url: url,
            data: {
                "api_key": apikey,
                "custom_uptime_ratios": "1-2-3-4-5-6-7-30",
                "format": "json"
            },
            dataType: "json",
            success: function(str) {
                for (var item in str.monitors) {
                    placeServer(str.monitors[item], ids);
                }
            }
        });
    }

    function placeServer(data, ids) {
        data.alert = "";
        switch (parseInt(data.status, 10)) {
            case 0:
                data.statustxt = "未知";
                data.statusicon = "question-sign";
                data.label = "default";
                break;
            case 1:
                data.statustxt = "未知";
                data.statusicon = "question-sign";
                data.label = "default";
                break;
            case 2:
                data.statustxt = "正常";
                data.statusicon = "ok";
                data.label = "success";
                data.alert = "";
                break;
            case 8:
                data.statustxt = "异常";
                data.statusicon = "exclamation-sign";
                data.label = "warning";
                data.alert = "warning";
                error = true;
                break;
            case 9:
                data.statustxt = "超负荷";
                data.statusicon = "remove";
                data.label = "danger";
                data.alert = "danger";
                error = true;
                break;
        }

        var lastMonth = Date.now() - 30 * 24 * 60 * 60 * 1000;
        data.log = data.logs.filter(log => new Date(log.datetime).getTime() >= lastMonth);

        var endtime, starttime, period, fin = [], lastlen = 1;
        period = 86400000 * 1;
        endtime = Date.now();
        starttime = endtime - period;

        if (!data.log.length) {
            switch (parseInt(data.status, 10)) {
                case 2:
                    starttype = 2;
                    break;
                case 8:
                case 9:
                    starttype = 1;
                    break;
                default:
                    starttype = 0;
            }
            fin.push({
                type: starttype,
                len: 1,
                left: starttime,
                right: endtime
            });
        } else {
            for (var r = 0; r < data.log.length; r++) {
                starttime = new Date(data.log[r].datetime).getTime();
                if (starttime < endtime - period) {
                    starttime = endtime - period;
                }
                endtype = data.log[r].type;
                switch (parseInt(endtype, 10)) {
                    case 1:
                        endtype = 1;
                        break;
                    case 2:
                        endtype = 2;
                        break;
                    default:
                        endtype = 0;
                }
                lastlen -= (endtime - starttime) / period;
                if (fin.length > 0 && fin[fin.length - 1].type == endtype) {
                    fin[fin.length - 1].len += (endtime - starttime) / period;
                    fin[fin.length - 1].left = starttime;
                } else {
                    fin.push({
                        type: endtype,
                        len: (endtime - starttime) / period,
                        left: starttime,
                        right: endtime
                    });
                }
                endtime = starttime;
                if (starttime <= endtime - period) {
                    break;
                }
            }
            if (starttime > endtime - period) {
                switch (parseInt(endtype, 10)) {
                    case 1:
                        starttype = 2;
                        break;
                    case 2:
                        starttype = 1;
                        break;
                    default:
                        starttype = 0;
                }
                if (fin.length > 0 && fin[fin.length - 1].type == endtype) {
                    fin[fin.length - 1].len += lastlen;
                    fin[fin.length - 1].left = endtime - period;
                } else {
                    fin.push({
                        type: endtype,
                        len: lastlen,
                        left: endtime - period,
                        right: endtime
                    });
                }
            }
        }
        data.statuses = fin;
        var _item = ich.item(data);
        $_container.append(_item);
    }

    function countdown() {
        var past = Date.now() - _start;
        var remain = _refresh * 1000 - past;
        if (remain <= 0) {
            clearInterval(_intervalId);
            init();
            return;
        }
        var min = Math.floor(remain / 60000);
        var sec = Math.floor(remain / 1000 % 60);
        var str = ' ' + min + ':' + ((sec < 10) ? '0' + sec : sec);
        $_lastUpdate.html(str);
    }

    return {
        init: init
    };
})(jQuery);

$(document).ready(function() {
    myApp.dashboard.init();
});
