$(function () {
    window.cookieconsent.initialise({
        "palette": {
            "popup": {
                "background": "#383b75"
            },
            "button": {
                "background": "#f1d600"
            }
        },
        "position": "bottom-right",
        "type": "opt-out",
        "content": {
            "message": "Ironically this site only uses cookies to remember you've read this message about cookies, and to remember your login.",
            "link": "Privacy Policy",
            "href": "/app/static/docs/privacy-policy.pdf"
        }
    });

    $('.ui.message').transition('fade down').transition({
        animation: 'fade down',
        interval: '5000'
    });
});