function renderAllPokemon() {
    let _qs = '?' + $.param(qs);

    $.ajax({
        url: `/api/${$userProfile.data('username')}/pokemon/get${_qs}`,
        type: 'GET',
        success: (r) => {
            if (r['pokemon'] === "end") {
                console.log('No more results, render complete');
                return false
            }

            if (r['pokemon'].length === 0) {
                console.log('No results found');
                $renderRunning = false;
                $filterDimmer.removeClass('active');
                $resultCount.html('No pokemon found :(').fadeIn('fast');
                $pokemonWrapper.html('<p id="no-results">Unfortunately there are no Pokemon that match your criteria. Please select a different option from the filters above.</p>');
                return false
            }

            if (qs.c === 0) {
                console.log('Render starting...')
            } else {
                console.log('Updating results...')
            }

            let _pokemon_list = r['pokemon'];
            let urlParts = window.location.href.split('?');

            window.history.replaceState({}, document.title, urlParts[0] + '?' + r['updated-qs']);

            let params = new window.URLSearchParams(window.location.search);

            qs.gen = params.get('gen');
            qs.cat = params.get('cat');
            qs.own = params.get('own');
            qs.list = params.get('list');

            $resultCount.html(r['total_owned'] + ' owned of ' + r['total_results'] + ' pokemon found').fadeIn('fast');

            renderPokemon(_pokemon_list, 'generate');

            $('.list-header .export-list').attr('data-clipboard-text', r['dex_str'])
        },
        error: function (e) {
            console.log(e.status)
        }
    }).then(() => {

    })
}

$.fn.updateState = function (stateType) {
    let _pokemon = $(this).closest('.pokemon');
    _pokemon.data(stateType, !_pokemon.data(stateType));

    let obj = {
        "forme": _pokemon.data('key'),
        "dex": _pokemon.data('dex'),
        "owned": checkOwnedState(_pokemon),
        "list": qs["list"]
    };

    obj[stateType] = _pokemon.data(stateType);

    let data = {data: JSON.stringify(obj)};

    $.ajax({
        url: `/api/${$userProfile.data('username')}/pokemon/update`,
        data: data,
        type: 'PUT',
        success: (r) => {
            let _pokemon_list = r['updated_pokemon'];
            console.log(`Updating ${_pokemon.data('key')}, setting ${stateType} to ${_pokemon.data(stateType)}`);
            renderPokemon(_pokemon_list, 'update')
        },
        error: function (e) {
            console.log(e.status)
        }
    }).then(() => {
        $('.pokemon .img img').on('click', function () {
            renderPokemonCard($(this));
        })
    })
};

function checkOwnedState(_pokemon) {
    return !!(_pokemon.data('shinyowned')
        || _pokemon.data('alolanowned')
        || _pokemon.data('regionalowned')
        || _pokemon.data('maleowned')
        || _pokemon.data('femaleowned')
        || _pokemon.data('ungenderedowned')
        || _pokemon.data('luckyowned')
        || _pokemon.data('shadowowned')
        || _pokemon.data('purifiedowned'));
}

