<?php
/**
 * Template for booking details meta box
 */
?>
<div class="myserv-booking-details">
    <div class="myserv-form-row">
        <label for="myserv_service_id"><?php _e('Service', 'myserv'); ?></label>
        <select name="myserv_service_id" id="myserv_service_id" required>
            <option value=""><?php _e('Select a service', 'myserv'); ?></option>
            <?php
            $services = get_posts(array(
                'post_type' => 'myserv_service',
                'posts_per_page' => -1,
                'orderby' => 'title',
                'order' => 'ASC'
            ));

            foreach ($services as $service) {
                printf(
                    '<option value="%s" %s>%s</option>',
                    esc_attr($service->ID),
                    selected($service_id, $service->ID, false),
                    esc_html($service->post_title)
                );
            }
            ?>
        </select>
    </div>

    <div class="myserv-form-row">
        <label for="myserv_provider_id"><?php _e('Service Provider', 'myserv'); ?></label>
        <select name="myserv_provider_id" id="myserv_provider_id" required>
            <option value=""><?php _e('Select a provider', 'myserv'); ?></option>
            <?php
            $providers = get_users(array('role' => 'service_provider'));
            foreach ($providers as $provider) {
                printf(
                    '<option value="%s" %s>%s</option>',
                    esc_attr($provider->ID),
                    selected($provider_id, $provider->ID, false),
                    esc_html($provider->display_name)
                );
            }
            ?>
        </select>
    </div>

    <div class="myserv-form-row">
        <label for="myserv_client_id"><?php _e('Client', 'myserv'); ?></label>
        <select name="myserv_client_id" id="myserv_client_id" required>
            <option value=""><?php _e('Select a client', 'myserv'); ?></option>
            <?php
            $clients = get_users(array('role' => 'myserv_client'));
            foreach ($clients as $client) {
                printf(
                    '<option value="%s" %s>%s</option>',
                    esc_attr($client->ID),
                    selected($client_id, $client->ID, false),
                    esc_html($client->display_name)
                );
            }
            ?>
        </select>
    </div>

    <div class="myserv-form-row">
        <label for="myserv_booking_date"><?php _e('Date', 'myserv'); ?></label>
        <input type="date" 
               name="myserv_booking_date" 
               id="myserv_booking_date" 
               value="<?php echo esc_attr($date); ?>" 
               required>
    </div>

    <div class="myserv-form-row">
        <label for="myserv_booking_time"><?php _e('Time', 'myserv'); ?></label>
        <input type="time" 
               name="myserv_booking_time" 
               id="myserv_booking_time" 
               value="<?php echo esc_attr($time); ?>" 
               required>
    </div>

    <div class="myserv-form-row">
        <label for="myserv_booking_status"><?php _e('Booking Status', 'myserv'); ?></label>
        <select name="myserv_booking_status" id="myserv_booking_status" required>
            <?php
            $statuses = array(
                'pending' => __('Pending', 'myserv'),
                'confirmed' => __('Confirmed', 'myserv'),
                'cancelled' => __('Cancelled', 'myserv'),
                'completed' => __('Completed', 'myserv')
            );
            foreach ($statuses as $value => $label) {
                printf(
                    '<option value="%s" %s>%s</option>',
                    esc_attr($value),
                    selected($booking_status, $value, false),
                    esc_html($label)
                );
            }
            ?>
        </select>
    </div>

    <div class="myserv-form-row">
        <label for="myserv_payment_status"><?php _e('Payment Status', 'myserv'); ?></label>
        <select name="myserv_payment_status" id="myserv_payment_status" required>
            <?php
            $payment_statuses = array(
                'pending' => __('Pending', 'myserv'),
                'processing' => __('Processing', 'myserv'),
                'completed' => __('Completed', 'myserv'),
                'failed' => __('Failed', 'myserv'),
                'refunded' => __('Refunded', 'myserv')
            );
            foreach ($payment_statuses as $value => $label) {
                printf(
                    '<option value="%s" %s>%s</option>',
                    esc_attr($value),
                    selected($payment_status, $value, false),
                    esc_html($label)
                );
            }
            ?>
        </select>
    </div>

    <div class="myserv-form-row">
        <label for="myserv_booking_notes"><?php _e('Notes', 'myserv'); ?></label>
        <textarea name="myserv_booking_notes" 
                  id="myserv_booking_notes" 
                  rows="4"><?php echo esc_textarea($notes); ?></textarea>
    </div>
</div>
