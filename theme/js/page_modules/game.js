import {families, regions, championRegion, regionName} from '../data/families.js';
import {player, isMobile} from '../script.js';
import * as HOME from './home.js';

// import utils
import {
    setBackground,
    setBackgroundBrightness,
    copy,
    rand,
    formatChampion,
    formatRegion,
    _alert,
    removeBackground,
    isVowel,
    changeSection
} from '../utils.js';





/** @var {Integer} currentBdiv the current bundle we are focusing */
let currentBdiv = 3;

/** @var {Integer} swipeP same as currentBdiv but for smartphone's swipes */
let swipeP = 0;

/** @var {String} currentBundle the name of the region of the current bundle that are showed */
let currentBundle = null;

/** @var {Boolean} changingBundle either the bundle swap animation is processing */
let changingBundle = false;

/** @var {Boolean} bdlClosed either the bundle is closed or not */
let bdlClosed = true;

/** @var {Boolean} bStealing either the animation when stealing a card is processing */
let bStealing = false;

/** @var {Integer} timeChangingBundle time during the player cannot swap to another bundle because of the animation of the previous swap */
let timeChangingBundle = 400;

/** @var {Integer} roundTime time of a round */
let roundTime = 20;

/** @var {Object} selectedCard DOM element of the selected card to be stolen */
let selectedCard;

/** @var {String} selectedChampion champion selected for the stealing */
let selectedChampion = null,

/** @var {String} selectedRegion region of the stolen champion */
    selectedRegion = null,
    
/** @var {Integer} selectedPlayer id of the stolen player */
    selectedPlayer = null;









/**
 * BIND USER EVENTS - UI
 */
const bindEvents = () => {



    // toggle deck pannel
    $('body').on('click', '#close-pannel-bundle', function() {
        $('#pannel-bundle').toggleClass('closed');
        $(this).toggleClass('closed');
        $('#message-center').toggleClass('middle-screen');
    });




    // close the "family completed" popup
    $('body').on('click', '#complete-family > div div', () => {
        $('#family-hover, #complete-family').fadeOut(200);
    });





    // watch region's champions
    // -- LEFT SIDE SCREEN
    $('body').on({
        mouseenter: function() {
            let regionId = $(this).data('family-frame');
            let region = regions[Object.keys(families).indexOf(regionId)];

            $('#popup-region-summary h3').text(region);
            
            $('#popup-region-summary').css({
                top: $(this).offset().top + $(this).height() / 2
            });

            let b = $(this).hasClass('completed');

            // for each champion in this region
            for(let i=0; i<6; i++) {

				let champion = families[regionId][i];
                let el = $(`#popup-region-summary div span:nth-child(${i+1})`);
                
				if(player.bundle.indexOf(champion) !== -1 || b) el.removeClass('disabled');
                else el.addClass('disabled');
                
                el.css('background-image', `url('asset/icon_champions/${regionId}/${formatChampion(champion)}.png')`);

            }

            $('#popup-region-summary').fadeIn(0);
        },
        
        mouseleave: function() {
            $('#popup-region-summary').fadeOut(0);
        }
    }, '.family-frame');




    // chose which champion will be stolen
    $('body').on('click', '#pannel-bundle .card', function() {
        if($(this).hasClass('disabled') && player.current == player.id && !bStealing) {
            // round for this player to steal a champion card he hasn't

            bStealing = true;

            if(selectedCard) selectedCard.fadeIn(200);

            selectedCard = $(this);

            // security - force the deletion of the previous selected card
            $('.stolenCard').remove();
            $('#stealMenu').css('animation', 'hideStealMenu 0 forwards');

            let DOMcard = $(this).clone();

            $(this).fadeOut(200);

            selectedChampion = DOMcard.find('span:nth-child(2)').text();
            
            selectedRegion = formatRegion(championRegion(selectedChampion));
            
            DOMcard.css({
                left: $(this).offset().left,
                top: $(this).offset().top
            });

            DOMcard.addClass('stolenCard').appendTo($('#game')).one('animationend', function() {

                $('#stealMenu').css('animation', 'showStealMenu .2s forwards');

                $(this).removeClass('disabled').css('animation', 'moveLeftStolenCard .2s forwards').one('animationend', function() {
                    setTimeout(() => {
                        bStealing = false;
                    }, 100);
                });

            });
        }
    });

    // chose who will be stolen
    $('body').on('click', '#stealMenu .participant', function() {

        if(player.current != player.id) return;
        
        selectedPlayer = $(this).attr('data-playerid');

        $('#stealMenu').css('animation', 'hideStealMenu .2s forwards');
        $('.stolenCard').css('animation', 'moveRightStolenCard .2s forwards');

        stealChampion();
    });




    // quit the game
    $('body').on('click', '#endofgame div button', () => {
        // unbind the game events
        unbindEvents();

        // return to menu
        HOME.bindEvents();
        $('#endofgame').fadeOut(100);
        $('#game').fadeOut(200);
        $('#home').delay(200).fadeIn(200);

        // clean the game place
        $('#regions-summary, #participants').html('');
        removeBackground();

        changeSection('home');
        setBackgroundBrightness(0);
    });




    /* PC */

	// PC only - keyboard shortcuts
	$(document).on('keyup', function(e) {
        if(!player.ingame) return; // player must be ingame to bind keys
        
		switch(e.key) {
			case 'a': case 'ArrowLeft': previousBundle(); break;
			case 'z': toggleATH(); break;
			case 'e': case 'ArrowRight': nextBundle(); break;
		}
    });

    $('body').on('click', '.family-frame', function() {
        let region = $(this).attr('data-family-frame');
        focusBundle(region);
    });



    /* MOBILES */

    // swap family in the player bundle
    $('body').on('click', '#previous-bundle', () => {rotateBundle(-1);});
    $('body').on('click', '#next-bundle', () => {rotateBundle(1);});

    // same for mobile
    $(document).on('swipeleft', () => {rotateBundle(1)});
    $(document).on('swiperight', () => {rotateBundle(-1)});

    // close bundle - mobile
    $(document).on('swipedown', () => {
        toggleBundle(0);
    });

    // open bundle - mobile
    $(document).on('swipeup', () => {
        toggleBundle(1);
    });

    $('body').on('click', '#close-bundle-phone', () => {
        toggleBundle(0);
    });



};






