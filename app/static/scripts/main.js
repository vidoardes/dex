$.fn.renderallpokemon = function () {
    let _qs = '?' + $.param(qs)
    let _container = $(this)

    $.ajax({
        url: '/api/' + $('#user-profile').data('username') + '/pokemon/get' + _qs,
        type: 'GET',
        success: function (response) {
            let _pokemon_list = JSON.parse(response)['pokemon']
            $('#pokemon-wrapper').renderpokemon(_pokemon_list, 'generate')
        },
        error: function (error) {
            console.log(error.status)
        }
    })
}

$.fn.updatestate = function (statetype) {
    var _pokemon = $(this).parent().parent()

    _pokemon.data(statetype, !_pokemon.data(statetype))

    var _name = _pokemon.data('key')
    var _dex = _pokemon.data('dex')
    var _state = _pokemon.data(statetype)
    var _ownedstate = _pokemon.checkownedstate()

    var obj = {}
    obj['name'] = _name
    obj['dex'] = _dex
    obj[statetype] = _state
    obj['owned'] = _ownedstate

    var data = {data: JSON.stringify(obj)}

    $.ajax({
        url: '/api/' + $('#user-profile').data('username') + '/pokemon/update',
        data: data,
        type: 'PUT',
        success: function (response) {
            let _qs = '?name=' + obj['name']

            $.ajax({
                url: '/api/' + $('#user-profile').data('username') + '/pokemon/get' + _qs,
                type: 'GET',
                success: function (response) {
                    let _pokemon_list = JSON.parse(response)['pokemon']
                    $('#pokemon-wrapper').renderpokemon(_pokemon_list, 'update')
                },
                error: function (error) {
                    console.log(error.status)
                }
            })
        },
        error: function (error) {
            console.log(error.status)
        }
    })
}

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
        return true
    } else {
        return false
    }
}

$.fn.renderpokemon = function (list, type) {
    function pokemonoptions(type, istype, isowned, released) {
        let icons = {
            'male': 'fa-mars',
            'female': 'fa-venus',
            'ungendered': 'fa-circle',
            'shiny': 'fa-star',
            'alolan': 'fa-umbrella-beach',
            'lucky': 'fa-dice'
        }

        if (!released) {
            return ``
        }

        if (istype && type === 'ungendered') {
            return `<div class="${type} opt ${isowned ? 'owned' : ''}" data-content="${type}"><i class="${isowned ? 'fas' : 'far'} ${icons[type]}"></i></div><span class="opt"></span>`
        } else if (istype) {
            return `<div class="${type} opt ${isowned ? 'owned' : ''}" data-content="${type}"><i class="${isowned ? 'fas' : 'far'} ${icons[type]}"></i></div>`
        } else {
            return `<span class="${type} opt ${isowned ? 'owned' : ''}" data-content="${type}"><i class="${isowned ? 'fas' : 'far'} ${icons[type]}"></i></span>`
        }
    }

    const Pokemon = ({name, dex, img_suffix, released, owned, shiny, shinyowned, male, maleowned, female, femaleowned, ungendered, ungenderedowned, alolan, alolanowned, luckyowned, regional, legendary}) => `
        <div class="pokemon ${owned ? 'owned' : ''}"
            ${maleowned ? 'data-maleowned="True"' : ''}
            ${femaleowned ? 'data-femaleowned="True"' : ''}
            ${ungenderedowned ? 'data-ungenderedowned="True"' : ''}
            ${shinyowned ? 'data-shinyowned="True"' : ''}
            ${alolanowned ? 'data-alolanowned="True"' : ''}
            ${luckyowned ? 'data-luckyowned="True"' : ''}
            ${owned ? 'data-owned="True"' : ''}
            ${released ? '' : 'data-unreleased="False"'}
            data-key="${name}"
            data-dex="${dex}">
            
            <div class="img" style="background-image: url('../static/img/sprites/pokemon_icon_${dex.toString().padStart(3, '0')}${qs.cat === 'alolan' ? '_61' : img_suffix}${qs.cat === 'shiny' ? '_shiny' : ''}.png')"></div>
            <div class="info">${name}</div>
            <div class="dex-num">#${dex.toString().padStart(3, '0')}</div>
            ${legendary ? '<div class="dex-special legendary"></div>' : ''}
            ${regional ? '<div class="dex-special regional"><i class="fas fa-globe-africa"></i></div>' : ''}
            <div class="pm-opt">
                ${ungendered ? pokemonoptions('ungendered', ungendered, ungenderedowned, released) : pokemonoptions('male', male, maleowned, released) + pokemonoptions('female', female, femaleowned, released)}
                ${pokemonoptions('shiny', shiny, shinyowned, released)}
                ${pokemonoptions('alolan', alolan, alolanowned, released)}
                ${pokemonoptions('lucky', 'True', luckyowned, released)}
            </div>
        </div>
    `

    if (list.length > 0) {
        if (type === 'generate') {
            $(this).fadeOut("slow", function () {
                $(this)
                    .html('')
                    .append(list.map(Pokemon).join(''))
                    .fadeIn("slow")
            })
        } else if (type === 'update') {
            let arrayLength = list.length

            for (var i = 0; i < arrayLength; i++) {
                let _pokemon = list[i]
                $(this)
                    .find('[data-key="' + _pokemon.name + '"]')
                    .replaceWith([_pokemon].map(Pokemon).join(''))
            }
        }
    } else {
        $(this).fadeOut("slow", function () {
            $(this).html('<p id="no-results">Unfortunatly there are no Pokemon match your criteria. Please select a different option from the choices above.</p>').fadeIn("slow")

        })
    }
}

