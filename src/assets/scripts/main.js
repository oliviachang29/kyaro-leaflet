if ($("#map"))  {
    // Variables
    const KYARO_COORDINATES = [-3.3829580836974515, 36.68298617546179]
    const GSHEETS_URL =
        'https://opensheet.elk.sh/1vUGSs1FqUSo0t5R7APubXQrAFUZUmn4De1mDafpi_4k/public'
    const GSHEETS_REGEX = /https:\/\/drive\.google\.com\/file\/d\/(.*?)\/.*?\?usp=.*/
    const MAX_NUM_IMAGES = 4
    
    const markers = []
    const latLngs = []
    
    let isOpen = false
    let selectedMarkerId = -1
    let slideIndex = 1;
    
    // Functions
    
    // map functions
    function toggleMapOverlay() {
        $('#map-overlay').animate({ width: 'toggle' }, 350)
        isOpen = !isOpen
        $("#map-darken-overlay").toggle();
        if(!isOpen) {
            unselectAllMarkers();
        }
    }
    
    function recenterMap() {
        map.fitBounds(latLngs)
    }
    
    function unselectAllMarkers() {
        markers.forEach((marker) => {
            marker.setIcon(unselectedIcon)
        })
    }
    
    function preloadImage(imageUrl) {
        console.log(`preloading ${imageUrl}`)
        let img = new Image()
        img.src = imageUrl
    }
    
    function handleImageUrl(imageUrl) {
        if (imageUrl == '') {
            return ''
        }
        const urlMatch = imageUrl.match(GSHEETS_REGEX)
        return urlMatch ? `https://drive.google.com/uc?id=${urlMatch[1]}` : imageUrl
    }
    
    window.fadeIn = function (obj) {
        console.log('fade in')
        $(obj).fadeIn().css("display", "block");
    }
    
    // Next/previous controls
    window.plusSlides = function (n) {
        showSlides((slideIndex += n))
    }
    
    function showSlides(n) {
        let slides = $('.slideshow-slide')
        slides.length <= 1
            ? $('.plusSlides-button').hide()
            : $('.plusSlides-button').show()
        if (n > slides.length) {
            slideIndex = 1
        }
        if (n < 1) {
            slideIndex = slides.length
        }
        for (let i = 0; i < slides.length; i++) {
            $(slides[i]).hide()
        }
        $(slides[slideIndex - 1]).show()
    }
    
    // Set up map
    let map = L.map('map').setView(KYARO_COORDINATES, 5)
    map.zoomControl.setPosition('topright')
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map)
    
    const unselectedIcon = L.icon({
        iconUrl: '/assets/images/test/unselected.svg',
        // iconUrl: 'https://raw.githubusercontent.com/oliviachang29/kyaro-leaflet/main/src/assets/images/unselected.svg',
        iconSize: [36, 46 * 1.05], // size of the icon
        iconAnchor: [10, 36] // changed marker icon position
    })
    
    const selectedIcon = L.icon({
        iconUrl: '/assets/images/test/selected.svg',
        // iconUrl: 'https://raw.githubusercontent.com/oliviachang29/kyaro-leaflet/main/src/assets/images/selected.svg',
        iconSize: [80, 80], // size of the icon
        iconAnchor: [33.5, 51.5] // changed marker icon position
    })
    
    // onclicks
    $('#map-overlay-close-button').click(() => toggleMapOverlay())
    $('#map-recenter-button').click(() => recenterMap())
    map.on('click', () => {
        isOpen ? toggleMapOverlay() : ''
    })
    $('#plusSlides-button-prev').click(() => plusSlides(-1))
    $('#plusSlides-button-next').click(() => plusSlides(1))
    
    fetch(GSHEETS_URL)
        .then((response) => response.json())
        .then((data) => {
            console.log(data)
            data.forEach((user, i) => {
                console.log(i)
    
                for (let i = 1; i <= MAX_NUM_IMAGES; i++) {
                    if (user[`image_${i}`]) {
                        user[`image_${i}`] = handleImageUrl(user[`image_${i}`])
                        // preloadImage(user[`image_${i}`])
                    }
                }
    
                let currentMarker = L.marker([user.latitude, user.longitude], {
                    icon: unselectedIcon
                }).addTo(map)
    
                markers.push(currentMarker)
                latLngs.push([user.latitude, user.longitude])
    
                currentMarker.on('click', () => {
                    console.log(`marker ${i} clicked`)
    
                    // Change map overlay content
                    $('#map-content-name').text(user.name)
                    $('#map-content-description').html(user.description)
                    
                    // Insert images into slideshow
                    $('.slideshow-slides-container').empty() // remove old images
                    for (let i = 1; i <= MAX_NUM_IMAGES; i++) {
                        if (user[`image_${i}`]) {
                            $('.slideshow-slides-container').append(`
                                <div class="slideshow-slide slideshow-fade">
                                    <img
                                        src="${user[`image_${i}`]}" onload="fadeIn(this)"/>
                                </div>`)
                        }
                    }
                    slideIndex = 1
                    showSlides(slideIndex)
    
                    // Determine whether to toggle overlay
                    if (!isOpen || selectedMarkerId == i) {
                        toggleMapOverlay()
                    }
    
                    unselectAllMarkers();
                    // Set current marker to selected icon
                    currentMarker.setIcon(selectedIcon)
    
                    // Center on selected marker
                    map.panTo([
                        user.latitude,
                        user.longitude
                    ])

                    var targetPoint = map.project(targetLatLng, targetZoom).subtract([400 / 2, 0]),
                        targetLatLng = map.unproject(targetPoint, targetZoom);

                    map.panTo(targetLatLng, 5);
    
                    // Update selected marker ID
                    selectedMarkerId = i
                })
            })
    
            recenterMap()
        })
}
