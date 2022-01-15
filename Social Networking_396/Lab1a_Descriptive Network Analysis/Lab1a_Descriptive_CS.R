# Lab 1a: Descriptive Network Analysis (Gathering data and visualization)

######################################################################################
#
# Instructions
#
######################################################################################

# We will provide you with code to use for Part I of lab 1a (Network Data Collection)
# In Part II of lab 1a (Network Visualization) we will ask you to write your own code
# In comments, we will provide some functions and documentation to help with this,
# as well as break down the four different steps you need to accomplish

######################################################################################
#
# Import the necessary libraries
#
######################################################################################

# First time you run this file, you will need to install several packages.
# To do that, run code lines 23-26. It may take up a couple of minutes to install.
# You only need to install packages once, next time you should skip those lines.

if (!"vosonSML" %in% installed.packages()) install.packages("vosonSML") ## this package is a social media data collection tool
if (!"magrittr" %in% installed.packages()) install.packages("magrittr") ## this package allows you to use so-called pipe (%>%)
if (!"igraph" %in% installed.packages()) install.packages("igraph") ## this package is a network analysis tool
if (!"statnet" %in% install.packages()) install.packages("statnet") ## this package is another popular network analysis tool

# Now run the lines below to load the packages you have installed.
# You need to load packages every time you run the script or restart R.
library(magrittr)
library(igraph)
library(vosonSML)

# To check whether your R loads these packages, run te following code
sessionInfo() ## check other attached packages. If magrittr, vosonSML, & igraph are listed there, you're ready!

######################################################################################
#
# Set the working directory
#
######################################################################################

# In this step you tell R where to look for your files.
# From the menu, select "Session > Set Working Directory... > To Source File Location".

# Alternatively, if you know the filename, you can uncomment the line below and run it.
# setwd("replace this with path to your directory")

# Please do one of the two alternatives above. This is where the files R produces will be stored.

######################################################################################
#
# Part I: Network Data Collection from Social Media
#
######################################################################################

# Pick ONE of the three platforms to collect your own data
# Criteria of your network data:
# 1. Include 100-1000 actors in your network
# (Don't overkill to include 1 million actors for this lab)
# 2. Pick a topic
# (e.g., topic = MeToo Movement, hashtags = c(#metoomovement))
# Then run the code in EITHER the Reddit, Youtube, or Twitter sections below

# The process of authentication, data collection and creating social network in 
# vosonSML is expressed with the three verb functions: Authenticate, Collect and Create.

########################
# Reddit data collection
########################
# collect reddit comment threads
# Replace with your list of reddit comment thread urls
myThreadUrls <- c("https://www.reddit.com/r/AskReddit/comments/7sk2ox/what_are_your_views_on_the_metoo_movement/","https://www.reddit.com/r/meToo/comments/mj9rs3/a_generational_gap/")

# authentication does not require credentials
redditData <- Authenticate("reddit") %>%
  Collect(threadUrls = myThreadUrls, waitTime = 5)
View(redditData)

## actor network - nodes are users who have posted comments
# create an actor network with comment text as edge attribute
actorGraph <- redditData %>% Create("actor") %>% AddText(redditData) %>% Graph

#########################
# Youtube data collection
#########################
# Follow instructions in the lab writeup to get api keys

# YoutubeAPIKey - Replace with your API key
myYoutubeAPIKey <- "xxxxxxxxxxxxxxxxxxxxx"

# helper to create a list of youtube video ids from urls
# Replace with your list of youtube video urls
myYoutubeVideoIds <- GetYoutubeVideoIDs(c("https://www.youtube.com/watch?v=ATYK2svJ6eM","https://www.youtube.com/watch?v=ZF55ItXWjck"))

# authenticate and collect 500 top-level comments per youtube video in list
# also collects reply-comments for each top-level comment
youtubeData <- Authenticate("youtube", apiKey = myYoutubeAPIKey) %>%
  Collect(videoIDs = myYoutubeVideoIds, maxComments = 500,verbose = TRUE)
View(youtubeData)


## actor network - nodes are users who have posted comments
actorGraph <- youtubeData %>% Create("actor") %>% AddText(youtubeData) %>% Graph

#########################
# Twitter data collection
#########################
# Follow instructions in the lab writeup to get API keys