/**
 * UBIND EVENTS
 */
const unbindEvents = () => {
    $('body').off('mouseenter');
    $('body').off('mouseleave');
    $('#endofgame div button').off('click');
    $(document).off('keyup');
};









/**
 * INITIALIZE THE GAME - CALL DOM & REMOTE INIT
 * @param {Integer} lobbyId the id of the lobby / game
 * @param {Integer} nF number of families in the game
 */
const initializeGame = async function(lobbyId, nF) {
    let participants;

    // dev
    if(player.dev) {
        participants = {
            a: {id: 'a', name: 'Noxfly'},
            b: {id: 'b', name: 'Wind and Clouds'},
            c: {id: 'c', name: 'Farcraft Shadow'},
            d: {id: 'd', name: 'Gobeithio'},
            e: {id: 'e', name: 'Liozara'}
        };
    }

    // normal use
    else {
        participants = copy(await player.get(`/lobbies/${lobbyId}/participants`));
    }
    
    // initialize the remote data
    await initializeRemote(lobbyId, participants, nF).then(function(success) {
        // and if it has been initialized correctly - other users will see game's creation
		if(success) {

            // initialize the DOM
			initializeDOM(participants).then(() => {

                player.bindGameChanges((news, type) => {
                    newsTreatment(news, type);
                });

				$('#lobby').fadeOut(0);
				$('#game').fadeIn(0);
				$('#popup-box').css('top', '-100px');
                $('#loadScreen').delay(500).fadeOut(200);

                let time = 0;

                if(player.id == lobbyId) {
                    time = 2000;
                }

                setTimeout(() => {announceWinner({name: 'noxfly', id: 0})}, 1000);

                /* setTimeout(() => {
                    newCooldown(roundTime);
                }, time); */

            });
            
        }
        
        // else stay on the lobby and show an error message
        else {

			$('#launch').addClass('active');
            $('#loadScreen').delay(1000).fadeOut(200);
            setTimeout(() => {_alert('An error occured');}, 500);
            
		}
	});
};





/**
 * INITIALIZE THE GAME REMOTLY
 * @param {Integer} lobbyId id of the lobby / game that must be created
 * @param {object} participants object of participant's id/name
 * @param {Integer} nF number of families
 */
const initializeRemote = async function(lobbyId, participants, nF) {
	if(player.hosting) {
        return await player.launchGame(participants, nF);
    }
    
    else {

        await getGameDataInf(lobbyId);
		await player.setGameState(true);
        return true;
        
	}
};






/**
 * TRY TO RECOVER THE GAME'S DATA WHILE IT DOES NOT
 * @param {Integer} lobbyId id of the game
 */
