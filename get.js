/*
Search for a post whose user is likely interested in Atlanta attractions.
Try again if the search does not produce a post or if the post contains content we want to avoid.
Use the information from the post to respond with information about Atlanta attractions.
*/

let Twit = require('twit');
let T = new Twit(require('./config.js'));

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
            replyToPost();
        }
        updateGetParams();
    });
}

function replyToPost() {
    //This is where Amadia uses the updated focusPost object to reply to the post.
}

//implement code.
postSearch();
setInterval(postSearch, 2000);