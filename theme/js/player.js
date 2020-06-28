import {config} from '../../config/config.js';
import {families} from './data/families.js';
import {randomKey, initDeck, distributeCards, randomFamilies, copy, filterObj} from './utils.js';

/**
 * @class Player
 */
class Player {
    /**
     * @constructor
     * @param {Object} player default configuration of the player
     */
    constructor(player=null) {
        // firebase config
        firebase.initializeApp(config);
        this.database = firebase.database();

        this.game = {};

        this.dev = player == 'dev';


        // recover local player data
        if(this.dev) {
            this.key = 'a';
            this.name = 'Noxfly';
        }


        else if(player) {
            this.key = player.id;
            this.name = player.username;
        } else {
            this.genPlayer();
        }


        let ref = this.database.ref(`/players/${this.key}`);
        if(!this.dev) ref.onDisconnect().remove();
        ref.on('child_removed', () => {
            location.reload();
        });
    }

    /**
     * GENERATE A RANDOM KEY OF 63 CHARACTERS
     */
    genKey() {
        return randomKey(63);
    }

    /**
     * REFRESH THE VERIFICATION DATE TO NOW
     */
    refreshVerificationDate() {
        let now = Date.now();
        this.database.ref('/lastVerificationDate').set(now);
    }







    /// -------------------------- USER

    /**
     * DEFAULT PLAYER STRUCTURE - GENERATE A PLAYER
     */
    genPlayer() {
        this.key 		    = this.genKey();
        this.name 		    = 'guest';
        this.bHosting 	    = false;
        this.bIngame 	    = false;
        this.iWins 		    = 0;
        this.iLosses 	    = 0;
        this.sLobby         = false;
        this.creationDate   = Date.now();
    }

    /**
     * CREATE A NEW REMOTE PLAYER
     * @param {String} username username of the player
     */
    async createUser(username) {
        this.name = username;
        return await this.database.ref('/players').child(this.key).set({
            id: 		    this.key,
            username: 	    this.name,
            ingame: 	    false,
            hosting: 	    false,
			wins:		    0,
            losses: 	    0,
            lobby:			false,
            creationDate:   this.creationDate
        }).then(() => true).catch(error => false);
    }

    /**
     * RECOVER THE REMOTE DATA ABOUT THE PLAYER
     */
    async recoverUserData() {
        await this.database.ref(`/players/${this.key}`).once('value', data => {
            if(data && data.val()) {
                data = data.val();
                this.name           = data.username;
                this.bIngame        = data.ingame;
                this.bHosting       = data.hosting;
                this.iWins          = data.wins;
                this.iLosses	    = data.losses;
                this.sLobby			= data.lobby;
                this.creationDate   = data.creationDate;
            }
        });
    }

    /// ------------------------







    /// ------------------------ LOBBIES

    /**
     * CREATE A LOBBY REMOTLY
     */
    async createLobby() {
        this.bHosting = true;
        this.database.ref(`/lobbies`).child(this.key).set({
            host: {id: this.key, name: this.name},
            participants: {[this.key]:{id: this.key, name: this.name}},
            creationDate: Date.now(),
            launch: false
        }).then(() => {
            this.database.ref(`players/${this.key}/hosting`).set(this.bHosting);
		});
    }

    /**
     * DELETE THE REMOTE LOBBY
     * @param {Function} callback callback function after the deletion
     */
    async stopHost(callback) {
        this.bHosting = false;
        this.database.ref(`/lobbies/${this.key}`).remove().then(() => {
            this.database.ref(`players/${this.key}/hosting`).set(this.bHosting);
            callback();
		});
    }

    /**
     * RECOVER CREATED LOBBIES IN REAL TIME
     * @param {Function} callback callback to be executed on event handling
     */
    getLobbies(callback) {
        this.database.ref(`/lobbies`).on('child_added',   snapshot => {callback(snapshot.val(), 'add');});
        this.database.ref(`/lobbies`).on('child_removed', snapshot => {callback(snapshot.val(), 'remove');});
        this.database.ref(`/lobbies`).on('child_changed', snapshot => {callback(snapshot.val(), 'change');});
    }

    /**
     * UNBIND PREVIOUS HANDLERS ABOUT LOBBY CREATIONS
     */
    stopSearchLobbies() {
        this.database.ref('/lobbies').off('child_added');
        this.database.ref('/lobbies').off('child_removed');
        this.database.ref('/lobbies').off('child_changed');
    }