const getGameDataInf = async function(lobbyId) {
    if(!(await player.getGameData(lobbyId))) {
        await getGameDataInf(lobbyId);
    }
}






/**
 * INITIALIZE THE GAME DOM ELEMENTS
 * @param {object} players object of player's id/name
 */
const initializeDOM = async function(players) {

    // if it's not the owner of the game, show a message saying it's not his round to play
	if(player.current != player.id) {
        let name = player.participants[player.current].name;
        message(`C'est au tour d${isVowel(name[0])?"'":"e "}${name} de voler un champion`);        
    }
    
    else {
        message(`C'est à ton tour de voler un champion ! Clique sur le champion que tu veux voler`);
        $('#arrow-round').css('background', 'linear-gradient(transparent, rgba(115, 92, 49, 0.5))');
    }


    setBackground(`regions/${Object.keys(families)[rand(0, Object.keys(families).length-1)]}`);
    setBackgroundBrightness(50);

    let familyNames = player.gameFamilies;


    // for each families
    for(let i in familyNames) {

        let family = familyNames[i];


        if(i == Math.floor(familyNames.length/2)) { // normally 3
            currentBundle = formatRegion(family);
        }

        // add to family-data
        let div = $('<div>');
        div.addClass(`family-frame`);
        div.attr('data-family-frame', family);
        div.html(`<img src='asset/logo_regions/${family}.png' ${family=='neant'?'style="transform: translate(-43%, -50%);"':''}>`);
        $('#regions-summary').append(div);

        $(`#pannel-bundle .bundle-${i}`).attr('data-region', family);

        // for each champion in this family
        for(let j in families[family]) {
            let champion = families[family][j];

            let card = $(`#pannel-bundle .bundle-${i} .card-${j}`);
            card.attr('data-championid', formatChampion(champion));

            let inner = card.children('.inner');

            // if the player has not this champion, then gray it
            if(player.bundle.indexOf(champion) === -1) {
                card.addClass('disabled');
            }

            // append it to the DOM
            inner.children('span:nth-child(1)').css('background-image', `url('asset/icon_champions/${family}/${formatChampion(champion)}.png')`);
            inner.children('span:nth-child(2)').text(champion);
            inner.children('span:nth-child(3)').text(regionName(family));
        }

    }

    // for each player
    for(let pId in players) {
        let p = players[pId];
        
        // for right side menu
        let div = $('<div class="participant">');
        if(pId == player.id) div.addClass('me');

        div.append($('<div>'));
        div.append($('<span>'));
        div.children('span').text(p.name);

        $('#participants').append(div);

        $('#pannel-participants').append($(`<div class="participant" data-playerid="${pId}">`));


        // if he's not the current player
        if(pId != player.id) {
            div = $('<div class="participant">');
            div.append($('<div>'));
            div.append($('<span>'));
            div.children('span').text(p.name);
            div.attr('data-playerid', pId);

            $('#stealMenu .inner').append(div);

        }
    }


    // top bar - set cursor to current player
    setTimeout(() => {
        let pDom = $(`#pannel-participants .participant[data-playerid="${player.current}"]`);

        if(pDom.length > 0) {
            let left = pDom.offset().left - $('#pannel-participants').offset().left + pDom.width()/2;
            $('#arrow-round').css('left', `${left}px`);
        }
    }, 2000);

};




/**
 * TOOGLE THE ATH
 */
const toggleATH = () => {$('#participants, #regions-summary').toggleClass('closed')};







/**
 * DISPLAY OR HIDE THE USER BUNDLE - MOBILE ONLY
 * @param {boolean} state either the menu should be displayed or not - mobile 
 */
const toggleBundle = state => {
    if(state) {
        if(bdlClosed) {

            $('#pannel-bundle').show(0).css({
                transform: 'translateY(0)',
                opacity: 1
            });

            bdlClosed = false;

        }

        $('#message-center').css({
            transform: 'translate(-50%, -50%) scale(.8)',
            opacity: 0
        }).delay(200).fadeOut(0);

        $('#deck').fadeOut(200);

        $('#previous-bundle, #next-bundle, #close-bundle-phone').delay(100).fadeIn(100);

    } else {
        if(!bdlClosed) {

            $('#pannel-bundle').css({
                transform: 'translateY(40px)',
                opacity: 0
            }).delay(200).hide(0);
            bdlClosed = true;

        }

        setTimeout(() => {

            $('#message-center').fadeIn(0).css({
                transform: 'translate(-50%, -50%) scale(1)',
                opacity: 1
            });
            
            $('#deck').fadeIn(200);

        }, 200);

        $('#previous-bundle, #next-bundle, #close-bundle-phone').fadeOut(100);
    }
};









