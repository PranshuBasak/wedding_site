"use strict";!function(o){var e=".hero__video";o(document).on("click tap",".hero__down",(function(){var e,t=(null===(e=o(".hero"))||void 0===e||null===(e=e.next())||void 0===e||null===(e=e.offset())||void 0===e?void 0:e.top)+50,n=o(".hero__container").offset().top;o("body, html").stop().animate({scrollTop:t||n},500,"swing")})),o(window).bind("scroll",(function(){o(document).scrollTop()>=50?o("body").addClass("hero-scroll"):o("body").removeClass("hero-scroll")})),o(document).on("click tap",".hero__toggle",(function(){var t=o(this);t.hasClass("active")?(t.removeClass("active"),document.querySelector(e).play()):(t.addClass("active"),document.querySelector(e).pause())})),o(document).on("click tap",".hero__sticky-link",(function(e){var t=o(this).attr("href");if("#"===t.substring(0,1)){var n=document.querySelector(t);if(n){e.preventDefault();var r=n.getBoundingClientRect().top+window.pageYOffset-190;window.scrollTo({top:r,behavior:"smooth"})}}}))}(jQuery);