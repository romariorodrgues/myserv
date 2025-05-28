<?php
/**
 * MyServ - Professional Services Booking Platform
 *
 * @package   MyServ
 * @author    Your Name
 * @license   GPL-2.0+
 * @link      http://example.com
 *
 * @wordpress-plugin
 * Plugin Name:       MyServ - Professional Services Booking Platform
 * Plugin URI:        http://example.com/myserv-plugin
 * Description:       A complete booking system for professionals and service providers with payment integration.
 * Version:           1.0.0
 * Author:            Your Name
 * Author URI:        http://example.com
 * Text Domain:       myserv
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

// Define plugin constants
define('MYSERV_VERSION', '1.0.0');
define('MYSERV_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MYSERV_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * The core plugin class
 */
require_once MYSERV_PLUGIN_DIR . 'includes/class-myserv.php';

/**
 * Begins execution of the plugin.
 */
function run_myserv() {
    $plugin = new MyServ();
    $plugin->run();
}

// Start the plugin
run_myserv();
