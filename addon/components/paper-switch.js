import Ember from 'ember';
import BaseFocusable from './base-focusable';
import RippleMixin from 'ember-paper/mixins/ripple-mixin';
import ProxiableMixin from 'ember-paper/mixins/proxiable-mixin';
import ColorMixin from 'ember-paper/mixins/color-mixin';
const {
  assert,
  computed,
  run,
  String: {
    htmlSafe
  }
} = Ember;
/* global Hammer */

export default BaseFocusable.extend(RippleMixin, ProxiableMixin, ColorMixin, {
  tagName: 'md-switch',
  classNames: ['paper-switch', 'md-default-theme'],
  classNameBindings: ['checked:md-checked', 'dragging:md-dragging'],
  toggle: true,

  /* Ripple Overrides */
  rippleContainerSelector: '.md-thumb',
  center: true,
  dimBackground: false,
  fitRipple: true,

  checked: false,
  disabled: false,
  dragging: false,

  thumbContainerStyle: computed('dragging', 'dragAmount', function() {
    if (!this.get('dragging')) {
      return htmlSafe('');
    }

    let percent = this.get('dragAmount');
    let translate = Math.max(0, Math.min(1, percent));
    let transformProp = `translate3d(${100 * translate}%, 0, 0)`;

    return htmlSafe(`transform: ${transformProp};-webkit-transform: ${transformProp}`);
  }),

  didInsertElement() {
    this._super(...arguments);

    // Only setup if the switch is not disabled
    if (!this.get('disabled')) {
      this._setupSwitch();
    }
  },

  didInitAttrs() {
    this._super(...arguments);
    assert('{{paper-switch}} requires an `onchange` function', this.get('onchange') && typeof this.get('onchange') === 'function');
  },

  willDestroyElement() {
    this._super(...arguments);
    this._teardownSwitch();
  },

  didUpdateAttrs() {
    this._super(...arguments);

    if (!this.get('disabled') && !this._switchContainerHammer) {
      this._setupSwitch();
    } else if (!this.get('disabled') && this._switchContainerHammer) {
      this._switchContainerHammer.set({ enable: true });
    } else if (this.get('disabled') && this._switchContainerHammer) {
      this._switchContainerHammer.set({ enable: false });
    }
  },

  _setupSwitch() {
    this.set('switchWidth', this.$('.md-bar').width());

    // Enable dragging the switch
    let switchContainer = this.$('.md-container').get(0);
    let switchContainerHammer = new Hammer(switchContainer);
    this._switchContainerHammer = switchContainerHammer;
    switchContainerHammer.get('pan').set({ threshold: 1 });
    switchContainerHammer.on('panstart', run.bind(this, this._dragStart));
    switchContainerHammer.on('panmove', run.bind(this, this._drag));
    switchContainerHammer.on('panend', run.bind(this, this._dragEnd));

    let switchHammer = new Hammer(this.element);
    this._switchHammer = switchHammer;
    switchHammer.on('tap', run.bind(this, this._dragEnd));
  },

  _teardownSwitch() {
    if (this._switchContainerHammer) {
      this._switchContainerHammer.destroy();
    }

    if (this._switchHammer) {
      this._switchHammer.destroy();
    }
  },

  _dragStart() {
    this.set('dragging', true);
  },

  _drag(event) {
    if (!this.get('disabled')) {
      // Get the amount the switch has been dragged
      let percent = event.deltaX / this.get('switchWidth');
      percent = this.get('checked') ? 1 + percent : percent;
      this.set('dragAmount', percent);
    }
  },

  _dragEnd(ev) {
    if (!this.get('disabled')) {
      let checked = this.get('checked');
      let dragAmount = this.get('dragAmount');

      if ((!this.get('dragging')) ||
           (checked && dragAmount < 0.5) ||
           (!checked && dragAmount > 0.5)) {
        this.get('onchange')(!checked);
        console.log('paper-switch', !checked);
      }
      this.set('dragging', false);
      this.set('dragAmount', null);
      ev.srcEvent.stopImmediatePropagation();
      ev.srcEvent.stopPropagation();
    }
  },

  processProxy() {
    this.get('onchange')(!this.get('checked'));
  }

});
