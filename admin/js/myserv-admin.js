(function($) {
    'use strict';

    /**
     * Admin JavaScript
     */
    $(document).ready(function() {
        // Handle provider approval
        $('.myserv-approve-provider').on('click', function(e) {
            e.preventDefault();
            var providerId = $(this).data('provider-id');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'myserv_approve_provider',
                    provider_id: providerId,
                    nonce: myservAdmin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        location.reload();
                    } else {
                        alert(response.data.message);
                    }
                }
            });
        });

        // Handle subscription plan changes
        $('#myserv-subscription-plan').on('change', function() {
            var planType = $(this).val();
            $('.myserv-plan-details').hide();
            $('#myserv-plan-' + planType).show();
        });

        // Initialize settings tabs
        $('.myserv-settings-tab').on('click', function(e) {
            e.preventDefault();
            var target = $(this).attr('href');
            
            $('.myserv-settings-tab').removeClass('nav-tab-active');
            $(this).addClass('nav-tab-active');
            
            $('.myserv-settings-content').hide();
            $(target).show();
        });
    });

})(jQuery);
