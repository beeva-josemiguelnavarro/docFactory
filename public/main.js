$(document).ready(function () {

    var snippets = document.querySelectorAll('.parsingContainer');

    $(snippets).prepend('<button class="btn copy-clipboard" data-clipboard-snippet alt="Copy to clipboard">Copy to clipboard</button>');

    var clipboardSnippets = new Clipboard('[data-clipboard-snippet]', {
        target: function(trigger) {
            return trigger.nextElementSibling;
        }
    });
    clipboardSnippets.on('success', function(e) {
        e.clearSelection();
        //showTooltip(e.trigger, 'Copied!');
    });

    clipboardSnippets.on('error', function(e) {
        //showTooltip(e.trigger, fallbackMessage(e.action));
    });
});