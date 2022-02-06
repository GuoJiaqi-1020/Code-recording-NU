import autograd.numpy as np
from inspect import signature

class Setup:
    def __init__(self,name,**kwargs):
        ### make cost function choice ###
        # for regression
        if name == 'least_squares':
            self.cost = self.least_squares
        if name == 'least_absolute_deviations':
            self.cost = self.least_absolute_deviations
            
        # for two-class classification
        if name == 'softmax':
            self.cost = self.softmax
        if name == 'perceptron':
            self.cost = self.perceptron
            
        # for multiclass classification
        if name == 'multiclass_perceptron':
            self.cost = self.multiclass_perceptron
        if name == 'multiclass_softmax':
            self.cost = self.multiclass_softmax
    
    ###### cost functions #####
    # compute linear combination of input point
    def model(self,f,w):   
        a = w[0] + np.dot(f.T,w[1:])
        return a.T
    
    ###### regression costs #######
    # an implementation of the least squares cost function for linear regression
    def least_squares(self,w,H,y,iter):
        # get batch of points
        f_p = H[:,iter]
        y_p = y[:,iter]
        
        # compute cost
        cost = np.sum((self.model(f_p,w) - y_p)**2)
        return cost/float(np.size(y_p))

    # a compact least absolute deviations cost function
    def least_absolute_deviations(self,w,H,y,iter):
        # get batch of points
        f_p = H[:,iter]
        y_p = y[:,iter]
        
        # compute cost
        cost = np.sum(np.abs(self.model(f_p,w) - y_p))
        return cost/float(np.size(y_p))

    ###### two-class classification costs #######
    # the convex softmax cost function
    def softmax(self,w,H,y,iter):
        # get batch of points
        f_p = H[:,iter]
        y_p = y[:,iter]
        
        # compute cost over batch
        cost = np.sum(np.log(1 + np.exp(-y_p*self.model(f_p,w))))
        return cost/float(np.size(y_p))

    ###### multiclass classification costs #######
    # multiclass softmax
    def multiclass_softmax(self,w,H,y,iter):    
        # get batch of points
        f_p = H[:,iter]
        y_p = y[:,iter]

        # pre-compute predictions on all points
        all_evals = self.model(f_p,w)

        # compute softmax across data points
        a = np.log(np.sum(np.exp(all_evals),axis = 0)) 

        # compute cost in compact form using numpy broadcasting
        b = all_evals[y_p.astype(int).flatten(),np.arange(np.size(y_p))]
        cost = np.sum(a - b)

        # return average
        return cost/float(np.size(y_p))