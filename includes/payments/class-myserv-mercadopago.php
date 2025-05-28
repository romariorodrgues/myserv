<?php

/**
 * Handle MercadoPago payment integration
 */
class MyServ_MercadoPago {
    /**
     * MercadoPago SDK instance
     */
    private $mp;

    /**
     * Initialize the class
     */
    public function __construct() {
        // Load MercadoPago SDK via Composer autoload
        require_once MYSERV_PLUGIN_DIR . 'vendor/autoload.php';

        // Initialize MercadoPago SDK
        \MercadoPago\SDK::setAccessToken($this->get_access_token());
    }

    /**
     * Get MercadoPago access token based on environment
     */
    private function get_access_token() {
        $is_sandbox = get_option('myserv_mercadopago_sandbox', '1');
        return $is_sandbox ? 
            get_option('myserv_mercadopago_test_access_token') : 
            get_option('myserv_mercadopago_access_token');
    }

    /**
     * Create a payment preference for a booking
     */
    public function create_payment_preference($booking_id) {
        try {
            $booking = get_post($booking_id);
            if (!$booking || $booking->post_type !== 'booking') {
                throw new Exception(__('Invalid booking ID', 'myserv'));
            }

            // Get booking details
            $provider_id = get_post_meta($booking_id, '_myserv_provider_id', true);
            $service_id = get_post_meta($booking_id, '_myserv_service_id', true);
            $client_id = get_post_meta($booking_id, '_myserv_client_id', true);
            
            // Get service details
            $services = get_post_meta($provider_id, '_myserv_services', true);
            $service = array_filter($services, function($s) use ($service_id) {
                return $s['id'] == $service_id;
            });
            $service = reset($service);

            if (!$service) {
                throw new Exception(__('Service not found', 'myserv'));
            }

            // Create payment preference
            $preference = new \MercadoPago\Preference();

            // Create item
            $item = new \MercadoPago\Item();
            $item->title = $service['name'];
            $item->quantity = 1;
            $item->unit_price = floatval($service['price']);
            $item->currency_id = "BRL"; // Brazilian Real

            $preference->items = array($item);

            // Set payer information
            $user = get_userdata($client_id);
            $preference->payer = array(
                "name" => $user->first_name,
                "surname" => $user->last_name,
                "email" => $user->user_email
            );

            // Set success and failure URLs
            $preference->back_urls = array(
                "success" => add_query_arg(array(
                    'booking_id' => $booking_id,
                    'status' => 'success'
                ), home_url('/booking-confirmation/')),
                "failure" => add_query_arg(array(
                    'booking_id' => $booking_id,
                    'status' => 'failure'
                ), home_url('/booking-confirmation/')),
                "pending" => add_query_arg(array(
                    'booking_id' => $booking_id,
                    'status' => 'pending'
                ), home_url('/booking-confirmation/'))
            );

            // Set notification URL for webhooks
            $preference->notification_url = add_query_arg(array(
                'myserv-webhook' => 'mercadopago'
            ), home_url('/'));

            // Save preference
            $preference->save();

            // Store preference ID in booking meta
            update_post_meta($booking_id, '_myserv_mercadopago_preference_id', $preference->id);

            return array(
                'success' => true,
                'init_point' => $preference->init_point
            );

        } catch (Exception $e) {
            return array(
                'success' => false,
                'message' => $e->getMessage()
            );
        }
    }

    /**
     * Handle MercadoPago webhook notifications
     */
    public function handle_webhook() {
        try {
            $payment_id = $_GET["data.id"];
            
            // Get payment information
            $payment = \MercadoPago\Payment::find_by_id($payment_id);
            
            // Get booking from external reference
            $booking_id = $payment->external_reference;
            $booking = get_post($booking_id);

            if (!$booking || $booking->post_type !== 'booking') {
                throw new Exception('Invalid booking ID');
            }

            // Update booking status based on payment status
            switch($payment->status) {
                case 'approved':
                    update_post_meta($booking_id, '_myserv_payment_status', 'completed');
                    wp_update_post(array(
                        'ID' => $booking_id,
                        'post_status' => 'confirmed'
                    ));
                    
                    // Send confirmation notifications
                    do_action('myserv_booking_confirmed', $booking_id);
                    break;

                case 'pending':
                case 'in_process':
                    update_post_meta($booking_id, '_myserv_payment_status', 'pending');
                    break;

                case 'rejected':
                case 'cancelled':
                    update_post_meta($booking_id, '_myserv_payment_status', 'failed');
                    wp_update_post(array(
                        'ID' => $booking_id,
                        'post_status' => 'cancelled'
                    ));
                    
                    // Send cancellation notifications
                    do_action('myserv_booking_cancelled', $booking_id);
                    break;
            }

            return true;

        } catch (Exception $e) {
            error_log('MyServ MercadoPago Webhook Error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Create a subscription preference
     */
    public function create_subscription_preference($provider_id, $plan_id) {
        try {
            // Get plan details
            $plans = $this->get_subscription_plans();
            if (!isset($plans[$plan_id])) {
                throw new Exception(__('Invalid plan ID', 'myserv'));
            }
            $plan = $plans[$plan_id];

            // Create preapproval payment
            $preapproval = new \MercadoPago\Preapproval();
            $preapproval->payer_email = get_post_meta($provider_id, '_myserv_email', true);
            $preapproval->back_url = home_url('/provider-dashboard/');
            $preapproval->reason = $plan['name'];
            $preapproval->external_reference = $provider_id;
            $preapproval->auto_recurring = array(
                "frequency" => 1,
                "frequency_type" => "months",
                "transaction_amount" => $plan['price'],
                "currency_id" => "BRL"
            );

            $preapproval->save();

            // Store subscription data
            update_post_meta($provider_id, '_myserv_subscription_id', $preapproval->id);
            update_post_meta($provider_id, '_myserv_subscription_plan', $plan_id);
            update_post_meta($provider_id, '_myserv_subscription_status', 'pending');

            return array(
                'success' => true,
                'init_point' => $preapproval->init_point
            );

        } catch (Exception $e) {
            return array(
                'success' => false,
                'message' => $e->getMessage()
            );
        }
    }

    /**
     * Get available subscription plans
     */
    private function get_subscription_plans() {
        return array(
            'basic' => array(
                'name' => __('Basic Plan', 'myserv'),
                'price' => 49.90,
                'features' => array(
                    __('Up to 30 bookings per month', 'myserv'),
                    __('Basic profile customization', 'myserv'),
                    __('Email notifications', 'myserv')
                )
            ),
            'pro' => array(
                'name' => __('Professional Plan', 'myserv'),
                'price' => 99.90,
                'features' => array(
                    __('Unlimited bookings', 'myserv'),
                    __('Advanced profile customization', 'myserv'),
                    __('Email and WhatsApp notifications', 'myserv'),
                    __('Priority support', 'myserv')
                )
            )
        );
    }
}