/**
 * ROTATE THE BUNDLE TO SWAP FAMILY
 */
const previousBundle    = async function(force=false) {rotateBundle(-1, force);};
const nextBundle        = async function(force=false) {rotateBundle(1, force);};





/**
 * ROTATE THE BUNDLE
 * @param {Integer} vec 1 or -1, direction from where the bundle has to rotate - previous or next family
 */
const rotateBundle = async function(vec, force=false) {
    if((changingBundle && !force) || (isMobile && bdlClosed)) return;

    changingBundle = true;

    if(!isMobile) {

        let prev = currentBdiv;
        currentBdiv = Math.abs(currentBdiv + vec - ((prev==0 && vec<0)?5:0)) % 7;
        let newPos;


        let possLeft = ['-150px', 'calc(100% + 150px)'];
        let possLeft2 = ['0', '100'];
        let left;

        if(vec > 0) {
            left = 0;
            newPos = (currentBdiv < 6)? currentBdiv+1 : 0;
        } else {
            left = 1;
            newPos = (currentBdiv > 0)? currentBdiv-1 : 6;
        }

        $(`.bundle-${newPos}`).css('left', possLeft[1-left]);
        currentBundle = $(`.bundle-${currentBdiv}`).attr('data-region');

        $(`.bundle-${prev}`).css({
            width: '0',
            top: '150%',
            left: possLeft[left]
        });

        $(`.bundle-${currentBdiv}`).css({
            width: '700px',
            top: '0',
            left: '50%'
        });

        $(`#region-big-ghost .inner div:nth-child(${prev+1})`).css({
            left: `${possLeft2[left]}%`,
            opacity: 0,
            transform: 'translate(-50%, -50%)'
        });

        $(`#region-big-ghost .inner div:nth-child(${currentBdiv+1})`).css({
            left: '50%',
            opacity: 1,
            transform: 'translate(-50%, -50%) scale(1)'
        });
    } else {

        if(vec == 1 && swipeP < 6) {
            $('#pannel-bundle > .inner').css('transform', `translateX(-${(++swipeP)*100}vw)`);
        }
        
        else if(vec == -1 && swipeP > 0) {
            $('#pannel-bundle > .inner').css('transform', `translateX(-${(--swipeP)*100}vw)`);
        }

    }

    setTimeout(() => {changingBundle = false}, timeChangingBundle);
};


/**
 * SHOW A MESSAGE AT THE CENTER OF THE SCREEN
 * @param {string} p1 first message's part
 * @param {string} h2 second message's part
 * @param {string} p2 last message's part
 */
const message = txt => {
    
    $('#message-center').find('h2').text(txt);
    $('#message-center').fadeIn(0);

    const h = $('#message-center h2').outerHeight();
    
    $('#message-center').css('height', `${h+20}px`);
};




/**
 * STEAL A GIVEN CHAMPION
 */
