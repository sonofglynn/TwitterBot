/*
Search for a post whose user is likely interested in Atlanta attractions.
Try again if the search does not produce a post or if the post contains content we want to avoid.
Use the information from the post to respond with information about Atlanta attractions.
*/
var debug = true;
let Twit = require('twit');
let T = new Twit(require('./config.js'));

// Yelp API
let yelp = require('yelp-fusion');
let YelpAPIKey = yelp.client('bbZfR28tDLZ5JdiU4mJ1LojbOaVcOJB-0ZvUO8bLWnzObq4yNEBzEnsXFad2yNwUbbDJyhxO7xMSIcANFohw9aTN8xRDTZfm2HIRNLq4nZnugUA6u9BWrIKnnkGXX3Yx');
var searchRequest = {
    location: "Atlanta",
    //radius : 3000,
    limit: 10,
};

//Creates FocusPost object to be updated by the postSearch function.
function FocusPost(attraction, userId, postId, postIdStr) {
    this.attraction = attraction;
    this.userId = userId;
    this.postId = postId;
    this.postIdStr = postIdStr;
}
let focusPost = new FocusPost();


//Creates params for get function
let queriesArray = ["Aquarium", "Falcons", "Mercedes Benz stadium", "World of Coke", "World of Coca Cola",
"Centennial Olympic Park", "Botanical Gardens", "Zoo", "High Museum of Art", "CNN Center", "Fernbank Museum", "Six Flags",
"Fox Theatre", "Netherworld", "Music Midtown"];

var queryDict = {
"Aquarium" : ["225 Baker St, Atlanta, GA 30313", "aquariums", 0],
"Falcons" : ["1 AMB Dr, Atlanta, GA 30313", "sportsbars", null],
"Mercedes Benz stadium" : ["1 AMB Dr, Atlanta, GA 30313", "sportsbars", null],
"World of Coke" : ["121 Baker St NW, Atlanta, GA 30313", "museums", 1],
"World of Coca Cola" : ["121 Baker St NW, Atlanta, GA 30313", "museums", 1],
"Centennial Olympic Park" : ["265 Park Ave NW, Atlanta, GA 30313", "parks", 2],
"Botanical Gardens" : ["1345 Piedmont Ave NE, Atlanta, GA 30309", "gardens", 0],
"Zoo" : ["800 Cherokee Ave SE, Atlanta, GA 30315", "zoos", 0],
"High Museum of Art" : ["1280 Peachtree St NE, Atlanta, GA 30309", "artmuseums", 0],
"CNN Center" : ["190 Marietta St NW, Atlanta, GA 30303", "landmarks", 3],
"Fernbank Museum" : ["767 Clifton Rd NE, Atlanta, GA 30307", "museums", null],
"Six Flags" : ["275 Riverside Pkwy SW, Austell, GA 30168", "amusementparks", 3],
"Fox Theatre" : ["660 Peachtree St NE, Atlanta, GA 30308", "theater", 0],
"Netherworld" : ["1313 Netherworld Way, Stone Mountain, GA 30087", "hauntedhouses", 0],
"Music Midtown" : ["400 Park Dr, Atlanta, GA 30306", "festivals", null]
}

var posts = [];

function getRandomArrayVal(array) {
    return array[Math.floor(Math.random() * array.length)];
}
let sinceInfo = "since:2019-10-01";
let atlantaLocation = ['-84.3042', '33.3638', '-84.1250', '33.5531'];
let searchCount = 1;
let getParams = {
    q: getRandomArrayVal(queriesArray),
    locations: atlantaLocation,
    count: searchCount,
    result_type: "recent"
};
function updateGetParams() {
    getParams.q = getRandomArrayVal(queriesArray);
}

//Checks for favorable and unfavorable conditions of post
function avoidsUndesirableContent(text) {
    //avoids politics
    let politicalWords = ["trump", "biden", "election", "democrat", "republican", "vote", "poll", "polling"]
    for (let i = 0; i < politicalWords.length; i++) {
        if (text.toLowerCase().includes(politicalWords[i])) {
            return false;
        }
    }
    return true;
}

//make a recursive function that recurses until it finds an adequate post? - narrow down with search and then run
//tests on it to see if it's actually what we want.
function postSearch() {
    T.get("search/tweets", getParams, function(err, data, response) {
        if (data.statuses.length < 1) { //if no post matches, try again
            setTimeout(postSearch, 100);
        } else if (!avoidsUndesirableContent(data.statuses[0].text)) { //if post contains political words, try again
            console.log("Contains content we want to avoid!");
            setTimeout(postSearch, 100);
        } else { //update focusPost object with the post's information
            focusPost.attraction = getParams.q;
            focusPost.userId = data.statuses[0].user.id;
            focusPost.userName = data.statuses[0].user.screen_name;
            focusPost.postId = data.statuses[0].id;
            focusPost.postIdStr = data.statuses[0].id_str;
            focusPost.date = data.statuses[0].user.created_at;
            replyToPost();
        }
        updateGetParams();
    });
}

