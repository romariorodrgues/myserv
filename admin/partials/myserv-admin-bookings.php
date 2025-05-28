<?php
if (!defined('WPINC')) {
    die;
}

// Get all bookings
$bookings_query = new WP_Query(array(
    'post_type' => 'booking',
    'posts_per_page' => -1,
    'post_status' => array('publish', 'pending', 'completed', 'cancelled'),
));
?>

<div class="wrap">
    <h1><?php _e('Bookings', 'myserv'); ?></h1>

    <div class="myserv-admin-content">
        <div class="tablenav top">
            <div class="alignleft actions">
                <select id="myserv-booking-filter-status">
                    <option value=""><?php _e('All Statuses', 'myserv'); ?></option>
                    <option value="pending"><?php _e('Pending', 'myserv'); ?></option>
                    <option value="completed"><?php _e('Completed', 'myserv'); ?></option>
                    <option value="cancelled"><?php _e('Cancelled', 'myserv'); ?></option>
                </select>
                <select id="myserv-booking-filter-provider">
                    <option value=""><?php _e('All Providers', 'myserv'); ?></option>
                    <?php
                    $providers = get_posts(array(
                        'post_type' => 'service_provider',
                        'posts_per_page' => -1,
                        'post_status' => 'publish'
                    ));
                    foreach ($providers as $provider) {
                        echo '<option value="' . esc_attr($provider->ID) . '">' . esc_html($provider->post_title) . '</option>';
                    }
                    ?>
                </select>
                <button class="button" id="myserv-filter-bookings"><?php _e('Filter', 'myserv'); ?></button>
            </div>
        </div>

        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th><?php _e('Booking ID', 'myserv'); ?></th>
                    <th><?php _e('Client', 'myserv'); ?></th>
                    <th><?php _e('Provider', 'myserv'); ?></th>
                    <th><?php _e('Service', 'myserv'); ?></th>
                    <th><?php _e('Date/Time', 'myserv'); ?></th>
                    <th><?php _e('Status', 'myserv'); ?></th>
                    <th><?php _e('Payment', 'myserv'); ?></th>
                    <th><?php _e('Actions', 'myserv'); ?></th>
                </tr>
            </thead>
            <tbody>
                <?php if ($bookings_query->have_posts()) : while ($bookings_query->have_posts()) : $bookings_query->the_post(); ?>
                    <?php
                    $booking_id = get_the_ID();
                    $client_id = get_post_meta($booking_id, '_myserv_client_id', true);
                    $provider_id = get_post_meta($booking_id, '_myserv_provider_id', true);
                    $service_id = get_post_meta($booking_id, '_myserv_service_id', true);
                    $booking_date = get_post_meta($booking_id, '_myserv_booking_date', true);
                    $booking_time = get_post_meta($booking_id, '_myserv_booking_time', true);
                    $status = get_post_status();
                    $payment_status = get_post_meta($booking_id, '_myserv_payment_status', true);
                    
                    $client = get_userdata($client_id);
                    $provider = get_post($provider_id);
                    ?>
                    <tr>
                        <td>#<?php echo esc_html($booking_id); ?></td>
                        <td><?php echo esc_html($client ? $client->display_name : '-'); ?></td>
                        <td><?php echo esc_html($provider ? $provider->post_title : '-'); ?></td>
                        <td><?php echo esc_html(get_the_title($service_id)); ?></td>
                        <td>
                            <?php
                            if ($booking_date && $booking_time) {
                                echo esc_html(date_i18n(get_option('date_format'), strtotime($booking_date)));
                                echo ' ';
                                echo esc_html(date_i18n(get_option('time_format'), strtotime($booking_time)));
                            }
                            ?>
                        </td>
                        <td><?php echo esc_html(ucfirst($status)); ?></td>
                        <td><?php echo esc_html(ucfirst($payment_status)); ?></td>
                        <td>
                            <div class="row-actions">
                                <span class="edit">
                                    <a href="<?php echo get_edit_post_link($booking_id); ?>"><?php _e('Edit', 'myserv'); ?></a> |
                                </span>
                                <?php if ($status === 'pending') : ?>
                                    <span class="complete">
                                        <a href="#" class="myserv-complete-booking" data-booking-id="<?php echo esc_attr($booking_id); ?>"><?php _e('Complete', 'myserv'); ?></a> |
                                    </span>
                                    <span class="cancel">
                                        <a href="#" class="myserv-cancel-booking" data-booking-id="<?php echo esc_attr($booking_id); ?>"><?php _e('Cancel', 'myserv'); ?></a>
                                    </span>
                                <?php endif; ?>
                            </div>
                        </td>
                    </tr>
                <?php endwhile; endif; ?>
                <?php wp_reset_postdata(); ?>
            </tbody>
        </table>
    </div>
</div>
