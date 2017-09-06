
var logActive = 0	// logging activity flag
    , socket = null;	// connection to nodejs

/** highlight menu item */
function highlightMenuItem() {
    $('#myNavbar>ul li').removeClass('active');
    var wpath = window.location.pathname, res = 0;
    $('#myNavbar>ul li a').each(function(){
        var ppath = $(this).attr('href');
        if (wpath.indexOf(ppath) > -1 && ppath.length > 1 && wpath.substring(1) === ppath) {
            res += 1;
            $(this).parent().addClass('active');
        }
    });
    if (res == 0) {
        if (wpath.indexOf('login') < 0) $('#myNavbar ul:first li:first').addClass('active');
	else $('#myNavbar ul:last li:first').addClass('active');
    }

    logActive = 0;   // logging activity flag
    if (socket != null) {
	socket.disconnect();
	socket = null;
    }
}

/** select content for Copy&Paste */
function selectText(element) {
    var doc = document
        , text = doc.getElementById(element)
        , range, selection;

    if (doc.body.createTextRange) {
        range = doc.body.createTextRange();
        range.moveToElementText(text);
        range.select();
    } else
    if (window.getSelection) {
        selection = window.getSelection();
        range = doc.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}


/** --- PROTOTYPES --- */
if (!Array.prototype.find) {
    Array.prototype.find = function (callback, thisArg) {
        "use strict";
        var arr = this,
            arrLen = arr.length,
            i;
        for (i = 0; i < arrLen; i += 1) {
            if (callback.call(thisArg, arr[i], i, arr)) {
                return arr[i];
            }
        }
        return undefined;
    };
}