function renderPokemon(list, type) {
    function pokemonOptions(type, istype, isowned, released) {
        let icons = {
            'male': 'fa-mars',
            'female': 'fa-venus',
            'ungendered': 'fa-circle',
            'shiny': 'fa-sparkles',
            'lucky': 'fa-dice',
            'shadow': 'fa-fire',
            'purified': 'fa-star-christmas',
        };

        if (!released) {
            return ``
        }

        if (istype && type === 'ungendered') {
            return `
                <div class="${type} opt ${isowned ? 'owned' : ''}" data-content="${type}"><i class="fas ${icons[type]}"></i></div>
                <span class="opt"></span>
            `
        } else if (type === 'purified' && qs.cat.includes('level_1')) {
            return '<span class="opt"></span>'
        } else if (istype) {
            return `<div class="${type} opt ${isowned ? 'owned' : ''}" data-content="${type}"><i class="fas ${icons[type]}"></i></div>`
        } else {
            return `<span class="${type} opt ${isowned ? 'owned' : ''}" data-content="${type}"><i class="fas ${icons[type]}"></i></span>`
        }
    }

    function pokemonOwned(owned, shinyowned, luckyowned, shadowowned, purifiedowned) {
        if (
            (qs.cat.includes('shiny') && shinyowned)
            || (qs.cat.includes('lucky') && luckyowned)
            || (qs.cat.includes('shadow') && shadowowned)
            || (!qs.cat.includes('level_1') && purifiedowned)
            || (!qs.cat.includes('shiny') && !qs.cat.includes('lucky') && owned)
        ) {
            return 'owned'
        }
    }

    const Pokemon = ({forme, dex, gen, p_uid, released, owned, shiny, shinyowned, male, maleowned, female, femaleowned, ungendered, ungenderedowned, luckyowned, type1, type2, shadow, shadowowned, purifiedowned}) => {
        return `
            <div class="pokemon ${type1} ${pokemonOwned(owned, shinyowned, luckyowned)} ${shinyowned ? 'shinyowned' : ''} ${luckyowned ? 'luckyowned' : ''} ${shadowowned ? 'shadowowned' : ''}"
                ${maleowned ? 'data-maleowned="True"' : ''}
                ${femaleowned ? 'data-femaleowned="True"' : ''}
                ${ungenderedowned ? 'data-ungenderedowned="True"' : ''}
                ${shinyowned ? 'data-shinyowned="True"' : ''}
                ${shadowowned ? 'data-shadowowned="True"' : ''}
                ${purifiedowned ? 'data-purifiedowned="True"' : ''}
                ${luckyowned ? 'data-luckyowned="True"' : ''}
                ${owned ? 'data-owned="True"' : ''}
                ${released ? '' : 'data-unreleased="False"'}
                data-key="${forme}"
                data-dex="${dex}">
                
                <div class="img"><img src="../static/img/sprites/${gen}/pokemon_icon_${p_uid}${shinyowned ? '_shiny' : ''}.png" alt="${forme}" /></div>
                <div class="info">${forme}</div>
                <div class="type">
                    ${type1 !== null ? '<img src="../static/img/types/icon_' + type1 + '.png" alt="' + type1 + '" />' : ''}
                    ${type2 !== null ? '<img src="../static/img/types/icon_' + type2 + '.png" alt="' + type2 + '" />' : ''}
                </div>
                <div class="dex-num">#${dex.toString().padStart(3, '0')}</div>
                <div class="pm-opt">
                    ${ungendered ? pokemonOptions('ungendered', ungendered, ungenderedowned, released) : pokemonOptions('male', male, maleowned, released) + pokemonOptions('female', female, femaleowned, released)}
                    ${pokemonOptions('shiny', shiny, shinyowned, released)}
                    ${pokemonOptions('shadow', shadow, shadowowned, released)}
                    ${pokemonOptions('purified', shadow, purifiedowned, released)}
                    ${pokemonOptions('lucky', 'True', luckyowned, released)}
                </div>
            </div>
        `;
    };

    if (type === 'generate') {
        $('#no-results').remove();

        setTimeout(function() {
            console.log('Finished render');
            $filterDimmer.removeClass('active');
            $renderRunning = false;

            $('.pokemon .img img').on('click', function () {
                renderPokemonCard($(this));
            })
        }, list.length * 30);

        for (let i = 0; i < list.length; i++) {
            let template = [list[i]].map(Pokemon)[0];
            $(template).appendTo('#pokemon-wrapper');

            setTimeout(function () {
                $pokemonWrapper
                    .find('[data-key="' + list[i].forme + '"]')
                    .addClass('show');
            }, i * 30);

            qs.c += 1
        }
    } else if (type === 'update') {
        for (let i = 0; i < list.length; i++) {
            let _pokemon = list[i];
            $pokemonWrapper
                .find(`[data-key="${_pokemon.forme}"]`)
                .replaceWith([_pokemon].map(Pokemon).join(""));
            $pokemonWrapper
                .find(`[data-key="${_pokemon.forme}"]`)
                .addClass('show');
        }

        $renderRunning = false;
    }
}

