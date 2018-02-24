// Locations are hardcoded here, but they can be obtained via a third party API
// such as Foursquare
var locations =
    [
        {
            title: 'Deschutes Brewery Portland Public House',
            quadrant: 'NW',
            keywords: 'Deschutes Brewery',
            location: {lat: 45.524527, lng: -122.682030}
        },
        {
            title: 'Rogue Distillery and Public House',
            quadrant: 'NW',
            keywords: 'Rogue Ales',
            location: {lat: 45.525872, lng: -122.685060}
        },
        {
            title: 'Widmer Brothers Brewing',
            quadrant: 'NE',
            keywords: 'Widmer Brothers Brewery',
            location: {lat: 45.541126, lng: -122.676498}
        },
        {
            title: 'Double Mountain Taproom',
            quadrant: 'SE',
            keywords: 'Double Mountain Brewery',
            location: {lat: 45.479029, lng: -122.617760}
        },
        {
            title: 'Hair of the Dog Brewing Company',
            quadrant: 'SE',
            keywords: 'Hair of the Dog Brewing Company',
            location: {lat: 45.515902, lng: -122.665671}
        }
    ];


var myViewModel = function() {
    var self = this;

    self.markers = ko.observableArray([]);
    //Store the filter
    // This was learned/inspired by
    //https:/stackoverflow.com/question/20857594/knockout-filtering-on-observable-array
    //filter array using ko.utils.arrayFilter learned from above url and
    // http://www.knockmeout.net/2011/04/utility-functions-in-knockoutjs.html
    self.currentFilter = ko.observable(); self.filteredMarkers =
        ko.computed(function() {
            if (!self.currentFilter() || self.currentFilter() == 'All') {
                return self.markers();
            } else {
                return ko.utils.arrayFilter(self.markers(), function(marker) {
                    return marker.quadrant == self.currentFilter();
                });
            }
        });


    this.availableQuadrants = ko.observableArray([
        'All', 'SW', 'SE', 'NE', 'NW'
        ]);

    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 45.51, lng: -122.66},
        zoom: 13,
        mapControl: false
    });

    var largeInfowindow = new google.maps.InfoWindow();
    // These two following functions were taken from udacity Fullstack
    // Nanodegree/The Frontend: JavaScript AJAX/Lesson7
    // Style the markers a bit. This will be our listing marker icon.
    var defaultIcon = makeMarkerIcon('0091ff');
    // Create a "highlighted location" marker color for when the user
    // mouses over the marker.
    var highlightedIcon = makeMarkerIcon('FFA000');
    var clickedIcon = makeMarkerIcon('C6FF00');

    self.attachListenersToMarker = function(marker) {
        // Create an onclick event to open the large infowindow at each marker.
        marker.addListener('click', function() {
            fillInfoWindow(this, largeInfowindow);
            this.setIcon(clickedIcon);
            toggleAnimation(this);
        });
        // Two event listeners - one for mouseover, one for mouseout,
        // to change the colors back and forth.
        marker.addListener('mouseover', function() {
            this.setIcon(highlightedIcon);
        });
        marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
        });
    }
    // This section was taken from udacity Fullstack Nanodegree/The Frontend:
    // JavaScript & AJAX/Lesson7/ud864/Project_Code_7_Drawing.html.
    // The following group uses the location array to create an array of
    // markers on initialize.
    for (var i = 0; i < locations.length; i++) {
        // Get the position from the location array.
        var position = locations[i].location;
        var title = locations[i].keywords;
        var quadrant = locations[i].quadrant;
        // Create a marker per location, and put into markers array.
        var marker = new google.maps.Marker({
            position: position,
            title: title,
            quadrant: quadrant,
            animation: google.maps.Animation.DROP,
            icon: defaultIcon,
            id: i
        });
        // Push the marker to our array of markers.
        this.markers.push(marker);
        self.attachListenersToMarker(marker);
        marker.setMap(map);
    }
    //When a location in the list is clicked an infowindow is created and
    //the marker gets an animation toggled on and off.
    this.listClick = function(clickedItem) {
        fillInfoWindow(clickedItem, largeInfowindow);
        toggleAnimation(this);
    };
    //Filter the map markers, then run a function to filter the list
    this.filterClick = function(quadrant) {
        filterLocations(quadrant, self.markers);
        self.setFilter(quadrant);
    };
    //Filter the list
    self.setFilter = function(quadrant) {
        quadrant = filterForm.quadrantlist.value;
        self.currentFilter(quadrant);
    };
};

ko.applyBindings(new myViewModel());


// This function was taken from udacity Fullstack Nanodegree/The Frontend:
// JavaScript $ AJAX/Lesson7/ud864/Project_Code_7_Drawing.html.
// This function takes in a color, and then creates a new marker
// icon of that color.
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+
        markerColor +'|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}

// This function was taken from udacity Fullstack Nanodegree/The Frontend:
// JavaScript $ AJAX/Lesson7/ud864/Project_Code_7_Drawing.html
// This function populates the infowindow when the marker is clicked. Only
// one infowindow is allowed which will open at the marker that is clicked,
// and populate based on that markers position.
function fillInfoWindow(marker, infowindow) {
    var markerTitle,
        markerInfo,
        markerLink;
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        // Clear the infowindow content to give the streetview time to load.
        infowindow.setContent('');
        infowindow.marker = marker;
        // Make sure the marker property is cleared when infowindow is closed.
        infowindow.addListener('closeclick', function() {
        infowindow.marker = null;
        marker.setAnimation(null);
        });
        //console.log(marker.title);
        var wikiUrl =
            'https://en.wikipedia.org/w/api.php?action=opensearch&search=' +
            marker.title + '&format=json&callback=wikiCallback';
        var wikiRequestTimeout = setTimeout(function(){
            infowindow.setContent('failed to get wikipedia resources');
        }, 8000);

        $.ajax({
            url: wikiUrl,
            dataType: "jsonp",
            jsonp: "callback",
            success: function(response){
                //The data recieved from wikipedia differs from the rest,
                //so it had to be handled.
                if (marker.title == 'Rogue Ales') {
                    var markerTitle = response[1][0];
                    var markerInfo = response[2][0];
                    var markerLink = response[3][0];
                } else {
                    markerTitle = response[1];
                    markerInfo = response[2];
                    markerLink = response[3];
                }
                infowindow.setContent(
                    '<div class="infowindow"><div class="marker_name"><span>' +
                    markerTitle +
                    '<span></br></div><div class="marker_info"><span>' +
                    markerInfo +
                    '<span></br></div><div class="marker_link"><span><a href="' +
                    markerLink + '">Wikipedia</a><span></br></div></div>');

                // Open the infowindow on the correct marker.
                infowindow.open(map, marker);
                clearTimeout(wikiRequestTimeout);
            }
        }).fail(function() {
                alert("Request Failure");
           });
    } else if (infowindow.marker == marker) {
        infowindow.close();
    }
}
//Toggle animation on and off
function toggleAnimation(marker) {
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
    } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
    }
}

//Filter the markers on the map
function filterLocations(quadrant, markers) {
    console.log(filterForm.quadrantlist.value);
    quadrant = filterForm.quadrantlist.value;
    for (i = 0; i < locations.length; i++) {
        marker = markers()[i];
        list_item = $("ul li:eq(i)");
        //console.log(marker);
        //console.log(list_item);
        //console.log(marker.quadrant);
        if (marker.quadrant == quadrant || quadrant == 'All') {
            marker.setVisible(true);
        } else {
            marker.setVisible(false);
        }
    }
}
