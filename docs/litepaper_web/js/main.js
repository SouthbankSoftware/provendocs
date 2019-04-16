(function () {
  // iPad and iPod detection
  const isiPad = function () {
    return navigator.platform.indexOf('iPad') != -1;
  };

  const isiPhone = function () {
    return navigator.platform.indexOf('iPhone') != -1 || navigator.platform.indexOf('iPod') != -1;
  };

  // OffCanvass
  const offCanvass = function () {
    $('body').on('click', '.js-fh5co-nav-toggle', function (event) {
      const $this = $(this);

      $('#fh5co-offcanvass').toggleClass('fh5co-awake');
      $('#fh5co-page, #fh5co-menu').toggleClass('fh5co-sleep');

      if ($('#fh5co-offcanvass').hasClass('fh5co-awake')) {
        $this.addClass('active');
      } else {
        $this.removeClass('active');
      }
      event.preventDefault();
    });
  };

  // Single Page Nav
  const clickMenu = function () {
    $('a:not([class="external"])').click(function () {
      const section = $(this).data('nav-section');
      $('html, body').animate(
        {
          scrollTop: $(`[data-section="${section}"]`).offset().top,
        },
        500,
      );
      return false;
    });
  };

  // Owl Carousel
  const carouselTestimony = function () {
    const owl = $('.owl-carousel');

    owl.owlCarousel({
      items: 1,
      margin: 0,
      responsiveClass: true,
      loop: true,
      nav: true,
      dots: true,
      autoplay: true,
      smartSpeed: 500,
      responsive: {
        0: {
          nav: false,
        },
        480: {
          nav: false,
        },
        768: {
          nav: false,
        },
        1000: {
          nav: true,
        },
      },
      navText: [
        "<i class='icon-arrow-left owl-direction'></i>",
        "<i class='icon-arrow-right owl-direction'></i>",
      ],
    });
  };

  const footerFixed = function () {
    const fh = $('#fh5co-footer').innerHeight();
    $('#fh5co-wrap').css({
      marginBottom: `${fh}px`,
    });

    if ($(window).width() < 991) {
      $('#fh5co-wrap').css({
        marginBottom: '',
      });
    }

    $(window).resize(() => {
      const fh = $('#fh5co-footer').innerHeight();
      $('#fh5co-wrap').css({
        marginBottom: `${fh}px`,
      });

      if ($(window).width() < 991) {
        $('#fh5co-wrap').css({
          marginBottom: '',
        });
      }
    });
  };

  // Counter
  const counter = function () {
    $('.js-counter').countTo({
      formatter(value, options) {
        return value.toFixed(options.decimals);
      },
    });
  };

  //  Faqs Accordion
  const faqsAccordion = function () {
    const faqAcc = $('.slide-accordion h3');

    // Click
    faqAcc.on('click', function (event) {
      const $this = $(this);

      $('.slide-accordion').removeClass('active');
      $('.slide-accordion')
        .find('.slide-body')
        .slideUp(400, 'easeInOutExpo');

      if (
        !$this
          .closest('.slide-accordion')
          .find('.slide-body')
          .is(':visible')
      ) {
        $this.closest('.slide-accordion').addClass('active');
        $this
          .closest('.slide-accordion')
          .find('.slide-body')
          .addClass('open');
        $this
          .closest('.slide-accordion')
          .find('.slide-body')
          .slideDown(400, 'easeInOutExpo');
      } else {
        $this.closest('.slide-accordion').removeClass('active');
        $this
          .closest('.slide-accordion')
          .find('.slide-body')
          .removeClass('open');
        $this
          .closest('.slide-accordion')
          .find('.slide-body')
          .slideUp(400, 'easeInOutExpo');
      }

      setTimeout(() => {
        // alert($this.closest('.slide-accordion.active').innerHeight());
        $('html, body').animate(
          {
            scrollTop: $this.closest('.slide-accordion.active').offset().top - 90,
          },
          500,
        );
      }, 700);

      event.preventDefault();
      return false;
    });
  };

  // Click outside of offcanvass
  const mobileMenuOutsideClick = function () {
    $(document).click((e) => {
      const container = $('#fh5co-offcanvass, .js-fh5co-nav-toggle');
      if (!container.is(e.target) && container.has(e.target).length === 0) {
        if ($('#fh5co-offcanvass').hasClass('fh5co-awake')) {
          $('#fh5co-offcanvass').removeClass('fh5co-awake');
          $('#fh5co-page, #fh5co-menu').removeClass('fh5co-sleep');

          $('.js-fh5co-nav-toggle').removeClass('active');
        }
      }
    });

    $(window).scroll(() => {
      const $menu = $('#fh5co-menu');
      if ($(window).scrollTop() > 150) {
        $menu.addClass('sleep');
      }

      if ($(window).scrollTop() < 500) {
        $menu.removeClass('sleep');
        $('#fh5co-offcanvass ul li').removeClass('active');
        $('#fh5co-offcanvass ul li')
          .first()
          .addClass('active');
      }

      if ($(window).scrollTop() > 500) {
        if ($('#fh5co-offcanvass').hasClass('fh5co-awake')) {
          $('#fh5co-offcanvass').removeClass('fh5co-awake');
          $('#fh5co-page, #fh5co-menu').removeClass('fh5co-sleep');

          $('.js-fh5co-nav-toggle').removeClass('active');
        }
      }
    });
  };

  // Magnific Popup

  const magnifPopup = function () {
    $('.image-popup').magnificPopup({
      type: 'image',
      removalDelay: 300,
      mainClass: 'mfp-with-zoom',
      titleSrc: 'title',
      gallery: {
        enabled: true,
      },
      zoom: {
        enabled: true, // By default it's false, so don't forget to enable it

        duration: 300, // duration of the effect, in milliseconds
        easing: 'ease-in-out', // CSS transition easing function

        // The "opener" function should return the element from which popup will be zoomed in
        // and to which popup will be scaled down
        // By defailt it looks for an image tag:
        opener(openerElement) {
          // openerElement is the element on which popup was initialized, in this case its <a> tag
          // you don't need to add "opener" option if this code matches your needs, it's defailt one.
          return openerElement.is('img') ? openerElement : openerElement.find('img');
        },
      },
    });
  };

  // Scroll Animations

  // Intro Animate
  const introWayPoint = function () {
    if ($('#fh5co-hero').length > 0) {
      $('#fh5co-hero').waypoint(
        function (direction) {
          if (direction === 'down' && !$(this).hasClass('animated')) {
            setTimeout(() => {
              $('.intro-animate-1').addClass('fadeInUp animated');
            }, 100);
            setTimeout(() => {
              $('.intro-animate-2').addClass('fadeInUp animated');
            }, 400);
            setTimeout(() => {
              $('.intro-animate-3').addClass('fadeInUp animated');
              $('.intro-animate-4').addClass('fadeInUp animated');
            }, 700);

            $(this.element).addClass('animated');
          }
        },
        { offset: '75%' },
      );
    }
  };

  const HeaderToggle = function () {
    const $this = $('#fh5co-main');

    $this.waypoint(
      (direction) => {
        if (direction === 'down') {
          $('body').addClass('scrolled');
        } else if (direction === 'up') {
          $('body').removeClass('scrolled');
        }
      },
      { offset: '-1px' },
    );
  };

  // Client Animate
  const clientAnimate = function () {
    if ($('#fh5co-clients').length > 0) {
      $('#fh5co-clients .to-animate').each(function (k) {
        const el = $(this);

        setTimeout(
          () => {
            el.addClass('fadeIn animated');
          },
          k * 200,
          'easeInOutExpo',
        );
      });
    }
  };
  const clientWayPoint = function () {
    if ($('#fh5co-clients').length > 0) {
      $('#fh5co-clients').waypoint(
        function (direction) {
          if (direction === 'down' && !$(this).hasClass('animated')) {
            setTimeout(clientAnimate, 100);

            $(this.element).addClass('animated');
          }
        },
        { offset: '75%' },
      );
    }
  };

  // Features Animate
  const featuresAnimate = function () {
    if ($('#fh5co-features').length > 0) {
      $('#fh5co-features .to-animate').each(function (k) {
        const el = $(this);

        setTimeout(
          () => {
            el.addClass('fadeInUp animated');
          },
          k * 200,
          'easeInOutExpo',
        );
      });
    }
  };
  const featuresWayPoint = function () {
    if ($('#fh5co-features').length > 0) {
      $('#fh5co-features').waypoint(
        function (direction) {
          if (direction === 'down' && !$(this).hasClass('animated')) {
            setTimeout(featuresAnimate, 100);

            $(this.element).addClass('animated');
          }
        },
        { offset: '75%' },
      );
    }
  };

  // Features 2 Animate
  const features2AnimateTitle = function () {
    if ($('#fh5co-features-2').length > 0) {
      $('#fh5co-features-2 .to-animate').each(function (k) {
        const el = $(this);

        setTimeout(
          () => {
            el.addClass('fadeIn animated');
          },
          k * 200,
          'easeInOutExpo',
        );
      });
    }
  };
  const features2WayPoint = function () {
    if ($('#fh5co-features-2').length > 0) {
      $('#fh5co-features-2').waypoint(
        function (direction) {
          if (direction === 'down' && !$(this).hasClass('animated')) {
            setTimeout(features2AnimateTitle, 100);

            setTimeout(() => {
              $('.features-2-animate-2').addClass('fadeInUp animated');
            }, 800);

            setTimeout(() => {
              $('.features-2-animate-3').addClass('fadeInRight animated');
              $('.features-2-animate-5').addClass('fadeInLeft animated');
            }, 1200);
            setTimeout(() => {
              $('.features-2-animate-4').addClass('fadeInRight animated');
              $('.features-2-animate-6').addClass('fadeInLeft animated');
            }, 1400);

            $(this.element).addClass('animated');
          }
        },
        { offset: '75%' },
      );
    }
  };

  const counterWayPoint = function () {
    if ($('#fh5co-counter').length > 0) {
      $('#fh5co-counter').waypoint(
        function (direction) {
          if (direction === 'down' && !$(this).hasClass('animated')) {
            setTimeout(() => {
              $('.counter-animate').addClass('fadeInUp animated');
              counter();
            }, 100);

            $(this.element).addClass('animated');
          }
        },
        { offset: '75%' },
      );
    }
  };

  // Products Animate
  const productsAnimate = function () {
    if ($('#fh5co-products').length > 0) {
      $('#fh5co-products .to-animate').each(function (k) {
        const el = $(this);

        setTimeout(
          () => {
            el.addClass('fadeInUp animated');
          },
          k * 200,
          'easeInOutExpo',
        );
      });
    }
  };
  const productsWayPoint = function () {
    if ($('#fh5co-products').length > 0) {
      $('#fh5co-products').waypoint(
        function (direction) {
          if (direction === 'down' && !$(this).hasClass('animated')) {
            setTimeout(() => {
              $('.product-animate-1').addClass('fadeIn animated');
            }, 200);

            setTimeout(() => {
              $('.product-animate-2').addClass('fadeIn animated');
            }, 400);

            setTimeout(productsAnimate, 800);

            $(this.element).addClass('animated');
          }
        },
        { offset: '75%' },
      );
    }
  };

  // Call To Actions Animate
  const ctaAnimate = function () {
    if ($('#fh5co-cta').length > 0) {
      $('#fh5co-cta .to-animate').each(function (k) {
        const el = $(this);

        setTimeout(
          () => {
            el.addClass('fadeInUp animated');
          },
          k * 200,
          'easeInOutExpo',
        );
      });
    }
  };
  const ctaWayPoint = function () {
    if ($('#fh5co-cta').length > 0) {
      $('#fh5co-cta').waypoint(
        function (direction) {
          if (direction === 'down' && !$(this).hasClass('animated')) {
            setTimeout(ctaAnimate, 100);

            $(this.element).addClass('animated');
          }
        },
        { offset: '75%' },
      );
    }
  };

  // Pricing Animate
  const pricingAnimate = function () {
    if ($('#fh5co-pricing').length > 0) {
      $('#fh5co-pricing .to-animate').each(function (k) {
        const el = $(this);

        setTimeout(
          () => {
            el.addClass('fadeInUp animated');
          },
          k * 200,
          'easeInOutExpo',
        );
      });
    }
  };
  const pricingWayPoint = function () {
    if ($('#fh5co-pricing').length > 0) {
      $('#fh5co-pricing').waypoint(
        function (direction) {
          if (direction === 'down' && !$(this).hasClass('animated')) {
            setTimeout(() => {
              $('.pricing-animate-1').addClass('fadeInUp animated');
            }, 100);
            setTimeout(() => {
              $('.pricing-animate-2').addClass('fadeInUp animated');
            }, 400);

            setTimeout(pricingAnimate, 800);

            $(this.element).addClass('animated');
          }
        },
        { offset: '75%' },
      );
    }
  };

  // Features 3 Animate
  const features3Animate = function () {
    if ($('#fh5co-features-3').length > 0) {
      $('#fh5co-features-3 .to-animate').each(function (k) {
        const el = $(this);

        setTimeout(
          () => {
            el.addClass('fadeInUp animated');
          },
          k * 200,
          'easeInOutExpo',
        );
      });
    }
  };
  const features3WayPoint = function () {
    if ($('#fh5co-features-3').length > 0) {
      $('#fh5co-features-3').waypoint(
        function (direction) {
          if (direction === 'down' && !$(this).hasClass('animated')) {
            setTimeout(() => {
              $('.features3-animate-1').addClass('fadeIn animated');
            }, 200);

            setTimeout(() => {
              $('.features3-animate-2').addClass('fadeIn animated');
            }, 400);

            setTimeout(features3Animate, 800);

            $(this.element).addClass('animated');
          }
        },
        { offset: '75%' },
      );
    }
  };

  // Features 3 Animate
  const faqsAnimate = function () {
    if ($('#fh5co-info').length > 0) {
      $('#fh5co-info .to-animate').each(function (k) {
        const el = $(this);

        setTimeout(
          () => {
            el.addClass('fadeInUp animated');
          },
          k * 200,
          'easeInOutExpo',
        );
      });
    }
  };
  const faqsWayPoint = function () {
    if ($('#fh5co-info').length > 0) {
      $('#fh5co-info').waypoint(
        function (direction) {
          if (direction === 'down' && !$(this).hasClass('animated')) {
            setTimeout(() => {
              $('.faqs-animate-1').addClass('fadeIn animated');
            }, 200);

            setTimeout(() => {
              $('.faqs-animate-2').addClass('fadeIn animated');
            }, 400);

            setTimeout(faqsAnimate, 800);

            $(this.element).addClass('animated');
          }
        },
        { offset: '75%' },
      );
    }
  };

  // animate-box
  const contentWayPoint = function () {
    $('.animate-box').waypoint(
      function (direction) {
        if (direction === 'down' && !$(this).hasClass('animated')) {
          $(this.element).addClass('fadeInUp animated');
        }
      },
      { offset: '75%' },
    );
  };

  // Reflect scrolling in navigation
  const navActive = function (section) {
    const el = $('#fh5co-offcanvass > ul');
    el.find('li').removeClass('active');
    el.each(function () {
      $(this)
        .find(`a[data-nav-section="${section}"]`)
        .closest('li')
        .addClass('active');
    });
  };
  const navigationSection = function () {
    const $section = $('div[data-section]');

    $section.waypoint(
      function (direction) {
        if (direction === 'down') {
          navActive($(this.element).data('section'));
        }
      },
      {
        offset: '150px',
      },
    );

    $section.waypoint(
      function (direction) {
        if (direction === 'up') {
          navActive($(this.element).data('section'));
        }
      },
      {
        offset() {
          return -$(this.element).height() + 155;
        },
      },
    );
  };

  // Document on load.
  $(() => {
    magnifPopup();
    offCanvass();
    mobileMenuOutsideClick();
    footerFixed();
    faqsAccordion();
    carouselTestimony();
    clickMenu();
    HeaderToggle();

    // Animations
    introWayPoint();
    clientWayPoint();
    featuresWayPoint();
    features2WayPoint();
    counterWayPoint();
    productsWayPoint();
    features3WayPoint();
    ctaWayPoint();
    pricingWayPoint();
    faqsWayPoint();
    contentWayPoint();

    navigationSection();
  });
}());
