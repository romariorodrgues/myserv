<?php

/**
 * Handle scheduled notifications
 */
class MyServ_Notification_Scheduler {

    /**
     * Initialize the scheduler
     */
    public function __construct() {
        add_action('myserv_booking_confirmed', array($this, 'schedule_booking_notifications'), 10, 1);
        add_action('myserv_send_booking_reminder', array($this, 'send_booking_reminder'), 10, 1);
    }

    /**
     * Schedule notifications for a confirmed booking
     */
    public function schedule_booking_notifications($booking_id) {
        $booking_date = get_post_meta($booking_id, '_myserv_booking_date', true);
        if (!$booking_date) {
            return;
        }

        // Schedule reminder for 24 hours before the booking
        $reminder_time = strtotime($booking_date . ' -24 hours');
        if ($reminder_time > time()) {
            wp_schedule_single_event($reminder_time, 'myserv_send_booking_reminder', array($booking_id));
        }
    }

    /**
     * Send booking reminder
     */
    public function send_booking_reminder($booking_id) {
        $chatpro = new MyServ_ChatPro();
        $chatpro->send_booking_reminder($booking_id);
    }

    /**
     * Send booking notifications immediately
     */
    public function send_immediate_notifications($booking_id) {
        $chatpro = new MyServ_ChatPro();
        
        // Send notification to provider
        $chatpro->send_booking_notification($booking_id);
        
        // If booking is already confirmed, send confirmation to client
        $booking = get_post($booking_id);
        if ($booking && $booking->post_status === 'confirmed') {
            $chatpro->send_booking_confirmation($booking_id);
        }
    }
}
