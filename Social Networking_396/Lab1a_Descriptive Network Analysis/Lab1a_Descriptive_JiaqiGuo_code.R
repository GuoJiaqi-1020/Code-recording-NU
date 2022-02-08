if (!"vosonSML" %in% installed.packages()) install.packages("vosonSML") ## this package is a social media data collection tool
if (!"magrittr" %in% installed.packages()) install.packages("magrittr") ## this package allows you to use so-called pipe (%>%)
if (!"igraph" %in% installed.packages()) install.packages("igraph") ## this package is a network analysis tool
if (!"statnet" %in% install.packages()) install.packages("statnet") ## this package is another popular network analysis tool
library(magrittr)
library(igraph)
library(vosonSML)
sessionInfo()

######################################################################################
# Part I: Network Data Collection from Social Media
######################################################################################

########################
# Reddit data collection
########################
# collect reddit comment threads
# Replace with your list of reddit comment thread urls
myThreadUrls <- c("https://www.reddit.com/r/bayarea/comments/sd7eup/san_jose_passes_first_us_law_requiring_gun_owners/","https://www.reddit.com/r/moderatepolitics/comments/sd8rdt/san_jose_passes_first_us_law_requiring_gun_owners/","https://www.reddit.com/r/Libertarian/comments/sd7nkr/san_jose_passes_first_us_law_requiring_gun_owners/","https://www.reddit.com/r/CCW/comments/sd9cxo/san_jose_passes_first_us_law_requiring_gun_owners/")

# authentication does not require credentials
redditData <- Authenticate("reddit") %>%
  Collect(threadUrls = myThreadUrls, waitTime = 5)
View(redditData)
actorGraph <- redditData %>% Create("actor") %>% AddText(redditData) %>% Graph

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
graph.density(actorGraph)
########################
# Save your data       
########################
save.image('Lab1_Descriptive_JiaqiGuo2.RData')
load('Lab1_Descriptive_JiaqiGuo2.RData')
########################
# Part II: Network Visualization
########################
# Calculate the number of components in the graph
comp <- components(actorGraph)
comp

# Plot a graph
help("igraph.plotting")
actorGraph %>% 
  plot(.,
        margin = c(0.1,0.1,0.1,0.1),
       
       # Settings for nodes:
       vertex.size = 3,               ## node size
       vertex.color = 'red',           ## node color
       
       # Settings for node labels:
       vertex.label = NA,           ## uncomment  this line to remove node labels
       vertex.label.cex = .4,          ## node label size
       vertex.label.color = 'gray19',  ## node label color
       
       # Settings for edges:
       edge.arrow.size = .2,           ## arrow size
       edge.color = 'gray30',          ## arrow color
  ) 

# Take out a giant component from the graph
giantGraph <- actorGraph %>% 
  induced.subgraph(., which(comp$membership == which.max(comp$csize)))
vcount(giantGraph)
ecount(giantGraph) 

# giant component
giantGraph %>% 
  plot(.,
       layout = layout_with_drl(.), 
       edge.arrow.size = .3,
       vertex.label = NA,
       vertex.size = 4,
       vertex.color = 'red',
       vertex.label.cex = .5,
       vertex.label.color = 'black')

# Plot the second graph
giantGraph %>% 
  plot(.,
       layout = layout_with_kk(.),
       edge.arrow.size = .3,
       vertex.label = NA,
       vertex.size = 4,
       vertex.color = 'red',
       vertex.label.cex = .5,
       vertex.label.color = 'black')

