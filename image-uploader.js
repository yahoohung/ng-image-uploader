"use strict"

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for (var i = this.length - 1; i >= 0; i--) {
        if (this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}

function validURL(str) {
    var pattern = new RegExp('^(http|https):\/\/[^ "]+$'); // fragment locater
    if (pattern.test(str)) {
        return true;
    } else {
        return false;
    }
}

function validBase64Data(str) {
    var pattern = new RegExp('(data:image\/[a-z]+;base64?,[a-zA-Z0-9\/\=\+  ]*)');
    if (pattern.test(str)) {
        return true;
    } else {
        return false;
    }
}

function getImageUrlContent(str) {
    var pattern = /url\(\"{0,1}([a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*)\"{0,1}\)/i;
    var match = pattern.exec(str);
    if (match) {
        return match[1];
    } else {
        return null;
    }
}

angular.module('mcImageUploader', [])
    .factory('uuid', function() {
        var svc = {
            new: function() {
                function _p8(s) {
                    var p = (Math.random().toString(16) + "000000000").substr(2, 8);
                    return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
                }
                return _p8() + _p8(true) + _p8(true) + _p8();
            },
            empty: function() {
                return '00000000-0000-0000-0000-000000000000';
            }
        };
        return svc;
    })
    .directive('uploadFile', function($window, $compile, uuid) {
        return {
            restrict: 'A',
            scope: {
                iuCycle: '=?iuCycle'
            },
            link: function(scope, element, attrs) {
                var elementId = uuid.new();

                function removeElement(id) {
                    angular.element(document.getElementById(id)).remove();
                }

                scope.insert = function() {

                    scope.c.result('base64', 'viewport').then(function(base64) {
                        var target = angular.element(document.querySelectorAll('[data-id="' + attrs.targetId + '"]')[0]);
                        var formattedSrc, isUrl, isBase64;
                        var isImageTag = target[0] && target[0].tagName === 'IMG' ? true : false;

                        if (isImageTag) {
                            target[0].src = base64;
                        } else {
                            target[0].style.backgroundImage = 'url(' + base64 + ')'
                        }

                        removeElement(elementId);
                    });
                }

                scope.cancel = function() {
                    removeElement(elementId);
                }

                function loadCroppie(target, targetId, data) {

                    var targetOffsetTop = target.offsetTop;
                    var targetOffsetLeft = target.offsetLeft;
                    var targetWidth = target.clientWidth;
                    var targetHeight = target.clientHeight;

                    var newCropArea = '<div id="' + elementId + '" croppie-wrap data-target-id="' + targetId + '" style="z-index: 99;background-color: red;position: absolute; width: ' + targetWidth + 'px;height: ' + targetHeight + 'px; top: ' + targetOffsetTop + 'px; left: ' + targetOffsetLeft + 'px";><div ng-click="insert()" class="image-uploader-insert-btn"></div><div ng-click="cancel()" class="image-uploader-cancel-btn"></div></div>';
                    angular.element(document.querySelectorAll('[data-id="' + targetId + '"]')[0]).after($compile(newCropArea)(scope))
                    var type = typeof scope.iuCycle != 'undefined' && scope.iuCycle ? 'circle' : 'square';

                    var bindData = {
                        viewport: {
                            width: targetWidth,
                            height: targetHeight,
                            type: type
                        },
                        boundary: {
                            width: targetWidth,
                            height: targetHeight
                        },
                        showZoomer: false,
                        enableOrientation: false
                    };


                    scope.c = new Croppie(document.getElementById(elementId), bindData);
                    scope.c.bind({
                        url: data,
                        orientation: 4
                    });
                }

                var onChangeFunc = function($event) {
                    var jQuery = window.jQuery;
                    if (jQuery && jQuery.fn.on) {
                        var newfile = $event.originalEvent.path[0].files[0];
                    } else {
                        var newfile = $event.path[0].files[0];
                    }

                    if (typeof newfile !== 'undefined') {
                        var reader = new FileReader();
                        reader.readAsDataURL(newfile);
                        reader.onload = function() {
                            var target = angular.element(document.querySelectorAll('[data-id="' + attrs.targetId + '"]'))[0];
                            loadCroppie(target, attrs.targetId, reader.result);
                            element.remove();
                        }
                    }
                };

                element.bind('change', onChangeFunc);
            }
        }
    })
    .directive('imageUploader', function(uuid, $compile) {
        return {
            restrict: 'A',
            scope: {
                iuCycle: '=?iuCycle'
            },
            link: function(scope, element, attrs) {
                scope.uploadDialogId = uuid.new();
                scope.id = angular.element(element).attr("data-id");
                if (!scope.id) {
                    scope.id = uuid.new();

                    setTimeout(function() {
                        angular.element(element).attr("data-id", scope.id);
                    }, 0);
                }

                element.on('mouseenter', function() {
                    element.addClass('image-uploader-mouseenter');
                });

                element.on('mouseleave', function() {
                    if (document.getElementById(scope.uploadDialogId)) document.getElementById(scope.uploadDialogId).remove();

                    scope.isClicked = false;
                    element.removeClass('image-uploader-mouseenter');
                });

                element.bind('click', function() {
                    scope.isClicked = true;

                    scope.iuCycle = (typeof scope.iuCycle === 'undefined') || !scope.iuCycle ? false : true;
                    var wrappedHtml = '<input x-upload-file x-iu-cycle="' + scope.iuCycle + '" custom-on-change="uploadFile($event)" id="' + scope.uploadDialogId + '" type="file" accept="image/*" style="visibility:hidden;width:0px;height:0px;" data-target-id="' + scope.id + '" />';
                    element.after($compile(wrappedHtml)(scope));
                    document.getElementById(scope.uploadDialogId).click();
                });

            }
        }
    });