function renderPokemonCard(pokemon) {
    const PokemonCard = ({forme, p_uid, dex, gen, classification, max_cp, base_attack, base_defense, base_stamina}) => `
        <div class="ui modal pokemon-card" data-key="${forme}" data-dex="${dex}">
            <i class="close icon"></i>
            <div class="header">
                #${dex.toString().padStart(3, '0')} ${forme}
                <span class="sub-header"> - ${classification} Pokémon</span>
            </div>
            <div class="content">
                <div class="ui grid stackable two column">
                    <div class="column img">
                        <img src="../static/img/sprites/${gen}/pokemon_icon_${p_uid}${qs.cat.includes('shiny') ? '_shiny' : ''}.png" alt="${forme}" />
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
    `;

    let _pokemon = $(pokemon).closest('.pokemon');
    let _qs = `?name=${encodeURIComponent(_pokemon.data('key'))}&cat=unreleased&list=${qs.list}`;

    $.ajax({
        url: `/api/${$userProfile.data('username')}/pokemon/get${_qs}`,
        type: 'GET',
        success: function (r) {
            let _pokemon_list = r['pokemon'];
            if (_pokemon_list.length > 0) {
                let _pokemon = _pokemon_list[0];

                $('body .pokemon-card').remove();
                $('body').append([_pokemon].map(PokemonCard).join(""));
            }
        },
        error: function (e) {
            console.log(e.status)
        }
    }).then(() => {
        $('.pokemon-card.modal').modal({
            blurring: true,
        }).modal('show')
    })
}

$.fn.api.settings.api = {
    'search': '/api/users/get?q={query}',
};

