import autograd.numpy as np
import copy
import itertools

class Setup:
    def __init__(self,x,y,**kwargs):    
        # get desired degree
        self.D = kwargs['degree']
        self.N = x.shape[0]
        
        # all monomial terms degrees
        degs = np.array(list(itertools.product(list(np.arange(self.D+1)), repeat = self.N)))
        b = np.sum(degs,axis = 1)
        ind = np.argwhere(b <= self.D)
        ind = [v[0] for v in ind]
        degs = degs[ind,:]     
        self.degs = degs[1:,:]

        # define initializer
        self.num_classifiers = 1
        if 'num_classifiers' in kwargs:
            self.num_classifiers = kwargs['num_classifiers']
        self.scale = 0.1
        if 'scale' in kwargs:
            self.scale = kwargs['scale']

    # create initial weights for arbitrary feedforward network
    def initializer(self):
        w_init = self.scale*np.random.randn(2*len(self.degs),self.num_classifiers);
        return w_init
    
    # compute transformation on entire set of inputs
    def feature_transforms(self,x): 
        x2 = np.array([np.cos(d*x) for d in range(1,self.D)])
        x1 = np.array([np.sin(d*x) for d in range(0,self.D)])
        x1 = np.swapaxes(x1,0,1)[0,:,:]
        x2 = np.swapaxes(x2,0,1)[0,:,:]
        x_transformed = np.vstack((x1,x2))
        return x_transformed