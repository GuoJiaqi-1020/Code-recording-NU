# Lab 1b: Descriptive Network Analysis (Local and Global Properties)

if (!"vosonSML" %in% installed.packages()) install.packages("vosonSML")
if (!"magrittr" %in% installed.packages()) install.packages("magrittr")
if (!"igraph" %in% installed.packages()) install.packages("igraph")
if (!"statnet" %in% install.packages()) install.packages("statnet")

library(magrittr)
library(igraph)
library(vosonSML)

load('Lab1_Descriptive_JiaqiGuo.RData')

# Take out the largest component from the graph
comp <- components(actorGraph)
giantGraph <- actorGraph %>% 
  induced.subgraph(., which(comp$membership == which.max(comp$csize)))
vcount(giantGraph) ## the number of nodes/actors/users
ecount(giantGraph) ## the number of edges
plot(giantGraph, vertex.size = 7, vertex.label = NA) 
######################################################################################
#
# Part III: Individual Network Properties
#
######################################################################################


sna_g <- igraph::get.adjacency(giantGraph, sparse=FALSE) %>% network::as.network.matrix()

detach('package:igraph')
library(statnet)
library(ergm)
library(tergm)
library(network)
library(tsna)

# Calculate in-degree centrality
odegScores <- degree(sna_g, cmode = 'outdegree')
# Store the information
centralities <- data.frame('node_name' = as.character(network.vertex.names(sna_g)),
                           'in_degree' = degree(sna_g, cmode = 'indegree'))
# Calculate out-degree centrality and store it in the data.frame called 'centralities'
centralities$out_degree <- degree(sna_g, cmode = 'outdegree')

# Calculate betweenness centrality and store it in the data.frame called 'centralities'
centralities$betweenness <- betweenness(sna_g)

# Calculate closeness centrality and store it in the data.frame called 'centralities'
centralities$incloseness <- igraph::closeness(giantGraph, mode = 'in')
centralities$outcloseness <- igraph::closeness(giantGraph, mode = 'out')

# Calculate eigenvector centrality and store it in the data.frame called 'centralities'
centralities$eigen <- igraph::eigen_centrality(giantGraph)$vector

# Calculate Burt's network constraint and store it in the data.frame called 'centralities'
centralities$netconstraint <- igraph::constraint(giantGraph)
help(constraint) # Be careful with the interpretation for constraint:
# High constraint = redundant contacts, low constraint = acting as a broker

# Calculate authority and store it in the data.frame called 'centralities'
centralities$authority <- igraph::authority_score(giantGraph, scale = TRUE)$`vector`

# Calculate hub and store it in the data.frame called 'centralities'
centralities$hub <- igraph::hub_score(giantGraph, scale = TRUE)$`vector`

View(centralities)


######################################################################################
#
# Part IV: Global Network Proporties
#
######################################################################################
detach('package:statnet', unload = TRUE)
library(igraph)

help(coreness)

kcore <- giantGraph %>% graph.coreness(.) ## calculate k-cores
kcore 

## Plot a graph colored by the k-core decompotion results
giantGraph %>% 
  plot(.,
       layout = layout_with_gem(.),
       #layout = layout_with_sugiyama(.),
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

cluster <- giantGraph %>% cluster_walktrap()
cluster
help(cluster_edge_betweenness)
help(cluster_walktrap)
help(cluster_infomap)
# modularity measure
modularity(cluster)
help(modularity)
# Find the number of clusters
membership(cluster)   # affiliation list
length(cluster) # number of clusters
sizes(cluster) 

# Visualize clusters
cluster %>% plot(.,giantGraph,
                 # layout = layout_with_gem(.),
                 layout = layout_with_fr(giantGraph),
                 edge.arrow.size = .2,
                 vertex.size = 3,
                 vertex.label = NA,
                 vertex.color = adjustcolor(membership(.), alpha.f = .3),
                 vertex.label.cex = .5,
                 vertex.label.color = 'black',
                 mark.groups = by(seq_along(membership(.)), membership(.), invisible),
                 mark.shape = 1/4,
                 mark.col = rainbow(length(.),alpha = .1),
                 mark.border = NA
)


# Examine the in-degree distribution
giantGraph %>% degree.distribution(.,mode="in") %>% 
  plot(., col = 'black', pch = 19, cex = 1.5,
       main = 'In-degree Distribution',
       ylab = 'Density',
       xlab = 'In-degree')
# Plot a log-log plot of in-degree distribution
giantGraph %>% 
  degree.distribution(.,cumulative = TRUE,mode ='in') %>% 
  plot(1:(max(degree(giantGraph,mode='in'))+1),.,
       log='xy', type = 'l',
       main = 'Log-Log Plot of In-degree',
       ylab = 'CCDF',
       xlab = 'In-degree')
# Fit a power law to the degree distribution
in_power <- giantGraph %>% 
  degree.distribution(., mode='in') %>%
  power.law.fit(.)
in_power

help(power.law.fit)
# Examine the out-degree distribution
giantGraph %>% degree.distribution(.,mode="out") %>% 
  plot(., col = 'black', pch = 19, cex = 1.5,
       main = 'Out-degree Distribution',
       ylab = 'Density',
       xlab = 'Out-degree')
# Plot a log-log plot
giantGraph %>% 
  degree.distribution(.,cumulative = TRUE,mode ='out') %>% 
  plot(1:(max(degree(giantGraph,mode='out'))+1),
       ., log='xy', type = 'l',
       main = 'Log-Log Plot of Out-degree',
       ylab = 'CCDF',
       xlab = 'Out-degree')
# Fit a power law to the degree distribution
out_power <- giantGraph %>% 
  degree.distribution(., mode='out') %>%
  power.law.fit(.)
out_power

# Small-world Characteristics
ntrials <- 1000
cl.rg <- numeric(ntrials)
apl.rg <- numeric(ntrials)
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
abline(v = giantGraph %>% transitivity(., type = 'average'), col = 'red', lty = 2)
# this tests whether the observed value is statistically different from the simulated distribution
t.test(cl.rg, mu=giantGraph %>% transitivity(., type = 'average'),
       alternative = 'greater')
help(t.test)
# plot a histogram of simulated values for average path length + the observed value
hist(apl.rg,
     main = 'Histogram of Average Path Length',
     xlab = 'Average Path Length')
# the line indicates the mean value of average path length for your network
abline(v = giantGraph %>% average.path.length(), col = 'red', lty = 2)
# this tests whether the observed value is statistically different from the simulated distribution
t.test(apl.rg, mu=giantGraph %>% average.path.length(.),
       alternative = 'greater') 
save.image('Lab1_Descriptive_JiaqiGuo_lab1b.RData')
