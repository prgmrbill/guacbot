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
var hmp    = require('../../lib/helpMessageParser');
var ignore = require('../../plugins/ignore/');
var hbs    = require('handlebars');
var moment = require('moment');
var _      = require('underscore');
var quote  = {
    line       : 1,
    quotes     : {}
};

quote.reload = function (options) {
    quote.loadConfig(options);
};

quote.loadConfig = function (options) {
    quote.wholeConfig = options.config;
};

quote.init = function (options) {
    var client = options.client;
    
    quote.loadConfig(options);
    
    options.ame.on('actionableMessageAddressingBot', function (info) {
        switch (info.command) {
            case 'quote':
                quote.line     = 1;
                // Use this to build a map of number -> log id
                quote.quotes   = {};
                var targetNick = info.words[2] && info.words[2].length > 0 ? info.words[2].trim() : info.nick;
                var searchQry  = false;
                
                if (info.words.length >= 3) {
                    searchQry = info.words.slice(3).join(' ');
                } 
                
                var quoteCallback = function (result, err) {
                    if (!err && result) {
                        var msg  = quote.getQuoteTemplate({
                            nick       : targetNick,
                            message    : result.message,
                            date       : quote.getFormattedDate(result.ts),
                            searchQuery: searchQry,
                            line       : quote.line
                        });
                        
                        client.say(info.channel, msg);
                        
                        quote.quotes[quote.line] = {
                            id     : result.id,
                            channel: info.channel
                        };          
                        quote.line++;
                        
                    } else {
                        client.say(info.channel, 'No quotes found');
                    }
                };
                
                logger.getRandomQuote({
                    nick       : targetNick,
                    channel    : info.channel,
                    searchQuery: searchQry,
                    callback   : quoteCallback,
                    message    : info.message
                });
                
            break;
            
            case 'seen':
                var message    = '';
                var words      = info.words;
                var command    = words[1];
                var nick       = words[2];
                var limit      = words[3];                
                var notSeenMsg = hmp.getMessage({
                    config  : quote.wholeConfig,
                    plugin  : 'quote',
                    message : ['error'],
                    data    : {}
                });
                
                if (nick.length > 0) {
                    var seenCB = function (rows, err) {
                        if (rows) {
                            quote.line     = 1;
                            // Use this to build a map of number -> log id
                            quote.quotes   = {};
                            
                            _.each(rows, function (k, j) {
                                message = quote.getQuoteTemplate({
                                    nick       : rows[j].nick,
                                    message    : rows[j].message,
                                    date       : quote.getFormattedDate(rows[j].ts),
                                    line       : quote.line
                                });
                                
                                client.say(info.channel, message);
                                
                                quote.quotes[quote.line] = {
                                    id     : rows[j].id,
                                    channel: info.channel
                                };
                                quote.line++;
                            }); 
                        } else {
                            client.say(info.channel, notSeenMsg);
                        }
                    };
                    
                    var seenInfo = {
                        nick    : nick,
                        channel : info.channel,
                        message : info.message,
                        callback: seenCB,
                        limit   : limit
                    };
                    
                    logger.getLastMessage(seenInfo);
                }
            break;
            
            case 'explain':
                var context = info.words.slice(2);
                var query   = parseInt(context[0], 10) || 1;
                
                console.log('ctx: ', context);
                console.log('query: ', query);
                
                if (typeof quote.quotes[query] !== 'undefined') {
                    var q         = quote.quotes[query];
                    var contextID = q.id;
                    
                    var callback  = function (rows) {
                        _.each(rows, function (k, j) {
                            msg = quote.getQuoteTemplate({
                                nick       : rows[j].nick,
                                message    : rows[j].message,
                                date       : quote.getFormattedDate(rows[j].ts),
                                line       : quote.line,
                                contextID  : contextID,
                                id         : rows[j].id
                            });
                            
                            client.say(info.channel, msg);
                            
                            quote.quotes[quote.line] = {
                                id     : rows[j].id,
                                channel: info.channel
                            };
                            
                            quote.line++;
                        });
                    };
                    
                    logger.getContext({
                        id      : contextID,
                        callback: callback,
                        channel : q.channel
                    });
                    
                } else {
                    client.say(info.channel, 'Error, lol');
                }
            break;
            
            /**
             * Finds all mentions of a specific phrase with an optional
             * limit on results
             *
             */
            case 'mention':
            case 'mentionall':
            case 'rmention':
                // Search query is everything after the first two words, which are the bot's nick
                // and the 'mention' command
                // n (0) mention (1) query (2)
                var query    = info.words.slice(2);
                var channel  = info.channel;
                quote.line   = 1;
                // Use this to build a map of number -> log id
                quote.quotes = {};
                
                if (info.words[2].charAt(0) === '#') {
                    channel = info.words[2];
                    query   = info.words.slice(3);
                }
                
                var minlen        = 3;
                
                // The limit should be the last integer in the array of words
                var mightBeALimit = _.last(info.words);
                var limit         = 1;
                
                // If the last word looks like an integer, then the query should be everything
                // from the third word in the message, up to right before the limit. Meaning,
                // we shouldn't include the limit in the search query.
                if (parseInt(mightBeALimit, 10) > 1) {
                    query = query.slice(0, query.length - 1);
                    limit = mightBeALimit;
                }
                
                // Finally, join the word array by spaces 
                query = query.join(' ');
                
                if (query.length >= minlen) {
                    var msg, fmtDate;
                    
                    var cb = function (row) {
                        if (row) {
                            msg = quote.getQuoteTemplate({
                                nick       : row.nick,
                                message    : row.message,
                                date       : quote.getFormattedDate(row.ts),
                                searchQuery: query,
                                line       : quote.line
                            });
                            
                            client.say(info.channel, msg);
                            
                            quote.quotes[quote.line] = {
                                id     : row.id,
                                channel: channel
                            };       
                            quote.line++;
                            
                        } else {
                            client.say(info.channel, 'No quotes found');
                        }
                    };
                    
                    if (info.command === 'mentionall') {
                        channel = null;
                    }
                    
                    var noResultsCB = function () {
                        client.say(info.channel, 'No quotes found');
                    };
                    
                    logger.getMentions({
                        nick       : info.nick,
                        channel    : channel,
                        searchQuery: query,
                        limit      : limit,
                        callback   : cb,
                        message    : info.message,
                        order      : info.command === 'rmention' ? 'RAND()' : 'ts',
                        noResultsCB: noResultsCB
                    });
                    
                } else {
                    client.say(info.channel, 'Search query must be at least ' + minlen + ' characters');
                }
            break;
            
            case 'first':
                if (info.words[2] === 'mention') {
                    var query    = info.words.slice(3).join(' ');
                    var minlen   = 3;
                    quote.line   = 1;
                    // Use this to build a map of number -> log id
                    quote.quotes = {};
                
                    if (query.length >= minlen) {
                        var firstMentionCallback = function (result) {
                            
                            if (result && result.message !== info.message) {
                                var msg  = quote.getQuoteTemplate({
                                    nick       : result.nick,
                                    message    : result.message,
                                    date       : quote.getFormattedDate(result.ts),
                                    searchQuery: query,
                                    line       : quote.line
                                });
                                
                                client.say(info.channel, msg);
                                
                                quote.quotes[quote.line] = {
                                    id     : result.id,
                                    channel: info.channel
                                };                            
                                quote.line++;
                            } else {
                                client.say(info.channel, 'No quotes found');
                            }
                        };
                        
                        logger.getFirstMention({
                            searchQuery: query,
                            channel    : info.channel,
                            message    : info.message,
                            callback   : firstMentionCallback,
                            line       : quote.line
                        });
                        
                    } else {
                        client.say(info.channel, 'Search query must be at least ' + minlen + ' characters');
                    }
                    
                } else if (info.words[2] === 'quote') {
                    var targetNick = info.words[3] && info.words[3].length > 0 ? info.words[3].trim() : nick;
                    quote.line     = 1;
                    // Use this to build a map of number -> log id
                    quote.quotes   = {};
                    
                    var quoteCB    = function (result, err) {
                        if (err) {             
                            console.log(err);
                        }
                        
                        if (!err && result) {
                            var msg  = quote.getQuoteTemplate({
                                nick   : targetNick,
                                message: result.message,
                                date   : quote.getFormattedDate(result.ts),
                                line   : quote.line
                            });
                            
                            client.say(info.channel, msg);
                            
                            quote.quotes[quote.line] = {
                                id     : result.id,
                                channel: info.channel
                            };
                            quote.line++;
                        } else {
                            client.say(info.channel, 'No quotes found');
                        }
                    };
                    
                    logger.getRandomQuote({
                        nick    : targetNick,
                        channel : info.channel,
                        callback: quoteCB,
                        message : info.message
                    });
                }
            break;
            
            case 'last':
                if (info.words[2] === 'mention') {
                    var query    = info.words.slice(3).join(' ');
                    var minlen   = 3;
                    quote.line   = 1;
                    // Use this to build a map of number -> log id
                    quote.quotes = {};
                    
                    if (query.length >= minlen) {
                        var lastMentionCallback = function (result, err) {
                            if (!err && result) {
                                var msg  = quote.getQuoteTemplate({
                                    nick       : result.nick,
                                    message    : result.message,
                                    date       : quote.getFormattedDate(result.ts),
                                    searchQuery: query,
                                    line       : quote.line
                                });
                                
                                client.say(info.channel, msg);
                                
                                quote.quotes[quote.line] = {
                                    id     : result.id,
                                    channel: info.channel
                                };                      
                                quote.line++;
                            } else {
                                client.say(info.channel, 'No quotes found');
                            }
                        };
                        
                        logger.getLastMention({
                            searchQuery: query,
                            channel    : info.channel,
                            callback   : lastMentionCallback,
                            message    : info.message,
                            line       : quote.line
                        });
                    } else {
                        client.say(info.channel, 'Search query must be at least ' + minlen + ' characters');
                    }
                    
                } else if (info.words[2] === 'quote') {                
                    var targetNick = info.words[3] && info.words[3].length > 0 ? info.words[3].trim() : nick;
                    quote.line     = 1;
                    // Use this to build a map of number -> log id
                    quote.quotes   = {};
                
                    var lastMessageCallback = function (result, err) {
                        if (err) {                            
                            console.log(err);
                        }
                        
                        if (!err && result) {
                            var msg  = quote.getQuoteTemplate({
                                nick   : targetNick,
                                message: result.message,
                                date   : quote.getFormattedDate(result.ts),
                                line   : quote.line
                            });
                            
                            client.say(info.channel, msg);
                            
                            quote.quotes[quote.line] = {
                                id     : result.id,
                                channel: info.channel
                            };                       
                            quote.line++;
                                
                        } else {
                            client.say(info.channel, 'No quotes found');
                        }
                    };
                    
                    logger.getLastMessage({
                        nick    : targetNick,
                        channel : info.channel,
                        message : info.message,
                        callback: lastMessageCallback,
                        line    : quote.line
                    });
                }
            break;
        }
    });
};

