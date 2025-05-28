<?php

/**
 * Handle user registration and profile management
 */
class MyServ_User_Manager {

    /**
     * Initialize the class
     */
    public function __construct() {
        // Registration actions
        add_action('wp_ajax_nopriv_myserv_register_client', array($this, 'register_client'));
        add_action('wp_ajax_nopriv_myserv_register_provider', array($this, 'register_provider'));
        
        // Profile actions
        add_action('wp_ajax_myserv_update_profile', array($this, 'update_profile'));
        add_action('wp_ajax_myserv_upload_profile_photo', array($this, 'upload_profile_photo'));
        
        // Provider approval actions
        add_action('wp_ajax_myserv_approve_provider', array($this, 'approve_provider'));
        add_action('wp_ajax_myserv_reject_provider', array($this, 'reject_provider'));
        
        // Profile fields
        add_action('show_user_profile', array($this, 'add_custom_profile_fields'));
        add_action('edit_user_profile', array($this, 'add_custom_profile_fields'));
        add_action('personal_options_update', array($this, 'save_custom_profile_fields'));
        add_action('edit_user_profile_update', array($this, 'save_custom_profile_fields'));
    }

    /**
     * Register a new client
     */
    public function register_client() {
        check_ajax_referer('myserv-public-nonce', 'nonce');

        $first_name = isset($_POST['first_name']) ? sanitize_text_field($_POST['first_name']) : '';
        $last_name = isset($_POST['last_name']) ? sanitize_text_field($_POST['last_name']) : '';
        $email = isset($_POST['email']) ? sanitize_email($_POST['email']) : '';
        $password = isset($_POST['password']) ? $_POST['password'] : '';
        $phone = isset($_POST['phone']) ? sanitize_text_field($_POST['phone']) : '';

        if (!$first_name || !$last_name || !$email || !$password) {
            wp_send_json_error(array('message' => __('All fields are required.', 'myserv')));
        }

        if (email_exists($email)) {
            wp_send_json_error(array('message' => __('Email already exists.', 'myserv')));
        }

        $user_data = array(
            'user_login' => $email,
            'user_email' => $email,
            'user_pass' => $password,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'role' => 'myserv_client'
        );

        $user_id = wp_insert_user($user_data);

        if (is_wp_error($user_id)) {
            wp_send_json_error(array('message' => $user_id->get_error_message()));
        }

        // Add phone number
        if ($phone) {
            update_user_meta($user_id, '_myserv_phone', $phone);
        }

        wp_send_json_success(array(
            'message' => __('Registration successful. You can now log in.', 'myserv')
        ));
    }

    /**
     * Register a new service provider
     */
    public function register_provider() {
        check_ajax_referer('myserv-public-nonce', 'nonce');

        $first_name = isset($_POST['first_name']) ? sanitize_text_field($_POST['first_name']) : '';
        $last_name = isset($_POST['last_name']) ? sanitize_text_field($_POST['last_name']) : '';
        $email = isset($_POST['email']) ? sanitize_email($_POST['email']) : '';
        $password = isset($_POST['password']) ? $_POST['password'] : '';
        $phone = isset($_POST['phone']) ? sanitize_text_field($_POST['phone']) : '';
        $company = isset($_POST['company']) ? sanitize_text_field($_POST['company']) : '';
        $categories = isset($_POST['categories']) ? array_map('intval', $_POST['categories']) : array();

        if (!$first_name || !$last_name || !$email || !$password || !$phone || !$company) {
            wp_send_json_error(array('message' => __('All fields are required.', 'myserv')));
        }

        if (email_exists($email)) {
            wp_send_json_error(array('message' => __('Email already exists.', 'myserv')));
        }

        $user_data = array(
            'user_login' => $email,
            'user_email' => $email,
            'user_pass' => $password,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'role' => 'service_provider'
        );

        $user_id = wp_insert_user($user_data);

        if (is_wp_error($user_id)) {
            wp_send_json_error(array('message' => $user_id->get_error_message()));
        }

        // Create provider post
        $provider_data = array(
            'post_title' => $company,
            'post_content' => '',
            'post_status' => 'pending',
            'post_type' => 'service_provider',
            'post_author' => $user_id
        );

        $provider_id = wp_insert_post($provider_data);

        if (is_wp_error($provider_id)) {
            wp_delete_user($user_id);
            wp_send_json_error(array('message' => $provider_id->get_error_message()));
        }

        // Add provider metadata
        update_user_meta($user_id, '_myserv_phone', $phone);
        update_user_meta($user_id, '_myserv_provider_id', $provider_id);
        update_post_meta($provider_id, '_myserv_user_id', $user_id);

        // Set provider categories
        if (!empty($categories)) {
            wp_set_object_terms($provider_id, $categories, 'service_category');
        }

        // Notify admin
        $admin_email = get_option('admin_email');
        $subject = __('New Service Provider Registration', 'myserv');
        $message = sprintf(
            __("New service provider registration:\n\nName: %s %s\nEmail: %s\nCompany: %s\n\nApprove or reject this registration in the admin panel.", 'myserv'),
            $first_name,
            $last_name,
            $email,
            $company
        );
        wp_mail($admin_email, $subject, $message);

        wp_send_json_success(array(
            'message' => __('Registration successful. Your account is pending approval.', 'myserv')
        ));
    }

