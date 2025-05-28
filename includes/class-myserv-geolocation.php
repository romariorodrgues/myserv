<?php

/**
 * Handle geolocation search functionality
 */
class MyServ_Geolocation {

    /**
     * Google Maps API Key
     */
    private $api_key;

    /**
     * Initialize the class
     */
    public function __construct() {
        $this->api_key = get_option('myserv_google_maps_api_key');
        
        // Add provider location metabox
        add_action('add_meta_boxes', array($this, 'add_location_metabox'));
        add_action('save_post', array($this, 'save_location_metabox'));
        
        // AJAX handlers
        add_action('wp_ajax_myserv_geocode_address', array($this, 'ajax_geocode_address'));
        add_action('wp_ajax_nopriv_myserv_geocode_address', array($this, 'ajax_geocode_address'));
        add_action('wp_ajax_myserv_search_providers', array($this, 'ajax_search_providers'));
        add_action('wp_ajax_nopriv_myserv_search_providers', array($this, 'ajax_search_providers'));
    }

    /**
     * Add location metabox to service provider post type
     */
    public function add_location_metabox() {
        add_meta_box(
            'myserv_location_metabox',
            __('Provider Location', 'myserv'),
            array($this, 'render_location_metabox'),
            'service_provider',
            'normal',
            'high'
        );
    }

    /**
     * Render location metabox
     */
    public function render_location_metabox($post) {
        // Add nonce for security
        wp_nonce_field('myserv_location_metabox', 'myserv_location_nonce');

        $latitude = get_post_meta($post->ID, '_myserv_latitude', true);
        $longitude = get_post_meta($post->ID, '_myserv_longitude', true);
        $address = get_post_meta($post->ID, '_myserv_address', true);
        ?>
        <div class="myserv-location-fields">
            <p>
                <label for="myserv_address"><?php _e('Address', 'myserv'); ?></label><br>
                <input type="text" id="myserv_address" name="myserv_address" value="<?php echo esc_attr($address); ?>" class="large-text">
            </p>
            <p>
                <label for="myserv_latitude"><?php _e('Latitude', 'myserv'); ?></label><br>
                <input type="text" id="myserv_latitude" name="myserv_latitude" value="<?php echo esc_attr($latitude); ?>" readonly>
            </p>
            <p>
                <label for="myserv_longitude"><?php _e('Longitude', 'myserv'); ?></label><br>
                <input type="text" id="myserv_longitude" name="myserv_longitude" value="<?php echo esc_attr($longitude); ?>" readonly>
            </p>
            <div id="myserv_location_map" style="height: 400px; margin-top: 10px;"></div>
        </div>
        <?php
    }

    /**
     * Save location metabox data
     */
    public function save_location_metabox($post_id) {
        // Verify nonce
        if (!isset($_POST['myserv_location_nonce']) || !wp_verify_nonce($_POST['myserv_location_nonce'], 'myserv_location_metabox')) {
            return;
        }

        // Save location data
        if (isset($_POST['myserv_address'])) {
            update_post_meta($post_id, '_myserv_address', sanitize_text_field($_POST['myserv_address']));
        }
        if (isset($_POST['myserv_latitude'])) {
            update_post_meta($post_id, '_myserv_latitude', sanitize_text_field($_POST['myserv_latitude']));
        }
        if (isset($_POST['myserv_longitude'])) {
            update_post_meta($post_id, '_myserv_longitude', sanitize_text_field($_POST['myserv_longitude']));
        }
    }

