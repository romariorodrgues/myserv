<?php

/**
 * The admin-specific functionality of the plugin.
 */
class MyServ_Admin {

    /**
     * Initialize the class and set its properties.
     */
    public function __construct() {
        add_action('init', array($this, 'register_post_types'));
        add_action('init', array($this, 'register_taxonomies'));
    }

    /**
     * Register the stylesheets for the admin area.
     */
    public function enqueue_styles() {
        wp_enqueue_style('myserv-admin', plugin_dir_url(__FILE__) . 'css/myserv-admin.css', array(), MYSERV_VERSION, 'all');
    }

    /**
     * Register the JavaScript for the admin area.
     */
    public function enqueue_scripts() {
        wp_enqueue_script('myserv-admin', plugin_dir_url(__FILE__) . 'js/myserv-admin.js', array('jquery'), MYSERV_VERSION, false);
    }

    /**
     * Add menu items to the admin area.
     */
    public function add_plugin_admin_menu() {
        // Main menu item
        add_menu_page(
            __('MyServ Settings', 'myserv'),
            __('MyServ', 'myserv'),
            'manage_options',
            'myserv',
            array($this, 'display_plugin_setup_page'),
            'dashicons-calendar-alt',
            6
        );

        // Submenu items
        add_submenu_page(
            'myserv',
            __('Service Providers', 'myserv'),
            __('Service Providers', 'myserv'),
            'manage_options',
            'myserv-providers',
            array($this, 'display_providers_page')
        );

        add_submenu_page(
            'myserv',
            __('Bookings', 'myserv'),
            __('Bookings', 'myserv'),
            'manage_options',
            'myserv-bookings',
            array($this, 'display_bookings_page')
        );
    }

    /**
     * Add settings action link to the plugins page.
     */
    public function add_action_links($links) {
        $settings_link = array(
            '<a href="' . admin_url('admin.php?page=myserv') . '">' . __('Settings', 'myserv') . '</a>',
        );
        return array_merge($settings_link, $links);
    }

    /**
     * Register custom post types
     */
    public function register_post_types() {
        // Register Service Provider post type
        register_post_type('service_provider', array(
            'labels' => array(
                'name' => __('Service Providers', 'myserv'),
                'singular_name' => __('Service Provider', 'myserv'),
            ),
            'public' => true,
            'has_archive' => true,
            'supports' => array('title', 'editor', 'thumbnail', 'custom-fields'),
            'show_in_rest' => true,
        ));

        // Register Booking post type
        register_post_type('booking', array(
            'labels' => array(
                'name' => __('Bookings', 'myserv'),
                'singular_name' => __('Booking', 'myserv'),
            ),
            'public' => true,
            'has_archive' => false,
            'supports' => array('title', 'custom-fields'),
            'show_in_rest' => true,
        ));
    }

    /**
     * Register custom taxonomies
     */
    public function register_taxonomies() {
        // Register Service Category taxonomy
        register_taxonomy('service_category', array('service_provider'), array(
            'labels' => array(
                'name' => __('Service Categories', 'myserv'),
                'singular_name' => __('Service Category', 'myserv'),
            ),
            'hierarchical' => true,
            'show_ui' => true,
            'show_admin_column' => true,
            'query_var' => true,
            'rewrite' => array('slug' => 'service-category'),
            'show_in_rest' => true,
        ));
    }

    /**
     * Render the settings page for this plugin.
     */
    public function display_plugin_setup_page() {
        include_once('partials/myserv-admin-display.php');
    }

    /**
     * Render the providers management page.
     */
    public function display_providers_page() {
        include_once('partials/myserv-admin-providers.php');
    }

    /**
     * Render the bookings management page.
     */
    public function display_bookings_page() {
        include_once('partials/myserv-admin-bookings.php');
    }
}
