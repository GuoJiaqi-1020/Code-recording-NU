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
        
    #### define normalizer ####
    def choose_normalizer(self,name):
        # produce normalizer / inverse normalizer
        s = normalizers.Setup(self.x,name)
        self.normalizer = s.normalizer
        self.inverse_normalizer = s.inverse_normalizer
        
        # normalize input 
        self.x = self.normalizer(self.x)
        self.normalizer_name = name
        
        # make a default train / valid split
        self.make_train_valid_split(train_portion = 1)
        
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
        
    #### define feature transformation ####
    def choose_kernel(self,name,**kwargs):
        # choose kernel type
        self.transformer = kernels.Setup(name,**kwargs)
        self.H_train = self.transformer.kernel(self.x_train,self.x_train)
        self.H = lambda x: self.transformer.kernel(self.x_train,x)

    #### define cost function ####
    def choose_cost(self,name,**kwargs):
        # create cost on entire dataset
        funcs = cost_functions.Setup(name,**kwargs)
        self.cost = funcs.cost
        
        # create cost with training data
        self.train_cost = lambda w,iter: self.cost(w,self.H_train,self.y_train,iter)
        self.model = lambda x,w: w[0] + np.dot(self.H(x),w[1:])
        
        # define initializer
        P = np.size(self.y)
        scale = 0.1
        if 'scale' in kwargs:
            self.scale = kwargs['scale']
        dim = 1
        if name == 'multiclass_softmax':
            dim = len(np.unique(self.y))
        self.initializer = lambda: scale*np.random.randn(P + 1,dim)
            
    #### run optimization ####
    def fit(self,**kwargs):
        # basic parameters for gradient descent run (default algorithm)
        max_its = 500; alpha_choice = 10**(-1);
        self.w_init = self.initializer()
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
        self.train_cost_histories.append(train_cost_history)
       # self.valid_cost_histories.append(valid_cost_history)
        
    #### plot histories ###
    def show_histories(self,**kwargs):
        start = 0
        if 'start' in kwargs:
            start = kwargs['start']
        history_plotters.Setup(self.train_cost_histories,self.train_count_histories,self.valid_cost_histories,self.valid_count_histories,start)
  
    