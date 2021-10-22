import autograd.numpy as np
from inspect import signature

class Setup:
    def __init__(self,name,H,**kwargs):
        self.H = H

        ### make cost function choice ###
        # for regression
        if name == 'least_squares':
            self.train_cost = self.least_squares
            self.valid_cost = self.least_squares_validation

        # for two-class classification
        if name == 'softmax':
            self.train_cost = self.softmax
            self.valid_cost = self.softmax_validation
            
        # add regularization parameter
        self.lam = 0
        if 'lam' in kwargs:
            self.lam = kwargs['lam']
    
    ###### models #####
    def validation_model(self,x,w):
        return w[0] + np.dot(self.H(x),w[1:])

    # compute linear combination of input point
    def model(self,f,w):   
        a = w[0] + np.dot(f.T,w[1:])
        return a.T
    
    # regularizer function
    def reg(self,f,w):   
        # first linear combination
        a = w[0] + np.dot(f.T,w[1:])
        
        # second linear combo
        b = w[0] + np.dot(w[1:].T,a)
        return self.lam*b
    
    ###### regression training costs #######
    # an implementation of the least squares cost function for linear regression
    def least_squares(self,w,H,y,iter):
        # get batch of points
        f_p = H[:,iter]
        y_p = y[:,iter]
        
        # compute cost
        cost = np.sum((self.model(f_p,w) - y_p)**2)
        
        # add regularizer
        if self.lam > 0:
            a = self.reg(f_p,w)
            cost += a
            
        return cost/y_p.size

    ###### two-class training classification costs #######
    # the convex softmax cost function
    def softmax(self,w,H,y,iter):
        # get batch of points
        f_p = H[:,iter]
        y_p = y[:,iter]
        
        # compute cost over batch
        cost = np.sum(np.log(1 + np.exp(-y_p*self.model(f_p,w))))
        
        # add regularizer
        if self.lam > 0:
            a = self.reg(f_p,w)
            cost += a
        return cost/y_p.size

    # twoclass counting cost
    def counting_cost(self,w,H,y):
        # make predictions
        y_predict = np.sign(self.model(H,w))
        
        # compare with actual labels
        num_misclass = len(np.argwhere(y != y_predict))
        return num_misclass 

    ###### validation costs #######
    def least_squares_validation(self,w,x,y):
        # compute cost
        cost = np.sum((self.validation_model(x,w)-y)**2)
        return cost/y.size

    def softmax_validation(self,w,x,y):        
        # compute cost over batch
        cost = np.sum(np.log(1 + np.exp(-y*self.validation_model(x,w))))
        return cost/y.size

    # twoclass counting cost
    def counting_cost_validation(self,w,x,y):
        # make predictions
        y_predict = np.sign(self.validation_model(x,w)).T
        
        # compare with actual labels
        num_misclass = len(np.argwhere(y != y_predict))
        return num_misclass 
