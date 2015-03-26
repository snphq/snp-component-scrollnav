define (require, exports, module)->
  common = require "common"
  Backbone = require "backbone"
  MixinBackbone = require "backbone-mixin"
  require "epoxy"

  SuperView = MixinBackbone(Backbone.Epoxy.View)

  Model = Backbone.Model.extend
    defaults:
      currentSection: ""

  ScrollNavPage = SuperView.extend
    template: "#ScrollNavPage"
    className: "scrollnav_page"

    rootUrl: ""

    __firstRouteResolved: false
    __listenToScroll: true
    __sections: null

    initialize: ->
      @model = new Model
      @__sections = {}
      @listenTo this, "onShow", @__onShow
      @listenTo this, "onClose", @__onClose

    route: (name)->
      section  = _.findWhere @__sections, {name}
      @__scrollTo section if section?
      @__firstRouteResolved = true

    getRoute: (section)->
      section = @getSection() unless section
      return unless section
      if section.absRoute?
        section.absRoute
      else
        route = if section.route? then section.route else section.name
        "#{@rootUrl}#{route}"

    getSection: ->
      pos = $(document).scrollTop()
      section = @__getSectionByPos pos

    gotoSectionOffset: (offset)->
      section = @getSection()
      number = _.indexOf @__sections, section
      nextSection = @__sections[number + offset]
      @route nextSection.name if nextSection?

    __scrollTo: (section)->
      top = section.top
      if @__firstRouteResolved
        @__listenToScroll = false
        $("body").animate {
          scrollTop: top
          },{
            duration: 1300
            easing: "easeOutCubic"
            done: =>
              @__listenToScroll = true
              @model.set "currentSection", section.name
          }
      else
        $(document).scrollTop section.top
        @model.set "currentSection", section.name

    __onShow: ->
      @__onScrollBinded ?= _.bind @__onScroll, this
      @__onResizeBinded ?= _.bind @__onResize, this
      @__computeSectionsMap()
      @__firstRouteResolved = false
      ($ window).on "scroll", @__onScrollBinded
      ($ window).on "resize", @__onResizeBinded
      ($ document).on "load", @__onResizeBinded

    __onClose: ->
      ($ window).off "scroll", @__onScrollBinded

    __onScroll: _.debounce (->
      return unless @__listenToScroll
      section = @getSection()
      return unless section
      route = @getRoute section
      @model.set "currentSection", section.name
      common.router.navigate route if section.navigate
    ), 20

    __onResize: ->
      @__computeSectionsMap()

    __computeSectionsMap: ->
      @__sections = for name, r of @regions
        el = @r[name].$el
        view = @r[name]
        {top} = el.position()
        bottom = top + el.outerHeight()
        section = {name, el, top, bottom, view}
        section.absRoute = r.absRoute if r.absRoute?
        section.route = r.route if r.route?
        section.navigate = true
        section.navigate = r.navigate if r.navigate?
        section
      @__sections = _.sortBy @__sections, "top"

    __getSectionByPos: (pos)->
      pos += $(window).height() / 2
      for s in @__sections
        return s if s.top < pos < s.bottom
