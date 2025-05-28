<?php
if (!defined('WPINC')) {
    die;
}
?>

<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

    <h2 class="nav-tab-wrapper">
        <a href="#general" class="nav-tab nav-tab-active myserv-settings-tab"><?php _e('General Settings', 'myserv'); ?></a>
        <a href="#payment" class="nav-tab myserv-settings-tab"><?php _e('Payment Settings', 'myserv'); ?></a>
        <a href="#notification" class="nav-tab myserv-settings-tab"><?php _e('Notification Settings', 'myserv'); ?></a>
    </h2>

    <form method="post" action="options.php">
        <?php settings_fields('myserv_settings'); ?>

        <div id="general" class="myserv-settings-content">
            <div class="myserv-settings-section">
                <h2><?php _e('General Configuration', 'myserv'); ?></h2>
                <table class="form-table myserv-form-table">
                    <tr>
                        <th><?php _e('Default Booking Fee (%)', 'myserv'); ?></th>
                        <td>
                            <input type="number" name="myserv_default_fee" value="<?php echo esc_attr(get_option('myserv_default_fee', '10')); ?>" min="0" max="100" step="0.1">
                        </td>
                    </tr>
                    <tr>
                        <th><?php _e('Allow Provider Fee Override', 'myserv'); ?></th>
                        <td>
                            <input type="checkbox" name="myserv_allow_fee_override" value="1" <?php checked(get_option('myserv_allow_fee_override', '1')); ?>>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <div id="payment" class="myserv-settings-content" style="display: none;">
            <div class="myserv-settings-section">
                <h2><?php _e('MercadoPago Settings', 'myserv'); ?></h2>
                <table class="form-table myserv-form-table">
                    <tr>
                        <th><?php _e('Public Key', 'myserv'); ?></th>
                        <td>
                            <input type="text" name="myserv_mercadopago_public_key" value="<?php echo esc_attr(get_option('myserv_mercadopago_public_key')); ?>">
                        </td>
                    </tr>
                    <tr>
                        <th><?php _e('Access Token', 'myserv'); ?></th>
                        <td>
                            <input type="password" name="myserv_mercadopago_access_token" value="<?php echo esc_attr(get_option('myserv_mercadopago_access_token')); ?>">
                        </td>
                    </tr>
                    <tr>
                        <th><?php _e('Sandbox Mode', 'myserv'); ?></th>
                        <td>
                            <input type="checkbox" name="myserv_mercadopago_sandbox" value="1" <?php checked(get_option('myserv_mercadopago_sandbox', '1')); ?>>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <div id="notification" class="myserv-settings-content" style="display: none;">
            <div class="myserv-settings-section">
                <h2><?php _e('WhatsApp Settings', 'myserv'); ?></h2>
                <table class="form-table myserv-form-table">
                    <tr>
                        <th><?php _e('ChatPro API Key', 'myserv'); ?></th>
                        <td>
                            <input type="password" name="myserv_chatpro_api_key" value="<?php echo esc_attr(get_option('myserv_chatpro_api_key')); ?>">
                        </td>
                    </tr>
                    <tr>
                        <th><?php _e('Enable Booking Notifications', 'myserv'); ?></th>
                        <td>
                            <input type="checkbox" name="myserv_enable_booking_notifications" value="1" <?php checked(get_option('myserv_enable_booking_notifications', '1')); ?>>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <?php submit_button(); ?>
    </form>
</div>
