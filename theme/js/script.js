// global vars
let cookie = parseCookies();
let player = {};
const minFamilyN = 7;

// database
import {Player} from './player.js';

// import utils
import {parseCookies, setBackground} from './utils.js';


// import for each section
import * as GENERAL     from './page_modules/general.js';
import * as CONNECTION  from './page_modules/connection.js';
import * as HOME        from './page_modules/home-menu.js';
import * as LOBBY       from './page_modules/lobby.js';
import * as GAME        from './page_modules/game.js';



window.onload = async function() {
    $('#loadScreen').fadeIn(200);

    // -- check if user already logged --

    // not logged - starts new session
    if($.isEmptyObject(cookie)) {
        $('#connexion').show(0);
        player = new Player();

        // reset the username input field
        $('#connexion input').val('');

        CONNECTION.bindEvents();

    }
    
    // logged
    else {
        player = new Player(cookie);
        await player.recoverUserData();

        $('#player-banner span').text(player.username);




        // INGAME
        if(player.ingame) {

            GAME.bindEvents();

            GAME.retrieveGame(player.ingame, minFamilyN).then(exists => {

                if(!exists) {

                    player.ingame = false;
                    player.database.ref(`/players/${player.id}/ingame`).set(player.ingame);

                    $('#menu-home').fadeIn(200);
                    HOME.bindEvents();

                    $('#loadScreen').fadeOut(200);

                } else {

                    $('#game').fadeIn(0);
                    $('#popup-box').css('top', '-100px');
                    $('footer').css('bottom', '-150px');

                }
            });


        }


        // IN A LOBBY
        else if(player.lobby || player.hosting) {
            let id = player.hosting ? player.id : player.lobby;
            let lob = await player.get(`/lobbies/${id}`);

            if(player.hosting) {
                // hosting the lobby
                LOBBY.bindLobbyChanges(player.id);
                $('#lobby #player-banner').addClass('host');

            } else {
                // joined a lobby

                LOBBY.bindLobbyChanges(player.lobby);
                $('#lobby').addClass('not-hosting');
                $('#player-banner-2').addClass('host').children('span').text(lob.host.name);
            }

            LOBBY.verifyMembers(lob.participants);

            $('#lobby').fadeIn(200);
            $('footer').css('bottom', '-150px');
            setBackground('lol_fond');

            LOBBY.bindEvents();

        }
        

        
        // DEFAULT MENU
        else {
            // else he was on the home menu or in the research section
            $('#menu-home').fadeIn(200);

            HOME.bindEvents();
        
        }
    }
    //


    $('#loadScreen').delay(500).fadeOut(200);


    // -- listener --
    
    GENERAL.bindEvents();

    //
};

export {player, minFamilyN};