function takeTour() {
    introJs()
        .oncomplete(() => {
            let obj = {};
            obj['tour'] = true;
            let data = {data: JSON.stringify(obj)};

            $.ajax({
                url: `/api/user/${$userProfile.data('username')}/settings/update`,
                data: data,
                type: 'PUT',
                success: function (r) {

                },
                error: function (e) {
                    console.log(e.status)
                }
            }).then(() => {})
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
            intro: "You can record wether you have caught one of each gender, its shiny form, or have a lucky or shadow variant. The options will only be active if they apply to the individual Pokemon no telling people you have a shiny Mew!",
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
let qs = {
    'list': '',
    'gen': [],
    'cat': [],
    'own': '',
    'c': 0,
};

let filtersActive = true;
let $pokemonWrapper = $('#pokemon-wrapper');
let $listSelector = $('.list-header .ui.dropdown');
let $userProfile = $('#user-profile');
let $resultCount = $('.pokemon-result-count');
let $filterDimmer = $('#pokemon-filters .ui.dimmer');
let $renderRunning = false;

$(() => {
    let params = new window.URLSearchParams(window.location.search);
    let viewportWidth = $(window).width();

    if (viewportWidth < 421) {
        $pokemonWrapper.addClass('list-view');
        $('#filter-view .th-list').hide();
        $('#filter-view .th-large').show()
    }

    if (params.get('page') === "legacy") {
        $('.sidebar-link.legacy-moves').trigger('click');
        return
    }

    if (params.get('page') === "raid") {
        $('.sidebar-link.raid-bosses').trigger('click');
        return
    }

    if (params.get('page') === "eggs") {
        $('.sidebar-link.egg-hatches').trigger('click');
        return
    }

    if (params.get('page') === "settings") {
        $('.sidebar-link.user-settings').trigger('click');
        return
    }

    if (params.get('list')) {
        qs.list = params.get('list');
        console.log('Loading list: ' + qs.list);
    } else {
        console.log('No list provided');
    }

    if (params.get('gen')) {
        qs.gen = params.get('gen');
        console.log('Loading Generations: ' + qs.gen);
    } else {
        console.log('No generation filters provided');
    }

    if (params.get('cat')) {
        qs.cat = params.get('cat');
        console.log('Loading Categories: ' + qs.cat);
    } else {
        console.log('No categories provided');
    }

    if (params.get('own')) {
        qs.own = params.get('own');
        console.log('Loading Ownership: ' + qs.own);
    } else {
        console.log('No ownership flag provided');
    }

    $pokemonWrapper.visibility({
        initialCheck: true,
        context: document.getElementById('pokemon-list'),
        once: false,
        offset: 10,
        observeChanges: true,
        onBottomVisible: function () {
            if($renderRunning === false) {
                $renderRunning = true;
                renderAllPokemon()
            }
        }
    });

    $('.ui.search').search();

    let clipboard = new ClipboardJS('.list-header .export-list');
    $('.list-header .export-list').popup({
        on: 'click',
        position: 'right center',
        onShow: () => {
            setTimeout(() => {
                $('.list-header .export-list').popup('hide')
            }, 1500)
        }
    });

    if ($('body').data('take-tour') === 'True') {
        takeTour()
    }
});

// SIDEBAR

$('#sidebartoggle').on('click', () => {
    $('#sidebar').toggleClass('show-sidebar')
});

// POKEDEX

$('.sidebar-link.living-dex').on('click', () => {
    if (!$('.sidebar-link.living-dex').hasClass('active')) {
        $('.content-panel.active').fadeOut('fast', () => {
            $('.content-panel.active').removeClass('active');
            $('.sidebar-link.active').removeClass('active');
            $('.sidebar-link.living-dex').addClass('active');
            renderAllPokemon();
            $('.content-panel.dex').addClass('active').fadeIn();
            $('#sidebar').removeClass('show-sidebar')
        })
    }
});

$('#pokemon-filters .ui.dropdown').dropdown({
    clearable: true,
    onAdd: () => {
        $('.dropdown').trigger('blur')
    }
}).on('change', '#gen-select', () => {
    if (filtersActive) {
        qs.gen = $('#gen-select').val();
        qs.c = 0;

        console.log('Generation filter updated');
        $filterDimmer.addClass('active');
        $('#pokemon-wrapper .pokemon').remove();

        if($renderRunning === false) {
            $renderRunning = true;
            renderAllPokemon()
        }
    }
}).on('change', '#cat-select', () => {
    if (filtersActive) {
        qs.cat = $('#cat-select').val();
        qs.c = 0;

        console.log('Category filter updated');
        $filterDimmer.addClass('active');
        $('#pokemon-wrapper .pokemon').remove();

        if($renderRunning === false) {
            $renderRunning = true;
            renderAllPokemon()
        }
    }
}).on('change', '#own-select', () => {
    if (filtersActive) {
        qs.own = $('#own-select').val();
        qs.c = 0;

        console.log('Ownership filter updated');
        $filterDimmer.addClass('active');
        $('#pokemon-wrapper .pokemon').remove();

        if($renderRunning === false) {
            $renderRunning = true;
            renderAllPokemon()
        }
    }
});

$listSelector.dropdown({
    apiSettings: {
        url: `/api/${$userProfile.data('username')}/dex/getall`,
        method: 'GET',
        cache: false,
    },
    onChange: () => {
        if (filtersActive) {
            delete qs.gen;
            delete qs.own;
            delete qs.cat;

            qs.c = 0;
            qs.list = $('#list-select').val();

            console.log(`Loading new list: ${qs.list}`);

            $('#pokemon-wrapper .pokemon').remove();

            filtersActive = false;

            $('#pokemon-filters .ui.dropdown').dropdown('clear');

            filtersActive = true;
        }
    }
});

$('#filter-view i').popup().on('click', () => {
    $('#filter-view .fa-th-large').toggle();
    $('#filter-view .fa-th-list').toggle();
    $pokemonWrapper.toggleClass('list-view');
});

$pokemonWrapper.on('click', 'div.opt.shiny', function () {
    $(this).updateState('shinyowned')
}).on('click', 'div.opt.alolan', function () {
    $(this).updateState('alolanowned')
}).on('click', 'div.opt.regional', function () {
    $(this).updateState('regionalowned')
}).on('click', 'div.opt.male', function () {
    $(this).updateState('maleowned')
}).on('click', 'div.opt.female', function () {
    $(this).updateState('femaleowned')
}).on('click', 'div.opt.ungendered', function () {
    $(this).updateState('ungenderedowned')
}).on('click', 'div.opt.lucky', function () {
    $(this).updateState('luckyowned')
}).on('click', 'div.opt.shadow', function () {
    $(this).updateState('shadowowned')
}).on('click', 'div.opt.purified', function () {
    $(this).updateState('purifiedowned')
});

// LEGACY MOVES

$('.sidebar-link.legacy-moves').on('click', () => {
    if (!$('.sidebar-link.legacy-moves').hasClass('active')) {
        $('.content-panel.active').fadeOut('fast', () => {
            $('.content-panel.active').removeClass('active');
            $('.sidebar-link.active').removeClass('active');
            $('.sidebar-link.legacy-moves').addClass('active');
            $('.content-panel.legacy-moves #legacy-moves-list').html("");
            $('.content-panel.legacy-moves').addClass('active').fadeIn();
            $('#sidebar').removeClass('show-sidebar')
        })
    }
});

// RAID BOSSES

$('.sidebar-link.raid-bosses').on('click', () => {
    $('.content-panel.active').fadeOut('fast', () => {
        $('.content-panel.active').removeClass('active');
        $('.sidebar-link.active').removeClass('active');
        $('.sidebar-link.raid-bosses').addClass('active');
        $('.content-panel.raid-bosses #raid-bosses-list').html("");
        $('.content-panel.raid-bosses').addClass('active').fadeIn();
        $('#sidebar').removeClass('show-sidebar');

        $.ajax({
            url: '/api/pokemon/raidbosses/get',
            type: 'GET',
            success: function (r) {
                const RaidBoss = ({forme, gen, p_uid, shiny, battle_cp, max_cp, max_cp_weather, min_cp, min_cp_weather, type1, type2}) => `
                    <div class="raid-boss">
                        <div class="img">
                            <img src="../static/img/sprites/${gen}/pokemon_icon_${p_uid}${shiny ? '_shiny' : ''}.png" alt="${forme}" />
                            ${shiny ? "<div class='shiny'></div>" : ""}
                        </div>
                        <div class="name">
                            ${forme}
                        </div>
                        <div class="type">
                            ${type1 !== null ? '<img src="../static/img/types/icon_' + type1 + '.png" alt="' + type1 + '" />' : ''}
                            ${type2 !== null ? '<img src="../static/img/types/icon_' + type2 + '.png" alt="' + type2 + '" />' : ''}
                        </div>
                        <div class="battle_cp">${battle_cp.toLocaleString('en')}CP</div>
                        <div class="cp">
                            <div class="cp_range">${min_cp.toLocaleString('en')} - ${max_cp.toLocaleString('en')}</div>
                            <div class="cp_range_weather">${min_cp_weather.toLocaleString('en')} - ${max_cp_weather.toLocaleString('en')}</div>
                        </div>
                    </div>
                `;

                let _raid_bosses = r['raidbosses'];
                let sorted_tiers = [];

                for (const key in _raid_bosses) {
                    sorted_tiers[sorted_tiers.length] = key
                }

                sorted_tiers.sort().reverse();

                for (const tier in sorted_tiers) {
                    let _tier = sorted_tiers[tier];
                    let _raid_bosses_tier = _raid_bosses[_tier];

                    $('#raid-bosses-list')
                        .append(`<div class="raid-boss-tier t${_tier} ui segment">${_raid_bosses_tier.map(RaidBoss).join("")}</div>`)
                        .fadeIn()
                }
            },
            error: function (e) {
                console.log(e.status)
            }
        }).then(() => {})
    })
});

// EGGS

$('.sidebar-link.egg-hatches').on('click', () => {
    $('.content-panel.active').fadeOut('fast', () => {
        $.ajax({
            url: '/api/pokemon/egghatches/get',
            type: 'GET',
            success: function (r) {
                const EggHatch = ({forme, gen, shiny, p_uid, min_hatch_cp, max_hatch_cp}) => `
                    <div class="egg-hatch">
                        <div class="name">
                            ${forme.includes('Alolan') ? forme.replace("Alolan", "A.") : forme}
                        </div>
                        <div class="img">
                            <img src="../static/img/sprites/${gen}/pokemon_icon_${p_uid}${shiny ? '_shiny' : ''}.png" alt="${forme}" />
                            ${shiny ? "<div class='shiny'></div>" : ""}
                        </div>
                        <div class="cp">
                            <div class="cp_label">CP</div>
                            <div class="cp_range">${min_hatch_cp} - ${max_hatch_cp}</div>
                        </div>
                    </div>
                `;

                let _egg_hatches = r['egghatches'];

                $('.content-panel.active').removeClass('active');
                $('.sidebar-link.active').removeClass('active');
                $('.sidebar-link.egg-hatches').addClass('active');
                $('.content-panel.egg-hatches #egg-hatches-list').html("");
                $('.content-panel.egg-hatches').addClass('active').fadeIn();
                $('#sidebar').removeClass('show-sidebar');

                for (const [key, value] of Object.entries(_egg_hatches)) {
                    $('#egg-hatches-list')
                        .append(`<div class="ui segment egg-hatch-tier tier-${key}km">
                                    <div class="tier-header">
                                        <img src="../static/img/egg_${key}km.png" alt="${key}" />
                                        ${key}KM Eggs
                                    </div>
                                    <div class="pokemon_list">${value.map(EggHatch).join("")}</div>
                                 </div>
                                `)
                        .fadeIn()
                }
            },
            error: function (e) {
                console.log(e.status)
            }
        }).then(() => {})
    })
});


// SETTINGS

$('.sidebar-link.user-settings').on('click', () => {
    $('.content-panel.active').fadeOut("fast", () => {
        $.ajax({
            url: `/api/user/${$userProfile.data('username')}/settings/get`,
            type: 'GET',
            success: function (r) {
                let _settings = r['settings'];

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

                $('.content-panel.active').removeClass('active');
                $('.sidebar-link.active').removeClass('active');
                $('.sidebar-link.user-settings').addClass('active');
                $('.content-panel.user-settings #email').val(_settings.email);
                $('.content-panel.user-settings #level').val(_settings.player_level);
                $('.content-panel.user-settings').addClass('active').fadeIn();
                $('#sidebar').removeClass('show-sidebar')
            },
            error: function (e) {
                console.log(e.status)
            }
        }).then(() => {})
    })
});

$('.sidebar-link.support-site').on('click', () => {
    $('.ui.modal.support-site-popup').modal('show')
});

$('#update-email').on('click', () => {
    let _obj = {};
    _obj['email'] = $('#email').val();
    let data = {data: JSON.stringify(_obj)};

    $.ajax({
        url: `/api/user/${$userProfile.data('username')}/settings/update`,
        data: data,
        type: 'PUT',
        success: function () {
            $('#update-email').removeClass('primary').addClass('positive').html("<i class='fas fa-fw fa-check'></i> Email Saved!").transition('pulse');
            setTimeout(() => {
                $('#update-email').transition('pulse').removeClass('positive').addClass('primary').html("<i class='fas fa-fw fa-envelope'></i> Update Email")
            }, 3000)
        },
        error: function (e) {
            console.log(e.status);
            $('#update-email').removeClass('primary').addClass('negative').html("<i class='fas fa-fw fa-times'></i> Already Taken!").transition('shake');
            setTimeout(() => {
                $('#update-email').transition('pulse').removeClass('negative').addClass('primary').html("<i class='fas fa-fw fa-envelope'></i> Update Email")
            }, 3000)
        }
    }).then(() => {})
});

$('#update-player-level').on('click', () => {
    let _obj = {};
    _obj['player_level'] = $('#level').val();
    let data = {data: JSON.stringify(_obj)};

    $.ajax({
        url: `/api/user/${$userProfile.data('username')}/settings/update`,
        data: data,
        type: 'PUT',
        success: function () {
            $('#update-player-level').removeClass('primary').addClass('positive').html(`<i class="fas fa-fw fa-check"></i> Leveled Up!`).transition('pulse');
            setTimeout(() => {
                $('#update-player-level').transition('pulse').removeClass('positive').addClass('primary').html("<i class='fas fa-fw fa-hand-point-up'></i> Level Up!")
            }, 3000)
        },
        error: function (e) {
            console.log(e.status);
            $('#update-player-level').removeClass('primary').addClass('negative').html("<i class='fas fa-fw fa-times'></i> Invalid Level!").transition('shake');
            setTimeout(() => {
                $('#update-player-level').transition('pulse').removeClass('negative').addClass('primary').html("<i class='fas fa-fw fa-hand-point-up'></i> Level Up!")
            }, 3000)
        }
    }).then(() => {})
});

$('.create-dex').on('click', () => {
    $('.ui.modal.create-dex-popup .ui.dropdown').dropdown();
    $('.ui.modal.create-dex-popup').modal('show')
});

$('.create-dex-popup .ui.form').form({
    on: 'blur',
    inline: true,
    fields: {
        listname: {
            rules: [{
                type: 'empty',
                prompt: 'Please enter a name.'
            }, {
                type: 'regExp',
                value: /^[A-Za-z0-9]*(?:[\sA-Za-z0-9+\-<>|]+)$/i,
                prompt: 'Names can only contain letters, numbers, spaces, and the following characters: + - > < |.'
            }],
            identifier: "listname"
        },
        oldlist: {
            identifier: "oldlist",
        },
        listcolour: {
            identifier: "listcolour",
        },
        viewsettings: {
            identifier: "viewsettings",
        }
    }
});

$(`.ui.modal.create-dex-popup`)
    .modal({
        closable: true,
        onHidden: () => {
            $('.create-dex-popup .ui.form').form('reset');
            $('.create-dex-popup .ui.form .ui.error.message').empty()
        },
        onApprove: () => {
            let _obj = {};
            let _vs = {};
            let _form = $('.create-dex-popup .ui.form');

            if (!_form.form('is valid')) {
                return false
            }

            _obj['name'] = $('.create-dex-popup #list-name').val();
            _obj['colour'] = $('.create-dex-popup #list-colour').val();
            _obj['cat-filters'] = $('.create-dex-popup #cat-select').val();
            _obj['gen-filters'] = $('.create-dex-popup #gen-select').val();

            for (const [i, v] of _form.form('get value', 'viewsettings').entries()) {
                if (v) {
                    _vs[v] = true
                }
            }
            _obj['view-settings'] = _vs;

            let data = {data: JSON.stringify(_obj)};
            let _form_valid = false;

            $.ajax({
                async: false,
                url: `/api/${$userProfile.data('username')}/dex/add`,
                data: data,
                type: 'PUT',
                success: function () {
                    $('.ui.dropdown.list-edit-select').dropdown('change values', null);
                    $listSelector.dropdown('change values', null);
                    _form.form('validate form');
                    _form.form('reset');
                    _form_valid = true
                },
                error: function (e) {
                    console.log(e.status);
                    _form.form("add errors", [e.responseJSON["message"]])
                }
            }).then(() => {
                return _form_valid
            });
        }
    });

let editing_list_value = "";
let editing_list_name = "";

$('.ui.dropdown.list-edit-select').dropdown({
    apiSettings: {
        url: `/api/${$userProfile.data('username')}/dex/getall`,
        method: 'GET',
        cache: false,
    },
    onChange: function (value) {
        if (value === "") {
            return
        }

        $.ajax({
            url: `/api/${$userProfile.data('username')}/dex/get?list=${value}`,
            type: 'GET',
            success: function (r) {
                let _vs = [];

                for (const [key, value] of Object.entries(r["list-settings"]["view-settings"])) {
                    if (value) {
                        _vs.push(key)
                    }
                }

                $('.ui.modal.edit-dex-popup .ui.dropdown').dropdown('clear');

                $('.edit-dex-popup .ui.form').form('set values', {
                    oldlist: r["list-settings"]["value"],
                    listname: r["list-settings"]["name"],
                    listcolour: r["list-settings"]["colour"],
                    genfilters: r["list-settings"]["gen-filters"].split(","),
                    catfilters: r["list-settings"]["cat-filters"].split(","),
                    viewsettings: _vs,
                });

                editing_list_value = r["list-settings"]["value"];
                editing_list_name = r["list-settings"]["name"];
            },
            error: function (e) {
                console.log(e.status)
            }
        }).then(() => {
            $('.ui.modal.edit-dex-popup').modal('show');
            $('.ui.dropdown.list-edit-select').dropdown('clear')
        })
    }
});

$('.edit-dex-popup .ui.form').form({
    on: 'blur',
    inline: true,
    fields: {
        listname: {
            rules: [{
                type: 'empty',
                prompt: 'Please enter a name.'
            }, {
                type: 'regExp',
                value: /^[A-Za-z0-9]*(?:[\sA-Za-z0-9+\-<>|]+)$/i,
                prompt: 'Names can only contain letters, numbers, spaces, and the following characters: + - > < |.'
            }]
        }
    }
});

$('.ui.modal.edit-dex-popup')
    .modal({
        closable: true,
        onHidden: () => {
            $('.edit-dex-popup .ui.form').form('reset');
            $('.edit-dex-popup .ui.form .ui.error.message').empty()
        },
        onApprove: () => {
            let _obj = {};
            let _vs = {};
            let _form = $('.edit-dex-popup .ui.form');

            if (!_form.form('is valid')) {
                return false
            }

            _obj['name'] = $('.edit-dex-popup #list-name').val();
            _obj['old-list'] = $('.edit-dex-popup #old-list').val();
            _obj['colour'] = $('.edit-dex-popup #list-colour').val();
            _obj['cat-filters'] = $('.edit-dex-popup #cat-select').val();
            _obj['gen-filters'] = $('.edit-dex-popup #gen-select').val();

            for (const [i, v] of _form.form('get value', 'viewsettings').entries()) {
                if (v) {
                    _vs[v] = true
                }
            }

            _obj['view-settings'] = _vs;

            let data = {data: JSON.stringify(_obj)};
            let _form_valid = false;

            $.ajax({
                url: `/api/${$userProfile.data('username')}/dex/update`,
                data: data,
                type: 'PUT',
                async: false,
                success: function () {
                    console.log(`${editing_list_name} changes saved`);
                    $('.ui.dropdown.list-edit-select').dropdown('change values', null);
                    $listSelector.dropdown('change values', null);
                    _form.form('validate form');
                    _form.form('reset');
                    _form_valid = true
                },
                error: function (e) {
                    console.log(e.status);
                    _form.form("add errors", [e.responseJSON["message"]])
                }
            }).then(() => {
               return _form_valid
            });
        },
        onDeny: () => {
            $('.ui.modal.edit-dex-popup') .modal('close');
            $('.ui.modal.delete-dex-popup').modal({
                closable: true,
                onShow: function () {
                    let _header = $(this).find('.header');
                    let _content = $(this).find('.content');

                    _header.html(`Delete list - ${editing_list_name}`);
                    _content.html(`<p> Are you sure you want to delete ${editing_list_name}? This is irreversible!</p>`)
                },
                onApprove: () => {
                    $.ajax({
                        url: `/api/${$userProfile.data('username')}/dex/delete?list=${editing_list_value}`,
                        type: 'GET',
                        success: function () {
                            console.log(`${editing_list_name} deleted`)
                            $('.ui.dropdown.list-edit-select').dropdown('change values', null);
                            $listSelector.dropdown('change values', null);
                        },
                        error: function (e) {
                            console.log(e.status)
                        }
                    }).then(() => {

                    })
                }
            }).modal('show')
        }
    });

let $privateProfileToggle = $('.ui.checkbox.private-profile');

$privateProfileToggle.checkbox({
    onChange: () => {
        let _obj = {};
        _obj['public'] = $privateProfileToggle.checkbox('is unchecked');
        let data = {data: JSON.stringify(_obj)};

        $.ajax({
            url: `/api/user/${$userProfile.data('username')}/settings/update`,
            data: data,
            type: 'PUT',
            error: function (e) {
                console.log(e.status)
            }
        }).then(() => {})
    }
});

let $unsubToggle = $('.ui.checkbox.unsubscribe');

$unsubToggle.checkbox({
    onChange: () => {
        let _obj = {};
        _obj['unsubscribe'] = $unsubToggle.checkbox('is checked');
        let data = {data: JSON.stringify(_obj)};

        $.ajax({
            url: '/api/user/' + $userProfile.data('username') + '/settings/update',
            data: data,
            type: 'PUT',
            error: function (e) {
                console.log(e.status)
            }
        }).then(() => {})
    }
});

$('.delete-profile').on('click', () => {
    $('.tiny.modal.delete-profile').modal('show')
});

$('.ui.tiny.modal.delete-profile')
    .modal({
        closable: false,
        onApprove: () => {
            $.ajax({
                url: '/api/user/' + $userProfile.data('username') + '/settings/delete',
                success: function () {
                    window.location.href = '/logout'
                },
                error: function (e) {
                    console.log(e.status)
                }
            }).then(() => {})
        }
    });
