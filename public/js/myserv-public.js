(function($) {
    'use strict';

    // Initialize maps if the API is loaded
    function initMaps() {
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            return;
        }

        // Initialize provider location map in admin
        if ($('#myserv_location_map').length) {
            initProviderLocationMap();
        }
    }

    // Initialize map for provider location in admin
    function initProviderLocationMap() {
        var mapElement = document.getElementById('myserv_location_map');
        var latInput = $('#myserv_latitude');
        var lngInput = $('#myserv_longitude');
        var addressInput = $('#myserv_address');

        var lat = latInput.val() || -23.5505; // Default to São Paulo
        var lng = lngInput.val() || -46.6333;

        var map = new google.maps.Map(mapElement, {
            center: { lat: parseFloat(lat), lng: parseFloat(lng) },
            zoom: 13
        });

        var marker = new google.maps.Marker({
            position: { lat: parseFloat(lat), lng: parseFloat(lng) },
            map: map,
            draggable: true
        });

        // Update marker when map is clicked
        map.addListener('click', function(e) {
            marker.setPosition(e.latLng);
            updateLocationFields(e.latLng);
        });

        // Update fields when marker is dragged
        marker.addListener('dragend', function() {
            updateLocationFields(marker.getPosition());
        });

        // Geocode address when it changes
        var geocoder = new google.maps.Geocoder();
        addressInput.on('change', function() {
            geocoder.geocode({ address: $(this).val() }, function(results, status) {
                if (status === 'OK') {
                    var location = results[0].geometry.location;
                    map.setCenter(location);
                    marker.setPosition(location);
                    updateLocationFields(location);
                }
            });
        });

        function updateLocationFields(location) {
            latInput.val(location.lat());
            lngInput.val(location.lng());

            // Reverse geocode to get address
            geocoder.geocode({ location: location }, function(results, status) {
                if (status === 'OK') {
                    addressInput.val(results[0].formatted_address);
                }
            });
        }
    }

    /**
     * Public JavaScript
     */
    $(document).ready(function() {
        // Initialize search functionality
        if ($('#myserv-search-form').length) {
            initializeSearch();
        }

        // Initialize maps when API is loaded
        if (typeof google !== 'undefined') {
            initMaps();
        } else {
            // If Google Maps API is not loaded yet, wait for it
            window.initMyServMaps = initMaps;
        }

        // Initialize booking calendar if present
        if ($('#myserv-booking-calendar').length) {
            initializeCalendar();
        }

        // Handle booking form submission
        $('#myserv-booking-form').on('submit', handleBookingSubmission);
    });

    /**
     * Initialize the service search functionality
     */
    function initializeSearch() {
        var searchForm = $('#myserv-search-form');
        var searchResults = $('#myserv-search-results');
        var useLocationBtn = $('#myserv-use-location');
        var latitudeInput = $('#myserv-latitude');
        var longitudeInput = $('#myserv-longitude');
        var categorySelect = $('#myserv-category');
        var dateInput = $('#myserv-date');
        var timeInput = $('#myserv-time');

        // Show geolocation button if supported
        if ("geolocation" in navigator) {
            useLocationBtn.show().on('click', function(e) {
                e.preventDefault();
                
                useLocationBtn.prop('disabled', true).text(myservI18n.detecting_location);
                
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        latitudeInput.val(position.coords.latitude);
                        longitudeInput.val(position.coords.longitude);
                        
                        // Reverse geocode to get address
                        if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
                            var geocoder = new google.maps.Geocoder();
                            var latlng = {
                                lat: parseFloat(position.coords.latitude),
                                lng: parseFloat(position.coords.longitude)
                            };
                            
                            geocoder.geocode({ location: latlng }, function(results, status) {
                                if (status === 'OK') {
                                    $('#myserv-location').val(results[0].formatted_address);
                                }
                                useLocationBtn.prop('disabled', false).text(myservI18n.use_my_location);
                                searchForm.submit();
                            });
                        }
                    },
                    function(error) {
                        useLocationBtn.prop('disabled', false).text(myservI18n.use_my_location);
                        alert(myservI18n.location_error);
                    }
                );
            });
        }

        // Handle search form submission
        searchForm.on('submit', function(e) {
            e.preventDefault();
            
            var formData = {
                action: 'myserv_search_providers',
                nonce: myservAjax.nonce,
                latitude: latitudeInput.val(),
                longitude: longitudeInput.val(),
                category: categorySelect.val(),
                date: dateInput.val(),
                time: timeInput.val()
            };

            $.ajax({
                url: myservAjax.ajaxurl,
                type: 'POST',
                data: formData,
                beforeSend: function() {
                    searchResults.html('<div class="myserv-loading">' + myservI18n.searching + '</div>');
                },
                success: function(response) {
                    if (response.success) {
                        if (response.data.count > 0) {
                            searchResults.html(response.data.html);
                        } else {
                            searchResults.html('<div class="myserv-no-results">' + myservI18n.no_results + '</div>');
                        }
                    } else {
                        searchResults.html('<div class="myserv-error">' + response.data.message + '</div>');
                    }
                },
                error: function() {
                    searchResults.html('<div class="myserv-error">' + myservI18n.search_error + '</div>');
                }
            });
        });
    }

    /**
     * Initialize the FullCalendar instance
     */
    function initializeCalendar() {
        var calendarEl = document.getElementById('myserv-booking-calendar');
        var providerId = $(calendarEl).data('provider-id');

        var calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek',
            selectable: true,
            selectMirror: true,
            dayMaxEvents: true,
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            select: function(info) {
                handleTimeSlotSelection(info, providerId);
            },
            events: {
                url: myservAjax.ajaxurl,
                method: 'POST',
                extraParams: {
                    action: 'myserv_get_provider_schedule',
                    provider_id: providerId,
                    nonce: myservAjax.nonce
                }
            }
        });

        calendar.render();
    }

    /**
     * Handle time slot selection in the calendar
     */
    function handleTimeSlotSelection(info, providerId) {
        // Show booking form modal
        var modal = $('#myserv-booking-modal');
        modal.find('#booking-date').val(info.startStr);
        modal.find('#booking-provider-id').val(providerId);
        modal.modal('show');
    }

    /**
     * Handle booking form submission
     */
    function handleBookingSubmission(e) {
        e.preventDefault();
        var form = $(this);
        var submitButton = form.find('button[type="submit"]');
        
        submitButton.prop('disabled', true);
        
        $.ajax({
            url: myservAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'myserv_book_service',
                form_data: form.serialize(),
                nonce: myservAjax.nonce
            },
            success: function(response) {
                submitButton.prop('disabled', false);
                
                if (response.success) {
                    // Redirect to payment page or show success message
                    if (response.data.redirect_url) {
                        window.location.href = response.data.redirect_url;
                    } else {
                        alert(response.data.message);
                        form[0].reset();
                    }
                } else {
                    alert(response.data.message);
                }
            },
            error: function() {
                submitButton.prop('disabled', false);
                alert('An error occurred. Please try again.');
            }
        });
    }

})(jQuery);
