/*! snp-component-scrollnav 0.0.1 */
define(function(require, exports, module) {
  var Backbone, MixinBackbone, Model, ScrollNavPage, SuperView, common;
  common = require("common");
  Backbone = require("backbone");
  MixinBackbone = require("backbone-mixin");
  require("epoxy");
  SuperView = MixinBackbone(Backbone.Epoxy.View);
  Model = Backbone.Model.extend({
    defaults: {
      currentSection: ""
    }
  });
  return ScrollNavPage = SuperView.extend({
    template: "#ScrollNavPage",
    className: "scrollnav_page",
    rootUrl: "",
    __firstRouteResolved: false,
    __listenToScroll: true,
    __sections: null,
    initialize: function() {
      this.model = new Model;
      this.__sections = {};
      this.listenTo(this, "onShow", this.__onShow);
      return this.listenTo(this, "onClose", this.__onClose);
    },
    route: function(name) {
      var section;
      section = _.findWhere(this.__sections, {
        name: name
      });
      if (section != null) {
        this.__scrollTo(section);
      }
      return this.__firstRouteResolved = true;
    },
    getRoute: function(section) {
      var route;
      if (!section) {
        section = this.getSection();
      }
      if (!section) {
        return;
      }
      if (section.absRoute != null) {
        return section.absRoute;
      } else {
        route = section.route != null ? section.route : section.name;
        return "" + this.rootUrl + route;
      }
    },
    getSection: function() {
      var pos, section;
      pos = $(document).scrollTop();
      return section = this.__getSectionByPos(pos);
    },
    gotoSectionOffset: function(offset) {
      var nextSection, number, section;
      section = this.getSection();
      number = _.indexOf(this.__sections, section);
      nextSection = this.__sections[number + offset];
      if (nextSection != null) {
        return this.route(nextSection.name);
      }
    },
    __scrollTo: function(section) {
      var top;
      top = section.top;
      if (this.__firstRouteResolved) {
        this.__listenToScroll = false;
        return $("body").animate({
          scrollTop: top
        }, {
          duration: 1300,
          easing: "easeOutCubic",
          done: (function(_this) {
            return function() {
              _this.__listenToScroll = true;
              return _this.model.set("currentSection", section.name);
            };
          })(this)
        });
      } else {
        $(document).scrollTop(section.top);
        return this.model.set("currentSection", section.name);
      }
    },
    __onShow: function() {
      if (this.__onScrollBinded == null) {
        this.__onScrollBinded = _.bind(this.__onScroll, this);
      }
      if (this.__onResizeBinded == null) {
        this.__onResizeBinded = _.bind(this.__onResize, this);
      }
      this.__computeSectionsMap();
      this.__firstRouteResolved = false;
      ($(window)).on("scroll", this.__onScrollBinded);
      ($(window)).on("resize", this.__onResizeBinded);
      return ($(document)).on("load", this.__onResizeBinded);
    },
    __onClose: function() {
      return ($(window)).off("scroll", this.__onScrollBinded);
    },
    __onScroll: _.debounce((function() {
      var route, section;
      if (!this.__listenToScroll) {
        return;
      }
      section = this.getSection();
      if (!section) {
        return;
      }
      route = this.getRoute(section);
      this.model.set("currentSection", section.name);
      if (section.navigate) {
        return common.router.navigate(route);
      }
    }), 20),
    __onResize: function() {
      return this.__computeSectionsMap();
    },
    __computeSectionsMap: function() {
      var bottom, el, name, r, section, top, view;
      this.__sections = (function() {
        var ref, results;
        ref = this.regions;
        results = [];
        for (name in ref) {
          r = ref[name];
          el = this.r[name].$el;
          view = this.r[name];
          top = el.position().top;
          bottom = top + el.outerHeight();
          section = {
            name: name,
            el: el,
            top: top,
            bottom: bottom,
            view: view
          };
          if (r.absRoute != null) {
            section.absRoute = r.absRoute;
          }
          if (r.route != null) {
            section.route = r.route;
          }
          section.navigate = true;
          if (r.navigate != null) {
            section.navigate = r.navigate;
          }
          results.push(section);
        }
        return results;
      }).call(this);
      return this.__sections = _.sortBy(this.__sections, "top");
    },
    __getSectionByPos: function(pos) {
      var i, len, ref, s;
      pos += $(window).height() / 2;
      ref = this.__sections;
      for (i = 0, len = ref.length; i < len; i++) {
        s = ref[i];
        if ((s.top < pos && pos < s.bottom)) {
          return s;
        }
      }
    }
  });
});
