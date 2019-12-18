function checkSendStatus(eid) {
    $.get('/admin/api/check_email_send?eid=' + eid, function (r) {
        if (r['status'] === "processing") {
            $emailprogress.progress('set progress', r['emails-sent']);

            setTimeout(function () {
                checkSendStatus(eid)
            }, 500);
        } else if (r['status'] === "complete") {
            $('.ui.form.send-newsletter')
                .removeClass('loading')
                .addClass('success');
            $emailprogress.progress('complete');

            setTimeout(function () {
                $('.ui.container.email-progress').transition('fade')
            }, 3000);
        } else if(r['status'] === "failed") {
            $emailprogress.progress('set error', 'Sent {value} of {total} emails', true);

            $('.ui.segment.notifications').append(`
                <div class="ui icon negative message">
                    <i class="exclamation circle icon"></i>
                    <div class="content">
                        <div class="header">Email Sending Failed</div>
                        <p>There was an issue sending the emails, and they may not have all sent</p>
                    </div>
                </div>
            `)
        }
    });
}

$('.ui.accordion').accordion();

let $emailprogress = $('.ui.progress.emails-sent');

$('.ui.button.send-emails').on('click', () => {
    let _obj = {};
    _obj['subject'] = $('#subject').val();
    _obj['body'] = $('#body').val();
    let data = {data: JSON.stringify(_obj)};

    $('.ui.form.send-newsletter').addClass('loading');
    $('.ui.container.email-progress').show();

    $.ajax({
        url: '/admin/api/send_update_email',
        data: data,
        type: 'POST',
        success: function (r) {
            $emailprogress.progress({
                text: {
                  active  : 'Sent {value} of {total} emails',
                  success : '{total} sent!'
                },
                total: r['total'],
                value: r['emails-sent'],
            });

            $('.ui.form.send-newsletter').form('clear');
            checkSendStatus(r['event-id']);
        }
    });
});

$('#pokemon-list').dropdown({
    placeholder: 'Select Pokemon',
    apiSettings: {
        url: `/admin/api/pokemon/get?q={query}`,
        cache: false,
    }
});

$('.ui.button.update-pokemon').on('click', function() {
    let _obj = {};
    _obj['type'] = $(this).data("type");
    _obj['value'] = $(this).data("value");
    _obj['pokemon'] = $('#pokemon').val();
    let data = {data: JSON.stringify(_obj)};

    console.log(data);

    $.ajax({
        url: '/admin/api/pokemon/update',
        data: data,
        type: 'POST',
        success: function (r) {

        }
    });
});
