/*

Sample Twitter Bot, using Wordnik (based on code by I. Bogost)

NOTE: this script requires the Node.js modules inflection, request, wordfilter, and twit

*/
"use strict";
// DEBUG
var debug = true;		// if we don't want it to post to Twitter! Useful for debugging!

// Wordnik stuff
var yelp = require('yelp-fusion');
var YelpAPIKey = yelp.client('bbZfR28tDLZ5JdiU4mJ1LojbOaVcOJB-0ZvUO8bLWnzObq4yNEBzEnsXFad2yNwUbbDJyhxO7xMSIcANFohw9aTN8xRDTZfm2HIRNLq4nZnugUA6u9BWrIKnnkGXX3Yx');
/*var inflection = require('inflection');
var pluralize = inflection.pluralize;
var capitalize = inflection.capitalize;
var singularize = inflection.singularize;*/
var searchRequest = {
    location: "Atlanta",
    limit: 10,
};

var fs = require('fs');
let rawData = fs.readFileSync('categories.json');
let categories = JSON.parse(rawData);
var catDict = {};

var index = 0;
while (index < categories.length) {
    if ((Object.keys(categories[index]).includes("country_whitelist")) && !(categories[index]["country_whitelist"].includes("US"))) {
        index++;
    } else if ((Object.keys(categories[index]).includes("country_blacklist")) && (categories[index]["country_blacklist"].includes("US"))) {
        index++;
    } else {
        if (categories[index]["parents"][0] != null) {
            if (catDict[categories[index]["parents"][0]] == null) {
                catDict[categories[index]["parents"][0]] = [];
            }
            catDict[categories[index]["parents"][0]].push(categories[index]);
        }
        index++;
    }
}
var keys = Object.keys(catDict);
//console.log(catDict.food);

var commonKeywords = ["amusementparks", "aquariums", "escapegames", "parks", "zoos", "movietheaters", "museums", "spas", "artclasses", "food", "tour"];
/*var parentAliases = [];
var temp = [];
var children = [];
var index = 0;
while (index < categories.length) {
    if (categories[index]["parents"][0] == null) {
        parentAliases.push(categories[index]["alias"]);
    } else {
        temp.push(categories[index]);
    }
    index++;
}
//console.log(temp.every(x => parentAliases.includes(x["parents"][0])));

while (!(temp.every(x => parentAliases.includes(x["parents"][0])))) {
    var index = 0;
    var temp2 = temp;
    var newParents = [];
    temp = [];
    while (index < temp2.length) {
        if (parentAliases.includes(temp2[index]["parents"][0]) === false) {
            temp.push(temp2[index]);
            if (newParents.includes(temp2[index]["parents"][0]) === false) {
                newParents.push(temp2[index]["parents"][0]);
            }
        }
        index++;
	}
	parentAliases = parentAliases.concat(newParents);
}
var index = 0;
while (index < categories.length) {
    if (parentAliases.includes(categories[index]["alias"])) {
        index++;
    } else {
        children.push(categories[index]);
        index++;
    }
}
parentAliases.concat(newParents);
*/
// Twitter Essentials
// Twitter Library
var Twit = require('twit');

// Include configuration file
var T = new Twit(require('./config.js'));


// Helper function for arrays, picks a random thing
Array.prototype.pick = function() {
	return this[Math.floor(Math.random()*this.length)];
}
Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};


/*function searchByParent(parent) {
    var index = 0;
    console.log("Listing all categories under " + parent);
    while (index < children.length) {
        if (children[index]["parents"][0] == parent) {
        console.log(children[index]["title"]);
        }
        index++;
    }
}*/
//
var response;
var name;
var category;
var price;
var rating;
var location;
var result;
var num;
var data;
var priceQuote;
var ratingQuote;
//function randomData() {}

// Post a status update
function tweet() {
    searchRequest['categories'] = catDict[keys.pick()].pick()["alias"];
    var test = YelpAPIKey.search(searchRequest).then(response => {
    while (result == null) {
        while ((response == null)) {
            searchRequest['categories'] = catDict[keys.pick()].pick()["alias"];
            response = YelpAPIKey.search(searchRequest);
        }
        result = response.jsonBody.businesses;
    }
    num = Math.floor(Math.random()*Math.min(result.length - 1));
    //var prettyJson = JSON.stringify(result, ["name", "categories", "title", "price", "rating", "location", "display_address"], 4);
    name = result[num]["name"];
    var index = 0;
    while (index < result[num]["categories"].length) {
        if (result[num]["categories"][index]["alias"] == searchRequest["categories"]) {
            category = result[num]["categories"][index]["title"];
        }
        index++;
    };
    price = result[0]["price"];
    rating = result[0]["rating"];
    location = result[0]["location"]["display_address"][0];
    //console.log([name, category, price, rating, location]);
    data = [name, category, price, rating, location];
    if (data[2] == "$") {
        var statements = ["If you're looking for " + data[1] + "at a bargain, head to " + data[4] + " and visit " + data[0] + "!"];
        priceQuote = statements.pick();
    } else if (data[2] == "$$") {
        var statements = ["Placeholder for price of \"$$\"."];
        priceQuote = statements.pick();
    } else if (data[2] == "$$$") {
        var statements = ["Placeholder for price of \"$$$\"."];
        priceQuote = statements.pick();
    } else if (data[2] == "$$$$") {
        var statements = ["Placeholder for price of \"$$$$\"."];
        priceQuote = statements.pick();
    } else {
        priceQuote = null;
    }
    if (data[3] >= 4.5) {
        var statements = ["Placeholder for ratings of 4.5 or higher."];
        ratingQuote = statements.pick();
    } else if (data[3] >= 3.5) {
        var statements = ["Placeholder for ratings between 3.5 and 4.5."];
        ratingQuote = statements.pick();
    } else {
        ratingQuote = null;
    }

    var scheduled = [
        "If you're interested in " + data[1] + ", then you might want to check out " + data[0] + " at " + data[4] + "!",
        data[0] + " is a popular business in Atlanta. If you like " + data[1] + ", head over to " + data[4] + " to see it for yourself!",
        priceQuote,
        ratingQuote
    ];
	var tweetText = scheduled.pick();
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


/*
function respondToMention() {
	T.get('statuses/mentions_timeline', { count:100, include_rts:0 },  function (err, reply) {
		  if (err !== null) {
			console.log('Error: ', err);
		  }
		  else {
		  	mention = reply.pick();
		  	mentionId = mention.id_str;
		  	mentioner = '@' + mention.user.screen_name;

		  	var tweet = mentioner + " " + pre.pick();
			if (debug)
				console.log(tweet);
			else
				T.post('statuses/update', {status: tweet, in_reply_to_status_id: mentionId }, function(err, reply) {
					if (err !== null) {
						console.log('Error: ', err);
					}
					else {
						console.log('Tweeted: ', tweet);
					}
				});
		  }
	});
}
*/
function runBot() {
	console.log(" "); // just for legible logs
	var d=new Date();
	var ds = d.toLocaleDateString() + " " + d.toLocaleTimeString();
	console.log(ds + "\n");  // date/time of the request
    tweet();

}

// Run the bot
runBot();

// And recycle every hour
//setInterval(runBot, 1000 * 60 * 60);