# Lab 4a

# install.packages("devtools")
library(devtools)
install_version("RSiena",version="1.2-23") ## just do it one time (the first time that you run this code)
# install.packages("xtable") ##this is optional - create a result table for LaTex
# install.packages("texreg") ##this is optional - create a result table
# library(xtable)
library(RSiena)
library(statnet)

# help !
?RSiena
?sienaNet

# -------------------------------------------------------------------------------------------------
# Set the working directory
# Session > Set Working Directory > To Source File Location
# -------------------------------------------------------------------------------------------------
list.files() # List the files in the current working directory to see if you're in the right directory



# ------------------------------------------------------------------------------------
# Load data and visualize 
# ------------------------------------------------------------------------------------

# Read in data and convert to matrix format
friend.data.w1 <- as.matrix(read.table("s50-network1.dat"))
friend.data.w2 <- as.matrix(read.table("s50-network2.dat"))
friend.data.w3 <- as.matrix(read.table("s50-network3.dat"))
		
alcohol <- as.matrix(read.table("s50-alcohol.dat"))
drugs   <- as.matrix(read.table("s50-drugs.dat"))   # We do not use it for our analysis
smoke   <- as.matrix(read.table("s50-smoke.dat"))
		
# Visually inspect the adjacency matrices.
# This will, for example, help in highlighting outliers with respect to

# outdegrees or indegrees, if there are any of such outliers.
net1 <- as.network(friend.data.w1)
net2 <- as.network(friend.data.w2)
net3 <- as.network(friend.data.w3)

# plot sociomatrix - the filled cells indicate 1 (there is a tie), while blank cells indicate 0 (no tie)
plot.sociomatrix(net1,drawlab=F,diaglab=F,xlab='friendship t1') ##if drawlab = T, you'll see the labels of the nodes
plot.sociomatrix(net2,drawlab=F,diaglab=F,xlab='friendship t2')
plot.sociomatrix(net3,drawlab=F,diaglab=F,xlab='friendship t3')

# ------------------------------------------------------------------------------------
# Siena Model 
# ------------------------------------------------------------------------------------

# A number of objects need to be created in R: 
# A: dependent variables
# B: explanatory (independent) variables
# C: combination of dependent and explanatory variables
# D: model specification

# Create objects for the dependent variables.
friendship <- sienaNet(array(c(friend.data.w1, friend.data.w2, friend.data.w3), dim=c(50, 50, 3)))

# Create a behavior variable object with the extra argument type="behavior".
# (Non-mentioned attributes get the default value, and in this case oneMode is the default.)
smokingbeh <- sienaNet(smoke, type="behavior")

# Create a drug behavior variable object
drugbeh <- sienaNet(drugs, type="behavior")

# This shows that next to one-mode (unipartite) and behavior dependent variables,
# also two-mode (bipartite) dependent variables are possible.

# Construct objects for the explanatory (independent) variables.
?sienaDataCreate

# we see that these can be of five kinds:
# coCovar            Constant actor covariates
# varCovar           Time-varying (changing) actor covariates
# coDyadCovar        Constant dyadic covariates
# varDyadCovar       Time-varying dyadic covariates
# compositionChange  Composition change indicators.
# You can get help about this by the following requests:
#       ?coCovar            
#       ?varCovar           
#       ?coDyadCovar        
#       ?varDyadCovar       
#       ?sienaCompositionChange  
# The variables available for this dataset all are time-varying actor covariates.
# For illustrative purposes, we use smoking as observed at the first wave
# as a constant covariate:
smoke1 <- coCovar(smoke[,1])

# For illustrative purposes, we use drug as observed at the first wave
# as a constant covariate:
drug1 <- coCovar(drugs[,1])

# This selects the first column of smoke and drug, which contains the first wave observations,
# and makes it available as a constant covariate.
# We use the drinking data as a changing covariate.
# The function varCovar creates a changing covariate object from a matrix;
# the name comes from 'varying covariate'. 
drink <- varCovar(alcohol)

# The information request
attributes(drink)
# will tell you the information that R now has added to the drink data.

# Combine the dependent and independent variables.
# The function sienaDataCreate creates a Siena data object from input networks,
# covariates and composition change objects;
# the objects that earlier were created by sienaNet will have the role
# of dependent variables, and similarly the other roles are predetermined
# by creation by the functions coCovar, varCovar, 
# coDyadCovar, varDyadCovar, and sienaCompositionChange. 
mydata <- sienaDataCreate(friendship, smoke1, drug1, drink)