    /**
     * JOIN A LOBBY OF ANOTHER PLAYER
     * @param {Object} host host id/name
     * @param {Integer} n number of participants
     * @param {Function} callback callback function executed once the player joined the lobby
     */
    async joinLobby(host, n, callback) {
        this.lobby = host.id;
        this.database.ref(`/players/${this.key}/lobby`).set(this.sLobby);

        let ref = this.database.ref(`/lobbies/${host.id}/participants`);

        let participants = await this.get(ref);

        ref.child(this.key).set({
            name: this.name, id: this.key
        })
        .then(() => {
            callback(participants)
        });
	}
    
    /**
     * QUIT THE LOBBY OF ANOTHER PLAYER HE IS FROM
     * @param {Function} callback callback function once the player quitted the lobby
     */
	async quitLobby(callback) {
        if(this.sLobby) {
            await this.database.ref(`/lobbies/${this.sLobby}/participants/${this.key}`).remove();
            this.lobby = false;
            this.database.ref(`/players/${this.key}/lobby`).set(this.sLobby);
            callback();
        }
	}

    /**
     * BIND LOBBY CHANGES IN REAL TIME
     * @param {Integer} lobbyId lobby id
     * @param {Function} callback callback function to be executed on handling
     */
    async bindLobbyChanges(lobbyId, callback) {
        let lobby = this.database.ref(`/lobbies/${lobbyId}`);
        lobby.on('child_added',   snapshot => {callback(snapshot.val(), 'lobbyJoined')});
        lobby.on('child_removed', snapshot => {callback(snapshot.val(), 'lobbyDeleted')});
        lobby.on('child_changed', snapshot => {callback(snapshot.val(), 'lobbyChanged')});
    }

    /**
     * UNBIND PREVIOUS HANDLERS
     * @param {Integer} lobbyId lobby id
     */
    unbindLobbyChanges(lobbyId) {
        let lobby = this.database.ref(`/lobbies/${lobbyId}`);
        lobby.off('child_changed');
        lobby.off('child_added');
        lobby.off('child_removed')
    }

    /// ---------------------------












    /// ---------------------------


    async launchGame(participants, nFamilies) {
        if(this.ingame && !this.dev) return false;
        this.ingame = this.id;
        this.database.ref(`/players/${this.key}/ingame`).set(this.key);

        let Families = randomFamilies(nFamilies);
        let deck = initDeck(Families);
        let bundles = distributeCards(Object.keys(participants), deck);

        let completed = {};
        for(let p of Object.keys(participants)) completed[p] = false;

        this.game = {
            participants: participants,
            hoster: {id: this.key, name: this.username},
            current: this.key,
            bundles: bundles,
            deck: deck,
            families: Families,
            completed: completed,
            news: false,
            creationDate: Date.now()
        };

        await this.database.ref(`/games`).child(this.key).set(this.game);

        this.database.ref(`/lobbies/${this.key}`).child('launch').set(true).then(() => {
			setTimeout(() => {
				this.database.ref(`/lobbies/${this.key}`).remove();
			}, 5000);
		});
		
		return true;
    }




	setGameState(bool) {
		if(bool) {
			this.ingame = this.lobby;
			this.lobby = false;
			this.database.ref(`/players/${this.key}/ingame`).set(this.ingame);
			this.database.ref(`/players/${this.key}/lobby`).set(false);
		} else {
			this.ingame = false;
			this.database.ref(`/players/${this.key}/ingame`).set(false);
		}
	}

	async getGameData(lobbyId) {
        this.ingame = lobbyId;
        this.game = await this.get(`/games/${this.ingame}`);

        if(this.game == null) return false;
        
        if(!this.game.bundles) this.game.bundles = {};

        for(let p of Object.keys(this.participants)) {
            if(!(p in this.game.bundles)) {
                this.game.bundles[p] = [];
            }
        }

        if(!this.game.deck) this.game.deck = [];


        return true;
    }

    steal(player, champion) {
        let bundle = this.getBundle(player);
        let i = bundle.indexOf(champion);
        if(i === -1) return false;
        this.bundle.push(bundle.splice(i, 1)[0]);
        return true;
    }

    draw() {
        if(this.deck.length == 0 || !this.deck) return null;
        let card = this.deck.splice(0, 1)[0];
        this.bundle.push(card);
        return card;
    }
    


    async nextRound(result, replay) {
        let next = {id: this.key, name: this.username};

        if(!replay) {
            let participants = Object.keys(this.participants);
            let i = participants.indexOf(this.key);
            next = this.participants[participants[(i+1)%participants.length]];
        }

        this.game.news = result;
        this.game.current = next.id;

        await this.database.ref(`/games/${this.ingame}`).set(this.game);

        return next;
    }

