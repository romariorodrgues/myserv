<?php
/**
 * Custom Post Types and Taxonomies for MyServ
 *
 * @package    MyServ
 * @subpackage MyServ/includes
 */

class MyServ_Post_Types {

    /**
     * Initialize the class and register post types and taxonomies
     */
    public function __construct() {
        add_action('init', array($this, 'register_service_post_type'));
        add_action('init', array($this, 'register_booking_post_type'));
        add_action('init', array($this, 'register_service_taxonomies'));
    }

    /**
     * Register the 'service' custom post type
     */
    public function register_service_post_type() {
        $labels = array(
            'name'               => _x('Services', 'post type general name', 'myserv'),
            'singular_name'      => _x('Service', 'post type singular name', 'myserv'),
            'menu_name'          => _x('Services', 'admin menu', 'myserv'),
            'name_admin_bar'     => _x('Service', 'add new on admin bar', 'myserv'),
            'add_new'            => _x('Add New', 'service', 'myserv'),
            'add_new_item'       => __('Add New Service', 'myserv'),
            'new_item'           => __('New Service', 'myserv'),
            'edit_item'          => __('Edit Service', 'myserv'),
            'view_item'          => __('View Service', 'myserv'),
            'all_items'          => __('All Services', 'myserv'),
            'search_items'       => __('Search Services', 'myserv'),
            'not_found'          => __('No services found.', 'myserv'),
            'not_found_in_trash' => __('No services found in Trash.', 'myserv')
        );

        $args = array(
            'labels'             => $labels,
            'public'             => true,
            'publicly_queryable' => true,
            'show_ui'            => true,
            'show_in_menu'       => true,
            'query_var'          => true,
            'rewrite'            => array('slug' => 'services'),
            'capability_type'    => 'post',
            'has_archive'        => true,
            'hierarchical'       => false,
            'menu_position'      => 5,
            'menu_icon'          => 'dashicons-clipboard',
            'supports'           => array('title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'),
            'show_in_rest'       => true,
        );

        register_post_type('myserv_service', $args);
    }

    /**
     * Register the 'booking' custom post type
     */
    public function register_booking_post_type() {
        $labels = array(
            'name'               => _x('Bookings', 'post type general name', 'myserv'),
            'singular_name'      => _x('Booking', 'post type singular name', 'myserv'),
            'menu_name'          => _x('Bookings', 'admin menu', 'myserv'),
            'name_admin_bar'     => _x('Booking', 'add new on admin bar', 'myserv'),
            'add_new'            => _x('Add New', 'booking', 'myserv'),
            'add_new_item'       => __('Add New Booking', 'myserv'),
            'new_item'           => __('New Booking', 'myserv'),
            'edit_item'          => __('Edit Booking', 'myserv'),
            'view_item'          => __('View Booking', 'myserv'),
            'all_items'          => __('All Bookings', 'myserv'),
            'search_items'       => __('Search Bookings', 'myserv'),
            'not_found'          => __('No bookings found.', 'myserv'),
            'not_found_in_trash' => __('No bookings found in Trash.', 'myserv')
        );

        $args = array(
            'labels'             => $labels,
            'public'             => false,
            'publicly_queryable' => false,
            'show_ui'            => true,
            'show_in_menu'       => true,
            'query_var'          => true,
            'rewrite'            => array('slug' => 'bookings'),
            'capability_type'    => 'post',
            'has_archive'        => false,
            'hierarchical'       => false,
            'menu_position'      => 5,
            'menu_icon'          => 'dashicons-calendar-alt',
            'supports'           => array('title', 'custom-fields'),
            'show_in_rest'       => true,
        );

        register_post_type('myserv_booking', $args);
    }

    /**
     * Register service taxonomies
     */
    public function register_service_taxonomies() {
        // Register Service Categories
        $category_labels = array(
            'name'              => _x('Service Categories', 'taxonomy general name', 'myserv'),
            'singular_name'     => _x('Service Category', 'taxonomy singular name', 'myserv'),
            'search_items'      => __('Search Service Categories', 'myserv'),
            'all_items'         => __('All Service Categories', 'myserv'),
            'parent_item'       => __('Parent Service Category', 'myserv'),
            'parent_item_colon' => __('Parent Service Category:', 'myserv'),
            'edit_item'         => __('Edit Service Category', 'myserv'),
            'update_item'       => __('Update Service Category', 'myserv'),
            'add_new_item'      => __('Add New Service Category', 'myserv'),
            'new_item_name'     => __('New Service Category Name', 'myserv'),
            'menu_name'         => __('Categories', 'myserv'),
        );

        register_taxonomy('myserv_service_category', array('myserv_service'), array(
            'hierarchical'      => true,
            'labels'            => $category_labels,
            'show_ui'           => true,
            'show_admin_column' => true,
            'query_var'         => true,
            'rewrite'           => array('slug' => 'service-category'),
            'show_in_rest'      => true,
        ));

        // Register Service Tags
        $tag_labels = array(
            'name'              => _x('Service Tags', 'taxonomy general name', 'myserv'),
            'singular_name'     => _x('Service Tag', 'taxonomy singular name', 'myserv'),
            'search_items'      => __('Search Service Tags', 'myserv'),
            'all_items'         => __('All Service Tags', 'myserv'),
            'edit_item'         => __('Edit Service Tag', 'myserv'),
            'update_item'       => __('Update Service Tag', 'myserv'),
            'add_new_item'      => __('Add New Service Tag', 'myserv'),
            'new_item_name'     => __('New Service Tag Name', 'myserv'),
            'menu_name'         => __('Tags', 'myserv'),
        );

        register_taxonomy('myserv_service_tag', array('myserv_service'), array(
            'hierarchical'      => false,
            'labels'            => $tag_labels,
            'show_ui'           => true,
            'show_admin_column' => true,
            'query_var'         => true,
            'rewrite'           => array('slug' => 'service-tag'),
            'show_in_rest'      => true,
        ));

        // Register Service Locations
        $location_labels = array(
            'name'              => _x('Service Locations', 'taxonomy general name', 'myserv'),
            'singular_name'     => _x('Service Location', 'taxonomy singular name', 'myserv'),
            'search_items'      => __('Search Service Locations', 'myserv'),
            'all_items'         => __('All Service Locations', 'myserv'),
            'parent_item'       => __('Parent Service Location', 'myserv'),
            'parent_item_colon' => __('Parent Service Location:', 'myserv'),
            'edit_item'         => __('Edit Service Location', 'myserv'),
            'update_item'       => __('Update Service Location', 'myserv'),
            'add_new_item'      => __('Add New Service Location', 'myserv'),
            'new_item_name'     => __('New Service Location Name', 'myserv'),
            'menu_name'         => __('Locations', 'myserv'),
        );

        register_taxonomy('myserv_service_location', array('myserv_service'), array(
            'hierarchical'      => true,
            'labels'            => $location_labels,
            'show_ui'           => true,
            'show_admin_column' => true,
            'query_var'         => true,
            'rewrite'           => array('slug' => 'service-location'),
            'show_in_rest'      => true,
        ));
    }
}
