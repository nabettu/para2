if (($(window).width() / 650) < 1)$("article").css("zoom", ($(window).width() / 650));

$(function() {

    var srcs = [];
    $(".inputfile").on("change", function(evt) {

            var files = evt.target.files;
            if (files.length == 0) return;
            var file = files[0];
            if (!file.type.match(/image/)) {
                alert('画像ファイルを選んでください');
                return;
            }
            if (10240000 < file.size) {
                alert('画像が大きすぎます(10MBまで)');
                return;
            };
            var reader = new FileReader();

            var num = this.id.replace("file", "");

            $("#inputBtn" + num).hide();

            reader.onload = function(evt) {
                srcs.push(reader.result);
                if (srcs.length == 2) fileset(srcs);

                $("#input" + num)[0].src = reader.result;
                $("#input" + num).fadeIn(200);
            }
            reader.readAsDataURL(file);
        })
        //    fileset()
}());

function fileset(srcs) {
    var i = 0;

    var images = srcs.map(function(src) {
        i++;
        var image = new Image();
        image.src = src;
        $(image).on('load', onload);
        return image;
    });

    function onload() {
        i--;
        if (i) {
            return;
        }
        // 画像が全ロードされるまで待つ
        createGIF({
            images: images
        }, function(dataURL) {
            $(".inputArea").delay(1000).addClass("loaded").queue(function() {
                $(".inputArea").hide();
                $("#output").delay(1000).fadeIn(200).attr('src', dataURL);
            });
        });
    };
}
// Array{DOM Image} -> callback(dataURL)
function createGIF(args, callback) {
    var images = args.images || [];

    var option = {
        delay: args.delay || 100, //最速は50
        repeat: args.repeat || 0, // default: auto loop
    };

    var canvas = document.createElement("canvas");
    var context = canvas.getContext('2d');

    //MAXWidthを1000pxに
    if (images[0].width < 1000) {
        option.width = images[0].width;
        option.height = images[0].height;
    } else {
        option.width = 1000;
        option.height = images[0].height * 1000 / images[0].width;
    };

    canvas.width = option.width;
    canvas.height = option.height;

    // GIFは透明にできないから白色で塗る
    context.fillStyle = "rgb(255,255,255)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    var worker = new Worker('js/encoder.js');

    worker.postMessage({
        cmd: 'start',
        data: option
    });

    images.forEach(function(image) {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Workerにフレームのデータを送る
        worker.postMessage({
            cmd: 'frame',
            data: context.getImageData(0, 0, canvas.width, canvas.height).data
        });

        context.fillRect(0, 0, canvas.width, canvas.height);
    });

    worker.postMessage({
        cmd: 'finish'
    });

    worker.onmessage = function(e) {
        callback('data:image/gif;base64,' + encode64(e.data));
    };
}

// from https://github.com/antimatter15/jsgif/blob/master/Demos/b64.js
function encode64(input) {
    var output = "",
        i = 0,
        l = input.length,
        key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    while (i < l) {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);
        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;
        if (isNaN(chr2)) enc3 = enc4 = 64;
        else if (isNaN(chr3)) enc4 = 64;
        output = output + key.charAt(enc1) + key.charAt(enc2) + key.charAt(enc3) + key.charAt(enc4);
    }
    return output;
}
