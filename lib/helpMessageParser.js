/**
 * Help Message Parser - most plugins have messages for help or usage. 
 * 
 * - Messages are Handlebars templates
 *
 * - Each plugin's messages are in the plugin config in a
 *   property called "messages"
 *
 * - This property should be an array. By making it an array, we can choose randomly if we want
 *   more than one possible message to be chosen.
 *
 * - Some variables are available:
 *   - {{{botNick}}} : bot's current nick
 *   - {{{nick}}}}   : the nick addressing the bot
 *   - {{{channel}}} : current channel
 *
 *
 */
"use strict";
var hbs = require('handlebars');
var hbh  = require('./hbHelpers');
var hmp = {};

//Loads all helpers from hbHelpers.js
hbh.getHelpers();

hmp.getMessages = function (options) {
    var msg, curPlugin;
    var messages = {};
    
    for (var j = 0; j < options.messages.length; j++) {
        curPlugin = options.messages[j];
        msg       = hmp.getMessage({
            plugin : options.plugin,
            message: curPlugin,
            data   : options.data,
            config : options.config
        });
        
        messages[curPlugin] = msg;
    }
    
    return messages;
};

/**
 * options = {
 *     plugin: 'weather',
 *     message: 'usage'
 *
 * }
 *
 */
hmp.getMessage = function (options) {
    var output      = '';
    var messages    = options.config.plugins[options.plugin].messages[options.message];
    
    if (messages) {    
        var msg         = messages[Math.floor(Math.random() * messages.length)];
        var tpl         = hbs.compile(msg);
        var parsed      = tpl(options.data || {});        
        output          = parsed;
        
        //console.log(options.data);
    } else {
        console.log('msg not found: ', options);
    }
    
    return parsed;
};

module.exports = hmp;
