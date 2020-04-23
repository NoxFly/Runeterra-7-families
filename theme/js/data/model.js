player: {
    id           = string(63), // player id
    username     = string(2,16), // player username
    hosting      = boolean, // is he hosting a lobby ?
    searching    = boolean, // is he searching game ? - I think it's useless
    ingame       = boolean, // is he ingame ?
    losses       = int >= 0, // number of losses he did
    wins         = int >= 0, // number of wins he did
    lobby        = null, // for players that joined a lobby - to check if he is in a lobby & is the hoster: hosting
    creationDate = timestamp
};

lobby: {
    hoster       = object( // who host the game
        username        = string(2, 16), // his username
        id              = string(63) // his id
    ),
    participants = array(
        object( // each player in the lobby
            username    = string(2, 16), // his username
            id          = string(63) // his id
        )
    )(1, 5),
    creationDate = timestamp
};

game: {
    hoster      = object( // who host the gme
        username        = string(2, 16), // his username
        id              = string(63) // hist id
    ),
    participants = array(
        object( // each player in the game
            username    = string(2, 16), // his username
            id          = string(63) // his id
        )
    )(1, 5)
    current     = object( // for who is currently the round 
        username        = string(2, 16), // his username
        id              = string(63) // his id
    ),
    bundles     = array( // the cards of each player in the game
        array(string(3,)) // the name of the the card / champion
    )(1, 5)
    deck        = array( // the cards deck, where x = number of families in this game (min: 7, max: 13)
        string(x(7,13)*6)
    )(42, 78),
    families    = array( // array of each families the player formed
        array( // array of family names
            string(4,)
        )
    ),
    creationDate = timestamp
};