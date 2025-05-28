<?php
if (!defined('WPINC')) {
    die;
}

$provider_id = get_query_var('provider_id');
$provider = get_post($provider_id);

if (!$provider || $provider->post_type !== 'service_provider') {
    _e('Provider not found', 'myserv');
    return;
}
?>

<div class="myserv-calendar-container">
    <div id="myserv-booking-calendar" data-provider-id="<?php echo esc_attr($provider_id); ?>"></div>
</div>

<!-- Booking Modal -->
<div id="myserv-booking-modal" class="myserv-modal">
    <div class="myserv-modal-content">
        <span class="myserv-modal-close">&times;</span>
        <h2><?php _e('Book Appointment', 'myserv'); ?></h2>
        
        <form id="myserv-booking-form" class="myserv-booking-form">
            <input type="hidden" id="booking-provider-id" name="provider_id" value="<?php echo esc_attr($provider_id); ?>">
            <input type="hidden" id="booking-date" name="date">
            
            <div class="form-row">
                <label for="booking-service"><?php _e('Service', 'myserv'); ?></label>
                <select id="booking-service" name="service_id" required>
                    <?php
                    $services = get_post_meta($provider_id, '_myserv_services', true);
                    if ($services) {
                        foreach ($services as $service) {
                            echo '<option value="' . esc_attr($service['id']) . '">' . 
                                 esc_html($service['name']) . ' - ' . 
                                 esc_html($service['duration']) . ' min - ' . 
                                 esc_html($service['price']) . '</option>';
                        }
                    }
                    ?>
                </select>
            </div>

            <div class="form-row">
                <label for="booking-notes"><?php _e('Notes', 'myserv'); ?></label>
                <textarea id="booking-notes" name="notes" rows="3"></textarea>
            </div>

            <div class="form-row">
                <button type="submit" class="myserv-book-button">
                    <?php _e('Confirm Booking', 'myserv'); ?>
                </button>
            </div>
        </form>
    </div>
</div>
