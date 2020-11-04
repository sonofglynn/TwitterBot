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
    radius : 3000,
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
"Aquarium" : ["225 Baker St, Atlanta, GA 30313", "aquariums"],
"Falcons" : ["1 AMB Dr, Atlanta, GA 30313", "sportsbars"],
"Mercedes Benz stadium" : ["1 AMB Dr, Atlanta, GA 30313", "sportsbars"],
"World of Coke" : ["121 Baker St NW, Atlanta, GA 30313", "museums"],
"World of Coca Cola" : ["121 Baker St NW, Atlanta, GA 30313", "museums"],
"Centennial Olympic Park" : ["265 Park Ave NW, Atlanta, GA 30313", "parks"],
"Botanical Gardens" : ["1345 Piedmont Ave NE, Atlanta, GA 30309", "gardens"],
"Zoo" : ["800 Cherokee Ave SE, Atlanta, GA 30315", "zoos"],
"High Museum of Art" : ["1280 Peachtree St NE, Atlanta, GA 30309", "artmuseums"],
"CNN Center" : ["190 Marietta St NW, Atlanta, GA 30303", "landmarks"],
"Fernbank Museum" : ["767 Clifton Rd NE, Atlanta, GA 30307", "museums"],
"Six Flags" : ["275 Riverside Pkwy SW, Austell, GA 30168", "amusementparks"],
"Fox Theatre" : ["660 Peachtree St NE, Atlanta, GA 30308", "theater"],
"Netherworld" : ["1313 Netherworld Way, Stone Mountain, GA 30087", "hauntedhouses"],
"Music Midtown" : ["400 Park Dr, Atlanta, GA 30306", "festivals"]
}

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
            focusPost.postId = data.statuses[0].id;
            focusPost.postIdStr = data.statuses[0].id_str;
            replyToPost(focusPost);
        }
        updateGetParams();
    });
}

function replyToPost(focusPost) {
    //This is where Amadia uses the updated focusPost object to reply to the post.
    searchRequest["categories"] = queryDict[focusPost.attraction][1];
    //searchRequest["location"] = queryDict[focusPost.attraction][0];
    YelpAPIKey.search(searchRequest).then(response => {
        let result = response.jsonBody.businesses;
        let num = Math.floor(Math.random()*Math.min(9, result.length - 1));
        let recName = result[num]["name"];
        let sender = "@" + focusPost.userId;
        let tweetText = " If you are interested in " + focusPost.attraction + ", then you might also be interested in " + recName + "!";

        if(debug) {
            console.log('Debug mode: ', tweetText);
        } else {
            T.post('statuses/update', {in_reply_to_status_id: focusPost.postId, status: sender + tweetText}, function (err, reply) {
                if (err != null){
                    console.log('Error: ', err);
                } else {
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
