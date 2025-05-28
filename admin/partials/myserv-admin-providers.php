<?php
if (!defined('WPINC')) {
    die;
}

// Get all service providers
$providers_query = new WP_Query(array(
    'post_type' => 'service_provider',
    'posts_per_page' => -1,
    'post_status' => array('publish', 'pending')
));
?>

<div class="wrap">
    <h1><?php _e('Service Providers', 'myserv'); ?></h1>

    <div class="myserv-admin-content">
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th><?php _e('Provider Name', 'myserv'); ?></th>
                    <th><?php _e('Status', 'myserv'); ?></th>
                    <th><?php _e('Subscription Plan', 'myserv'); ?></th>
                    <th><?php _e('Categories', 'myserv'); ?></th>
                    <th><?php _e('Booking Fee', 'myserv'); ?></th>
                    <th><?php _e('Actions', 'myserv'); ?></th>
                </tr>
            </thead>
            <tbody>
                <?php if ($providers_query->have_posts()) : while ($providers_query->have_posts()) : $providers_query->the_post(); ?>
                    <?php
                    $provider_id = get_the_ID();
                    $status = get_post_status();
                    $subscription_plan = get_post_meta($provider_id, '_myserv_subscription_plan', true);
                    $categories = get_the_terms($provider_id, 'service_category');
                    $booking_fee = get_post_meta($provider_id, '_myserv_booking_fee', true);
                    ?>
                    <tr>
                        <td>
                            <strong><a href="<?php echo get_edit_post_link($provider_id); ?>"><?php the_title(); ?></a></strong>
                        </td>
                        <td>
                            <?php echo ucfirst($status); ?>
                        </td>
                        <td>
                            <?php echo esc_html($subscription_plan ? ucfirst($subscription_plan) : __('Not subscribed', 'myserv')); ?>
                        </td>
                        <td>
                            <?php
                            if ($categories && !is_wp_error($categories)) {
                                $category_names = array();
                                foreach ($categories as $category) {
                                    $category_names[] = $category->name;
                                }
                                echo esc_html(implode(', ', $category_names));
                            }
                            ?>
                        </td>
                        <td>
                            <?php echo esc_html($booking_fee ? $booking_fee . '%' : __('Default', 'myserv')); ?>
                        </td>
                        <td>
                            <?php if ($status === 'pending') : ?>
                                <button class="button button-primary myserv-approve-provider" data-provider-id="<?php echo esc_attr($provider_id); ?>">
                                    <?php _e('Approve', 'myserv'); ?>
                                </button>
                            <?php endif; ?>
                            <a href="<?php echo get_edit_post_link($provider_id); ?>" class="button">
                                <?php _e('Edit', 'myserv'); ?>
                            </a>
                        </td>
                    </tr>
                <?php endwhile; endif; ?>
                <?php wp_reset_postdata(); ?>
            </tbody>
        </table>
    </div>
</div>
