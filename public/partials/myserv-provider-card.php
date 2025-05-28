<?php
/**
 * Template for displaying a provider card in search results
 */

if (!defined('WPINC')) {
    die;
}

$provider_image = get_the_post_thumbnail_url($provider->ID, 'medium');
if (!$provider_image) {
    $provider_image = MYSERV_PLUGIN_URL . 'public/images/default-provider.png';
}

$rating = get_post_meta($provider->ID, '_myserv_rating', true);
$review_count = get_post_meta($provider->ID, '_myserv_review_count', true);
$categories = get_the_terms($provider->ID, 'service_category');
?>

<div class="myserv-provider-card">
    <img src="<?php echo esc_url($provider_image); ?>" alt="<?php echo esc_attr($provider->post_title); ?>">
    <div class="myserv-provider-info">
        <h3 class="myserv-provider-name">
            <?php echo esc_html($provider->post_title); ?>
            <?php if (isset($provider->distance)) : ?>
                <span class="myserv-provider-distance">
                    <?php printf(__('%.1f km away', 'myserv'), $provider->distance); ?>
                </span>
            <?php endif; ?>
        </h3>

        <?php if ($categories && !is_wp_error($categories)) : ?>
            <div class="myserv-provider-category">
                <?php
                $category_names = array();
                foreach ($categories as $category) {
                    $category_names[] = $category->name;
                }
                echo esc_html(implode(', ', $category_names));
                ?>
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
            <span class="myserv-review-count">
                <?php printf(_n('(%d review)', '(%d reviews)', $review_count, 'myserv'), $review_count); ?>
            </span>
        </div>

        <div class="myserv-provider-excerpt">
            <?php echo wp_trim_words($provider->post_content, 20); ?>
        </div>

        <a href="<?php echo get_permalink($provider->ID); ?>" class="myserv-book-button">
            <?php _e('Book Now', 'myserv'); ?>
        </a>
    </div>
</div>
