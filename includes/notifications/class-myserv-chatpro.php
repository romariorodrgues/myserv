<?php

/**
 * Handle WhatsApp notifications via ChatPro API
 */
class MyServ_ChatPro {
    /**
     * API endpoint
     */
    private $api_endpoint = 'https://api.chatpro.com.br/v1';

    /**
     * API key
     */
    private $api_key;

    /**
     * Initialize the class
     */
    public function __construct() {
        $this->api_key = get_option('myserv_chatpro_api_key');
    }

    /**
     * Send WhatsApp message
     */
    public function send_message($to, $message) {
        if (!$this->api_key) {
            return array(
                'success' => false,
                'message' => __('ChatPro API key not configured', 'myserv')
            );
        }

        try {
            $response = wp_remote_post($this->api_endpoint . '/send', array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . $this->api_key,
                    'Content-Type' => 'application/json'
                ),
                'body' => json_encode(array(
                    'phone' => $this->format_phone_number($to),
                    'message' => $message
                ))
            ));

            if (is_wp_error($response)) {
                throw new Exception($response->get_error_message());
            }

            $body = json_decode(wp_remote_retrieve_body($response), true);

            if (!$body || !isset($body['success'])) {
                throw new Exception(__('Invalid response from ChatPro API', 'myserv'));
            }

            return array(
                'success' => $body['success'],
                'message' => isset($body['message']) ? $body['message'] : ''
            );

        } catch (Exception $e) {
            return array(
                'success' => false,
                'message' => $e->getMessage()
            );
        }
    }

    /**
     * Send booking notification to provider
     */
    public function send_booking_notification($booking_id) {
        $booking = get_post($booking_id);
        if (!$booking || $booking->post_type !== 'booking') {
            return false;
        }

        $provider_id = get_post_meta($booking_id, '_myserv_provider_id', true);
        $client_id = get_post_meta($booking_id, '_myserv_client_id', true);
        $service_id = get_post_meta($booking_id, '_myserv_service_id', true);
        $booking_date = get_post_meta($booking_id, '_myserv_booking_date', true);
        $booking_time = get_post_meta($booking_id, '_myserv_booking_time', true);

        $provider = get_post($provider_id);
        $client = get_userdata($client_id);
        $service = get_post($service_id);

        if (!$provider || !$client || !$service) {
            return false;
        }

        $provider_phone = get_post_meta($provider_id, '_myserv_phone', true);
        $datetime = date_i18n(
            get_option('date_format') . ' ' . get_option('time_format'),
            strtotime($booking_date . ' ' . $booking_time)
        );

        $message = sprintf(
            __("New booking request!\n\nClient: %s\nService: %s\nDate/Time: %s\n\nAccess your dashboard to accept or decline: %s", 'myserv'),
            $client->display_name,
            $service->post_title,
            $datetime,
            admin_url('admin.php?page=myserv-bookings')
        );

        return $this->send_message($provider_phone, $message);
    }

    /**
     * Send booking confirmation to client
     */
    public function send_booking_confirmation($booking_id) {
        $booking = get_post($booking_id);
        if (!$booking || $booking->post_type !== 'booking') {
            return false;
        }

        $provider_id = get_post_meta($booking_id, '_myserv_provider_id', true);
        $client_id = get_post_meta($booking_id, '_myserv_client_id', true);
        $service_id = get_post_meta($booking_id, '_myserv_service_id', true);
        $booking_date = get_post_meta($booking_id, '_myserv_booking_date', true);
        $booking_time = get_post_meta($booking_id, '_myserv_booking_time', true);

        $provider = get_post($provider_id);
        $client = get_userdata($client_id);
        $service = get_post($service_id);

        if (!$provider || !$client || !$service) {
            return false;
        }

        $client_phone = get_user_meta($client_id, '_myserv_phone', true);
        $datetime = date_i18n(
            get_option('date_format') . ' ' . get_option('time_format'),
            strtotime($booking_date . ' ' . $booking_time)
        );

        $message = sprintf(
            __("Booking confirmed!\n\nProvider: %s\nService: %s\nDate/Time: %s\n\nView details: %s", 'myserv'),
            $provider->post_title,
            $service->post_title,
            $datetime,
            home_url('/booking-details/?id=' . $booking_id)
        );

        return $this->send_message($client_phone, $message);
    }

    /**
     * Send booking reminder
     */
    public function send_booking_reminder($booking_id) {
        $booking = get_post($booking_id);
        if (!$booking || $booking->post_type !== 'booking') {
            return false;
        }

        $provider_id = get_post_meta($booking_id, '_myserv_provider_id', true);
        $client_id = get_post_meta($booking_id, '_myserv_client_id', true);
        $service_id = get_post_meta($booking_id, '_myserv_service_id', true);
        $booking_date = get_post_meta($booking_id, '_myserv_booking_date', true);
        $booking_time = get_post_meta($booking_id, '_myserv_booking_time', true);

        $provider = get_post($provider_id);
        $client = get_userdata($client_id);
        $service = get_post($service_id);

        if (!$provider || !$client || !$service) {
            return false;
        }

        $client_phone = get_user_meta($client_id, '_myserv_phone', true);
        $datetime = date_i18n(
            get_option('date_format') . ' ' . get_option('time_format'),
            strtotime($booking_date . ' ' . $booking_time)
        );

        $message = sprintf(
            __("Reminder: You have a booking tomorrow!\n\nProvider: %s\nService: %s\nDate/Time: %s\n\nView details: %s", 'myserv'),
            $provider->post_title,
            $service->post_title,
            $datetime,
            home_url('/booking-details/?id=' . $booking_id)
        );

        return $this->send_message($client_phone, $message);
    }

    /**
     * Format phone number to international format
     */
    private function format_phone_number($phone) {
        // Remove all non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // Add Brazil country code if not present
        if (strlen($phone) <= 11) {
            $phone = '55' . $phone;
        }

        return $phone;
    }
}