    /**
     * Geocode an address using Google Maps API
     */
    public function geocode_address($address) {
        if (!$this->api_key) {
            return array(
                'success' => false,
                'message' => __('Google Maps API key not configured', 'myserv')
            );
        }

        $url = add_query_arg(array(
            'address' => urlencode($address),
            'key' => $this->api_key
        ), 'https://maps.googleapis.com/maps/api/geocode/json');

        $response = wp_remote_get($url);

        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => $response->get_error_message()
            );
        }

        $data = json_decode(wp_remote_retrieve_body($response), true);

        if ($data['status'] !== 'OK') {
            return array(
                'success' => false,
                'message' => __('Geocoding failed', 'myserv')
            );
        }

        $location = $data['results'][0]['geometry']['location'];

        return array(
            'success' => true,
            'latitude' => $location['lat'],
            'longitude' => $location['lng'],
            'formatted_address' => $data['results'][0]['formatted_address']
        );
    }

    /**
     * AJAX handler for geocoding addresses
     */
    public function ajax_geocode_address() {
        check_ajax_referer('myserv-public-nonce', 'nonce');

        $address = isset($_POST['address']) ? sanitize_text_field($_POST['address']) : '';
        
        if (!$address) {
            wp_send_json_error(array('message' => __('Address is required', 'myserv')));
        }

        $result = $this->geocode_address($address);
        
        if ($result['success']) {
            wp_send_json_success($result);
        } else {
            wp_send_json_error($result);
        }
    }

    /**
     * Search for providers near a location
     */
    public function search_providers($args = array()) {
        $defaults = array(
            'latitude' => null,
            'longitude' => null,
            'radius' => 50, // Search radius in kilometers
            'category' => '',
            'date' => '',
            'time' => '',
            'posts_per_page' => 10,
            'paged' => 1
        );

        $args = wp_parse_args($args, $defaults);

        // Base query args
        $query_args = array(
            'post_type' => 'service_provider',
            'post_status' => 'publish',
            'posts_per_page' => $args['posts_per_page'],
            'paged' => $args['paged']
        );

        // Add category filter
        if (!empty($args['category'])) {
            $query_args['tax_query'] = array(
                array(
                    'taxonomy' => 'service_category',
                    'field' => 'term_id',
                    'terms' => $args['category']
                )
            );
        }

        // Get all providers
        $providers = get_posts($query_args);

        // If no location provided, return all providers
        if (is_null($args['latitude']) || is_null($args['longitude'])) {
            return $providers;
        }

        // Filter providers by distance
        $filtered_providers = array();
        foreach ($providers as $provider) {
            $provider_lat = get_post_meta($provider->ID, '_myserv_latitude', true);
            $provider_lng = get_post_meta($provider->ID, '_myserv_longitude', true);

            if (!$provider_lat || !$provider_lng) {
                continue;
            }

            $distance = $this->calculate_distance(
                $args['latitude'],
                $args['longitude'],
                $provider_lat,
                $provider_lng
            );

            if ($distance <= $args['radius']) {
                $provider->distance = $distance;
                $filtered_providers[] = $provider;
            }
        }

        // Sort by distance
        usort($filtered_providers, function($a, $b) {
            return $a->distance <=> $b->distance;
        });

        return $filtered_providers;
    }

    /**
     * AJAX handler for provider search
     */
    public function ajax_search_providers() {
        check_ajax_referer('myserv-public-nonce', 'nonce');

        $latitude = isset($_POST['latitude']) ? floatval($_POST['latitude']) : null;
        $longitude = isset($_POST['longitude']) ? floatval($_POST['longitude']) : null;
        $category = isset($_POST['category']) ? intval($_POST['category']) : '';
        $date = isset($_POST['date']) ? sanitize_text_field($_POST['date']) : '';
        $time = isset($_POST['time']) ? sanitize_text_field($_POST['time']) : '';

        $providers = $this->search_providers(array(
            'latitude' => $latitude,
            'longitude' => $longitude,
            'category' => $category,
            'date' => $date,
            'time' => $time
        ));

        $html = '';
        foreach ($providers as $provider) {
            ob_start();
            include(MYSERV_PLUGIN_DIR . 'public/partials/myserv-provider-card.php');
            $html .= ob_get_clean();
        }

        wp_send_json_success(array(
            'html' => $html,
            'count' => count($providers)
        ));
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    private function calculate_distance($lat1, $lon1, $lat2, $lon2) {
        $earth_radius = 6371; // Radius of the Earth in kilometers

        $lat1 = deg2rad($lat1);
        $lon1 = deg2rad($lon1);
        $lat2 = deg2rad($lat2);
        $lon2 = deg2rad($lon2);

        $dlat = $lat2 - $lat1;
        $dlon = $lon2 - $lon1;

        $a = sin($dlat/2) * sin($dlat/2) + cos($lat1) * cos($lat2) * sin($dlon/2) * sin($dlon/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        $distance = $earth_radius * $c;

        return $distance;
    }
}
