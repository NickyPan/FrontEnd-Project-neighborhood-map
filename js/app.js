/**
 * @author Nicky Pan
 * @required knockout.js, material.min.js
 */

'use strict';

var map;
var WIKI_LINK = "https://zh.wikipedia.org/wiki/";
var WIKI_API_URL = "https://zh.wikipedia.org/w/api.php?action=query&origin=*&prop=info&format=json&titles=";
var dialog = document.querySelector('dialog');
if (!dialog.showModal) {
  dialogPolyfill.registerDialog(dialog);
}

var locationsList = [
  { title: "外滩", place_id: "ChIJj6CthFhwsjURN2qBdkC2Z00", location: { lat: 31.239263, lng: 121.48965 } },
  { title: "东方明珠", place_id: "ChIJ29SwJftwsjURZYXg4jufPhY", location: { lat: 31.2396889, lng: 121.4975666 } },
  { title: "星巴克", place_id: "ChIJ4ezmZ_pwsjURbGXDrNLRcAk", location: { lat: 31.2371402, lng: 121.4967793 } },
  { title: "凯宾斯基酒店", place_id: "ChIJj8yn5-JwsjURco6uNBICJSM", location: { lat: 31.2425876, lng: 121.5019437 } },
  { title: "星展银行", place_id: "ChIJ1djfFeNwsjUR9HKnRnF1hno", location: { lat: 31.240033, lng: 121.5019437 } }
];

// function initializes GoogleMaps
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 31.2383241, lng: 121.495408 },
    zoom: 14,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: false
  });
}

function ViewModel() {
  var self = this;
  var markers = [];
  this.query = ko.observable();
  this.locationDetails = ko.observable(false);
  this.locations = ko.observableArray(locationsList);
  this.ratingDialogData = ko.observableArray();

  // make markers
  self.locations().forEach(function(location) {
    var bounds = new google.maps.LatLngBounds();

    var marker = new google.maps.Marker({
      map: map,
      position: location.location,
      title: location.title,
      id: location.place_id,
    });

    location.marker = marker;
    markers.push(marker);
    marker.addListener('click', function() {
      self.getPlacesDetails(this);
    });
    bounds.extend(marker.position);
  });

  //details via Google Places API
  this.getPlacesDetails = function(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    var service = new google.maps.places.PlacesService(map);
    service.getDetails({
      placeId: marker.id
    }, function(place, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        place.wikiLink = ko.observable();
        self.stopMarker(marker);
        self.getWikiPage(place);
        self.locationDetails(place);
        self.showSideBar();
      } else {
        errorHandle();
      }
    });
  }

  this.showMarker = function() {
    markers.forEach(function(marker) {
      marker.setVisible(true);
    });
  };

  //filter list via input
  this.filteredLocations = ko.computed(function() {
    var filter = this.query();
    if (!filter && markers.length == 0) {
      alert('oop，出错了，请重新刷新网页试试');
      return;
    } else if (!filter && markers.length > 0) {
      this.showMarker();
      return markers;
    } else {
      return ko.utils.arrayFilter(markers, function(item) {
        if (item.title.indexOf(filter) !== -1) {
          item.setVisible(true);
        } else {
          item.setVisible(false);
        }
        return item.title.indexOf(filter) !== -1;
      });
    }
  }, this);

  this.backToList = function() {
    this.locationDetails(false);
  };

  this.stopMarker = function(currentMarker) {
    setTimeout(function() {
      currentMarker.setAnimation(null);
    }, 1000);
  };

  //reviews dialog
  this.showDialog = function(data) {
    dialog.showModal();
    self.ratingDialogData(data);
  }

  this.closeDialog = function() {
    dialog.close();
    self.ratingDialogData([]);
  }

  //wikipedia page via wiki api
  this.getWikiPage = function(location) {
    $.ajax({
        url: WIKI_API_URL + location.name,
        dataType: 'json',
        type: 'GET'
      })
      .done(function(data) {
        var wikiLink = Object.values(data.query.pages)[0];
        if (wikiLink.pageid) {
          location.wikiLink(WIKI_LINK + wikiLink.title);
        }
      })
      .fail(function(data) {
        errorHandle();
      });
  }

  //click marker then show siderbar when window width smaller than 1024
  this.showSideBar = function() {
    var windowWidth = $(window).width();
    if (windowWidth > 1024) {
      return;
    }
    if ($(".drawer").hasClass("is-visible") && $(".mdl-layout__obfuscator").hasClass("is-visible")) {
      return;
    }
    $( ".drawer" ).addClass("is-visible");
    $( ".drawer" ).attr('aria-hidden', 'false')
    $( ".mdl-layout__obfuscator" ).addClass("is-visible");
  }
}

function initApp() {
  initMap();
  var viewModel = new ViewModel();
  ko.applyBindings(viewModel);
}

//Error message if Google Maps fails to load
function errorHandle(data) {
  if (!data) {
    alert('oop，出错了，请重试或者联系网络管理员！');
  } else {
    alert(data);
  }
}
