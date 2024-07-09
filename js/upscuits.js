window.myApp = window.myApp || {};
myApp.dashboard = (function($) {
    var _template = "", _loaded = 0, _intervalId = 0, _start = Date.now(), _refresh = ((typeof (__refresh) == "number") ? __refresh : 300), $_container = {}, //$_prograss = {},
    //$_countdown = {},
    $_lastUpdate = {}, $_servertitle = {}, showarr = [], tmpdate, datestr = "", error = false;
    
    function init() {
        _start = Date.now();
        _template = $('#server-template').html();
        $_container = $('#server-container').html('');
        $_mainstatus = $('#maintitle').html('<i class="glyphicon glyphicon-fire"></i> 加载中...');
        $_mainstatusSyle = $("#mianstdiv").css("background",'linear-gradient(#f0ffb6, #98a8a0);');
        $_servertitle = $('#server-title').html('');
        //$_prograss = $('.loading');
        //$_countdown = $('.countdown');
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
            getUptime(i);
        }
        _intervalId = setInterval(countdown, 1000);
    }

    function changeServerInfo(content){
        $_serverinfo = $('#serverinfo').html('');
        $_serverinfo.append(content);
    }

    function getServerinfo(){
        var strHtml ="";
        $.ajax({
            type: "GET",
            url: "https://www.666so.cn/status.html",
            dataType: "jsonp",
            jsonp: "callback",
            jsonpCallback: "serverinfo",
            success: function(data){
                strHtml += "<h4>随机存取存储器: "+data.ram+"</h4>";
                switch(data.phpfpm){
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
                switch(data.mysql){
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
                strHtml += "<hr><h4><span class=\"label label-info\">"+data.last_update+"</span></h5>";
                changeServerInfo(strHtml);
             },
             error: function(){
                 changeServerInfo("<h1><i class=\"glyphicon glyphicon-ok\"></i> 正常</h1>");
             }
         });
    }

    function changeStatus(status){
        switch (status) {
            case "error":
                $_mainstatus.html('<i class="glyphicon glyphicon-ok-circle"></i> 不太好');
                $_mainstatusSyle.css("background",'linear-gradient(red, #ffb6b6);');
                break;
            case "normal":
                $_mainstatus.html('<i class="glyphicon glyphicon-ok-circle"></i> 正常');
                $_mainstatusSyle.css("background","");
                break;
            default:
                $_mainstatus.html('<i class="glyphicon glyphicon-ok-circle"></i> Hello!');
                $_mainstatusSyle.css("background",'linear-gradient(#f0ffb6, #98a8a0);');
                break;
        }
    }

    function getUptime(ids) {
        $.ajax({
            type: "GET",
            url: "https://data.666so.cn/api/uptimebot/", 
            dataType: "json",
            success: function(response) {
                for (var item in response.monitors) {
                    placeServer(response.monitors[item], ids);
                }
            },
            error: function(xhr, status, error) {
                console.error("Error: " + error);
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
        
        var lastMonth = Date.parse('-1month');
        for (var i in data.log) {
            var log = data.log[i]
              , dateTime = Date.parse(log.datetime.replace(/\/(\d\d) /, '/20$1 '));
            if (dateTime < lastMonth) {
                data.log.splice(i, i + 1);
            } else {
                data.log[i].datetime = dateTime;
            }
        }
        data.log = $.merge([], data.log);
        
        var endtime, endtype, starttime, starttype, fintime, period, fin = [], lastlen = 1;
        period = 86400000 * 1;
        endtime = Date.parse(new Date().toString());
        fintime = endtime - period;
        starttime = fintime;
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
                left: fintime,
                right: endtime
            })
        } else {
            for (var r = 0; r < data.log.length; r++) {
                starttime = data.log[r].datetime;
                if (starttime < fintime) {
                    starttime = fintime;
                }
                endtype = data.log[r].type;
                switch (parseInt(endtype, 10)) {
                case 1:
                    endtype = 1;
                    break;
                case 2:
                    endtype = 0;
                    break;
                }
                if (starttime - endtime < 0) {
                    endtime = starttime;
                    if (starttype == endtype) {
                        lastlen++;
                    } else {
                        fin.push({
                            type: starttype,
                            len: lastlen,
                            left: endtime,
                            right: endtime + period * lastlen
                        });
                        lastlen = 1;
                    }
                } else {
                    endtime = starttime;
                    if (starttype == endtype) {
                        lastlen++;
                    } else {
                        fin.push({
                            type: starttype,
                            len: lastlen,
                            left: endtime,
                            right: endtime + period * lastlen
                        });
                        lastlen = 1;
                    }
                }
                starttype = endtype;
            }
            fin.push({
                type: starttype,
                len: lastlen,
                left: starttime,
                right: endtime
            });
        }
        
        var $tpl = $(_template)
          , $badge = $tpl.find('.badge')
          , $log = $tpl.find('.log')
          , $panel = $tpl.find('.panel-body');
        
        $tpl.find('.panel-heading').addClass('panel-' + data.label);
        $tpl.find('.panel-title').html(data.friendly_name);
        $tpl.find('.uptime').html('<i class="glyphicon glyphicon-' + data.statusicon + '"></i> ' + data.statustxt);
        $tpl.find('.uptime').addClass('label-' + data.label);
        for (var f = 0; f < fin.length; f++) {
            if (!fin[f].len)
                continue;
            $panel.append('<div class="col-xs-' + (fin[f].len < 1 ? 1 : fin[f].len) + ' ' + (fin[f].type ? 'bg-danger' : 'bg-success') + '"></div>');
        }
        for (var i = 0; i < data.log.length; i++) {
            $log.append('<tr><td>' + new Date(data.log[i].datetime).toLocaleString() + '</td><td>' + (data.log[i].type == 2 ? '<span class="label label-success">恢复</span>' : '<span class="label label-danger">异常</span>') + '</td><td>' + data.log[i].duration + '</td></tr>');
        }
        $tpl.find('.panel-footer').html(data.note);
        
        $_container.append($tpl);
        showarr.push($tpl);
        _loaded++;
        if (_loaded == __apiKeys.length) {
            finish();
        }
    }

    function finish() {
        if (error) {
            $_mainstatus.html('<i class="glyphicon glyphicon-remove-circle"></i> 错误');
            $_mainstatusSyle.css("background",'linear-gradient(red, #ffb6b6);');
        } else {
            $_mainstatus.html('<i class="glyphicon glyphicon-ok-circle"></i> 正常');
            $_mainstatusSyle.css("background",'');
        }
        _start = Date.now();
        $_lastUpdate.html('<i class="glyphicon glyphicon-time"></i> 最后更新: ' + new Date().toLocaleString());
        _intervalId = setInterval(countdown, 1000);
    }

    function countdown() {
        var left = _refresh - Math.round((Date.now() - _start) / 1000);
        if (left <= 0) {
            clearInterval(_intervalId);
            init();
        } else {
            //$$_countdown.html(left);
        }
    }

    return {
        init: init
    };

})(jQuery);

jQuery(myApp.dashboard.init());
