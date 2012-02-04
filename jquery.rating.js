/******************************************************************************
  Rating jQuery UI Widget

  This plugin should provide a simple way to convert elements (DIV, SELECT and RANGE)
  to an interactive rating mechanism. Fully customizable via CSS. Degrades gracefully
  to regular HTML elements.

  DEPENDENCIES
  * jQuery 1.4.2+
  * jQuery UI 1.8.7+ (Core + Widget Factory)

  Author:   Mina Mikhail (@fightingtheboss)
  Code:     http://github.com/fightingtheboss/jquery-ui-rating

  Based on: http://rateit.codeplex.com (@gjunge)
            http://www.fyneworks.com/jquery/star-rating/

  Default icons: famfamfam.com

******************************************************************************/

(function($) {
  $.widget('ui.rating', {
    options: {
      min: 0,
      max: 5,
      step: 0.5,
      resetable: true,
      readOnly: false,
      showText: true,
      starWidth: 16,
      starHeight: 16
    },

    _create: function() {
      // First time setup for widget
      // Initialize the plugin
      var self = this,
          node = this.element[0],
          nodeParams = {};

      this.options.ltr = this.element.css('direction') != 'rtl';

      // Are we attached to a range input?
      // (Range inputs are rendered as text input in all browsers that don't support range.)
      if ( node.nodeName == "INPUT" && ( node.type == "range" || node.type == "text" ) ) {
        nodeParams = {
          min: parseInt(this.element.attr('min'), 10) || this.options.min,
          max: parseInt(this.element.attr('max'), 10) || this.options.max,
          step: parseInt(this.element.attr('step'), 10) || this.options.step,
          value: this.element.val()
        };
      }

      // Are we attached to a select input?
      else if ( node.nodeName == "SELECT" && node.options.length > 1 ) {
        nodeParams = {
          min: parseInt(node.options[0].value, 10),
          max: parseInt(node.options[node.options.length - 1].value, 10),
          step: parseInt(node.options[1].value - node.options[0].value, 10),
          value: this.element.val()
        };
      }

      // Update the options based on the actual control we're binding to
      // This will override user-provided options in favour of the values on the source control
      $.extend( this.options, nodeParams );

      //Create the needed tags.
      this.element
        .wrap( $('<div></div>', { 'class': 'rating' }) )
        .after( $('<div></div>', { 'class': 'rating-reset' }) )
        .after(
          $('<div></div>', { 'class': 'rating-range' })
            .append( $('<div></div>', { 'class': 'rating-selected' }).css( 'height', this.options.starHeight + 'px' ) )
            .append( $('<div></div>', { 'class': 'rating-hover' }).css( 'height', this.options.starHeight + 'px' ) ) )
        .after( $('<div></div>', { 'class': 'rating-text' }) );

      this.element.hide();

      // Store references to frequently used elements
      this.container = this.element.parent();
      this.range = $('.rating-range', this.container);
      this.selected = $('.rating-selected', this.container);
      this.hover = $('.rating-hover', this.container);
      this.text = $('.rating-text', this.container);
      this.reset = $('.rating-reset', this.container);

      //if we are in RTL mode, we have to change the float of the "reset button"
      if ( !this.options.ltr ) {
        this.reset.css('float', 'right');
        this.text.css('float', 'left');
        this.selected.addClass('rating-selected-rtl');
        this.hover.addClass('rating-hover-rtl');
      }

      // Set the correct width on the rating area
      this.range.width( this.options.starWidth * ( this.options.max - this.options.min) ).height( this.options.starHeight );

      // Set the rating if it's available
      if ( this.options.value ) {
        this.selected.width( (this.options.value - this.options.min) * this.options.starWidth );
        this.text.text( this.options.value );
      }

      if ( !this.options.showText ) {
        this.text.hide();
      }

      if ( !this.options.readOnly ) {
        this._reset( this.options.resetable );

        this.range
          .bind( 'mousemove.rating', function( e ) {
            self._hover( e );
          })
          .bind( 'mouseleave.rating', function( e ) {
            self._blur( e );
          })
          .bind( 'click.rating', function( e ) {
            self.rate( null, e );
          });
      } else {
        this.reset.hide();
      }

      this._trigger("create");
    },

    _init: function() {
      // Called every time the widget is called without params
      this._trigger("init");
    },

    _setOption: function( key, value ) {
      // Allows the user to set options after the widget has been instantiated
      var oldValue = this.options[key];

      switch( key ) {
        case 'readonly':
          // Toggle readonly and update the control
          if ( value === true ) {
            this.range.unbind('.rating');
            this.reset.hide();
          } else {
            this._reset( this.options.resetable );
          }
        break;

        case 'value':
          // Set the value of the control and update the stars
          this.rate( value );
        break;
      }

      $.Widget.prototype._setOption.apply( this, arguments );

      // The widget factory doesn't fire a callback for option changes by default
      // In order to allow the user to respond, fire our own callback
      this._trigger("setOption", { type: "setOption" }, {
        option: key,
        original: oldValue,
        current: value
      });
    },

    _hover: function( event ) {
      var self = this,
          offsetX = event.pageX - self.range.offset().left;

      if ( !this.options.ltr ) offsetX = self.range.width() - offsetX;

      var w = Math.ceil( offsetX / self.options.starWidth * (1 / self.options.step) ) * self.options.starWidth * self.options.step;

      if ( self.options.hoverWidth != w ) {
          self.selected.hide();
          self.hover.width(w).show();
          self.options.hoverWidth = w;
      }
    },

    _blur: function( event ) {
      this.hover.hide().width(0);
      this.selected.show();
    },

    rate: function( rating, event ) {
      var self = this,
          oldRating = self.options.value,
          numerator = 0;

      if ( rating === null ) {
        offsetX = event.pageX - self.range.offset().left;

        if ( !this.options.ltr ) numerator = self.range.width() - offsetX;
        numerator = offsetX / self.options.starWidth;
      } else {
        // Set the rating directly
        numerator = rating;
      }

      var value = Math.ceil( numerator / self.options.step ),
          normalizedValue = (value * self.options.step) + self.options.min,
          widthValue = value * self.options.starWidth * self.options.step;

      if ( rating === null ) rating = normalizedValue;

      self.options.value = rating;
      self.element.val( rating );
      self.text.text(rating);
      self.hover.hide();
      self.selected.width( widthValue ).show();

      self._trigger('rate', event, {
        previous: oldRating,
        current: rating
      });
    },

    _reset: function( resetable ) {
      var self = this;

      if ( resetable ) {
        this.reset.bind( 'click.rating', function( e ) {
          self.clear( e );
        });
      } else {
        this.reset.hide();
      }
    },

    clear: function( event ) {
      var self = this;

      self.options.value = self.options.min;
      self.element.val( self.options.min );
      self.selected.width(0).show();
      self.hover.hide().width(0);
      self.text.text( self.options.min );

      self._trigger('clear', event );
    },

    destroy: function() {
      // Removes all traces of the widget from the page
      this.range.remove();
      this.reset.remove();
      this.text.remove();
      this.element.unwrap( '.rating' );
      this.element.unbind( '.rating' );
      this.element.show();

      $.Widget.prototype.destroy.apply( this );

      this._trigger( 'destroy', { type: 'destroy' }, { options: this.options } );
    }
  });
})(jQuery);
