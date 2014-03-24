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
var hmp = {};

/**
 * Adds a conditional {{#compare val "=" val2}}{{/compare}}
 * allows for comparing values better than {{#if}}
 * 
 * Note: Not sure about the syntax, whether it 
 * should be hbs.registerHelper 
 * or Handlebars.registerHelper
 */
Handlebars.registerHelper('compare', function (lvalue, operator, rvalue, options) {

    var operators, result;
    
    if (arguments.length < 3) {
        throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
    }
    
    if (options === undefined) {
        options = rvalue;
        rvalue = operator;
        operator = "===";
    }
    
    operators = {
        '==': function (l, r) { return l == r; },
        '===': function (l, r) { return l === r; },
        '!=': function (l, r) { return l != r; },
        '!==': function (l, r) { return l !== r; },
        '<': function (l, r) { return l < r; },
        '>': function (l, r) { return l > r; },
        '<=': function (l, r) { return l <= r; },
        '>=': function (l, r) { return l >= r; },
        'typeof': function (l, r) { return typeof l == r; }
    };
    
    if (!operators[operator]) {
        throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
    }
    
    result = operators[operator](lvalue, rvalue);
    
    if (result) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }

});


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
