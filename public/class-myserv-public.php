<?php

/**
 * The public-facing functionality of the plugin.
 */
class MyServ_Public {

    /**
     * Initialize the class and set its properties.
     */
    public function __construct() {
        add_action('init', array($this, 'register_shortcodes'));
        add_action('wp_ajax_myserv_book_service', array($this, 'handle_booking_request'));
        add_action('wp_ajax_nopriv_myserv_book_service', array($this, 'handle_booking_request'));
    }

    /**
     * Register the stylesheets for the public-facing side of the site.
     */
    public function enqueue_styles() {
        wp_enqueue_style('myserv-public', plugin_dir_url(__FILE__) . 'css/myserv-public.css', array(), MYSERV_VERSION, 'all');
        wp_enqueue_style('fullcalendar', plugin_dir_url(__FILE__) . 'lib/fullcalendar/main.min.css', array(), '5.11.3');
    }

    /**
     * Register the JavaScript for the public-facing side of the site.
     */
    public function enqueue_scripts() {
        wp_enqueue_script('fullcalendar', plugin_dir_url(__FILE__) . 'lib/fullcalendar/main.min.js', array('jquery'), '5.11.3', true);
        wp_enqueue_script('myserv-public', plugin_dir_url(__FILE__) . 'js/myserv-public.js', array('jquery', 'fullcalendar'), MYSERV_VERSION, true);
        
        wp_localize_script('myserv-public', 'myservAjax', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('myserv-public-nonce')
        ));
    }

    /**
     * Register shortcodes
     */
    public function register_shortcodes() {
        add_shortcode('service_search', array($this, 'render_service_search'));
        add_shortcode('service_provider_profile', array($this, 'render_provider_profile'));
        add_shortcode('booking_calendar', array($this, 'render_booking_calendar'));
    }

    /**
     * Render the service search interface
     */
    public function render_service_search($atts) {
        ob_start();
        include_once('partials/myserv-search-display.php');
        return ob_get_clean();
    }

    /**
     * Render the service provider profile
     */
    public function render_provider_profile($atts) {
        ob_start();
        include_once('partials/myserv-provider-profile.php');
        return ob_get_clean();
    }

    /**
     * Render the booking calendar
     */
    public function render_booking_calendar($atts) {
        ob_start();
        include_once('partials/myserv-calendar-display.php');
        return ob_get_clean();
    }

    /**
     * Handle booking request via AJAX
     */
    public function handle_booking_request() {
        check_ajax_referer('myserv-public-nonce', 'nonce');

        // Get and sanitize input
        $provider_id = isset($_POST['provider_id']) ? intval($_POST['provider_id']) : 0;
        $service_id = isset($_POST['service_id']) ? intval($_POST['service_id']) : 0;
        $date = isset($_POST['date']) ? sanitize_text_field($_POST['date']) : '';
        $time = isset($_POST['time']) ? sanitize_text_field($_POST['time']) : '';

        if (!$provider_id || !$service_id || !$date || !$time) {
            wp_send_json_error(array('message' => __('Missing required fields', 'myserv')));
        }

        // TODO: Implement booking logic here
        // 1. Check provider availability
        // 2. Create booking
        // 3. Process payment
        // 4. Send notifications

        wp_send_json_success(array('message' => __('Booking request received', 'myserv')));
    }
}
