$(document).ready(function () {
    ymaps.ready(init);
});

function init() {
    let LAYER_NAME = 'user#layer',
        MAP_TYPE_NAME = 'user#customMap',
        // Директория с тайлами.
        TILES_PATH = '../images/tilesEvraz',
        /* Для того чтобы вычислить координаты левого нижнего и правого верхнего углов прямоугольной координатной
        * области, нам необходимо знать максимальный зум, ширину и высоту изображения в пикселях на максимальном зуме.
        */
        MAX_ZOOM = 5,
        PIC_WIDTH = 8081,
        PIC_HEIGHT = 4721,
        data = [],
        regularExp = /\bimg_\w+\b/;

    /**
     * Конструктор, создающий собственный слой.
     */
    let Layer = function () {
        let layer = new ymaps.Layer(TILES_PATH + '/%z/%x/%y.png', {
            // Если есть необходимость показать собственное изображение в местах неподгрузившихся тайлов,
            // раскомментируйте эту строчку и укажите ссылку на изображение.
            notFoundTile: '../images/tilesEvraz/5/0/3.png',
        });
        // Указываем доступный диапазон масштабов для данного слоя.
        layer.getZoomRange = function () {
            return ymaps.vow.resolve([0, 5]);
        };
        // Добавляем свои копирайты.
        layer.getCopyrights = function () {
            return ymaps.vow.resolve('©');
        };
        return layer;
    };
    // Добавляем в хранилище слоев свой конструктор.
    ymaps.layer.storage.add(LAYER_NAME, Layer);

    /**
     * Создадим новый тип карты.
     * MAP_TYPE_NAME - имя нового типа.
     * LAYER_NAME - ключ в хранилище слоев или функция конструктор.
     */
    let mapType = new ymaps.MapType(MAP_TYPE_NAME, [LAYER_NAME]);
    // Сохраняем тип в хранилище типов.
    ymaps.mapType.storage.add(MAP_TYPE_NAME, mapType);

    // Вычисляем размер всех тайлов на максимальном зуме.
    let worldSize = Math.pow(2, MAX_ZOOM) * 256,
        /**
         * Создаем карту, указав свой новый тип карты.
         */
        map = new ymaps.Map('map', {
            center: [0, 0],
            zoom: 2,
            controls: ['zoomControl'],
            type: MAP_TYPE_NAME,
        }, {
            maxZoom: MAX_ZOOM,
            minZoom: 0,
            projection: new ymaps.projection.Cartesian([[PIC_HEIGHT / 2 - worldSize, -PIC_WIDTH / 2], [PIC_HEIGHT / 2, worldSize - PIC_WIDTH / 2]], [false, false]),
            restrictMapArea: true,
            // restrictMapArea: [[-PIC_HEIGHT / 2, -PIC_WIDTH / 2], [PIC_HEIGHT / 2, PIC_WIDTH / 2]]
        }),

    elements = document.getElementsByClassName('img-zad'), target, targetElId, targetElClass, dragger, draggerEventsGroup;

    for (let i = 0; i < elements.length; i++){
        elements[i].addEventListener('mousedown', getElem, false);
    }

    function getElem(e) {
        /*(async() => {
        })();*/

        let sizeClass = e.target.parentElement.className.split(' ').length;
        targetElId = e.target.parentElement.id;
        targetElClass = e.target.parentElement.className.split(' ')[sizeClass - 1];
        target = targetElId + '_' + targetElClass;

        dragger = new ymaps.util.Dragger({
            autoStartElement: document.getElementById(targetElId),
        });

        draggerEventsGroup = dragger.events.group();

        draggerEventsGroup
            .add('start', onDrawStart)
            .add('move', onDrawMoving)
            .add('stop', onDrawStop);
    }

    function onDrawStart() {
        // let pos = event.get('position');
        // positionElement(pos[0], pos[1]);
        // console.log('start');
    }

    function onDrawMoving() {
        // let pos = event.get('position');
        // positionElement(pos[0], pos[1]);
        // console.log('move');
    }

    function onDrawStop(event) {
        let idEl = window.localStorage.getItem('chosenElem'),
            imgColor = $('#' + idEl).attr('class').match(regularExp)[0];

        data.push({"iconName": idEl, "color": imgColor});

        // Получаем географические координаты по точке окончания работы драггера.
        let placemarkPosition = map.options.get('projection').fromGlobalPixels(
            map.converter.pageToGlobal(event.get('position')),
            map.getZoom(),
        );
        let iconImageHref = getTargetImg(target);
        map.geoObjects.add(
            new ymaps.Placemark(placemarkPosition, {}, {
                // Опции.
                // Необходимо указать данный тип макета.
                iconLayout: 'default#image',
                // Своё изображение иконки метки.
                iconImageHref: iconImageHref,
                // Размеры метки.
                iconImageSize: [50, 50],
                // Смещение левого верхнего угла иконки относительно
                // её "ножки" (точки привязки).
                iconImageOffset: [-25, -25],
                hideIconOnBalloonOpen: false,
                // hintLayout: hintLayout,
            }),
        );
    }

    $('#letsRes').submit(function (e) {
        if (window.localStorage.getItem('user') === null) {
            showErrorMessage();
            return false;
        }

        if (data.length === 0)
            return false;

        if (window.localStorage.getItem('user') !== null) {
            $.ajax({
                url: '../php/setDataDB.php',
                method: 'POST',
                data: {user_id: window.localStorage.getItem('user'), data: data},
                success: function (response) {
                    console.log(response);
                    alert('Данные успешно добавлены!');
                    window.localStorage.removeItem('user');
                    window.localStorage.removeItem('chosenElem');
                    map.geoObjects.removeAll();
                    data = [];
                    $('.img-zad').css({
                        'color':'black'
                    });
                    $('#helloMessage').css({
                        'display':'flex'
                    });
                    $('.poster').toggle();
                },
            })
        }
    })

    function getTargetImg(id) {
        switch (id) {
            case 'administracia' + '_' + targetElClass:
                return '../images/icons/icons/administrativ.zdania()/administracia' + '_' + targetElClass + '.png';
            case 'syd' + '_' + targetElClass:
                return '../images/icons/icons/administrativ.zdania()/syd' + '_' + targetElClass + '.png';
            case 'zags' + '_' + targetElClass:
                return '../images/icons/icons/administrativ.zdania()/zags' + '_' + targetElClass + '.png';
            case 'botanicheskiSad' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/botanicheskiSad' + '_' + targetElClass + '.png';
            case 'businessCenter' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/businessCenter' + '_' + targetElClass + '.png';
            case 'busStop' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/busStop' + '_' + targetElClass + '.png';
            case 'doroznieZnaki' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/doroznieZnaki' + '_' + targetElClass + '.png';
            case 'fuelStation' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/fuelStation' + '_' + targetElClass + '.png';
            case 'garage' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/garage' + '_' + targetElClass + '.png';
            case 'houses' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/houses' + '_' + targetElClass + '.png';
            case 'kanalization' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/kanalization' + '_' + targetElClass + '.png';
            case 'kladbiche' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/kladbiche' + '_' + targetElClass + '.png';
            case 'metro' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/metro' + '_' + targetElClass + '.png';
            case 'military' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/military' + '_' + targetElClass + '.png';
            case 'nici' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/nici' + '_' + targetElClass + '.png';
            case 'obchezitie' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/obchezitie' + '_' + targetElClass + '.png';
            case 'ochistSooruzenia' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/ochistSooruzenia' + '_' + targetElClass + '.png';
            case 'parking' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/parking' + '_' + targetElClass + '.png';
            case 'plochad' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/plochad' + '_' + targetElClass + '.png';
            case 'roads' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/roads' + '_' + targetElClass + '.png';
            case 'rubbishBin' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/rubbishBin' + '_' + targetElClass + '.png';
            case 'ruins' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/ruins' + '_' + targetElClass + '.png';
            case 'sauna' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/sauna' + '_' + targetElClass + '.png';
            case 'sportSooruzenia' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/sportSooruzenia' + '_' + targetElClass + '.png';
            case 'stadium' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/stadium' + '_' + targetElClass + '.png';
            case 'store' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/store' + '_' + targetElClass + '.png';
            case 'stroika' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/stroika' + '_' + targetElClass + '.png';
            case 'toilet' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/toilet' + '_' + targetElClass + '.png';
            case 'trafficLight' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/trafficLight' + '_' + targetElClass + '.png';
            case 'turma' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/turma' + '_' + targetElClass + '.png';
            case 'televishka' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/televishka' + '_' + targetElClass + '.png';
            case 'vodohraniliche' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/vodohraniliche' + '_' + targetElClass + '.png';
            case 'zelenyeNasazdenia' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/zelenyeNasazdenia' + '_' + targetElClass + '.png';
            case 'apteka' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/apteka' + '_' + targetElClass + '.png';
            case 'bank' + '_' + targetElClass:
                return '../images/icons/icons/gorodsk.infr/bank' + '_' + targetElClass + '.png';
            case 'autostation' + '_' + targetElClass:
                return '../images/icons/icons/kommunik()/autostation' + '_' + targetElClass + '.png';
            case 'airport' + '_' + targetElClass:
                return '../images/icons/icons/kommunik()/airport' + '_' + targetElClass + '.png';
            case 'port' + '_' + targetElClass:
                return '../images/icons/icons/kommunik()/port' + '_' + targetElClass + '.png';
            case 'vokzal' + '_' + targetElClass:
                return '../images/icons/icons/kommunik()/vokzal' + '_' + targetElClass + '.png';
        }
    }

    function showErrorMessage() {
        let emptyUser = $('#emptyUser');
        emptyUser.css({
            'display': 'flex'
        });
        setTimeout(function (e) {
            emptyUser.css({
                'display': 'none'
            });
        }, 5000)
    }
}