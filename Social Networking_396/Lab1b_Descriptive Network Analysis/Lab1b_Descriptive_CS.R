# Lab 1b: Descriptive Network Analysis (Local and Global Properties)

# We have provided you with partial code for the lab, 
# and in portions of the script will ask you to "* Add your own code here: *"
# Please see the comments for recommendations of what functions to use 

######################################################################################
#
# Import the necessary libraries
#
######################################################################################

# First time you run this file, you may will need to install several packages.
# To do that, run code lines 17-2-. It may take up a couple of minutes.
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

# To check whether your R loads these packages, run the following code
# sessionInfo() ## check other attached packages. If magrittr, vosonSML, & igraph are listed there, you're ready!

######################################################################################
#
# Set current directory and load your dataset form lab 1a
#
######################################################################################

# In this step you tell R where to look for your files.
# From the menu, select "Session > Set Working Directory... > To Source File Location".

# Alternatively, if you know the filename, you can uncomment the line below and run it.
# setwd("replace this with path to your directory")

# Load the dataset that you generated in lab 1a
# Make sure that you put the RData in your working directory
load('Lab1_Descriptive.RData')

# Take out the largest component from the graph - Use the exact code we have provided
comp <- components(actorGraph)
giantGraph <- actorGraph %>% 
  induced.subgraph(., which(comp$membership == which.max(comp$csize)))
vcount(giantGraph) ## the number of nodes/actors/users
ecount(giantGraph) ## the number of edges
plot(giantGraph, vertex.size = 7, vertex.label = NA) ## review the largest component
######################################################################################
#
# Part III: Individual Network Properties
#
######################################################################################
# For this part of the lab, we will switch between two different packages for network analysis
# Some of the functions needed are in the "igraph" package and some are in the "sna" package
# But both use different formats of network objects
# giantGraph is formatted for use with the "igraph" package
# sna_g, produced by the line below, is formatted for use with the "sna" package
# Make sure you keep track of which of the packages you have loaded,
# and that you are using the correct object (giantGraph / sna_g) with functions from each package
sna_g <- igraph::get.adjacency(giantGraph, sparse=FALSE) %>% network::as.network.matrix()

# The below detaching is a necessary step since the two packages have some same function names
# R will get confused if you have both packages loaded at once
detach('package:igraph')
library(sna)

# Get names of each individual node using as.character(network.vertex.names(sna_g))
# Compute centralities using the following functions from the "sna" package:
#     degree(,cmode='outdegree'), degree(,cmode='indegree'), betweenness() 
# And the following functions from the "igraph" package:
#     igraph::closeness(,mode='in'), igraph::closeness(,mode='out)
#     igraph::eigen_cenetrality()#vector, igraph::constraint(),
#     igraph::authority_score(,scale=TRUE)$'vector'
#     igraph::hub_score(,scale=TRUE)$'vector'
#     Be careful with the interpretation on Burt's constraint, see help(constraint)
#     High constraint = redundant contacts, low constraint = acting as a broker

# Add your own code here:

######################################################################################
#
# Part IV: Global Network Proporties
#
######################################################################################
# If you want to go back to igraph analysis, don't forget detaching 'sna' and 'network' first
# before recalling 'igraph'
detach('package:statnet', unload = TRUE)
library(igraph)

# (1) Calculate kcores using graph.coreness(), then plot. Use the exact code we have provided.
kcore <- giantGraph %>% graph.coreness(.)
giantGraph %>% 
  plot(.,
       layout = layout_with_gem(.),
       edge.arrow.size = .3,
       vertex.size = 4,
       vertex.label = NA,
       vertex.color = adjustcolor(graph.coreness(.), alpha.f = .3),
       vertex.label.cex = .5,
       vertex.label.color = 'black',
       mark.groups = by(seq_along(graph.coreness(.)), graph.coreness(.), invisible),
       mark.shape = 1/4,
       mark.col = rainbow(length(unique(graph.coreness(.))),alpha = .1),
       mark.border = NA
  )

# (2) Plot the number of communities in the graph and their size
# there are also other algorithms for this you may want to explore
# below is using Newman-Girvan Algorithm (2003)
# if communities do not make sense to you, replace with your choice
# e.g., cluster_infomap, cluster_walktrap etc.
cluster <- giantGraph %>% cluster_edge_betweenness() 
## you'll see orange warning messages since the edge betweennness algorithm is not designed for a directed graph
## but you'll be able to see the results anyway.
## if you want to use a more appropriate algorithm for a directed graph, try:
# cluster <- giantGraph %>% cluster_walktrap()
cluster

