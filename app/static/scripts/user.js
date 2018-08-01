$.fn.renderallpokemon = function () {
    let _qs = '?' + $.param(qs);
    let _container = $(this);

    $.ajax({
        url: '/api/' + $('#user-profile').data('username') + '/pokemon/get' + _qs,
        type: 'GET',
        success: function (response) {
            let _pokemon_list = JSON.parse(response)['pokemon'];
            $('#pokemon-wrapper').renderpokemon(_pokemon_list, 'generate');
        },
        error: function (error) {
            console.log(error.status);
        }
    });
};


$.fn.updatestate = function (statetype) {
    var _pokemon = $(this).parent().parent();

    _pokemon.data(statetype, !_pokemon.data(statetype));

    var _name = _pokemon.data('key');
    var _dex = _pokemon.data('dex');
    var _state = _pokemon.data(statetype);
    var _ownedstate = _pokemon.checkownedstate();

    var obj = {};
    obj['name'] = _name;
    obj['dex'] = _dex;
    obj[statetype] = _state;
    obj['owned'] = _ownedstate;

    var data = {data: JSON.stringify(obj)};

    $.ajax({
        url: '/api/' + $('#user-profile').data('username') + '/pokemon/update',
        data: data,
        type: 'PUT',
        success: function (response) {
            let _qs = '?name=' + obj['name'];

            $.ajax({
                url: '/api/' + $('#user-profile').data('username') + '/pokemon/get' + _qs,
                type: 'GET',
                success: function (response) {
                    let _pokemon_list = JSON.parse(response)['pokemon'];
                    $('#pokemon-wrapper').renderpokemon(_pokemon_list, 'update');
                },
                error: function (error) {
                    console.log(error.status);
                }
            });
        },
        error: function (error) {
            console.log(error.status);
        }
    });
};

$.fn.checkownedstate = function () {
    if (
        this.data('shinyowned')
        || this.data('alolanowned')
        || this.data('regionalowned')
        || this.data('maleowned')
        || this.data('femaleowned')
        || this.data('ungenderedowned')
        || this.data('luckyowned')
    ) {
        return true;
    } else {
        return false;
    }
};

$.fn.renderpokemon = function (list, type) {
    function pokemonoptions(type, istype, isowned) {
        let icons = {
            'male': 'fa-mars',
            'female': 'fa-venus',
            'ungendered': 'fa-circle',
            'shiny': 'fa-star',
            'alolan': 'fa-umbrella-beach',
            'lucky': 'fa-dice'
        };

        if (istype && type === 'ungendered') {
            return `<div class="${type} opt ${isowned ? 'owned' : ''}" data-content="${type}"><i class="${isowned ? 'fas' : 'far'} ${icons[type]}"></i></div><span class="opt"></span>`;
        } else if (istype) {
            return `<div class="${type} opt ${isowned ? 'owned' : ''}" data-content="${type}"><i class="${isowned ? 'fas' : 'far'} ${icons[type]}"></i></div>`;
        } else {
            return `<span class="${type} opt ${isowned ? 'owned' : ''}" data-content="${type}"><i class="${isowned ? 'fas' : 'far'} ${icons[type]}"></i></span>`;
        }
    }

    const Item = ({name, dex, owned, shiny, shinyowned, male, maleowned, female, femaleowned, ungendered, ungenderedowned, alolan, alolanowned, luckyowned, regional, legendary}) => `
        <div class="pokemon ${owned ? 'owned' : ''}"
                ${maleowned ? 'data-maleowned="True"' : ''}
                ${femaleowned ? 'data-femaleowned="True"' : ''}
                ${ungenderedowned ? 'data-ungenderedowned="True"' : ''}
                ${shinyowned ? 'data-shinyowned="True"' : ''}
                ${alolanowned ? 'data-alolanowned="True"' : ''}
                ${luckyowned ? 'data-luckyowned="True"' : ''}
                ${owned ? 'data-owned="True"' : ''}
                data-key="${name}"
                data-dex="${dex}">
                
                <div class="img" style="background-image: url(https://s3-eu-west-1.amazonaws.com/dex-static-img/${dex}.png)"></div>
                <div class="info">${name}</div>
                <div class="dex-num">#${dex.toString().padStart(3, '0')}</div>
                ${legendary ? '<div class="dex-special legendary"></div>' : ''}
                ${regional ? '<div class="dex-special regional"><i class="fas fa-globe-africa"></i></div>' : ''}
                <div class="pm-opt">
                    ${ungendered ? pokemonoptions('ungendered', ungendered, ungenderedowned) : pokemonoptions('male', male, maleowned) + pokemonoptions('female', female, femaleowned)}
                    ${pokemonoptions('shiny', shiny, shinyowned)}
                    ${pokemonoptions('alolan', alolan, alolanowned)}
                    ${pokemonoptions('lucky', 'True', luckyowned)}
                </div>
            </div>
    `;

    if (type === 'generate') {
        $(this).fadeOut("slow", function () {
            $(this).html('').append(list.map(Item).join('')).fadeIn("slow")
        });
    } else if (type === 'update') {
        let arrayLength = list.length;

        for (var i = 0; i < arrayLength; i++) {
            let _pokemon = list[i];
            $(this).find('[data-key="' + _pokemon.name + '"]').replaceWith([_pokemon].map(Item).join(''));
        }
    }
};

$.fn.api.settings.api = {
    'search': '/api/users/get?q={query}'
};

let qs = {};

$(function () {
    $('#pokemon-wrapper').renderallpokemon();
    $('.ui.search').search();
    $('.ui.dropdown').dropdown();

});

$('#pokemon-wrapper').on('click', 'div.opt.shiny', function () {
    $(this).updatestate('shinyowned');
}).on('click', 'div.opt.alolan', function () {
    $(this).updatestate('alolanowned');
}).on('click', 'div.opt.regional', function () {
    $(this).updatestate('regionalowned');
}).on('click', 'div.opt.male', function () {
    $(this).updatestate('maleowned');
}).on('click', 'div.opt.female', function () {
    $(this).updatestate('femaleowned');
}).on('click', 'div.opt.ungendered', function () {
    $(this).updatestate('ungenderedowned');
}).on('click', 'div.opt.lucky', function () {
    $(this).updatestate('luckyowned');
});

$('#pokemon-filters').on('change', '#gen-select', function () {
    qs.gen = $('#gen-select').val();
    $('#pokemon-list').renderallpokemon();
}).on('change', '#cat-select', function () {
    qs.cat = $('#cat-select').val();
    $('#pokemon-list').renderallpokemon();
}).on('change', '#own-select', function () {
    qs.own = $('#own-select').val();
    $('#pokemon-list').renderallpokemon();
});