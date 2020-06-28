import {setBackground, removeBackground, changeSection, setBackgroundBrightness} from '../utils.js';
import {player} from '../script.js';
import * as LOBBY from './lobby.js';


/**
 * BIND EVENTS OF THE SEARCH-LOBBY SECTION
 */
const bindEvents = () => {

    // stop searching game / lobby
    $('body').on('click', '#research .cancel', function() {
        stopSearch();
        

        changeSection('home', () => {
            setBackgroundBrightness(0);
            removeBackground();
            $('footer').css('bottom', '0');
        });
    
    });



    // join lobby
    $('body').on('click', '#research article div .join-button', function() {
        unbindEvents();
        
        let hoster = {
            name: $(this).parent().text().replace(/(.*)\s+\(\d\/\d\).*$/, '$1'),
            id: $(this).parent().attr('data-hostid')
        };
        let n = parseInt($(this).parent().text().replace(/.*\s*\((\d)\/\d\).*$/, '$1'));

        stopSearch();

        player.joinLobby(hoster, n, lobby => {
            LOBBY.bindEvents();
            LOBBY.bindLobbyChanges(hoster.id);

                        
            changeSection('lobby', () => {
                setBackground('lol_fond');
                setBackgroundBrightness(0);

                // disable things that is only for lobby hoster
                $('#lobby').addClass('not-hosting');

                $(`#lobby #player-banner span`).text(player.username);
                $('#lobby #player-banner-2').addClass('host');

                for(let i=2; i<=n+1; i++) {
                    $(`#lobby #player-banner-${i} span`).text(lobby[Object.keys(lobby)[i-2]].name);
                    $(`#lobby #player-banner-${i}`).css('opacity', 1);
                }

            });
            
            
        });
    });

};




/**
 * UNBIND EVENTS OF THE SEARCH-LOBBY SECTION
 */
const unbindEvents = () => {
    $('#research .cancel').off('click');
    $('body').off('click', '#research article div .join-button');
};






/**
 * CHECK CREATION / DELETION / CHANGES OF LOBBIES
 */
const searchLobbies = () => {
    player.getLobbies((lobby, type) => {
        if(!lobby) return; // remove the "default: false"
        let n = Object.keys(lobby.participants).length;
        
        // someone created a lobby
        if(type == 'add') {
            if(typeof lobby == 'object') { // != false
                if(n < 5) { // doesn't show full lobbies
                    let div = $('<div>');

                    let summonerIcon = $('<span>');
                    summonerIcon.addClass('summonerIcon');

                    let summonerName = $('<span>');
                    summonerName.addClass('summonerName');
                    summonerName.text(lobby.host.name);

                    let lobbyParticipantsNumber = $('<span>');
                    lobbyParticipantsNumber.addClass('lobbyNP');
                    lobbyParticipantsNumber.text(`(${n}/5)`);

                    div
                        .append(summonerIcon)
                        .append(summonerName)
                        .append(lobbyParticipantsNumber)
                        .append($('<span class="join-button">')).attr('data-hostid', lobby.host.id);

                    $('#research article .inner p').fadeOut(0);
                    $('#research article .inner').append(div);
                }
            }
        }

        // someone removed a lobby
        else if(type == 'remove') {
            $(`#research article .inner div[data-hostid='${lobby.host.id}']`).remove();
            if($('#research article .inner div').length == 0) $('#research article .inner p').fadeIn(0);
        }
        
        // a user has joined / left a lobby
        else {
            let div = $(`#research article .inner div[data-hostid='${lobby.host.id}']`);
            if(n == 5) div.fadeOut(0);
            else div.fadeIn(0).children('.lobbyNP').text(`(${n}/5)`);
        }
    });
};




/**
 * UNBIND EVENTS OF SEARCHING LOBBIES
 */
const stopSearch = () => {
    player.stopSearchLobbies();
};




export {bindEvents, searchLobbies, stopSearch};