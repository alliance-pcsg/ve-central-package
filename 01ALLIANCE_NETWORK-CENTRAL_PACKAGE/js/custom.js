/*
* 
*	Orbis Cascade Alliance Central Package
*	Last updated: 2022-08-22
*	
* Included customizations:
*   Insert custom action (updated 2018-11-07)
*   Custom model window for peer-review and open access badges (updated 2019-12-26)
*   Toggle advanced search in mobile display (updated 2018-10-09)
*   Favorite signin warning (updated 2021-01-19)
*   Enlarge Covers (Updated 2021-12-06)
*   Text a Call Number (Updated 2022-05-23)
*   External Search (Updated 2022-02-04)
*   Force Login (Added 2020-10-22)
*   eShelf Links (Added 2020-11-03)
*   Hathi Trust Availability (Updated 2022-01-06)
*   Availability facet counts (Added 2022-03-23)
*   Hide Unwanted 856 Links (Added 2022-04-20)
*   Show NZ and IZ MMS IDs (Added 2022-08-11)
*/


(function(){
  "use strict";
  'use strict';

  var app = angular.module('centralCustom', ['angularLoad']);
  
  /* Temporary placeholder toggleInstitutions module to prevent local packages from breaking */
  angular.module('toggleInstitutions', []);

/* Custom action Begins */
  
  angular.module('customActions', []);

/* eslint-disable max-len */
angular.module('customActions').component('customAction', {
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
angular.module('customActions').factory('customActions', function () {
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
  

// Begin Toggle Advanced Fields module //
angular
.module('toggleAdvancedFields', [])
.component('toggleAdvancedFields', {
    template: '<md-button class="md-raised" ng-click="$ctrl.toggleFields()" id="advancedFieldsButton" aria-controls="advancedFields" aria-expanded=false aria-label="Show/Hide Advanced Fields">{{$ctrl.advancedFieldsButtonLabel}}</md-button>',
    controller: function ($scope, $window, advancedFieldsOptions) {
        this.$onInit = function () {

            // Declare button and field variables
            this.button = angular.element(document.getElementById('advancedFieldsButton'));
            this.fields = angular.element(document.querySelector('prm-advanced-search md-card:nth-child(2)'));
            this.fields.attr('id', 'advancedFields');

            // Show/hide button and fields on initialization and window resize
            this.setInitDisplay();
            if (advancedFieldsOptions.show_button_for == 'mobile') {
                angular.element($window).bind('resize', function () {
                    $scope.$ctrl.setInitDisplay();
                });
            }

        }

        // Set initial display of button and fields based on default options and window size
        this.setInitDisplay = function () {
            if (advancedFieldsOptions.show_button_for == 'all' || $window.innerWidth < 600) {
                this.showHideFields('hide');
                this.button.removeClass('hide');
            }
            else {
                this.showHideFields('show');
                this.button.addClass('hide');
            }
        }

        // Toggle fields on button click
        this.toggleFields = function () {
            this.fields.hasClass('hide') ? this.showHideFields('show') : this.showHideFields('hide');
        }

        // Show or hide fields
        this.showHideFields = function (show_hide) {
            switch (show_hide) {
                case 'show':
                    this.fields.removeClass('hide');
                    this.advancedFieldsButtonLabel = advancedFieldsOptions.hide_label;
                    this.button.attr('aria-expanded', true);
                    break;
                case 'hide':
                    this.fields.addClass('hide');
                    this.advancedFieldsButtonLabel = advancedFieldsOptions.show_label;
                    this.button.attr('aria-expanded', false);
                    break;
            }
        }

    }
});
// Set default values for toggleAdvancedFields module
// show_button_for can be 'mobile' or 'all'
angular.module('toggleAdvancedFields').value('advancedFieldsOptions', {
    show_button_for: 'mobile',
    show_label: 'Show Additional Fields',
    hide_label: 'Hide Additional Fields'
});  

/* End toggle advanced fields */


//* Begin Favorites Warning module  *//
angular
.module('showFavoritesWarning', [])
.run(["$rootScope", function ($rootScope) {
    $rootScope.view = false;
}])
.value('globalFavVars', {
    favWarnBarTxt: 'Sign in to make your favorites list permanent',
    favWarnModalTitleText: 'Sign in to make your favorites list permanent',
    favWarnModalContentText: 'You can create a favorites list as a Guest, but to save a list permanently you must be signed in.',
})
.factory("favSession", function ($window, $rootScope) {
    angular.element($window).on('storage', function (event) {
        if (event.key === 'showFavWarning') {
            $rootScope.$apply();
        }
    });
    /*Functions for setting and getting session data*/
    return {
        setData: function (val) {
            $window.sessionStorage && $window.sessionStorage.setItem('showFavWarning', val);
            return this;
        },
        getData: function () {
            return $window.sessionStorage && $window.sessionStorage.getItem('showFavWarning');
        }
    };
})
.controller('favOverlayCtrl', function ($scope, $mdDialog, $rootScope, favSession, globalFavVars) {
    $scope.status = ' ';
    $scope.customFullscreen = false;
    $scope.favWarning = favSession.getData();  //Pull session data to determine if favorites warning modal should be displayed
    var icon_definition = $scope.$parent.$parent.$ctrl.iconDefinition;
    this.isPinIcon = false;
    if(icon_definition === 'prm_pin')
    {
      this.isPinIcon = true;
    }

    /*Upon initialization of the app the favSession value will be null, so we need to give it a value
	based on global variables set by the institution in their custom.js file*/
    if ($scope.favWarning === null) {
        favSession.setData('true');
        $scope.favWarning = favSession.getData();
    }
    /*If the user is a guest then the isLoggedIn variable is set to 'false'*/
    var rootScope = $scope.$root;
    var uSMS = rootScope.$$childHead.$ctrl.userSessionManagerService;
    var jwtData = uSMS.jwtUtilService.getDecodedToken();
    if (jwtData.userGroup === "GUEST") {
        $scope.isLoggedIn = 'false';
    }
    else {
        $scope.isLoggedIn = 'true';
    }
    /*Set the rootScope view variable depending on session data, if the user is logged in*/
    if ($scope.favWarning === 'true' && $scope.isLoggedIn === 'false') {
        $rootScope.view = true;
    }

    $scope.favWarningOnClick = function () {
        favSession.setData('false');
        $scope.favWarning = favSession.getData();
        $rootScope.view = false;
    };
    /*Function to display favorites warning modal when favorites icon is clicked*/
    $scope.showFavWarningModal = function (ev) {
        $mdDialog.show({
            template: '<md-dialog>' +
                           '<md-dialog-content>' +
                               '<md-toolbar id="fav-modal-header">' +
                                   '<div class="md-toolbar-tools">' +
                                       '<h2 class="flex"><p id="fav-modal-header-text" ng-bind-html="favWarnModalTitleDisplay"></p></h2>' +
                                   '</div>' +
                               '</md-toolbar>' +
                               '<div id="fav-modal-content" class="md-dialog-content">' +
                                   '<p id="fav-modal-content-text" ng-bind-html="favWarnModalContentDisplay"></p>' +
                                   '<p style="text-align: center">' +
                                       '<prm-authentication>' +
                                           '<button class="button-with-icon zero-margin md-button md-primoExplore-theme md-ink-ripple" type="button" ng-transclude="">' +
                                               '<prm-icon icon-type="svg" svg-icon-set="primo-ui" icon-definition="sign-in">' +
                                                   '<md-icon md-svg-icon="primo-ui:sign-in" alt="" class="md-primoExplore-theme" aria-hidden="true"></md-icon>' +
                                               '</prm-icon>' +
                                               '<span translate="eshelf.signin.title">Sign in</span>' +
                                           '</button>' +
                                       '</prm-authentication>' +
                                       '<button class="dismiss-alert-button zero-margin md-button md-primoExplore-theme md-ink-ripple button-with-icon" ng-click="favModalClose(); favWarningOnClick()">' +
                                           '<prm-icon icon-type="svg" svg-icon-set="navigation" icon-definition="ic_close_24px">' +
                                               '<md-icon md-svg-icon="navigation:ic_close_24px" alt="" class="md-primoExplore-theme" aria-hidden="true"></md-icon>' +
                                           '</prm-icon>' +
                                           'DISMISS' +
                                       '</button></p>' +
                               '</div>' +
                           '</md-dialog-content>' +
                       '</md-dialog>',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true,
            fullscreen: $scope.customFullscreen,
            controller: function favModalDialogCtrl($scope, $mdDialog, $state, favSession, globalFavVars) {
                $scope.favModalClose = function () {
                    $mdDialog.hide();
                }
                $scope.favWarnModalTitleDisplay = globalFavVars.favWarnModalTitleText;
                $scope.favWarnModalContentDisplay = globalFavVars.favWarnModalContentText;
            }
        })
    };
})
.component('favOverlay', {  //This component is an element that sits over the favorites icon when the modal warning functionality is enabled.
    controller: 'favOverlayCtrl',
    template: '<button style="cursor: pointer; background: transparent; border: none; width: 41px; height: 41px; margin: -31px 0px 0px -21px; position: absolute" ng-if="$ctrl.isPinIcon" ng-disabled="$ctrl.isFavoritesDisabled()" ng-show="$root.view" ng-click="showFavWarningModal($event); favWarningOnClick()"></button>'
});

//* End Favorites signin warning  *//


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

// SMS action
  angular
    .module('smsAction', [])
    .component('smsAction', {
      require: {
        prmActionCtrl: '^prmActionList'
      },
      controller: function controller($scope, $location, $http, $mdDialog, customActions, smsActionOptions) {
        var _this = this;
        this.$onInit = function () {
          
          // Remove action if it exists from a previous record
          customActions.removeAction({name: 'sms_action'}, _this.prmActionCtrl);
          
          // Get item from control
          var item = $scope.$ctrl.prmActionCtrl.item;
          
          // If a holding is defined, add the action
          if (!(angular.isUndefined(item.delivery.holding) || item.delivery.holding === null) && item.delivery.holding.length > 0) {
            
            // Get VID
            var vid = angular.uppercase($location.search().vid);
 
            // Get title
            var title = encodeURIComponent(item.pnx.display.title[0]);
            
            // Get MMS ID
            var mms_id = item.pnx.display.mms[0];
            
            // Get holdings
            var holdings = new Array();
            for (var h = 0; h < item.delivery.holding.length; h++) {
              var holding = item.delivery.holding[h];
              holdings.push(holding.libraryCode + ';' + holding.subLocation.replace(/;/g,'%3B') + ';' + holding.callNumber);
            }
            var joined_holdings = encodeURIComponent(holdings.join('|'));

            // If holdings were set successfully, add action
            if (holdings.length > 0) {
              _this.sms_action = {
                name: 'sms_action',
                label: smsActionOptions.label,
                index: smsActionOptions.index,
                icon: smsActionOptions.icon,
                onToggle: _this.showSmsForm(vid, title, mms_id, joined_holdings)
              };
              customActions.addAction(_this.sms_action, _this.prmActionCtrl);
            }
          }
        }
        
        // SMS dialog
        this.showSmsForm = function showSmsForm(vid, title, mms_id, joined_holdings) {
          return function() {
            
            // Get form asynchronously
            $http({
              method: "GET",
              url: 'https://pcsg.orbiscascade.org/sms/form.php?vid=' + vid + '&title=' + title + '&holdings=' + joined_holdings + '&libraries=' + smsActionOptions.libraries
            })
            .then(
              function(response) {
                // Show dialog
                $mdDialog.show({
                  controller: smsFormController,
                  template: '<md-dialog aria-label="' + smsActionOptions.label + '"><md-dialog-content><md-toolbar><div class="md-toolbar-tools"><h2 class="flex">' + smsActionOptions.label + '</h2><md-button class="md-icon-button" ng-click="closeSmsForm()"><md-tooltip>Close Window</md-tooltip><md-icon md-svg-icon="primo-ui:close" aria-label="Close form window"></md-button></div></md-toolbar><div id="smsFormContent" class="md-dialog-content">' + response.data + '</div></md-dialog-content></md-dialog>',
                  clickOutsideToClose: true,
                  escapeToClose: true
                });
              },
              function(error_response) {
                console.log(error_response);
              }
            );
              
            function smsFormController($scope, $mdDialog) {

              // Submit form asynchronously
              $scope.sendText = function () {
                if (!angular.isUndefined($scope.smsPhone) && !angular.isUndefined($scope.smsProvider)) {
                  // Get note
                  var smsNote = $scope.smsNote;
                  if (angular.isUndefined(smsNote)) {
                    smsNote = '';
                  }
                  // Get link option
                  var smsLink = document.getElementById('smsLink').checked;
                  // Get details
                  var smsItemDetails = document.getElementById('smsItemDetails').value;
                  // Send request
                  $http({
                    method: 'GET',
                    url: 'https://pcsg.orbiscascade.org/sms/send.php?vid=' + vid + '&title=' + title + '&mms_id=' + mms_id + '&details=' + smsItemDetails + '&phone=' + $scope.smsPhone + '&provider=' + $scope.smsProvider + '&note=' + smsNote + '&include_link=' + smsLink
                  })
                  .then(
                    // Display confirmation
                    function(response) {
                      document.getElementById('smsFormContent').innerHTML = response.data;
                    },
                    function(error_response) {
                      console.log(error_response);
                    }
                  );
                }
                else {
                  document.getElementById('smsError').style.display = "block";
                }
              };
              
              // Close form
              $scope.closeSmsForm = function () {
                $mdDialog.hide();
              };
              
            }
            
          };
        }
      }
    })
    .value('smsActionOptions', {
      label: 'Text Call Number',
      index: 0,
      icon: {
        icon: 'ic_textsms_24px',
        iconSet: 'communication',
        type: 'svg'
      },
      libraries: '',
      institution: ''
    });

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


﻿//* Begin Hathi Trust Availability *//
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

            var isOclcNum = function (value) {
                return value.match(/^(\(ocolc\))?\d+$/i);
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
        ignoreCopyright: true,
        entityId: '',
        excludeNotLocal: true
    });
    //* End Hathi Trust Availability *//

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

})();