$.fn.api.settings.api = {
    'search': '/api/users/get?q={query}'
}

let qs = {}

$(function () {
    $('#pokemon-wrapper').renderallpokemon()

    $('.ui.checkbox').checkbox({
        onChange: function () {
            let obj = {}
            obj['public'] = $('.ui.checkbox').checkbox('is unchecked')
            let data = {data: JSON.stringify(obj)}

            $.ajax({
                url: '/api/user/' + $('#user-profile').data('username') + '/update',
                data: data,
                type: 'PUT',
                success: function (response) {

                },
                error: function (error) {
                    console.log(error.status)
                }
            })
        }
    })

    $('.ui.search').search()
    $('.ui.dropdown').dropdown('set selected', '1')
    $('#filter-view i').popup()

    $('#filter-view .fa-th-large').hide()

    if ($('body').data("take-tour") === 'True') {
        introJs()
            .oncomplete(function () {
                let obj = {}
                obj['tour'] = true
                let data = {data: JSON.stringify(obj)}

                $.ajax({
                    url: '/api/user/' + $('#user-profile').data('username') + '/update',
                    data: data,
                    type: 'PUT',
                    success: function (response) {

                    },
                    error: function (error) {
                        console.log(error.status)
                    }
                })
            })
            .addStep({
                element: document.querySelectorAll('#sidebar')[0],
                intro: "Welcome to DEX! You look new here, let me show you around.<br /><br />This is your player profile, which will show you your stats and allow you to change your settings. <br /><br /> If you are view someone elses profile, it will show you their details. Neat, huh?<br /><br />Speaking of other trainers...",
            })
            .addStep({
                element: document.querySelectorAll('.ui.search .ui')[0],
                intro: "Here is the search, which you can find other trainers profiles. That way you can see what they need, and make sure you keep them back for trading.<br /><br />If you'd rather not be found in the search, you can set your profile to priavte.",
            })
            .addStep({
                element: document.querySelectorAll('#pokemon-list')[0],
                intro: "... and here is what you came for, the pokemon! This is a list of every Pokemon currently availible in Pokemon GO, with a picture, name, dex number, and 5 options",
            })
            .addStep({
                element: document.querySelectorAll('.pm-opt')[0],
                intro: "You can record wether you have caught one of each gender, it's shiny form, alolan form, or have a lucky variant. The options will only be active if they apply to the individual Pokemon no telling people you have a shiny Mew!",
            })
            .addStep({
                element: document.querySelectorAll('#pokemon-filters')[0],
                intro: "These filters allow you to narrow down the results. You can pick individual regions (or generations), pick a group such a shiny or legendary, and the pick wether you want to see ones you own or still need.<br /><br />These can be combined to filter to just what you want to see, so you can find out what Kanto Regionals your buddy still needs!<br /><br />You can also switch between the card view, and a more compacted list view.",
            })
            .addStep({
                element: document.querySelectorAll('#menu')[0],
                intro: "..and last but but by no means least these options will allow you to get back to your own profile, or to log out if you want to leave (*sniff*)<br /><br />That marks the end of our tour. Hope you find the tool useful, and happy hunting!",
            })
            .start()
    }
})

