
## Lab 3 Assignment (ALAAM)

## In this lab, you will be building, estimating, and interpreting the results of Autologistic Actor
## Attribute Model (ALAAM) using the R to examine the effects of network ties on certain behaviors. 
## The R script is based on Johan Koskinen's workshop material and recent paper on Bayesian Analysis of
## Social Influence (Koskinen, J., & Daraganova, G. (2020). Bayesian Analysis of Social Influence. 
## arXiv preprint arXiv:2006.16464.) . In this code, they extended on current approaches for fitting
## ALAAMs by presenting a comprehensive Bayesian inference scheme that supports testing of dependencies
## across subsets of data and the presence of missing data. Please do NOT disseminate the code without
## permission.

install.packages("mvtnorm")
library(mvtnorm)
install.packages("xtable")
library(xtable)

##################################################################################################
# Part I: Data Description
##################################################################################################

# Setup and Data Preparation -------------------------------------------------------------------

## download the s50 dataset from the website
## For a description of the full dataset, see https://www.stats.ox.ac.uk/~snijders/siena/s50_data.htm
temp <- tempfile()
download.file("https://www.stats.ox.ac.uk/~snijders/siena/s50_data.zip",temp)
adj <- read.table(unz(temp, "s50-network1.dat"))
sport <- read.table(unz(temp, "s50-sport.dat"))
smoke <- read.table(unz(temp, "s50-smoke.dat"))
alcohol <- read.table(unz(temp, "s50-alcohol.dat"))
unlink(temp)

## Format the network and set at the 2nd wave as our outcome variable
n <- nrow(adj)
adj <- as.matrix(adj) # convert from data.frame to matrix
smoke <- smoke[,2] # use wave 2
smoke[smoke<2] <- 0 # set non-smoker to 0
smoke[smoke>0] <- 1 # set occasional and regular to 1

## Download the script `MultivarALAAMalt.R` and read in the routines
# Make sure you have set the working directory to where you store the file
# If you have this script stored in the same folder
# Session ==> Set Working Directory ==> To Source File Location
source('MultivarALAAMalt.R')

##################################################################################################
# Part II: Hypotheses
##################################################################################################
# see the hypotheses that you should test in the lab assignment description file. 

##################################################################################################
# Part III: Initializing the Model
##################################################################################################
# Format Covariates -------------------------------------------------------

## Below can be pre-calculated and used as monadic covariates
out.degree <-matrix( rowSums(adj), n, 1) # number of ties sent
in.degree <- matrix( colSums(adj) , n, 1 ) # number of ties received
rec.ties <-  matrix( rowSums(adj * t(adj) ), n , 1) # number of ties that are mutual
in.two.star <- matrix( choose(in.degree,2),n,1) #  in-stars refecting dispersion in popularity
out.two.star <- matrix( choose(out.degree,2),n,1) #  out-stars refecting dispersion in activity
mix.two.star <- in.degree*out.degree - rec.ties # correlation between indegree and outdegree
in.three.star <- matrix( choose(in.degree,3),n,1) # furhter measure of in-degree heterogeneity
out.three.star <- matrix( choose(out.degree,3),n,1) # furhter measure of out-degree heterogeneity
triangles <- rowSums( adj* (adj %*% t(adj) )  ) # embedded in transitive triads

## Format covariates by putting them all into a matrix (the column names are only required for formatting the output)
covs <- cbind(sport[,1], 
              alcohol[,1],
              out.degree, 
              in.degree,
              rec.ties,
              in.two.star,
              out.two.star,
              mix.two.star,
              in.three.star,
              out.three.star,
              triangles)
colnames(covs) <- c("Sport",
                    "Alcohol",
                    "indegree",
                    "outdegree",
                    "reciprochation" ,
                    "instar",
                    "outstar",
                    "twopath",
                    "in3star",
                    "out3star",
                    "transitive")
head(covs)

##################################################################################################
# Part IV: Building the Models
##################################################################################################
#  Model 1: Running an independent response (non-contagion) model -----------------------------------------------

