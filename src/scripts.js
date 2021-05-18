$(document).ready(function(){
    /*Profile toggle*/
    $('.options__profile').click(function(e) {
        e.preventDefault();
        $('.submenu').toggle('slow');
        $('.options__profile').toggleClass('active');
    });


    /*Investmets bar*/
    (function($) {
        var max=$('.investments-bar__max').text(),
            bar=$('.investments-bar__value').text(),
            part=parseFloat(bar.replace(",","").replace(/[^0-9.]/gim, ""))/parseFloat(max.replace(",","").replace(/[^0-9.]/gim, "")),
            right=(100-part*100),
            bp=part*(parseFloat($('.investments-bar__full').width()));
        $('.investments-bar__value').css('margin-right', right+'%');
        $('.investments-bar__full').css('background-position-x', bp+'px')
    })(jQuery);

    /*closeBlock*/
    var close = $(".close__button");
    close.click(function(e){
        e.preventDefault();
        var block = $(this).attr('data-close');
        $(block).hide('slow');
    });

    /*showBlock*/
    var show = $(".show__button");
    show.click(function(e){
        e.preventDefault();
        var block = $(this).attr('data-show');
        $(block).show('slow');
        $(this).hide();
    });


    /*scrollbar width*/
    function returnScrollWidth() {
        var div = document.createElement('div');

        div.style.overflowY = 'scroll';
        div.style.width = '50px';
        div.style.height = '50px';
        div.style.visibility = 'hidden';

        document.body.appendChild(div);
        scrollWidth = div.offsetWidth - div.clientWidth;
        document.body.removeChild(div);

        return scrollWidth;
    }
    /*Modals*/
    var modal;
    var modalOverlay = $("#modal-overlay");
    var closeButton = $(".close-button");
    var openButton = $('.modal-open');
    var topPos="null";
    var modaltoggle=function(modal) {
        var offset = $(window).scrollTop();
        modal.css({
            //'top': offset+'px'
        });
        var heightModal = modal.find('.modal-guts').eq(0).height();
        topPos = $(window).scrollTop();

        modalOverlay.addClass('active');
        modal.addClass('active');
        $('body').css('padding-right', returnScrollWidth());
        $('body, html').css('overflow', 'hidden');
        modal.find('.modal-guts').eq(0).focus();

    };
    var modalclose=function(modal) {
        modal.removeClass('active');
        modalOverlay.removeClass('active');
        $('body').css('padding-right', 0);
        $('html, body').css('overflow', 'visible');
        $(window).scrollTop(topPos);

    };
    closeButton.click(function() {
        var modal=$(this).closest('.modal');
        modalclose(modal);
    });
    modalOverlay.click(function() {
        var modal=$(this).siblings('.modal:visible');
        modalclose(modal);

    });

    openButton.click(function(e) {
        e.preventDefault();
        var modal=$(this).attr('data-modal');
        modaltoggle($(modal));
    });
    $('.modal-close').click(function(e) {
        var modal=$(this).closest('.modal');
        modal.removeClass('active')
    });
});
$(window).on("load", function(){
    if (($(window).width() <= "425")&&($("td").length)) {
        $('td').each(function () {
            var title = $(this).attr("data-title");
            if (title !== undefined && title !== false)
                $(this).prepend("<strong>"+title + ": </strong>");
        });
    }
});