const _ = require('underscore');

const list = {
    "politics": ["donald trump", "trump", "bernie sanders", "sanders", "elizabeth warren", "warren", "joe biden", "biden", "kamala harris", "harris", "rudy giuliani", "giuliani", "impeachment", "robert mueller ", "mueller", "qanon", "deep state", "putin", "vladimir putin", "maga", "fiona hill", "Marie Yovanovitch", "semyon kislin", "lev parnas", "igor fruman", "ukraine", "ukrainian ", "whistleblower", "leaked", "confidential", "beto o rourke", "beto", "republican", "democrat", "2020", "mark sanford", "sanford", "andrew yang", "yang", "marianne williamson ", "tom steyer", "tim ryan", "joe sestak", "wayne messam", "amy klobuchar", "tulsi gabbard", "johh delaney", "julian castro", "Pete Buttigieg", "steve bullock", "michael bennet", "trump tweet", "testimony ", "fake news", "adam schiff", "gordon sondland", "ukraine scandal", "2020", "election", "presidential election", "melania", "jared kushner ", "manafort", "roger ailes", "roger stone", "Volodymyr Zelensky", "Dmitry Medvedev", "kgb", "fbi", "cia", "nsa", "politburo", "voting", "vote machine", "polls", "iran"],
    "crime_related_terms": ["shooting", "stockpile", "school shooting", "mass shooting", "murder", "kill", "destroy", "swatting", "bomb", "threat", "threaten", "bomb thread", "hostage", "suicide", "automatic", "semiauto", "semiautomatic", "magazine", "rifle", "pipe bomb", "church", "nuked", "cops", "police", "call cops", "casualty", "casualties", "body count", "killed", "death count", "manifesto", "suicide note", "note", "munchausen", "munchausen by proxy", "terrorism", "terrorist ", "hack", "hacked", "conspiracy", "pedo", "pedophile", "arrested", "convicted", "damage control", "spree", "bullet", "prank", "rig", "hidden cam", "police shooting", "body cam", "surveillance video", "surveillance footage", "bump stock", "magazine", "secret recording", "hospital ", "guns", "gun", "cell phone video", "cell phone", "beating", "abuse", "animal abuse", "torture", "swat team", "body armor ", "kevlar ", "mall", "death toll", "dead", "conspiracy theory", "killed", "illegal ", "crime"],
    "political_terms": ["turkey", "syria", "erdogan", "syrian army", "clinton", "hillary clinton", "mitch mcconnell ", "border", "mexican border", "mexico", "mexican", "border wall", "gun rights", "2nd amendment", "health care", "washington", "health care", "cabal ", "chuck schumer ", "alex jones", "TheGeekzTeam", "CarpeDonktum", "anderson cooper", "shep smith", "don lemon", "watchdog", "conservative", "liberal ", "James O'Keefe"],
    "hate_group_related_terms": ["hitler", "nazi", "incel", "alliance defending freedom", "aryan", "aryan brotherhood ", "aryan nation", "alt right", "christian identity", "extreme right", "patriot movement", "far right", "radical right", "hate crime", "hate group", "odinism ", "asatru", "skinhead", "white pride", "white power", "white supremacy ", "1423", "420", "1488", "211 crew", "311", "acab", "akia", "advanced white society", "alabama aryan brotherhood", "american front", "Anudda Shoah", "boots and laces", "racist", "bigot"],
    "other": ["uber", "tesla", "elon musk", "lyft", "bitcoin", "bank account", "credit card", "facebook", "twitter", "mark zuckerberg", "jack dorsey", "8chan", "poole", "epstein", "weinstein", "matt lauer", "ronan farrow ", "project veritas", "dark web", "dark internet", "snowden", "fox news", "murdoch", "jeff zucker", "reddit", "tumblr", "digg", "jacob wohl ", "milo yiannopoulos", "richard spencer", "tiktok", "instagram", "youtube", "viral", "trending"]
}

module.exports = function doesPostMatch (post) {
    let subject = post.subject;
    let body = post.clean_body;

    let result = {
        matched: false,
        matched_against: [],
        matched_groups: []
    };

    _.each(Object.keys(list), (key) => {

        // create regex for list of words
        let words = list[key].join('|');
        let subjectRegex = new RegExp("\\b("+words+")\\b", "gi");
        let bodyRegex = new RegExp("\\b("+words+")\\b", "gi");

        const subjectTest = subject.match(subjectRegex);
        const bodyTest = body.match(bodyRegex);

        if (subjectTest || bodyTest) {
            let wordsMatched = (subjectTest || []).concat((bodyTest || []));
            result.matched = true;
            result.matched_against = result.matched_against.concat(wordsMatched);
            result.matched_groups.push(key);
        }
    });

    return result;
}