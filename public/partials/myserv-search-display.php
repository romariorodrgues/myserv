<?php
if (!defined('WPINC')) {
    die;
}
?>

<div class="myserv-search-container">
    <form id="myserv-search-form" class="myserv-search-form">
        <input type="text" id="myserv-location" name="location" placeholder="<?php esc_attr_e('Enter location or ZIP code', 'myserv'); ?>" required>
        <button type="button" id="myserv-use-location" style="display: none;">
            <?php _e('Use my location', 'myserv'); ?>
        </button>
        
        <input type="hidden" id="myserv-latitude" name="latitude">
        <input type="hidden" id="myserv-longitude" name="longitude">

        <select name="service_category" id="myserv-category">
            <option value=""><?php _e('All Categories', 'myserv'); ?></option>
            <?php
            $categories = get_terms(array(
                'taxonomy' => 'service_category',
                'hide_empty' => true,
            ));

            if (!is_wp_error($categories)) {
                foreach ($categories as $category) {
                    echo '<option value="' . esc_attr($category->term_id) . '">' . esc_html($category->name) . '</option>';
                }
            }
            ?>
        </select>

        <input type="date" name="date" id="myserv-date" min="<?php echo date('Y-m-d'); ?>">
        
        <select name="time" id="myserv-time">
            <option value=""><?php _e('Any Time', 'myserv'); ?></option>
            <?php
            $start = strtotime('08:00');
            $end = strtotime('20:00');
            $interval = 30 * 60; // 30 minutes

            for ($time = $start; $time <= $end; $time += $interval) {
                echo '<option value="' . date('H:i', $time) . '">' . date(get_option('time_format'), $time) . '</option>';
            }
            ?>
        </select>

        <button type="submit" class="myserv-search-button">
            <?php _e('Search', 'myserv'); ?>
        </button>
    </form>

    <div id="myserv-search-results" class="myserv-providers-grid">
        <!-- Results will be loaded here via AJAX -->
    </div>
</div>

<script type="text/template" id="myserv-provider-template">
    <div class="myserv-provider-card">
        <img src="{provider_image}" alt="{provider_name}">
        <div class="myserv-provider-info">
            <h3 class="myserv-provider-name">{provider_name}</h3>
            <div class="myserv-provider-category">{provider_category}</div>
            <div class="myserv-provider-rating">
                {rating_stars}
                <span>({review_count} <?php _e('reviews', 'myserv'); ?>)</span>
            </div>
            <a href="{provider_url}" class="myserv-book-button">
                <?php _e('Book Now', 'myserv'); ?>
            </a>
        </div>
    </div>
</script>
