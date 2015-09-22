/*jslint
  bitwise: true, browser: true,
  indent: 4,
  maxerr: 8,
  node: true, nomen: true,
  regexp: true,
  stupid: true,
  todo: true
*/
var count = 0;

function RedditCrawler() {
    'user strict';
    var _ = require('underscore');
    var Promise = require('bluebird');
    var request = Promise.promisify(require('request'));
    var mongoose = require('mongoose');
    var Subreddit = require('./models/Subreddit');
    mongoose.Promise = Promise;
    mongoose.connect('mongodb://localhost/reddit');
    return {
        getSubredditsList : function (after) {
            var url = 'https://www.reddit.com/subreddits/popular/.json?limit=100&after=' + after;
            return request(url, {timeout: 15000}).spread(function(res, body) {
                if (body.match('all of our servers are busy right now')) {
                    console.log(body);
                    return 'Resume';
                } else {
                    return JSON.parse(body)
                }
            }).catch(function(err) {
                return 'Resume';
            })
        },
        saveSubredditToDB : function (subredditData) {
            var subreddit = new Subreddit(subredditData);
            var find = Subreddit.find({name: subredditData.name}).exec();
            return find.then(function(res) {
                if (_.isEmpty(res) && subreddit.subscribers >=2000) {
                    return subreddit.save().then(function(res) {
                        count++;
                        return 'Subreddit Saved'
                    })
                } else {
                    if (res[0] && res[0].subscribers != subreddit.subscribers) {
                        return Subreddit.update({name: res[0].name}, {subscribers: subreddit.subscribers}).then(function(res) {
                            count++;
                            return 'Subreddit Updated';
                        })
                    } else {
                        return 'Duplicate Subreddit';
                    }
                }
            })
        }
    }
}

var Promise = require('bluebird');
var reddit = RedditCrawler();
var subredditGet = function (after) {
    reddit.getSubredditsList(after)
        .then(function (subredditsList) {
            if (subredditsList && subredditsList.data && subredditsList.data.children) {
                return Promise.map(subredditsList.data.children, function(subreddit) {
                    return reddit.saveSubredditToDB(subreddit.data).then(function(res) {
                        return res;
                    });
                }).then(function(result) {
                    return subredditsList;
                })
            } else if (subredditsList === 'Resume') {
                return 'Resume'
            }
        }).then(function(subredditsList) {
            if (subredditsList === 'Resume') {
                setTimeout(subredditGet, 65000, after);
                console.log('after', after);
            } else if (subredditsList && subredditsList.data && subredditsList.data.after) {
                console.log(subredditsList.data.after);
                console.log(count);
                setTimeout(subredditGet, 2000, subredditsList.data.after);
            } else {
                process.exit();
            }
        })
        .catch(function(err) {
            console.log(err.stack);
        });
}

subredditGet();