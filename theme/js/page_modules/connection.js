import {player} from '../script.js';
import {saveCookie} from '../utils.js';
import * as HOME from './home-menu.js';

const bindEvents = () => {
    // focus input to write username
    $('#connexion div').on('click', function() {
        $(this).addClass('active');
        $(this).children('input').focus();
    });

    // blur username input
    $('#connexion input').on('blur', function() {
        if(!/\S+/.test(this.value)) {
            $(this).val('');
            $(this).parent().removeClass('active');
        }
    });

    // check if we enable or disable the button to login, following what he wrote
    $('#connexion input').on('keyup', function(e) {
        if($(this).val().length > 2 && $(this).val().length < 17 && $(this).val().replace(/\s/g, '') != '') {
            $('#connexion button').prop('disabled', false);
        } else {
            $('#connexion button').prop('disabled', true);
        }

        if(e.key == 'Enter' && !$('#connexion button').prop('disabled')) {
            $('#connexion button').click();
        }
    });

    // connect
    $('#connexion button').on('click', async function() {
        $(this).prop('disabled', true);

        let isOk = await player.createUser($('#connexion input').val());

        if(isOk) {
            saveCookie(player);

            unbindEvents();
            HOME.bindEvents();

            $('#connexion').fadeOut(200);
            $('#menu-home').delay(200).fadeIn(200);

            $('#player-banner span').text($('#connexion input').val());
        }
    });
};

const unbindEvents = () => {
    $('#connexion div').off('click');
    $('#connexion input').off('blur');
    $('#connexion input').off('keyup');
    $('#connexion button').off('click');
};

export {bindEvents};