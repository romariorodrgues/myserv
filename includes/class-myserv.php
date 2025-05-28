<?php

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 */
class MyServ {

    /**
     * The loader that's responsible for maintaining and registering all hooks that power
     * the plugin.
     *
     * @var      MyServ_Loader    $loader    Maintains and registers all hooks for the plugin.
     */
    protected $loader;

    /**
     * Payment gateway instance
     */
    protected $payment_gateway;

    /**
     * Notification handler instance
     */
    protected $notification_handler;

    /**
     * Geolocation handler instance
     */
    protected $geolocation_handler;

    /**
     * Roles handler instance
     */
    protected $roles_handler;

    /**
     * User manager instance
     */
    protected $user_manager;

    /**
     * Post types handler instance
     */
    protected $post_types;

    /**
     * Booking handler instance
     */
    protected $booking_handler;

    /**
     * Define the core functionality of the plugin.
     */
    public function __construct() {
        $this->load_dependencies();
        $this->set_locale();
        $this->init_roles();
        $this->init_user_manager();
        $this->init_payment_gateway();
        $this->init_notification_handler();
        $this->init_geolocation_handler();
        $this->init_post_types();
        $this->init_booking_handler();
        $this->define_admin_hooks();
        $this->define_public_hooks();
        $this->register_activation_hooks();
    }

    /**
     * Load the required dependencies for this plugin.
     */
    private function load_dependencies() {
        // The class responsible for orchestrating the actions and filters of the core plugin.
        require_once MYSERV_PLUGIN_DIR . 'includes/class-myserv-loader.php';

        // The class responsible for defining internationalization functionality of the plugin.
        require_once MYSERV_PLUGIN_DIR . 'includes/class-myserv-i18n.php';

        // User roles and capabilities
        require_once MYSERV_PLUGIN_DIR . 'includes/class-myserv-roles.php';
        require_once MYSERV_PLUGIN_DIR . 'includes/class-myserv-user-manager.php';

        // Payment gateway classes
        require_once MYSERV_PLUGIN_DIR . 'includes/payments/class-myserv-mercadopago.php';

        // Notification handler classes
        require_once MYSERV_PLUGIN_DIR . 'includes/notifications/class-myserv-chatpro.php';
        require_once MYSERV_PLUGIN_DIR . 'includes/notifications/class-myserv-notification-scheduler.php';

        // Geolocation handler class
        require_once MYSERV_PLUGIN_DIR . 'includes/class-myserv-geolocation.php';

        // Post types and taxonomies
        require_once MYSERV_PLUGIN_DIR . 'includes/class-myserv-post-types.php';

        // Booking handler class
        require_once MYSERV_PLUGIN_DIR . 'includes/class-myserv-booking-handler.php';

        // The class responsible for defining all actions that occur in the admin area.
        require_once MYSERV_PLUGIN_DIR . 'admin/class-myserv-admin.php';

        // The class responsible for defining all actions that occur in the public-facing side of the site.
        require_once MYSERV_PLUGIN_DIR . 'public/class-myserv-public.php';

        $this->loader = new MyServ_Loader();
    }

    /**
     * Define the locale for this plugin for internationalization.
     */
    private function set_locale() {
        $plugin_i18n = new MyServ_i18n();
        $this->loader->add_action('plugins_loaded', $plugin_i18n, 'load_plugin_textdomain');
    }

    /**
     * Initialize roles and capabilities
     */
    private function init_roles() {
        $this->roles_handler = new MyServ_Roles();
    }

    /**
     * Initialize user manager
     */
    private function init_user_manager() {
        $this->user_manager = new MyServ_User_Manager();
    }

    /**
     * Initialize payment gateway
     */
    private function init_payment_gateway() {
        $this->payment_gateway = new MyServ_MercadoPago();
    }

    /**
     * Initialize notification handler
     */
    private function init_notification_handler() {
        $this->notification_handler = new MyServ_Notification_Scheduler();
    }

    /**
     * Initialize geolocation handler
     */
    private function init_geolocation_handler() {
        $this->geolocation_handler = new MyServ_Geolocation();
    }

    /**
     * Initialize the post types handler
     */
    private function init_post_types() {
        $this->post_types = new MyServ_Post_Types();
    }

    /**
     * Initialize the booking handler
     */
    private function init_booking_handler() {
        $this->booking_handler = new MyServ_Booking_Handler();
    }

    /**
     * Register all of the hooks related to the admin area functionality of the plugin.
     */
    private function define_admin_hooks() {
        $plugin_admin = new MyServ_Admin();

        // Add menu items
        $this->loader->add_action('admin_menu', $plugin_admin, 'add_plugin_admin_menu');
        
        // Add Settings link to the plugin
        $this->loader->add_filter('plugin_action_links_' . plugin_basename(MYSERV_PLUGIN_DIR . 'myserv-plugin.php'), 
            $plugin_admin, 'add_action_links');

        // Load Google Maps API in admin
        $this->loader->add_action('admin_enqueue_scripts', $this, 'enqueue_google_maps');
    }

    /**
     * Register all of the hooks related to the public-facing functionality of the plugin.
     */
    private function define_public_hooks() {
        $plugin_public = new MyServ_Public();

        $this->loader->add_action('wp_enqueue_scripts', $plugin_public, 'enqueue_styles');
        $this->loader->add_action('wp_enqueue_scripts', $plugin_public, 'enqueue_scripts');

        // Load Google Maps API in frontend
        $this->loader->add_action('wp_enqueue_scripts', $this, 'enqueue_google_maps');
    }

    /**
     * Enqueue Google Maps API
     */
    public function enqueue_google_maps() {
        $api_key = get_option('myserv_google_maps_api_key');
        if (!$api_key) {
            return;
        }

        wp_enqueue_script(
            'google-maps',
            'https://maps.googleapis.com/maps/api/js?key=' . $api_key . '&callback=initMyServMaps',
            array(),
            null,
            true
        );

        wp_localize_script('myserv-public', 'myservI18n', array(
            'detecting_location' => __('Detecting location...', 'myserv'),
            'use_my_location' => __('Use my location', 'myserv'),
            'location_error' => __('Could not detect your location. Please enter it manually.', 'myserv'),
            'searching' => __('Searching...', 'myserv'),
            'no_results' => __('No service providers found in your area.', 'myserv'),
            'search_error' => __('An error occurred while searching. Please try again.', 'myserv')
        ));
    }

    /**
     * Register activation and deactivation hooks
     */
    private function register_activation_hooks() {
        register_activation_hook(MYSERV_PLUGIN_DIR . 'myserv-plugin.php', array($this, 'activate'));
        register_deactivation_hook(MYSERV_PLUGIN_DIR . 'myserv-plugin.php', array($this, 'deactivate'));
    }

    /**
     * Plugin activation
     */
    public function activate() {
        // Initialize roles and capabilities
        $this->roles_handler = new MyServ_Roles();
        $this->roles_handler->register_roles();
        
        // Set capabilities version
        update_option('myserv_caps_version', MYSERV_VERSION);

        // Additional activation tasks...
    }

    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clean up roles and capabilities
        MyServ_Roles::remove_roles_and_capabilities();

        // Additional cleanup tasks...
    }

    /**
     * Run the loader to execute all of the hooks with WordPress.
     */
    public function run() {
        $this->loader->run();
    }
}
