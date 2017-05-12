
var logActive = 0;   // logging activity flag

/** highlight menu item */
function highlightMenuItem() {
    $('#myNavbar>ul li').removeClass('active');
    var wpath = window.location.pathname, res = 0;
    $('#myNavbar>ul li a').each(function(){
        var ppath = $(this).attr('href');
        if (wpath.indexOf(ppath) > -1 && ppath.length > 1) {
            res += 1;
            $(this).parent().addClass('active');
        }
    });
    if (res == 0) {
        $('#myNavbar>ul li:first').addClass('active');
    }

    logActive = 0;   // logging activity flag
}