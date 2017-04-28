/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

RED.userSettings = (function() {

    var trayWidth = 700;
    var settingsVisible = false;

    function show(initialTab) {
        if (settingsVisible) {
            return;
        }
        settingsVisible = true;
        var tabContainer;

        var trayOptions = {
            title: "User Settings",
            buttons: [
                {
                    id: "node-dialog-ok",
                    text: RED._("common.label.close"),
                    class: "primary",
                    click: function() {
                        RED.tray.close();
                    }
                }
            ],
            resize: function(dimensions) {
                trayWidth = dimensions.width;
            },
            open: function(tray) {
                var trayBody = tray.find('.editor-tray-body');
                var tabContainer = $('<div></div>',{id:"user-settings-tabs-container"}).appendTo(trayBody);

                $('<ul></ul>',{id:"user-settings-tabs"}).appendTo(tabContainer);
                var tabContents = $('<div></div>',{id:"user-settings-tabs-content"}).appendTo(trayBody);

                createViewPane().hide().appendTo(tabContents);
                RED.keyboard.getSettingsPane().hide().appendTo(tabContents);

                $('<div id="user-settings-tab-palette"></div>').appendTo(tabContents);


                var tabs = RED.tabs.create({
                    id: "user-settings-tabs",
                    vertical: true,
                    onchange: function(tab) {
                        $("#user-settings-tabs-content").children().hide();
                        $("#" + tab.id).show();
                    }
                });
                tabs.addTab({
                    id: "user-settings-tab-view",
                    label: "View"
                });
                tabs.addTab({
                    id: "user-settings-tab-keyboard",
                    label: "Keyboard"
                });
                tabs.addTab({
                    id: "user-settings-tab-palette",
                    label: "Palette"
                });
                if (initialTab) {
                    tabs.activateTab("user-settings-tab-"+initialTab)
                }
            },
            close: function() {
                settingsVisible = false;

                viewSettings.forEach(function(section) {
                    section.options.forEach(function(opt) {
                        var input = $("#user-settings-"+opt.setting);
                        if (opt.toggle) {
                            setSelected(opt.setting,input.prop('checked'));
                        } else {
                            setSelected(opt.setting,input.val());
                        }
                    });
                })


            },
            show: function() {}
        }
        if (trayWidth !== null) {
            trayOptions.width = trayWidth;
        }
        RED.tray.show(trayOptions);
    }

    var viewSettings = [
        {
            title: "Grid",
            options: [
                {setting:"view-show-grid",label:"menu.label.view.showGrid",toggle:true,onchange:"core:toggle-show-grid"},
                {setting:"view-snap-grid",label:"menu.label.view.snapGrid",toggle:true,onchange:"core:toggle-snap-grid"},
                {setting:"view-grid-size",label:"menu.label.view.gridSize",type:"number",default: 20, onchange:RED.view.gridSize}
            ]
        },
        {
            title: "Nodes",
            options: [
                {setting:"view-node-status",label:"menu.label.displayStatus",toggle:true,onchange:"core:toggle-status", selected: true}
            ]
        },
        {
            title: "Other",
            options: [
                {setting:"view-show-tips",label:"menu.label.showTips",toggle:true,default:true,onchange:"core:toggle-show-tips"}
            ]
        }
    ];

    var allSettings = {};

    function createViewPane() {

        var pane = $('<div id="user-settings-tab-view" class="node-help"></div>');

        viewSettings.forEach(function(section) {
            $('<h3></h3>').text(section.title).appendTo(pane);
            section.options.forEach(function(opt) {
                var initialState = RED.settings.get(opt.setting);
                var row = $('<div class="user-settings-row"></div>').appendTo(pane);
                var input;
                if (opt.toggle) {
                    input = $('<label for="user-settings-'+opt.setting+'"><input id="user-settings-'+opt.setting+'" type="checkbox"> '+RED._(opt.label)+'</label>').appendTo(row).find("input");
                    input.prop('checked',initialState);
                } else {
                    $('<label for="user-settings-'+opt.setting+'">'+RED._(opt.label)+'</label>').appendTo(row);
                    $('<input id="user-settings-'+opt.setting+'" type="'+(opt.type||"text")+'">').appendTo(row).val(initialState);
                }
            });
        })
        return pane;
    }

    function setSelected(id, value) {
        var opt = allSettings[id];
        RED.settings.set(opt.setting,value);
        var callback = opt.onchange;
        if (typeof callback === 'string') {
            callback = RED.actions.get(callback);
        }
        if (callback) {
            callback.call(opt,value);
        }
    }
    function toggle(id) {
        var opt = allSettings[id];
        var state = RED.settings.get(opt.setting);
        setSelected(id,!state);
    }


    function init() {
        RED.actions.add("core:show-user-settings",show);
        RED.actions.add("core:show-help", function() { show('keyboard')});

        viewSettings.forEach(function(section) {
            section.options.forEach(function(opt) {
                allSettings[opt.setting] = opt;
                if (opt.onchange) {
                    var value = RED.settings.get(opt.setting);
                    if (value === null && opt.hasOwnProperty('default')) {
                        value = opt.default;
                        RED.settings.set(opt.setting,value);
                    }

                    var callback = opt.onchange;
                    if (typeof callback === 'string') {
                        callback = RED.actions.get(callback);
                    }
                    if (callback) {
                        callback.call(opt,value);
                    }
                }
            });
        });

    }
    return {
        init: init,
        toggle: toggle
    };
})();