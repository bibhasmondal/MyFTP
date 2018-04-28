class FTP {
    constructor(url) {
        this.url = url;
        this.downloadId = 0;
        this.parentPath=[];
        $('ftp').html(
            '<div style="position:absolute;top:5px;right:0">' +
            '<a id="downloadButton" href="#">' +
            '<i class="material-icons" style="font-size:20px">file_download</i>' +
            '</a>' +
            '</div>' +
            '<div id="ftpDownload" style="top:25px;transition:0.5s;width:350px;height:0px;overflow:auto;position:absolute;background-color:#e0e0de;right:0;border-radius:5px">' +
            '</div>' +
            '<div id="ftpContent" style="height:100%" class="col-sm-12">' +
            '<div id="ftpHeader"></div>'+

            '<table style="width:100%">'+
                '<thead style="background-color:yellow">'+
                    '<tr id="theader">'+
                        '<th style="width:70%" onclick="javascript:sortTable(0);"><b style="font-size:20px">Name</b></th>'+
                        '<th style="width:10%" onclick="javascript:sortTable(1);">Size</th>'+
                        '<th style="width:20%" onclick="javascript:sortTable(2);">Last Modified</th>'+
                    '</tr>'+
                '</thead>'+
                '<tbody id="tbody">'+
                '</tbody>'+
            '</table>'+

            '</div>'+
            '<menu type = "context" id = "mymenu">'+
            '<menuitem label="Refresh" onclick="window.location.reload();" icon="ico_reload.png"></menuitem>'+
            '<menu label="Share on...">'+
                '<menuitem label="Twitter" icon="ico_twitter.png" onclick="window.open("//twitter.com/intent/tweet?text="' + window.location.href+'");"></menuitem>'+
                '<menuitem label="Facebook" icon="ico_facebook.png" onclick="window.open("//facebook.com/sharer/sharer.php?u="' + window.location.href+'");"></menuitem>'+
            '</menu>'+
            '</menu>');
        $('#downloadButton').click(function () {
            if (ftpDownload.style.height == "0px") {
                ftpDownload.style.height = "450px";
            }
            else {
                ftpDownload.style.height = "0px"
            }
        });        
    }
    getContent(path,contentType) {        
        function downloadHTML(value, speed) {
            var html = '<div class = "progress" style="margin-bottom:10px">'
            if (speed) {
                if (speed >= 1024) {
                    html += '<label style="position:absolute;color:black;left:15px">' + (speed / 1024).toFixed(2) + ' Mbps</label>'
                } else {
                    html += '<label style="position:absolute;color:black;left:15px">' + speed + ' Kbps</label>'
                }
            }
            html += '<label style="position:absolute;color:black;right:15px">' + value + '%</label>' +
                '<div class = "progress-bar" role = "progressbar" aria-valuenow = "' + value + '" aria-valuemin = "0" aria-valuemax = "100" style = "width:' + value + '%">' +
                '</div>' +
                '</div>'
            return html;
        }
        function b64ToUint8Array(b64Data) {
            var byteSlice = atob(b64Data);
            chunkSize = byteSlice.length;
            var byteNumbers = new Array(byteSlice.length);
            for (var i = 0; i < byteSlice.length; i++) {
                byteNumbers[i] = byteSlice.charCodeAt(i);
            }
            return new Uint8Array(byteNumbers);
        }
        function destroyClickedElement(event) {
            document.body.removeChild(event.target);
        }
        function saveAsFile(url, fileName) {
            var downloadLink = document.createElement('a');
            downloadLink.download = fileName;
            downloadLink.innerHTML = fileName;
            downloadLink.href = url;
            downloadLink.onclick = destroyClickedElement;
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink);
            downloadLink.click();
        }
        
        var parentPath;
        if (contentType =='dir'){
            this.parentPath.push(path);
        }        
        if (contentType == 'up') {
            this.parentPath.pop();
        }
        console.log(this.parentPath);
        if (typeof this.parentPath[this.parentPath.length - 2] !== 'undefined') {
            parentPath = this.parentPath[this.parentPath.length - 2];
        }
        else{
            parentPath = '';
        }
        var byteArrays = [];
        var fileSize;
        var fileName;
        var fileId;
        var startTime;
        var endTime;
        var speed;
        var chunkSize;
        var newPage;
        var currentDownloaded;
        var ws = new WebSocket(this.url);
        ws.onopen = function (e) {
            newPage = true;
            ws.send(path)
            //console.log(e)
        };
        ws.onmessage = function (e) {
            if (contentType == 'file') {
                if (JSON.parse(e.data).message == 'start') {
                    startTime = new Date().getTime()
                    fileSize = JSON.parse(e.data).fileSize
                    fileName = JSON.parse(e.data).fileName
                    fileId = JSON.parse(e.data).fileId
                    $('#ftpDownload').append('<label style="padding-left:10px;font-size:15px">' + fileName + '</label><div id="' + fileId + '" class="container-fluid">' + downloadHTML(0) + '</div>');
                }
                else if (JSON.parse(e.data).message == 'finish') {
                    var file = new File(byteArrays, fileName, { type: JSON.parse(e.data).mime, lastModified: Date.now() });
                    if (JSON.parse(e.data).isReadable) {
                        window.open(URL.createObjectURL(file));
                        //$('#ftpContent').html('<iframe frameborder="0" style="overflow:hidden;overflow-x:hidden;overflow-y:hidden;height:100%;width:100%;position:absolute;top:30px;left:0px;right:0px;bottom:0px" height="100%" width="100%" src="' + URL.createObjectURL(file) + '"></iframe>');
                    }
                    else {
                        //saveAsFile(URL.createObjectURL(file), JSON.parse(e.data).fileName);
                    }
                    ws.close()
                }
                else {
                    byteArrays.push(b64ToUint8Array(JSON.parse(e.data).message));
                    currentDownloaded = JSON.parse(e.data).currentDownloaded
                    endTime = new Date().getTime()
                    speed = (chunkSize / 1024) / ((endTime - startTime) / 1000)
                    startTime = endTime
                    $('#' + fileId).html(downloadHTML(currentDownloaded, Math.round(speed)));
                }
            }
            if (contentType == 'dir' || contentType=='up') {
                if (newPage) {
                    newPage = false;
                    $('#tbody').html('');
                    $('#ftpHeader').html('<h1 style="margin-top:-20px"><b>Index of ' + path + '</b></h1><div class="col-sm-12 row" style="padding-bottom:20px"><b><a class="up" contextmenu="mymenu" style="padding-left:20px" href="' + parentPath + '">[parent directory]</a></b></div>');
                }
                $('#tbody').append('<tr><th style="width:70%"><a class="' + JSON.parse(e.data).class + '" contextmenu="mymenu" style="padding-left:20px" href="' + path + '/' + JSON.parse(e.data).message + '">' + JSON.parse(e.data).message + '</a></th><th style="width:10%">' + JSON.parse(e.data).size + '</th><th style="width:20%">' + JSON.parse(e.data).lastModified +'</th>');

            }
            //console.log(e);
        };
        ws.onclose = function (e) {
            //console.log(e);
        };
        ws.onerror = function (e) {
            //console.log(e);
        };
    }
}
$(document).ready(function () {
    if ($('ftp').length > 0) {
        var address = $('ftp').attr('address');
        if (typeof address !== 'undefined') {
            if (address) {
                var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
                var ftp = new FTP(ws_scheme + "://" + address.replace(new RegExp('ws+:/+', 'g'), ""));
                var path = $('ftp').attr('path');
                if (typeof path !== 'undefined') {                    
                    if (path) {
                        var contentType = $('ftp').attr('type')
                        if (typeof contentType !== 'undefined') {
                            if (contentType) {
                                ftp.getContent(path,contentType);
                                $('#ftpContent').click(function (e) {
                                    e.preventDefault();
                                    if ($(e.target).attr('href')) {
                                        ftp.getContent($(e.target).attr('href'), $(e.target).attr('class'));
                                    }
                                });
                            }
                            else{
                                //valid content type
                            }
                        }
                        else{
                            //add type attr
                        }
                    }
                    else {
                        //valid path
                    }
                }
                else {
                    //add path attr
                }
            }
            else {
                //valid value
            }
        }
        else {
            //add attr
        }
    }
});