function replyToPost() {
    //This is where Amadia uses the updated focusPost object to reply to the post.
    searchRequest["categories"] = queryDict[focusPost.attraction][1];
    YelpAPIKey.search(searchRequest).then(response => {
        var result = response.jsonBody.businesses;
        var num = Math.floor(Math.random()*Math.min(9, result.length - 1));
        while (queryDict[focusPost.attraction][2] == num) {
            console.log("Recommendation and attraction are the same. Recalculating...")
            num = Math.floor(Math.random()*Math.min(9, result.length - 1));
        }
        let recName = result[num]["name"];
        let sender = "@" + focusPost.userName;
        let tweetText = " If you are interested in " + focusPost.attraction +
        ", then you might also be interested in " + recName + "! Learn more here: " + result[num]["url"];

        if (debug) {
            if (posts.includes(focusPost.postIdStr)) {
                console.log("We've already responded to this post.");
            } else {
                posts[posts.length] = focusPost.postIdStr;
                console.log('Debug mode: ' + sender + tweetText);
            }
        } else {
            if (posts.includes(focusPost.postIdStr)) {
                console.log("We've already responded to this post.");
            } else {
                posts[posts.length] = focusPost.postIdStr;
                T.post('statuses/update', {in_reply_to_status_id: focusPost.postId, status: sender + tweetText}, function (err, reply) {
                if (err != null){
                    console.log('Error: ', err);
                } else {
                    console.log('Tweeted: ' + sender + tweetText);
                }
            });
            }
        }
    }).catch(e => {
        console.log(e);
    });
}

//Idea here is to post a randomly generated tweet if there is nothing to reply to
//Has not been implemented yet, but it should work - Figure out time intervals
function scheduledTweet() {
    var commonKeywords = ["amusementparks", "aquariums", "escapegames", "parks",
    "zoos", "movietheaters", "museums", "food", "tour", "shoppingcenters"];
    searchRequest['categories'] = getRandomArrayVal(commonKeywords);
    YelpAPIKey.search(searchRequest).then(response => {
        let result = response.jsonBody.businesses;
        let num = Math.floor(Math.random()*Math.min(9, result.length - 1));
        var name = result[num]["name"];
        var category = searchRequest["categories"];
        var price = result[num]["price"];
        var rating = result[num]["rating"];
        var location = result[num]["location"]["display_address"][0];
        var url = result[num]["url"]

        data = [name, category, price, rating, location];

        var priceQuote;
        var ratingQuote;
        var scheduled = [
            "If you're interested in " + data[1] + ", then you might want to check out " + data[0] + " at " + data[4] + "! Learn more here: " + url,
            data[0] + " is a popular business in Atlanta. If you like " + data[1] + ", head over to " + data[4] + " to see it for yourself! Learn more here: " + url,
            priceQuote,
            ratingQuote
        ];
        if (data[2] == "$") {
            var statements = "If you're looking for " + data[1] + " at a bargain, head to " + data[4] +
            " and visit " + data[0] + "! Learn more here: " + result[num]["url"];
            priceQuote = statements;
        } else if (data[2] == "$$") {
            var statements = "If you're looking for " + data[1] + " at a good price, head to "
            + data[4] + " and visit " + data[0] + "! Learn more here: " + url;
            priceQuote = statements;
        } else if (data[2] == "$$$") {
            var statements = "If you're looking for " + data[1] + " a bit on the pricy, head to " +
            data[4] + " and visit " + data[0] + "! Learn more here: " + url;
            priceQuote = statements;
        } else if (data[2] == "$$$$") {
            var statements = "If you're willing to spend a pretty penny on " + data[1] +
            ", head to " + data[4] + " and visit " + data[0] + "! Learn more here: " + url;
            priceQuote = statements;
        } else {
            priceQuote = getRandomArrayVal(scheduled);
        }
        if (data[3] >= 4.5) {
            var statement = "If you're looking for " + data[1] + ", one of the best places is " +
            data[0] + " at " + data[4] + "! Learn more here: " + url;
            ratingQuote = statements;
        } else if (data[3] >= 3.5) {
            var statement = "If you're looking for " + data[1] + ", one place worth mentioning is " +
            data[0] + " at " + data[4] + "! Learn more here: " + url;
            ratingQuote = statements;
        } else {
            ratingQuote = getRandomArrayVal(scheduled);
        }
        var tweetText = getRandomArrayVal(scheduled) + ;
        while (typeof tweetText != typeof ">:(") {tweetText = scheduled.pick()};

        if(debug) {
            console.log('Debug mode: ', tweetText);
        } else {
            T.post('statuses/update', {status: tweetText }, function (err, reply) {
                if (err != null){
                    console.log('Error: ', err);
                }
                else {
                    console.log('Tweeted: ', tweetText);
                }
            });
        }
    }).catch(e => {
        console.log(e);
    });
}

//implement code.
postSearch();
setInterval(postSearch, 2000);
