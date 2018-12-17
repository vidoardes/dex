$.fn.renderallpokemon = function () {
    let _qs = '?' + $.param(qs)
    let _container = $(this)

    $('#pokemon-list .ui.dimmer').dimmer('show')

    $.ajax({
        url: '/api/' + $('#user-profile').data('username') + '/pokemon/get' + _qs,
        type: 'GET',
        success: function (r) {
            let _pokemon_list = r['pokemon']
            $('#pokemon-wrapper').renderpokemon(_pokemon_list, 'generate')
            $.updateurl()
        },
        error: function (e) {
            console.log(e.status)
            $('#pokemon-list .ui.dimmer').dimmer('hide')
        }
    })
}

$.fn.updatestate = function (statetype) {
    let _qs = '?' + $.param(qs)
    var _pokemon = $(this).parent().parent()

    _pokemon.data(statetype, !_pokemon.data(statetype))

    var _forme = _pokemon.data('key')
    var _dex = _pokemon.data('dex')
    var _state = _pokemon.data(statetype)
    var _ownedstate = _pokemon.checkownedstate()

    var obj = {}
    obj['forme'] = _forme
    obj['dex'] = _dex
    obj[statetype] = _state
    obj['owned'] = _ownedstate

    var data = {data: JSON.stringify(obj)}

    $.ajax({
        url: '/api/' + $('#user-profile').data('username') + '/pokemon/update' + _qs,
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

    const Pokemon = ({name, forme, dex, p_uid, released, owned, shiny, shinyowned, male, maleowned, female, femaleowned, ungendered, ungenderedowned, luckyowned, type1, type2,}) => `
        <div class="pokemon${owned ? ' owned' : ''}"
            ${maleowned ? 'data-maleowned="True"' : ''}
            ${femaleowned ? 'data-femaleowned="True"' : ''}
            ${ungenderedowned ? 'data-ungenderedowned="True"' : ''}
            ${shinyowned ? 'data-shinyowned="True"' : ''}
            ${luckyowned ? 'data-luckyowned="True"' : ''}
            ${owned ? 'data-owned="True"' : ''}
            ${released ? '' : 'data-unreleased="False"'}
            data-key="${forme}"
            data-dex="${dex}">
            
            <div class="img"><img src="../static/img/sprites/pokemon_icon_${p_uid}${qs.cat === 'shiny' ? '_shiny' : ''}.png"></img></div>
            <div class="info">${forme}</div>
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
        let arrayLength = list.length

        if (type === 'generate') {
            $('.pokemon-result-count').html(list.length + ' pokemon found').fadeIn("fast")

            $(this).html('').append(list.map(Pokemon).join(''))
            $('#pokemon-list .ui.dimmer').dimmer('hide')

        } else if (type === 'update') {
            for (let i = 0; i < arrayLength; i++) {
                let _pokemon = list[i]
                $(this)
                    .find('[data-key="' + _pokemon.forme + '"]')
                    .replaceWith([_pokemon].map(Pokemon).join(''))
            }
        }
    } else {
        $('.pokemon-result-count').html(list.length + ' pokemon found').fadeIn("fast")

        $(this).fadeOut("fast", function () {
            $(this).html('<p id="no-results">Unfortunatly there are no Pokemon that match your criteria. Please select a different option from the filters above.</p>').fadeIn("fast")
            $('#pokemon-list .ui.dimmer').dimmer('hide')

        })
    }
}

$.fn.renderpokemoncard = function () {
    const PokemonCard = ({name, forme, dex, p_uid, released, owned, shiny, shinyowned, male, maleowned, female, femaleowned, ungendered, ungenderedowned, luckyowned, type1, type2, classification, max_cp, base_attack, base_defense, base_stamina}) => `
        <div class="ui modal pokemon-card data-key="${forme}" data-dex="${dex}">
            <i class="close icon"></i>
            <div class="header">
                #${dex.toString().padStart(3, '0')} ${forme}
                <span class="sub-header"> - ${classification} Pokémon</span>
            </div>
            <div class="content">
                <div class="ui grid stackable two column">
                    <div class="column img">
                        <img src="../static/img/sprites/pokemon_icon_${p_uid}${qs.cat === 'shiny' ? '_shiny' : ''}.png">
                    </div>
                    <div class="column">
                        <div class="max_cp_stat stat_bar">
                            <div class="label">Max CP</div>
                            <div class="ui red progress small" data-value="${max_cp}" data-total="5441" id="base_attack">
                              <div class="bar"></div>
                            </div>
                            <div class="stat">${max_cp} / 5441</div>
                        </div>
                        <div class="attack_stat stat_bar">
                            <div class="label">Attack</div>
                            <div class="ui green progress small attack_stat" data-value="${base_attack}" data-total="414" id="base_attack">
                              <div class="bar"></div>
                            </div>
                            <div class="stat">${base_attack} / 414</div>
                        </div>
                        <div class="defense_stat stat_bar">
                            <div class="label">Defense</div>
                            <div class="ui blue progress small defense_stat" data-value="${base_defense}" data-total="396" id="base_attack">
                              <div class="bar"></div>
                            </div>
                            <div class="stat">${base_defense} / 396</div>
                        </div>
                        <div class="stamina_stat stat_bar">
                            <div class="label">Stamina</div>
                            <div class="ui pink progress small stamina_stat" data-value="${base_stamina}" data-total="510" id="base_attack">
                              <div class="bar"></div>
                            </div>
                            <div class="stat">${base_stamina} / 510</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `

    var _pokemon = $(this).parent()
    let _qs = '?name=' + _pokemon.data('key')

    $.ajax({
        url: '/api/' + $('#user-profile').data('username') + '/pokemon/get' + _qs,
        type: 'GET',
        success: function (r) {
            let _pokemon_list = r['pokemon']

            if (_pokemon_list.length > 0) {
                let _pokemon = _pokemon_list[0]

                $('body .pokemon-card').remove()
                $('body').append([_pokemon].map(PokemonCard).join(''))

                $('.ui.progress').progress({showActivity: false,})

                $('.pokemon-card.modal').modal({
                    blurring: true,
                }).modal('show')
            }
        },
        error: function (e) {
            console.log(e.status)
        }
    })
}

$.updateurl = function () {
    let urlParts = window.location.href.split('?')

    if (urlParts.length > 0) {
        let baseUrl = urlParts[0]
        let updatedQueryString = ''

        for (const [key, value] of Object.entries(qs)) {
            updatedQueryString = updatedQueryString + key + '=' + value + '&'
        }

        updatedQueryString = updatedQueryString.slice(0, -1)
        if (updatedQueryString.length > 0) {
            var updatedUri = baseUrl + '?' + updatedQueryString
            window.history.replaceState({}, document.title, updatedUri)
        }
    }
}

$.fn.api.settings.api = {
    'search': '/api/users/get?q={query}',
}

$.taketour = function () {
    introJs()
        .oncomplete(function () {
            let obj = {}
            obj['tour'] = true
            let data = {data: JSON.stringify(obj)}

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
        })
        .addStep({
            element: document.querySelectorAll('#sidebar')[0],
            intro: "Welcome to DEX! You look new here, let me show you around.<br /><br />This is your player profile, which will show you your stats and allow you to change your settings. <br /><br /> If you are view someone elses profile, it will show you their details. Neat, huh?<br /><br />Speaking of other trainers...",
        })
        .addStep({
            element: document.querySelectorAll('.ui.search .ui')[0],
            intro: "Here is the search, which you can find other trainers profiles. That way you can see what they need, and make sure you keep them back for trading.<br /><br />If you'd rather not be found in the search, you can set your profile to private.",
        })
        .addStep({
            element: document.querySelectorAll('#pokemon-list')[0],
            intro: "... and here is what you came for, the pokemon! This is a list of every Pokemon currently availible in Pokemon GO, with a picture, name, dex number, and 4 options",
        })
        .addStep({
            element: document.querySelectorAll('.pm-opt')[0],
            intro: "You can record wether you have caught one of each gender, it's shiny form, or have a lucky variant. The options will only be active if they apply to the individual Pokemon no telling people you have a shiny Mew!",
        })
        .addStep({
            element: document.querySelectorAll('.pokemon.img img')[0],
            intro: "Clicking on the image of the Pokemon will reveal a popup, showing more details about each creature.",
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

// INITIALISE UI

let qs = {}

$(function () {
    var params = new window.URLSearchParams(window.location.search);
    var viewportWidth = $(window).width()
    if (viewportWidth < 421) {
        $("#pokemon-wrapper").addClass("list-view")
        $("#filter-view .th-list").hide()
        $("#filter-view .th-large").show()
    }

    if(params.get("page") === "legacy") {
        $(".sidebar-link.legacy-moves").trigger("click")
        return
    }

    if(params.get("page") === "raid") {
        $(".sidebar-link.raid-bosses").trigger("click")
        return
    }

    if(params.get("page") === "eggs") {
        $(".sidebar-link.egg-hatches").trigger("click")
        return
    }

    if(params.get("page") === "settings") {
        $(".sidebar-link.user-settings").trigger("click")
        return
    }

    if(!params.has("list")) {
        $('#list-select').val($('.list-selectors .menu .item:first').attr('data-value'))
        $('.list-header .ui.dropdown').dropdown()
    }

    if ($('#gen-select').val() !== 'None') {
        qs.gen = $('#gen-select').val()
    }

    if ($('#cat-select').val() !== 'None') {
        qs.cat = $('#cat-select').val()
    }

    if ($('#own-select').val() !== 'None') {
        qs.own = $('#own-select').val()
    }

    if ($('#list-select').val() !== 'None') {
        qs.list = $('#list-select').val()
    }

    $('.ui.search').search()
    $('#pokemon-wrapper').renderallpokemon()


    if ($('body').data("take-tour") === 'True') {
        $.taketour()
    }
})

// SIDEBAR

$('#sidebartoggle').click(function () {
    $('#sidebar').toggleClass('show-sidebar')
})

$('.sidebar-link').mouseenter(function () {
    $(this).children(".icon.right").transition('jiggle')
})

// POKEDEX

$('.sidebar-link.living-dex').click(function () {
    $('#list-select').val($('.list-selectors .menu .item:first').attr('data-value'))
    $('.list-header .ui.dropdown').dropdown()
    qs.list == $('#list-select').val()

    if (!$('.sidebar-link.living-dex').hasClass('active')) {
        $('.content-panel.active').fadeOut('fast', function () {
            $('.content-panel.active').removeClass('active')
            $('.sidebar-link.active').removeClass('active')
            $('.sidebar-link.living-dex').addClass('active')
            $('#pokemon-wrapper').renderallpokemon()
            $('.content-panel.dex').addClass('active').fadeIn()
            $('#sidebar').removeClass('show-sidebar')
        })
    }
})

$('#pokemon-filters .ui.dropdown').dropdown().on('change', '#gen-select', function () {
    qs.gen = $('#gen-select').val()
    $('#pokemon-list').renderallpokemon()
}).on('change', '#cat-select', function () {
    qs.cat = $('#cat-select').val()
    $('#pokemon-list').renderallpokemon()
}).on('change', '#own-select', function () {
    qs.own = $('#own-select').val()
    $('#pokemon-list').renderallpokemon()
})

$('.list-header .ui.dropdown').dropdown().on('change', '#list-select', function () {
    qs.list = $('#list-select').val()
    $('#pokemon-list').renderallpokemon()
})

$('#filter-view i').popup().click(function () {
    $('#filter-view .fa-th-large').toggle()
    $('#filter-view .fa-th-list').toggle()
    $('#pokemon-wrapper').toggleClass('list-view')
})

$('#pokemon-wrapper').on('click', '.pokemon .img', function () {
    $(this).renderpokemoncard()
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

// LEGACY MOVES

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

// RAID BOSSES

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
                const RaidBoss = ({name, forme, dex, p_uid, shiny, raid, battle_cp, max_cp, max_cp_weather, min_cp, min_cp_weather, type1, type2}) => `
                    <div class="raid-boss">
                        <div class="img">
                            <img src="../static/img/sprites/pokemon_icon_${p_uid}${shiny ? '_shiny' : ''}.png" />
                            ${shiny ? "<div class='shiny'></div>" : "" }
                        </div>
                        <div class="name">
                            ${forme}
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
                        .append('<div class="raid-boss-tier t' + _tier + ' ui segment">' + _raid_bosses_tier.map(RaidBoss).join('') + '</div>')
                        .fadeIn()
                }
            },
            error: function (e) {
                console.log(e.status)
            }
        })
    })
})