$('#sidebartoggle').click(function () {
    $('#sidebar').toggleClass('show-sidebar')
})

$('#pokemon-wrapper').on('click', 'div.opt.shiny', function () {
    $(this).updatestate('shinyowned')
}).on('click', 'div.opt.alolan', function () {
    $(this).updatestate('alolanowned')
}).on('click', 'div.opt.regional', function () {
    $(this).updatestate('regionalowned')
}).on('click', 'div.opt.male', function () {
    $(this).updatestate('maleowned')
}).on('click', 'div.opt.female', function () {
    $(this).updatestate('femaleowned')
}).on('click', 'div.opt.ungendered', function () {
    $(this).updatestate('ungenderedowned')
}).on('click', 'div.opt.lucky', function () {
    $(this).updatestate('luckyowned')
})

$('#pokemon-filters').on('change', '#gen-select', function () {
    qs.gen = $('#gen-select').val()
    $('#pokemon-list').renderallpokemon()
}).on('change', '#cat-select', function () {
    qs.cat = $('#cat-select').val()
    $('#pokemon-list').renderallpokemon()
}).on('change', '#own-select', function () {
    qs.own = $('#own-select').val()
    $('#pokemon-list').renderallpokemon()
})

$('#filter-view i').click(function () {
    $('#filter-view .fa-th-large').toggle()
    $('#filter-view .fa-th-list').toggle()
    $('#pokemon-wrapper').toggleClass('list-view')
})

$('.sidebar-link').mouseenter(function () {
    $(this).children(".icon.right").transition('jiggle')
})

$('.sidebar-link.living-dex').click(function () {
    if (!$('.sidebar-link.living-dex').hasClass('active')) {
        $('.content-panel.active').fadeOut('fast', function () {
            $('.content-panel.active').removeClass('active')
            $('.content-panel.dex').addClass('active').fadeIn('fast')
        })
    }
})

$('.sidebar-link.legacy-moves').click(function () {
    $('.content-panel.active').fadeOut('fast', function () {
        $('.content-panel.active').removeClass('active')
        $('.content-panel.legacy-moves').addClass('active').fadeIn('fast')
    })
})

$('.sidebar-link.user-settings').click(function () {
    $('.content-panel.active').fadeOut('fast', function () {
        $('.content-panel.active').removeClass('active')

        $.ajax({
            url: '/api/user/' + $('#user-profile').data('username') + '/get?settings=all',
            type: 'GET',
            success: function (response) {
                let _settings = JSON.parse(response)['settings']

                if (!_settings.public) {
                    $('.content-panel.user-settings .ui.checkbox').checkbox('set checked')
                } else {
                    $('.content-panel.user-settings .ui.checkbox').checkbox('set unchecked')
                }

                $('.content-panel.user-settings #email').val(_settings.email)
                $('.content-panel.user-settings').addClass('active').fadeIn('fast')
            },
            error: function (error) {
                console.log(error.status)
            }
        })
    })
})

$('#update-email').click(function () {
    let obj = {}
    obj['email'] = $('#email').val()
    let data = {data: JSON.stringify(obj)}

    $.ajax({
        url: '/api/user/' + $('#user-profile').data('username') + '/update',
        data: data,
        type: 'PUT',
        success: function (response) {

        },
        error: function (error) {
            console.log(error.status)
        }
    })
})