# You should now understand how the result of this differs from the result of:
mybehdata <- sienaDataCreate(friendship, drugbeh)
# The data set as combined in mydata implies a certain set of effects
# that can be included in the specification of the model.
# To have access to these, the effects are combined in a data frame.
# In R, an object of class "data.frame" is a matrix with named columns,
# each column having its own type (numerical, integer, string, logical, etc.)

# The function getEffects creates a dataframe of effects with a number of extra
# properties for use in RSiena:
myeff <- getEffects(mybehdata)
myeff$include[]

# Before we explain the object myeff and how we shall be going to use it,
# we first produce a data description which is available now:
print01Report(mybehdata, modelname = 's50_3_init') ## this creates a file in your working directory

# This writes a basic report of the data to the file 
# s50_3_init.out in the current working directory.
# Inspecting this is important because it serves as a check and also contains a number of descriptives.
# In this description you can see that the third wave data for alcohol are not used.
# This is because changing covariates are assumed to be constant from one wave until
# immediately before the next wave, so that the values for the last wave are ignored.

# density, recipcipocity
# here we add gwespFF (transitivity term) - parameter specifies an alpha value and we set 69 (i.e., 0.69)
myeff <- includeEffects(myeff, gwespFF, parm = 69)
		
# drug behaviour, we need to first include sender, receiver and homophily effects 
# of drug for friendship formation:
myeff <- includeEffects(myeff, egoX, altX, sameX, interaction1 = "drugbeh")
# For the influence part, i.e. the effect of the network on behaviour, we specify the following
# effects: Now indegree, outdegree and assimilation effects for drug
myeff <- includeEffects(myeff, name = "drugbeh", totSim, interaction1 = "friendship")
# We check the results again:
myeff
effectsDocumentation(myeff)
  

# ---------------------------------------------------------------------------------------------------
# Estimation of parameters
# ---------------------------------------------------------------------------------------------------

# Parameters of the model are estimated by the function siena07.
# This requires the data specification; the effects specification;
# and a number of parameters, or settings, for the estimation algorithm.
# The latter are contained in an object created by the function sienaModelCreate.
# You can look at the help provided by 
?sienaModelCreate

# to find out about options that you may use here;
# For the purpose of this assignment, only the two options mentioned below are relevant.
#
# Output will be written to a file with name projname.out in your working directory, where projname is
# whatever name is given; the default (used if no name is given) is Siena.
# New estimation runs will append to it.
# Note: A new call to print01Report will overwrite it!
mymodel <- sienaModelCreate(useStdInits = FALSE, projname = 's50_3')

# The useStdInits parameter determines the initial values used for
# the estimation algorithm.
# If useStdInits = TRUE, standard initial values are used;
# if useStdInits = FALSE, the initial values are used that are contained
# in the "initialValue" column of the effects object,
# which were reported above by the information request
myeff

# Below we shall see how these initial values can be altered.
# The function siena07 actually fits the specified model to the data and produces a "sienaFit" object
ans1 <- siena07(mymodel, data=mybehdata, effects=myeff, batch=FALSE, verbose=FALSE, returnDeps = TRUE)

# It fills in a few things in the sienaEffects object myeff if this is the first use of myeff in a siena07 call.
# By using various different effects objects, i.e., with different names,
# you can switch between specifications.
# The batch=FALSE parameters will give a graphical user interface being opened;
# verbose=TRUE leads to diagnostic information being sent to the console
# during the estimation, and results after the estimation
# (these results are also copied to the output file projname.out, mentioned above);
# while batch=TRUE gives only a limited amount of printout sent to the console
# during the estimation (which is seen when clicking in the console,
# or more immediately if the Buffered Output is deselected in the Misc menu)
# which helps monitor the progress of the estimation.

# The call of siena07 leads to output in the file s50_3.out 
# (or more generally projname.out, where projname is the name given in sienaModelCreate).

# If you wish the fitted object to include the simulated networks, use the
# parameter returnDeps=TRUE. The fitted object will then have a component named
# sims which will contain a list (each iteration) of lists (each data object)
# of lists (each dependent network or behavior variable) of edgelists for
# networks or vectors for behavior variables.


# ------------------------------------------------------------------------------------------------------------
# Interpreting the results
# ------------------------------------------------------------------------------------------------------------

# The most basic description of the results is obtained by requesting 
ans1 

# A more extensive report is obtained by
#summary(ans1)

