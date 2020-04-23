let lastPopup = null;

const bindEvents = () => {
    // open / close a popup at the top-left screen corner
    $('#popup-box div').click(function() {
        let popup = $(this).offset().left;

        if(popup == lastPopup) {
            lastPopup = null;
            $('#popup-infos').removeClass('open');
            $('#popup-hover').css('display', 'none');
        } else {
            lastPopup = popup;
            $('#popup-infos').css('left', (popup+2)+'px').addClass('open');
            $('#popup-infos div').html($(this).data('text'));
            $('#popup-hover').css('display', 'block');
        }
    });

    // close the popup clicking anywhere on the page
    $('#popup-hover').click(function() {
        $(this).css('display', 'none');
        $('#popup-infos').removeClass('open');
        lastPopup = null;
    });

    $('#message-alert div').click(() => {
        $('#message-alert, #hover').fadeOut(0);
    })
};

export {bindEvents};