res.0 <- BayesALAAM(y = smoke,           # dependent variable
                    ADJ = adj,           # network
                    covariates = covs,   # covariates
                    directed = TRUE,     # directed / undirecred network
                    Iterations = 1000,   # number of iterations
                    saveFreq = 100,      # print and save frequency
                    contagion = 'none')  # type of contagion

## You will notice in the output that the simple contagion effect is reported as
## zero because it hasn't been estimated. 

## What does effective sample sizes (ESS) tell us?
## Now taking a look at the MCMC output in trace plots.

plot(ts(res.0$Theta[,1:6]))
plot(ts(res.0$Theta[,7:13]))

## Now increase the number of iterations to 10,000 and run the model again: 
res.0 <- BayesALAAM(y = smoke,           # dependent variable
                    ADJ = adj,           # network
                    covariates = covs,   # covariates
                    directed = TRUE,     # directed / undirecred network
                    Iterations = 10000,   # number of iterations
                    saveFreq = 500,      # print and save frequency
                    contagion = 'none')  # type of contagion

## Plot the MCMC output in trace plots a
plot(ts(res.0$Theta[,1:6]))
plot(ts(res.0$Theta[,7:13]))

## Summarize the results
write.res.table(burnin=1, # should be set sufficiently high
                datamat=res.0$Thetas, # the result from BayesALAAM
                thin=1, # should be set so that SACF is sufficiently low, 
                        # important for Confidence Intervals
                tabname=NULL) # the name appended to the table that is saved


# Model 2: Fit a social contagion model --------------------------------------------
res.1 <- BayesALAAM(y = smoke,           # dependent variable
                    ADJ = adj,           # network
                    covariates = covs[,c(1,2,4)],   # covariates
                    directed = TRUE,    # directed / undirected network
                    Iterations = 1000,   # number of iterations
                    saveFreq = 100)     # print and save frequency

## Plot the MCMC output in trace plots 
plot(ts(res.1$Thetas))

## you can improve the mixing by using a better proposal covariance
Propsigma <- cov(res.1$Thetas)
## which can be used as an argument PropSigma to BayesALAAM. This proposal 
## variance (covariance) matrix, directly regulates how big jumps we are 
## proposing, as discussed above in the section on ESS.
res.2 <- BayesALAAM(y = smoke,           # dependent variable
                    ADJ = adj,           # network
                    covariates = covs[,c(1,2,4)],   # covariates
                    directed = TRUE,    # directed / undirected network
                    Iterations = 5000,   # number of iterations
                    saveFreq = 500,     # print and save frequency
                    PropSigma = Propsigma )

## We can check if the mixing of the posterior chains has been improved by 
## proposing moves using the covariance matrix Propsigma.
plot(ts(res.2$Thetas))

## In the ACF plots you should see that lags 10 and 30 correspond to the output table from BayesALAAM
## Since we are satisfied with the performance of the algorithm, 
## produce a results table
write.res.table(burnin=1, # should be set sufficiently high
                datamat=res.2$Thetas, # the result from BayesALAAM
                thin=1, # should be set so that SACF is sufficiently low, important for CI
                tabname=NULL) # the name appended to the table that is saved

##################################################################################################
# Part V: Goodness-of-fit test
##################################################################################################
## Based on the posterior draws in res.0$Thetas, draw outcomes 
## for goodness-of-fit for model 1
sim.0 <- get.gof.distribution(NumIterations=500, # number of vectors to draw
                              res=res.1, # the ALAAM estimation object that 
                              # contains model and results
                              burnin=100, # no. iterations discarded from 
                              # GOF distribution
                              thinning = 1000, # no. iterations between 
                              # sample points
                              contagion ='none') # should be the same as 
# for model fitted

## The object sim.0 contains the observed statistics, the goodness-of-fit 
## distribution, and other outputs that are used for summarizing in the GOF table

gof.table(obs.stats= sim.0$stats, # observed statistics included not 
          # fitted statistics
          sim.stats= sim.0$Sav.gof, # simulated goodness-of-fit statistics
          name.vec= sim.0$gof.stats.names, # names of statistics calculate, 
          # not all will be used if undirected
          tabname='ALAAMGofalt', # name of file saved
          pvalues=TRUE, # posterior predictive p-values
          # save.tab ='csv', # save a csv file or a LaTex file
          directed=TRUE)