quote.getQuoteTemplate = function (info) {
    var data       = info;
    var lineNumber = '[{{{line}}}] ';
    
    var messages = hmp.getMessages({
        messages: ['quote', 'explain'],
        plugin  : 'quote',
        config  : quote.wholeConfig,
        data    : info
    });
    
    // Bold search query
    if (typeof info.searchQuery !== 'undefined') {
        var boldQry  = "\u0002" + data.searchQuery + "\u0002";
        var re       = new RegExp(data.searchQuery, 'gi');
        var msg      = data.message.replace(re, boldQry);
        data.message = msg;
    }
    
    var quoteTpl     = '{{{date}}} <\u0002{{{nick}}}\u0002> {{{message}}}';
    
    // If we're doing explain, mark the line for which we were looking
    if (typeof info.contextID !== 'undefined') {
        if (info.contextID === info.id) {
            quoteTpl     = "\u000304-> "   + quoteTpl + "\u000304";
        }
    } else {
        // only line numbers for non-explain
        quoteTpl   = lineNumber + quoteTpl
    }
    
    var tpl        = hbs.compile(quoteTpl);
    
    return tpl(data);
};

quote.getFormattedDate = function (timestamp) {
    return moment(timestamp).format("MM/DD/YY hh:mmA");
};

quote.getRandomQuote = function (targetNick, searchQry, callback) {
    logger.getRandomQuote(targetNick, searchQry, function (result, err) {
        callback(result, err);
    });
};

module.exports = quote;
