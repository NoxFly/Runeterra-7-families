import {player} from '../script.js';
import * as HOME from './home.js';
import {changeSection} from '../utils.js';



/**
 * BIND EVENTS OF THE CONNECTION SECTION
 */
const bindEvents = () => {



    // focus input to write username
    $('body').on('click', '#connection div', function() {
        $(this).addClass('active');
        $(this).children('input').focus();
    });





    // blur username input
    $('body').on('blur', '#connection input', function() {
        if(!/\S+/.test(this.value)) {
            $(this).val('');
            $(this).parent().removeClass('active');
        }
    });





    // check if we enable or disable the button to login, following what he wrote
    $('body').on('keyup', '#connection input', function(e) {
        let val = $(this).val();
        if(val.length > 2 && val.length < 17) {
            $('#connection button').prop('disabled', false);
        } else {
            $('#connection button').prop('disabled', true);
        }

        if(e.key == 'Enter' && !$('#connection button').prop('disabled')) {
            $('#connection button').click();
        }
    });





    // when we focus the input to write our username
    $('body').on('focus', '#connection input', function() {
        $(this).parent().addClass('active');
    });






    // connect
    $('body').on('click', '#connection button', async function() {
        $(this).prop('disabled', true);
        let val = $('#connection input').val().trim();

        let canRegister = false;
        if(val.length > 2 && val.length < 17) {
            canRegister = true;
        }

        if(!canRegister) return;

        let isOk = await player.createUser(val);

        if(isOk) {
            unbindEvents();
            HOME.bindEvents();

            changeSection('home');
        }
    });





};



/**
 * UNBIND EVENTS OF THE CONNECTION SECTION
 */
const unbindEvents = () => {
    $('#connection div').off('click');
    $('#connection input').off('blur');
    $('#connection input').off('keyup');
    $('#connection input').off('focus');
    $('#connection button').off('click');
};



export {bindEvents};