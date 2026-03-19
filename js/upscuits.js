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
        // 获取 Mustache 模板内容
        _template = $('#server-template').html();
        $_container = $('#server-container').html('');
        $_mainstatus = $('#maintitle').html('<i class="glyphicon glyphicon-fire"></i> 加载中...');
        
        $_mainstatusSyle = $("#mianstdiv").css("background", 'linear-gradient(#f0ffb6, #98a8a0)'); 
        $_servertitle = $('#server-title').html('');
        $_lastUpdate = $('#last-update');
        
        getServerinfo();
        
        // 渲染表头日期
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

    function changeServerInfo(content){
        var $_serverinfo = $('#serverinfo').html('');
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
                        strHtml += "<h4>数据库: <span class=\"label label-danger\"><i class=\"glyphicon glyphicon-remove\"></i> 错误</span></h4>";
                        changeStatus("error");
                        break;
                    default:
                        strHtml += "<h4>数据库: <span class=\"label label-primary\"><i class=\"glyphicon glyphicon-warning-sign\"></i> 无法读取</span></h4>";
                        changeStatus("error");
                }
                strHtml += "<hr><h4><span class=\"label label-info\">更新时间: "+data.last_update+"</span></h4>";
                changeServerInfo(strHtml);
             },
             error: function(){
                 changeServerInfo("<h4><span class=\"label label-warning\">监控探针读取失败</span></h4>");
             }
         });
    }

    function changeStatus(status){
        switch (status) {
            case "error":
                $_mainstatus.html('<i class="glyphicon glyphicon-ok-circle"></i> 不太好');
                $_mainstatusSyle.css("background", 'linear-gradient(red, #ffb6b6)');
                break;
            case "normal":
                $_mainstatus.html('<i class="glyphicon glyphicon-ok-circle"></i> 正常');
                $_mainstatusSyle.css("background", "");
                break;
            default:
                $_mainstatus.html('<i class="glyphicon glyphicon-ok-circle"></i> Hello!');
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
                console.error("Error: " + errorMsg);
                error = true;
                finish();
            }
        });
    }

    function placeServer(data) {
        // 1. 初始化基础状态数据
        var templateData = {
            alert: "",
            label: "default",
            statusicon: "question-sign",
            statustxt: "未知",
            friendlyname: data.friendly_name, // API字段与模板字段映射
            charts: [],
            progress: []
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
        }
        
        // 2. 解析 uptime 比例数据并填充 charts 和 progress 数组
        if (data.custom_uptime_ratio) {
            var ratios = data.custom_uptime_ratio.split('-');
            var widthPerItem = (100 / ratios.length).toFixed(3); // 计算进度条每段的宽度百分比

            for (var i = 0; i < ratios.length; i++) {
                var ratioValue = parseFloat(ratios[i]);
                var uptype = "success";
                var upsign = "ok-circle";

                if (data.status === 0 || data.status === 1) {
                    uptype = "default";
                    upsign = "question-sign";
                } else if (ratioValue < 100 && ratioValue > 0) {
                    uptype = "warning";
                    upsign = "info-sign";
                } else if (ratioValue === 0) {
                    uptype = "danger";
                    upsign = "remove-circle";
                }

                // 填充给模板的 {{#charts}} 循环
                templateData.charts.push({
                    uptype: uptype,
                    uptime: "可用率: " + ratioValue + "%",
                    upsign: upsign
                });

                // 填充给模板的 {{#progress}} 循环
                templateData.progress.push({
                    types: uptype,
                    len: widthPerItem,
                    stattip: "可用率: " + ratioValue + "%"
                });
            }
        }

        // 3. 呼叫 Mustache 引擎渲染 HTML
        var renderedHtml = Mustache.render(_template, templateData);
        
        // 4. 追加到页面
        $_container.append(renderedHtml);
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
        
        // 激活 Bootstrap 的 tooltip 悬浮提示
        $('[data-toggle="tooltip"]').tooltip();

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
