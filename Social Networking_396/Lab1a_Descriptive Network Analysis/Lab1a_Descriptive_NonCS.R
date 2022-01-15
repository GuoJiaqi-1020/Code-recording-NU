# Lab 1a: Descriptive Network Analysis (Gathering data and visualization)

######################################################################################
#
# Intro
#
######################################################################################

# Lines that start with a hashtag/pound symbol, like this one, are comment lines.
# Comment lines are ignored by R when it is running the code.

# To run a non-commented line in RStudio, click the "Run" button above
# or press Ctrl+Enter on Windows and Cmd+Enter on macOS.
# Any output will be printed in the Console pane (placed below) and all plots
# will be displayed in the Plots pane (placed bottom right).
# Try running the lines below and observing what happens:

print("Hello, R!")
plot(1:10)

# Complete the lab work by following the instructions and running the provided code.
# You may be required to edit some lines before running them to achieve the desired result.

######################################################################################
#
# Import the necessary libraries
#
######################################################################################

# First time you run this file, you will need to install several packages.
# To do that, run code lines 35-38. It may take up a copule of minutes.
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
# Then run the code in EITHER the Reddit, Youtube, or Twitter

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
#
######################################################################################

# Calculate the number of components in the graph
comp <- components(actorGraph)
comp

# Plot a graph
# For a more detailed tutorial of network visualization, see https://kateto.net/network-visualization
# To open documentation in RStudio, run:
help("igraph.plotting")
# Below, actorGraph is the name of the network object we are passing to the plot command using "%>%'
actorGraph %>% 
  plot(.,
       # Plot margins:
       # margin = c(0,0,0,0),           ## values for the size of the bottom, left, top, and right plot margins
       #      While 0 is the default, negative values can cut down on margins and
       #      help make the plot bigger. Just make sure you don't cut anything off
        margin = c(-0.3,-0.3,-0.3,-0.3),
       
       # Settings for nodes:
       vertex.size = 3,               ## node size
       vertex.color = 'red',           ## node color
       
       # Settings for node labels:
       vertex.label = NA,           ## uncomment  this line to remove node labels
       vertex.label.cex = .4,          ## node label size
       vertex.label.color = 'gray19',  ## node label color
       
       # Settings for edges:
       edge.arrow.size = .8,           ## arrow size
       edge.color = 'gray30',          ## arrow color
       
       # Settings for layouts:
       #      Running this command multiple times will produce slightly different networks,
       #      based on the layout algorithm used. You can swap alogrithms by uncommenting one of the
       #      lines below. Which alogrithm works best often depends on the data
       # layout = layout_nicely(.)      ## Automated layout recommendation from iGraph
       # layout = layout_with_fr(.)    ## Fruchterman-Reingold algorithm
       # layout = layout_with_dh(.)    ## Davidson and Harel algorithm
       # layout = layout_with_drl(.)   ## Force-directed algorithm
       # layout = layout_with_kk(.)    ## Spring algorithm
       # layout = layout_with_lgl(.)   ## Large graph layout
  ) 

# Take out a giant component from the graph
giantGraph <- actorGraph %>% 
  induced.subgraph(., which(comp$membership == which.max(comp$csize)))
vcount(giantGraph) ## the number of nodes/actors/users
ecount(giantGraph) ## the number of edges

# Plot a graph of giant component
giantGraph %>% 
  plot(.,
       layout = layout_with_drl(.), ## force-directed graph layout
       edge.arrow.size = .3,
       vertex.label = NA,
       vertex.size = 4,
       vertex.color = 'red',
       vertex.label.cex = .5,
       vertex.label.color = 'black')

# Plot a second graph of giant component
giantGraph %>% 
  plot(.,
       layout = layout_with_dh(.), ## Davidson and Harel graph layout
       edge.arrow.size = .3,
       vertex.size = 4,
       vertex.color = 'red',
       vertex.label.cex = .5,
       vertex.label.color = 'black')

# Experiment with other layouts by replacing with your choice of layout, then running a plot function above.
# layout = layout_with_...(.)
# For that, you can pick one of the options below.
# layout_with_dh(.) # Davidson and Harel
# layout_with_drl(.) # Force-directed
# layout_with_kk(.) # Spring

# You can play with the settings, including vertex sizes and edge sizes, to get a better vizualization for the graphs above