// EGGS

$('.sidebar-link.egg-hatches').click(function () {
    $('.content-panel.active').fadeOut('fast', function () {
        $.ajax({
            url: '/api/pokemon/egghatches/get',
            type: 'GET',
            success: function (r) {
                const EggHatch = ({forme, dex, shiny, p_uid, min_hatch_cp, max_hatch_cp}) => `
                    <div class="egg-hatch">
                        <div class="name">
                            ${forme.includes("Alolan") ? forme.replace("Alolan", "A.") : forme}
                        </div>
                        <div class="img">
                            <img src="../static/img/sprites/pokemon_icon_${p_uid}${shiny ? '_shiny' : ''}.png" />
                            ${shiny ? "<div class='shiny'></div>" : "" }
                        </div>
                        <div class="cp">
                            <div class="cp_label">CP</div>
                            <div class="cp_range">${min_hatch_cp} - ${max_hatch_cp}</div>
                        </div>
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
                        .append('<div class="ui segment egg-hatch-tier tier-' + key + 'km"><div class="tier-header"><img src="../static/img/egg_' + key + 'km.png" />' + key + 'KM Eggs</div><div class="pokemon_list">' + _egg_hatches_group.map(EggHatch).join('') + '</div></div>')
                        .fadeIn()
                }
            },
            error: function (e) {
                console.log(e.status)
            }
        })
    })
})


// SETTINGS

$('.sidebar-link.user-settings').click(function () {
    $('.content-panel.active').fadeOut('fast', function () {
        $.ajax({
            url: '/api/user/' + $('#user-profile').data('username') + '/settings/get',
            type: 'GET',
            success: function (r) {
                let _settings = r['settings']

                // for (const [key, value] of Object.entries(_settings.config["view-settings"])) {
                //     if (value == false) {
                //         $('.view-settings .ui.checkbox.' + key).checkbox('set unchecked')
                //     } else {
                //         $('.view-settings .ui.checkbox.' + key).checkbox('set checked')
                //     }
                // }

                if (!_settings.public) {
                    $('.content-panel.user-settings .ui.checkbox.private-profile').checkbox('set checked')
                } else {
                    $('.content-panel.user-settings .ui.checkbox.private-profile').checkbox('set unchecked')
                }

                if (_settings.unsubscribe) {
                    $('.content-panel.user-settings .ui.checkbox.private-profile').checkbox('set checked')
                } else {
                    $('.content-panel.user-settings .ui.checkbox.private-profile').checkbox('set unchecked')
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

// $('.view-settings .ui.checkbox').checkbox({
//     onChange: function () {
//         let _obj = {}
//         let _setting_changed = $(this).attr('name')
//
//         _obj['view-settings'] = {[_setting_changed]: $('.ui.checkbox.' + _setting_changed).checkbox('is checked')}
//
//         let data = {data: JSON.stringify(_obj)}
//
//         $.ajax({
//             url: '/api/user/' + $('#user-profile').data('username') + '/settings/update',
//             data: data,
//             type: 'PUT',
//             success: function (r) {
//
//             },
//             error: function (e) {
//                 console.log(e.status)
//             }
//         })
//     }
// })

$('.ui.checkbox.private-profile').checkbox({
    onChange: function () {
        let _obj = {}
        _obj['public'] = $('.ui.checkbox.private-profile').checkbox('is unchecked')
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

$('.ui.checkbox.unsubscribe').checkbox({
    onChange: function () {
        let _obj = {}
        _obj['unsubscribe'] = $('.ui.checkbox.unsubscribe').checkbox('is checked')
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

$('.delete-profile').click(function () {
    $('.tiny.modal.delete-profile').modal('show')
})

$('.ui.tiny.modal.delete-profile')
    .modal({
        closable: false,
        onApprove: function () {
            $.ajax({
                url: '/api/user/' + $('#user-profile').data('username') + '/settings/delete',
                success: function (r) {
                    window.location.href = '/logout'
                },
                error: function (e) {
                    console.log(e.status)
                }
            })
        }
    })