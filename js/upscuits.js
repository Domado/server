window.myApp = window.myApp || {};

myApp.dashboard = (function($) {
    var _template = "",
        _intervalId = 0,
        _start = Date.now(),
        _refresh = ((typeof (__refresh) == "number") ? __refresh : 300),
        $_container = {},
        $_mainstatus = {},
        $_mainstatusSyle = {},
        $_lastUpdate = {},
        $_servertitle = {},
        error = false;

    function init() {
        _start = Date.now();

        _template = $('#server-template').html();

        $_container = $('#server-container').html('');
        $_mainstatus = $('#maintitle').html('<i class="glyphicon glyphicon-fire"></i> 加载中...');

        $_mainstatusSyle = $("#mianstdiv").css("background", 'linear-gradient(#f0ffb6, #98a8a0)');
        $_servertitle = $('#server-title').html('');
        $_lastUpdate = $('#last-update');

        $('#stattip-err, #stattip-ok').addClass('hide');
        $('#stattip-load').removeClass('hide');

        getServerinfo();

        $_servertitle.append("<th style=\"width:21%\"></th>");
        $_servertitle.append("<th style=\"width:9%\">近30日</th>");

        for (var d = 6; d >= 0; d--) {
            var tmpdate = new Date(Date.parse(new Date().toString()) - 86400000 * d);
            var datestr = (tmpdate.getMonth() + 1) + "-" + tmpdate.getDate();
            $_servertitle.append("<th style=\"width:10%\" class=\"center\">" + datestr + "</th>");
        }

        error = false;
        getUptime();
    }

    function changeServerInfo(content) {
        var $_serverinfo = $('#serverinfo').html('');
        $_serverinfo.append(content);
    }

    function getServerinfo() {
        var strHtml = "";

        $.ajax({
            type: "GET",
            url: "https://www.666so.cn/status.html",
            dataType: "jsonp",
            jsonp: "callback",
            jsonpCallback: "serverinfo",

            success: function(data) {
                strHtml += "<h4>随机存取存储器: <span class=\"label label-success\"><i class=\"glyphicon glyphicon-ok\"></i> 正常</span></h4>";

                switch (data.phpfpm) {
                    case "ok":
                        strHtml += "<h4>进程管理器: <span class=\"label label-success\"><i class=\"glyphicon glyphicon-ok\"></i> 正常</span></h4>";
                        changeStatus("normal");
                        break;

                    default:
                        strHtml += "<h4>进程管理器: <span class=\"label label-danger\"><i class=\"glyphicon glyphicon-remove\"></i> 错误</span></h4>";
                        changeStatus("error");
                        break;
                }

                switch (data.mysql) {
                    case "ok":
                        strHtml += "<h4>数据库: <span class=\"label label-success\"><i class=\"glyphicon glyphicon-ok\"></i> 正常</span></h4>";
                        changeStatus("normal");
                        break;

                    default:
                        strHtml += "<h4>数据库: <span class=\"label label-danger\"><i class=\"glyphicon glyphicon-remove\"></i> 错误</span></h4>";
                        changeStatus("error");
                        break;
                }

                changeServerInfo(strHtml);
            },

            error: function() {
                changeServerInfo("<h4><span class=\"label label-warning\">监控探针读取失败</span></h4>");
            }
        });
    }

    function changeStatus(status) {
        switch (status) {
            case "error":
                $_mainstatus.html('<i class="glyphicon glyphicon-remove-circle"></i> 发生错误');
                $_mainstatusSyle.css("background", 'linear-gradient(red, #ffb6b6)');
                break;

            case "normal":
                $_mainstatus.html('<i class="glyphicon glyphicon-ok-circle"></i> 运行正常');
                $_mainstatusSyle.css("background", "");
                break;

            default:
                $_mainstatus.html('<i class="glyphicon glyphicon-ok-circle"></i> 正在加载');
                $_mainstatusSyle.css("background", 'linear-gradient(#f0ffb6, #98a8a0)');
                break;
        }
    }

    function getUptime() {
        $.ajax({
            type: "GET",
            url: "https://data.666so.cn/api/uptimebot/",
            dataType: "json",

            success: function(response) {
                if (response && response.monitors) {
                    for (var i = 0; i < response.monitors.length; i++) {
                        placeServer(response.monitors[i]);
                    }
                }

                finish();
            },

            error: function(xhr, status, errorMsg) {
                console.error("AJAX Error: " + errorMsg);
                error = true;
                finish();
            }
        });
    }

    function escapeHtml(text) {
        if (text === null || text === undefined) {
            return "";
        }

        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function pad2(num) {
        num = parseInt(num, 10);
        return num < 10 ? "0" + num : String(num);
    }

    function formatDateTime(timestamp) {
        timestamp = parseInt(timestamp, 10);

        if (isNaN(timestamp) || timestamp <= 0) {
            return "未知时间";
        }

        var date = new Date(timestamp * 1000);

        var y = date.getFullYear();
        var m = pad2(date.getMonth() + 1);
        var d = pad2(date.getDate());
        var h = pad2(date.getHours());
        var min = pad2(date.getMinutes());
        var s = pad2(date.getSeconds());

        return y + "-" + m + "-" + d + " " + h + ":" + min + ":" + s;
    }

    function formatShortDateTime(timestamp) {
        timestamp = parseInt(timestamp, 10);

        if (isNaN(timestamp) || timestamp <= 0) {
            return "未知时间";
        }

        var date = new Date(timestamp * 1000);

        var m = pad2(date.getMonth() + 1);
        var d = pad2(date.getDate());
        var h = pad2(date.getHours());
        var min = pad2(date.getMinutes());

        return m + "-" + d + " " + h + ":" + min;
    }

    function formatDownDuration(seconds) {
        seconds = parseInt(seconds, 10);

        if (isNaN(seconds) || seconds <= 0) {
            return "无停机";
        }

        var days = Math.floor(seconds / 86400);
        seconds = seconds % 86400;

        var hours = Math.floor(seconds / 3600);
        seconds = seconds % 3600;

        var minutes = Math.floor(seconds / 60);
        var secs = seconds % 60;

        var parts = [];

        if (days > 0) {
            parts.push(days + "天");
        }

        if (hours > 0) {
            parts.push(hours + "小时");
        }

        if (minutes > 0) {
            parts.push(minutes + "分钟");
        }

        if (secs > 0) {
            parts.push(secs + "秒");
        }

        return parts.join("") || "0秒";
    }

    function getLogReasonText(log) {
        if (!log || !log.reason) {
            return "";
        }

        var code = log.reason.code || "";
        var detail = log.reason.detail || "";

        if (code && detail) {
            return code + " / " + detail;
        }

        if (detail) {
            return detail;
        }

        if (code) {
            return code;
        }

        return "";
    }

    /*
     * 从 UptimeRobot logs 中提取中断时间段
     *
     * 你的新 API 里 logs 结构类似：
     * [
     *   {
     *     type: 2,
     *     datetime: 1777206783,
     *     duration: 353872
     *   },
     *   {
     *     type: 1,
     *     datetime: 1777206477,
     *     duration: 306
     *   }
     * ]
     *
     * type = 1 通常表示 Down / 中断
     * type = 2 通常表示 Up / 恢复
     *
     * 对于 type=1：
     *   开始时间 = datetime
     *   结束时间 = datetime + duration
     */
    function buildDowntimePeriods(logs) {
        var periods = [];

        if (!$.isArray(logs) || logs.length === 0) {
            return periods;
        }

        for (var i = 0; i < logs.length; i++) {
            var log = logs[i];

            if (!log) {
                continue;
            }

            var type = parseInt(log.type, 10);
            var startTs = parseInt(log.datetime, 10);
            var duration = parseInt(log.duration, 10);

            if (isNaN(type) || isNaN(startTs)) {
                continue;
            }

            if (isNaN(duration)) {
                duration = 0;
            }

            // 只处理中断日志
            if (type !== 1) {
                continue;
            }

            var endTs = startTs + duration;
            var reasonText = getLogReasonText(log);

            periods.push({
                startTs: startTs,
                endTs: endTs,
                duration: duration,
                startText: formatDateTime(startTs),
                endText: duration > 0 ? formatDateTime(endTs) : "尚未恢复 / 未知",
                shortStartText: formatShortDateTime(startTs),
                shortEndText: duration > 0 ? formatShortDateTime(endTs) : "未恢复",
                durationText: formatDownDuration(duration),
                reasonText: reasonText
            });
        }

        // 按开始时间从新到旧排序
        periods.sort(function(a, b) {
            return b.startTs - a.startTs;
        });

        return periods;
    }

    function buildDowntimeTooltip(periods, maxItems) {
        if (!periods || periods.length === 0) {
            return "中断记录: 无";
        }

        maxItems = maxItems || 3;

        var lines = [];

        for (var i = 0; i < periods.length && i < maxItems; i++) {
            var p = periods[i];

            var line = p.shortStartText + " ~ " + p.shortEndText + "，" + p.durationText;

            if (p.reasonText) {
                line += "，原因: " + p.reasonText;
            }

            lines.push(line);
        }

        if (periods.length > maxItems) {
            lines.push("还有 " + (periods.length - maxItems) + " 条中断记录");
        }

        return "中断记录: " + lines.join("；");
    }

    function buildDowntimeHtml(periods) {
        if (!periods || periods.length === 0) {
            return "<div class=\"small text-muted downtime-list\">近期无中断记录</div>";
        }

        var html = "";
        html += "<div class=\"small downtime-list\" style=\"margin-top:6px;line-height:1.6;\">";
        html += "<div><strong>中断时间段：</strong></div>";

        for (var i = 0; i < periods.length; i++) {
            var p = periods[i];

            html += "<div style=\"margin-left:8px;\">";
            html += "<span class=\"label label-danger\">中断</span> ";
            html += escapeHtml(p.startText);
            html += " ~ ";
            html += escapeHtml(p.endText);
            html += "，持续 ";
            html += escapeHtml(p.durationText);

            if (p.reasonText) {
                html += "，原因：";
                html += escapeHtml(p.reasonText);
            }

            html += "</div>";
        }

        html += "</div>";

        return html;
    }

    function placeServer(data) {
        var downtimePeriods = buildDowntimePeriods(data.logs || []);
        var downtimeTooltip = buildDowntimeTooltip(downtimePeriods, 3);
        var downtimeHtml = buildDowntimeHtml(downtimePeriods);

        var templateData = {
            alert: "",
            label: "default",
            statusicon: "question-sign",
            statustxt: "未知",
            friendlyname: data.friendly_name,
            charts: [],
            progress: [],

            // 新增：给 Mustache 模板使用
            downtimeHtml: downtimeHtml,
            downtimeText: downtimeTooltip,
            downtimeCount: downtimePeriods.length
        };

        switch (parseInt(data.status, 10)) {
            case 2:
                templateData.statustxt = "正常";
                templateData.statusicon = "ok";
                templateData.label = "success";
                break;

            case 8:
            case 9:
                templateData.statustxt = "异常";
                templateData.statusicon = "remove";
                templateData.label = "danger";
                templateData.alert = "danger";
                error = true;
                break;

            case 0:
            case 1:
                templateData.statustxt = "未知";
                templateData.statusicon = "question-sign";
                templateData.label = "default";
                break;

            default:
                templateData.statustxt = "未知";
                templateData.statusicon = "question-sign";
                templateData.label = "default";
                break;
        }

        if (data.custom_uptime_ratio) {
            var ratios = data.custom_uptime_ratio.split('-');

            var downDurations = [];

            if (data.custom_down_durations) {
                downDurations = data.custom_down_durations.split('-');
            }

            var widthPerItem = (100 / ratios.length).toFixed(3);

            for (var i = 0; i < ratios.length; i++) {
                var ratioValue = parseFloat(ratios[i]);

                if (isNaN(ratioValue)) {
                    ratioValue = 0;
                }

                var downSeconds = parseInt(downDurations[i] || "0", 10);

                if (isNaN(downSeconds)) {
                    downSeconds = 0;
                }

                var downText = formatDownDuration(downSeconds);

                var uptype = "success";
                var upsign = "ok-circle";

                if (parseInt(data.status, 10) === 0 || parseInt(data.status, 10) === 1) {
                    uptype = "default";
                    upsign = "question-sign";
                } else if (ratioValue < 100 && ratioValue > 0) {
                    uptype = "warning";
                    upsign = "info-sign";
                } else if (ratioValue === 0) {
                    uptype = "danger";
                    upsign = "remove-circle";
                }

                var tipText = "可用率: " + ratioValue + "%，停机: " + downText + "。" + downtimeTooltip;

                templateData.charts.push({
                    uptype: uptype,
                    uptime: tipText,
                    upsign: upsign
                });

                templateData.progress.push({
                    types: uptype,
                    len: widthPerItem,
                    stattip: tipText
                });
            }
        }

        if (typeof Mustache !== 'undefined') {
            var renderedHtml = Mustache.render(_template, templateData);
            $_container.append(renderedHtml);
        } else {
            console.error("Mustache 库未加载！");
        }
    }

    function finish() {
        if (error) {
            $_mainstatus.html('<i class="glyphicon glyphicon-remove-circle"></i> 发生错误');
            $('#stattip-err').removeClass('hide');
            $('#stattip-ok, #stattip-load').addClass('hide');
        } else {
            $_mainstatus.html('<i class="glyphicon glyphicon-ok-circle"></i> 全部正常');
            $('#stattip-ok').removeClass('hide');
            $('#stattip-err, #stattip-load').addClass('hide');
        }

        _start = Date.now();
        $_lastUpdate.html('<i class="glyphicon glyphicon-time"></i> ' + new Date().toLocaleString());

        if ($.fn.tooltip) {
            $('[data-toggle="tooltip"]').tooltip({
                html: false,
                container: 'body'
            });
        }

        clearInterval(_intervalId);
        _intervalId = setInterval(countdown, 1000);
    }

    function countdown() {
        var left = _refresh - Math.round((Date.now() - _start) / 1000);

        if (left <= 0) {
            clearInterval(_intervalId);
            init();
        }
    }

    return {
        init: init
    };

})(jQuery);
