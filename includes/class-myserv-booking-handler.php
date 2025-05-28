<?php
/**
 * Handles the booking workflow
 *
 * @package    MyServ
 * @subpackage MyServ/includes
 */

class MyServ_Booking_Handler {

    /**
     * Initialize the class
     */
    public function __construct() {
        // Register meta fields for the booking post type
        add_action('init', array($this, 'register_booking_meta'));
        
        // Add custom columns to booking list
        add_filter('manage_myserv_booking_posts_columns', array($this, 'set_booking_columns'));
        add_action('manage_myserv_booking_posts_custom_column', array($this, 'render_booking_columns'), 10, 2);
        
        // Add meta boxes
        add_action('add_meta_boxes', array($this, 'add_booking_meta_boxes'));
        add_action('save_post_myserv_booking', array($this, 'save_booking_meta'));

        // AJAX handlers
        add_action('wp_ajax_myserv_create_booking', array($this, 'handle_booking_creation'));
        add_action('wp_ajax_myserv_update_booking_status', array($this, 'handle_booking_status_update'));
        add_action('wp_ajax_nopriv_myserv_create_booking', array($this, 'handle_booking_creation'));
    }

    /**
     * Register meta fields for bookings
     */
    public function register_booking_meta() {
        register_post_meta('myserv_booking', 'myserv_service_id', array(
            'type' => 'integer',
            'single' => true,
            'show_in_rest' => true,
        ));
        register_post_meta('myserv_booking', 'myserv_provider_id', array(
            'type' => 'integer',
            'single' => true,
            'show_in_rest' => true,
        ));
        register_post_meta('myserv_booking', 'myserv_client_id', array(
            'type' => 'integer',
            'single' => true,
            'show_in_rest' => true,
        ));
        register_post_meta('myserv_booking', 'myserv_booking_date', array(
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true,
        ));
        register_post_meta('myserv_booking', 'myserv_booking_time', array(
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true,
        ));
        register_post_meta('myserv_booking', 'myserv_booking_status', array(
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true,
            'default' => 'pending',
        ));
        register_post_meta('myserv_booking', 'myserv_payment_status', array(
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true,
            'default' => 'pending',
        ));
        register_post_meta('myserv_booking', 'myserv_payment_id', array(
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true,
        ));
        register_post_meta('myserv_booking', 'myserv_booking_notes', array(
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true,
        ));
    }

    /**
     * Set custom columns for booking list
     */
    public function set_booking_columns($columns) {
        $columns = array(
            'cb' => $columns['cb'],
            'title' => __('Booking ID', 'myserv'),
            'service' => __('Service', 'myserv'),
            'provider' => __('Provider', 'myserv'),
            'client' => __('Client', 'myserv'),
            'date_time' => __('Date & Time', 'myserv'),
            'booking_status' => __('Status', 'myserv'),
            'payment_status' => __('Payment', 'myserv'),
        );
        return $columns;
    }

    /**
     * Render custom column content
     */
    public function render_booking_columns($column, $post_id) {
        switch ($column) {
            case 'service':
                $service_id = get_post_meta($post_id, 'myserv_service_id', true);
                echo get_the_title($service_id);
                break;
            case 'provider':
                $provider_id = get_post_meta($post_id, 'myserv_provider_id', true);
                $provider = get_userdata($provider_id);
                echo $provider ? $provider->display_name : '-';
                break;
            case 'client':
                $client_id = get_post_meta($post_id, 'myserv_client_id', true);
                $client = get_userdata($client_id);
                echo $client ? $client->display_name : '-';
                break;
            case 'date_time':
                $date = get_post_meta($post_id, 'myserv_booking_date', true);
                $time = get_post_meta($post_id, 'myserv_booking_time', true);
                echo "$date $time";
                break;
            case 'booking_status':
                $status = get_post_meta($post_id, 'myserv_booking_status', true);
                echo ucfirst($status);
                break;
            case 'payment_status':
                $status = get_post_meta($post_id, 'myserv_payment_status', true);
                echo ucfirst($status);
                break;
        }
    }

    /**
     * Add meta boxes for booking details
     */
    public function add_booking_meta_boxes() {
        add_meta_box(
            'myserv_booking_details',
            __('Booking Details', 'myserv'),
            array($this, 'render_booking_details_meta_box'),
            'myserv_booking',
            'normal',
            'high'
        );
    }