    async recoverBundles() {
        this.game.bundles = await this.get(`/games/${this.ingame}/bundles`);
        
        if(!this.game.bundles) this.game.bundles = {};

        for(let p of Object.keys(this.participants)) {
            if(!(p in this.game.bundles)) {
                this.game.bundles[p] = [];
            }
        }
    }

    async recoverDeck() {
        this.game.deck = await this.get(`/games/${this.ingame}/deck`);
        if(!this.game.deck) this.game.deck = [];
    }

    async recoverCurrent() {
        this.game.current = await this.get(`/games/${this.ingame}/current`);
    }

    async recoverCompleted() {
        this.game.completed = await this.get(`/games/${this.ingame}/completed`);
    }

    removeCard(card) {
        let i = this.bundle.indexOf(card);
        if(i !== -1) this.bundle.splice(i, 1);
    }

    completeFamily(family) {
        let f = families[family];
        let b = copy(this.bundle).filter(champion => f.indexOf(champion) !== -1);

        if(b.length == 6) {
            if(this.completeFamilies[this.key] == false) {
                this.completeFamilies[this.key] = [];
            }

            this.completeFamilies[this.key].push(family);

            return true;
        }

        return false;
    }


    bindGameChanges(callback) {
        let ref = this.database.ref(`/games/${this.ingame}`);

        ref.on('child_changed', snapshot => {if(snapshot.key == 'news') callback(snapshot.val(), 'newRound');});
        ref.on('child_removed', snapshot => {if(snapshot.key == 'hoster') callback(snapshot.val(), 'gameFinished');});
    }

    unbindGameChanges() {
        let ref = this.database.ref(`/games/${this.ingame}`);
        ref.off('child_changed');
        ref.off('child_removed');
    }

    gameFinished() {
        // no longer deck & every bundle is empty because every families are formed
        if((this.deck.length == 0 || !this.deck) && (Object.keys(filterObj(this.game.bundles, (id, bundle) => bundle.length > 0)) == 0)) {
            let winner = false;
            let maxFormed = 0;

            for(let p of Object.keys(this.participants)) {
                let formed = this.completeFamilies[p]? this.completeFamilies[p].length : 0;
                if(formed > maxFormed) {
                    maxFormed = formed;
                    winner = this.participants[p];
                }
            }

            winner = copy(winner);
            winner.formed = maxFormed;

            return winner;
        }

        return false;
    }

    getOutOfGame() {
        this.unbindGameChanges();

        this.ingame = false;
        let ref = `players/${this.key}`;
        this.database.ref(`${ref}/ingame`).set(this.ingame);
        this.database.ref(`${ref}/wins`).set(this.iWins);
        this.database.ref(`${ref}/losses`).set(this.iLosses);

        if(this.hosting) {
            this.hosting = false;
            this.database.ref(`${ref}/hosting`).set(this.bHosting);
            setTimeout(() => {
                this.database.ref(`/games/${this.key}`).remove();
            }, 3000);
        }
    }



    /// ---------------------------



	














    /// ---------------------------

    // recover remote data
    async get(path) {
        return await this.database.ref(path).once('value').then(snapshot => snapshot.val());
    }
    
    // getters / setters
    get username()  {return this.name;}
    get id()        {return this.key;}
    get ingame()    {return this.bIngame;}
    get hosting()   {return this.bHosting;}
    get wins()      {return this.iWins;}
    get losses()    {return this.iLosses;}
    get lobby()     {return this.sLobby;}

    set username(username)  {this.name = username;}
    set id(id)              {this.key = id;}
    set ingame(bool)        {this.bIngame = bool;}
    set hosting(bool)       {this.bHosting = bool;}
    set wins(int)           {this.iWins = int;}
    set losses(int)         {this.iLosses = int;}
    set lobby(val)          {this.sLobby = val;}


    // ingame getters / setters
    get bundle()        {return this.game.bundles[this.key];}
    getBundle(playerId) {return this.game.bundles[playerId];}
    get deck()          {return this.game.deck;}
    get current()       {return this.game.current;}
    get gameFamilies()	{return this.game.families;}
    get participants()  {return this.game.participants;}
    get completeFamilies()  {return this.game.completed;}


    // incr

    win()  {this.iWins++;}
    lose() {this.iLosses++;}
}



export {Player};