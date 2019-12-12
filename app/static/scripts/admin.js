$('.ui.button.send-emails').on('click', () => {
    $('.ui.button.send-emails').addClass('loading');

    $.ajax({
        url: `/admin/api/send_update_email`,
        method: 'POST',
        async: true,
        timeout: 0,
        success: function (r) {
            $('.ui.button.send-emails').hide();
            $('.ui.segment.notifications').append(`
                <div class="ui icon positive message">
                  <i class="inbox icon"></i>
                  <div class="content">
                    <div class="header">Emails Sent</div>
                    <p>${r["email-count"]} emails were sent successfully</p>
                  </div>
                </div>
            `)
        },
        error: function (e) {
            console.log(e.status);
            $('.ui.button.send-emails').removeClass('loading');
            $('.ui.segment.notifications').append(`
                <div class="ui icon negative message">
                  <i class="close icon"></i>
                  <div class="content">
                    <div class="header">Email Sending Failed</div>
                    <p>There was an issue sending the emails, and they may not have all sent</p>
                  </div>
                </div>
            `)
        }
    }).then(() => {})
});