    /**
     * Render booking details meta box
     */
    public function render_booking_details_meta_box($post) {
        // Add nonce for security
        wp_nonce_field('myserv_booking_details', 'myserv_booking_nonce');

        // Get meta values
        $service_id = get_post_meta($post->ID, 'myserv_service_id', true);
        $provider_id = get_post_meta($post->ID, 'myserv_provider_id', true);
        $client_id = get_post_meta($post->ID, 'myserv_client_id', true);
        $date = get_post_meta($post->ID, 'myserv_booking_date', true);
        $time = get_post_meta($post->ID, 'myserv_booking_time', true);
        $booking_status = get_post_meta($post->ID, 'myserv_booking_status', true);
        $payment_status = get_post_meta($post->ID, 'myserv_payment_status', true);
        $notes = get_post_meta($post->ID, 'myserv_booking_notes', true);

        // Include meta box template
        include MYSERV_PLUGIN_DIR . 'admin/partials/myserv-booking-metabox.php';
    }

    /**
     * Save booking meta data
     */
    public function save_booking_meta($post_id) {
        // Verify nonce
        if (!isset($_POST['myserv_booking_nonce']) || 
            !wp_verify_nonce($_POST['myserv_booking_nonce'], 'myserv_booking_details')) {
            return;
        }

        // Save meta fields
        $fields = array(
            'myserv_service_id',
            'myserv_provider_id',
            'myserv_client_id',
            'myserv_booking_date',
            'myserv_booking_time',
            'myserv_booking_status',
            'myserv_payment_status',
            'myserv_booking_notes'
        );

        foreach ($fields as $field) {
            if (isset($_POST[$field])) {
                update_post_meta($post_id, $field, sanitize_text_field($_POST[$field]));
            }
        }
    }

    /**
     * Handle booking creation from AJAX request
     */
    public function handle_booking_creation() {
        check_ajax_referer('myserv_booking_nonce', 'nonce');

        $service_id = intval($_POST['service_id']);
        $provider_id = intval($_POST['provider_id']);
        $date = sanitize_text_field($_POST['date']);
        $time = sanitize_text_field($_POST['time']);

        // Validate required fields
        if (!$service_id || !$provider_id || !$date || !$time) {
            wp_send_json_error('Missing required fields');
            return;
        }

        // Check provider availability
        if (!$this->check_provider_availability($provider_id, $date, $time)) {
            wp_send_json_error('Provider is not available at selected time');
            return;
        }

        // Create booking
        $booking_data = array(
            'post_title'  => 'Booking - ' . current_time('mysql'),
            'post_status' => 'publish',
            'post_type'   => 'myserv_booking'
        );

        $booking_id = wp_insert_post($booking_data);

        if (!$booking_id) {
            wp_send_json_error('Failed to create booking');
            return;
        }

        // Save booking meta
        update_post_meta($booking_id, 'myserv_service_id', $service_id);
        update_post_meta($booking_id, 'myserv_provider_id', $provider_id);
        update_post_meta($booking_id, 'myserv_client_id', get_current_user_id());
        update_post_meta($booking_id, 'myserv_booking_date', $date);
        update_post_meta($booking_id, 'myserv_booking_time', $time);
        update_post_meta($booking_id, 'myserv_booking_status', 'pending');
        update_post_meta($booking_id, 'myserv_payment_status', 'pending');

        // Trigger notifications
        do_action('myserv_booking_created', $booking_id);

        wp_send_json_success(array(
            'booking_id' => $booking_id,
            'message' => 'Booking created successfully'
        ));
    }

    /**
     * Handle booking status update
     */
    public function handle_booking_status_update() {
        check_ajax_referer('myserv_booking_nonce', 'nonce');

        $booking_id = intval($_POST['booking_id']);
        $status = sanitize_text_field($_POST['status']);

        if (!$booking_id || !$status) {
            wp_send_json_error('Invalid parameters');
            return;
        }

        $allowed_statuses = array('pending', 'confirmed', 'cancelled', 'completed');
        if (!in_array($status, $allowed_statuses)) {
            wp_send_json_error('Invalid status');
            return;
        }

        update_post_meta($booking_id, 'myserv_booking_status', $status);
        
        // Trigger status change action
        do_action('myserv_booking_status_changed', $booking_id, $status);

        wp_send_json_success(array(
            'message' => 'Booking status updated successfully'
        ));
    }

    /**
     * Check provider availability
     */
    private function check_provider_availability($provider_id, $date, $time) {
        // Query existing bookings for the provider at the specified time
        $args = array(
            'post_type' => 'myserv_booking',
            'meta_query' => array(
                array(
                    'key' => 'myserv_provider_id',
                    'value' => $provider_id
                ),
                array(
                    'key' => 'myserv_booking_date',
                    'value' => $date
                ),
                array(
                    'key' => 'myserv_booking_time',
                    'value' => $time
                ),
                array(
                    'key' => 'myserv_booking_status',
                    'value' => array('pending', 'confirmed'),
                    'compare' => 'IN'
                )
            )
        );

        $existing_bookings = get_posts($args);
        return empty($existing_bookings);
    }
}
