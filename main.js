function initMap(sbiNumber, firstName, lastName) {

    //Load external scripts & stylesheets
    function loadScript(url) {
        const script = document.createElement('script');
        script.src = url;
        document.head.appendChild(script);
    }

    function loadStylesheet(url) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
    }

    //Mapbox & relevant styles/plugins
    loadStylesheet('https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css');
    loadScript('https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js');
    loadScript('https://unpkg.com/@turf/turf@6/turf.min.js');
    loadStylesheet('https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.3/mapbox-gl-draw.css');
    loadScript('https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.3/mapbox-gl-draw.js');

    //Utility - Converts map date string to something readable
    function convertDate(dateString) {
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        return `${day}/${month}/${year}`;
    }

    //Pushes a feature update back to the map
    function updateFeatures(map, updatedFeature) {
        console.log("Update function: ", updatedFeature)
        const source = map.getSource('farm')._data;

        const features = source.features.map(f => f.properties.ID === updatedFeature.properties.ID ? {
            ...f,
            properties: updatedFeature.properties
        } : f);

        map.getSource('farm').setData({
            ...source,
            features: features
        });

        updateTable(map)
    }

    //Updates the table with the latest map data
    function updateTable(map) {
        const source = map.getSource('farm')._data;
        const features = source.features.sort((a, b) => {
            if (a.properties.SHEET_ID < b.properties.SHEET_ID) {
                return -1;
            } else if (a.properties.SHEET_ID > b.properties.SHEET_ID) {
                return 1;
            } else {
                return a.properties.PARCEL_ID - b.properties.PARCEL_ID;
            }
        });
        const tableBody = document.querySelector('#tableBody');

        features.forEach(obj => {
            const row = document.createElement('div');
            row.classList.add('table-row');
            const form = document.createElement('form');
            form.classList.add('table-form');
            form.innerHTML = `
            <input type="hidden" name="ID" class="hidden-input" value="${obj.properties.ID}">
            <input type="text" name="CROP" class="table-cell-wrapper crop" value="${obj.properties.CROP ?? ""}">
            <input type="text" name="FIELD_NAME" class="table-cell-wrapper field_name" value="${obj.properties.FIELD_NAME ?? ""}">
            <input type="text" name="SHEET_ID" class="table-cell-wrapper sheet-id" value="${obj.properties.SHEET_ID}">
            <input type="text" name="PARCEL_ID" class="table-cell-wrapper parcel-id" value="${obj.properties.PARCEL_ID}">
            <input type="text" name="DESCRIPTION" class="table-cell-wrapper description" value="${obj.properties.DESCRIPTION}">
            <input type="text" name="AREA_HA" class="table-cell-wrapper area-ha" value="${obj.properties.AREA_HA}">
            <input type="text" name="LAND_COVER_CLASS_CODE" class="table-cell-wrapper land-cover-class-code" value="${obj.properties.LAND_COVER_CLASS_CODE}">
            <input type="text" name="SHAPE_AREA" class="table-cell-wrapper shape-area" value="${obj.properties.SHAPE_AREA}">
            <input type="text" name="SHAPE_PERIMETER" class="table-cell-wrapper shape-perimeter" value="${obj.properties.SHAPE_PERIMETER}">
            <input type="text" name="CREATED_ON" class="table-cell-wrapper created-on" value="${convertDate(obj.properties.CREATED_ON)}">
            <button type="submit" class="table-submit">Submit</button>
        `;

            form.addEventListener('submit', function (event) {
                event.preventDefault();
                handleSubmit(map, new FormData(form));
            });

            row.appendChild(form);
            tableBody.appendChild(row);
        });
    }

    //Matches a form submission to a map feature and pushes a feature update

    function handleSubmit(map, formData) {
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        const originalFeature = map.queryRenderedFeatures({
            layers: ['farms'],
            filter: ['==', ['get', 'ID'], data.ID]
        })[0];
        console.log(originalFeature)

        const updatedFeature = {
            ...originalFeature,
            properties: {
                ...originalFeature.properties,
                ...data
            }
        };
        updateFeatures(map, updatedFeature)
    }

    //Opens a modal to edit a map feature
    function openModal(feature, source, map) {
        const modal = document.getElementById('modal');
        const modalContent = document.getElementById('modal-content');
        const modalClose = document.getElementById('modal-close');
        
        const form = document.createElement('form');
        form.id = 'modal-form';
        form.classList.add('modal-form');
        
        const elements = [
            { tag: 'input', type: 'hidden', className: 'hidden-input', name: 'ID', value: feature.properties.ID },
            { tag: 'label', className: 'f-txt-field-label sm field-name', text: 'Field name:' },
            { tag: 'input', type: 'text', className: 'f-input-field sm w-input field-name', name: 'FIELD_NAME', value: feature.properties.FIELD_NAME ?? "" },
            { tag: 'label', className: 'f-txt-field-label sm crop', text: 'Crop:' },
            { tag: 'input', type: 'text', className: 'f-input-field sm w-input crop', name: 'CROP', value: feature.properties.CROP ?? "" },
            { tag: 'label', className: 'f-txt-field-label sm sheet-id', text: 'Sheet ID:' },
            { tag: 'input', type: 'text', className: 'f-input-field sm w-input sheet-id', name: 'SHEET_ID', value: feature.properties.SHEET_ID },
            { tag: 'label', className: 'f-txt-field-label sm parcel-id', text: 'Parcel ID:' },
            { tag: 'input', type: 'text', className: 'f-input-field sm w-input parcel-id', name: 'PARCEL_ID', value: feature.properties.PARCEL_ID },
            { tag: 'label', className: 'f-txt-field-label sm description', text: 'Current land use:' },
            { tag: 'input', type: 'text', className: 'f-input-field sm w-input description', name: 'DESCRIPTION', value: feature.properties.DESCRIPTION },
            { tag: 'label', className: 'f-txt-field-label sm area-ha', text: 'Hectares:' },
            { tag: 'input', type: 'text', className: 'f-input-field sm w-input area-ha', name: 'AREA_HA', value: feature.properties.AREA_HA },
            { tag: 'label', className: 'f-txt-field-label sm land-cover-class-code', text: 'Land cover class code:' },
            { tag: 'input', type: 'text', className: 'f-input-field sm w-input land-cover-class-code', name: 'LAND_COVER_CLASS_CODE', value: feature.properties.LAND_COVER_CLASS_CODE },
            { tag: 'label', className: 'f-txt-field-label sm shape-area', text: 'Shape area:' },
            { tag: 'input', type: 'text', className: 'f-input-field sm w-input shape-area', name: 'SHAPE_AREA', value: feature.properties.SHAPE_AREA },
            { tag: 'label', className: 'f-txt-field-label sm shape-perimeter', text: 'Shape perimeter:' },
            { tag: 'input', type: 'text', className: 'f-input-field sm w-input shape-perimeter', name: 'SHAPE_PERIMETER', value: feature.properties.SHAPE_PERIMETER },
            { tag: 'label', className: 'f-txt-field-label sm created-on', text: 'Created on:' },
            { tag: 'input', type: 'text', className: 'f-input-field sm w-input created-on', name: 'CREATED_ON', value: convertDate(feature.properties.CREATED_ON) },
            { tag: 'button', type: 'submit', className: 'modal-submit', text: 'Update' }
        ];
        
        elements.forEach((el, index) => {
            const element = document.createElement(el.tag);
            if (el.text) element.textContent = el.text;
            if (el.type) element.type = el.type;
            if (el.className) element.className = el.className;
            if (el.name) element.name = el.name;
            if (el.value) element.value = el.value;
        
            if (el.tag === 'label' && elements[index + 1] && elements[index + 1].tag === 'input') {
                const div = document.createElement('div');
                div.classList.add('f-steps-input');
                div.classList.add('sm');
                div.appendChild(element);
                div.appendChild(document.createElement(elements[index + 1].tag));
                if (elements[index + 1].type) div.lastChild.type = elements[index + 1].type;
                if (elements[index + 1].className) div.lastChild.className = elements[index + 1].className;
                if (elements[index + 1].name) div.lastChild.name = elements[index + 1].name;
                if (elements[index + 1].value) div.lastChild.value = elements[index + 1].value;
                form.appendChild(div);
            } else if (el.tag !== 'input') {
                if (el.tagName.toLowerCase() === 'button') {
                    element.setAttribute('href', '#');
                }
                form.appendChild(element);
            }
        });
        modalContent.innerHTML = '';
        modalContent.appendChild(form);

        modal.style.display = 'block';
        modal.style.opacity = 0;
        setTimeout(() => {
            modal.style.opacity = 1;
        }, 10);

        modalClose.onclick = () => {
            modal.style.opacity = 0;
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        };

        //Handles form submissions
        const modalForm = document.getElementById('modal-form');
        modalForm.addEventListener('submit', function (event) {
            event.preventDefault();
            handleSubmit(map, new FormData(modalForm));
            modal.style.opacity = 0;
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
    }

    //Main script thread starts
    fetch(`https://eu-west-1.aws.data.mongodb-api.com/app/application-0-npilpbx/endpoint/landcover?SBI=${sbiNumber}&first=${firstName}&last=${lastName}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const geojson = data;
            console.log(geojson);

            mapboxgl.accessToken = 'pk.eyJ1IjoicmVnZW5vLWZhcm0tdGVzdCIsImEiOiJjbHhhNmtyMnYxcDV6MmpzYzUyb3N4MWVzIn0.YYa6sVjYPHGAxpCxqPLdBg';

            const bounds = turf.bbox(geojson);
            const center = turf.centerOfMass(geojson);

            const map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/light-v11',
                projection: 'globe',
                zoom: 13,
                center: center.geometry.coordinates
            });

            map.fitBounds(bounds, {
                padding: 20 // Adjust padding as needed
            });

            map.loadImage('https://uploads-ssl.webflow.com/660bcbc48b7009afef8be06d/6669cc4fa365d2efac2b2463_check-circle.png', (error, image) => {
                if (error) throw error;
                map.addImage('checkbox-image', image);
            });

            map.on('load', () => {

                //Load data and update table
                map.addSource('farm', {
                    type: 'geojson',
                    data: geojson
                });
                updateTable(map)

                //Attach layers to map
                map.addLayer({
                    'id': 'farms',
                    'type': 'fill',
                    'source': 'farm',
                    'layout': {},
                    'paint': {
                        'fill-color': [
                            'case',
                            ['has', 'CROP'], '#31A56C',
                            ['match',
                                ['get', 'DESCRIPTION'],
                                'Arable Land', '#F7E16B',
                                'Permanent Grassland', '#97E374',
                                'Woodland', '#508936',
                                'Scrub - Ungrazeable', '#E9E9E9',
                                'Pond', "#5CC7E7",
                                'Farmyards', '#DC772F',
                                'Farm Building', '#DC772F',
                                'Metalled track', '#B7B7B7',
                                'Track - Natural Surface', '#CD9D55',
                                'Residential dwelling, House', "#DC772F",
                                '#4c9370'
                            ]
                        ],
                        'fill-opacity': [
                            'case',
                            ['has', 'CROP'], 1.0,
                            ['match',
                                ['get', 'DESCRIPTION'],
                                'Farm Building', 1.0,
                                'Residential dwelling, House', 1.0,
                                0.3
                            ]
                        ]
                    }
                });
                map.addLayer({
                    'id': 'farm-outlines',
                    'type': 'line',
                    'source': 'farm',
                    'layout': {},
                    'paint': {
                        'line-color': [
                            'case',
                            ['has', 'CROP'], '#BADDCB',
                            ['match',
                                ['get', 'DESCRIPTION'],
                                'Arable Land', '#F7E16B',
                                'Permanent Grassland', '#97E374',
                                'Woodland', '#508936',
                                'Scrub - Ungrazeable', '#E9E9E9',
                                'Pond', "#5CC7E7",
                                'Farmyards', '#DC772F',
                                'Farm Building', '#DC772F',
                                'Metalled track', '#B7B7B7',
                                'Track - Natural Surface', '#CD9D55',
                                'Residential dwelling, House', "#DC772F",
                                '#4c9370'
                            ]
                        ],
                        'line-width': 3
                    }
                });

                map.addLayer({
                    'id': 'crop-checkbox',
                    'type': 'symbol',
                    'source': 'farm',
                    'layout': {
                        'icon-image': 'checkbox-image',
                        'icon-size': 0.05,
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': true,
                        'visibility': 'visible'
                    },
                    'filter': ['has', 'CROP']
                });

                //Attach basic popup to display land use on map
                map.on('click', 'farms', (e) => {
                    new mapboxgl.Popup()
                        .setLngLat(e.lngLat)
                        .setHTML(e.features[0].properties.DESCRIPTION)
                        .addTo(map);
                });

                map.on('mouseenter', 'farms', () => {
                    map.getCanvas().style.cursor = 'pointer';
                });

                map.on('mouseleave', 'farms', () => {
                    map.getCanvas().style.cursor = '';
                });

                //Attach drawing functions to map
                const draw = new MapboxDraw({
                    displayControlsDefault: false,
                    controls: {
                        point: true,
                        line_string: true,
                        polygon: true,
                        trash: true
                    }
                });
                map.addControl(draw);

                map.on('draw.create', updateArea);
                map.on('draw.delete', updateArea);
                map.on('draw.update', updateArea);

                function updateArea(e) {
                    const data = draw.getAll();
                    const answer = document.getElementById('calculated-area');
                    if (data.features.length > 0) {
                        const area = turf.area(data);
                        const rounded_area = Math.round(area * 100) / 100;
                    } else {
                        if (e.type !== 'draw.delete')
                            alert('Click the map to draw a polygon.');
                    }
                }

                //Attach modal opening function to map
                map.on('click', (e) => {
                    let features = map.queryRenderedFeatures(e.point, {
                        layers: ['farms']
                    });

                    if (features.length === 0) {
                        const clickPoint = {
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [e.lngLat.lng, e.lngLat.lat]
                            }
                        };

                        const drawFeatures = draw.getAll().features;
                        drawFeatures.forEach(feature => {
                            if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                                if (turf.booleanPointInPolygon(clickPoint, feature)) {
                                    features.push(feature);
                                }
                            }
                        });
                    }

                    if (features.length > 0) {
                        openModal(features[0], geojson, map);
                    }
                });

                setInterval(function() {
                    map.resize();
                }, 1000);
            });
        })
        .catch(error => {
            //Generic catch for main thread
            console.error('There was a problem with the fetch operation:', error);
        });
};
