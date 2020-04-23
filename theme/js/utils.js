// set an alternative background
const setBackground = (path, darker=true) => {
    let el = $('#background');
    el.fadeIn(200);

    // either the background should be darker or not
    $('#background').addClass('darker');
    if(!darker) $('#background').removeClass('darker');

    // change the background of the child which is hidden
    el.children('div').css('background-image', `url('asset/splash_backgrounds/${path}.jpg')`);
    // then fade it during one second
    el.children('div').fadeIn(200);
    

    // when it finish to appear
    setTimeout(() => {
        // change the real background image
        el.css('background-image', `url('asset/splash_backgrounds/${path}.jpg')`);
        // then hide its child
        el.children('div').fadeOut(0);
    }, 250);
};

const removeBackground = () => {
    $('#background').css('background-image', 'url("")').fadeOut(200);
    $('#background').children('div').css('background-image', 'url("")').fadeOut(200);
};

const setBackgroundBrightness = percentage => {
    let alpha = Math.max(0, Math.min(percentage, 100)) / 100;
    $('#background-darkness').css('opacity', alpha);
};



// stringify the cookie and save it
const saveCookie = player => {
    document.cookie = `player: {"id": "${player.id}", "username": "${player.username}"};`;
};


// get cookie as object
const parseCookies = () => {
    let cookies = document.cookie.replace(/player: (\{.*\})/, '$1');
    if(/\{.*\}/.test(cookies)) {
        return JSON.parse(cookies);
    }

    return {};
};

//
const copy = obj => JSON.parse(JSON.stringify(obj));
const rand = (min, max) => Math.floor(Math.random()*max-min)+min;

const _alert = msg => {
    $('#message-alert span').text(msg).parent().fadeIn(0);
    $('#hover').fadeIn(0);
};


// format region names | champion names

const formatRegion = region => region.toLowerCase().replace(' ', '_').replace('é', 'e');
const formatChampion = champion => champion.toLowerCase().replace(/('|\s)/g, '');




const shuffle = array => {
    for(let i=array.length-1; i>0; i--) {
        let j = Math.floor(Math.random() * (i+1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

const filterObj = (obj, predicate) => {
    let result = {};

    for(let key in obj) {
        if(obj.hasOwnProperty(key) && predicate(key, obj[key])) {
            result[key] = obj[key];
        }
    }

    return result;
};


export {
    setBackground,
    removeBackground,
    setBackgroundBrightness,
    saveCookie,
    parseCookies,
    formatChampion,
    formatRegion,
    copy,
    rand,
    _alert,
    shuffle,
    filterObj
};