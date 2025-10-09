$(function () {
    $('#btnTest').on('click', function () {
        $('#dialog').dialog({ modal: true, width: 400 });
    });

    // Close collapsed menu after clicking a link (mobile)
    $('.navbar-collapse a').on('click', function () {
        if ($('.navbar-toggle').is(':visible')) {
        $('.navbar-collapse').collapse('hide');
        }
    });

    // Footer year
    $('#year').text(new Date().getFullYear());
});