# The results can also be viewed externally in the output file s50_3.out
# which is written in the current directory.
# It is advisable that you have a look at all three reports and
# understand how information is organized in each of them.

# To understand the table produced, note that the "t statistic" is the t-statistic for convergence checking,
# not the t statistic for testing the significance of this effect! (See Section 6.2.1 of the manual.)
# https://www.stats.ox.ac.uk/~snijders/siena/RSiena_Manual.pdf

# In the external output file, these are called "t-ratios for deviations from targets".
# The rule of thumb is that all t-ratios for convergence should ideally be less than 0.1 in absolute value;
# this signifies good convergence of the algorithm.
# If you don't observe this, the best thing to do would be to continue the estimation using the parameter values in answ1
# as the new initial values. This is done by the option prevAns as in
ans1 <- siena07(mymodel, data=mybehdata, effects=myeff, prevAns=ans1, returnDeps = TRUE)

## run the follow line to see the results and check whether the model and parameters converged.
ans1
# The parameter estimates in ans1 then are  extracted and used in the new estimation,
# Moreover, Phase 1 will be omitted from the algorithm, as derivatives and covariance matrix are used from the previous run.
# This should be used only if the model specification in myeff 
# has not changed, and if the provisional parameter estimates obtained
# in ans1 are resaonable; if they are not reasonable,
# omit the prevAns option, use
mymodel$useStdInits <- TRUE

# to get back on track, and return later to
mymodel$useStdInits <- FALSE

# The results of the estimation can also be accessed in various ways within R. 
# For example,
ans1$theta

# contains the vector of parameter estimates while
ans1$covtheta

# if you want to create a table of results
# Option A:
## if you haven't installed it, install it first using the command on the top of the script
# A table formatted for inclusion in a LaTeX document is written to a file by
xtable.sienaFit(ans1, file='ff.tex')
# and this function can also produce a table in html, or written to a file by
xtable.sienaFit(ans1, file='ff.html')

# At http://cran.r-project.org/web/packages/xtable you can find
# a set of vignettes for the xtable package, the xtable gallery,
# which gives more options.

# Option B:
library(texreg) ## if you haven't installed it, install it first using the command on the top of the script
# texreg(ans1) ## for LaTex
screenreg(ans1)
?texreg

# -------------------------------------------------------------------------------------------
# More on initializing parameters for estimation 
# -------------------------------------------------------------------------------------------

# Above we treated the use of the prevAns option in siena07.
# Another and more flexible way for determining initial values is by 
# using the useStdInits element of the model object,
# and the initial values in the effects object. This is done as follows.
# The option useStdInits = TRUE in sienaModelCreate, will make
# each estimation run start with standard initial values.
# The option useStdInits = FALSE makes the estimation start
# with the initial values in the effects object.
# You can switch between these by commands such as
#mymodel$useStdInits <- FALSE
#mymodel$useStdInits <- TRUE

# Putting the estimates from the results object ans1 into the
# effects object myeff, if ans1 used conditional estimation, is done by
myeff$initialValue[myeff$include] <- ans1$theta

# and if conditional estimation was used, conditioning on the first dependent network, by
#myeff$initialValue[myeff$include] <- c(ans1$rate, ans1$theta)

# Check that the effects object contains the new initial values is made by
myeff

# By using a different vector instead of ans1$theta you can
# initialise differently.
# Note that this initial vector will be used until you change it again,
# e.g., to the results of a new run, or until you change the useStdInits option.
# Also note that you should do this before changing the model,
# because else the vectors will have incompatible lengths.

# A utility for directly extracting estimates from a sienaFit object
# and copying these estimates to initial values in a sienaEffects object
# is the function transferEstimates contained in the utilities file
# on the "RSiena scripts" page of the Siena website,
# http://www.stats.ox.ac.uk/~snijders/siena/

# When unsatisfactory convergence was obtained, the first thing to do is
# to run siena07 repeatedly with useStdInits=FALSE,
# updating the initial values with the results of the last estimation
# as indicated here (usually prevAns is the easiest way), 
# and continuing until convergence is satisfactory,
# as indicated by the t-ratios for convergence all being less than
# a value of about 0.10. 

# Goodness of fit test
gofin  <- sienaGOF(ans1, IndegreeDistribution, verbose=TRUE, join=TRUE, varName="friendship")
plot(gofin)

gofout <- sienaGOF(ans1, OutdegreeDistribution, verbose=TRUE, join=TRUE, varName="friendship")
plot(gofout)

