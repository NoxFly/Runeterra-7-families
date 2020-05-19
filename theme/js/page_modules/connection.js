import {player} from '../script.js';
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
        let val = $(this).val();
        if(val.length > 2 && val.length < 17) {
            $('#connexion button').prop('disabled', false);
        } else {
            $('#connexion button').prop('disabled', true);
        }

        if(e.key == 'Enter' && !$('#connexion button').prop('disabled')) {
            $('#connexion button').click();
        }
    });

    $('#connexion input').on('focus', function() {
        $(this).parent().addClass('active');
    });

    // connect
    $('#connexion button').on('click', async function() {
        $(this).prop('disabled', true);
        let val = $('#connexion input').val().trim();

        let canRegister = false;
        if(val.length > 2 && val.length < 17) {
            canRegister = true;
        }

        if(!canRegister) return;

        let isOk = await player.createUser(val);

        if(isOk) {
            unbindEvents();
            HOME.bindEvents();

            $('#connexion').fadeOut(200);
            $('#menu-home').delay(200).fadeIn(200);

            $('#player-banner span').text(val);
        }
    });
};

const unbindEvents = () => {
    $('#connexion div').off('click');
    $('#connexion input').off('blur');
    $('#connexion input').off('keyup');
    $('#connexion input').off('focus');
    $('#connexion button').off('click');
};

export {bindEvents};