# Examine the clusters using the following functions:
# modularity(), membership(), length(), sizes()
# * Add your own code here: *

# Visualize clusters - that puts colored blobs around the nodes in the same community.
# You may want to remove vertex.label=NA to figure out what terms are clustered.
cluster %>% plot(.,giantGraph,
                 layout = layout_with_fr(giantGraph),
                 edge.arrow.size = .3,
                 vertex.size = 4,
                 vertex.label = NA,
                 vertex.color = adjustcolor(membership(.), alpha.f = .3),
                 vertex.label.cex = .5,
                 vertex.label.color = 'black',
                 mark.groups = by(seq_along(membership(.)), membership(.), invisible),
                 mark.shape = 1/4,
                 mark.col = rainbow(length(.),alpha = .1),
                 mark.border = NA
)

# (3) Examine the in-degree distribution - Use the exact code we have provided below
giantGraph %>% degree.distribution(.,mode="in") %>% 
  plot(., col = 'black', pch = 19, cex = 1.5,
       main = 'In-degree Distribution',
       ylab = 'Density',
       xlab = 'In-degree')
# CCDF - Complementary Cumulative Distribution Function
# Plot a log-log plot of in-degree distribution
giantGraph %>% 
  degree.distribution(.,cumulative = TRUE,mode ='in') %>% 
  plot(1:(max(degree(giantGraph,mode='in'))+1),., ## since log doesn't take 0, add 1 to every degree
       log='xy', type = 'l',
       main = 'Log-Log Plot of In-degree',
       ylab = 'CCDF',
       xlab = 'In-degree')
# Fit a power law to the degree distribution
# The output of the power.law.fit() function tells us what the exponent of the power law is ($alpha)
# and the log-likelihood of the parameters used to fit the power law distribution ($logLik)
# Also, it performs a Kolmogov-Smirnov test to test whether the given degree distribution could have
# been drawn from the fitted power law distribution.
# The function thus gives us the test statistic ($KS.stat) and p-vaule ($KS.p) for that test
in_power <- giantGraph %>% 
  degree.distribution(., mode='in') %>%
  power.law.fit(.)
in_power

# (4) Examine the out-degree distribution using a similar approach as (3),
# but modifying the code to change the settings in the degree.distribution() function
# * Add your own code here: *

# (5 & 6) Small-world Characteristics - Use the exact code we have provided below
ntrials <- 1000 ## set a value for the repetition
cl.rg <- numeric(ntrials) ## create an estimated value holder for clustering coefficient
apl.rg <- numeric(ntrials) ## create an estimated value holder for average path length
for (i in (1:ntrials)) {
  g.rg <- rewire(giantGraph, keeping_degseq(niter = 100))
  cl.rg[i] <- transitivity(g.rg, type = 'average')
  apl.rg[i] <- average.path.length(g.rg)
}

# plot a histogram of simulated values for clustering coefficient + the observed value
hist(cl.rg,
     main = 'Histogram of Clustering Coefficient',
     xlab = 'Clustering Coefficient')
par(xpd = FALSE)
# the line indicates the mean value of clustering coefficient for your network
abline(v = giantGraph %>% transitivity(., type = 'average'), col = 'red', lty = 2)
# this tests whether the observed value is statistically different from the simulated distribution
t.test(cl.rg, mu=giantGraph %>% transitivity(., type = 'average'),
       alternative = 'greater') ## pick either 'less' or 'greater' based on your results
                             ## (you want to use the one that generates the smaller p-value)

# plot a histogram of simulated values for average path length + the observed value
hist(apl.rg,
     main = 'Histogram of Average Path Length',
     xlab = 'Average Path Length')
# the line indicates the mean value of average path length for your network
abline(v = giantGraph %>% average.path.length(), col = 'red', lty = 2)
# this tests whether the observed value is statistically different from the simulated distribution
t.test(apl.rg, mu=giantGraph %>% average.path.length(.),
       alternative = 'greater') ## pick either 'less' or 'greater' based on your results
                                ## (you want to use the one that generates the smaller p-value)

# (7) Look at the other data fields you have scraped off the web
# Which one you look at below depends on where you got your data
redditData; help("Collect.reddit")
twitterData; help("Collect.twitter")
youtubeData; help("Collect.youtube")

# * Add your own code here: *