# App name - Replace with your app name
myAppName <- "replace w/ app name"
# apiKey - Replace with your API key
myApiKey <- "replace with API key"
# apiSecret - Replace with your API key secret
myApiSecret <- "replace with API secret"
# Replace with access token and access token secret
myAccessToken <- "replace w cToken"
myAccessTokenSecret <- "replace with accessTokenSecret"

twitterAuth <- Authenticate("twitter", appName = myAppName, apiKey = myApiKey, 
                            apiSecret = myApiSecret, accessToken = myAccessToken,
                            accessTokenSecret = myAccessTokenSecret)

# twitter authentication creates an access token as part of the auth object
# this can and should be re-used by saving it and then loading it for future sessions
# save the auth object after authenticate 
saveRDS(twitterAuth, file = "~/.twitter_auth")

# load a previously saved auth object for use in collect
twitterAuth <- readRDS("~/.twitter_auth")

# searchTerm - Replace with your search terms such as c('#prolife','#prochoice')
# collect 500 recent tweets
twittersearchTerm <- c('#metoomovement')
twitterData <- twitterAuth %>%
  Collect(searchTerm = twittersearchTerm, searchType = "recent", numTweets = 500, 
          includeRetweets = TRUE, retryOnRateLimit = TRUE, writeToFile = FALSE, 
          verbose = TRUE)
View(twitterData)

## actor network - nodes are users who have tweeted
## edges are based on either retweets or @mention (so-called reply)
actorGraph <- twitterData %>% 
  Create("actor") %>% 
  Graph

########################
# Clean up the data
########################

## clean up the graph data removing self-loop 
edge_cleanup <- function(graph = actorGraph){
  library(igraph)
  df <- get.data.frame(actorGraph)
  names_list <- data.frame('name' = as.character(V(actorGraph)$name),
                           'label' = as.character(V(actorGraph)$label))
  df$from <- sapply(df$from, function(x) names_list$label[match(x,names_list$name)] %>% as.character())
  df$to <- sapply(df$to, function(x) names_list$label[match(x,names_list$name)] %>% as.character())
  nodes <- data.frame(sort(unique(c(df$from,df$to))))
  links <- df[,c('from','to')]
  net <- graph.data.frame(links, nodes, directed=T)
  E(net)$weight <- 1
  net <- igraph::simplify(net,edge.attr.comb="sum")
  return(net)
}

actorGraph <- edge_cleanup() # Runs the function to remove self-loops

# check if the network is directed or undirected
is.directed(actorGraph)

########################
# Check the criterion
########################
# check the size of the network
vcount(actorGraph) ## the number of nodes/actors/users
ecount(actorGraph) ## the number of edges

# calculate the density of the network
graph.density(actorGraph)

########################
# Save your data       
########################

# The following command saves your R environment as RData
# Please submit this RData on Canvas
save.image('Lab1_Descriptive.RData')

# Next time, you need to work on the same data, you can run the following command.
# This allows you to recover and load the same data you found if you need to restart R
# Make sure that you put the RData in your working directory
load('Lab1_Descriptive.RData')
# Save this .RData, as you'll need it for lab 1b as well.


######################################################################################
#
# Part II: Network Visualization
# In this section, see the comments below for where to get started
# We have provided comments/recommendations to help get you started on each part
#
######################################################################################

# (1) Calculate the number of components in the graph:
#     Use the components() function

# (2) Plot a graph of your whole network:
#     For a more detailed tutorial of network visualization, see https://kateto.net/network-visualization
#     We recommend sticking to the plotting provided in the igraph package, using the plot() function
#     To open documentation in RStudio, run:
help("igraph.plotting")
help("igraph") #Help with the igraph package in general

# (3) Take out the giant component from the graph (largest component / connected set of nodes)
#     Store the results of the components() function to find out 
#     which component each node belongs to (the membership field) and the size of each component (csize)
#     Once you know which nodes are members of the largest component (e.g., using which()/which.max())
#     then you can use the induced.subgraph() function to create a graph object with only these nodes
#     Look at  the vcount() and ecount() functions to examine the final component you find

# (4) Create two visualizations of the giant component, using different settings on the plot function in igraph
#     To experiment with different layout options use the layout parameter, ie. plot(myGraph, layout = layout_with_dh(myGraph))
#     For instance, try layout_with_dh(.), layout_with_drl(.), or layout_with_kk(.)
help("igraph.plotting")

#     You can play with the settings, including vertex sizes and edge sizes, to get a better vizualization for the graphs above