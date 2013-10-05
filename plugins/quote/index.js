/**
 * quote - random quote by nick
 *
 * Plugin dependencies: logger
 *
 */
"use strict";

var moment = require('moment');
var logger = require('../../plugins/logger');
var parser = require('../../lib/messageParser');
var ignore  = require('../../plugins/ignore/');
var quote  = {};

quote.init = function (client) {
    client.addListener('message#', function (nick, channel, text, message) {
        var isAddressingBot = parser.isMessageAddressingBot(text, client.config.nick);
        
        if (isAddressingBot) {
            ignore.isIgnored(message.user + '@' + message.host, function (ignored) {
                if (!ignored) {
                    var words    = parser.splitMessageIntoWords(text);
                    var command  = words[1];
                    
                    // To do:  Generalize and clean these three up
                    if (command === 'quote') {
                        var targetNick = words[2] && words[2].length > 0 ? words[2].trim() : nick;
                        var searchQry  = false;
                        
                        if (words.length >= 3) {
                            searchQry = words.slice(3).join(' ');
                        } 
                        
                        quote.getRandomQuote(targetNick, searchQry, function (result, err) {
                            if (!err && result) {
                                var msg  = '<' + targetNick + '> ';
                                    msg += result.message;
                                
                                client.say(channel, msg);
                            } else {
                                client.say(channel, 'no quotes found');
                            }
                        });                        
                    }
                    else if (command === 'first') {
                        var targetNick = words[2] && words[2].length > 0 ? words[2].trim() : nick;
                        var searchQry  = false;
                        
                        if (words.length >= 3) {
                            searchQry = words.slice(3).join(' ');
                        } 
                        
                        quote.getFirstQuote(targetNick, searchQry, function (result, err) {
                            if (!err && result) {
                                var msg  = '<' + targetNick + '> ';
                                    msg += result.message;
                                
                                client.say(channel, msg);
                            } else {
                                client.say(channel, 'no quotes found');
                            }
                        });                        
                    }
                    else if (command === 'last') {
                        var targetNick = words[2] && words[2].length > 0 ? words[2].trim() : nick;
                        var searchQry  = false;
                        
                        if (words.length >= 3) {
                            searchQry = words.slice(3).join(' ');
                        } 
                        
                        quote.getLastQuote(targetNick, searchQry, function (result, err) {
                            if (!err && result) {
                                var msg  = '<' + targetNick + '> ';
                                    msg += result.message;
                                
                                client.say(channel, msg);
                            } else {
                                client.say(channel, 'no quotes found');
                            }
                        });                        
                    }
                }
            });
        }
    });
};

quote.getRandomQuote = function (targetNick, searchQry, callback) {
    logger.getRandomQuote(targetNick, searchQry, function (result, err) {
        callback(result, err);
    });
};

module.exports = quote;