const stealChampion = () => {
    let replay = false,
        drawnCard,
        nextPlayer,
        reasonToReplay,

        txt = `${player.game.participants[selectedPlayer].name} n'a pas ce champion. Vous piochez`,

        result = {
            thiefId:        player.id,
            stolenId:       selectedPlayer,
            regionId:       selectedRegion,
            championName:   selectedChampion,
            stolen: false,
            draw:           false,
            complete:       false
        };



    if(player.steal(selectedPlayer, selectedChampion)) {

        // steal

        result.stolen = true;
        replay = true;
        
        reasonToReplay = 'volé';

        txt = `Vous avez volé ${selectedChampion} à ${player.participants[selectedPlayer].name} !`;

        setTimeout(() => {
            $('.stolenCard').css('animation', 'brightStolenCard 1.5s forwards').on('animationend', function() {
                $(this).css('animation', 'retrieveBasicPosition .5s forwards').on('animationend', function() {
                    $(`#pannel-bundle .card[data-championid="${formatChampion(selectedChampion)}"]`).removeClass('disabled').fadeIn(0);
                    $(this).remove();

                    if(player.completeFamily(selectedRegion)) {
                        result.complete = selectedRegion;
                        messageFamilyCompleted(selectedRegion);
                    }
                });
            });
        }, 600);

    }
    
    
    else {

        let cmpRegion = null;

        // doesn't steal

        drawnCard = player.draw();

        txt = `${player.participants[selectedPlayer].name} n'a pas ce champion`;

        // draw a card if the deck still contains a card
        if(drawnCard) {

            if(drawnCard == selectedChampion) {
                replay = true;
                reasonToReplay = 'pioché';
            }

            txt += `. Vous piochez ${drawnCard}`;

            result.draw = drawnCard;

            let region = formatRegion(championRegion(drawnCard));

            if(player.completeFamily(region)) {
                cmpRegion = region;
            }

        } else {

            result.draw = 'empty';
            
        }
        

        setTimeout(() => {
            $('.stolenCard').addClass('disabled');

            setTimeout(() => {
                
                $('.stolenCard').css('animation', 'retrieveBasicPosition .5s forwards').on('animationend', function() {
                    
                    $(`#pannel-bundle .card[data-championid="${formatChampion(selectedChampion)}"]`).fadeIn(0);
                    $(this).remove();

                    $(`#pannel-bundle .card[data-championid="${formatChampion(drawnCard)}"]`).removeClass('disabled');

                    if(cmpRegion) {
                        result.complete = cmpRegion;
                        messageFamilyCompleted(cmpRegion);
                    }

                });

            }, 2000);
        }, 800);
    }



    message(txt);



    setTimeout(async function() {
        
        nextPlayer = await player.nextRound(result, replay);
        
        let winner = player.gameFinished();

        
        if(winner) {

            $('#message-center').fadeOut(2000);
            announceWinner(winner);
        
        }
        
        else {

            setTimeout(() => {

                if(!replay) {
                    let name = nextPlayer.name;
                    message(`C'est au tour d${isVowel(name[0])?"'":"e "}${name} de voler un champion`);
                    $('#arrow-round').css('background', 'linear-gradient(transparent, rgba(150, 150, 150, 0.2))');
                }

                else {
                    message(`Vous pouvez rejouer car vous avez ${reasonToReplay} le champion demandé`);
                }

                let pDom = $(`#pannel-participants .participant[data-playerid="${player.current}"]`);
                let left = pDom.offset().left - $('#pannel-participants').offset().left + pDom.css('width')/2;
                $('#arrow-round').css('left', `${left}px`);

                //newCooldown(roundTime);

            }, 1000);
        
        }

        
    }, 4000);
};



/**
 * MESSAGE THAT INFORM A FAMILY HAS BEEN COMPLETED
 * @param {string} region region's name
 */
const messageFamilyCompleted = region => {
    for(let c of families[region]) {
        player.removeCard(c);
        $(`#pannel-bundle > .inner .card[data-champion="${c}"]`).remove();
    }

    $(`.family-frame[data-family-frame="${region}"]`).addClass('completed');
    $(`.region[data-region="${region}"]`).remove();

    $('#complete-family > div p span').text(regionName(region));
    $('#complete-family > span, #region-big-logo').css('background-image', `url('asset/logo_real_regions/${region}.png')`);

    $('#family-hover').fadeIn(200);

    $('#region-big-logo').fadeIn(200).addClass('animateLogoRegion').one('animationend', function() {
        $(this).fadeOut(500);

        $('#complete-family').fadeIn(200);
    });

};




/**
 * CALLED WHEN AN ACTION HAS BEEN DONE BY ANOTHER PLAYER
 * @param {object} news object of last changes
 * @param {string} type prevent action type
 */
