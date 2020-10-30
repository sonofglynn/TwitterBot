// Our Twitter library
var Twit = require('twit');

// We need to include our configuration file
var T = new Twit(require('./config.js'));
// For WordNik
var request = require('request');

let atlantaSearch = {q: "#atlanta", count: 1, result_type: "recent"};

var atlantaLocation = ['-84.3042', '33.3638', '-84.1250', '33.5531'];

var stream = T.stream('statuses/filter', { locations: atlantaLocation })
 
stream.on('tweet', function (tweet) {
    let str = "Trump";
    let replacementStr = "Santa Clause";
    if (tweet.text.includes(str)) {
        console.log('THIS POST INCLUDES THE WORD ' + str.toUpperCase() + "!");
        console.log(tweet.text.replace(str, replacementStr));
    }
})


function findInterestedUserPost() {
    T.get('search/tweets', { q: "aquarium", count: 10}, function(err, data, response) {
        
        console.log(data);
    })
}

//findInterestedUserPost();



/*
Ideas for functions:
    Pick up on keywords in posts
        Keywords: Atlanta, aquarium, stadium, restaurant, food, fun
    Filter out users that have never been to Atlanta (unless they say "Atlanta" in one of their posts.)


    If someone DM's, ask them to send me what criteria I want to look for attractions from. ("Text "location", "Attraction: _"", etc.)
*/