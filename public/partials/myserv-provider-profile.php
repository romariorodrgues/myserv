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

$provider_meta = get_post_meta($provider_id);
$services = get_post_meta($provider_id, '_myserv_services', true);
$rating = get_post_meta($provider_id, '_myserv_rating', true);
$review_count = get_post_meta($provider_id, '_myserv_review_count', true);
$categories = get_the_terms($provider_id, 'service_category');
?>

<div class="myserv-provider-profile">
    <div class="myserv-provider-header">
        <div class="myserv-provider-avatar">
            <?php echo get_the_post_thumbnail($provider_id, 'medium'); ?>
        </div>
        
        <div class="myserv-provider-info">
            <h1><?php echo esc_html($provider->post_title); ?></h1>
            
            <?php if ($categories && !is_wp_error($categories)) : ?>
                <div class="myserv-provider-categories">
                    <?php foreach ($categories as $category) : ?>
                        <span class="myserv-category-tag"><?php echo esc_html($category->name); ?></span>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
            
            <div class="myserv-provider-rating">
                <?php
                $rating = floatval($rating);
                for ($i = 1; $i <= 5; $i++) {
                    if ($i <= $rating) {
                        echo '<span class="myserv-star full">★</span>';
                    } elseif ($i - 0.5 <= $rating) {
                        echo '<span class="myserv-star half">★</span>';
                    } else {
                        echo '<span class="myserv-star empty">☆</span>';
                    }
                }
                ?>
                <span class="myserv-review-count">(<?php echo intval($review_count); ?> <?php _e('reviews', 'myserv'); ?>)</span>
            </div>
        </div>
        
        <div class="myserv-provider-actions">
            <a href="#booking" class="myserv-book-button">
                <?php _e('Book Appointment', 'myserv'); ?>
            </a>
        </div>
    </div>

    <div class="myserv-provider-content">
        <div class="myserv-provider-description">
            <?php echo wpautop($provider->post_content); ?>
        </div>

        <?php if ($services) : ?>
            <div class="myserv-provider-services">
                <h2><?php _e('Services', 'myserv'); ?></h2>
                <div class="myserv-services-grid">
                    <?php foreach ($services as $service) : ?>
                        <div class="myserv-service-card">
                            <h3><?php echo esc_html($service['name']); ?></h3>
                            <div class="myserv-service-duration">
                                <?php echo esc_html($service['duration']); ?> <?php _e('minutes', 'myserv'); ?>
                            </div>
                            <div class="myserv-service-price">
                                <?php echo esc_html($service['price']); ?>
                            </div>
                            <p class="myserv-service-description">
                                <?php echo esc_html($service['description']); ?>
                            </p>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endif; ?>

        <div id="booking" class="myserv-booking-section">
            <h2><?php _e('Book an Appointment', 'myserv'); ?></h2>
            <?php echo do_shortcode('[booking_calendar provider_id="' . esc_attr($provider_id) . '"]'); ?>
        </div>

        <div class="myserv-reviews-section">
            <h2><?php _e('Reviews', 'myserv'); ?></h2>
            <?php
            $reviews = get_comments(array(
                'post_id' => $provider_id,
                'status' => 'approve'
            ));

            if ($reviews) :
            ?>
                <div class="myserv-reviews-grid">
                    <?php foreach ($reviews as $review) : ?>
                        <div class="myserv-review-card">
                            <div class="myserv-review-header">
                                <span class="myserv-reviewer-name">
                                    <?php echo esc_html($review->comment_author); ?>
                                </span>
                                <span class="myserv-review-date">
                                    <?php echo get_comment_date(get_option('date_format'), $review->comment_ID); ?>
                                </span>
                            </div>
                            <div class="myserv-review-rating">
                                <?php
                                $review_rating = get_comment_meta($review->comment_ID, 'rating', true);
                                for ($i = 1; $i <= 5; $i++) {
                                    echo $i <= $review_rating ? '★' : '☆';
                                }
                                ?>
                            </div>
                            <div class="myserv-review-content">
                                <?php echo wpautop($review->comment_content); ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php else : ?>
                <p><?php _e('No reviews yet.', 'myserv'); ?></p>
            <?php endif; ?>
        </div>
    </div>
</div>