const newsTreatment = async function(news, type) {
    if(type == 'newRound') {
        if(news.thiefId == player.id) return;

        let thiefId = news.thiefId;
        let stolenId = news.stolenId;
        let regionId = news.regionId;
        let champion = news.championName;
        let draw = news.draw;
        let completed = news.complete;
        let thiefName = player.participants[thiefId].name;
        let stolenName = player.participants[stolenId].name;

        let b = player.id == stolenId;
        let txtCplt = '';
        let txtRpl = '';

        await player.recoverBundles();
        await player.recoverDeck();
        await player.recoverCurrent();
        await player.recoverCompleted();


        if(completed) {
            txtCplt = `et a complété une région: ${completed}`;
            $(`#pannel-bundle .inner .bundle[data-region="${completed}"] .card`).each(card => $(card).removeClass('disabled'));
        }

        if(thiefId == player.current) txtRpl = draw? "car il a pioché ce qu'il a demandé" : "car il a obtenu le champion demandé";
        

        if(draw) {
            message(`${thiefName} a essayé de ${b?'vous':''} voler ${champion} ${b?'':`à ${stolenName}`} ${draw=='empty'?'':'mais a dû piocher'} ${txtCplt}`);
        }
        
        else {
            message(`${thiefName} ${b?'vous':''} a volé ${champion} ${b?'':`à ${stolenName}`} ${txtCplt}`);

            if(b) $(`#pannel-bundle .inner .bundle[data-region="${regionId}"] .card[data-championid="${formatChampion(champion)}"]`).addClass('disabled');
        }
        

        setTimeout(() => {

            let winner = player.gameFinished();

            // game finished
            if(winner) {

                announceWinner(winner);

            } else {

                if(player.current == player.id) {
                    $('#arrow-round').css('background', 'linear-gradient(transparent, rgba(115, 92, 49, 0.5))');
                }
                
                else {
                    let name = player.participants[player.current].name;
                    message(`C'est au tour d${isVowel(name[0])?"'":"e "}${name} de voler un champion ${txtRpl}`);
                    $('#arrow-round').css('background', 'linear-gradient(transparent, rgba(150, 150, 150, 0.2))');
                }

                let pDom = $(`#pannel-participants .participant[data-playerid="${player.current}"]`);
                let left = pDom.offset().left - $('#pannel-participants').offset().left + pDom.width()/2;
                $('#arrow-round').css('left', `${left}px`);

                //newCooldown(roundTime);

            }

        }, 4000);

    }


};






/**
 * ANNOUNCE THE WINNER
 * @param {object} winner winner's id/name
 */
const announceWinner = winner => {
    $(`#pannel-participants, #participants, #pannel-bundle, #regions-summary, #message-center,
        #timer, #previous-bundle, #next-bundle, #deck`).fadeOut(100);

    let state = 'defeat';

    // you won - or you lost
    if(winner.id == player.id) {
        state = 'victory';
        player.win();
    } else {
        player.lose();
    }

    $('#endofgame').removeClass().addClass(state).children('span').text(`${winner.id==player.id?'Vous avez':winner.name+' a'} gagné avec ${winner.formed} familles`);
    $('#endofgame').fadeIn(200);

    player.getOutOfGame();
};










/**
 * FORCE THE ROUND CHOOSING A RANDOM CHAMPION IF TIME FULLY ELAPSED
 */
const forceRound = () => {

    // time ellapsed for another player: we recover what he did
    if(player.current != player.id) {

    }
    
    // time ellapsed for this player: we force the choice
    else {

        $('#hover').fadeIn(0);

        let r, time=0;

        // if the player has never choose a champion, choose for him
        if(!selectedChampion) {

            time = 2100;

            let missings = getMissingCards();
            r = rand(0, missings.length-1);
            
            selectedChampion = missings[r];

            selectedRegion = formatRegion(championRegion(selectedChampion));

            focusBundle(selectedRegion);

            setTimeout(() => {
                $(`#pannel-bundle .card[data-championid="${formatChampion(selectedChampion)}"]`).click();
            }, 600);

        }

        participants = player.participants;
        delete participants[player.id];

        r = rand(Object.keys(participants).length-1);
        
        selectedPlayer = participants[Object.keys(participants)[r]].id;

        setTimeout(() => {
            $('#hover').fadeOut(0);
            $(`#stealMenu .participant[data-playerid="${selectedPlayer}"]`).click();
        }, time);
    }

};


const focusBundle = async function(region) {
    let i1 = player.gameFamilies.indexOf(currentBundle);
    let i2 = player.gameFamilies.indexOf(region);

    let d = i1 - i2;
    let v = Math.sign(d);

    let i = 0;
    let f = null;

    if(v < 0) {
        f = async function() {nextBundle(true)};
    } else {
        f = async function() {previousBundle(true)};
    }

    while(i < Math.abs(d)) {
        await f();
        i++;
    }
};






/**
 * START THE STOPWATCH'S ANIMATION
 * @param {Integer} time animation duration
 */
const newCooldown = time => {
    alert('new cooldown');
    $('#timer div').css('animation', 'none');

    setTimeout(() => {
        $('#timer div')
            .css('animation', `cooldown ${time}s forwards linear`)
            .one('animationend', forceRound);
    }, 10);
}




/**
 * RETURN AN ARRAY OF NAMES OF ALL MISSING CHAMPIONS
 * @returns {Array}
 */
const getMissingCards = () => {
    return $.makeArray($('.card').filter('.disabled')).map(card => $(card).find('.inner span:nth-child(2)').text());
};








export {bindEvents, initializeGame};