/*
*
*	Orbis Cascade Alliance Central Package
*	Last updated: 2025-07-28
*
* Included customizations:
*   Insert custom action (updated 2018-11-07)
*   Custom model window for peer-review and open access badges (updated 2023-07-20)
*   Enlarge Covers (Updated 2021-12-06)
*   Text a Call Number (Removed 2025-07-28)
*   External Search (Updated 2022-02-04)
*   Force Login (Added 2020-10-22)
*   eShelf Links (Added 2020-11-03)
*   Hathi Trust Availability (Updated 2022-09-23)
*   Availability facet counts (Added 2022-03-23)
*   Hide Unwanted 856 Links (Added 2022-04-20)
*   Show NZ and IZ MMS IDs (Added 2022-08-11)
*   Set Focus on Hover in Send-To Menu (Added 2022-08-24)
*   Same Tab Menu Links (Added 2022-10-24)
*   Hide Summit Request Form (Added 2023-03-24)
*   Advanced Search Publication Years (Added 2023-05-18)
*/

(function(){
  "use strict";
  'use strict';

  var app = angular.module('centralCustom', ['angularLoad']);

  /* Placeholders for removed modules to prevent local packages from breaking */
  angular.module('toggleInstitutions', []);
  angular.module('showFavoritesWarning', []);
  angular.module('toggleAdvancedFields', []);

  /* Custom action Begins */
  angular.module('customActions', []);

  /* eslint-disable max-len */
  angular
    .module('customActions')
    .component('customAction', {
      bindings: {
        name: '@',
        label: '@',
        icon: '@',
        iconSet: '@',
        link: '@',
        target: '@',
        index: '<'
      },
      require: {
        prmActionCtrl: '^prmActionList'
      },
      controller: ['customActions', function (customActions) {
        var _this = this;

        this.$onInit = function () {
          _this.action = {
            name: _this.name,
            label: _this.label,
            index: _this.index,
            icon: {
              icon: _this.icon,
              iconSet: _this.iconSet,
              type: 'svg'
            },
            onToggle: customActions.processLinkTemplate(_this.link, _this.prmActionCtrl.item, _this.target)
          };
          customActions.removeAction(_this.action, _this.prmActionCtrl);
          customActions.addAction(_this.action, _this.prmActionCtrl);
        };
      }]
    });

  /* eslint-disable max-len */
  angular
    .module('customActions')
    .factory('customActions', function () {
      return {
        /**
         * Adds an action to the actions menu, including its icon.
         * @param  {object} action  action object
         * @param  {object} ctrl    instance of prmActionCtrl
         */
        // TODO coerce action.index to be <= requiredActionsList.length
        addAction: function addAction(action, ctrl) {
          if (!this.actionExists(action, ctrl)) {
            this.addActionIcon(action, ctrl);
            ctrl.actionListService.requiredActionsList.splice(action.index, 0, action.name);
            ctrl.actionListService.actionsToIndex[action.name] = action.index;
            ctrl.actionListService.onToggle[action.name] = action.onToggle;
            ctrl.actionListService.actionsToDisplay.unshift(action.name);
          }
        },
        /**
         * Removes an action from the actions menu, including its icon.
         * @param  {object} action  action object
         * @param  {object} ctrl    instance of prmActionCtrl
         */
        removeAction: function removeAction(action, ctrl) {
          if (this.actionExists(action, ctrl)) {
            this.removeActionIcon(action, ctrl);
            delete ctrl.actionListService.actionsToIndex[action.name];
            delete ctrl.actionListService.onToggle[action.name];
            var i = ctrl.actionListService.actionsToDisplay.indexOf(action.name);
            ctrl.actionListService.actionsToDisplay.splice(i, 1);
            i = ctrl.actionListService.requiredActionsList.indexOf(action.name);
            ctrl.actionListService.requiredActionsList.splice(i, 1);
          }
        },
        /**
         * Registers an action's icon.
         * Called internally by addAction().
         * @param  {object} action  action object
         * @param  {object} ctrl    instance of prmActionCtrl
         */
        addActionIcon: function addActionIcon(action, ctrl) {
          ctrl.actionLabelNamesMap[action.name] = action.label;
          ctrl.actionIconNamesMap[action.name] = action.name;
          ctrl.actionIcons[action.name] = action.icon;
        },
        /**
         * Deregisters an action's icon.
         * Called internally by removeAction().
         * @param  {object} action  action object
         * @param  {object} ctrl    instance of prmActionCtrl
         */
        removeActionIcon: function removeActionIcon(action, ctrl) {
          delete ctrl.actionLabelNamesMap[action.name];
          delete ctrl.actionIconNamesMap[action.name];
          delete ctrl.actionIcons[action.name];
        },
        /**
         * Check if an action exists.
         * Returns true if action is part of actionsToIndex.
         * @param  {object} action  action object
         * @param  {object} ctrl    instance of prmActionCtrl
         * @return {bool}
         */
        actionExists: function actionExists(action, ctrl) {
          return ctrl.actionListService.actionsToIndex.hasOwnProperty(action.name);
        },
        /**
         * Process a link into a function to call when the action is clicked.
         * The function will open the processed link in a new tab.
         * Will replace {pnx.xxx.xxx} expressions with properties from the item.
         * @param  {string}    link    the original link string from the html
         * @param  {object}    item    the item object obtained from the controller
         * @return {function}          function to call when the action is clicked
         */
        processLinkTemplate: function processLinkTemplate(link, item, target) {
          var processedLink = link;
          var pnxProperties = link.match(/\{(pnx\..*?)\}/g) || [];
          pnxProperties.forEach(function (property) {
            var value = property.replace(/[{}]/g, '').split('.').reduce(function (o, i) {
              try {
                var h = /(.*)(\[\d\])/.exec(i);
                if (h instanceof Array) {
                  return o[h[1]][h[2].replace(/[^\d]/g, '')];
                }
                return o[i];
              } catch (e) {
                return '';
              }
            }, item);
            processedLink = processedLink.replace(property, value);
          });
          return function () {
            if (typeof(target) === 'undefined') {
              target = '_blank';
            }
            return window.open(processedLink, target);
          };
        }
      };
    });
  /* Custom action Ends */

  // Begin Badges modal module
  angular
    .module('badgesModal', [])
    .component('badgesModal', {
      template: '<md-button ng-if="$ctrl.inBadges" ng-click="$ctrl.showBadgeInfo($event, $ctrl.view_code, $ctrl.infoFile)" class="badgeButton" aria-label="{{$ctrl.badgeTooltip}}"><md-tooltip>{{$ctrl.badgeTooltip}}</md-tooltip><md-icon md-svg-icon="{{$ctrl.infoIcon}}"></md-icon></md-button>',
      controller: function ($scope, $mdDialog, $location, badgeOptions) {

        // Badge types
        this.badgeTypes = [
          {
            definition: 'peer-reviewed',
            file: 'peer_review.html',
            options: badgeOptions.peer_review
          },
          {
            definition: 'open-access',
            file: 'open_access.html',
            options: badgeOptions.open_access
          }
        ];

        // Initialization
        this.$onInit = function () {
          this.view_code = $location.search().vid.replace(':', '-');
          this.infoIcon = badgeOptions.info_icon;
          this.inBadges = false;
          var icon_definition = $scope.$parent.$parent.$ctrl.iconDefinition;
          angular.forEach($scope.$ctrl.badgeTypes, function(badge) {
            if (icon_definition == badge.definition && badge.options.show_icon) {
              $scope.$ctrl.inBadges = true;
              $scope.$ctrl.badgeTooltip = badge.options.tooltip;
              $scope.$ctrl.infoFile = badge.file;
            }
          });

          // Move the badges after the icon and label container
          let badges = document.querySelectorAll("prm-icon-after badges-modal button.badgeButton");
          badges.forEach(myFunction);
          function myFunction(badge) {
            let myParent = badge.parentElement;
            if (myParent.nodeName == "BADGES-MODAL") {
              let myAncestor = myParent.parentElement.parentElement.parentElement;
              myAncestor.after(badge);
            }
          }
        }

        // Badge info dialog
        this.showBadgeInfo = function showBadgeInfo($event, view_code, info_file) {
          $mdDialog.show({
            templateUrl: 'custom/' + view_code + '/html/' + info_file,
            controller: badgeDialogController
          });
          function badgeDialogController($scope, $mdDialog) {
            $scope.closeBadgeInfo = function () {
              $mdDialog.hide();
            }
          }
          $event.stopPropagation();
        }

      }
    })
    .value('badgeOptions', {
      info_icon: 'primo-ui:help-circle-outline',
      peer_review: {
        show_icon: true,
        tooltip: 'What is peer review?'
      },
      open_access: {
        show_icon: true,
        tooltip: 'What is open access?'
      }
    });
  // END Badges modal module

  //*  Begin Enlarge covers   *//
  angular
    .module('enlargeCover', [])
    .component('enlargeCover', {
      // Template
      template: '<md-button ng-if="$ctrl.show_cover" ng-click="$ctrl.showLargeCover($event)" title="View Larger" />',
      controller: function controller($scope, $location, enlargeCoverOptions) {
        this.$onInit = function() {
          this.cover_url = '';
          this.show_cover = false;
          if (angular.isDefined($scope.$parent.$parent.$ctrl.item)) {
            var resource_type = $scope.$parent.$parent.$ctrl.item.pnx.display.type[0];
            if ($location.path() == '/fulldisplay' && enlargeCoverOptions.resource_types.indexOf(resource_type) != -1) {
              this.show_cover = true;
            }
          }
        }

        this.showLargeCover = function showLargeCover($event) {
          // Prevent page submission
          $event.preventDefault();

          // Get thumbnail URL and modify for large image
          if (angular.isDefined($scope.$parent.$parent.$ctrl.selectedThumbnailLink)) {
            var thumbnail_url = $scope.$parent.$parent.$ctrl.selectedThumbnailLink.linkURL.toLowerCase();
            if (thumbnail_url.indexOf('syndetics.com') != -1) {
              this.cover_url = thumbnail_url.replace('sc.jpg', 'lc.jpg');
            }
            else if (thumbnail_url.indexOf('books.google.com')) {
              this.cover_url = thumbnail_url.replace('zoom=5', 'zoom=1');
            }
            window.open(this.cover_url, '_blank');
          }
        }
      }
    })
    .value('enlargeCoverOptions', {
      resource_types: [
        'book',
        'pbook',
        'dvdvideo',
        'videocassette'
      ]
    });
  //* End Enlarge covers  *//

  //* Begin Text a Call Number *//
  angular
    .module('smsAction', [])
    .component('smsAction', {
      controller: function controller() {
        this.$onInit = function () {
          console.log('The Text a Call Number customization for Primo is no longer supported.');
        }
      }
    })
    .value('smsActionOptions', {});
  //* End Text a Call Number  *//

  //* Begin External Search *//
  angular.module('externalSearch', [])
    .component('externalSearchFacet', {
      controller: function ($scope, externalSearchService, externalSearchOptions) {
        externalSearchService.controller = $scope.$parent.$parent.$ctrl;
        externalSearchService.externalSearchOptions = externalSearchOptions;
        externalSearchService.addExtSearch();
      }
    })
    .component('externalSearchPagenav', {
      controller: function (externalSearchService) {
        if (externalSearchService.controller) {
          externalSearchService.addExtSearch();
        }
      }
    })
    .component('externalSearchContents', {
      template: '<div id="pcsg-es" ng-if="$ctrl.checkName()"><div ng-hide="$ctrl.checkCollapsed()"><div class="section-content animate-max-height-variable"><div class="md-chips md-chips-wrap"><div ng-repeat="target in targets" aria-live="polite" class="md-chip animate-opacity-and-scale facet-element-marker-local4"><div class="md-chip-content layout-row" role="button" tabindex="0"><strong dir="auto" title="{{ target.name }}"><a ng-href="{{ target.url + target.mapping(queries, filters) }}" target="_blank"><img ng-src="{{ target.img }}" width="22" height="22" alt="{{ target.alt }}" style="vertical-align:middle;"> {{ target.name }}</a></strong></div></div></div></div></div></div>',
      controller: function ($scope, $location, externalSearchOptions) {
        $scope.facetName = externalSearchOptions.facetName;
        $scope.targets = externalSearchOptions.searchTargets;
        var query = $location.search().query;
        var filter = $location.search().pfilter;
        $scope.queries = Array.isArray(query) ? query : query ? [query] : false;
        $scope.filters = Array.isArray(filter) ? filter : filter ? [filter] : false;
        this.parentCtrl = $scope.$parent.$parent.$ctrl;
        this.checkName = function () {
          return this.parentCtrl.facetGroup.name == externalSearchOptions.facetName ? true : false;
        }
        this.checkCollapsed = function () {
          return this.parentCtrl.facetGroup.facetGroupCollapsed;
        }
        var externalSearchDiv;
        var externalSearchSelector = "prm-facet div.primo-scrollbar div.sidebar-inner-wrapper div.sidebar-section prm-facet-group div[data-facet-group='" + $scope.facetName + "']";
        function findExternalSearchDiv() {
          var id = setInterval(innerFindExternalSearchDiv, 100);
          function innerFindExternalSearchDiv() {
            if (document.querySelector(externalSearchSelector)) {
              externalSearchDiv = document.querySelector(externalSearchSelector).parentElement.parentElement;
              externalSearchDiv.classList.add("pcsg-external-search");
              clearInterval(id);
            }
          }
        }
        findExternalSearchDiv();
      }
    })
    .factory('externalSearchService', function (externalSearchOptions) {
      return {
        get controller() {
          return this.prmFacetCtrl || false;
        },
        set controller(controller) {
          this.prmFacetCtrl = controller;
        },
        addExtSearch: function addExtSearch() {
          var xx = this;
          var checkExist = setInterval(function () {
            if (xx.prmFacetCtrl.facetService.results[0] && xx.prmFacetCtrl.facetService.results[0].name != xx.externalSearchOptions.facetName) {
              if (xx.prmFacetCtrl.facetService.results.name !== xx.externalSearchOptions.facetName) {
                xx.prmFacetCtrl.facetService.results.unshift({
                  name: externalSearchOptions.facetName,
                  displayedType: 'exact',
                  limitCount: 0,
                  facetGroupCollapsed: false,
                  values: undefined
                });
              }
              clearInterval(checkExist);
            }
          }, 100);
        }
      };
    })
    .value('externalSearchOptions', {
      facetName: 'External Search',
      searchTargets: [
        { // WorldCat
          "name": "Worldcat",
          "url": "https://www.worldcat.org/search?q=",
          "img": "/discovery/custom/01ALLIANCE_NETWORK-CENTRAL_PACKAGE/img/worldcat-logo.png",
          "alt": "Worldcat Logo",
          mapping: function mapping(queries, filters) {
            var query_mappings = {
              'any': 'kw',
              'title': 'ti',
              'creator': 'au',
              'subject': 'su',
              'isbn': 'bn',
              'issn': 'n2'
            };
            try {
              return queries.map(function (part) {
                var terms = part.split(',');
                var type = query_mappings[terms[0]] || 'kw';
                var string = terms[2] || '';
                var join = terms[3] || '';
                return type + ':' + string + ' ' + join + ' ';
              }).join('');
            } catch (e) {
              return '';
            }
          }
        },
        { // Google Scholar
          "name": "Google Scholar",
          "url": "https://scholar.google.com/scholar?q=",
          "img": "/discovery/custom/01ALLIANCE_NETWORK-CENTRAL_PACKAGE/img/google-logo.png",
          "alt": "Google Scholar Logo",
          mapping: function mapping(queries, filters) {
            try {
              return queries.map(function (part) {
                return part.split(",")[2] || "";
              }).join(' ');
            } catch (e) {
              return '';
            }
          }
        }]
    });
  //* End External Search *//

  //* Begin Force Login *//
  angular
    .module('forceLogin', [])
    // Create and handle session storage variable
    .factory('forceLoginSession', function ($window, $rootScope) {
      angular.element($window).on('storage', function (event) {
        if (event.key === 'forceLogin') {
          $rootScope.$apply();
        }
      });
      // Functions for setting and getting session data
      return {
        setData: function (val) {
          $window.sessionStorage && $window.sessionStorage.setItem('forceLogin', val);
          return this;
        },
        getData: function () {
          return $window.sessionStorage && $window.sessionStorage.getItem('forceLogin');
        }
      };
    })
    // Drop code into element added in local package
    .component('forceLogin', {
      controller: function ($scope, $rootScope, forceLoginSession) {
        this.$onInit = function () {
          // Access the control with the loginService
          var parentCtrl = $scope.$parent.$parent.$ctrl;

          // Put results of isSignedIn() into a variable
          var checkLogin = false;
          if (parentCtrl.isSignedIn() && !angular.isUndefined(parentCtrl.userName())) {
              checkLogin = true;
          }

          // Get variable from session storage
          $scope.forceLogin = forceLoginSession.getData();

          // If the session variable is still null because user is not logged in and has not dismissed the login dialog
          if (($scope.forceLogin == null) && (checkLogin == false)) {
            // Open the login dialog box
            parentCtrl.loginService.handleLoginClick();
            // And set the session variable
            forceLoginSession.setData('true');
          }
          // Handle opening a new browser tab when logged in: the page loads with userName undefined, then later populates
          // so this will close the dialog box once the page finishes loading
          else if (checkLogin == true) {
            parentCtrl.loginService.$mdDialog.destroy();
          }
        }
      }
    });
  //* End Force Login *//


  //* Begin eshelf.menu link module *//
  angular
    .module('eShelfLinks', [])
    .controller('DirectiveController',function($scope, $window, eShelfOptions){
      $scope.data = eShelfOptions;
      $scope.openLink = function (url) {
        $window.open(url);
      }
    })
    .directive('mdMenuContent', function($compile){
      return {
         restrict: "E",
         link: function($scope, $element){
          var customEl = angular.element('<custom-directive></custom-directive>');
          $element.append(customEl);
          $compile(customEl)($scope);
        }
      }
    })
    .directive('customDirective', function ($window, $compile) {
      return {
        restrict: "E",
        controller: 'DirectiveController',
        scope: {data: '=?'},
        link: function ($scope, $element, $attr, ctrl) {
          if($scope.data.items.length > 0){
            angular.forEach($scope.data.items, function (value, index) {
              var directiveName = "md-menu-item",
              directiveLabel = value.label,
              directiveClass = "menu-custom-link",
              directiveText = value.text,
              directiveLink = value.link,
              directiveIcon = value.icon;
              var el = '<' + directiveName
                + ' class="'+ directiveClass + '">'
                + '<button class="button-with-icon md-button md-primoExplore-theme md-ink-ripple" type="button" aria-label="'
                + directiveLabel + '" ng-click="openLink(\'' + directiveLink + '\')">'
                + '<md-icon md-svg-icon="' + directiveIcon + '"></md-icon>'
                + '<span class="custom-link">' + directiveText + '</span>'
                + '</button>'
                + '</' + directiveName + '">';
              var compiledEl = angular.element($compile(el)($scope));
              var menu = document.querySelector('custom-directive');
              menu.appendChild(compiledEl[0]);
            });
          }
        }
      };
    })
    .value('eShelfOptions', {
      items:[]
    });
  //* End eshelf.menu link module *//


  //* Begin Hathi Trust Availability *//
  //* Adapted from UMNLibraries primo-explore-hathitrust-availability *//
  //* https://github.com/UMNLibraries/primo-explore-hathitrust-availability *//
  angular
    .module('hathiTrustAvailability', [])
    .constant(
      'hathiTrustBaseUrl',
      'https://catalog.hathitrust.org/api/volumes/brief/json/'
    )
    .config([
      '$sceDelegateProvider',
      'hathiTrustBaseUrl',
      function ($sceDelegateProvider, hathiTrustBaseUrl) {
        var urlWhitelist = $sceDelegateProvider.resourceUrlWhitelist();
        urlWhitelist.push(hathiTrustBaseUrl + '**');
        $sceDelegateProvider.resourceUrlWhitelist(urlWhitelist);
      },
    ])
    .factory('hathiTrust', [
      '$http',
      '$q',
      'hathiTrustBaseUrl',
      function ($http, $q, hathiTrustBaseUrl) {
        var svc = {};
        var lookup = function (ids) {
          if (ids.length) {
            var hathiTrustLookupUrl = hathiTrustBaseUrl + ids.join('|');
            return $http
                    .jsonp(hathiTrustLookupUrl, {
                        cache: true,
                        jsonpCallbackParam: 'callback',
                    })
                    .then(function (resp) {
                        return resp.data;
                    });
          } else {
            return $q.resolve(null);
          }
        };

        // find a HT record URL for a given list of identifiers (regardless of copyright status)
        svc.findRecord = function (ids) {
          return lookup(ids)
            .then(function (bibData) {
              for (var i = 0; i < ids.length; i++) {
                var recordId = Object.keys(bibData[ids[i]].records)[0];
                if (recordId) {
                  return $q.resolve(bibData[ids[i]].records[recordId].recordURL);
                }
              }
              return $q.resolve(null);
            })
            .catch(function (e) {
              console.error(e);
            });
        };

        // find a public-domain HT record URL for a given list of identifiers
        svc.findFullViewRecord = function (ids) {
          var handleResponse = function (bibData) {
            var fullTextUrl = null;
            for (var i = 0; !fullTextUrl && i < ids.length; i++) {
              var result = bibData[ids[i]];
              for (var j = 0; j < result.items.length; j++) {
                var item = result.items[j];
                if (item.usRightsString.toLowerCase() === 'full view') {
                  fullTextUrl = result.records[item.fromRecord].recordURL;
                  break;
                }
              }
            }
            return $q.resolve(fullTextUrl);
          };
          return lookup(ids)
            .then(handleResponse)
            .catch(function (e) {
              console.error(e);
            });
        };

        return svc;
      },
    ])
    .component('hathiTrustAvailability', {
      require: {
        prmSearchResultAvailabilityLine: '^prmSearchResultAvailabilityLine',
      },
      bindings: {
        entityId: '@',
        ignoreCopyright: '<',
        hideIfJournal: '<',
        hideOnline: '<',
        msg: '@?',
        institutionId: '@'
      },
      controller: function (hathiTrust, hathiTrustAvailabilityOptions) {
        var self = this;
        self.$onInit = function () {

          // copy options from local package or central package defaults
          self.msg = hathiTrustAvailabilityOptions.msg;
          self.hideOnline = hathiTrustAvailabilityOptions.hideOnline;
          self.hideIfJournal = hathiTrustAvailabilityOptions.hideIfJournal;
          self.ignoreCopyright = hathiTrustAvailabilityOptions.ignoreCopyright;
          self.entityId = hathiTrustAvailabilityOptions.entityId;
          self.excludeNotLocal = hathiTrustAvailabilityOptions.excludeNotLocal;

          if (!self.msg) self.msg = 'Full Text Available at HathiTrust';

          // prevent appearance/request iff 'hide-online'
          if (self.hideOnline && isOnline()) {
            return;
          }

          // prevent appearance/request iff 'hide-if-journal'
          if (self.hideIfJournal && isJournal()) {
            return;
          }

          // prevent appearance iff no holding in this library
          if (self.excludeNotLocal && !isLocal()) {
            return;
          }

          // prevent appearance/request if item is unavailable
          if (self.ignoreCopyright && !isAvailable()) {
              //allow links for locally unavailable items that are in the public domain
              self.ignoreCopyright = false;
          }

          // look for full text at HathiTrust
          updateHathiTrustAvailability();
        };

        var isJournal = function () {
          if (angular.isDefined(self.prmSearchResultAvailabilityLine.result.pnx.addata.format)) {
            var format = self.prmSearchResultAvailabilityLine.result.pnx.addata.format[0];
            return !(format.toLowerCase().indexOf('journal') == -1); // format.includes("Journal")
          }
          else {
            return false;
          }
        };

        var isAvailable = function isAvailable() {
          var available = self.prmSearchResultAvailabilityLine.result.delivery.availability[0];
          return (available.toLowerCase().indexOf('unavailable') == -1);
        };

        var isLocal = function () {
          var availablelocally = false;
          /* If ebook is available set availablelocally to true */
          if (self.prmSearchResultAvailabilityLine.result.delivery.availability[0] == 'not_restricted') {
              availablelocally = true;
          }
          /* If ebook is available by link-in-record set availablelocally to true */
          else if (self.prmSearchResultAvailabilityLine.result.delivery.availability[0] == 'fulltext_linktorsrc') {
              availablelocally = true;
          }
          /* If print book is available set availablelocally to true */
          else if (self.prmSearchResultAvailabilityLine.result.delivery.availability[0] == 'available_in_library') {
              availablelocally = true;
          }
          /* If print book is owned but unavailable set availablelocally to true */
          else if (self.prmSearchResultAvailabilityLine.result.delivery.availability == 'unavailable') {
              availablelocally = true;
          }
          return availablelocally;
        }

        var isOnline = function () {
          var delivery =
            self.prmSearchResultAvailabilityLine.result.delivery || [];
          if (!delivery.GetIt1)
            return delivery.deliveryCategory.indexOf('Alma-E') !== -1;
          return self.prmSearchResultAvailabilityLine.result.delivery.GetIt1.some(
            function (g) {
              return g.links.some(function (l) {
                return l.isLinktoOnline;
              });
            }
          );
        };

        var formatLink = function (link) {
          return self.entityId ? link + '?signon=swle:' + self.entityId : link;
        };

        // Rewrote logic to filter on presence of (ocolc) prefix PO 20220825
        var isOclcNum = function (value) {
          const oclcre = /^(\(ocolc\))?\d+$/i;
          var res = false;
          var getmatch = value.match(oclcre);
          if (getmatch) {
            if (getmatch[1]) {
              res = true;
            }
          }
          return res;
        };

        var updateHathiTrustAvailability = function () {
          var hathiTrustIds = (
            self.prmSearchResultAvailabilityLine.result.pnx.addata.oclcid || []
          )
            .filter(isOclcNum)
            .map(function (id) {
              return 'oclc:' + id.toLowerCase().replace('(ocolc)', '');
            });
          hathiTrust[self.ignoreCopyright ? 'findRecord' : 'findFullViewRecord'](
            hathiTrustIds
          ).then(function (res) {
            if (res) self.fullTextLink = formatLink(res);
          });
        };
      },
      template:
        '<span ng-if="$ctrl.fullTextLink" class="umnHathiTrustLink">\
          <md-icon alt="HathiTrust Logo">\
            <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100%" height="100%" viewBox="0 0 16 16" enable-background="new 0 0 16 16" xml:space="preserve">  <image id="image0" width="16" height="16" x="0" y="0"\
            xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAACBjSFJN\
            AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAACNFBMVEXuegXvegTsewTveArw\
            eQjuegftegfweQXsegXweQbtegnsegvxeQbvegbuegbvegbveQbtegfuegbvegXveQbvegbsfAzt\
            plfnsmfpq1/wplPuegXvqFrrq1znr2Ptok/sewvueQfuegbtegbrgRfxyJPlsXDmlTznnk/rn03q\
            pVnomkjnlkDnsGnvwobsfhPveQXteQrutHDqpF3qnUnpjS/prmDweQXsewjvrWHsjy7pnkvqqGDv\
            t3PregvqhB3uuXjusmzpp13qlz3pfxTskC3uegjsjyvogBfpmkHpqF/us2rttXLrgRjrgBjttXDo\
            gx/vtGznjzPtfhHqjCfuewfrjCnwfxLpjC7wtnDogBvssmjpfhLtegjtnEjrtnTmjC/utGrsew7s\
            o0zpghnohB/roUrrfRHtsmnlkTbrvH3tnEXtegXvegTveQfqhyHvuXjrrGTpewrsrmXqfRHogRjt\
            q2Dqewvqql/wu3vqhyDueQnwegXuegfweQPtegntnUvnt3fvxI7tfhTrfA/vzJvmtXLunEbtegrw\
            egTregzskjbsxI/ouoPsqFzniyrz2K3vyZnokDLpewvtnkv30J/w17XsvYXjgBbohR7nplnso1L0\
            1Kf40Z/um0LvegXngBnsy5juyJXvsGftrGTnhB/opVHoew7qhB7rzJnnmErkkz3splbqlT3smT3t\
            tXPqqV7pjzHvunjrfQ7vewPsfA7uoU3uqlruoEzsfQ/vegf///9WgM4fAAAAFHRSTlOLi4uLi4uL\
            i4uLi4uLi4tRUVFRUYI6/KEAAAABYktHRLvUtndMAAAAB3RJTUUH4AkNDgYNB5/9vwAAAQpJREFU\
            GNNjYGBkYmZhZWNn5ODk4ubh5WMQERUTl5CUEpWWkZWTV1BUYlBWUVVT19BUUtbS1tHV0zdgMDQy\
            NjE1MzRXsrC0sraxtWOwd3B0cnZxlXZz9/D08vbxZfDzDwgMCg4JdQsLj4iMio5hiI2LT0hMSk5J\
            TUvPyMzKzmHIzcsvKCwqLiktK6+orKquYZCuratvaGxqbmlta+8QNRBl6JQ26Oru6e3rnzBx0uQ8\
            aVGGvJopU6dNn1E8c9bsOXPniYoySM+PXbBw0eIlS5fl1C+PFRFlEBUVXbFy1eo1a9fliQDZYIHY\
            9fEbNm7avEUUJiC6ddv2HTt3mSuBBfhBQEBQSEgYzOIHAHtfTe/vX0uvAAAAJXRFWHRkYXRlOmNy\
            ZWF0ZQAyMDE2LTA5LTEzVDE0OjA2OjEzLTA1OjAwNMgVqAAAACV0RVh0ZGF0ZTptb2RpZnkAMjAx\
            Ni0wOS0xM1QxNDowNjoxMy0wNTowMEWVrRQAAAAASUVORK5CYII=" />\
            </svg> \
          </md-icon>\
          <a target="_blank" ng-href="{{$ctrl.fullTextLink}}">\
          {{ ::$ctrl.msg }}\
            <prm-icon external-link="" icon-type="svg" svg-icon-set="primo-ui" icon-definition="open-in-new"></prm-icon>\
          </a>\
        </span>',
    })
    // Set default values for options
    .value('hathiTrustAvailabilityOptions', {
      msg: 'Full Text Available at HathiTrust',
      hideOnline: false,
      hideIfJournal: false,
      ignoreCopyright: false,
      entityId: '',
      excludeNotLocal: true
    });
  /* End HathiTrust Availability */

  /* Add count to availability facet */
  angular
    .module('availabilityCounts', [])
    .component('availabilityCounts', {
      controller: function ($scope, availabilityCountsOptions) {

        var avail_group = 'tlevel';

        this.$onInit = function () {
          var parent_ctrl = $scope.$parent.$parent.$ctrl;
          this.facet_group = parent_ctrl.facetGroup.name;
          this.facet_results = parent_ctrl.facetService.results;
          if (this.facet_group == avail_group) {
            this.processFacets();
          }
          // copy options from local package or central package defaults
          this.msg = availabilityCountsOptions.msg;
        }

        this.processFacets = function () {
          var self = this;
          if (!self.msg) self.msg = '* Counts are approximate. Results may differ.';

          angular.forEach(self.facet_results, function (result) {
            if (result.name == avail_group) {
              var first_value = result.values[0].value;
              var interval = setInterval(find_facet, 100);
              function find_facet() {
                if (document.querySelector(self.getSelector(first_value))) {

                  // Clear interval
                  clearInterval(interval);

                  // Add availability counts as spans
                  angular.forEach(result.values, function (facet) {
                    var selector = self.getSelector(facet.value);
                    if (document.querySelector(selector)) {
                      var facet_item = document.querySelector(selector);
                      if (facet_item.querySelector('.facet-counter') == null) {
                        var facet_text = facet_item.querySelector('.text-number-space');
                        var span = document.createElement('span');
                        var count = document.createTextNode(facet.count.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '*');
                        span.setAttribute('class', 'text-italic text-in-brackets text-rtl facet-counter');
                        span.appendChild(count);
                        facet_text.after(span);
                      }
                    }
                  });

                  // Facets are created and destroyed in the DOM when the group is toggled so watch for clicks
                  var availGroup = document.querySelector(self.getSelector(avail_group));
                  availGroup.addEventListener('click', function () {
                    self.processFacets();
                  });

                  // Add warning text
                  if (!availGroup.querySelector('.section-content .warning')) {
                    var warning = document.createElement('span');
                    var warningText = document.createTextNode(self.msg);
                    warning.setAttribute('class', 'warning');
                    warning.appendChild(warningText);
                    availGroup.querySelector('.section-content').appendChild(warning);
                  }
                }
              }
            }
          });
        }

        this.getSelector = function (value) {
          if (value == avail_group) {
            return 'div[data-facet-group="' + avail_group + '"]';
          }
          else {
            return 'div[data-facet-value="' + avail_group + '-' + value + '"]';
          }
        }

      }
    })
    // Set default values for options
    .value('availabilityCountsOptions', {
      msg: '* Counts are approximate. Results may differ.'
    });
  //* End availability counts *//

  /* Hide unwanted 856 links */
  app.value('linksToKeep', []).component('prmServiceLinksAfter', {
    bindings: {
      parentCtrl: '<'
    },
    controller: function controller($document, linksToKeep) {
      angular.element(function () {
        if (linksToKeep.length > 0) {
          var lNodes = $document[0].querySelectorAll("prm-service-links > div > div > div");
          for (var i = 0; i < lNodes.length; i++) {
            var eNode = lNodes[i];
            var span = eNode.querySelector("a > span");
            if (span != null) {
              if (!linksToKeep.includes(span.textContent.trim())) {
                eNode.style.display = "none";
              }
            }
          }
        }
      });
    }
  });
  //* End unwanted 856 links *//

  /* showMmsid begin */
  angular
    .module('showMmsid', [])
    .component('showMmsid', {
      bindings: { parentCtrl: '<' },
      controller: function controller($scope, $http, $element, showMmsidOptions) {
        this.$onInit = function() {
          /* seems to work better to default to show, and hide when unavailable*/
          $scope.izShow=true;
          $scope.nzShow=true;
          $scope.nzClass="ng-show";
          $scope.izClass="ng-show";
          var izSuffix=showMmsidOptions.izSuffix;
          $scope.izLabel=showMmsidOptions.izLabel;
          $scope.nzLabel=showMmsidOptions.nzLabel;
          var srcid=$scope.$parent.$parent.$ctrl.item.pnx.control.sourcerecordid[0];
          //srcid is nz mmsid, implies no iz mmsid
          if(srcid.substring(0,2)=="99" && srcid.substring(srcid.length - 4)!=izSuffix){
            $scope.nzShow=true;
            $scope.nzMmsid=srcid;
            $scope.izShow=false;
            $scope.izClass="ng-hide";
          }
          //srcid is iz mmsid, check sru for nz mmsid
          if(srcid.substring(0,2)=="99" && srcid.substring(srcid.length - 4)==izSuffix){
            $scope.izShow=true;
            $scope.izMmsid=srcid;
            sruCall(srcid);
          }

          /* src is not an mmsid */
          if(srcid.substring(0,2)!="99"){
            $scope.izShow=false;
            $scope.nzShow=false;
            $scope.nzClass="ng-hide";
            $scope.izClass="ng-hide";
          }

          /*  make SRU call w/iz mmsid to check for nz mms id*/
          function sruCall(string){
            var instCode=showMmsidOptions.instCode;
            var url="https://na01.alma.exlibrisgroup.com/view/sru/"+instCode+"?version=1.2&operation=searchRetrieve&query=alma.mms_id="+string;
            $http.get(url).then(function (response) {
              var parser = new DOMParser();
              var xmlDoc = parser.parseFromString(response.data,"text/xml");
              var fields=xmlDoc.getElementsByTagName("datafield")
              var success=false;
              for (var j=0;j<fields.length;j++){
                var field=fields[j]
                var attr=field.getAttribute("tag");
                if(attr=="035"){
                  var subfield=field.getElementsByTagName("subfield")[0].childNodes[0].nodeValue;
                  //console.log(subfield)
                  if(subfield.includes("(EXLNZ-01ALLIANCE_NETWORK)")){
                    var pieces=subfield.split(")")
                    $scope.nzMmsid=pieces[1]
                    success=true;
                    break;
                  }
                }

              }
              if(success==false){
                $scope.nzShow=false;
                $scope.nzClass="ng-hide";
              }
            });
          } /* end sruCall*/
        };
      },
      template: `<div  layout="row" layout-xs="column" class="layout-block-xs layout-xs-column layout-row {{izClass}}" ng-show="{{izShow}}">
      <div flex-gt-sm="20" flex-gt-xs="25" flex="" class="flex-gt-xs-25 flex-gt-sm-20 flex">
        <span class="bold-text word-break" data-details-label="mms"   title="Alma">{{izLabel}}</span>
      </div>
      <div class="item-details-element-container flex" flex="">{{izMmsid}}
      </div>
    </div>
    <div  layout="row" layout-xs="column" class="layout-block-xs layout-xs-column layout-row {{nzClass}}" ng-show="{{nzShow}}">
    <div flex-gt-sm="20" flex-gt-xs="25" flex="" class="flex-gt-xs-25 flex-gt-sm-20 flex">
      <span class="bold-text word-break" data-details-label="mms"   title="Alma">{{nzLabel}}</span>
    </div>
    <div class="item-details-element-container flex" flex="">{{nzMmsid}}
    </div>
    </div>`
    })
  /* showMmsid end */

  //* Begin Set Focus on Hover in Send-To Menu *//
  angular
    .module('setFocusOnHoverSendTo', [])
    .component('setFocus', {
      controller: function ($scope) {
        this.$onInit = function () {
          var parent_ctrl = $scope.$parent.$parent.$ctrl;
          if (parent_ctrl.activeAction.length > 0) {
            var action_list = parent_ctrl.$element[0];
            var interval = setInterval(find_items, 100);
            function find_items() {
              let items = action_list.getElementsByTagName('button');
              if (items.length > 0) {
                clearInterval(interval);
                for (let i = 0; i < items.length; i++) {
                  items[i].addEventListener('mouseenter', function (e) {
                    this.focus();
                  });
                  items[i].addEventListener('mouseleave', function (e) {
                    this.blur();
                  });
                }
              }
            }
          }
        }
      }
    }) 
  //* End Set Focus on Hover in Send-To Menu *//

  /* Same Tab Menu Links start  */
  angular
    .module('sameTabMenuLinks', [])
    .component('sameTabMenuLinks', {
      bindings: {parentCtrl: '<'},
      controller: function controller($document, $scope) {
        this.$onInit = function() {
          /*Must wait for menu items to appear*/
          var elCheck = setInterval(updateLinks, 1000);
          function updateLinks() {
            /* Checks for menu links, sets all target attributes to '_self'*/
            if( $document[0].querySelectorAll("div.top-nav-bar-links > div").length>0 ){
              var menuItems=$document[0].querySelectorAll("div.top-nav-bar-links > div")
              for (var i = 0; i < menuItems.length; i++) {
                var mItem = menuItems[i];
                var anchor = mItem.querySelector("div > a");
                anchor.target="_self"
              }
              clearInterval(elCheck);
            }
          }
          var linkCheck = setInterval(updateHiddenLinks, 1000);
          function updateHiddenLinks() {
            /* Checks for menu links, sets all target attributes to '_self'*/
            if( $document[0].querySelectorAll("div.custom-links-container > div").length>0 ){
              var menuItems=$document[0].querySelectorAll("div.custom-links-container > div")
              for (var i = 0; i < menuItems.length; i++) {
                var mItem = menuItems[i];
                var anchor = mItem.querySelector("div > a");
                anchor.target="_self"
              }
              clearInterval(linkCheck);
            }
          }
        }
      }
    })
  /* End Same Tab Menu Links */
  
  // Hide the RS form for OpenURLs if...
  // a) there is no OCLC number or ISBN, or 
  // b) there are no holdings in the NZ
  angular
    .module('hideSummit', [])
    .component('hideSummit', {
      template: '<span ng-if="$ctrl.found_records">Held by: {{$ctrl.summit_list}}</span>',
      controller: function ($scope, $location, $http) {
        
        var vm = this;
        var parent_ctrl, oclc, isbn;
        const sru = 'https://na01.alma.exlibrisgroup.com/view/sru/01ALLIANCE_NETWORK?version=1.2&operation=searchRetrieve&query=';
        const institution_codes = {
          "01ALLIANCE_NETWORK": "Orbis Cascade Alliance",
          "01ALLIANCE_CC": "Clark College",
          "01ALLIANCE_CCC": "Clackamas Community College",
          "01ALLIANCE_CHEMEK": "Chemeketa Community College",
          "01ALLIANCE_COCC": "Central Oregon Community College",
          "01ALLIANCE_CWU": "Central Washington University",
          "01ALLIANCE_EOU": "Eastern Oregon University",
          "01ALLIANCE_EVSC": "Evergreen State College",
          "01ALLIANCE_EWU": "Eastern Washington University",
          "01ALLIANCE_GFOX": "George Fox University",
          "01ALLIANCE_LANECC": "Lane Community College",
          "01ALLIANCE_LCC": "Lewis & Clark College",
          "01ALLIANCE_LINF": "Linfield College",
          "01ALLIANCE_MHCC": "Mount Hood Community College",
          "01ALLIANCE_OHSU": "Oregon Health and Science University",
          "01ALLIANCE_OIT": "Oregon Institute of Technology",
          "01ALLIANCE_OSU": "Oregon State University",
          "01ALLIANCE_PCC": "Portland Community College",
          "01ALLIANCE_PSU": "Portland State University",
          "01ALLIANCE_PU": "Pacific University",
          "01ALLIANCE_REED": "Reed College",
          "01ALLIANCE_SEAU": "Seattle University",
          "01ALLIANCE_SOU": "Southern Oregon University",
          "01ALLIANCE_SPU": "Seattle Pacific University",
          "01ALLIANCE_STMU": "Saint Martin's University",
          "01ALLIANCE_UID": "University of Idaho",
          "01ALLIANCE_UO": "University of Oregon",
          "01ALLIANCE_UPORT": "University of Portland",
          "01ALLIANCE_UPUGS": "University of Puget Sound",
          "01ALLIANCE_UW": "University of Washington",
          "01ALLIANCE_WALLA": "Walla Walla University",
          "01ALLIANCE_WHITC": "Whitman College",
          "01ALLIANCE_WOU": "Western Oregon University",
          "01ALLIANCE_WPC": "Warner Pacific College",
          "01ALLIANCE_WSU": "Washington State University",
          "01ALLIANCE_WU": "Willamette University",
          "01ALLIANCE_WW": "Whitworth University",
          "01ALLIANCE_WWU": "Western Washington University",
          "01WIN_GONZAGA": "Gonzaga University"
        }
        
        this.$onInit = function() {
          // For OpenURLs only
          if ($location.path() == '/openurl') {
            vm.found_records = false;
            vm.parent_ctrl = $scope.$parent.$parent.$ctrl;
            if (angular.isDefined(vm.parent_ctrl.item)) {
              var pnx = vm.parent_ctrl.item.pnx;
              var query = null;
              vm.oclc = null;
              vm.isbn = null;
              // Check PNX for OCLC number
              if (angular.isDefined(pnx.addata.oclcid)) {
                vm.oclc = pnx.addata.oclcid[0];
              }
              // Check rft_id in URL for OCLC number or ISBN
              else if (angular.isDefined($location.search()["rft_id"])) {
                var rft_id = $location.search()["rft_id"];
                if (rft_id.constructor === String) {
                  vm.check_rft_id(rft_id);
                }
                else if (rft_id.constructor === Array) {
                  angular.forEach(rft_id, function (rft_entry) {
                    vm.check_rft_id(rft_entry);
                  });
                }
              }
              // If nothing found yet, check PNX and rft.isbn in URL for ISBN
              if (vm.oclc == null && vm.isbn == null) {
                if (angular.isDefined(pnx.addata.isbn)) {
                  vm.isbn = pnx.addata.isbn[0];
                }
                else if (angular.isDefined($location.search()["rft.isbn"])) {
                  vm.isbn = $location.search()["rft.isbn"];
                }
              }
              // Set query prioritizing OCLC number
              if (vm.oclc != null) {
                query = 'alma.oclc_control_number_035_az=' + vm.oclc;
              }
              else if (vm.isbn != null) {
                query = 'alma.isbn=' + vm.isbn;
              }
              // Hide the form if no OCLC number or ISBN anywhere
              else {
                console.log('No OCLC number or ISBN');
                vm.hide_form();
              }
              
              // If OCLC or ISBN, use SRU to check for NZ holdings
              if (query != null) {
                $http.get(sru + query).then(function (response) {
                  var parser = new DOMParser();
                  var xmlDoc = parser.parseFromString(response.data,"text/xml");
                  var numRecords = xmlDoc.getElementsByTagName('numberOfRecords');
                  if (numRecords.length > 0) {
                    var count = parseInt(numRecords[0].textContent);
                    // If no records, hide the form
                    if (count == 0) {
                      console.log('No NZ records for SRU query ' + query);
                      vm.hide_form();
                    }
                    // If records, go through each
                    else {
                      var institutions = [];
                      var recordData = xmlDoc.getElementsByTagName('recordData');
                      for (var r = 0; r < recordData.length; r++) {
                        var record = recordData[r];
                        // Check LDR/06 and 008/23 or 29 for form of item
                        var leader = record.getElementsByTagName('leader')[0].textContent;
                        const maps_and_visuals = ['e','f','g','k','o'];
                        var form_position, form_of_item;
                        if (maps_and_visuals.includes(leader.substr(6, 1))) {
                          form_position = 29;
                        }
                        else {
                          form_position = 23;
                        }
                        var controlfields = record.getElementsByTagName('controlfield');
                        for (var c = 0; c < controlfields.length; c++) {
                          var controlfield = controlfields[c];
                          if (controlfield.getAttribute('tag') == '008') {
                            form_of_item = controlfield.textContent.substr(form_position, 1);
                            break;
                          }
                        }
                        // If online format, skip this record
                        if (form_of_item == 'o') {
                          continue;
                        }
                        // For other forms, get institution
                        else {
                          var datafields = record.getElementsByTagName('datafield');
                          angular.forEach(datafields, function(datafield) {
                            if (datafield.getAttribute('tag') == '852') {
                              var subfields = datafield.getElementsByTagName('subfield');
                              angular.forEach(subfields, function(subfield) {
                                if (subfield.getAttribute('code') == 'a') {
                                  if (angular.isDefined(institution_codes[subfield.textContent])) {
                                    institutions.push(institution_codes[subfield.textContent]);
                                  }
                                }
                              });
                            }
                          });
                        }
                      }
                      if (institutions.length > 0) {
                        vm.found_records = true;
                        vm.summit_list = institutions.join(', ');
                      }
                      else {
                        console.log('No physical holdings found in SRU query ' + query);
                        vm.hide_form();
                      }
                    }
                  }
                  else {
                    console.log('Error in SRU response.');
                    console.log(sru + query);
                    vm.hide_form();
                  }
                });
              }
            }
          }
        }
        
        // Check rft_id(s) for OCLC and ISBN
        this.check_rft_id = function(rft_id) {
          if (rft_id.substring(0, 12).toLowerCase() == "info:oclcnum") {
            vm.oclc = rft_id.substr(13);
          }
          else if (rft_id.substring(0, 8).toLowerCase() == "urn:isbn") {
            vm.isbn = rft_id.substr(9);
          }
        }
        
        // Remove the RS service after servicesListIsLoading gets set to false
        this.hide_form = function() {
          $scope.$watch(
            function() {
              return vm.parent_ctrl.servicesListIsLoading;
            },
            function(newValue, oldValue) {
              if (newValue === false) {
                angular.forEach(vm.parent_ctrl.services.serviceinfo, function(service, key) {
                  if (service.type == 'AlmaResourceSharing') {
                    vm.parent_ctrl.services.serviceinfo.shift(key);
                  }
                });
              }
            }
          );
        }
        
      }
    });
    /* End Hide Summit Form */
    
    // Start Publication year advanced field
    angular
      .module('addPubyearAdvsearch', [])
      .component('addPubyearAdvsearch', {
        template: '' +
          '<div id="pubyear-dropdown" layout="row" flex="" layout-xs="column" class="layout-xs-column layout-row flex" ng-if="$ctrl.showIt()">' +
          '<md-card class="advanced-drop-downs zero-margin marginless-inputs padded-container _md md-primoExplore-theme layout-column layout-align-start-start" layout="column" layout-align="start start" flex="">' +
          '<div layout="column" class="layout-column">' +
          '<md-input-container class="underlined-input md-primoExplore-theme md-input-has-value">' +
          '<label>{{ formName }}</label>' +
          '<md-select ng-model="$ctrl.selectedyear" ng-change="$ctrl.filter()">' +
          '<md-option ng-repeat="year in years" ng-value="{{ year.yeardiff }}">{{ year.numyear }}</md-option>' +
          '</md-select>' +
          '</md-input-container>' +
          '</div>' +
          '</md-card>' +
          '</div>',
        controller: function ($scope, addPubyearAdvsearchOptions) {
          this.$onInit = function () {
            if (angular.isDefined($scope.$parent.$parent)) {
              var advsearch = $scope.$parent.$parent;
              if (angular.isDefined(advsearch.$ctrl)) {
                var search_ctrl = advsearch.$ctrl;
                this.showIt = function() {
                  if (angular.isDefined(search_ctrl.advancedSearchService)) {
                    return !search_ctrl.advancedSearchCollapsed;
                  }
                  return false;
                }
                $scope.formName = addPubyearAdvsearchOptions.formName;
                $scope.years = addPubyearAdvsearchOptions.pubyears;
                this.filter = function (filter) {
                  // md-select ng-model stores the current selected values
                  // for example: ng-model=$ctrl.startDay.selection stores the start day
                  if (this.selectedyear == 0) {
                    search_ctrl.startDay.selection = 'start_day';
                    search_ctrl.startMonth.selection = 'start_month';
                    search_ctrl.startYear = '';
                    search_ctrl.endDay.selection = 'end_day';
                    search_ctrl.endMonth.selection = 'end_month';
                    search_ctrl.endYear = '';
                  }
                  else {
                    try {
                      var today = new Date();
                      var today_year = today.getFullYear();
                      search_ctrl.endYear = String(today_year);
                      var startyear = today_year + this.selectedyear;
                      search_ctrl.startYear = String(startyear);

                      // The values all need to be strings, and the months need to have leading 0s
                      // month and date have the same start and end values
                      search_ctrl.endMonth.selection = String(today.getMonth() + 1).padStart(2, '0');
                      search_ctrl.startMonth.selection = search_ctrl.endMonth.selection;
                      search_ctrl.endDay.selection = String(today.getDate()).padStart(2, '0');
                      search_ctrl.startDay.selection = search_ctrl.endDay.selection;
                    }
                    catch (e) {
                      console.log('Error: ' + e);
                      return '';
                    }
                  }
                }
              }
            }
          }
        }
      })
      .value('addPubyearAdvsearchOptions', {
        formName: 'Publication Year Range',
        pubyears: [
          {
            "numyear": "Any years",
            "yeardiff": 0
          },
          {
            "numyear": "Last year",
            "yeardiff": -1
          },
          {
            "numyear": "Last two years",
            "yeardiff": -2
          }
        ]
      });

})();
