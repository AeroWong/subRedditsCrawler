var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('mongoose-times');

var subreddit = new Schema ({
    "display_name" :String,
    "name": String,
    "lang": String,
    "title": String,
    "subscribers": Number,
    "url": String,
    "public_description": String,
    "submission_type": String,
    "comment_score_hide_mins": String
});

subreddit.plugin(timestamps, { created: "created_at", lastUpdated: "updated_at" });

var Subreddit = mongoose.model('Subreddit', subreddit);

module.exports = Subreddit;