# chan-archiver

This project was a pet-project for a few months. This project stemmed from a conversation I had with a journalist who was interested in collecting *all* 4chan posts that occurred on a board. 

The biggest problem I had when creating this was: How can you avoid getting IP banned by 4chan? To solve, I came up with this idea of using rotating proxies in AWS.

This application will:

* Automatically create EC2 servers based on pre-built AMI
    * Manual set up is needed to create the AMI, expose the correct ports, and auto-launch an HTTP proxy.
* Automatically find the best number of requests to make every minute in order to perfectly load balance the proxies.
* Automatically kills proxy servers that are unresponsive.
* Automatically kills and re-builds proxy servers every x minutes.
* Record all 4chan posts into ElasticSearch
* Tag posts that contain certain words into groups so that further analysis can be done for these posts (i.e. extremely offensive posts that could lead to real-world actions, like bomb threats, etc.)
    * This part of the code is very elementary. It simply checks if a word is inside of a post. There is no actual language interpreter that can understand intent behind posts.

This application is fully functional and was live for a few months before I shut down the EC2 servers. This application archived more than 20,000,000 posts when it was running.
