window.myApp = window.myApp || {};
myApp.dashboard = (function($) {
    var _template = "", 
        _intervalId = 0, 
        _start = Date.now(), 
        _refresh = ((typeof (__refresh) == "number") ? __refresh : 300), 
        $_container = {}, 
        $_mainstatus = {}, // 修复：补充声明
        $_mainstatusSyle = {}, // 修复：补充声明
        $_lastUpdate = {}, 
        $_servertitle = {}, 
        showarr = [], 
        tmpdate, 
        datestr = "", 
        error = false;
    
    function init() {
        _start = Date.now();
        _template = $('#server-template').html();
        $_container = $('#server-container').html('');
        $_mainstatus = $('#maintitle').html('<i class="glyphicon glyphicon-fire"></i> 加载中...');
        
        // 修复：移除 css 值末尾的非法分号
        $_mainstatusSyle = $("#mianstdiv").css("background", 'linear-gradient(#f0ffb6, #98a8a0)'); 
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
        
        // 修复：因为不需要 ids 参数且一次性返回所有数据，直接调用一次即可
        getUptime();
    }

    function changeServerInfo(content){
        // 修复：添加 var 防止变量泄露到全局
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
            url: "https://data.666so.cn/api/uptimebot/", // 移除 ids 参数依赖
            dataType: "json",
            success: function(response) {
                if (response && response.monitors) {
                    for (var i = 0; i < response.monitors.length; i++) {
                        placeServer(response.monitors[i]);
                    }
                }
                // 所有数据处理完毕后结束加载状态
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
        data.alert = "";
        switch (parseInt(data.status, 10)) {
            case 0:
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
            case 9:
                data.statustxt = "异常";
                data.statusicon = "remove"; // 更换为更醒目的图标
                data.label = "danger";
                data.alert = "danger";
                error = true;
                break;
        }
        
        var $tpl = $(_template),
            $badge = $tpl.find('.badge'),
            $log = $tpl.find('.log'),
            $panel = $tpl.find('.panel-body');
        
        $tpl.find('.panel-heading').addClass('panel-' + data.label);
        $tpl.find('.panel-title').html(data.friendly_name);
        $tpl.find('.uptime').html('<i class="glyphicon glyphicon-' + data.statusicon + '"></i> ' + data.statustxt);
        $tpl.find('.uptime').addClass('label-' + data.label);
        
        // 修复：由于没有 data.log，改为解析 custom_uptime_ratio 生成状态条
        // 例如："100.000-100.000-100.000-100.000-100.000-100.000-100.000-99.988"
        if (data.custom_uptime_ratio) {
            var ratios = data.custom_uptime_ratio.split('-');
            for (var f = 0; f < ratios.length; f++) {
                var ratioValue = parseFloat(ratios[f]);
                var bgClass = "bg-success"; // 默认绿色
                
                if (data.status === 0 || data.status === 1) {
                    bgClass = "bg-default"; // 灰色：未知状态
                } else if (ratioValue < 100 && ratioValue > 0) {
                    bgClass = "bg-warning"; // 黄色：有过掉线
                } else if (ratioValue === 0) {
                    bgClass = "bg-danger"; // 红色：完全掉线
                }

                // 统一使用 col-xs-1（可能需要你根据前端排版在 CSS 中微调宽度）
                $panel.append('<div class="col-xs-1 ' + bgClass + '" title="可用率: ' + ratioValue + '%"></div>');
            }
        }

        // 处理日志区域：由于 API 未返回具体日志条目，这里清空或给个提示
        $log.html('<tr><td colspan="3" class="text-center text-muted">暂无详细告警日志</td></tr>');
        
        // 底部显示目标 URL
        $tpl.find('.panel-footer').html(data.url);
        
        $_container.append($tpl);
        showarr.push($tpl);
    }

    function finish() {
        if (error) {
            $_mainstatus.html('<i class="glyphicon glyphicon-remove-circle"></i> 发生错误');
            $_mainstatusSyle.css("background", 'linear-gradient(red, #ffb6b6)');
        } else {
            $_mainstatus.html('<i class="glyphicon glyphicon-ok-circle"></i> 全部正常');
            $_mainstatusSyle.css("background", "");
        }
        _start = Date.now();
        $_lastUpdate.html('<i class="glyphicon glyphicon-time"></i> 最后更新: ' + new Date().toLocaleString());
        
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

jQuery(myApp.dashboard.init); // 修复：这里直接传入函数引用即可，不要加 () 执行它
