import autograd.numpy as np
from . import optimizers 
from . import cost_functions
from . import normalizers
from . import kernels
from . import history_plotters

class Setup:
    def __init__(self,x,y,**kwargs):
        # link in data
        self.x = x
        self.y = y
        
        # make containers for all histories
        self.weight_histories = []
        self.train_cost_histories = []
        self.train_count_histories = []
        self.valid_cost_histories = []
        self.valid_count_histories = []
        
    #### split data into training and validation sets ####
    def make_train_valid_split(self,train_portion):
        # translate desired training portion into exact indecies
        r = np.random.permutation(self.x.shape[1])
        train_num = int(np.round(train_portion*len(r)))
        self.train_inds = r[:train_num]
        self.valid_inds = r[train_num:]
        
        # define training and validation sets
        self.x_train = self.x[:,self.train_inds]
        self.x_valid = self.x[:,self.valid_inds]
        
        self.y_train = self.y[:,self.train_inds]
        self.y_valid = self.y[:,self.valid_inds]   

    #### define normalizer ####
    def choose_normalizer(self,name):
        # produce normalizer / inverse normalizer
        s = normalizers.Setup(self.x_train,name)
        self.normalizer = s.normalizer
        self.inverse_normalizer = s.inverse_normalizer
        
        # normalize input 
        self.x_train = self.normalizer(self.x_train)
        self.x_valid = self.normalizer(self.x_valid)

        self.normalizer_name = name

    #### define feature transformation ####
    def choose_kernel(self,name,**kwargs):    
        # choose kernel type 
        self.transformer = kernels.Setup(name,**kwargs)
        self.H_train = self.transformer.kernel(self.x_train,self.x_train)

        # create evaluator for new points
        self.H = lambda x: self.transformer.kernel(self.x_train,x)
     
    #### define cost function ####
    def choose_cost(self,name,**kwargs):
        self.cost_name = name

        # create cost on entire dataset
        funcs = cost_functions.Setup(self.cost_name,self.H,**kwargs)
        
        # create cost with training data
        self.train_cost = lambda w,iter: funcs.train_cost(w,self.H_train,self.y_train,iter)
        self.valid_cost = funcs.valid_cost

        # if the cost function is a two-class classifier, build a counter too
        if self.cost_name == 'softmax':
            self.train_counter = lambda w: funcs.counting_cost(w,self.H_train,self.y_train)
            self.valid_counter = funcs.counting_cost_validation
        
        # define initializer
        P = np.size(self.y_train)
        scale = 0.1
        if 'scale' in kwargs:
            self.scale = kwargs['scale']
        dim = 1

        self.initializer = lambda: scale*np.random.randn(P + 1,dim)
            


    #### run optimization ####
    def fit(self,**kwargs):
        # basic parameters for gradient descent run (default algorithm)
        max_its = 500; alpha_choice = 10**(-1);
        self.w_init = self.initializer()
        if 'w_init' in kwargs:
            self.w_init = kwargs['w_init']

        name = 'gradient_descent'
        epsilon = 10**(-10)
        
        # set parameters by hand
        if 'max_its' in kwargs:
            self.max_its = kwargs['max_its']
        if 'alpha_choice' in kwargs:
            self.alpha_choice = kwargs['alpha_choice']
        if 'name' in kwargs:
            name = kwargs['name']
        if 'epsilon' in kwargs:
            epsilon = kwargs['epsilon']
            
        # batch size for gradient descent?
        self.num_pts = np.size(self.y_train)

        self.batch_size = np.size(self.y_train)
        if 'batch_size' in kwargs:
            self.batch_size = kwargs['batch_size']

        # optimize
        weight_history = []
        
        # run gradient descent
        if name == 'gradient_descent':
            weight_history,train_cost_history = optimizers.gradient_descent(self.train_cost,self.alpha_choice,self.max_its,self.w_init,self.num_pts,self.batch_size)
        
        if name == 'newtons_method':
            weight_history,train_cost_history = optimizers.newtons_method(self.train_cost,self.max_its,self.w_init,self.num_pts,self.batch_size,epsilon = epsilon)
                            
        # store all new histories
        self.weight_histories.append(weight_history)
        self.train_cost_histories.append(train_cost_history[0][-1])

        # compute valid history
        valid_cost_history = self.valid_cost(weight_history[-1],self.x_valid,self.y_valid)
        self.valid_cost_histories.append(valid_cost_history)

        # compute misclassification histories
        if self.cost_name == 'softmax':
            w = weight_history[-1]
            train_count = self.train_counter(w)
            valid_count = self.valid_counter(w,self.x_valid,self.y_valid)
            self.train_count_histories.append(train_count)
            self.valid_count_histories.append(valid_count)

    #### plot histories ###
    def show_histories(self,**kwargs):
        start = 0
        if 'start' in kwargs:
            start = kwargs['start']
        history_plotters.Setup(self.train_cost_histories,self.train_count_histories,self.valid_cost_histories,self.valid_count_histories,start)
  
    