    /**
     * Update user profile
     */
    public function update_profile() {
        check_ajax_referer('myserv-profile-nonce', 'nonce');

        $user_id = get_current_user_id();
        if (!$user_id) {
            wp_send_json_error(array('message' => __('You must be logged in.', 'myserv')));
        }

        $first_name = isset($_POST['first_name']) ? sanitize_text_field($_POST['first_name']) : '';
        $last_name = isset($_POST['last_name']) ? sanitize_text_field($_POST['last_name']) : '';
        $phone = isset($_POST['phone']) ? sanitize_text_field($_POST['phone']) : '';
        $description = isset($_POST['description']) ? wp_kses_post($_POST['description']) : '';

        // Update user data
        $user_data = array(
            'ID' => $user_id,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'description' => $description
        );

        $user_id = wp_update_user($user_data);

        if (is_wp_error($user_id)) {
            wp_send_json_error(array('message' => $user_id->get_error_message()));
        }

        // Update phone number
        if ($phone) {
            update_user_meta($user_id, '_myserv_phone', $phone);
        }

        // If user is a service provider, update provider post
        if (current_user_can('service_provider')) {
            $provider_id = get_user_meta($user_id, '_myserv_provider_id', true);
            if ($provider_id) {
                $provider_data = array(
                    'ID' => $provider_id,
                    'post_content' => $description
                );
                wp_update_post($provider_data);
            }
        }

        wp_send_json_success(array(
            'message' => __('Profile updated successfully.', 'myserv')
        ));
    }

    /**
     * Upload profile photo
     */
    public function upload_profile_photo() {
        check_ajax_referer('myserv-profile-nonce', 'nonce');

        $user_id = get_current_user_id();
        if (!$user_id) {
            wp_send_json_error(array('message' => __('You must be logged in.', 'myserv')));
        }

        if (!isset($_FILES['photo'])) {
            wp_send_json_error(array('message' => __('No file uploaded.', 'myserv')));
        }

        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');

        $attachment_id = media_handle_upload('photo', 0);

        if (is_wp_error($attachment_id)) {
            wp_send_json_error(array('message' => $attachment_id->get_error_message()));
        }

        // Set as user avatar
        update_user_meta($user_id, '_myserv_profile_image', $attachment_id);

        // If user is a service provider, set as provider featured image
        if (current_user_can('service_provider')) {
            $provider_id = get_user_meta($user_id, '_myserv_provider_id', true);
            if ($provider_id) {
                set_post_thumbnail($provider_id, $attachment_id);
            }
        }

        wp_send_json_success(array(
            'message' => __('Profile photo updated successfully.', 'myserv'),
            'image_url' => wp_get_attachment_image_url($attachment_id, 'thumbnail')
        ));
    }

    /**
     * Approve provider registration
     */
    public function approve_provider() {
        check_ajax_referer('myserv-admin-nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('You do not have permission to do this.', 'myserv')));
        }

        $provider_id = isset($_POST['provider_id']) ? intval($_POST['provider_id']) : 0;
        if (!$provider_id) {
            wp_send_json_error(array('message' => __('Invalid provider ID.', 'myserv')));
        }

        // Update provider post status
        $update = wp_update_post(array(
            'ID' => $provider_id,
            'post_status' => 'publish'
        ));

        if (is_wp_error($update)) {
            wp_send_json_error(array('message' => $update->get_error_message()));
        }

        // Get user ID
        $user_id = get_post_meta($provider_id, '_myserv_user_id', true);
        if ($user_id) {
            // Notify provider
            $user = get_userdata($user_id);
            if ($user) {
                $subject = __('Your provider account has been approved', 'myserv');
                $message = __('Congratulations! Your service provider account has been approved. You can now log in and start managing your services.', 'myserv');
                wp_mail($user->user_email, $subject, $message);
            }
        }

        wp_send_json_success(array(
            'message' => __('Provider approved successfully.', 'myserv')
        ));
    }

    /**
     * Reject provider registration
     */
    public function reject_provider() {
        check_ajax_referer('myserv-admin-nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('You do not have permission to do this.', 'myserv')));
        }

        $provider_id = isset($_POST['provider_id']) ? intval($_POST['provider_id']) : 0;
        if (!$provider_id) {
            wp_send_json_error(array('message' => __('Invalid provider ID.', 'myserv')));
        }

        // Get user ID before deleting the post
        $user_id = get_post_meta($provider_id, '_myserv_user_id', true);

        // Delete provider post
        wp_delete_post($provider_id, true);

        // Delete user
        if ($user_id) {
            wp_delete_user($user_id);

            // Notify user
            $user = get_userdata($user_id);
            if ($user) {
                $subject = __('Your provider account application was rejected', 'myserv');
                $message = __('We regret to inform you that your service provider account application has been rejected. Please contact the administrator for more information.', 'myserv');
                wp_mail($user->user_email, $subject, $message);
            }
        }

        wp_send_json_success(array(
            'message' => __('Provider rejected successfully.', 'myserv')
        ));
    }

    /**
     * Add custom profile fields
     */
    public function add_custom_profile_fields($user) {
        ?>
        <h3><?php _e('MyServ Profile Information', 'myserv'); ?></h3>
        <table class="form-table">
            <tr>
                <th><label for="myserv_phone"><?php _e('Phone Number', 'myserv'); ?></label></th>
                <td>
                    <input type="tel" name="myserv_phone" id="myserv_phone" value="<?php echo esc_attr(get_user_meta($user->ID, '_myserv_phone', true)); ?>" class="regular-text">
                </td>
            </tr>
        </table>
        <?php
    }

    /**
     * Save custom profile fields
     */
    public function save_custom_profile_fields($user_id) {
        if (!current_user_can('edit_user', $user_id)) {
            return false;
        }

        if (isset($_POST['myserv_phone'])) {
            update_user_meta($user_id, '_myserv_phone', sanitize_text_field($_POST['myserv_phone']));
        }
    }
}
