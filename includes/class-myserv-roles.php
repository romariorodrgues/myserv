<?php

/**
 * Handle user roles and capabilities for the plugin
 */
class MyServ_Roles {

    /**
     * Initialize the class and set its properties.
     */
    public function __construct() {
        add_action('init', array($this, 'register_roles'));
        add_action('add_user_role', array($this, 'add_role_capabilities'));
        add_action('user_register', array($this, 'set_default_client_role'));
        add_action('admin_init', array($this, 'maybe_add_caps'));
    }

    /**
     * Register custom roles
     */
    public function register_roles() {
        // Service Provider role
        add_role(
            'service_provider',
            __('Service Provider', 'myserv'),
            array(
                'read' => true,
                'edit_posts' => false,
                'delete_posts' => false,
                'publish_posts' => false,
                'upload_files' => true,
            )
        );

        // Client role
        add_role(
            'myserv_client',
            __('Client', 'myserv'),
            array(
                'read' => true,
                'edit_posts' => false,
                'delete_posts' => false,
                'publish_posts' => false,
            )
        );

        // Add custom capabilities to administrator
        $admin = get_role('administrator');
        if ($admin) {
            $this->add_admin_capabilities($admin);
        }
    }

    /**
     * Add capabilities to administrator role
     */
    private function add_admin_capabilities($admin_role) {
        // Provider management
        $admin_role->add_cap('edit_service_provider');
        $admin_role->add_cap('read_service_provider');
        $admin_role->add_cap('delete_service_provider');
        $admin_role->add_cap('edit_service_providers');
        $admin_role->add_cap('edit_others_service_providers');
        $admin_role->add_cap('publish_service_providers');
        $admin_role->add_cap('read_private_service_providers');
        $admin_role->add_cap('delete_service_providers');
        $admin_role->add_cap('delete_private_service_providers');
        $admin_role->add_cap('delete_published_service_providers');
        $admin_role->add_cap('delete_others_service_providers');
        $admin_role->add_cap('edit_private_service_providers');
        $admin_role->add_cap('edit_published_service_providers');
        $admin_role->add_cap('manage_service_providers');

        // Booking management
        $admin_role->add_cap('edit_booking');
        $admin_role->add_cap('read_booking');
        $admin_role->add_cap('delete_booking');
        $admin_role->add_cap('edit_bookings');
        $admin_role->add_cap('edit_others_bookings');
        $admin_role->add_cap('publish_bookings');
        $admin_role->add_cap('read_private_bookings');
        $admin_role->add_cap('delete_bookings');
        $admin_role->add_cap('delete_private_bookings');
        $admin_role->add_cap('delete_published_bookings');
        $admin_role->add_cap('delete_others_bookings');
        $admin_role->add_cap('edit_private_bookings');
        $admin_role->add_cap('edit_published_bookings');
        $admin_role->add_cap('manage_bookings');

        // Platform management
        $admin_role->add_cap('manage_myserv_settings');
        $admin_role->add_cap('manage_service_categories');
    }

    /**
     * Add capabilities to service provider role
     */
    private function add_provider_capabilities($provider_role) {
        // Provider profile management
        $provider_role->add_cap('edit_service_provider');
        $provider_role->add_cap('read_service_provider');
        $provider_role->add_cap('delete_service_provider');
        $provider_role->add_cap('edit_published_service_providers');
        $provider_role->add_cap('publish_service_providers');

        // Booking management (own bookings only)
        $provider_role->add_cap('edit_booking');
        $provider_role->add_cap('read_booking');
        $provider_role->add_cap('edit_bookings');
        $provider_role->add_cap('publish_bookings');
        $provider_role->add_cap('read_private_bookings');
        $provider_role->add_cap('edit_published_bookings');
    }

    /**
     * Add capabilities to client role
     */
    private function add_client_capabilities($client_role) {
        // Booking capabilities
        $client_role->add_cap('create_bookings');
        $client_role->add_cap('read_booking');
        $client_role->add_cap('read_private_bookings');
        $client_role->add_cap('edit_booking'); // Can edit their own bookings (e.g., cancel)
    }

    /**
     * Add capabilities when a role is added
     */
    public function add_role_capabilities($role) {
        $role_obj = get_role($role);
        if (!$role_obj) {
            return;
        }

        switch ($role) {
            case 'service_provider':
                $this->add_provider_capabilities($role_obj);
                break;
            case 'myserv_client':
                $this->add_client_capabilities($role_obj);
                break;
        }
    }

    /**
     * Set default role for new users as client
     */
    public function set_default_client_role($user_id) {
        // Check if this is a registration from our plugin's form
        if (isset($_POST['myserv_registration']) && $_POST['myserv_registration'] === 'client') {
            $user = new WP_User($user_id);
            $user->set_role('myserv_client');
        }
    }

    /**
     * Add capabilities to roles if they don't exist
     * This is useful when updating the plugin
     */
    public function maybe_add_caps() {
        // Check if we need to add capabilities
        if (get_option('myserv_caps_version') === MYSERV_VERSION) {
            return;
        }

        // Add capabilities to administrator
        $admin_role = get_role('administrator');
        if ($admin_role) {
            $this->add_admin_capabilities($admin_role);
        }

        // Add capabilities to service provider
        $provider_role = get_role('service_provider');
        if ($provider_role) {
            $this->add_provider_capabilities($provider_role);
        }

        // Add capabilities to client
        $client_role = get_role('myserv_client');
        if ($client_role) {
            $this->add_client_capabilities($client_role);
        }

        // Update capabilities version
        update_option('myserv_caps_version', MYSERV_VERSION);
    }

    /**
     * Remove plugin-specific roles and capabilities
     */
    public static function remove_roles_and_capabilities() {
        // Remove custom roles
        remove_role('service_provider');
        remove_role('myserv_client');

        // Remove capabilities from administrator
        $admin_role = get_role('administrator');
        if ($admin_role) {
            $caps = array(
                'edit_service_provider',
                'read_service_provider',
                'delete_service_provider',
                'edit_service_providers',
                'edit_others_service_providers',
                'publish_service_providers',
                'read_private_service_providers',
                'delete_service_providers',
                'delete_private_service_providers',
                'delete_published_service_providers',
                'delete_others_service_providers',
                'edit_private_service_providers',
                'edit_published_service_providers',
                'manage_service_providers',
                'edit_booking',
                'read_booking',
                'delete_booking',
                'edit_bookings',
                'edit_others_bookings',
                'publish_bookings',
                'read_private_bookings',
                'delete_bookings',
                'delete_private_bookings',
                'delete_published_bookings',
                'delete_others_bookings',
                'edit_private_bookings',
                'edit_published_bookings',
                'manage_bookings',
                'manage_myserv_settings',
                'manage_service_categories'
            );

            foreach ($caps as $cap) {
                $admin_role->remove_cap($cap);
            }
        }

        delete_option('myserv_caps_version');
    }
}
