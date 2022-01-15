### import basic libs ###
import autograd.numpy as np
import matplotlib.pyplot as plt
from matplotlib import gridspec
import copy
import time

### import custom libs ###
from . import optimizers 
from . import cost_functions
from . import normalizers

### animation libs ###
from mlrefined_libraries.JSAnimation_slider_only import IPython_display_slider_only
import matplotlib.animation as animation
from IPython.display import clear_output
import matplotlib.patches as mpatches

class Setup:
    def __init__(self,x,y,**kwargs):
        # link in data
        self.x_orig = x
        self.y_orig = y

    #### define normalizer ####
    def choose_normalizer(self,name):       
        # produce normalizer / inverse normalizer
        s = normalizers.Setup(self.x_orig,name)
        self.normalizer = s.normalizer
        self.inverse_normalizer = s.inverse_normalizer
        
        # normalize input 
        self.x = self.normalizer(self.x_orig)
        self.normalizer_name = name

        # normalize input 
        self.y = self.y_orig

    #### split data into training and validation sets ####
    def make_train_val_split(self,train_portion):
        # translate desired training portion into exact indecies
        self.train_portion = train_portion
        r = np.random.permutation(self.x.shape[1])
        train_num = int(np.round(train_portion*len(r)))
        self.train_inds = r[:train_num]
        self.valid_inds = r[train_num:]
        
        # define training and testing sets
        self.x_train = self.x[:,self.train_inds]
        self.x_valid = self.x[:,self.valid_inds]
        
        self.y_train = self.y[:,self.train_inds]
        self.y_valid = self.y[:,self.valid_inds]        
        
    #### define cost function ####
    def choose_cost(self,cost_name,reg_name,**kwargs):
        # create cost on entire dataset
        self.cost = cost_functions.Setup(cost_name,reg_name)
                
        # if the cost function is a two-class classifier, build a counter too
        if cost_name == 'softmax' or cost_name == 'perceptron':
            funcs = cost_functions.Setup('twoclass_counter',reg_name)
            self.counter = funcs.cost
            
        if cost_name == 'multiclass_softmax' or cost_name == 'multiclass_perceptron':
            funcs = cost_functions.Setup('multiclass_counter',reg_name)
            self.counter = funcs.cost
            
        self.cost_name = cost_name
        self.reg_name = reg_name
            
    #### setup optimization ####
    def choose_optimizer(self,optimizer_name,**kwargs):
        # general params for optimizers
        max_its = 500; 
        alpha_choice = 10**(-1);
        epsilon = 10**(-10)
        
        # set parameters by hand
        if 'max_its' in kwargs:
            max_its = kwargs['max_its']
        if 'alpha_choice' in kwargs:
            alpha_choice = kwargs['alpha_choice']
        if 'epsilon' in kwargs:
            epsilon = kwargs['epsilon']
            
        # batch size for gradient descent?
        self.w = 0.0*np.random.randn(self.x.shape[0] + 1,1)
        num_pts = np.size(self.y_train)
        batch_size = np.size(self.y_train)
        if 'batch_size' in kwargs:
            self.batch_size = kwargs['batch_size']
        
        # run gradient descent
        if optimizer_name == 'gradient_descent':
            self.optimizer = lambda cost,w,x,y: optimizers.gradient_descent(cost,w,x,y,alpha_choice,max_its,batch_size)
        
        if optimizer_name == 'newtons_method':
            self.optimizer = lambda cost,w,x,y: optimizers.newtons_method(cost,w,x,y,max_its,epsilon=epsilon)
       
    ### try-out various regularization params ###
    def tryout_lams(self,lams,**kwargs):
        # choose number of rounds
        self.lams = lams
        num_rounds = len(lams)

        # container for costs and weights 
        self.train_count_vals = []
        self.valid_count_vals = []
        self.weights = []
        
        # reset initialization
        self.w_init = 0.1*np.random.randn(self.x.shape[0] + 1,1)
            
        # loop over lams and try out each
        for i in range(num_rounds):     
            # print update
            #print ('running '  + str(i+1) + ' of ' + str(num_rounds) + ' rounds')
            
            # set lambda
            lam = self.lams[i]
            self.cost.set_lambda(lam)
        
            # load in current model
            w_hist,c_hist = self.optimizer(self.cost.cost,self.w_init,self.x_train,self.y_train)
            
            # determine smallest train cost value attained
            ind = np.argmin(c_hist)            
            weight = w_hist[ind]
            self.weights.append(weight)
            
            # compute train / valid misclassifications
            train_count = self.counter(weight,self.x_train,self.y_train)
            valid_count = self.counter(weight,self.x_valid,self.y_valid)

            self.train_count_vals.append(train_count)
            self.valid_count_vals.append(valid_count)   
 
        # determine best value of lamba from the above runs
        ind = np.argmin(self.valid_count_vals)
        self.best_lam = self.lams[ind]
        self.best_weights = self.weights[ind]
        
        #print ('runs complete!')
        #time.sleep(1.5)
        #clear_output()