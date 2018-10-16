$.fn.renderallpokemon = function () {
    let _qs = '?' + $.param(qs)
    let _container = $(this)

    $.ajax({
        url: '/api/' + $('#user-profile').data('username') + '/pokemon/get' + _qs,
        type: 'GET',
        success: function (r) {
            let _pokemon_list = r['pokemon']
            $('#pokemon-wrapper').renderpokemon(_pokemon_list, 'generate')
        },
        error: function (e) {
            console.log(e.status)
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
        success: function (r) {
            let _pokemon_list = r['updated_pokemon']
            $('#pokemon-wrapper').renderpokemon(_pokemon_list, 'update')
        },
        error: function (e) {
            console.log(e.status)
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

    const Pokemon = ({name, dex, img_suffix, released, owned, shiny, shinyowned, male, maleowned, female, femaleowned, ungendered, ungenderedowned, luckyowned, type1, type2,}) => `
        <div class="pokemon ${owned ? 'owned' : ''}"
            ${maleowned ? 'data-maleowned="True"' : ''}
            ${femaleowned ? 'data-femaleowned="True"' : ''}
            ${ungenderedowned ? 'data-ungenderedowned="True"' : ''}
            ${shinyowned ? 'data-shinyowned="True"' : ''}
            ${luckyowned ? 'data-luckyowned="True"' : ''}
            ${owned ? 'data-owned="True"' : ''}
            ${released ? '' : 'data-unreleased="False"'}
            data-key="${name}"
            data-dex="${dex}">
            
            <div class="img" style="background-image: url('../static/img/sprites/pokemon_icon_${dex.toString().padStart(3, '0')}${img_suffix}${qs.cat === 'shiny' ? '_shiny' : ''}.png')"></div>
            <div class="info">${name}</div>
            <div class="type">
                ${type1 !== null ? '<img src="../static/img/types/icon_' + type1 + '.png" />' : ''}
                ${type2 !== null ? '<img src="../static/img/types/icon_' + type2 + '.png" />' : ''}
            </div>
            <div class="dex-num">#${dex.toString().padStart(3, '0')}</div>
            <div class="pm-opt">
                ${ungendered ? pokemonoptions('ungendered', ungendered, ungenderedowned, released) : pokemonoptions('male', male, maleowned, released) + pokemonoptions('female', female, femaleowned, released)}
                ${pokemonoptions('shiny', shiny, shinyowned, released)}
                ${pokemonoptions('lucky', 'True', luckyowned, released)}
            </div>
        </div>
    `

    if (list.length > 0) {
        if (type === 'generate') {
            $('.pokemon-result-count').fadeOut("fast", function() { $(this).html(list.length + ' pokemon found').fadeIn("fast")})
            $(this).fadeOut("fast", function () {
                $(this)
                    .html('')
                    .append(list.map(Pokemon).join(''))
                    .fadeIn()
            })
        } else if (type === 'update') {
            let arrayLength = list.length

            for (let i = 0; i < arrayLength; i++) {
                let _pokemon = list[i]
                $(this)
                    .find('[data-key="' + _pokemon.name + '"]')
                    .replaceWith([_pokemon].map(Pokemon).join(''))
            }
        }
    } else {
        $('.pokemon-result-count').fadeOut("fast")
        $(this).fadeOut("fast", function () {
            $(this).html('<p id="no-results">Unfortunatly there are no Pokemon match your criteria. Please select a different option from the choices above.</p>').fadeIn("fast")

        })
    }
}

$.fn.api.settings.api = {
    'search': '/api/users/get?q={query}',
}

let qs = {}

$(function () {
    $('#pokemon-wrapper').renderallpokemon()

    $('.ui.checkbox').checkbox({
        onChange: function () {
            let _obj = {}
            _obj['public'] = $('.ui.checkbox').checkbox('is unchecked')
            let data = {data: JSON.stringify(_obj)}

            $.ajax({
                url: '/api/user/' + $('#user-profile').data('username') + '/settings/update',
                data: data,
                type: 'PUT',
                success: function (r) {

                },
                error: function (e) {
                    console.log(e.status)
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
                    success: function (r) {

                    },
                    error: function (e) {
                        console.log(e.status)
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
            $('.sidebar-link.active').removeClass('active')
            $('.sidebar-link.living-dex').addClass('active')
            $('.content-panel.dex').addClass('active').fadeIn()
            $('#sidebar').removeClass('show-sidebar')
        })
    }
})

$('.sidebar-link.legacy-moves').click(function () {
    if (!$('.sidebar-link.legacy-moves').hasClass('active')) {
        $('.content-panel.active').fadeOut('fast', function () {
            $('.content-panel.active').removeClass('active')
            $('.sidebar-link.active').removeClass('active')
            $('.sidebar-link.legacy-moves').addClass('active')
            $('.content-panel.legacy-moves #legacy-moves-list').html('')
            $('.content-panel.legacy-moves').addClass('active').fadeIn()
            $('#sidebar').removeClass('show-sidebar')
        })
    }
})


$('.sidebar-link.raid-bosses').click(function () {
    $('.content-panel.active').fadeOut('fast', function () {
        $('.content-panel.active').removeClass('active')
        $('.sidebar-link.active').removeClass('active')
        $('.sidebar-link.raid-bosses').addClass('active')
        $('.content-panel.raid-bosses #raid-bosses-list').html('')
        $('.content-panel.raid-bosses').addClass('active').fadeIn()
        $('#sidebar').removeClass('show-sidebar')

        $.ajax({
            url: '/api/pokemon/raidbosses/get',
            type: 'GET',
            success: function (r) {
                const RaidBoss = ({name, dex, img_suffix, shiny, raid, battle_cp, max_cp, max_cp_weather, min_cp, min_cp_weather, type1, type2}) => `
                    <div class="raid-boss">
                        <div class="tier">
                            ${raid === 6 ? 'EX' : ''}
                            ${raid === 5 ? 'V' : ''}
                            ${raid === 4 ? 'IV' : ''}
                            ${raid === 3 ? 'III' : ''}
                            ${raid === 2 ? 'II' : ''}
                            ${raid === 1 ? 'I' : ''}
                        </div>
                        <div class="img">
                            <img src="../static/img/sprites/pokemon_icon_${dex.toString().padStart(3, '0')}${img_suffix}${shiny ? '_shiny' : ''}.png" />
                        </div>
                        <div class="name">
                            ${name}
                            ${shiny ? "<div class='shiny'><i class='icon star'></i></div>" : "" }
                        </div>
                        <div class="type">
                            ${type1 !== null ? '<img src="../static/img/types/icon_' + type1 + '.png" />' : ''}
                            ${type2 !== null ? '<img src="../static/img/types/icon_' + type2 + '.png" />' : ''}
                        </div>
                        <div class="battle_cp">${battle_cp.toLocaleString('en')}CP</div>
                        <div class="cp">
                            <div class="cp_range">${min_cp.toLocaleString('en')} - ${max_cp.toLocaleString('en')}</div>
                            <div class="cp_range_weather">${min_cp_weather.toLocaleString('en')} - ${max_cp_weather.toLocaleString('en')}</div>
                        </div>
                    </div>
                `

                let _raid_bosses = r['raidbosses']
                let sorted_tiers = []

                for (const key in _raid_bosses) {
                    sorted_tiers[sorted_tiers.length] = key
                }

                sorted_tiers.sort().reverse()

                for (const tier in sorted_tiers) {
                    let _tier = sorted_tiers[tier]
                    let _raid_bosses_tier = _raid_bosses[_tier]

                    $("#raid-bosses-list")
                        .append('<div class="raid-boss-tier t' + _tier + '">' + _raid_bosses_tier.map(RaidBoss).join('') + '</div>')
                        .fadeIn()
                }
            },
            error: function (e) {
                console.log(e.status)
            }
        })
    })
})

$('.sidebar-link.egg-hatches').click(function () {
    $('.content-panel.active').fadeOut('fast', function () {
        $.ajax({
            url: '/api/pokemon/egghatches/get',
            type: 'GET',
            success: function (r) {
                const EggHatch = ({name, dex, img_suffix, shiny}) => `
                    <div class="egg-hatch">
                        <div class="img">
                            <img src="../static/img/sprites/pokemon_icon_${dex.toString().padStart(3, '0')}${img_suffix}${shiny ? '_shiny' : ''}.png" />
                            ${shiny ? "<div class='shiny'><i class='icon star'></i></div>" : "" }
                        </div>
                        <div class="name">${name}</div>
                    </div>
                `

                let _egg_hatches = r['egghatches']

                $('.content-panel.active').removeClass('active')
                $('.sidebar-link.active').removeClass('active')
                $('.sidebar-link.egg-hatches').addClass('active')
                $('.content-panel.egg-hatches #egg-hatches-list').html('')
                $('.content-panel.egg-hatches').addClass('active').fadeIn()
                $('#sidebar').removeClass('show-sidebar')

                for (const [key, value] of Object.entries(_egg_hatches)) {
                    let _egg_hatches_group = value

                    $("#egg-hatches-list")
                        .append('<div class="egg-hatch-tier tier-' + key + 'km"><div class="tier-header"><img src="../static/img/egg_' + key + 'km.png" />' + key + 'km Eggs</div><div class="pokemon_list">' + _egg_hatches_group.map(EggHatch).join('') + '</div></div>')
                        .fadeIn()
                }
            },
            error: function (e) {
                console.log(e.status)
            }
        })
    })
})

$('.sidebar-link.user-settings').click(function () {
    $('.content-panel.active').fadeOut('fast', function () {
        $.ajax({
            url: '/api/user/' + $('#user-profile').data('username') + '/settings/get',
            type: 'GET',
            success: function (r) {
                let _settings = r['settings']

                if (!_settings.public) {
                    $('.content-panel.user-settings .ui.checkbox').checkbox('set checked')
                } else {
                    $('.content-panel.user-settings .ui.checkbox').checkbox('set unchecked')
                }

                $('.content-panel.active').removeClass('active')
                $('.sidebar-link.active').removeClass('active')
                $('.sidebar-link.user-settings').addClass('active')
                $('.content-panel.user-settings #email').val(_settings.email)
                $('.content-panel.user-settings #level').val(_settings.player_level)
                $('.content-panel.user-settings').addClass('active').fadeIn()
                $('#sidebar').removeClass('show-sidebar')
            },
            error: function (e) {
                console.log(e.status)
            }
        })
    })
})

$('#update-email').click(function () {
    let _obj = {}
    _obj['email'] = $('#email').val()
    let data = {data: JSON.stringify(_obj)}

    $.ajax({
        url: '/api/user/' + $('#user-profile').data('username') + '/settings/update',
        data: data,
        type: 'PUT',
        success: function (r) {
            $('#update-email').removeClass("primary").addClass("positive").html("<i class='fas fa-fw fa-check'></i> Email Saved!").transition('pulse')
            setTimeout(function () {
                $('#update-email').transition('pulse').removeClass("positive").addClass("primary").html("<i class='fas fa-fw fa-envelope'></i> Update Email")
            }, 3000)
        },
        error: function (e) {
            console.log(e.status)
            $('#update-email').removeClass("primary").addClass("negative").html("<i class='fas fa-fw fa-times'></i> Already Taken!").transition('shake')
            setTimeout(function () {
                $('#update-email').transition('pulse').removeClass("negative").addClass("primary").html("<i class='fas fa-fw fa-envelope'></i> Update Email")
            }, 3000)
        }
    })
})

$('#update-player-level').click(function () {
    let _obj = {}
    _obj['player_level'] = $('#level').val()
    let data = {data: JSON.stringify(_obj)}

    $.ajax({
        url: '/api/user/' + $('#user-profile').data('username') + '/settings/update',
        data: data,
        type: 'PUT',
        success: function (r) {
            $('#update-player-level').removeClass("primary").addClass("positive").html("<i class='fas fa-fw fa-check'></i> Leveled Up!").transition('pulse')
            setTimeout(function () {
                $('#update-player-level').transition('pulse').removeClass("positive").addClass("primary").html("<i class='fas fa-fw fa-hand-point-up'></i> Level Up!")
            }, 3000)
        },
        error: function (e) {
            console.log(e.status)
            $('#update-player-level').removeClass("primary").addClass("negative").html("<i class='fas fa-fw fa-times'></i> Invalid Level!").transition('shake')
            setTimeout(function () {
                $('#update-player-level').transition('pulse').removeClass("negative").addClass("primary").html("<i class='fas fa-fw fa-hand-point-up'></i> Level Up!")
            }, 3000)
        }
    })
})