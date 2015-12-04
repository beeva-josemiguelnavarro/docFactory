$(document).ready(function () {
    //this variable is used to avoid check scroll when animating the navigation
    var automaticScroll = false;

    if ($('.api-documentation').length !== 0) {

        $('.genoa-footer').addClass('small-footer');
        $('.genoa-content').addClass('small-footer');
        window.scrollTo(0, window.pageYOffset - 1);
        //Set a class to the sidebar to extend the border to the end of the page when the list doesnt fill the height
        if($('#sidebar .nav-wrapper-scroll .nav').height() < $('#sidebar .nav-wrapper-scroll').height()){
            $('#sidebar .nav-wrapper-scroll .nav').addClass('nav-extend');
        }
        //Set resizer element centered in the page
        $('.resizer').css('top', ($('body').height() - ($('.portlet-breadcrumb .portlet').height() + parseInt($('.portlet-breadcrumb .portlet').css('padding-top')) + parseInt($('.portlet-breadcrumb .portlet').css('padding-bottom')) + $('.genoa-heading').height() + $('.size-controls').height()))/2 + $('.size-controls').height());

        //On resize window, position the resizer always centered in the page
        $( window ).resize(function() {
            $('.resizer').css('top', ($('body').height() - ($('.portlet-breadcrumb .portlet').height() + parseInt($('.portlet-breadcrumb .portlet').css('padding-top')) + parseInt($('.portlet-breadcrumb .portlet').css('padding-bottom')) + $('.genoa-heading').height() + $('.size-controls').height()))/2 + $('.size-controls').height());
        });

        //On scroll window, position the resizer always centered in the page
        $( window ).scroll(function() {
            $('.resizer').css('top', ($('body').height() - 210)/2 + $('.size-controls').height());
        });


        $('.resizer').click(function () {

            if ($('#api-doc.api-doc--example-expanded').length === 0) {

                $('.api__documentation').css('opacity','0');
                $('.api__example > *').css('opacity','0');

                $('.resizer').addClass('resizer--displayed-content');
                $('.resizer__arrow').addClass('resizer__arrow--displayed-content');
                $('#api-doc').addClass('api-doc--example-expanded');

                $('.nav__list__link--active').click();

                $('.api__example > *').css('opacity','1');

            }

            else {

                $('.api__documentation').css('opacity','0');
                $('.api__example > *').css('opacity','0');

                $('.resizer').removeClass('resizer--displayed-content');
                $('.resizer__arrow').removeClass('resizer__arrow--displayed-content');
                $('#api-doc').removeClass('api-doc--example-expanded');

                $('.nav__list__link--active').click();

                $('.api__documentation').css('opacity','1');
                $('.api__example > *').css('opacity','1');
            }

        });

        /**
         * This part causes smooth scrolling using scrollto.js
         * We target all a tags inside the nav, and apply the scrollto.js to it.
         */
        $(".nav__list__link").click(function (evn) {

            evn.preventDefault();

            if (document.documentElement.scrollTop === 0) {

                $('.genoa-heading').addClass('compact-head');
                $('.genoa-navbar').addClass('compact-navbar');
                $('.search-form').addClass('compact-search');
                $('.genoa-content').addClass('compact-content');
                $('.breadcrumb').closest('.portlet').addClass('compact-breadcrumb');

            }

            if ($(this.hash) !== undefined) {
                automaticScroll = true;
                $('html,body').animate(
                    {
                        scrollTop: $(this.hash).offset().top - 197
                    },
                    {
                        duration: 0,
                        complete: function() {
                            automaticScroll = false;
                        }
                    });
            }

            $('.nav__list__link--active').removeClass('nav__list__link--active');
            $(evn.target).addClass('nav__list__link--active');
        });


        /**
         * Handler the highlighting functionality on scroll.
         */
        var aChildren = $(".nav__list__item").children(); // find the a children of the list items
        var aArray = []; // create the empty aArray
        for (var i = 0; i < aChildren.length; i++) {
            if ($(aChildren[i]).hasClass('nav__list__link')) {
                aArray.push($(aChildren[i]).attr('href'));
            }
        }

        $(window).scroll(function () {
            if(!automaticScroll) {
                var windowPos = $(window).scrollTop(); // get the offset of the window from the top of page
                var windowHeight = $(window).height(); // get the height of the window
                var docHeight = $(document).height();

                if (windowPos + windowHeight == docHeight) {
                    if (!$("nav li:last-child a").hasClass("nav__list__link--active")) {
                        var navActiveCurrent = $(".nav__list__link--active").attr("href");
                        $("a[href='" + navActiveCurrent + "']").removeClass("nav__list__link--active");
                        $("nav li:last-child a").addClass("nav__list__link--active");
                    }
                } else {
                    for (var i = 0; i < aArray.length; i++) {
                        var theID = aArray[i];
                        if ($(theID).length !== 0) {
                            var divPos = $(theID).offset().top; // get the offset of the div from the top of page
                            var divHeight = $(theID).height(); // get the height of the div in question
                            if ((windowPos + 197) >= divPos && (windowPos + 197) < (divPos + divHeight)) {
                                $('.nav__list__link--active').removeClass("nav__list__link--active");
                                $("a[href='" + theID + "']").addClass("nav__list__link--active");
                                break;
                            }
                        }
                    }
                }
            }
        });


        function output(inp) {
            var content = $(document.createElement('div'));
            content.attr('class', 'example__json');
            content.append(inp);
            $('#example__json').append(content);
        }

        function syntaxHighlight(json) {
            json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                var cls = 'number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'key';
                    } else {
                        cls = 'string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'boolean';
                } else if (/null/.test(match)) {
                    cls = 'null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            });
        }

        //language Controls
        $('.language-controls__item[data-item]').click(function () {
            $('.language-controls__item[data-item]').removeClass('item-selected');
            $(this).addClass('item-selected');
            $('.language-controls--selected--text').text($(this).text());
            var lang = $(this).attr('data-item');
            $('.example__code-container').addClass('hidden');
            $('.example__code-container.' + lang).removeClass('hidden');
            $('html,body').animate({scrollTop: $($('.nav__list__link--active').attr('href')).offset().top - 197}, 0);
        });

        $('.language-controls--selected').click(function () {
            $(this).toggleClass('language-controls--displayed');
        });

        //Codes examples
        $('.example__status-code').click(function (event) {

            var code, codeContentClassName, codeContainer, codeContent;
            //Hide the responses containers
            $(event.target).closest('.example__status-codes').find('.example__info').addClass('hidden');
            $(event.target).closest('.example__status-codes-wrapper').find('.example__status-code').removeClass('example__status-code--selected');
            $(event.target).addClass('example__status-code--selected');

            //Show the response code information
            code = $(event.target).text();
            codeContentClassName = '.example__status-code__' + code;
            codeContainer = $(event.target).closest('.example__status-codes').find(codeContentClassName);
            codeContainer.removeClass('hidden');
            if(codeContainer.find('.no_parse').length > 0)
                codeContent = codeContainer.find('.example__json').text();
            else //it may be better to check if type of response is a type/text-plain or application/json, but still needed the try-catch
                try{ //ADDED try catch due to unexpected error parsing the JSON
                    codeContent = syntaxHighlight(JSON.stringify(JSON.parse(codeContainer.find('.example__json').text()), undefined, 4));
                }catch(e){
                    console.log('error parsing\n',codeContainer.find('.example__json').text());
                    codeContent = codeContainer.find('.example__json').text();
                }

            //Insert the code into the HTML
            $(event.target).closest('.example__status-codes').find('.example__json-container').html(codeContent);

        });

        setTimeout(function(){
            $('.example__status-codes-wrapper').each(function(){
                $(this).find('.example__status-code')[0].click();
            });
        },100);

    }
});