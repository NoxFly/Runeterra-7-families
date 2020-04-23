import {setBackground, removeBackground} from '../utils.js';
import {player} from '../script.js';
import * as LOBBY from './lobby.js';

const bindEvents = () => {
    // stop searching game / lobby
    $('#join-lobby .cancel').on('click', function() {
        stopSearch();
        $('#join-lobby').fadeOut(200);
        removeBackground();
        setTimeout(() => {
            $('#join-lobby article .inner').html('<p>Aucun salon trouvé</p>');
            $('footer').css('bottom', '0');
            $('#menu-home').fadeIn(200);
        }, 200);
    });

    // join lobby
    $('body').on('click', '#join-lobby article div .join-button', function() {
        let hoster = {
            name: $(this).parent().text().replace(/(.*)\s+\(\d\/\d\).*$/, '$1'),
            id: $(this).parent().attr('data-hostid')
        };
        let n = parseInt($(this).parent().text().replace(/.*\s*\((\d)\/\d\).*$/, '$1'));

        stopSearch();

        player.joinLobby(hoster, n, lobby => {
            LOBBY.bindEvents();
            LOBBY.bindLobbyChanges(hoster.id);
            
            // disable things that is only for lobby hoster
            $('#lobby').addClass('not-hosting');

            $(`#lobby #player-banner span`).text(player.username);
            $('#lobby #player-banner-2').addClass('host');

            for(let i=2; i<=n+1; i++) {
                $(`#lobby #player-banner-${i} span`).text(lobby[Object.keys(lobby)[i-2]].name);
                $(`#lobby #player-banner-${i}`).css('opacity', 1);
            }


            $('#join-lobby').fadeOut(200);
            setBackground('lol_fond');
            $('#lobby').fadeIn(200);
            $('#join-lobby article .inner').html('<p>Aucun salon trouvé</p>');
        });
    });
};

const unbindEvents = () => {
    $('#join-lobby .cancel').off('click');
    $('body').off('click', '#join-lobby article div .join-button');
};



const searchLobbies = () => {
    player.getLobbies((lobby, type) => {
        if(!lobby) return; // remove the "default: false"
        let n = Object.keys(lobby.participants).length;

        // someone created a lobby
        if(type == 'add') {
            if(lobby && typeof lobby == 'object') { // != false
                if(n < 5) { // doesn't show full lobbies
                    let div = $('<div>');
                    div.html(`<span class='details'>${lobby.host.name} (${n}/5)</span>`).append($('<span class="join-button">')).attr('data-hostid', lobby.host.id);
                    $('#join-lobby article .inner p').fadeOut(0);
                    $('#join-lobby article .inner').append(div);
                }
            }
        }

        // someone removed a lobby
        else if(type == 'remove') {
            $(`#join-lobby article .inner div[data-hostid='${lobby.host.id}']`).remove();
            if($('#join-lobby article .inner div').length == 0) $('#join-lobby article .inner p').fadeIn(0);
        }
        
        // a user has joined / left a lobby
        else {
            let div = $(`#join-lobby article .inner div[data-hostid='${lobby.host.id}']`);
            if(n == 5) div.fadeOut(0);
            else div.fadeIn(0).children('.details').text(`${lobby.host.name} (${n}/5)`);
        }
    });
};

const stopSearch = () => {
    player.stopSearchLobbies();
};

export {bindEvents, searchLobbies, stopSearch};